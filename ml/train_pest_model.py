"""
AgriRisk - Pest Risk Model Training
Predicts pest risk probability (0–1) → scaled to 0–100.
"""

import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

from backend.utils.feature_engineering import SEASON_ENC
from backend.config.config import Config


def train():
    path = os.path.join(Config.PROC_DATA_DIR, "risk_features.csv")
    df = pd.read_csv(path)

    df["season_enc"] = df["season"].map(SEASON_ENC).fillna(0)
    feat_cols = [
        "avg_temperature", "avg_rainfall", "avg_humidity", "avg_wind_speed",
        "extreme_weather_days", "soil_moisture", "pest_probability",
        "disease_probability", "season_enc",
    ]

    X = df[feat_cols].fillna(0)
    y = df["pest_risk"].clip(0, 100)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=150, max_depth=8, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    rmse  = np.sqrt(mean_squared_error(y_test, preds))
    r2    = r2_score(y_test, preds)
    print(f"[Pest Model] RMSE={rmse:.3f}  R²={r2:.4f}")

    os.makedirs(Config.MODELS_DIR, exist_ok=True)
    save_path = os.path.join(Config.MODELS_DIR, "pest_model.pkl")
    joblib.dump({"model": model, "feature_columns": feat_cols}, save_path)
    print(f"✅ Pest model saved → {save_path}")


if __name__ == "__main__":
    train()
