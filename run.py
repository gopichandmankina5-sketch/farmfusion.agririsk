"""
AgriRisk - Root Runner
Helper script to check setup and provide instructions for running the application.
"""

import os
import sys
import subprocess

def check_python():
    print(f"Python: {sys.version}")

def check_packages():
    required = ['flask', 'flask_cors', 'pandas', 'numpy', 'sklearn', 'joblib']
    missing = []
    for pkg in required:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    if missing:
        print(f"⚠️  Missing packages: {', '.join(missing)}")
        print("   Run: pip install -r requirements.txt")
    else:
        print("✅ All Python packages found.")

def check_data():
    files = [
        "data/raw/weather.csv",
        "data/raw/soil.csv",
        "data/processed/risk_features.csv",
    ]
    for f in files:
        if os.path.exists(f):
            print(f"  ✅ {f}")
        else:
            print(f"  ❌ {f} — run: python data/generate_data.py")

def check_models():
    models = [
        "ml/models/risk_model.pkl",
        "ml/models/pest_model.pkl",
    ]
    for m in models:
        if os.path.exists(m):
            print(f"  ✅ {m}")
        else:
            print(f"  ❌ {m} — run: python -m ml.training.train_risk_model")

if __name__ == "__main__":
    print("=" * 55)
    print("  AgriRisk – Project Runner")
    print("=" * 55)

    check_python()
    print("\n📦 Python packages:")
    check_packages()
    print("\n📂 Data files:")
    check_data()
    print("\n🤖 ML models:")
    check_models()

    print("""
─────────────────────────────────────────────────────
SETUP INSTRUCTIONS
─────────────────────────────────────────────────────

Step 1 – Install Python dependencies:
  pip install -r requirements.txt

Step 2 – Generate datasets:
  python data/generate_data.py

Step 3 – Train ML models:
  python -m ml.training.train_risk_model
  python -m ml.training.train_pest_model
  python -m ml.training.train_yield_model
  python -m ml.training.train_market_model

Step 4 – Start the Flask backend:
  python app.py

Step 5 – In a new terminal, start the React frontend:
  cd frontend
  npm install
  npm run dev

Step 6 – Open browser at:
  http://localhost:5173

API available at:
  http://localhost:5000/api/health
─────────────────────────────────────────────────────
""")
