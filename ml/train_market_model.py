"""
AgriRisk - Market Risk Model Training
Predicts market risk score (0–100).
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

from backend.utils.feature_engineering import CROP_BASE_PRICE
from backend.config.config import Config


def train():
    path = os.path.join(Config.PROC_DATA_DIR, "risk_features.csv")
    df = pd.read_csv(path)

    df["base_price"]  = df["crop"].map(CROP_BASE_PRICE).fillna(2500)
    df["price_ratio"] = (df["avg_market_price"] / df["base_price"]).clip(0, 5)

    feat_cols = [
        "avg_market_price", "avg_demand", "avg_supply", "price_ratio",
    ]

    X = df[feat_cols].fillna(0)
    y = df["market_risk"].clip(0, 100)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    rmse  = np.sqrt(mean_squared_error(y_test, preds))
    r2    = r2_score(y_test, preds)
    print(f"[Market Model] RMSE={rmse:.3f}  R²={r2:.4f}")

    os.makedirs(Config.MODELS_DIR, exist_ok=True)
    save_path = os.path.join(Config.MODELS_DIR, "market_model.pkl")
    joblib.dump({"model": model, "feature_columns": feat_cols}, save_path)
    print(f"✅ Market model saved → {save_path}")


if __name__ == "__main__":
    train()
