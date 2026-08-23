"""
AgriRisk - Risk Calculator
Configurable weighted risk scoring with explainability.
"""

from backend.config.config import Config

# ── Risk classification ────────────────────────────────────────────────────────

def classify_risk(score: float) -> str:
    """Map numeric score to risk level label."""
    rounded = round(score)
    if rounded <= 30:   return "LOW"
    elif rounded <= 60: return "MEDIUM"
    elif rounded <= 80: return "HIGH"
    else:               return "CRITICAL"


def risk_color(level: str) -> str:
    """Return a hex color for a risk level."""
    return {
        "LOW":      "#22c55e",
        "MEDIUM":   "#eab308",
        "HIGH":     "#f97316",
        "CRITICAL": "#ef4444",
    }.get(level, "#6b7280")


# ── Individual component calculators ──────────────────────────────────────────

def calc_weather_risk(avg_temperature: float, avg_rainfall: float,
                      avg_humidity: float, avg_wind_speed: float,
                      extreme_weather_days: float) -> float:
    """
    Weather risk score (0–100).
    Combines temperature extremity, excess rainfall, humidity stress,
    and number of extreme weather events.
    """
    temp_risk    = min(100, max(0, (avg_temperature - 20) / 20 * 30))
    rain_risk    = min(100, avg_rainfall / 150 * 30)
    extreme_risk = min(100, extreme_weather_days / 50 * 40)
    return round(min(100, temp_risk + rain_risk + extreme_risk), 1)


def calc_pest_risk(pest_probability: float, disease_probability: float) -> float:
    """
    Pest risk score (0–100).
    Simple weighted sum of pest and disease probabilities.
    """
    return round(min(100, pest_probability * 50 + disease_probability * 50), 1)


def calc_soil_risk(soil_ph: float, nitrogen: float, phosphorus: float,
                   potassium: float, soil_moisture: float) -> float:
    """
    Soil risk score (0–100).
    Penalises deviation from ideal pH and nutrient levels.
    """
    ph_risk   = min(1.0, abs(soil_ph - 6.5) / 2.5) * 25
    n_risk    = max(0, 1 - nitrogen   / 300) * 30
    p_risk    = max(0, 1 - phosphorus / 50)  * 20
    k_risk    = max(0, 1 - potassium  / 250) * 15
    mois_risk = max(0, 1 - soil_moisture / 60) * 10
    return round(min(100, ph_risk + n_risk + p_risk + k_risk + mois_risk), 1)


def calc_market_risk(avg_market_price: float, avg_demand: float,
                     avg_supply: float, base_price: float = 2500) -> float:
    """
    Market risk score (0–100).
    Reflects demand weakness and demand-supply imbalance.
    """
    demand_risk = (1 - min(1.0, avg_demand)) * 40
    imbalance   = min(1.0, abs(avg_supply - avg_demand)) * 35
    price_risk  = max(0, (1 - avg_market_price / base_price)) * 25 if base_price else 0
    return round(min(100, demand_risk + imbalance + price_risk), 1)


def calc_production_risk(actual_yield: float, base_yield: float) -> float:
    """
    Production risk score (0–100).
    Measures yield shortfall relative to expected baseline.
    """
    if base_yield <= 0:
        return 50.0
    ratio = actual_yield / base_yield
    risk  = max(0, (1 - min(1.5, ratio))) / 1.0 * 70
    return round(min(100, risk), 1)


# ── Composite risk score ───────────────────────────────────────────────────────

def calc_overall_risk(weather_risk: float, pest_risk: float, soil_risk: float,
                      market_risk: float, production_risk: float) -> dict:
    """
    Compute weighted overall risk score and breakdown.
    Weights are read from Config so they remain configurable without code changes.
    """
    w = Config.RISK_WEIGHTS
    score = (
        weather_risk    * w["weather"] +
        pest_risk       * w["pest"] +
        soil_risk       * w["soil"] +
        market_risk     * w["market"] +
        production_risk * w["production"]
    )
    score = round(min(100, max(0, score)), 1)

    return {
        "risk_score": score,
        "risk_level": classify_risk(score),
        "breakdown": {
            "weather":    round(weather_risk,    1),
            "pest":       round(pest_risk,       1),
            "soil":       round(soil_risk,       1),
            "market":     round(market_risk,     1),
            "production": round(production_risk, 1),
        },
    }


# ── Factor explainability ──────────────────────────────────────────────────────

def extract_factors(breakdown: dict, weather_data: dict = None,
                    soil_data: dict = None) -> list:
    """
    Convert risk breakdown into human-readable contributing factors.
    Returns a sorted list of factor dicts with name and impact value.
    """
    raw_factors = []

    # Weather sub-factors
    if weather_data:
        temp = weather_data.get("avg_temperature", 25)
        rain = weather_data.get("avg_rainfall", 50)
        extreme = weather_data.get("extreme_weather_days", 0)
        if temp > 38:
            raw_factors.append({"name": "Extreme Heat Stress", "category": "weather",
                                 "impact": round(min(28, (temp - 38) * 3), 1)})
        if rain > 80:
            raw_factors.append({"name": "Excess Rainfall", "category": "weather",
                                 "impact": round(min(28, (rain - 80) / 5), 1)})
        if extreme > 10:
            raw_factors.append({"name": "Extreme Weather Events", "category": "weather",
                                 "impact": round(min(20, extreme * 0.8), 1)})

    # Pest
    pest_impact = breakdown.get("pest", 0)
    if pest_impact > 20:
        raw_factors.append({"name": "High Pest Probability", "category": "pest",
                             "impact": round(pest_impact * 0.6, 1)})
    if pest_impact > 30:
        raw_factors.append({"name": "Disease Outbreak Risk", "category": "pest",
                             "impact": round(pest_impact * 0.4, 1)})

    # Soil
    if soil_data:
        ph = soil_data.get("soil_ph", 6.5)
        n  = soil_data.get("nitrogen", 200)
        moisture = soil_data.get("soil_moisture", 50)
        if abs(ph - 6.5) > 1.0:
            raw_factors.append({"name": "Soil pH Imbalance", "category": "soil",
                                 "impact": round(abs(ph - 6.5) * 10, 1)})
        if n < 150:
            raw_factors.append({"name": "Nitrogen Deficiency", "category": "soil",
                                 "impact": round((150 - n) / 150 * 20, 1)})
        if moisture < 30:
            raw_factors.append({"name": "Low Soil Moisture", "category": "soil",
                                 "impact": round((30 - moisture) / 30 * 15, 1)})

    # Market
    market_impact = breakdown.get("market", 0)
    if market_impact > 25:
        raw_factors.append({"name": "Market Price Volatility", "category": "market",
                             "impact": round(market_impact * 0.5, 1)})
    if market_impact > 40:
        raw_factors.append({"name": "Demand-Supply Imbalance", "category": "market",
                             "impact": round(market_impact * 0.5, 1)})

    # Production
    prod_impact = breakdown.get("production", 0)
    if prod_impact > 30:
        raw_factors.append({"name": "Low Historical Yield", "category": "production",
                             "impact": round(prod_impact * 0.7, 1)})

    # Fallback: use breakdown directly if no sub-factors found
    if not raw_factors:
        for k, v in breakdown.items():
            if v > 0:
                raw_factors.append({"name": k.title() + " Risk", "category": k,
                                     "impact": round(v, 1)})

    # Sort descending by impact
    raw_factors.sort(key=lambda x: x["impact"], reverse=True)
    return raw_factors[:8]  # Top 8
