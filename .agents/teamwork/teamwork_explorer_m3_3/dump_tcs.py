import json
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

with open(r'C:\Users\basduy05\Downloads\aurabook\tests\test_dataset_ground_truth.json', encoding='utf-8') as f:
    data = json.load(f)

target_ids = [
    'TC-T1-06', 'TC-T1-07', 'TC-T1-08', 'TC-T1-09', 'TC-T1-10',
    'TC-T2-06', 'TC-T2-07', 'TC-T2-08', 'TC-T2-09', 'TC-T2-10',
    'TC-T2-20', 'TC-T3-01', 'TC-T3-02'
]

cases = [tc for tc in data['test_cases'] if tc['id'] in target_ids]

for tc in cases:
    print(f"ID: {tc['id']}")
    print(f"Name: {tc['name']}")
    print(f"Feature: {tc['feature']} | Tier: {tc['tier']}")
    print(f"Description: {tc.get('description')}")
    req = tc['request']
    print(f"Endpoint: {req.get('endpoint')}")
    print(f"Method: {req.get('method', 'GET')}")
    print(f"Params: {req.get('params')}")
    print(f"Body: {req.get('body')}")
    print(f"Headers: {req.get('headers')}")
    exp = tc['expected']
    print(f"Status Code: {exp.get('status_code')}")
    print(f"Required Keywords: {exp.get('required_keywords')}")
    print(f"Forbidden Keywords: {exp.get('forbidden_keywords')}")
    print(f"Forbidden First: {exp.get('forbidden_first_result')}")
    print(f"Min Results: {exp.get('min_results_count')}")
    print(f"Schema Keys: {exp.get('schema_keys')}")
    print(f"Expected Count: {exp.get('expected_count')}")
    print(f"Min Length: {exp.get('min_length')}")
    print(f"Evaluation: {tc.get('evaluation')}")
    print("=" * 60)
