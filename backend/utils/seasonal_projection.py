"""
AgriRisk - Seasonal Projection
Generates a deterministic month-by-month risk calendar based on base ML predictions.
"""

from backend.utils.risk_calculator import classify_risk, calc_overall_risk

SEASONS = {
    "kharif": ["June", "July", "August", "September", "October"],
    "rabi": ["October", "November", "December", "January", "February", "March"],
    "zaid": ["March", "April", "May", "June"],
    "whole_year": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
}

def generate_seasonal_outlook(season: str, crop: str, base_w: float, base_pe: float, base_s: float, base_m: float, base_pr: float) -> list:
    """
    Project month-by-month risks based on the base seasonal breakdown.
    """
    season_key = season.lower().replace(" ", "_")
    months = SEASONS.get(season_key, SEASONS["whole_year"])
    
    outlook = []
    total_months = len(months)
    
    for i, month in enumerate(months):
        # Progress 0.0 (start) to 1.0 (end)
        progress = i / max(1, (total_months - 1))
        
        # Weather: High variance mid-season (monsoons/frost), stabilizes at end.
        w_curve = 1.0 + (0.3 if 0.3 < progress < 0.7 else -0.1)
        w_risk = min(100, max(0, base_w * w_curve))
        
        # Pest: Compounds over time, peaks near the end before harvest.
        pe_curve = 0.5 + (progress * 0.8)
        pe_risk = min(100, max(0, base_pe * pe_curve))
        
        # Soil: Depletes nutrients over time, slightly increasing risk
        s_curve = 0.9 + (progress * 0.2)
        s_risk = min(100, max(0, base_s * s_curve))
        
        # Market: Most volatile near harvest
        m_curve = 0.8 if progress < 0.8 else 1.2
        m_risk = min(100, max(0, base_m * m_curve))
        
        # Production: Uncertain early, crystallizes late
        pr_curve = 1.2 - (progress * 0.4)
        pr_risk = min(100, max(0, base_pr * pr_curve))
        
        overall_dict = calc_overall_risk(w_risk, pe_risk, s_risk, m_risk, pr_risk)
        overall_score = overall_dict["risk_score"]
        
        outlook.append({
            "month": month,
            "weather": classify_risk(w_risk),
            "pest": classify_risk(pe_risk),
            "soil": classify_risk(s_risk),
            "market": classify_risk(m_risk),
            "production": classify_risk(pr_risk),
            "overall": classify_risk(overall_score),
            "overall_score": overall_score
        })
        
    return outlook
