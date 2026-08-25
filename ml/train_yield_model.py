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
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

from backend.utils.feature_engineering import SEASON_ENC, CROP_BASE_YIELD
from backend.config.config import Config


def train():
    path = os.path.join(Config.PROC_DATA_DIR, "risk_features.csv")
    df = pd.read_csv(path)

    num_cols = ["yield", "base_yield_kgha", "yield_ratio", "area", "production"]
    cat_cols = ["state", "district", "crop", "season"]

    feat_cols = num_cols + cat_cols
    
    X = df[feat_cols].copy()
    for c in num_cols:
        X[c] = X[c].fillna(0)
    for c in cat_cols:
        X[c] = X[c].fillna("Unknown").astype(str)

    y = df["production_risk"].clip(0, 100)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore'), cat_cols)
        ]
    )

    model = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1))
    ])

    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    rmse  = np.sqrt(mean_squared_error(y_test, preds))
    r2    = r2_score(y_test, preds)
    print(f"[Yield Model] RMSE={rmse:.3f}  R²={r2:.4f}")

    os.makedirs(Config.MODELS_DIR, exist_ok=True)
    save_path = os.path.join(Config.MODELS_DIR, "yield_model.pkl")
    joblib.dump({"model": model, "feature_columns": feat_cols}, save_path)
    print(f"[SUCCESS] Yield model saved -> {save_path}")


if __name__ == "__main__":
    train()
