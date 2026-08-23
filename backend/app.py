"""
AgriRisk - Flask Application Entry Point
"""

import os
import sys

# Ensure project root is on PYTHONPATH
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(ROOT))  # so `backend.*` imports resolve

from flask import Flask, jsonify
from flask_cors import CORS

from backend.config.config import Config
from backend.routes.risk_routes import risk_bp
from backend.routes.weather_routes import weather_bp
from backend.routes.regional_routes import regional_bp
from backend.routes.recommendation_routes import recommendation_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS – allow requests from the Vite dev server
    CORS(app, origins=Config.CORS_ORIGINS.split(","))

    # ── Blueprints ──────────────────────────────────────────────────────────
    app.register_blueprint(risk_bp,            url_prefix="/api/risk")
    app.register_blueprint(weather_bp,         url_prefix="/api/weather")
    app.register_blueprint(regional_bp,        url_prefix="/api/regional")
    app.register_blueprint(recommendation_bp,  url_prefix="/api/recommendations")

    # ── Health check ────────────────────────────────────────────────────────
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "ok",
            "service": "AgriRisk API",
            "version": "1.0.0",
        }), 200

    # ── Metadata endpoints ──────────────────────────────────────────────────
    @app.route("/api/meta/states", methods=["GET"])
    def meta_states():
        states_districts = {
            "Tamil Nadu":     ["Chennai","Madurai","Coimbatore","Salem","Tiruchirappalli",
                               "Tirunelveli","Vellore","Erode","Thoothukudi","Thanjavur"],
            "Maharashtra":    ["Mumbai","Pune","Nagpur","Nashik","Aurangabad",
                               "Solapur","Kolhapur","Amravati","Jalgaon","Latur"],
            "Punjab":         ["Amritsar","Ludhiana","Jalandhar","Patiala","Bathinda",
                               "Mohali","Firozpur","Gurdaspur","Hoshiarpur","Sangrur"],
            "Uttar Pradesh":  ["Lucknow","Kanpur","Agra","Varanasi","Prayagraj",
                               "Meerut","Ghaziabad","Bareilly","Aligarh","Moradabad"],
            "Rajasthan":      ["Jaipur","Jodhpur","Kota","Bikaner","Udaipur",
                               "Ajmer","Bhilwara","Alwar","Sikar","Bharatpur"],
            "West Bengal":    ["Kolkata","Darjeeling","Jalpaiguri","Murshidabad","Nadia",
                               "Howrah","Bardhaman","Bankura","Hooghly","Malda"],
            "Karnataka":      ["Bengaluru","Mysuru","Hubli","Mangaluru","Belagavi",
                               "Kalaburagi","Ballari","Vijayapura","Shivamogga","Tumakuru"],
            "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Tirupati","Nellore",
                               "Kurnool","Rajahmundry","Kadapa","Anantapur","Eluru"],
            "Madhya Pradesh": ["Bhopal","Indore","Gwalior","Jabalpur","Ujjain",
                               "Sagar","Rewa","Satna","Ratlam","Morena"],
            "Gujarat":        ["Ahmedabad","Surat","Vadodara","Rajkot","Gandhinagar",
                               "Bhavnagar","Jamnagar","Junagadh","Anand","Mehsana"],
        }
        return jsonify({"states_districts": states_districts}), 200

    @app.route("/api/meta/crops", methods=["GET"])
    def meta_crops():
        return jsonify({"crops": [
            "Rice","Wheat","Sugarcane","Cotton","Maize","Soybean","Groundnut",
            "Bajra","Jowar","Sunflower","Turmeric","Onion","Tomato","Potato","Mustard"
        ]}), 200

    @app.route("/api/meta/seasons", methods=["GET"])
    def meta_seasons():
        return jsonify({"seasons": ["Kharif","Rabi","Zaid"]}), 200

    # ── Error handlers ──────────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error", "detail": str(e)}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    print(f"\n🌱 AgriRisk API starting on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)
