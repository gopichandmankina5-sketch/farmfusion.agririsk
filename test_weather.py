import os
import requests
from dotenv import load_dotenv

load_dotenv(override=True)
api_key = os.environ.get('OPENWEATHER_API_KEY')
print(f'API KEY loaded: {api_key}')
url = f'https://api.openweathermap.org/data/2.5/weather?q=Madurai,Tamil Nadu,IN&appid={api_key}&units=metric'
try:
    resp = requests.get(url)
    print(f'Status: {resp.status_code}')
    print(f'Response: {resp.text}')
except Exception as e:
    print(e)
