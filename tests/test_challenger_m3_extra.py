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

BACKEND_URL = "http://localhost:8000/aurabook/search/hybrid"
FRONTEND_AI_URL = "http://localhost:3000/api/search/ai"
FRONTEND_GRAPHRAG_URL = "http://localhost:3000/api/ai/graphrag/search"

queries = [
    "Chúa tể những chiếc nhẫn",
    "Chiến tranh giữa các vì sao",
    "Tam Quốc Diễn Nghĩa",
    "Bí kíp võ công Kim Dung",
    "muon kiep nhan sinh",
    "Bo gia",
    "Bố già",
    "Naruto",
    "🔥🎉🚀🦄📖📚",
    "<script>alert('xss')</script>",
]

print("=" * 80)
print("VERIFYING OUT-OF-CATALOG ENTITIES & INJECTIONS (MUST RETURN 0 RESULTS)")
print("=" * 80)

all_passed = True
for q in queries:
    print(f"Testing: {repr(q)}")
    # 1. Backend
    r_be = requests.post(BACKEND_URL, json={"query": q, "limit": 10}, timeout=5)
    be_data = r_be.json() if r_be.status_code == 200 else {}
    be_cnt = len(be_data.get("results", []))
    be_slugs = [x.get("product_slug") for x in be_data.get("results", [])]
    
    # 2. Frontend AI Search
    r_fe = requests.post(FRONTEND_AI_URL, json={"query": q, "limit": 10}, timeout=5)
    fe_data = r_fe.json() if r_fe.status_code == 200 else {}
    fe_cnt = len(fe_data.get("results", []))
    fe_slugs = [x.get("product_slug") for x in fe_data.get("results", [])]
    
    # 3. Frontend GraphRAG
    r_gr = requests.get(FRONTEND_GRAPHRAG_URL, params={"query": q}, timeout=5)
    gr_data = r_gr.json() if r_gr.status_code == 200 else {}
    gr_cnt = len(gr_data.get("products", []))
    gr_slugs = [x.get("slug") for x in gr_data.get("products", [])]
    
    print(f"  -> BE results ({be_cnt}): {be_slugs}")
    print(f"  -> FE results ({fe_cnt}): {fe_slugs}")
    print(f"  -> GR results ({gr_cnt}): {gr_slugs}")
    
    if be_cnt != 0 or fe_cnt != 0 or gr_cnt != 0:
        print(f"  [FAILED] Non-zero results for {repr(q)}")
        all_passed = False
    else:
        print(f"  [PASSED] 0 results across all 3 endpoints")

print("-" * 80)
print("OUT-OF-CATALOG RESULT:", "ALL PASSED (0 RESULTS)" if all_passed else "FAILED")
print("=" * 80)

if not all_passed:
    sys.exit(1)
