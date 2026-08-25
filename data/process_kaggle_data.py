import pandas as pd
import os
import glob
from sklearn.model_selection import train_test_split

def process_kaggle_data():
    base_dir = r"C:\Users\gopic\.cache\kagglehub\datasets"
    
    # 1. Process Yield Dataset
    yield_paths = glob.glob(os.path.join(base_dir, "akshatgupta7", "crop-yield-in-indian-states-dataset", "**", "crop_yield.csv"), recursive=True)
    if yield_paths:
        df_yield = pd.read_csv(yield_paths[0])
        # Columns: 'Crop', 'Crop_Year', 'Season', 'State', 'Area', 'Production', 'Annual_Rainfall', 'Fertilizer', 'Pesticide', 'Yield'
        
        # Clean string columns
        for col in ['Crop', 'Season', 'State']:
            df_yield[col] = df_yield[col].str.strip()
            
        # Select features for training
        features_yield = ['Crop', 'Season', 'State', 'Area', 'Annual_Rainfall', 'Fertilizer', 'Pesticide', 'Yield']
        df_yield = df_yield[features_yield].dropna()
        
        os.makedirs("processed", exist_ok=True)
        df_yield.to_csv("processed/kaggle_yield.csv", index=False)
        print(f"Processed Yield dataset: {len(df_yield)} rows saved to processed/kaggle_yield.csv")
    else:
        print("Yield dataset not found.")

    # 2. Process Soil Dataset
    soil_paths = glob.glob(os.path.join(base_dir, "shankarpriya2913", "crop-and-soil-dataset", "**", "data_core.csv"), recursive=True)
    if soil_paths:
        df_soil = pd.read_csv(soil_paths[0])
        # Columns: 'Temparature', 'Humidity', 'Moisture', 'Soil Type', 'Crop Type', 'Nitrogen', 'Potassium', 'Phosphorous', 'Fertilizer Name'
        
        for col in ['Soil Type', 'Crop Type']:
            df_soil[col] = df_soil[col].str.strip()
            
        # Target variables: Nitrogen, Potassium, Phosphorous
        features_soil = ['Temparature', 'Humidity', 'Moisture', 'Crop Type', 'Nitrogen', 'Potassium', 'Phosphorous']
        df_soil = df_soil[features_soil].dropna()
        
        os.makedirs("processed", exist_ok=True)
        df_soil.to_csv("processed/kaggle_soil.csv", index=False)
        print(f"Processed Soil dataset: {len(df_soil)} rows saved to processed/kaggle_soil.csv")
    else:
        print("Soil dataset not found.")

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    os.chdir(here)
    process_kaggle_data()
