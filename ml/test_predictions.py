import os
import sys

# Set up path to load backend modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.prediction_service import (
    predict_risk_score, predict_market_risk, predict_pest_risk,
    predict_soil_risk, predict_yield_risk
)
from backend.utils.preprocessing import build_input_data

combinations = [
    {"state": "Andhra Pradesh", "district": "Anantapur", "crop": "Rice", "season": "Kharif"},
    {"state": "Andhra Pradesh", "district": "Anantapur", "crop": "Rice", "season": "Rabi"},
    {"state": "Punjab", "district": "Amritsar", "crop": "Rice", "season": "Kharif"},
    {"state": "Maharashtra", "district": "Nagpur", "crop": "Cotton", "season": "Kharif"},
    {"state": "Karnataka", "district": "Bengaluru", "crop": "Maize", "season": "Rabi"}
]

print("=========================================================================")
print("  EVALUATION SCRIPT FOR PREDICTION VARIATION")
print("=========================================================================")

for comb in combinations:
    state = comb["state"]
    district = comb["district"]
    crop = comb["crop"]
    season = comb["season"]
    
    print(f"\nEvaluating: {state} | {district} | {crop} | {season}")
    
    data = build_input_data(state, district, crop, season)
    
    overall = predict_risk_score(data)
    market = predict_market_risk(data)
    pest = predict_pest_risk(data)
    soil = predict_soil_risk(data)
    yield_risk = predict_yield_risk(data)
    
    risk_level = "LOW"
    if overall > 30: risk_level = "MEDIUM"
    if overall > 55: risk_level = "HIGH"
    if overall > 75: risk_level = "CRITICAL"
    
    print(f"  Pest Risk       : {pest:.2f}")
    print(f"  Soil Risk       : {soil:.2f}")
    print(f"  Market Risk     : {market:.2f}")
    print(f"  Production Risk : {yield_risk:.2f}")
    print(f"  OVERALL RISK    : {overall:.2f} ({risk_level})")
    
    # Print some input features to prove they vary
    print(f"  Inputs -> Pest Prob: {data.get('pest_probability', 0)}, Temp: {data.get('avg_temperature', 0)}, Supply: {data.get('avg_supply', 0)}, Demand: {data.get('avg_demand', 0)}")
