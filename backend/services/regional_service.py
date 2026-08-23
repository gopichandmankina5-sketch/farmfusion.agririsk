"""
AgriRisk - Regional Risk Service
Provides state and district level risk aggregations.
"""

import os
import pandas as pd
from backend.config.config import Config
from backend.utils.risk_calculator import classify_risk


def get_regional_risk() -> list:
    """Return district-level risk data for the map."""
    path = os.path.join(Config.REGION_DIR, "district_risk.csv")
    if not os.path.exists(path):
        return _generate_mock_regional()

    df = pd.read_csv(path)
    return df.to_dict(orient="records")


def get_state_risk_summary() -> list:
    """Aggregate regional data to state level."""
    records = get_regional_risk()
    if not records:
        return []

    df = pd.DataFrame(records)
    if df.empty:
        return []

    agg = df.groupby("state").agg(
        avg_risk_score=("avg_risk_score", "mean"),
        max_risk_score=("max_risk_score", "max"),
        district_count=("district", "count"),
    ).reset_index()
    agg["risk_level"] = agg["avg_risk_score"].apply(classify_risk)
    agg["avg_risk_score"] = agg["avg_risk_score"].round(1)
    return agg.to_dict(orient="records")


def get_district_risk(state: str) -> list:
    """Get risk data for all districts in a state."""
    records = get_regional_risk()
    return [r for r in records if r.get("state") == state]


def _generate_mock_regional() -> list:
    """Fallback mock data if CSV not found."""
    data = [
        {"state": "Tamil Nadu", "district": "Madurai",     "avg_risk_score": 72, "risk_level": "HIGH",     "dominant_crop": "Rice"},
        {"state": "Tamil Nadu", "district": "Coimbatore",  "avg_risk_score": 48, "risk_level": "MEDIUM",   "dominant_crop": "Cotton"},
        {"state": "Tamil Nadu", "district": "Thanjavur",   "avg_risk_score": 65, "risk_level": "HIGH",     "dominant_crop": "Rice"},
        {"state": "Maharashtra","district": "Pune",        "avg_risk_score": 38, "risk_level": "MEDIUM",   "dominant_crop": "Sugarcane"},
        {"state": "Maharashtra","district": "Nashik",      "avg_risk_score": 55, "risk_level": "MEDIUM",   "dominant_crop": "Onion"},
        {"state": "Punjab",     "district": "Ludhiana",    "avg_risk_score": 25, "risk_level": "LOW",      "dominant_crop": "Wheat"},
        {"state": "Rajasthan",  "district": "Jodhpur",     "avg_risk_score": 85, "risk_level": "CRITICAL", "dominant_crop": "Bajra"},
        {"state": "West Bengal","district": "Murshidabad", "avg_risk_score": 62, "risk_level": "HIGH",     "dominant_crop": "Rice"},
        {"state": "Karnataka",  "district": "Mysuru",      "avg_risk_score": 44, "risk_level": "MEDIUM",   "dominant_crop": "Sugarcane"},
        {"state": "Gujarat",    "district": "Rajkot",      "avg_risk_score": 58, "risk_level": "MEDIUM",   "dominant_crop": "Groundnut"},
    ]
    return data
