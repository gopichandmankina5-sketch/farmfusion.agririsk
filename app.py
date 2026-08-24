import os
import sys
from flask import Flask
from flask_cors import CORS
from backend.config.config import Config

from backend.routes.weather_routes import weather_bp
from backend.routes.risk_routes import risk_bp
from backend.routes.regional_routes import regional_bp
from backend.routes.recommendation_routes import recommendation_bp
from backend.routes.translation_routes import translation_bp

def create_app():
    # Fix console encoding for Windows emojis
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        
    app = Flask(__name__)
    CORS(app)
    
    app.register_blueprint(weather_bp, url_prefix='/api/weather')
    app.register_blueprint(risk_bp, url_prefix='/api/risk')
    app.register_blueprint(regional_bp, url_prefix='/api/regional')
    app.register_blueprint(recommendation_bp, url_prefix='/api/recommendations')
    app.register_blueprint(translation_bp, url_prefix='/api/translation')
    
    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\nAgriRisk API starting on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)
