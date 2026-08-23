"""
AgriRisk - Feature Engineering
Transforms raw aggregated data into model-ready numeric features.
"""

import numpy as np

# Crop-to-baseline-yield mapping (kg/ha)
CROP_BASE_YIELD = {
    "Rice": 2800, "Wheat": 3200, "Sugarcane": 65000, "Cotton": 450,
    "Maize": 2600, "Soybean": 1100, "Groundnut": 1500, "Bajra": 1000,
    "Jowar": 900,  "Sunflower": 900, "Turmeric": 6000, "Onion": 18000,
    "Tomato": 22000, "Potato": 20000, "Mustard": 1100,
}

CROP_BASE_PRICE = {
    "Rice": 2000, "Wheat": 2200, "Sugarcane": 300, "Cotton": 6000,
    "Maize": 1800, "Soybean": 4000, "Groundnut": 5500, "Bajra": 2000,
    "Jowar": 2800, "Sunflower": 5800, "Turmeric": 8500, "Onion": 1500,
    "Tomato": 1200, "Potato": 1000, "Mustard": 5600,
}

SEASON_ENC = {"Kharif": 0, "Rabi": 1, "Zaid": 2}

SOIL_ENC = {
    "Alluvial": 0, "Black": 1, "Red": 2, "Laterite": 3,
    "Desert": 4, "Sandy loam": 5, "Clay loam": 6, "Loamy": 7
}


def engineer_features(data: dict) -> dict:
    """
    Add derived features to the raw data dict.

    - yield_ratio: actual yield / expected baseline yield
    - price_ratio: market price / baseline crop price
    - npk_index: composite nutrient adequacy index (0–1)
    - ph_deviation: absolute deviation from ideal pH (6.5)
    - season_enc: encoded season integer
    - soil_enc: encoded soil type integer
    """
    crop   = data.get("crop", "Rice")
    season = data.get("season", "Kharif")

    # Yield ratio
    base_yield = CROP_BASE_YIELD.get(crop, 2000)
    actual_yield = data.get("yield", base_yield)
    data["yield_ratio"]    = round(actual_yield / base_yield, 3) if base_yield else 1.0
    data["base_yield"]     = base_yield

    # Price ratio
    base_price  = CROP_BASE_PRICE.get(crop, 2500)
    market_price = data.get("avg_market_price", base_price)
    data["price_ratio"]  = round(market_price / base_price, 3) if base_price else 1.0
    data["base_price"]   = base_price

    # NPK composite index (0–1; higher = healthier soil)
    n = data.get("nitrogen", 180)
    p = data.get("phosphorus", 30)
    k = data.get("potassium", 180)
    data["npk_index"] = round(
        (min(1.0, n/300) * 0.4 + min(1.0, p/50) * 0.3 + min(1.0, k/250) * 0.3), 3
    )

    # pH deviation from ideal 6.5
    data["ph_deviation"] = round(abs(data.get("soil_ph", 6.5) - 6.5), 3)

    # Encodings
    data["season_enc"] = SEASON_ENC.get(season, 0)
    data["soil_enc"]   = SOIL_ENC.get(data.get("soil_type", "Loamy"), 7)

    return data


def get_feature_vector(data: dict) -> np.ndarray:
    """
    Extract the numeric feature vector in the exact column order used during training.
    This MUST match the column order in ml/train_risk_model.py.
    """
    data = engineer_features(data)
    features = [
        data.get("avg_temperature",       28.0),
        data.get("avg_rainfall",           60.0),
        data.get("avg_humidity",           65.0),
        data.get("avg_wind_speed",          8.0),
        data.get("extreme_weather_days",    5.0),
        data.get("soil_ph",                 6.5),
        data.get("nitrogen",              180.0),
        data.get("phosphorus",             30.0),
        data.get("potassium",             180.0),
        data.get("soil_moisture",          45.0),
        data.get("pest_probability",        0.3),
        data.get("disease_probability",     0.2),
        data.get("yield",                2000.0),
        data.get("avg_market_price",     2500.0),
        data.get("avg_demand",              0.6),
        data.get("avg_supply",              0.6),
        data.get("yield_ratio",             1.0),
        data.get("price_ratio",             1.0),
        data.get("npk_index",               0.7),
        data.get("ph_deviation",            0.0),
        data.get("season_enc",              0.0),
        data.get("soil_enc",                7.0),
    ]
    return np.array(features, dtype=np.float64).reshape(1, -1)


# Column names (for pandas DataFrames during training)
FEATURE_COLUMNS = [
    "avg_temperature", "avg_rainfall", "avg_humidity", "avg_wind_speed",
    "extreme_weather_days", "soil_ph", "nitrogen", "phosphorus", "potassium",
    "soil_moisture", "pest_probability", "disease_probability",
    "yield", "avg_market_price", "avg_demand", "avg_supply",
    "yield_ratio", "price_ratio", "npk_index", "ph_deviation",
    "season_enc", "soil_enc",
]
