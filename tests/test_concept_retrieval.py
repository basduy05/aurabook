import io
import sys
import json
import requests

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

FRONTEND_GRAPHRAG_URL = "http://localhost:3000/api/ai/graphrag/search"
BACKEND_URL = "http://localhost:8000/aurabook/search/hybrid"
FRONTEND_AI_URL = "http://localhost:3000/api/search/ai"

print("=" * 80)
print("TESTING CONCEPT RETRIEVAL IN GRAPHRAG")
print("=" * 80)

concept_queries = {
    "tâm lý học": ["tu-duy-nhanh-va-cham", "dac-nhan-tam", "bon-thoa-uoc"],
    "tam ly hoc": ["tu-duy-nhanh-va-cham", "dac-nhan-tam", "bon-thoa-uoc"],
    "kinh tế học": ["chien-tranh-tien-te-tap-1", "tu-duy-nhanh-va-cham", "tri-tue-do-thai"],
    "kinh te hoc": ["chien-tranh-tien-te-tap-1", "tu-duy-nhanh-va-cham", "tri-tue-do-thai"],
}

all_passed = True
for q, expected_pool in concept_queries.items():
    print(f"\nConcept: {repr(q)}")
    r_gr = requests.get(FRONTEND_GRAPHRAG_URL, params={"query": q}, timeout=5)
    gr_data = r_gr.json() if r_gr.status_code == 200 else {}
    products = gr_data.get("products", [])
    matched_slugs = [p.get("slug") for p in products]
    reasoning = gr_data.get("reasoningSummary", "")
    print(f"  GraphRAG count: {len(products)}")
    print(f"  GraphRAG slugs: {matched_slugs}")
    print(f"  Reasoning summary: {reasoning[:120]}...")
    
    overlap = set(matched_slugs).intersection(set(expected_pool))
    if len(overlap) > 0 and len(products) > 0:
        print(f"  [PASSED] Found expected concept books: {list(overlap)}")
    else:
        print(f"  [FAILED] Expected any of {expected_pool}, got {matched_slugs}")
        all_passed = False

    # Also test Backend
    r_be = requests.post(BACKEND_URL, json={"query": q, "limit": 5, "alpha": 0.5}, timeout=5)
    be_data = r_be.json() if r_be.status_code == 200 else {}
    be_slugs = [x.get("product_slug") for x in be_data.get("results", [])]
    print(f"  Backend slugs: {be_slugs}")

print("-" * 80)
print("CONCEPT RETRIEVAL OVERALL:", "ALL PASSED" if all_passed else "FAILED")
print("=" * 80)

if not all_passed:
    sys.exit(1)
