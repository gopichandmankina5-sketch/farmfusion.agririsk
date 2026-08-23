"""
AgriRisk - Risk Analysis Routes
POST /api/risk/analyze  – main analysis endpoint
GET  /api/risk/regional – regional risk summary
GET  /api/risk/factors  – top risk factors (aggregated)
"""

from flask import Blueprint, request, jsonify
from backend.services.risk_service import analyze_risk
from backend.services.regional_service import get_regional_risk, get_state_risk_summary

risk_bp = Blueprint("risk", __name__)

VALID_STATES = [
    "Tamil Nadu", "Maharashtra", "Punjab", "Uttar Pradesh", "Rajasthan",
    "West Bengal", "Karnataka", "Andhra Pradesh", "Madhya Pradesh", "Gujarat",
]

VALID_CROPS = [
    "Rice", "Wheat", "Sugarcane", "Cotton", "Maize", "Soybean", "Groundnut",
    "Bajra", "Jowar", "Sunflower", "Turmeric", "Onion", "Tomato", "Potato", "Mustard",
]

VALID_SEASONS = ["Kharif", "Rabi", "Zaid"]


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
    if season and season not in VALID_SEASONS:
        errors.append(f"'season' must be one of: {VALID_SEASONS}")

    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    try:
        result = analyze_risk(state, district, crop, season)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Analysis failed", "detail": str(e)}), 500


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
