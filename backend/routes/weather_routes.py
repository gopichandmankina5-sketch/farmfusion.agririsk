"""
AgriRisk - Weather Routes
GET /api/weather  – weather data for a district
"""

from flask import Blueprint, request, jsonify
from backend.services.weather_service import get_current_weather

weather_bp = Blueprint("weather", __name__)


@weather_bp.route("", methods=["GET"])
def get_weather():
    """
    Return weather summary for a city/state.
    Query params: city, state
    """
    city = request.args.get("city", request.args.get("district", "Madurai"))
    state = request.args.get("state", "Tamil Nadu")

    try:
        data = get_current_weather(city, state)
        if not data:
            return jsonify({"error": "Weather data unavailable"}), 503
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
