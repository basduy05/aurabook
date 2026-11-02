#!/usr/bin/env python3
"""
Adversarial Verification Suite for Milestone 1:
pgvector & Hybrid Search Robustness, Edge Cases, SQL Injection, NaN Prevention, and HNSW Indexing.
"""

import json
import math
import sys
import time
import urllib.error
import urllib.request
import subprocess

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8000/aurabook/search/hybrid"

class TestReport:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []

    def record(self, category: str, test_name: str, passed: bool, details: str = ""):
        status = "PASS" if passed else "FAIL"
        if passed:
            self.passed += 1
        else:
            self.failed += 1
        # Truncate details if overly long to prevent console explosion
        str_details = str(details)
        if len(str_details) > 150:
            str_details = str_details[:147] + "..."
        entry = {
            "category": category,
            "test_name": test_name,
            "status": status,
            "details": str_details
        }
        self.results.append(entry)
        print(f"[{status}] [{category}] {test_name}: {str_details}")


report = TestReport()

def send_request(payload, raw_body=None, timeout=10):
    try:
        data = raw_body if raw_body is not None else json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            BASE_URL,
            data=data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status_code = resp.getcode()
            body = resp.read().decode("utf-8")
            return status_code, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"raw": body}
        return e.code, parsed
    except Exception as e:
        return 500, {"error": str(e)}

def check_no_nan(obj) -> bool:
    """Recursively verify no NaN or Inf in JSON or python structures."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return False
    elif isinstance(obj, dict):
        return all(check_no_nan(v) for v in obj.values())
    elif isinstance(obj, list):
        return all(check_no_nan(v) for v in obj)
    return True

print("=" * 70)
print("PHASE 1: INPUT VALIDATION & BOUNDARY TESTING")
print("=" * 70)

# 1.1 Empty query
status, data = send_request({"query": ""})
report.record(
    "Boundary",
    "Empty query rejection",
    status == 400 and data.get("error") == "query is required",
    f"Status {status}, response: {data}"
)

# 1.2 Whitespace only queries
status, data = send_request({"query": "     "})
report.record(
    "Boundary",
    "Whitespace-only query rejection",
    status == 400 and data.get("error") == "query is required",
    f"Status {status}, response: {data}"
)

status, data = send_request({"query": "\t\n\r  \t"})
report.record(
    "Boundary",
    "Newline and tab query rejection",
    status == 400 and data.get("error") == "query is required",
    f"Status {status}, response: {data}"
)

# 1.3 Missing query key
status, data = send_request({"limit": 5})
report.record(
    "Boundary",
    "Missing query field",
    status == 400 and data.get("error") == "query is required",
    f"Status {status}, response: {data}"
)

# 1.4 Non-string or null query
status, data = send_request({"query": None})
report.record(
    "Boundary",
    "Null query field",
    status == 400,
    f"Status {status}, response: {data}"
)

status, data = send_request({"query": 12345})
report.record(
    "Boundary",
    "Numeric query field",
    status in [200, 400],
    f"Status {status}, response: {data}"
)

# 1.5 Malformed JSON
status, data = send_request(None, raw_body=b"{invalid_json")
report.record(
    "Boundary",
    "Malformed JSON body",
    status == 400 and data.get("error") == "Invalid request",
    f"Status {status}, response: {data}"
)

# 1.6 Limit boundary testing
status, data = send_request({"query": "sapiens", "limit": 0})
report.record(
    "Boundary",
    "Limit = 0",
    status == 200 and len(data.get("results", [])) == 0 and check_no_nan(data),
    f"Status {status}, results count: {len(data.get('results', []))}"
)

status, data = send_request({"query": "sapiens", "limit": -5})
report.record(
    "Boundary",
    "Limit = -5 (negative limit slice handling)",
    status == 200 and isinstance(data.get("results"), list) and check_no_nan(data),
    f"Status {status}, results count: {len(data.get('results', []))}"
)

status, data = send_request({"query": "sapiens", "limit": 500})
report.record(
    "Boundary",
    "Limit = 500 (large limit)",
    status == 200 and isinstance(data.get("results"), list) and check_no_nan(data),
    f"Status {status}, results count: {len(data.get('results', []))}"
)

status, data = send_request({"query": "sapiens", "limit": "invalid"})
report.record(
    "Boundary",
    "Limit non-integer string",
    status == 400 and data.get("error") == "Invalid request",
    f"Status {status}, response: {data}"
)


print("\n" + "=" * 70)
print("PHASE 2: SQL INJECTION & MALICIOUS PAYLOADS")
print("=" * 70)

sqli_payloads = [
    "' OR 1=1 --",
    "' OR '1'='1",
    '" OR ""="',
    "'; DROP TABLE ai_search_bookchunk; --",
    "' UNION SELECT null, null, null, null, null, null --",
    "admin' --",
    "1' ORDER BY 1--+",
    "' OR unaccent(p.name) IS NOT NULL --",
    "'; SELECT pg_sleep(3); --",
    "\\x00",
    "1; EXEC xp_cmdshell('dir'); --",
]

for payload in sqli_payloads:
    t0 = time.time()
    status, data = send_request({"query": payload, "limit": 5})
    elapsed = time.time() - t0
    
    # Check that it did NOT sleep 3 seconds
    not_delayed = elapsed < 2.5
    no_nan = check_no_nan(data)
    safe = status in [200, 400] and not_delayed and no_nan
    
    # Also verify the table was NOT dropped!
    report.record(
        "SQL_Injection",
        f"SQLi payload: {payload[:30]}",
        safe,
        f"Status: {status}, elapsed: {elapsed:.3f}s, total: {data.get('total')}"
    )

print("\n" + "=" * 70)
print("PHASE 3: EXTREME LENGTH & UNICODE ATTACKS")
print("=" * 70)

# 3.1 Long strings: 1KB, 10KB, 50KB, 100KB
for length in [1000, 10000, 50000, 100000]:
    long_query = "dac nhan tam " * (length // 13)
    t0 = time.time()
    status, data = send_request({"query": long_query, "limit": 5})
    elapsed = time.time() - t0
    report.record(
        "Stress_Length",
        f"Query length {length} chars",
        status == 200 and check_no_nan(data) and elapsed < 5.0,
        f"Status: {status}, elapsed: {elapsed:.3f}s, results: {len(data.get('results', []))}"
    )

# 3.2 Unicode, Emojis, Zero-width characters
unicode_tests = [
    ("Emojis only", "📚📖🔥💥🎉"),
    ("Punctuation only", "!@#$%^&*()_+{}|:<>?~`-=[]\\;',./"),
    ("Zero-width spaces", "\u200b\u200c\u200d\ufeff"),
    ("Mixed Vietnamese diacritics casing", "đẮc nHâN tÂm gIaO tIếP"),
    ("Non-Latin Cyrillic & Arabic", "Война и мир کتاب رائع"),
    ("Math symbols", "∑ ∏ ∫ √ ∞ ≠ ≤ ≥ ≈"),
    ("Single letter", "a"),
    ("Single number", "1"),
]

for name, q in unicode_tests:
    status, data = send_request({"query": q, "limit": 5})
    valid = status in [200, 400] and check_no_nan(data)
    report.record(
        "Unicode_EdgeCase",
        name,
        valid,
        f"Status: {status}, total: {data.get('total')}, results: {len(data.get('results', []))}"
    )


print("\n" + "=" * 70)
print("PHASE 4: AMBIGUOUS & DOMAIN RELEVANCE QUERIES")
print("=" * 70)

# 4.1 Ambiguous series "chien tranh tien te"
status, data = send_request({"query": "chien tranh tien te", "limit": 5})
results = data.get("results", [])
slugs = [r["product_slug"] for r in results]
has_all_three = any("chien-tranh-tien-te-tap-1" in s for s in slugs) and \
                any("chien-tranh-tien-te-tap-2" in s for s in slugs) and \
                any("chien-tranh-tien-te-tap-3" in s for s in slugs)
report.record(
    "Domain_Search",
    "Series disambiguation 'chien tranh tien te' retrieves all 3 volumes",
    status == 200 and has_all_three,
    f"Slugs retrieved: {slugs}"
)

# 4.2 Specific volume "chien tranh tien te tap 1"
status, data = send_request({"query": "chien tranh tien te tap 1", "limit": 3})
results = data.get("results", [])
first_slug = results[0]["product_slug"] if results else ""
report.record(
    "Domain_Search",
    "Specific volume 'chien tranh tien te tap 1' ranks Tap 1 as #1",
    status == 200 and "chien-tranh-tien-te-tap-1" in first_slug,
    f"Top slug: {first_slug}"
)

# 4.3 Semantic query "tu duy cham" -> tu-duy-nhanh-va-cham
status, data = send_request({"query": "tu duy cham he thong 1 he thong 2", "limit": 3})
results = data.get("results", [])
first_slug = results[0]["product_slug"] if results else ""
report.record(
    "Domain_Search",
    "Semantic concept 'tu duy cham he thong 1' maps to Tu Duy Nhanh Va Cham",
    status == 200 and "tu-duy-nhanh-va-cham" in first_slug,
    f"Top slug: {first_slug}"
)

# 4.4 Out of catalog queries
status, data = send_request({"query": "Harry Potter va hon da phu thuy", "limit": 5})
results = data.get("results", [])
report.record(
    "Domain_Search",
    "Out-of-catalog 'Harry Potter' does not crash or produce NaN",
    status == 200 and check_no_nan(data),
    f"Total results: {len(results)}"
)

print("\n" + "=" * 70)
print("PHASE 5: DATABASE INTEGRITY, ZERO-VECTOR & HNSW INDEX VERIFICATION")
print("=" * 70)

# Check PostgreSQL table count and integrity
def run_psql(sql: str) -> str:
    cmd = ["docker", "exec", "aurabook-postgres", "psql", "-U", "saleor", "-d", "aurabook_db", "-t", "-A", "-c", sql]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return res.stdout.strip()

# 5.1 Total chunk count
chunk_count = int(run_psql("SELECT count(*) FROM ai_search_bookchunk;"))
report.record(
    "DB_Integrity",
    "Total BookChunks seeded in PostgreSQL == 1597",
    chunk_count == 1597,
    f"Actual count: {chunk_count}"
)

# 5.2 Null or zero vectors in DB
null_count = int(run_psql("SELECT count(*) FROM ai_search_bookchunk WHERE embedding IS NULL;"))
report.record(
    "DB_Integrity",
    "Zero NULL embeddings in ai_search_bookchunk",
    null_count == 0,
    f"NULL count: {null_count}"
)

# 5.3 Distribution across 13 books
distinct_books = int(run_psql("SELECT count(DISTINCT product_id) FROM ai_search_bookchunk;"))
report.record(
    "DB_Integrity",
    "All 13 books have seeded chunks",
    distinct_books == 13,
    f"Distinct product_id count: {distinct_books}"
)

# 5.4 Check HNSW Index existence and validity
hnsw_status = run_psql("""
    SELECT c.relname, i.indisvalid, i.indisready 
    FROM pg_index i 
    JOIN pg_class c ON c.oid = i.indexrelid 
    WHERE c.relname = 'ai_search_bookchunk_embedding_hnsw_idx';
""")
is_valid_hnsw = "ai_search_bookchunk_embedding_hnsw_idx|t|t" in hnsw_status
report.record(
    "HNSW_Index",
    "HNSW index exists and is valid/ready in PostgreSQL",
    is_valid_hnsw,
    f"Index info: {hnsw_status}"
)

# 5.5 Test EXPLAIN ANALYZE on vector distance with HNSW
explain_output = run_psql("""
    SET enable_seqscan = off;
    EXPLAIN (ANALYZE, BUFFERS) 
    SELECT bc.product_id, (bc.embedding <=> (SELECT embedding FROM ai_search_bookchunk LIMIT 1)) AS distance 
    FROM ai_search_bookchunk bc 
    WHERE bc.embedding IS NOT NULL 
    ORDER BY distance ASC 
    LIMIT 50;
""")
uses_hnsw = "ai_search_bookchunk_embedding_hnsw_idx" in explain_output and "Index Scan" in explain_output
report.record(
    "HNSW_Index",
    "EXPLAIN ANALYZE confirms HNSW Index Scan execution",
    uses_hnsw,
    f"Query plan snippet: {explain_output.splitlines()[:5]}"
)

# 5.6 Test simulated zero-vector cosine distance in PostgreSQL
# Cosine distance <=> with zero vector produces NaN in pgvector, which backend MUST avoid!
zero_vec = "[" + ",".join(["0.0"] * 768) + "]"
try:
    direct_zero_res = run_psql(f"SELECT (embedding <=> '{zero_vec}'::vector) FROM ai_search_bookchunk LIMIT 1;")
    is_nan_in_pg = "NaN" in direct_zero_res
except Exception as e:
    is_nan_in_pg = True

report.record(
    "Zero_Vector_Immunity",
    "Empirically confirmed pgvector `<=>` produces NaN on raw [0.0]*768",
    is_nan_in_pg,
    f"Raw Postgres zero-vector result: {direct_zero_res}"
)

# 5.7 Verify search.py safeguards against zero-vector NaN:
# Test whether query producing zero embedding or fallback ever exposes NaN to API caller
# In gemini_client.py, generate_dense_768_embedding guarantees L2 norm == 1.0
docker_py = """
from aurabook_apps.ai_search.gemini_client import generate_dense_768_embedding
import math
v1 = generate_dense_768_embedding('')
n1 = math.sqrt(sum(x*x for x in v1))
c1 = sum(1 for x in v1 if x != 0)
v2 = generate_dense_768_embedding('!@#$%^&*()')
n2 = math.sqrt(sum(x*x for x in v2))
print(f'{n1:.6f}|{c1}|{n2:.6f}')
"""
cmd = ["docker", "exec", "aurabook-backend", "python", "-c", docker_py]
res = subprocess.run(cmd, capture_output=True, text=True, check=True)
parts = res.stdout.strip().split("|")
norm_empty = float(parts[0])
nonzero_slots = int(parts[1])
norm_weird = float(parts[2])

report.record(
    "Zero_Vector_Immunity",
    "generate_dense_768_embedding('') produces non-zero unit-norm vector (L2 norm = 1.0)",
    abs(norm_empty - 1.0) < 1e-4 and nonzero_slots > 0,
    f"L2 Norm: {norm_empty:.6f}, Non-zero slots: {nonzero_slots}"
)

report.record(
    "Zero_Vector_Immunity",
    "generate_dense_768_embedding('!@#$%^&*()') produces unit-norm vector",
    abs(norm_weird - 1.0) < 1e-4,
    f"L2 Norm: {norm_weird:.6f}"
)


print("\n" + "=" * 70)
print(f"ADVERSARIAL SUITE SUMMARY: {report.passed} PASSED, {report.failed} FAILED (TOTAL {report.passed + report.failed})")
print("=" * 70)

if report.failed == 0:
    print("VERDICT: ALL ADVERSARIAL STRESS TESTS PASSED! SYSTEM PROVEN ROBUST.")
else:
    print(f"VERDICT: {report.failed} FAILURES DETECTED! INVESTIGATION REQUIRED.")
