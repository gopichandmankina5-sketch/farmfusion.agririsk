"""
AgriRisk - API Tests
"""

import unittest
import json
import os
import sys


from backend.main import create_app


class TestRiskAPI(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_health(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data['status'], 'ok')

    def test_analyze_valid(self):
        payload = {
            "state": "Tamil Nadu", "district": "Madurai",
            "crop": "Rice", "season": "Kharif"
        }
        res = self.client.post('/api/risk/analyze',
                                data=json.dumps(payload),
                                content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('risk_score', data)
        self.assertIn('risk_level', data)
        self.assertIn('breakdown', data)
        self.assertIn('factors', data)
        self.assertIn('recommendations', data)
        self.assertGreaterEqual(data['risk_score'], 0)
        self.assertLessEqual(data['risk_score'], 100)

    def test_analyze_missing_fields(self):
        res = self.client.post('/api/risk/analyze',
                                data=json.dumps({"state": "Tamil Nadu"}),
                                content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_analyze_invalid_season(self):
        payload = {
            "state": "Tamil Nadu", "district": "Madurai",
            "crop": "Rice", "season": "InvalidSeason"
        }
        res = self.client.post('/api/risk/analyze',
                                data=json.dumps(payload),
                                content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_regional(self):
        res = self.client.get('/api/risk/regional')
        self.assertEqual(res.status_code, 200)

    def test_weather(self):
        res = self.client.get('/api/weather?state=Tamil Nadu&district=Madurai')
        self.assertEqual(res.status_code, 200)

    def test_meta_states(self):
        res = self.client.get('/api/meta/states')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('states_districts', data)

    def test_meta_crops(self):
        res = self.client.get('/api/meta/crops')
        self.assertEqual(res.status_code, 200)


if __name__ == '__main__':
    unittest.main()
