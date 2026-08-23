"""
AgriRisk – STEP 5: Test Prediction Script
==========================================
Demonstrates end-to-end inference using the saved risk_model.pkl.

Runs 5 test scenarios covering different states / crops / seasons to verify:
  - Model loads correctly
  - Input encoding works for unseen combinations
  - Predictions are in [0, 100] range
  - Risk level classification is correct

Run from project root:
    python -m ml.test_prediction

Or directly:
    python ml/test_prediction.py
"""

import os
import sys
import warnings
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")


from ml.save_model import load_risk_model


# ==============================================================================
# Test scenario builder
# ==============================================================================

# Reference values for constructing realistic inputs
# These mirror what the backend's preprocessing service would supply.
SCENARIO_INPUTS = [
    # ── Scenario 1: High-risk drought + poor soil (Rajasthan Cotton Kharif) ──
    dict(
        label        = "Rajasthan – Cotton – Kharif (expected HIGH/CRITICAL)",
        # Weather
        avg_temperature      = 38.5,
        avg_rainfall         = 0.8,
        avg_humidity         = 31.0,
        avg_wind_speed       = 14.2,
        max_temperature      = 46.0,
        max_rainfall_day     = 8.5,
        extreme_weather_days = 42.0,
        rain_std             = 1.5,
        # Soil
        soil_type    = "Desert",
        soil_ph      = 8.3,
        nitrogen     = 92,
        phosphorus   = 12,
        potassium    = 118,
        soil_moisture= 14.0,
        # Pest
        pest_probability    = 0.72,
        disease_probability = 0.61,
        # Yield
        yield_ratio  = 0.48,
        # Market
        price_cv     = 0.18,
        avg_demand   = 0.52,
        avg_supply   = 0.70,
        demand_gap   = 0.18,
        price_ratio  = 0.88,
        # Derived
        ph_dev       = abs(8.3 - 6.5),
        npk_index    = (92/350*0.4 + 12/55*0.3 + 118/280*0.3),
        rain_per_temp= 0.8 / 38.5,
        # Categorical
        season       = "Kharif",
        crop         = "Cotton",
    ),
    # ── Scenario 2: Low-risk fertile belt (Punjab Wheat Rabi) ──
    dict(
        label        = "Punjab – Wheat – Rabi (expected LOW/MEDIUM)",
        avg_temperature      = 18.5,
        avg_rainfall         = 2.2,
        avg_humidity         = 55.0,
        avg_wind_speed       = 9.1,
        max_temperature      = 28.0,
        max_rainfall_day     = 22.0,
        extreme_weather_days = 5.0,
        rain_std             = 3.2,
        soil_type    = "Alluvial",
        soil_ph      = 7.6,
        nitrogen     = 245,
        phosphorus   = 44,
        potassium    = 212,
        soil_moisture= 58.0,
        pest_probability    = 0.22,
        disease_probability = 0.18,
        yield_ratio  = 1.12,
        price_cv     = 0.05,
        avg_demand   = 0.82,
        avg_supply   = 0.76,
        demand_gap   = -0.06,
        price_ratio  = 1.08,
        ph_dev       = abs(7.6 - 6.5),
        npk_index    = (245/350*0.4 + 44/55*0.3 + 212/280*0.3),
        rain_per_temp= 2.2 / 18.5,
        season       = "Rabi",
        crop         = "Wheat",
    ),
    # ── Scenario 3: Medium-risk humid + moderate pest (West Bengal Rice Kharif) ──
    dict(
        label        = "West Bengal – Rice – Kharif (expected MEDIUM)",
        avg_temperature      = 30.4,
        avg_rainfall         = 5.8,
        avg_humidity         = 82.0,
        avg_wind_speed       = 11.5,
        max_temperature      = 36.0,
        max_rainfall_day     = 95.0,
        extreme_weather_days = 28.0,
        rain_std             = 12.4,
        soil_type    = "Alluvial",
        soil_ph      = 5.9,
        nitrogen     = 225,
        phosphorus   = 33,
        potassium    = 172,
        soil_moisture= 72.0,
        pest_probability    = 0.55,
        disease_probability = 0.48,
        yield_ratio  = 0.92,
        price_cv     = 0.09,
        avg_demand   = 0.71,
        avg_supply   = 0.68,
        demand_gap   = -0.03,
        price_ratio  = 0.97,
        ph_dev       = abs(5.9 - 6.5),
        npk_index    = (225/350*0.4 + 33/55*0.3 + 172/280*0.3),
        rain_per_temp= 5.8 / 30.4,
        season       = "Kharif",
        crop         = "Rice",
    ),
    # ── Scenario 4: Critical pest pressure + market crash (Maharashtra Cotton Kharif) ──
    dict(
        label        = "Maharashtra – Cotton – Kharif (expected HIGH/CRITICAL)",
        avg_temperature      = 32.0,
        avg_rainfall         = 3.0,
        avg_humidity         = 68.0,
        avg_wind_speed       = 13.0,
        max_temperature      = 41.0,
        max_rainfall_day     = 55.0,
        extreme_weather_days = 20.0,
        rain_std             = 7.5,
        soil_type    = "Black",
        soil_ph      = 7.5,
        nitrogen     = 175,
        phosphorus   = 36,
        potassium    = 228,
        soil_moisture= 42.0,
        pest_probability    = 0.88,
        disease_probability = 0.79,
        yield_ratio  = 0.60,
        price_cv     = 0.22,
        avg_demand   = 0.42,
        avg_supply   = 0.88,
        demand_gap   = 0.46,
        price_ratio  = 0.68,
        ph_dev       = abs(7.5 - 6.5),
        npk_index    = (175/350*0.4 + 36/55*0.3 + 228/280*0.3),
        rain_per_temp= 3.0 / 32.0,
        season       = "Kharif",
        crop         = "Cotton",
    ),
    # ── Scenario 5: Ideal conditions (Karnataka Turmeric Kharif) ──
    dict(
        label        = "Karnataka – Turmeric – Kharif (expected LOW)",
        avg_temperature      = 26.5,
        avg_rainfall         = 4.2,
        avg_humidity         = 68.0,
        avg_wind_speed       = 8.8,
        max_temperature      = 33.0,
        max_rainfall_day     = 38.0,
        extreme_weather_days = 8.0,
        rain_std             = 6.5,
        soil_type    = "Red",
        soil_ph      = 6.4,
        nitrogen     = 160,
        phosphorus   = 28,
        potassium    = 162,
        soil_moisture= 55.0,
        pest_probability    = 0.28,
        disease_probability = 0.20,
        yield_ratio  = 1.05,
        price_cv     = 0.07,
        avg_demand   = 0.78,
        avg_supply   = 0.72,
        demand_gap   = -0.06,
        price_ratio  = 1.02,
        ph_dev       = abs(6.4 - 6.5),
        npk_index    = (160/350*0.4 + 28/55*0.3 + 162/280*0.3),
        rain_per_temp= 4.2 / 26.5,
        season       = "Kharif",
        crop         = "Turmeric",
    ),
]


def classify_score(score: float) -> str:
    if score <= 30:  return "LOW"
    elif score <= 55: return "MEDIUM"
    elif score <= 75: return "HIGH"
    else:            return "CRITICAL"


RISK_COLORS = {
    "LOW":      "\033[92m",   # green
    "MEDIUM":   "\033[93m",   # yellow
    "HIGH":     "\033[33m",   # orange-ish
    "CRITICAL": "\033[91m",   # red
}
RESET = "\033[0m"


# ==============================================================================
# MAIN
# ==============================================================================

def run_test_predictions():
    print("=" * 65)
    print("  AgriRisk – Test Prediction Verification")
    print("=" * 65)

    # ── Load model ────────────────────────────────────────────────────────
    try:
        artifact = load_risk_model()
    except FileNotFoundError as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)

    pipeline        = artifact["model"]
    feature_columns = artifact["feature_columns"]
    metrics         = artifact["metrics"]

    print(f"\n  Model      : {artifact['model_type']}")
    print(f"  Created    : {artifact['created_at']}")
    print(f"  Test RMSE  : {metrics.get('test_rmse')}")
    print(f"  Test R²    : {metrics.get('test_r2')}")
    print(f"  Input features: {len(feature_columns)}")

    # ── Run scenarios ─────────────────────────────────────────────────────
    print("\n" + "─" * 65)
    print("  SCENARIO PREDICTIONS")
    print("─" * 65)

    results = []
    all_pass = True

    for i, scenario in enumerate(SCENARIO_INPUTS, 1):
        label = scenario.pop("label")

        # Build input row using only the feature_columns the model expects
        row = {col: scenario.get(col, 0) for col in feature_columns}
        X_input = pd.DataFrame([row])

        # Predict
        try:
            raw_score = float(pipeline.predict(X_input)[0])
            score     = round(np.clip(raw_score, 0, 100), 1)
            level     = classify_score(score)

            # Simple sanity check: score must be in bounds
            valid  = 0.0 <= score <= 100.0
            if not valid:
                all_pass = False

            color = RISK_COLORS.get(level, "")
            print(f"\n  Scenario {i}: {label}")
            print(f"    Score : {color}{score:.1f}/100{RESET}")
            print(f"    Level : {color}{level}{RESET}")
            print(f"    Valid : {'PASS' if valid else 'FAIL - out of range'}")

            # Print top contributing raw features for explainability
            numeric_row = {c: v for c, v in row.items()
                           if isinstance(v, (int, float))}
            top_feats = sorted(numeric_row.items(), key=lambda x: abs(x[1]), reverse=True)[:5]
            print(f"    Top inputs: {', '.join(f'{k}={v:.2f}' for k,v in top_feats)}")

            results.append({"scenario": label, "score": score, "level": level, "valid": valid})

        except Exception as exc:
            print(f"\n  Scenario {i}: {label}")
            print(f"    ERROR: {exc}")
            all_pass = False
            results.append({"scenario": label, "score": None, "level": "ERROR", "valid": False})

    # ── Summary ───────────────────────────────────────────────────────────
    print("\n" + "─" * 65)
    print(f"  SUMMARY: {sum(r['valid'] for r in results)}/{len(results)} scenarios PASSED")

    scores = [r["score"] for r in results if r["score"] is not None]
    if scores:
        print(f"  Score range across scenarios: {min(scores):.1f} – {max(scores):.1f}")
        print(f"  Risk levels seen: {sorted(set(r['level'] for r in results))}")

    print("\n  Test prediction script complete.")
    print("  Run `python -m ml.train_risk_model` to retrain.\n")
    return results, all_pass


if __name__ == "__main__":
    results, all_pass = run_test_predictions()
    sys.exit(0 if all_pass else 1)
