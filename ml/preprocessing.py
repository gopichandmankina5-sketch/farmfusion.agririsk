"""
AgriRisk – STEP 2: ML Preprocessing
=====================================
Handles all data loading, cleaning, and validation before feature engineering.

Functions:
  load_risk_features()   – Load merged feature table
  validate_dataframe()   – Check for missing values / dtypes
  clean_dataframe()      – Impute / clip / cast
  split_features_target() – Separate X from y
"""

import os
import pandas as pd
import numpy as np
import sys

# Allow running from project root
from backend.config.config import Config


# ── Column definitions ────────────────────────────────────────────────────────

# Features that go INTO the ML model (must NOT include target or component risk scores)
NUMERIC_FEATURES = [
    # Weather
    "avg_temperature", "avg_rainfall", "avg_humidity", "avg_wind_speed",
    "max_temperature", "max_rainfall_day", "extreme_weather_days", "rain_std",
    # Soil
    "soil_ph", "nitrogen", "phosphorus", "potassium", "soil_moisture",
    # Pest
    "pest_probability", "disease_probability",
    # Yield
    "yield_ratio",
    # Market
    "price_cv", "avg_demand", "avg_supply", "demand_gap", "price_ratio",
    # Derived
    "ph_dev", "npk_index", "rain_per_temp",
]

CATEGORICAL_FEATURES = [
    "soil_type",   # Label/OHE
    "season",      # Ordinal: Kharif=0, Rabi=1, Zaid=2
    "crop",        # OHE or target-encoded
]

TARGET = "risk_score"

# Columns that should never be used as ML features
LEAKAGE_COLS = ["weather_risk","pest_risk","soil_risk","market_risk","production_risk","risk_level"]
META_COLS    = ["state","district","crop","season","soil_type",
                "area","production","yield","avg_market_price","price_std",
                "base_yield_kgha","base_price_ref"]


# ── Loaders ───────────────────────────────────────────────────────────────────

def load_risk_features(path: str = None) -> pd.DataFrame:
    if path is None:
        path = os.path.join(Config.PROC_DATA_DIR, "risk_features.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"risk_features.csv not found at {path}\n"
            "Run:  python data/generate_data.py"
        )
    df = pd.read_csv(path)
    print(f"[Preprocessing] Loaded {len(df):,} rows, {len(df.columns)} columns from {path}")
    return df


# ── Validation ────────────────────────────────────────────────────────────────

def validate_dataframe(df: pd.DataFrame) -> dict:
    """Return a validation report; raise if critical columns are missing."""
    required = NUMERIC_FEATURES + CATEGORICAL_FEATURES + [TARGET]
    missing_cols = [c for c in required if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")

    report = {
        "n_rows":         len(df),
        "n_cols":         len(df.columns),
        "null_counts":    df[required].isnull().sum().to_dict(),
        "target_min":     float(df[TARGET].min()),
        "target_max":     float(df[TARGET].max()),
        "target_mean":    float(df[TARGET].mean()),
        "target_std":     float(df[TARGET].std()),
        "duplicates":     int(df.duplicated().sum()),
        "risk_dist":      df["risk_level"].value_counts().to_dict() if "risk_level" in df.columns else {},
    }
    return report


# ── Cleaning ──────────────────────────────────────────────────────────────────

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Impute missing values, clip outliers, enforce dtypes.
    All transformations are transparent and reproducible.
    """
    df = df.copy()

    # ── Numeric imputation: fill NaN with column median ──────────────────────
    for col in NUMERIC_FEATURES:
        if col in df.columns:
            med = df[col].median()
            n_missing = df[col].isnull().sum()
            if n_missing:
                print(f"  [clean] '{col}': imputed {n_missing} nulls with median {med:.3f}")
            df[col] = df[col].fillna(med)

    # ── Categorical imputation: fill with mode ────────────────────────────────
    for col in CATEGORICAL_FEATURES:
        if col in df.columns:
            mode = df[col].mode()[0]
            n_missing = df[col].isnull().sum()
            if n_missing:
                print(f"  [clean] '{col}': imputed {n_missing} nulls with mode '{mode}'")
            df[col] = df[col].fillna(mode)

    # ── Target imputation: drop rows with missing target ─────────────────────
    before = len(df)
    df = df.dropna(subset=[TARGET])
    if len(df) < before:
        print(f"  [clean] Dropped {before - len(df)} rows with missing target")

    # ── Clip numeric outliers at [0.5th, 99.5th] percentile ──────────────────
    clip_cols = ["avg_rainfall","max_rainfall_day","rain_std",
                 "nitrogen","phosphorus","potassium","extreme_weather_days"]
    for col in clip_cols:
        if col in df.columns:
            lo = df[col].quantile(0.005)
            hi = df[col].quantile(0.995)
            df[col] = df[col].clip(lo, hi)

    # ── Target clip to [0, 100] ───────────────────────────────────────────────
    df[TARGET] = df[TARGET].clip(0, 100)

    # ── Drop known leakage columns ────────────────────────────────────────────
    leak_present = [c for c in LEAKAGE_COLS if c in df.columns]
    if leak_present:
        df = df.drop(columns=leak_present)

    return df.reset_index(drop=True)


# ── Feature / target split ────────────────────────────────────────────────────

def split_features_target(df: pd.DataFrame):
    """
    Return (X, y) where:
      X – DataFrame containing only NUMERIC_FEATURES + CATEGORICAL_FEATURES
      y – Series of risk_score (continuous 0–100)
    """
    feature_cols = [c for c in NUMERIC_FEATURES + CATEGORICAL_FEATURES if c in df.columns]
    X = df[feature_cols].copy()
    y = df[TARGET].copy()
    return X, y


# ── Quick sanity check when run directly ─────────────────────────────────────

if __name__ == "__main__":
    df = load_risk_features()
    report = validate_dataframe(df)
    print("\nValidation report:")
    for k, v in report.items():
        print(f"  {k}: {v}")
    df_clean = clean_dataframe(df)
    X, y = split_features_target(df_clean)
    print(f"\nFeature matrix X: {X.shape}")
    print(f"Target y: mean={y.mean():.2f}  std={y.std():.2f}  min={y.min():.2f}  max={y.max():.2f}")
    print(f"Numeric  features ({len(NUMERIC_FEATURES)}): {NUMERIC_FEATURES}")
    print(f"Categorical features ({len(CATEGORICAL_FEATURES)}): {CATEGORICAL_FEATURES}")
