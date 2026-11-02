import json

with open("tests/test_dataset_ground_truth.json", encoding="utf-8") as f:
    data = json.load(f)

for tc in data.get("test_cases", []):
    feat = tc.get("feature", "")
    req = tc.get("request", {})
    endpoint = req.get("endpoint", "")
    params = req.get("params", {})
    body = req.get("body", {})
    q = body.get("query") or params.get("query")
    if "search" in feat or "search" in endpoint or "hybrid" in endpoint:
        print(f"{tc['id']} | {feat:15} | {tc.get('name', ''):45} | endpoint: {endpoint} | q: {q}")
