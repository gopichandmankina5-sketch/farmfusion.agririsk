"""
AgriRisk - Yield Risk Model Training
Predicts production/yield risk score (0–100).
"""

import os, sys

import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

from backend.utils.feature_engineering import SEASON_ENC, CROP_BASE_YIELD
from backend.config.config import Config


def train():
    path = os.path.join(Config.PROC_DATA_DIR, "risk_features.csv")
    df = pd.read_csv(path)

    df["season_enc"]  = df["season"].map(SEASON_ENC).fillna(0)
    df["base_yield"]  = df["crop"].map(CROP_BASE_YIELD).fillna(2000)
    df["yield_ratio"] = (df["yield"] / df["base_yield"]).clip(0, 3)

    feat_cols = [
        "avg_temperature", "avg_rainfall", "soil_moisture", "nitrogen",
        "phosphorus", "potassium", "soil_ph", "pest_probability",
        "disease_probability", "yield_ratio", "season_enc",
    ]

    X = df[feat_cols].fillna(0)
    y = df["production_risk"].clip(0, 100)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=150, max_depth=8, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    rmse  = np.sqrt(mean_squared_error(y_test, preds))
    r2    = r2_score(y_test, preds)
    print(f"[Yield Model] RMSE={rmse:.3f}  R²={r2:.4f}")

    os.makedirs(Config.MODELS_DIR, exist_ok=True)
    save_path = os.path.join(Config.MODELS_DIR, "yield_model.pkl")
    joblib.dump({"model": model, "feature_columns": feat_cols}, save_path)
    print(f"✅ Yield model saved → {save_path}")


if __name__ == "__main__":
    train()
