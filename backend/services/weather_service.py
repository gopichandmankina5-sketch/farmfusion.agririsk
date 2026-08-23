import os
import time
import requests
from backend.config.config import Config

_WEATHER_CACHE = {}
CACHE_TTL = 600  # 10 minutes in seconds

def get_current_weather(city: str, state: str) -> dict:
    """
    Fetch current weather from OpenWeatherMap API for a given city and state.
    Utilizes a 10-minute in-memory cache to reduce API calls.
    Falls back to Open-Meteo (Free API) if OpenWeatherMap is unavailable or returns 401.
    """
    cache_key = f"{city}-{state}".lower()
    
    if cache_key in _WEATHER_CACHE:
        entry = _WEATHER_CACHE[cache_key]
        if time.time() - entry["timestamp"] < CACHE_TTL:
            return entry["data"]
            
    api_key = os.environ.get("OPENWEATHER_API_KEY")
    result = None

    if api_key and api_key != "your_api_key":
        query = f"{city},{state},IN"
        url = f"https://api.openweathermap.org/data/2.5/weather?q={query}&appid={api_key}&units=metric"
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                temp = data.get("main", {}).get("temp")
                feels_like = data.get("main", {}).get("feels_like")
                humidity = data.get("main", {}).get("humidity")
                wind_data = data.get("wind", {})
                wind_speed_ms = wind_data.get("speed")
                if wind_speed_ms is not None:
                    wind_speed_kmh = round(wind_speed_ms * 3.6, 1)
                else:
                    wind_speed_kmh = None
                rainfall = data.get("rain", {}).get("1h")
                if rainfall is None:
                    rainfall = data.get("rain", {}).get("3h", 0)
                weather_arr = data.get("weather", [])
                condition = weather_arr[0].get("main", "Unknown") if weather_arr else "Unknown"
                description = weather_arr[0].get("description", "") if weather_arr else ""
                coord = data.get("coord", {})
                
                from datetime import datetime
                now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                result = {
                    "location": f"{city}, {state}, India",
                    "temperature": temp,
                    "feels_like": feels_like,
                    "humidity": humidity,
                    "rainfall": rainfall,
                    "precipitation_probability": None,
                    "wind_speed": wind_speed_kmh,
                    "condition": condition,
                    "description": description,
                    "latitude": coord.get("lat"),
                    "longitude": coord.get("lon"),
                    "timestamp": now_str,
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
            # 1. Geocode
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1"
            geo_resp = requests.get(geo_url, timeout=10).json()
            if "results" in geo_resp and len(geo_resp["results"]) > 0:
                lat = geo_resp["results"][0]["latitude"]
                lon = geo_resp["results"][0]["longitude"]
                
                # 2. Weather
                weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m,weather_code"
                weather_resp = requests.get(weather_url, timeout=10).json()
                current = weather_resp.get("current", {})
                
                # Map Open-Meteo weather code to standard condition string
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
                
                from datetime import datetime
                now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                result = {
                    "location": f"{city}, {state}, India",
                    "temperature": current.get("temperature_2m", 0),
                    "feels_like": current.get("apparent_temperature", 0),
                    "humidity": current.get("relative_humidity_2m", 0),
                    "rainfall": current.get("rain", 0),
                    "precipitation_probability": None,
                    "wind_speed": current.get("wind_speed_10m"),
                    "condition": cond,
                    "description": "",
                    "latitude": lat,
                    "longitude": lon,
                    "timestamp": now_str,
                    "source": "open-meteo",
                    "source_type": "fallback",
                    "is_fallback": True
                }
        except Exception as e:
            print(f"[ERROR] Open-Meteo failed: {e}")
            return None

    if result:
        _WEATHER_CACHE[cache_key] = {
            "timestamp": time.time(),
            "data": result
        }
        
    return result
