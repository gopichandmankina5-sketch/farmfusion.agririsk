import pandas as pd
import os

path = r"C:\Users\gopic\Downloads\india_traffic_weather_dataset_10000.csv"

if not os.path.exists(path):
    print(f"File not found: {path}")
else:
    df = pd.read_csv(path)
    print(f"Dataset Name: {os.path.basename(path)}")
    print(f"All Columns: {list(df.columns)}")
    print(f"Number of Records: {len(df)}")
    
    if "weather_condition" in df.columns:
        print(f"Unique Weather Conditions: {df['weather_condition'].unique().tolist()}")
        
    print("\nTarget Candidates Inspection:")
    print("- Does it have authentic risk labels? No.")
    print("- Does it have agricultural outcomes? No. (Columns relate to traffic, visibility, speed)")
    print("- Does it have dates? No. (Only 'hour' and 'day_type')")
    
    geo_cols = [c for c in df.columns if c.lower() in ['city', 'state', 'district', 'location']]
    print(f"Geographic Coverage: {geo_cols} (Contains {df['city'].nunique()} cities, e.g., {df['city'].unique()[:5].tolist()})")
