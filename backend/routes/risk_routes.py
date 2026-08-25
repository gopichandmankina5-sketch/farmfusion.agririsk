"""
AgriRisk - Risk Analysis Routes
POST /api/risk/analyze  – main analysis endpoint
GET  /api/risk/regional – regional risk summary
GET  /api/risk/factors  – top risk factors (aggregated)
"""

import os
import json
import re
from flask import Blueprint, request, jsonify
from backend.services.risk_service import analyze_risk
from backend.services.regional_service import get_regional_risk, get_state_risk_summary

risk_bp = Blueprint("risk", __name__)

def make_id(text):
    if not text: return ""
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')

# Dynamically load valid locations
VALID_LOCATIONS = {}
try:
    loc_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src", "data", "india_locations.json")
    with open(loc_path, "r", encoding="utf-8") as f:
        india_locs = json.load(f)
        for state_name, dists in india_locs.items():
            s_id = make_id(state_name.replace(" (UT)", ""))
            dist_map = {}
            for d in dists:
                if not d: continue
                d_name = d if isinstance(d, str) else d.get("name")
                dist_map[make_id(d_name)] = d_name
            VALID_LOCATIONS[s_id] = {
                "name": state_name,
                "district_map": dist_map
            }
except Exception as e:
    print("Warning: failed to load india_locations.json for validation:", e)

RAW_CROPS = [
    "Rice", "Wheat", "Sugarcane", "Cotton", "Maize", "Soybean", "Groundnut",
    "Bajra", "Jowar", "Sunflower", "Turmeric", "Onion", "Tomato", "Potato", "Mustard",
]
VALID_CROPS = {make_id(c): c for c in RAW_CROPS}

RAW_SEASONS = ["Kharif", "Rabi", "Zaid"]
VALID_SEASONS = {make_id(s): s for s in RAW_SEASONS}


@risk_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    Analyze agricultural risk for given location/crop/season.

    Request body:
      { "state": str, "district": str, "crop": str, "season": str }

    Response:
      { risk_score, risk_level, breakdown, factors, recommendations, trend, ... }
    """
    body = request.get_json(silent=True) or {}
    
    # Log the exact request payload as requested
    print("RISK ANALYSIS REQUEST:", body)

    state   = body.get("state", "").strip()
    district = body.get("district", "").strip()
    crop    = body.get("crop", "").strip()
    season  = body.get("season", "").strip()

    # Validation
    errors = []
    if not state:   errors.append("'state' is required")
    if not district: errors.append("'district' is required")
    if not crop:    errors.append("'crop' is required")
    if not season:  errors.append("'season' is required")

    # Validate against canonical IDs
    if state and state not in VALID_LOCATIONS:
        errors.append(f"Invalid state canonical ID: '{state}'")
    elif district and district not in VALID_LOCATIONS[state]["district_map"]:
        errors.append(f"District canonical ID '{district}' is not valid for state '{state}'")

    if crop and crop not in VALID_CROPS:
        errors.append(f"Invalid crop canonical ID: '{crop}'")

    if season and season not in VALID_SEASONS:
        errors.append(f"Invalid season canonical ID: '{season}'")

    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    # Convert back to Title Case canonical names expected by ML algorithms
    canonical_state = VALID_LOCATIONS[state]["name"]
    canonical_district = VALID_LOCATIONS[state]["district_map"][district]
    canonical_crop = VALID_CROPS[crop]
    canonical_season = VALID_SEASONS[season]

    try:
        # Pass ML-expected names to analyze_risk
        result = analyze_risk(canonical_state, canonical_district, canonical_crop, canonical_season)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Analysis failed", "detail": str(e)}), 500


@risk_bp.route("/simulate", methods=["POST"])
def simulate():
    """
    Decision Simulator endpoint.
    Accepts current and scenario context. Returns comparison.
    """
    body = request.get_json(silent=True) or {}
    current = body.get("current", {})
    scenario = body.get("scenario", {})
    
    # 1. Run baseline
    curr_state = current.get("state", "").strip()
    curr_district = current.get("district", "").strip()
    curr_crop = current.get("crop", "").strip()
    curr_season = current.get("season", "").strip()
    
    if not all([curr_state, curr_district, curr_crop, curr_season]):
        return jsonify({"error": "Current context missing required fields"}), 400
        
    canon_curr_state = VALID_LOCATIONS.get(curr_state, {}).get("name", curr_state)
    canon_curr_district = VALID_LOCATIONS.get(curr_state, {}).get("district_map", {}).get(curr_district, curr_district)
    canon_curr_crop = VALID_CROPS.get(curr_crop, curr_crop)
    canon_curr_season = VALID_SEASONS.get(curr_season, curr_season)
    
    curr_res = analyze_risk(canon_curr_state, canon_curr_district, canon_curr_crop, canon_curr_season)
    
    # 2. Run scenario
    scen_state = scenario.get("state", curr_state).strip()
    scen_district = scenario.get("district", curr_district).strip()
    scen_crop = scenario.get("crop", curr_crop).strip()
    scen_season = scenario.get("season", curr_season).strip()
    
    canon_scen_state = VALID_LOCATIONS.get(scen_state, {}).get("name", scen_state)
    canon_scen_district = VALID_LOCATIONS.get(scen_state, {}).get("district_map", {}).get(scen_district, scen_district)
    canon_scen_crop = VALID_CROPS.get(scen_crop, scen_crop)
    canon_scen_season = VALID_SEASONS.get(scen_season, scen_season)
    
    overrides = scenario.get("overrides", {})
    
    scen_res = analyze_risk(canon_scen_state, canon_scen_district, canon_scen_crop, canon_scen_season, overrides=overrides)
    
    # 3. Calculate differences
    comparison = {
        "overall": {
            "current": curr_res["risk_score"],
            "scenario": scen_res["risk_score"],
            "change": round(scen_res["risk_score"] - curr_res["risk_score"], 1),
            "direction": "improved" if scen_res["risk_score"] < curr_res["risk_score"] else ("worsened" if scen_res["risk_score"] > curr_res["risk_score"] else "unchanged")
        }
    }
    
    # Component breakdown differences
    for key in ["weather", "pest", "soil", "market", "production"]:
        c_val = curr_res["breakdown"].get(key, 0)
        s_val = scen_res["breakdown"].get(key, 0)
        comparison[key] = {
            "current": c_val,
            "scenario": s_val,
            "change": round(s_val - c_val, 1)
        }
        
    # Programmatic Insights
    insights = []
    if comparison["overall"]["change"] < -2:
        insights.append(f"Your simulated scenario reduces overall predicted risk by {abs(comparison['overall']['change'])} points.")
    elif comparison["overall"]["change"] > 2:
        insights.append(f"Warning: Your simulated scenario increases overall predicted risk by {comparison['overall']['change']} points.")
    else:
        insights.append("Your simulated scenario results in minimal overall risk change.")
        
    improvements = []
    worsenings = []
    for k, v in comparison.items():
        if k == "overall": continue
        if v["change"] <= -5: improvements.append(f"{k} risk")
        if v["change"] >= 5: worsenings.append(f"{k} risk")
        
    if improvements:
        insights.append(f"Most of the improvement comes from lower {', '.join(improvements)}.")
    if worsenings:
        insights.append(f"However, the changes increase {', '.join(worsenings)}.")
        
    if not improvements and not worsenings and comparison["overall"]["change"] == 0:
        insights.append("The selected variables had negligible impact on the model prediction.")
    
    return jsonify({
        "current": curr_res,
        "scenario": scen_res,
        "comparison": comparison,
        "insights": insights
    }), 200


@risk_bp.route("/regional", methods=["GET"])
def regional():
    """Return district-level risk data for the map."""
    try:
        state = request.args.get("state")
        from backend.services.regional_service import get_district_risk
        data = get_district_risk(state) if state else get_regional_risk()
        return jsonify({"data": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@risk_bp.route("/factors", methods=["GET"])
def top_factors():
    """Return aggregated top risk factors across all regions."""
    factors = [
        {"name": "Rainfall Variability",   "impact": 24, "category": "weather"},
        {"name": "High Pest Incidence",    "impact": 19, "category": "pest"},
        {"name": "Soil Nutrient Deficit",  "impact": 16, "category": "soil"},
        {"name": "Market Price Volatility","impact": 13, "category": "market"},
        {"name": "Heat Stress",            "impact": 11, "category": "weather"},
        {"name": "Low Soil Moisture",      "impact":  9, "category": "soil"},
        {"name": "Supply Glut",            "impact":  8, "category": "market"},
    ]
    return jsonify({"factors": factors}), 200
