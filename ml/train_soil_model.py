"""
AgriRisk - Soil Nutrient Model Training
Predicts Nitrogen, Potassium, and Phosphorous levels based on crop and weather conditions.
"""

import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

from backend.utils.feature_engineering import CROP_BASE_YIELD
from backend.config.config import Config

def train():
    path = os.path.join(Config.PROC_DATA_DIR, "kaggle_soil.csv")
    df = pd.read_csv(path)

    # Use the crop map to get a numerical proxy for crop type
    df["crop_proxy"] = df["Crop Type"].map(CROP_BASE_YIELD).fillna(2000)

    feat_cols = ["Temparature", "Humidity", "Moisture", "crop_proxy"]
    target_cols = ["Nitrogen", "Potassium", "Phosphorous"]

    X = df[feat_cols].fillna(0)
    y = df[target_cols].fillna(0)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)

    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    
    # Calculate metrics for each target
    for i, target in enumerate(target_cols):
        rmse = np.sqrt(mean_squared_error(y_test.iloc[:, i], preds[:, i]))
        r2 = r2_score(y_test.iloc[:, i], preds[:, i])
        print(f"[Soil Model - {target}] RMSE={rmse:.3f}  R2={r2:.4f}")

    os.makedirs(Config.MODELS_DIR, exist_ok=True)
    save_path = os.path.join(Config.MODELS_DIR, "soil_model.pkl")
    joblib.dump({"model": model, "feature_columns": feat_cols}, save_path)
    print(f"Soil model saved -> {save_path}")


if __name__ == "__main__":
    train()
