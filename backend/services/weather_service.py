import os
import requests
from datetime import datetime, timezone, timedelta
from backend.config.config import Config

def get_current_weather(city: str, state: str, lat: float = None, lon: float = None) -> dict:
    """
    Fetch current weather from OpenWeatherMap API for a given city and state or lat/lon.
    1. Uses Geocoding API to resolve exact lat/lon if not provided.
    2. Uses Current Weather API to fetch precise live weather.
    3. Falls back to Open-Meteo if OWM fails.
    NO CACHING - always returns fresh data.
    """
    api_key = os.environ.get("OPENWEATHER_API_KEY")
    result = None

    if api_key and api_key != "your_api_key":
        try:
            resolved_name = city
            resolved_state = state
            
            # Step 1: Geocoding if lat/lon not provided
            if lat is None or lon is None:
                geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city},{state},IN&limit=1&appid={api_key}"
                geo_resp = requests.get(geo_url, timeout=10)
                
                if geo_resp.status_code == 200:
                    geo_data = geo_resp.json()
                    if geo_data and len(geo_data) > 0:
                        lat = geo_data[0]["lat"]
                        lon = geo_data[0]["lon"]
                        resolved_name = geo_data[0].get("name", city)
                        resolved_state = geo_data[0].get("state", state)
            
            if lat is not None and lon is not None:
                    
                    # Step 2: Weather
                    weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
                    w_resp = requests.get(weather_url, timeout=10)
                    
                    if w_resp.status_code == 200:
                        data = w_resp.json()
                        temp = data.get("main", {}).get("temp")
                        feels_like = data.get("main", {}).get("feels_like")
                        humidity = data.get("main", {}).get("humidity")
                        
                        wind_data = data.get("wind", {})
                        wind_speed_ms = wind_data.get("speed")
                        wind_speed_kmh = round(wind_speed_ms * 3.6, 1) if wind_speed_ms is not None else None
                        
                        rain_data = data.get("rain", {})
                        rainfall = rain_data.get("1h")
                        if rainfall is None:
                            rainfall = rain_data.get("3h")
                            
                        clouds = data.get("clouds", {}).get("all", 0)
                            
                        weather_arr = data.get("weather", [])
                        condition = weather_arr[0].get("main", "Unknown") if weather_arr else "Unknown"
                        description = weather_arr[0].get("description", "") if weather_arr else ""
                        
                        # Timestamp handling
                        dt = data.get("dt")
                        tz_offset = data.get("timezone", 0)
                        
                        if dt:
                            # Convert to local time based on timezone offset
                            local_time = datetime.fromtimestamp(dt, tz=timezone.utc) + timedelta(seconds=tz_offset)
                            time_str = local_time.strftime("%Y-%m-%d %H:%M:%S")
                        else:
                            time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                        result = {
                            "location": f"{resolved_name}, {resolved_state}",
                            "temperature": temp,
                            "feels_like": feels_like,
                            "humidity": humidity,
                            "rainfall": rainfall if rainfall is not None else 0.0,
                            "precipitation_probability": 0, # Current Weather API doesn't provide POP reliably
                            "wind_speed": wind_speed_kmh,
                            "clouds": clouds,
                            "condition": condition,
                            "description": description,
                            "latitude": lat,
                            "longitude": lon,
                            "timestamp": time_str,
                            "source": "openweathermap",
                            "source_type": "primary",
                            "is_fallback": False
                        }
        except Exception as e:
            print(f"[ERROR] OpenWeatherMap failed: {e}")
    
    # Fallback to Open-Meteo if OpenWeatherMap failed or key is invalid
    if not result:
        print("[INFO] Falling back to Open-Meteo Free API...")
        try:
            resolved_name = city
            if lat is None or lon is None:
                geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1"
                geo_resp = requests.get(geo_url, timeout=10).json()
                if "results" in geo_resp and len(geo_resp["results"]) > 0:
                    lat = geo_resp["results"][0]["latitude"]
                    lon = geo_resp["results"][0]["longitude"]
                    resolved_name = geo_resp["results"][0].get("name", city)
            
            if lat is not None and lon is not None:
                weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m,weather_code"
                weather_resp = requests.get(weather_url, timeout=10).json()
                current = weather_resp.get("current", {})
                
                w_code = current.get("weather_code", 0)
                if w_code <= 3:
                    cond = "Clear" if w_code == 0 else "Clouds"
                elif 51 <= w_code <= 67 or 80 <= w_code <= 82:
                    cond = "Rain"
                elif 71 <= w_code <= 77 or 85 <= w_code <= 86:
                    cond = "Snow"
                elif 95 <= w_code <= 99:
                    cond = "Thunderstorm"
                else:
                    cond = "Haze"
                
                # Open-Meteo time format is like "2023-10-15T15:00"
                om_time = current.get("time")
                if om_time:
                    try:
                        time_str = datetime.fromisoformat(om_time).strftime("%Y-%m-%d %H:%M:%S")
                    except:
                        time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                else:
                    time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                result = {
                    "location": f"{resolved_name}, {state}",
                    "temperature": current.get("temperature_2m", 0),
                    "feels_like": current.get("apparent_temperature", 0),
                    "humidity": current.get("relative_humidity_2m", 0),
                    "rainfall": current.get("rain", 0.0),
                    "precipitation_probability": 0,
                    "wind_speed": current.get("wind_speed_10m"),
                    "clouds": 0,
                    "condition": cond,
                    "description": "",
                    "latitude": lat,
                    "longitude": lon,
                    "timestamp": time_str,
                    "source": "open-meteo",
                    "source_type": "fallback",
                    "is_fallback": True
                }
        except Exception as e:
            print(f"[ERROR] Open-Meteo failed: {e}")
            return None

    return result
