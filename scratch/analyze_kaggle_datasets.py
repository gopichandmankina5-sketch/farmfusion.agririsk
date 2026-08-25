import pandas as pd
import os
import glob

# Find datasets in kagglehub cache
base_dir = r"C:\Users\gopic\.cache\kagglehub\datasets"

paths = {
    "crop_yield": glob.glob(os.path.join(base_dir, "akshatgupta7", "crop-yield-in-indian-states-dataset", "**", "crop_yield.csv"), recursive=True),
    "crop_soil": glob.glob(os.path.join(base_dir, "shankarpriya2913", "crop-and-soil-dataset", "**", "data_core.csv"), recursive=True)
}

for name, matched_paths in paths.items():
    if not matched_paths:
        print(f"File not found for {name}")
        continue
    path = matched_paths[0]

    df = pd.read_csv(path)
    print(f"--- Dataset: {name} ---")
    print(f"Filename: {os.path.basename(path)}")
    print(f"Number of rows: {len(df)}")
    print(f"Columns: {list(df.columns)}")
    
    geo_cols = [c for c in df.columns if c.lower() in ['state', 'district', 'location', 'city', 'region', 'lat', 'lon', 'latitude', 'longitude']]
    print(f"Geographic granularity: {geo_cols if geo_cols else 'None'}")
    
    date_cols = [c for c in df.columns if 'year' in c.lower() or 'date' in c.lower() or 'season' in c.lower()]
    if date_cols:
        for c in date_cols:
            print(f"Date range ({c}): {df[c].min()} to {df[c].max()}")
    else:
        print("Date range: None")
        
    print("Missing values:")
    print(df.isnull().sum()[df.isnull().sum() > 0])
    
    print(f"Duplicate records: {df.duplicated().sum()}")
    print("\n")
