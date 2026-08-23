"""
AgriRisk - Regional Routes
GET /api/regional         – all regions
GET /api/regional/states  – state-level summary
GET /api/regional/<state> – districts in a state
"""

from flask import Blueprint, request, jsonify
from backend.services.regional_service import (
    get_regional_risk, get_state_risk_summary, get_district_risk
)

regional_bp = Blueprint("regional", __name__)


@regional_bp.route("", methods=["GET"])
def all_regional():
    try:
        return jsonify({"data": get_regional_risk()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@regional_bp.route("/states", methods=["GET"])
def state_summary():
    try:
        return jsonify({"data": get_state_risk_summary()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@regional_bp.route("/<state>", methods=["GET"])
def districts_in_state(state: str):
    try:
        data = get_district_risk(state.replace("-", " ").title())
        return jsonify({"state": state, "data": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
