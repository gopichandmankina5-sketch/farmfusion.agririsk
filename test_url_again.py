import requests
url = 'https://api.openweathermap.org/data/2.5/weather?q=Madurai,Tamil Nadu,IN&appid=776237df1254b23763c71c93c7500ab1&units=metric'
try:
    resp = requests.get(url)
    print(resp.status_code)
    print(resp.text)
except Exception as e:
    print(e)
