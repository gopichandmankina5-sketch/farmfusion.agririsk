"""
AgriRisk - Recommendation Routes
GET /api/recommendations  – get recommendations for a given risk breakdown
"""

from flask import Blueprint, request, jsonify
from backend.services.recommendation_service import generate_recommendations

recommendation_bp = Blueprint("recommendations", __name__)


@recommendation_bp.route("", methods=["GET", "POST"])
def recommendations():
    """
    Return recommendations.
    Accepts optional query params: weather, pest, soil, market, production risk scores
    and risk_level.
    """
    if request.method == "POST":
        body = request.get_json(silent=True) or {}
    else:
        body = request.args.to_dict()

    breakdown = {
        "weather":    float(body.get("weather",    50)),
        "pest":       float(body.get("pest",       50)),
        "soil":       float(body.get("soil",       50)),
        "market":     float(body.get("market",     50)),
        "production": float(body.get("production", 50)),
    }
    risk_level = str(body.get("risk_level", "MEDIUM"))

    recs = generate_recommendations(breakdown, risk_level)
    return jsonify({"recommendations": recs}), 200
