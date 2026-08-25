"""
AgriRisk - Prediction Service
Loads trained ML models and provides inference methods.
Models are loaded once at startup and cached in memory.
"""

import os
# pyrefly: ignore [missing-import]
import joblib
import numpy as np
import pandas as pd
from backend.config.config import Config
from backend.utils.feature_engineering import (
    get_feature_vector, FEATURE_COLUMNS, CROP_BASE_PRICE
)


class ModelCache:
    """Singleton cache for loaded models."""
    _models = {}

    @classmethod
    def get(cls, name: str):
        if name not in cls._models:
            path = os.path.join(Config.MODELS_DIR, f"{name}.pkl")
            if os.path.exists(path):
                cls._models[name] = joblib.load(path)
                print(f"[ModelCache] Loaded {name}.pkl")
            else:
                cls._models[name] = None
                print(f"[ModelCache] {name}.pkl not found – will use rule-based fallback")
        return cls._models[name]


# ── Risk Score Prediction ─────────────────────────────────────────────────────

def predict_risk_score(data: dict) -> float:
    """
    Predict overall risk score using the trained ML model.
    Falls back to rule-based calculation if model is unavailable.
    """
    bundle = ModelCache.get("risk_model")
    if bundle and "model" in bundle:
        # Use feature columns directly from the saved model artifact
        cols = bundle.get("feature_columns", [])
        X = pd.DataFrame([{c: float(data.get(c, 0)) if isinstance(data.get(c, 0), (int, float, np.number, bool)) else data.get(c, "") for c in cols}])
        score = float(bundle["model"].predict(X)[0])
        return round(max(0, min(100, score)), 1)

    # Rule-based fallback (mirrors training label logic)
    from backend.utils.risk_calculator import (
        calc_weather_risk, calc_pest_risk, calc_soil_risk,
        calc_market_risk, calc_production_risk, calc_overall_risk
    )
    from backend.utils.feature_engineering import CROP_BASE_YIELD
    w = calc_weather_risk(data["avg_temperature"], data["avg_rainfall"],
                          data["avg_humidity"], data["avg_wind_speed"],
                          data["extreme_weather_days"])
    pe = calc_pest_risk(data["pest_probability"], data["disease_probability"])
    s  = calc_soil_risk(data["soil_ph"], data["nitrogen"], data["phosphorus"],
                        data["potassium"], data["soil_moisture"])
    base = CROP_BASE_PRICE.get(data.get("crop","Rice"), 2500)
    m  = calc_market_risk(data["avg_market_price"], data["avg_demand"],
                          data["avg_supply"], base)
    base_y = CROP_BASE_YIELD.get(data.get("crop","Rice"), 2000)
    pr = calc_production_risk(data["yield"], base_y)

    result = calc_overall_risk(w, pe, s, m, pr)
    return result["risk_score"]


# ── Individual Component Predictions ─────────────────────────────────────────

def predict_pest_risk(data: dict) -> float:
    # Model deleted per user constraints; fallback only
    from backend.utils.risk_calculator import calc_pest_risk
    return calc_pest_risk(data.get("pest_probability", 0), data.get("disease_probability", 0))

def predict_soil_risk(data: dict) -> float:
    bundle = ModelCache.get("soil_model")
    from backend.utils.risk_calculator import calc_soil_risk
    if bundle and "model" in bundle:
        from backend.utils.feature_engineering import CROP_BASE_YIELD
        crop_proxy = CROP_BASE_YIELD.get(data.get("crop", "Rice"), 2000)
        data_to_pred = {
            "Temparature": data.get("avg_temperature", 28),
            "Humidity": data.get("avg_humidity", 65),
            "Moisture": data.get("soil_moisture", 45),
            "crop_proxy": crop_proxy
        }
        X = pd.DataFrame([data_to_pred])
        preds = bundle["model"].predict(X)[0] # Returns [Nitrogen, Potassium, Phosphorous]
        return calc_soil_risk(data.get("soil_ph", 6.5), float(preds[0]), float(preds[2]), float(preds[1]), float(data_to_pred["Moisture"]))
    
    return calc_soil_risk(data.get("soil_ph", 6.5), data.get("nitrogen", 100), data.get("phosphorus", 30), data.get("potassium", 100), data.get("soil_moisture", 45))

def predict_yield_risk(data: dict) -> float:
    bundle = ModelCache.get("yield_model")
    from backend.utils.risk_calculator import calc_production_risk
    from backend.utils.feature_engineering import CROP_BASE_YIELD
    base = CROP_BASE_YIELD.get(data.get("crop","Rice"), 2000)

    if bundle and "model" in bundle:
        data_to_pred = {
            "Area": data.get("area", 1000),
            "Annual_Rainfall": data.get("avg_rainfall", 50) * 365,
            "Fertilizer": data.get("nitrogen", 100) + data.get("phosphorus", 30) + data.get("potassium", 100),
            "Pesticide": data.get("pest_probability", 0.5) * 1000,
            "season_enc": data.get("season_enc", 0),
            "base_yield": base
        }
        X = pd.DataFrame([data_to_pred])
        predicted_yield = float(bundle["model"].predict(X)[0])
        return calc_production_risk(predicted_yield, base)
    
    return calc_production_risk(data.get("yield", 2000), base)

def predict_market_risk(data: dict) -> float:
    # Model deleted per user constraints; fallback only
    from backend.utils.risk_calculator import calc_market_risk
    from backend.utils.feature_engineering import CROP_BASE_PRICE
    base = CROP_BASE_PRICE.get(data.get("crop","Rice"), 2500)
    return calc_market_risk(data.get("avg_market_price", base), data.get("avg_demand", 0.5), data.get("avg_supply", 0.5), base)

