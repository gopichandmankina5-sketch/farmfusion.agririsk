"""
AgriRisk - Risk Service
Orchestrates data collection, ML prediction, and risk breakdown assembly.
"""

from backend.utils.preprocessing import build_input_data
from backend.utils.feature_engineering import engineer_features
from backend.utils.risk_calculator import (
    calc_weather_risk, calc_pest_risk, calc_soil_risk,
    calc_market_risk, calc_production_risk, calc_overall_risk,
    classify_risk, extract_factors
)
from backend.services.prediction_service import (
    predict_risk_score, predict_pest_risk, predict_soil_risk, predict_yield_risk, predict_market_risk
)
from backend.services.recommendation_service import generate_recommendations
from backend.utils.feature_engineering import CROP_BASE_YIELD, CROP_BASE_PRICE


def analyze_risk(state: str, district: str, crop: str, season: str, overrides: dict = None) -> dict:
    """
    Master risk analysis function.
    1. Collects all data for the given inputs
    2. Applies any simulation overrides
    3. Engineers features
    4. Computes individual risk components (rule-based)
    5. Refines with ML models where available
    6. Combines into weighted overall score
    7. Extracts contributing factors and recommendations
    """
    # Step 1: Collect raw data
    raw = build_input_data(state, district, crop, season)

    # Step 2: Apply simulation overrides (Decision Simulator feature)
    if overrides:
        for key, value in overrides.items():
            if value is not None:
                raw[key] = value

    # Step 3: Engineer features
    data = engineer_features(raw.copy())

    # Step 3: Compute component risks (rule-based, deterministic)
    w_risk  = calc_weather_risk(data["avg_temperature"], data["avg_rainfall"],
                                 data["avg_humidity"], data["avg_wind_speed"],
                                 data["extreme_weather_days"])

    pe_risk = predict_pest_risk(data)

    s_risk  = predict_soil_risk(data)

    base_price = CROP_BASE_PRICE.get(crop, 2500)
    m_risk  = predict_market_risk(data)

    base_yield = CROP_BASE_YIELD.get(crop, 2000)
    pr_risk = predict_yield_risk(data)

    # Step 4: Weighted overall risk (ML or rule-based)
    overall = calc_overall_risk(w_risk, pe_risk, s_risk, m_risk, pr_risk)

    # Note: ML-refined prediction (predict_risk_score) removed per user constraints (no fake target labels)
    # The overall risk score will be purely deterministic/rule-based based on the component risks.

    # Step 5: Factors
    factors = extract_factors(
        overall["breakdown"],
        weather_data={
            "avg_temperature":    data["avg_temperature"],
            "avg_rainfall":       data["avg_rainfall"],
            "extreme_weather_days": data["extreme_weather_days"],
        },
        soil_data={
            "soil_ph":       data["soil_ph"],
            "nitrogen":      data["nitrogen"],
            "soil_moisture": data["soil_moisture"],
        }
    )

    # Step 6: Recommendations
    recs = generate_recommendations(overall["breakdown"], overall["risk_level"])

    # Step 7: Historical risk trend (synthetic 6-month)
    import random, math
    base_score = overall["risk_score"]
    trend = []
    months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"]
    for i, m in enumerate(months):
        variation = math.sin(i * 0.8) * 8 + random.uniform(-5, 5)
        trend.append({"month": m, "score": round(max(0, min(100, base_score + variation - 10 + i * 2)), 1)})

    return {
        "state": state, "district": district, "crop": crop, "season": season,
        "risk_score":   overall["risk_score"],
        "risk_level":   overall["risk_level"],
        "breakdown":    overall["breakdown"],
        "factors":      factors,
        "recommendations": recs,
        "trend":        trend,
        "weather_data": data.get("weather_data", {
            "temperature": data["avg_temperature"],
            "rainfall":    data["avg_rainfall"],
            "humidity":    data["avg_humidity"],
            "wind_speed":  data["avg_wind_speed"],
            "extreme_days": data["extreme_weather_days"],
        }),
        "soil_data": {
            "type":     data["soil_type"],
            "ph":       data["soil_ph"],
            "nitrogen": data["nitrogen"],
            "phosphorus": data["phosphorus"],
            "potassium":  data["potassium"],
            "moisture":   data["soil_moisture"],
        },
        "pest_data": {
            "pest_type":          data["pest_type"],
            "disease_type":       data["disease_type"],
            "pest_probability":   round(data["pest_probability"] * 100, 1),
            "disease_probability": round(data["disease_probability"] * 100, 1),
        },
        "market_data": {
            "price":  data["avg_market_price"],
            "demand": data["avg_demand"],
            "supply": data["avg_supply"],
        }
    }
