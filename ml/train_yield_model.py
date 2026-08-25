"""
AgriRisk - Yield Risk Model Training
Predicts production/yield risk score (0–100).
"""

import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
# pyrefly: ignore [missing-import]
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

from backend.utils.feature_engineering import SEASON_ENC, CROP_BASE_YIELD
from backend.config.config import Config


def train():
    path = os.path.join(Config.PROC_DATA_DIR, "kaggle_yield.csv")
    df = pd.read_csv(path)

    df["season_enc"]  = df["Season"].map(SEASON_ENC).fillna(0)
    # Using existing CROP_BASE_YIELD mapping for crop representation
    df["base_yield"]  = df["Crop"].map(CROP_BASE_YIELD).fillna(2000)

    # Note: State is excluded as we want the model to learn from agronomical factors 
    # instead of over-fitting to state names.
    feat_cols = [
        "Area", "Annual_Rainfall", "Fertilizer", "Pesticide", "season_enc", "base_yield"
    ]

    X = df[feat_cols].fillna(0)
    y = df["Yield"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)

    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
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
