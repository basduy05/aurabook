import json

with open("tests/test_dataset_ground_truth.json", encoding="utf-8") as f:
    data = json.load(f)

cases_to_analyze = [
    "TC-T1-11", "TC-T1-12", "TC-T1-13", "TC-T1-14", "TC-T1-15",
    "TC-T2-11", "TC-T2-12", "TC-T2-13", "TC-T2-14", "TC-T2-15",
    "TC-T4-02", "TC-T4-04",
    "TC-T1-16", "TC-T1-17", "TC-T1-18", "TC-T1-19", "TC-T1-20",
    "TC-T2-16", "TC-T2-17", "TC-T2-18", "TC-T2-19", "TC-T2-20",
    "TC-T3-03", "TC-T3-04", "TC-T3-05", "TC-T4-03", "TC-T4-05"
]

tc_map = {tc["id"]: tc for tc in data["test_cases"]}

with open(".agents/teamwork/teamwork_explorer_m4_3/target_cases_utf8.txt", "w", encoding="utf-8") as out:
    for cid in cases_to_analyze:
        tc = tc_map.get(cid)
        if not tc:
            out.write(f"Missing {cid}\n")
            continue
        out.write(f"ID: {tc['id']} | Feature: {tc['feature']} | Tier: {tc['tier']}\n")
        out.write(f"Name: {tc['name']}\n")
        out.write(f"Description: {tc.get('description', '')}\n")
        out.write(f"Endpoint: {tc['request']['endpoint']} ({tc['request'].get('method', 'POST')})\n")
        out.write(f"Body: {json.dumps(tc['request'].get('body'), ensure_ascii=False)}\n")
        out.write(f"Expected Status: {tc['expected'].get('status_code', 200)}\n")
        out.write(f"Required KW: {json.dumps(tc['expected'].get('required_keywords', []), ensure_ascii=False)}\n")
        out.write(f"Forbidden KW: {json.dumps(tc['expected'].get('forbidden_keywords', []), ensure_ascii=False)}\n")
        out.write(f"Grounding: {tc.get('evaluation', {}).get('grounding', '')}\n")
        out.write(f"Intent: {tc.get('evaluation', {}).get('intent_resolution', '')}\n")
        out.write("-" * 60 + "\n")
