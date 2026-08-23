"""
AgriRisk - Risk Calculation Tests
"""

import unittest
import sys, os

from backend.utils.risk_calculator import (
    calc_weather_risk, calc_pest_risk, calc_soil_risk,
    calc_market_risk, calc_production_risk, calc_overall_risk,
    classify_risk, extract_factors
)


class TestRiskCalculator(unittest.TestCase):

    def test_classify_risk(self):
        self.assertEqual(classify_risk(20), 'LOW')
        self.assertEqual(classify_risk(50), 'MEDIUM')
        self.assertEqual(classify_risk(70), 'HIGH')
        self.assertEqual(classify_risk(90), 'CRITICAL')

    def test_weather_risk_bounds(self):
        r = calc_weather_risk(25, 50, 65, 8, 5)
        self.assertGreaterEqual(r, 0)
        self.assertLessEqual(r, 100)

    def test_weather_risk_extreme(self):
        r = calc_weather_risk(45, 200, 90, 40, 80)
        self.assertGreater(r, 60)  # Should be high

    def test_pest_risk(self):
        r = calc_pest_risk(0.9, 0.9)
        self.assertEqual(r, 90.0)
        r = calc_pest_risk(0, 0)
        self.assertEqual(r, 0.0)

    def test_soil_risk_ideal(self):
        r = calc_soil_risk(6.5, 300, 50, 250, 60)
        self.assertLess(r, 5)  # Near-ideal soil

    def test_soil_risk_poor(self):
        r = calc_soil_risk(4.0, 50, 5, 50, 10)
        self.assertGreater(r, 50)

    def test_overall_risk_weights(self):
        result = calc_overall_risk(80, 80, 80, 80, 80)
        self.assertAlmostEqual(result['risk_score'], 80.0, places=1)

    def test_extract_factors_not_empty(self):
        breakdown = {'weather': 70, 'pest': 60, 'soil': 40, 'market': 30, 'production': 50}
        factors = extract_factors(breakdown)
        self.assertTrue(len(factors) > 0)


if __name__ == '__main__':
    unittest.main()
