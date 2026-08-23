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
    lat_str = request.args.get("lat")
    lon_str = request.args.get("lon")
    
    lat = None
    lon = None
    if lat_str and lon_str:
        try:
            lat = float(lat_str)
            lon = float(lon_str)
        except ValueError:
            return jsonify({"success": false, "error": "Invalid coordinates"}), 400

    try:
        data = get_current_weather(city, state, lat=lat, lon=lon)
        if not data:
            return jsonify({"success": False, "error": "Live weather unavailable"}), 503
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Live weather unavailable"}), 500
