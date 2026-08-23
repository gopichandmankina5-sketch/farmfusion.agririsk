"""
AgriRisk - Recommendation Engine
Generates context-aware, risk-driven agricultural recommendations.
"""


# ── Rule database ─────────────────────────────────────────────────────────────

WEATHER_RECS = {
    "HIGH": [
        {"id": "w1", "title": "Monitor Drainage Systems",
         "detail": "Inspect field drainage channels and ensure proper water runoff to prevent waterlogging.",
         "priority": "high"},
        {"id": "w2", "title": "Avoid Over-Irrigation",
         "detail": "With elevated rainfall, suspend irrigation until soil moisture returns to optimal levels.",
         "priority": "high"},
        {"id": "w3", "title": "Use Protective Mulching",
         "detail": "Apply 3–5 cm of organic mulch to moderate soil temperature and reduce erosion.",
         "priority": "medium"},
        {"id": "w4", "title": "Monitor for Waterlogging",
         "detail": "Check low-lying areas for standing water; use drainage pumps if needed.",
         "priority": "high"},
    ],
    "MEDIUM": [
        {"id": "w5", "title": "Track Weather Forecasts Daily",
         "detail": "Use IMD or Skymet forecasts to plan irrigation and harvesting activities.",
         "priority": "medium"},
        {"id": "w6", "title": "Prepare Drainage in Advance",
         "detail": "Clear existing drainage channels before monsoon onset.",
         "priority": "low"},
    ],
    "LOW": [
        {"id": "w7", "title": "Maintain Regular Irrigation Schedule",
         "detail": "Weather conditions are favourable; stick to recommended irrigation intervals.",
         "priority": "low"},
    ],
}

PEST_RECS = {
    "HIGH": [
        {"id": "p1", "title": "Intensify Field Inspections",
         "detail": "Increase field scouting frequency to twice weekly. Focus on leaf undersides and stem nodes.",
         "priority": "high"},
        {"id": "p2", "title": "Apply Integrated Pest Management",
         "detail": "Combine biological controls (predatory insects, biopesticides) with targeted chemical treatment.",
         "priority": "high"},
        {"id": "p3", "title": "Install Pheromone Traps",
         "detail": "Deploy sex pheromone traps at 5 per hectare to monitor and reduce pest populations.",
         "priority": "medium"},
        {"id": "p4", "title": "Consult Agricultural Extension Officer",
         "detail": "Contact your nearest KVK or state agriculture department for crop-specific pest management.",
         "priority": "high"},
    ],
    "MEDIUM": [
        {"id": "p5", "title": "Weekly Pest Surveillance",
         "detail": "Monitor crops weekly; document pest counts and use economic threshold levels to decide on treatment.",
         "priority": "medium"},
        {"id": "p6", "title": "Apply Preventive Biopesticides",
         "detail": "Use neem-based or Bt sprays as preventive measures before population explosion.",
         "priority": "medium"},
    ],
    "LOW": [
        {"id": "p7", "title": "Routine Crop Monitoring",
         "detail": "Maintain standard bi-weekly monitoring for early pest detection.",
         "priority": "low"},
    ],
}

SOIL_RECS = {
    "HIGH": [
        {"id": "s1", "title": "Conduct Comprehensive Soil Testing",
         "detail": "Test for NPK, pH, organic carbon, and micronutrients before next sowing.",
         "priority": "high"},
        {"id": "s2", "title": "Correct Soil pH Imbalance",
         "detail": "Apply agricultural lime for acidic soils (pH < 6) or sulfur for alkaline soils (pH > 7.5).",
         "priority": "high"},
        {"id": "s3", "title": "Replenish Soil Nutrients",
         "detail": "Apply balanced NPK fertiliser based on soil test recommendations; consider FYM at 10 t/ha.",
         "priority": "high"},
        {"id": "s4", "title": "Improve Soil Water Retention",
         "detail": "Incorporate organic matter or compost to enhance soil structure and moisture holding capacity.",
         "priority": "medium"},
    ],
    "MEDIUM": [
        {"id": "s5", "title": "Apply Organic Matter",
         "detail": "Add vermicompost or green manure to improve soil health and microbial activity.",
         "priority": "medium"},
        {"id": "s6", "title": "Practice Crop Rotation",
         "detail": "Rotate with legumes to naturally restore nitrogen levels.",
         "priority": "medium"},
    ],
    "LOW": [
        {"id": "s7", "title": "Maintain Soil Health",
         "detail": "Annual soil testing recommended; continue balanced fertilisation practices.",
         "priority": "low"},
    ],
}

MARKET_RECS = {
    "HIGH": [
        {"id": "m1", "title": "Monitor Mandi Prices Daily",
         "detail": "Check AgMarkNet / eNAM portal for real-time price comparisons across nearby mandis.",
         "priority": "high"},
        {"id": "m2", "title": "Consider Storage for Better Price",
         "detail": "If prices are depressed, use Warehousing Corporation cold storage or e-NWR to sell at a better time.",
         "priority": "high"},
        {"id": "m3", "title": "Explore Contract Farming",
         "detail": "Negotiate forward contracts with processors or exporters to lock in prices before harvest.",
         "priority": "medium"},
        {"id": "m4", "title": "Join Farmer Producer Organisations",
         "detail": "FPOs offer collective bargaining power and better access to formal markets.",
         "priority": "medium"},
    ],
    "MEDIUM": [
        {"id": "m5", "title": "Diversify Marketing Channels",
         "detail": "Explore direct-to-consumer, e-commerce, or local processing units in addition to mandis.",
         "priority": "medium"},
        {"id": "m6", "title": "Track Demand Trends",
         "detail": "Monitor seasonal demand patterns; align harvest timing to peak demand periods.",
         "priority": "medium"},
    ],
    "LOW": [
        {"id": "m7", "title": "Standard Market Monitoring",
         "detail": "Check mandi prices weekly; market conditions are currently stable.",
         "priority": "low"},
    ],
}

PRODUCTION_RECS = {
    "HIGH": [
        {"id": "pr1", "title": "Switch to High-Yield Varieties",
         "detail": "Consult ICAR or state agriculture university for recommended HYV seeds for your region.",
         "priority": "high"},
        {"id": "pr2", "title": "Optimise Sowing Schedule",
         "detail": "Use crop calendars to ensure planting within the optimal window for maximum yield.",
         "priority": "high"},
        {"id": "pr3", "title": "Adopt Precision Agriculture",
         "detail": "Use soil sensor data and variable rate technology to optimise input application.",
         "priority": "medium"},
        {"id": "pr4", "title": "Improve Crop Stand Density",
         "detail": "Review plant spacing and seeding rates; thin or gap-fill as needed.",
         "priority": "medium"},
    ],
    "MEDIUM": [
        {"id": "pr5", "title": "Review Agronomic Practices",
         "detail": "Compare your practices against crop-specific best management guidelines from KVK.",
         "priority": "medium"},
    ],
    "LOW": [
        {"id": "pr6", "title": "Continue Current Practices",
         "detail": "Yield performance is satisfactory; maintain current agronomic schedule.",
         "priority": "low"},
    ],
}

CRITICAL_RECS = [
    {"id": "cr1", "title": "⚠️ Immediate Action Required",
     "detail": "Critical risk level detected. Contact your state agriculture department for emergency support.",
     "priority": "critical"},
    {"id": "cr2", "title": "Activate Crop Insurance Claim",
     "detail": "If enrolled in PMFBY, initiate crop damage notification within 72 hours of loss.",
     "priority": "critical"},
]


# ── Generator ─────────────────────────────────────────────────────────────────

def generate_recommendations(breakdown: dict, risk_level: str) -> list:
    """
    Generate prioritised recommendations based on component risk scores.
    Returns a list of recommendation objects sorted by priority.
    """
    recs = []

    if risk_level == "CRITICAL":
        recs.extend(CRITICAL_RECS)

    def bucket(score):
        if score > 60: return "HIGH"
        elif score > 30: return "MEDIUM"
        else: return "LOW"

    recs.extend(WEATHER_RECS.get(bucket(breakdown.get("weather",    0)), []))
    recs.extend(PEST_RECS.get(   bucket(breakdown.get("pest",       0)), []))
    recs.extend(SOIL_RECS.get(   bucket(breakdown.get("soil",       0)), []))
    recs.extend(MARKET_RECS.get( bucket(breakdown.get("market",     0)), []))
    recs.extend(PRODUCTION_RECS.get(bucket(breakdown.get("production", 0)), []))

    # Deduplicate and sort: critical > high > medium > low
    seen = set()
    unique = []
    for r in recs:
        if r["id"] not in seen:
            seen.add(r["id"])
            unique.append(r)

    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    unique.sort(key=lambda x: priority_order.get(x["priority"], 4))
    return unique
