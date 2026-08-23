"""
AgriRisk - Backend Configuration
"""
import os
from dotenv import load_dotenv

load_dotenv(override=True)

class Config:
    # Flask
    DEBUG = os.environ.get("FLASK_DEBUG", "True") == "True"
    SECRET_KEY = os.environ.get("SECRET_KEY", "agri-risk-secret-2024")

    # CORS
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")

    # Paths
    BASE_DIR       = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_DIR       = os.path.join(BASE_DIR, "data")
    RAW_DATA_DIR   = os.path.join(DATA_DIR, "raw")
    PROC_DATA_DIR  = os.path.join(DATA_DIR, "processed")
    REGION_DIR     = os.path.join(DATA_DIR, "regional")
    MODELS_DIR     = os.path.join(BASE_DIR, "backend", "models")

    # Risk weights (must sum to 1.0)
    RISK_WEIGHTS = {
        "weather":    0.25,
        "pest":       0.20,
        "soil":       0.20,
        "market":     0.15,
        "production": 0.20,
    }

    # Risk thresholds
    RISK_LEVELS = {
        "LOW":      (0,  30),
        "MEDIUM":   (31, 60),
        "HIGH":     (61, 80),
        "CRITICAL": (81, 100),
    }
