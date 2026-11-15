import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

class TestAdvancedSuite(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_automata_endpoints(self):
        # 1. Fetch presets
        res = self.client.get("/automata/presets")
        self.assertEqual(res.status_code, 200)
        presets = res.json()["presets"]
        self.assertIn("ends_with_01", presets)
        self.assertIn("mod_3_binary", presets)

        # 2. Simulate string
        sim_payload = {
            "automaton": {
                "states": presets["ends_with_01"]["states"],
                "transitions": presets["ends_with_01"]["transitions"],
                "alphabet": ["0", "1"]
            },
            "input_string": "100101"
        }
        res = self.client.post("/automata/simulate", json=sim_payload)
        self.assertEqual(res.status_code, 200)
        sim_data = res.json()
        self.assertTrue(sim_data["accepted"])
        self.assertEqual(len(sim_data["steps"]), 6)

    def test_knowledge_graph_endpoints(self):
        # 1. Tree
        res = self.client.get("/knowledge-graph/tree")
        self.assertEqual(res.status_code, 200)
        tree = res.json()["tree"]
        self.assertGreater(len(tree), 5)

        # 2. Stats
        res = self.client.get("/knowledge-graph/stats")
        self.assertEqual(res.status_code, 200)
        stats = res.json()
        self.assertIn("predicted_gate_score", stats)
        self.assertIn("estimated_air_bracket", stats)

        # 3. Drill
        res = self.client.post("/knowledge-graph/drill")
        self.assertEqual(res.status_code, 200)
        drill = res.json()
        self.assertEqual(len(drill), 5)

    def test_code_sandbox_endpoints(self):
        # 1. Presets
        res = self.client.get("/sandbox/presets")
        self.assertEqual(res.status_code, 200)
        presets = res.json()["presets"]
        self.assertIn("pointer_arithmetic", presets)
        self.assertIn("struct_padding", presets)

        # 2. Trace
        trace_payload = {
            "preset_id": "pointer_arithmetic",
            "code": presets["pointer_arithmetic"]["code"],
            "language": "c"
        }
        res = self.client.post("/sandbox/trace", json=trace_payload)
        self.assertEqual(res.status_code, 200)
        trace_data = res.json()
        self.assertEqual(trace_data["final_output"], "10 20 21 ")
        self.assertGreater(len(trace_data["steps"]), 0)

    def test_audio_study_endpoints(self):
        # 1. Episodes
        res = self.client.get("/audio-study/episodes")
        self.assertEqual(res.status_code, 200)
        episodes = res.json()["episodes"]
        self.assertGreater(len(episodes), 0)

        # 2. Voice quiz
        res = self.client.get("/audio-study/voice-quiz")
        self.assertEqual(res.status_code, 200)
        quiz = res.json()
        self.assertGreater(len(quiz), 0)

    def test_notes_scanner_endpoints(self):
        process_payload = {
            "raw_text": "T(n) = 2T(n/2) + n. Case 2 of Master Theorem applies since n^(log_2 2) = n.",
            "subject": "Algorithms"
        }
        res = self.client.post("/notes-scanner/process", json=process_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("structured_markdown", data)
        self.assertGreater(len(data["auto_flashcards"]), 0)

if __name__ == "__main__":
    unittest.main()
