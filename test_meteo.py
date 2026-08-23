import requests

try:
    # 1. Geocode
    geo_url = 'https://geocoding-api.open-meteo.com/v1/search?name=Madurai&count=1'
    geo_resp = requests.get(geo_url).json()
    lat = geo_resp['results'][0]['latitude']
    lon = geo_resp['results'][0]['longitude']
    
    # 2. Weather
    weather_url = f'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m'
    weather_resp = requests.get(weather_url).json()
    
    print('SUCCESS')
    print(weather_resp)
except Exception as e:
    print(f'ERROR: {e}')
