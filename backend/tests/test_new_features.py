import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

class TestNewFeatures(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_interview_endpoints(self):
        # 1. Fetch tracks
        res = self.client.get("/interview/tracks")
        self.assertEqual(res.status_code, 200)
        data = res.json()["tracks"]
        self.assertIn("sde_backend", data)
        self.assertIn("gate_mtech", data)

        # 2. Start interview
        start_payload = {
            "track_id": "sde_backend",
            "candidate_name": "Test Alex",
            "target_role": "Backend Engineer",
        }
        res = self.client.post("/interview/start", json=start_payload)
        self.assertEqual(res.status_code, 200)
        start_data = res.json()
        session_id = start_data["session_id"]
        self.assertTrue(session_id.startswith("intv_"))

        # 3. Submit turn
        turn_payload = {
            "session_id": session_id,
            "track_id": "sde_backend",
            "question": start_data["first_question"],
            "answer": "In our payment service we experienced cascading timeout failures during peak sales. I introduced Redis-backed distributed circuit breakers using Redisson, configured 500ms timeouts with exponential backoff, and added a fallback dead-letter queue. This prevented database exhaustion and reduced 5xx errors by 94%.",
            "round_number": 1,
        }
        res = self.client.post("/interview/turn", json=turn_payload)
        self.assertEqual(res.status_code, 200)
        turn_data = res.json()
        self.assertIn("star_score", turn_data)
        self.assertGreaterEqual(turn_data["star_score"], 60)

    def test_flashcards_endpoints(self):
        # 1. Fetch decks
        res = self.client.get("/flashcards/decks")
        self.assertEqual(res.status_code, 200)
        decks = res.json()["decks"]
        self.assertGreater(len(decks), 0)
        self.assertEqual(decks[0]["subject"], "Operating Systems")

        # 2. Review card with SM-2
        review_payload = {
            "card_id": "os_1",
            "rating": 2, # Good
            "reps": 1,
            "interval_days": 1,
            "ease_factor": 2.5,
        }
        res = self.client.post("/flashcards/review", json=review_payload)
        self.assertEqual(res.status_code, 200)
        rev_data = res.json()
        self.assertEqual(rev_data["reps"], 2)
        self.assertGreater(rev_data["interval_days"], 1)

    def test_battle_endpoints(self):
        # 1. Start battle
        res = self.client.post("/battle/start")
        self.assertEqual(res.status_code, 200)
        battle_data = res.json()
        match_id = battle_data["match_id"]
        self.assertEqual(len(battle_data["questions"]), 5)

        # 2. Submit answers
        submit_payload = {
            "match_id": match_id,
            "answers": [1, 2, 0, 1, 2],
            "times_seconds": [5.2, 7.1, 4.8, 6.0, 5.5],
        }
        res = self.client.post("/battle/submit", json=submit_payload)
        self.assertEqual(res.status_code, 200)
        result = res.json()
        self.assertIn("winner", result)
        self.assertIn("user_score", result)
        self.assertEqual(len(result["detailed_results"]), 5)

    def test_predictor_endpoints(self):
        predict_payload = {
            "gate_score": 750,
            "gate_marks": 68.0,
            "category": "general",
        }
        res = self.client.post("/predictor/predict", json=predict_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data["safe_colleges"]), 0)
        self.assertGreater(len(data["target_colleges"]), 0)
        self.assertGreater(len(data["psu_opportunities"]), 0)
        self.assertGreater(data["total_matches"], 0)

if __name__ == "__main__":
    unittest.main()
