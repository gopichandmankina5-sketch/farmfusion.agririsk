"""
AgriRisk - Preprocessing Utilities
Handles data loading, cleaning, and merging for the ML pipeline.
"""

import os
import pandas as pd
import numpy as np
from backend.config.config import Config


# ── Loaders ───────────────────────────────────────────────────────────────────

def load_csv(filename: str, subdir: str = "raw") -> pd.DataFrame:
    """Load a CSV from the data directory, return empty DF on error."""
    path = os.path.join(Config.DATA_DIR, subdir, filename)
    try:
        return pd.read_csv(path)
    except FileNotFoundError:
        print(f"[WARN] {path} not found – returning empty DataFrame.")
        return pd.DataFrame()
    except Exception as e:
        print(f"[ERROR] loading {path}: {e}")
        return pd.DataFrame()


def load_weather()     -> pd.DataFrame: return load_csv("weather.csv")
def load_soil()        -> pd.DataFrame: return load_csv("soil.csv")
def load_pest()        -> pd.DataFrame: return load_csv("pest.csv")
def load_crop_yield()  -> pd.DataFrame: return load_csv("crop_yield.csv")
def load_market()      -> pd.DataFrame: return load_csv("market_prices.csv")
def load_district_risk() -> pd.DataFrame:
    return load_csv("district_risk.csv", subdir="regional")
def load_risk_features() -> pd.DataFrame:
    return load_csv("risk_features.csv", subdir="processed")


# ── Aggregators ───────────────────────────────────────────────────────────────

def get_weather_summary(state: str, district: str) -> dict:
    """Return aggregated weather metrics for a given district."""
    df = load_weather()
    if df.empty:
        return _default_weather()

    sub = df[(df["state"] == state) & (df["district"] == district)]
    if sub.empty:
        sub = df[df["state"] == state]
    if sub.empty:
        return _default_weather()

    return {
        "avg_temperature":       round(sub["temperature"].mean(), 1),
        "avg_rainfall":          round(sub["rainfall"].mean(), 1),
        "avg_humidity":          round(sub["humidity"].mean(), 1),
        "avg_wind_speed":        round(sub["wind_speed"].mean(), 1),
        "extreme_weather_days":  int(sub["extreme_weather"].sum()),
    }


def get_soil_data(state: str, district: str) -> dict:
    """Return soil metrics for a district."""
    df = load_soil()
    if df.empty:
        return _default_soil()

    row = df[(df["state"] == state) & (df["district"] == district)]
    if row.empty:
        row = df[df["state"] == state]
    if row.empty:
        return _default_soil()

    r = row.iloc[0]
    return {
        "soil_type":     str(r.get("soil_type", "Loamy")),
        "soil_ph":       float(r.get("soil_ph", 6.5)),
        "nitrogen":      float(r.get("nitrogen", 180)),
        "phosphorus":    float(r.get("phosphorus", 30)),
        "potassium":     float(r.get("potassium", 180)),
        "soil_moisture": float(r.get("soil_moisture", 45)),
    }


def get_pest_data(state: str, district: str, crop: str, season: str) -> dict:
    """Return pest and disease probabilities."""
    df = load_pest()
    if df.empty:
        return _default_pest()

    mask = ((df["state"] == state) & (df["district"] == district) &
            (df["crop"] == crop) & (df["season"] == season))
    row = df[mask]
    if row.empty:
        row = df[(df["state"] == state) & (df["crop"] == crop)]
    if row.empty:
        return _default_pest()

    r = row.iloc[0]
    return {
        "pest_type":          str(r.get("pest_type", "Unknown")),
        "disease_type":       str(r.get("disease_type", "Unknown")),
        "pest_probability":   float(r.get("pest_probability", 0.3)),
        "disease_probability": float(r.get("disease_probability", 0.2)),
    }


def get_yield_data(state: str, district: str, crop: str, season: str) -> dict:
    """Return historical yield info."""
    df = load_crop_yield()
    if df.empty:
        return _default_yield()

    mask = ((df["state"] == state) & (df["district"] == district) &
            (df["crop"] == crop) & (df["season"] == season))
    row = df[mask]
    if row.empty:
        row = df[(df["state"] == state) & (df["crop"] == crop)]
    if row.empty:
        return _default_yield()

    r = row.iloc[0]
    return {
        "area":        float(r.get("area", 1000)),
        "production":  float(r.get("production", 2000)),
        "yield":       float(r.get("yield", 2000)),
    }


def get_market_data(state: str, district: str, crop: str) -> dict:
    """Return aggregated market metrics."""
    df = load_market()
    if df.empty:
        return _default_market()

    mask = (df["state"] == state) & (df["district"] == district) & (df["crop"] == crop)
    sub = df[mask]
    if sub.empty:
        sub = df[(df["state"] == state) & (df["crop"] == crop)]
    if sub.empty:
        return _default_market()

    return {
        "avg_market_price": round(sub["market_price"].mean(), 1),
        "avg_demand":       round(sub["demand"].mean(), 3),
        "avg_supply":       round(sub["supply"].mean(), 3),
    }


# ── Defaults ──────────────────────────────────────────────────────────────────

def _default_weather():
    return {"avg_temperature": 28, "avg_rainfall": 60, "avg_humidity": 65,
            "avg_wind_speed": 8, "extreme_weather_days": 5}

def _default_soil():
    return {"soil_type": "Loamy", "soil_ph": 6.5, "nitrogen": 180,
            "phosphorus": 30, "potassium": 180, "soil_moisture": 45}

def _default_pest():
    return {"pest_type": "Unknown", "disease_type": "Unknown",
            "pest_probability": 0.3, "disease_probability": 0.2}

def _default_yield():
    return {"area": 1000, "production": 2000, "yield": 2000}

def _default_market():
    return {"avg_market_price": 2500, "avg_demand": 0.6, "avg_supply": 0.6}


# ── Master data builder ───────────────────────────────────────────────────────

def build_input_data(state: str, district: str, crop: str, season: str) -> dict:
    """
    Collect all relevant data for a given state/district/crop/season
    and return a flat dict ready for feature engineering and model inference.
    """
    from backend.services.weather_service import get_current_weather
    
    # Get live weather
    live_weather = get_current_weather(district, state)
    if not live_weather:
        weather = {
            "avg_temperature":       0,
            "avg_rainfall":          0,
            "avg_humidity":          0,
            "avg_wind_speed":        0,
            "extreme_weather_days":  0, 
            "weather_data":          None 
        }
    else:
        weather = {
            "avg_temperature":       live_weather.get("temperature", 28),
            "avg_rainfall":          live_weather.get("rainfall", 0),
            "avg_humidity":          live_weather.get("humidity", 65),
            "avg_wind_speed":        live_weather.get("wind_speed", 8),
            "extreme_weather_days":  0, 
            "weather_data":          live_weather 
        }

    soil    = get_soil_data(state, district)
    pest    = get_pest_data(state, district, crop, season)
    yld     = get_yield_data(state, district, crop, season)
    market  = get_market_data(state, district, crop)

    return {**weather, **soil, **pest, **yld, **market,
            "state": state, "district": district,
            "crop": crop, "season": season}
