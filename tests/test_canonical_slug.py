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

CANONICAL_SALEOR_SLUG = "chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than"

print("=" * 80)
print(f"VERIFYING CANONICAL SLUG: {CANONICAL_SALEOR_SLUG}")
print("=" * 80)

# 1. Query Backend Search for "chu nghia khac ky"
r_be = requests.post("http://localhost:8000/aurabook/search/hybrid", json={"query": "chủ nghĩa khắc kỷ", "limit": 5})
be_data = r_be.json() if r_be.status_code == 200 else {}
be_slugs = [x.get("product_slug") for x in be_data.get("results", [])]
print(f"Backend 'chủ nghĩa khắc kỷ' results: {be_slugs}")
if be_slugs and be_slugs[0] == CANONICAL_SALEOR_SLUG:
    print(f"  [PASSED] Backend returned exact canonical slug: {be_slugs[0]}")
else:
    print(f"  [CHECK] Backend returned: {be_slugs}")

# 2. Query Frontend AI Search for "chu nghia khac ky"
r_fe = requests.post("http://localhost:3000/api/search/ai", json={"query": "chủ nghĩa khắc kỷ", "limit": 5})
fe_data = r_fe.json() if r_fe.status_code == 200 else {}
fe_slugs = [x.get("product_slug") for x in fe_data.get("results", [])]
print(f"Frontend AI Search 'chủ nghĩa khắc kỷ' results: {fe_slugs}")
if fe_slugs and fe_slugs[0] == CANONICAL_SALEOR_SLUG:
    print(f"  [PASSED] Frontend AI returned exact canonical slug: {fe_slugs[0]}")
else:
    print(f"  [CHECK] Frontend AI returned: {fe_slugs}")

# 3. Query GraphRAG for "chu nghia khac ky"
r_gr = requests.get("http://localhost:3000/api/ai/graphrag/search", params={"query": "chủ nghĩa khắc kỷ"})
gr_data = r_gr.json() if r_gr.status_code == 200 else {}
gr_products = gr_data.get("products", [])
gr_slugs = [p.get("slug") for p in gr_products]
print(f"Frontend GraphRAG 'chủ nghĩa khắc kỷ' results: {gr_slugs}")

# 4. Check entity resolution in GraphRAG for canonical slug directly
r_gr_canon = requests.get("http://localhost:3000/api/ai/graphrag/search", params={"query": CANONICAL_SALEOR_SLUG})
gr_canon_data = r_gr_canon.json() if r_gr_canon.status_code == 200 else {}
gr_canon_slugs = [p.get("slug") for p in gr_canon_data.get("products", [])]
print(f"GraphRAG query by canonical slug '{CANONICAL_SALEOR_SLUG}' results: {gr_canon_slugs}")

# 5. Check entity resolution for the shortened variant without "-va-"
r_gr_short = requests.get("http://localhost:3000/api/ai/graphrag/search", params={"query": "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than"})
gr_short_data = r_gr_short.json() if r_gr_short.status_code == 200 else {}
gr_short_slugs = [p.get("slug") for p in gr_short_data.get("products", [])]
print(f"GraphRAG query by shortened slug '...-binh-than' results: {gr_short_slugs}")
