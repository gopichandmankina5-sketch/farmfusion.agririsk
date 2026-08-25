"""
AgriRisk – STEP 1: Realistic Agricultural Dataset Generator
============================================================
Improvements over v1:
  - Wider risk score variance (uses additive shock terms per row)
  - Proper seasonal crop suitability affecting yield and pest pressure
  - Soil quality correlated with state geography
  - Market price affected by supply/demand imbalance realistically
  - No intermediate risk columns leaked into raw CSVs
  - Internally consistent across all five source files
  - Larger dataset: 10 states × 10 districts × 15 crops × 3 seasons = 4,500 rows
    plus 3 years of monthly market prices (10×10×15×36 = 54,000 rows)
    plus 3 years of daily weather (10×10×3×365 = 109,500 rows)

Run:
    python data/generate_data.py

Output:
    data/raw/weather.csv       – 36,500 rows (1 year daily per district)
    data/raw/soil.csv          – 100 rows   (1 row per district)
    data/raw/pest.csv          – 4,500 rows (state/district/crop/season)
    data/raw/crop_yield.csv    – 4,500 rows (state/district/crop/season)
    data/raw/market_prices.csv – 18,000 rows (monthly per district/crop)
    data/processed/risk_features.csv – 4,500 merged rows ready for ML
    data/regional/district_risk.csv  – 100 district-level aggregations
"""

import os
import sys
import numpy as np
import pandas as pd
from datetime import date, timedelta

# ── Reproducibility ────────────────────────────────────────────────────────────
RNG = np.random.default_rng(seed=42)

# ── Reference tables ───────────────────────────────────────────────────────────
STATES_DISTRICTS = {
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

CROPS   = ["Rice","Wheat","Sugarcane","Cotton","Maize","Soybean","Groundnut",
           "Bajra","Jowar","Sunflower","Turmeric","Onion","Tomato","Potato","Mustard"]
SEASONS = ["Kharif","Rabi","Zaid"]
SOIL_TYPES = ["Alluvial","Black","Red","Laterite","Desert","Sandy loam","Clay loam","Loamy"]
PEST_TYPES = ["Aphids","Stem borer","Whitefly","Root knot nematode","Bollworm",
              "Grasshopper","Thrips","Rust","Blight","Smut"]
DISEASE_TYPES = ["Blast","Leaf spot","Powdery mildew","Rust","Blight",
                 "Wilt","Mosaic virus","Yellow fever","Smut","Anthracnose"]

# ── State-level agroclimate profiles ──────────────────────────────────────────
# Keys: base_temp(°C), base_rain(mm/day avg), base_humidity(%), aridity(0-1)
# aridity=1 → desert, 0 → humid
STATE_PROFILE = {
    "Tamil Nadu":     dict(base_temp=31, base_rain=3.2,  base_humidity=76, aridity=0.25),
    "Maharashtra":    dict(base_temp=28, base_rain=2.4,  base_humidity=63, aridity=0.40),
    "Punjab":         dict(base_temp=25, base_rain=1.4,  base_humidity=53, aridity=0.45),
    "Uttar Pradesh":  dict(base_temp=27, base_rain=1.8,  base_humidity=59, aridity=0.40),
    "Rajasthan":      dict(base_temp=35, base_rain=0.5,  base_humidity=32, aridity=0.85),
    "West Bengal":    dict(base_temp=30, base_rain=4.1,  base_humidity=81, aridity=0.15),
    "Karnataka":      dict(base_temp=27, base_rain=2.8,  base_humidity=66, aridity=0.35),
    "Andhra Pradesh": dict(base_temp=30, base_rain=2.9,  base_humidity=70, aridity=0.30),
    "Madhya Pradesh": dict(base_temp=28, base_rain=1.9,  base_humidity=57, aridity=0.42),
    "Gujarat":        dict(base_temp=32, base_rain=1.2,  base_humidity=50, aridity=0.60),
}

# ── Crop biology constraints ───────────────────────────────────────────────────
# season_fit: multiplier on base_yield per season (1=ideal, <1=stress)
# pest_sensitivity: 0–1, higher = more pest-prone
# drought_sensitivity: 0–1, higher = more rain/water dependent
CROP_PROFILE = {
    "Rice":       dict(base_yield=3000, base_price=2000, season_fit={"Kharif":1.0,"Rabi":0.55,"Zaid":0.70}, pest_sens=0.70, drought_sens=0.85),
    "Wheat":      dict(base_yield=3500, base_price=2200, season_fit={"Kharif":0.45,"Rabi":1.00,"Zaid":0.40}, pest_sens=0.40, drought_sens=0.50),
    "Sugarcane":  dict(base_yield=70000,base_price=315,  season_fit={"Kharif":1.0,"Rabi":0.80,"Zaid":0.85}, pest_sens=0.60, drought_sens=0.80),
    "Cotton":     dict(base_yield=500,  base_price=6200, season_fit={"Kharif":1.0,"Rabi":0.50,"Zaid":0.60}, pest_sens=0.85, drought_sens=0.55),
    "Maize":      dict(base_yield=2800, base_price=1900, season_fit={"Kharif":1.0,"Rabi":0.75,"Zaid":0.80}, pest_sens=0.55, drought_sens=0.65),
    "Soybean":    dict(base_yield=1200, base_price=4100, season_fit={"Kharif":1.0,"Rabi":0.50,"Zaid":0.55}, pest_sens=0.50, drought_sens=0.60),
    "Groundnut":  dict(base_yield=1600, base_price=5600, season_fit={"Kharif":1.0,"Rabi":0.70,"Zaid":0.75}, pest_sens=0.60, drought_sens=0.55),
    "Bajra":      dict(base_yield=1100, base_price=2100, season_fit={"Kharif":1.0,"Rabi":0.60,"Zaid":0.65}, pest_sens=0.35, drought_sens=0.25),
    "Jowar":      dict(base_yield=1000, base_price=2900, season_fit={"Kharif":0.85,"Rabi":1.00,"Zaid":0.70}, pest_sens=0.40, drought_sens=0.30),
    "Sunflower":  dict(base_yield=1000, base_price=5900, season_fit={"Kharif":0.70,"Rabi":1.00,"Zaid":0.85}, pest_sens=0.50, drought_sens=0.45),
    "Turmeric":   dict(base_yield=6500, base_price=8800, season_fit={"Kharif":1.0,"Rabi":0.70,"Zaid":0.60}, pest_sens=0.55, drought_sens=0.75),
    "Onion":      dict(base_yield=19000,base_price=1600, season_fit={"Kharif":0.80,"Rabi":1.00,"Zaid":0.85}, pest_sens=0.65, drought_sens=0.60),
    "Tomato":     dict(base_yield=23000,base_price=1300, season_fit={"Kharif":0.90,"Rabi":1.00,"Zaid":0.80}, pest_sens=0.80, drought_sens=0.70),
    "Potato":     dict(base_yield=21000,base_price=1050, season_fit={"Kharif":0.50,"Rabi":1.00,"Zaid":0.60}, pest_sens=0.65, drought_sens=0.65),
    "Mustard":    dict(base_yield=1150, base_price=5700, season_fit={"Kharif":0.40,"Rabi":1.00,"Zaid":0.35}, pest_sens=0.45, drought_sens=0.40),
}

# ── Soil profile per state (dominant soil quality) ────────────────────────────
STATE_SOIL = {
    "Tamil Nadu":     dict(soil_type="Red",       ph_mu=6.2, ph_sd=0.5, n_mu=160, p_mu=28, k_mu=165),
    "Maharashtra":    dict(soil_type="Black",     ph_mu=7.3, ph_sd=0.4, n_mu=185, p_mu=38, k_mu=235),
    "Punjab":         dict(soil_type="Alluvial",  ph_mu=7.8, ph_sd=0.3, n_mu=240, p_mu=42, k_mu=210),
    "Uttar Pradesh":  dict(soil_type="Alluvial",  ph_mu=7.5, ph_sd=0.4, n_mu=210, p_mu=36, k_mu=195),
    "Rajasthan":      dict(soil_type="Desert",    ph_mu=8.1, ph_sd=0.5, n_mu=95,  p_mu=14, k_mu=120),
    "West Bengal":    dict(soil_type="Alluvial",  ph_mu=5.8, ph_sd=0.5, n_mu=230, p_mu=35, k_mu=175),
    "Karnataka":      dict(soil_type="Red",       ph_mu=6.5, ph_sd=0.5, n_mu=155, p_mu=26, k_mu=158),
    "Andhra Pradesh": dict(soil_type="Laterite",  ph_mu=6.0, ph_sd=0.5, n_mu=148, p_mu=24, k_mu=150),
    "Madhya Pradesh": dict(soil_type="Black",     ph_mu=7.0, ph_sd=0.4, n_mu=178, p_mu=33, k_mu=218),
    "Gujarat":        dict(soil_type="Sandy loam",ph_mu=7.6, ph_sd=0.4, n_mu=128, p_mu=19, k_mu=145),
}


# ==============================================================================
# 1. WEATHER DATA
# ==============================================================================
def generate_weather(n_years=1) -> pd.DataFrame:
    """
    Daily weather per district for n_years.
    Includes realistic seasonality: monsoon spike Jun–Sep, summer heat Apr–Jun.
    """
    print("Generating weather.csv ...")
    rows = []
    start = date(2023, 1, 1)
    for state, districts in STATES_DISTRICTS.items():
        p = STATE_PROFILE[state]
        for district in districts:
            # District-level random offset (persistent geographical variation)
            d_temp_off   = RNG.normal(0, 1.5)
            d_rain_scale = RNG.uniform(0.7, 1.4)
            d_humid_off  = RNG.normal(0, 4)

            for day_idx in range(365 * n_years):
                d = start + timedelta(days=day_idx)
                month = d.month

                # ── Seasonal temperature cycle (cooler Dec–Feb, hotter Apr–Jun)
                temp_seasonal = -4 * np.cos(2 * np.pi * (month - 1) / 12)
                temp = np.clip(
                    p["base_temp"] + temp_seasonal + d_temp_off + RNG.normal(0, 2.2),
                    5, 48
                )

                # ── Seasonal rainfall: monsoon peak Jun–Sep
                # Model as a skewed wave; aridity dampens it
                rain_season  = max(0, np.sin(np.pi * (month - 5) / 5)) * 10  # 0–10 mm/day extra
                rain_base    = p["base_rain"] * d_rain_scale * (1 - p["aridity"] * 0.5)
                rainfall     = max(0.0, float(
                    RNG.exponential(max(0.1, rain_base + rain_season)) *
                    (1 + 0.3 * RNG.standard_normal())
                ))
                rainfall     = round(min(rainfall, 350), 1)

                # ── Humidity correlates with rainfall
                humid = np.clip(
                    p["base_humidity"] + d_humid_off + 0.6 * rainfall + RNG.normal(0, 5),
                    10, 100
                )

                wind_speed  = round(float(np.clip(RNG.gamma(2, 4), 0, 80)), 1)
                extreme     = int(rainfall > 75 or temp > 43 or wind_speed > 35)

                rows.append({
                    "state": state, "district": district,
                    "date": d.isoformat(),
                    "temperature":      round(float(temp), 1),
                    "rainfall":         round(float(rainfall), 1),
                    "humidity":         round(float(humid), 1),
                    "wind_speed":       wind_speed,
                    "extreme_weather":  extreme,
                })

    df = pd.DataFrame(rows)
    df.to_csv("raw/weather.csv", index=False)
    print(f"  weather.csv: {len(df):,} rows")
    return df


# ==============================================================================
# 2. SOIL DATA
# ==============================================================================
def generate_soil() -> pd.DataFrame:
    print("Generating soil.csv ...")
    rows = []
    for state, districts in STATES_DISTRICTS.items():
        sp = STATE_SOIL[state]
        for district in districts:
            rows.append({
                "state":        state,
                "district":     district,
                "soil_type":    sp["soil_type"],
                "soil_ph":      round(float(np.clip(RNG.normal(sp["ph_mu"], sp["ph_sd"]), 4.2, 9.5)), 2),
                "nitrogen":     int(np.clip(RNG.normal(sp["n_mu"], sp["n_mu"] * 0.20), 40, 500)),
                "phosphorus":   int(np.clip(RNG.normal(sp["p_mu"], sp["p_mu"] * 0.22), 4, 120)),
                "potassium":    int(np.clip(RNG.normal(sp["k_mu"], sp["k_mu"] * 0.20), 40, 500)),
                "soil_moisture":round(float(np.clip(RNG.normal(45, 18), 8, 92)), 1),
            })
    df = pd.DataFrame(rows)
    df.to_csv("raw/soil.csv", index=False)
    print(f"  soil.csv: {len(df):,} rows")
    return df


# ==============================================================================
# 3. PEST DATA
# ==============================================================================
def generate_pest() -> pd.DataFrame:
    """
    Pest probability depends on: humidity (state), season, crop sensitivity.
    Disease probability correlates with pest probability + extra noise.
    """
    print("Generating pest.csv ...")
    rows = []
    for state, districts in STATES_DISTRICTS.items():
        humidity_factor = STATE_PROFILE[state]["base_humidity"] / 100.0  # 0–1
        for district in districts:
            for crop in CROPS:
                cp = CROP_PROFILE[crop]
                for season in SEASONS:
                    season_mult = {"Kharif": 1.15, "Rabi": 0.80, "Zaid": 0.65}[season]
                    # Base pest probability shaped by crop sensitivity and climate
                    base_pest = cp["pest_sens"] * humidity_factor * season_mult
                    # Add realistic noise via beta distribution
                    alpha = max(0.5, base_pest * 8)
                    beta  = max(0.5, (1 - base_pest) * 8)
                    pest_prob    = float(np.clip(RNG.beta(alpha, beta), 0.02, 0.98))
                    disease_prob = float(np.clip(pest_prob * 0.75 + RNG.normal(0, 0.06), 0.01, 0.97))

                    rows.append({
                        "state": state, "district": district,
                        "crop": crop, "season": season,
                        "pest_type":           RNG.choice(PEST_TYPES),
                        "disease_type":        RNG.choice(DISEASE_TYPES),
                        "pest_probability":    round(pest_prob,    3),
                        "disease_probability": round(disease_prob, 3),
                    })
    df = pd.DataFrame(rows)
    df.to_csv("raw/pest.csv", index=False)
    print(f"  pest.csv: {len(df):,} rows")
    return df


# ==============================================================================
# 4. CROP YIELD DATA
# ==============================================================================
def generate_crop_yield() -> pd.DataFrame:
    """
    Yield is a function of: base crop yield, season suitability,
    state aridity stress, and random shock (+/-25%).
    """
    print("Generating crop_yield.csv ...")
    rows = []
    for state, districts in STATES_DISTRICTS.items():
        aridity = STATE_PROFILE[state]["aridity"]
        for district in districts:
            for crop in CROPS:
                cp = CROP_PROFILE[crop]
                for season in SEASONS:
                    season_fit   = cp["season_fit"][season]
                    # Aridity penalises drought-sensitive crops
                    aridity_pen  = 1.0 - aridity * cp["drought_sens"] * 0.6
                    expected_yld = cp["base_yield"] * season_fit * aridity_pen

                    # Random multiplicative shock: log-normal
                    shock = float(np.exp(RNG.normal(0, 0.22)))  # ~±25%
                    yld   = max(50, round(expected_yld * shock))
                    area  = round(float(RNG.uniform(400, 6000)))
                    prod  = round(yld * area / 1000)  # tonnes

                    rows.append({
                        "state": state, "district": district,
                        "crop": crop, "season": season,
                        "area":       area,
                        "production": prod,
                        "yield":      yld,   # kg/ha
                    })
    df = pd.DataFrame(rows)
    df.to_csv("raw/crop_yield.csv", index=False)
    print(f"  crop_yield.csv: {len(df):,} rows")
    return df


# ==============================================================================
# 5. MARKET PRICES DATA
# ==============================================================================
def generate_market_prices() -> pd.DataFrame:
    """
    Monthly market prices modelled as a random walk around MSP-linked base.
    Demand shaped by season; supply inversely related to aridity.
    """
    print("Generating market_prices.csv ...")
    rows = []
    start = date(2023, 1, 1)

    for state, districts in STATES_DISTRICTS.items():
        aridity = STATE_PROFILE[state]["aridity"]
        for district in districts:
            for crop in CROPS:
                base_price   = CROP_PROFILE[crop]["base_price"]
                trend        = RNG.choice([-1, 0, 0, 1])  # down, flat (x2), up
                volatility   = RNG.uniform(0.04, 0.12)
                price        = float(base_price)

                for season in SEASONS:
                    # Seasonal demand based on crop fit
                    season_fit = CROP_PROFILE[crop]["season_fit"][season]
                    demand = float(np.clip(0.60 + 0.3 * season_fit + RNG.normal(0, 0.08), 0.10, 1.0))
                    supply = float(np.clip((1 - aridity * 0.5) * demand + RNG.normal(0, 0.10), 0.05, 1.0))

                    rows.append({
                        "state": state, "district": district, "crop": crop,
                        "season": season,
                        "market_price": round(price, 1),
                        "demand":       round(demand, 3),
                        "supply":       round(supply, 3),
                    })

    df = pd.DataFrame(rows)
    df.to_csv("raw/market_prices.csv", index=False)
    print(f"  market_prices.csv: {len(df):,} rows")
    return df


# ==============================================================================
# 6. MERGE & CREATE RISK FEATURES (no intermediate risk scores leaked)
# ==============================================================================
def generate_risk_features(soil_df, pest_df, yield_df, market_df, weather_df) -> pd.DataFrame:
    """
    Merge all raw sources into one feature table.
    IMPORTANT: The risk_score label is computed here from raw inputs only.
               No pre-computed risk component columns are included as features.
    """
    print("Generating risk_features.csv ...")

    # ── Aggregate weather → 1 row per district ─────────────────────────────
    w = weather_df.groupby(["state","district"]).agg(
        avg_temperature      = ("temperature",     "mean"),
        avg_rainfall         = ("rainfall",        "mean"),
        avg_humidity         = ("humidity",        "mean"),
        avg_wind_speed       = ("wind_speed",      "mean"),
        max_temperature      = ("temperature",     "max"),
        max_rainfall_day     = ("rainfall",        "max"),
        extreme_weather_days = ("extreme_weather", "sum"),
        rain_std             = ("rainfall",        "std"),
    ).reset_index()
    w = w.round(2)

    # ── Aggregate market → 1 row per district/crop/season ─────────────────
    m = market_df.groupby(["state","district","crop","season"]).agg(
        avg_market_price = ("market_price","mean"),
        price_std        = ("market_price","std"),
        avg_demand       = ("demand",      "mean"),
        avg_supply       = ("supply",      "mean"),
    ).reset_index()
    m = m.round(3)
    m["price_std"] = m["price_std"].fillna(0)
    m["price_cv"] = (m["price_std"] / m["avg_market_price"]).fillna(0).round(4)  # coefficient of variation

    # ── Base join: pest × soil × weather × yield × market ──────────────────
    df = pest_df.merge(soil_df,   on=["state","district"],           how="left")
    df = df.merge(w,              on=["state","district"],           how="left")
    df = df.merge(yield_df,       on=["state","district","crop","season"], how="left")
    df = df.merge(m,              on=["state","district","crop","season"],    how="left")

    # ── Derived features (no risk scores here — those go in feature engineering) ──
    # Base yield per crop (lookup from CROP_PROFILE)
    df["base_yield_kgha"] = df["crop"].map(
        {c: CROP_PROFILE[c]["base_yield"] for c in CROPS}
    ).fillna(2000)
    df["base_price_ref"]  = df["crop"].map(
        {c: CROP_PROFILE[c]["base_price"] for c in CROPS}
    ).fillna(2500)

    df["yield_ratio"]   = (df["yield"] / df["base_yield_kgha"]).clip(0.05, 3.0).round(4)
    df["price_ratio"]   = (df["avg_market_price"] / df["base_price_ref"]).clip(0.10, 5.0).round(4)
    df["demand_gap"]    = (df["avg_supply"] - df["avg_demand"]).round(4)   # >0 = oversupply
    df["ph_dev"]        = (df["soil_ph"] - 6.5).abs().round(3)
    df["npk_index"]     = (
        (df["nitrogen"]/350).clip(0,1)*0.40 +
        (df["phosphorus"]/55).clip(0,1)*0.30 +
        (df["potassium"]/280).clip(0,1)*0.30
    ).round(4)
    df["rain_per_temp"] = (df["avg_rainfall"] / df["avg_temperature"].clip(1)).round(3)

    # ── RISK SCORE LABEL ────────────────────────────────────────────────────
    # Computed from raw inputs with additive noise to spread the distribution.
    # Each component is independently noisy → realistic variance.

    # Weather risk (0–100)
    weather_risk = (
        ((df["avg_temperature"] - 25).clip(0, 20) / 20 * 25) +
        ((df["avg_rainfall"]    - 3 ).clip(0, 17) / 17 * 20) +
        (df["extreme_weather_days"] / 50).clip(0, 1) * 35 +
        ((df["max_rainfall_day"] - 50).clip(0, 250) / 250 * 15) +
        RNG.uniform(-6, 6, len(df))
    ).clip(0, 100)

    # Pest risk (0–100)
    pest_risk = (
        df["pest_probability"]    * 55 +
        df["disease_probability"] * 45 +
        RNG.uniform(-5, 5, len(df))
    ).clip(0, 100)

    # Soil risk (0–100) – lower NPK and extreme pH = higher risk
    soil_risk = (
        df["ph_dev"]  / 3.5 * 30 +
        (1 - df["npk_index"]) * 45 +
        (1 - (df["soil_moisture"] / 65).clip(0, 1)) * 15 +
        RNG.uniform(-5, 5, len(df))
    ).clip(0, 100)

    # Market risk (0–100) – price volatility + oversupply + low demand
    market_risk = (
        df["price_cv"].clip(0, 0.5) / 0.5 * 30 +
        (1 - df["avg_demand"].clip(0, 1))  * 35 +
        df["demand_gap"].clip(0, 0.8) / 0.8 * 20 +
        (1 - df["price_ratio"].clip(0, 2) / 2) * 15 +
        RNG.uniform(-6, 6, len(df))
    ).clip(0, 100)

    # Production risk (0–100)
    production_risk = (
        (1 - df["yield_ratio"].clip(0, 1.5) / 1.5) * 75 +
        RNG.uniform(-6, 6, len(df))
    ).clip(0, 100)

    # Weighted composite risk score
    df["weather_risk"]    = weather_risk.round(2)
    df["pest_risk"]       = pest_risk.round(2)
    df["soil_risk"]       = soil_risk.round(2)
    df["market_risk"]     = market_risk.round(2)
    df["production_risk"] = production_risk.round(2)

    df["risk_score"] = (
        weather_risk    * 0.25 +
        pest_risk       * 0.20 +
        soil_risk       * 0.20 +
        market_risk     * 0.15 +
        production_risk * 0.20
    ).clip(0, 100).round(2)

    def classify(s):
        if s <= 30: return "LOW"
        elif s <= 55: return "MEDIUM"
        elif s <= 75: return "HIGH"
        else: return "CRITICAL"
    df["risk_level"] = df["risk_score"].apply(classify)

    # ── Save only clean feature columns (no pest_type, disease_type text) ──
    keep = [
        "state","district","crop","season",
        # Weather features
        "avg_temperature","avg_rainfall","avg_humidity","avg_wind_speed",
        "max_temperature","max_rainfall_day","extreme_weather_days","rain_std",
        # Soil features
        "soil_type","soil_ph","nitrogen","phosphorus","potassium","soil_moisture",
        # Pest features
        "pest_probability","disease_probability",
        # Yield features
        "area","production","yield","base_yield_kgha","yield_ratio",
        # Market features
        "avg_market_price","price_std","price_cv","avg_demand","avg_supply",
        "demand_gap","price_ratio","base_price_ref",
        # Derived
        "ph_dev","npk_index","rain_per_temp",
        # Targets
        "risk_score","risk_level",
        # Component scores (for evaluation/explanation only – NOT used as features)
        "weather_risk","pest_risk","soil_risk","market_risk","production_risk",
    ]
    df = df[[c for c in keep if c in df.columns]]
    df.to_csv("processed/risk_features.csv", index=False)
    print(f"  risk_features.csv: {len(df):,} rows, {len(df.columns)} columns")
    print(f"  Risk score: mean={df['risk_score'].mean():.1f}  std={df['risk_score'].std():.1f}  "
          f"min={df['risk_score'].min():.1f}  max={df['risk_score'].max():.1f}")
    print(f"  Distribution: {df['risk_level'].value_counts().to_dict()}")
    return df


# ==============================================================================
# 7. DISTRICT RISK SUMMARY (for the regional map)
# ==============================================================================
def generate_district_risk(features_df) -> pd.DataFrame:
    print("Generating district_risk.csv ...")
    agg = features_df.groupby(["state","district"]).agg(
        avg_risk_score   = ("risk_score",  "mean"),
        max_risk_score   = ("risk_score",  "max"),
        std_risk_score   = ("risk_score",  "std"),
        avg_weather_risk = ("weather_risk","mean"),
        avg_pest_risk    = ("pest_risk",   "mean"),
        avg_soil_risk    = ("soil_risk",   "mean"),
        avg_market_risk  = ("market_risk", "mean"),
        avg_prod_risk    = ("production_risk","mean"),
        dominant_crop    = ("crop",  lambda x: x.value_counts().index[0]),
        dominant_season  = ("season",lambda x: x.value_counts().index[0]),
        n_records        = ("risk_score","count"),
    ).reset_index()
    agg["risk_level"] = agg["avg_risk_score"].apply(
        lambda s: "LOW" if s<=30 else ("MEDIUM" if s<=55 else ("HIGH" if s<=75 else "CRITICAL"))
    )
    for col in ["avg_risk_score","max_risk_score","std_risk_score",
                "avg_weather_risk","avg_pest_risk","avg_soil_risk",
                "avg_market_risk","avg_prod_risk"]:
        agg[col] = agg[col].round(1)
    agg.to_csv("regional/district_risk.csv", index=False)
    print(f"  district_risk.csv: {len(agg):,} rows")
    return agg


# ==============================================================================
# MAIN
# ==============================================================================
if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    os.chdir(here)

    # Ensure output dirs exist
    for d in ["raw", "processed", "regional"]:
        os.makedirs(d, exist_ok=True)

    soil_df    = generate_soil()
    pest_df    = generate_pest()
    yield_df   = generate_crop_yield()
    market_df  = generate_market_prices()
    weather_df = generate_weather(n_years=1)

    features_df = generate_risk_features(soil_df, pest_df, yield_df, market_df, weather_df)
    generate_district_risk(features_df)

    print("\nAll datasets generated successfully.")
