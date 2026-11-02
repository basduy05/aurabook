#!/usr/bin/env python3
"""
Empirical Challenger 2 Adversarial Stress Suite for Milestone 1 Iteration 2 Gate Verification.
Author: teamwork_challenger_m1_it2_2
Target: Backend AI Search API (/aurabook/search/hybrid and /aurabook/search/rag)
"""

import json
import math
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

HYBRID_URL = "http://localhost:8000/aurabook/search/hybrid"
RAG_URL = "http://localhost:8000/aurabook/search/rag"


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
        str_details = str(details)
        if len(str_details) > 160:
            str_details = str_details[:157] + "..."
        entry = {
            "category": category,
            "test_name": test_name,
            "status": status,
            "details": str_details,
        }
        self.results.append(entry)
        print(f"[{status}] [{category}] {test_name}: {str_details}")


report = TestReport()


def make_request(url, payload=None, raw_body=None, timeout=10, is_sse=False):
    t0 = time.perf_counter()
    try:
        if raw_body is not None:
            data = raw_body.encode("utf-8") if isinstance(raw_body, str) else raw_body
        else:
            data = json.dumps(payload).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            elapsed = time.perf_counter() - t0
            status_code = resp.getcode()
            if is_sse:
                # Read initial lines of SSE stream to confirm response
                lines = []
                for _ in range(5):
                    line = resp.readline()
                    if not line:
                        break
                    lines.append(line.decode("utf-8", errors="replace"))
                return status_code, "".join(lines), elapsed
            body = resp.read().decode("utf-8")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = body
            return status_code, parsed, elapsed
    except urllib.error.HTTPError as e:
        elapsed = time.perf_counter() - t0
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed, elapsed
    except Exception as e:
        elapsed = time.perf_counter() - t0
        return 500, {"client_error": str(e)}, elapsed


print("=" * 80)
print("CHALLENGER 2 - SECTION 1: MANDATORY BOUNDARY PAYLOAD VERIFICATION (HYBRID)")
print("=" * 80)

# 1.1 {"query": null}
code, body, el = make_request(HYBRID_URL, {"query": None})
report.record(
    "Hybrid_Boundary",
    "query: null returns 400 not 500",
    code == 400 and isinstance(body, dict) and "Query must be a non-empty string" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)

# 1.2 {"query": 12345}
code, body, el = make_request(HYBRID_URL, {"query": 12345})
report.record(
    "Hybrid_Boundary",
    "query: 12345 (numeric) returns 400 not 500",
    code == 400 and isinstance(body, dict) and "Query must be a non-empty string" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)

# 1.3 {"query": []}
code, body, el = make_request(HYBRID_URL, {"query": []})
report.record(
    "Hybrid_Boundary",
    "query: [] (list) returns 400 not 500",
    code == 400 and isinstance(body, dict) and "Query must be a non-empty string" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)

# 1.4 {"query": {}}
code, body, el = make_request(HYBRID_URL, {"query": {}})
report.record(
    "Hybrid_Boundary",
    "query: {} (dict) returns 400 not 500",
    code == 400 and isinstance(body, dict) and "Query must be a non-empty string" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)

# 1.5 {"query": ""}
code, body, el = make_request(HYBRID_URL, {"query": ""})
report.record(
    "Hybrid_Boundary",
    "query: empty string returns 400",
    code == 400 and isinstance(body, dict) and "query is required" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)

# 1.6 {"query": "   \n\t  "}
code, body, el = make_request(HYBRID_URL, {"query": "   \n\t  "})
report.record(
    "Hybrid_Boundary",
    "query: whitespace/tab/newline only returns 400",
    code == 400 and isinstance(body, dict) and "query is required" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)

# 1.7 Missing "query" key: {}
code, body, el = make_request(HYBRID_URL, {})
report.record(
    "Hybrid_Boundary",
    "query: missing key returns 400",
    code == 400 and isinstance(body, dict) and "query is required" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)


print("\n" + "=" * 80)
print("CHALLENGER 2 - SECTION 2: MANDATORY BOUNDARY PAYLOAD VERIFICATION (RAG)")
print("=" * 80)

# 2.1 {"query": null}
code, body, el = make_request(RAG_URL, {"query": None})
report.record(
    "RAG_Boundary",
    "RAG query: null returns 400 not 500",
    code == 400 and isinstance(body, dict) and "Query must be a non-empty string" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)

# 2.2 {"query": 12345}
code, body, el = make_request(RAG_URL, {"query": 12345})
report.record(
    "RAG_Boundary",
    "RAG query: 12345 (numeric) returns 400 not 500",
    code == 400 and isinstance(body, dict) and "Query must be a non-empty string" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)

# 2.3 {"query": []}
code, body, el = make_request(RAG_URL, {"query": []})
report.record(
    "RAG_Boundary",
    "RAG query: [] (list) returns 400 not 500",
    code == 400 and isinstance(body, dict) and "Query must be a non-empty string" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)

# 2.4 {"query": {}}
code, body, el = make_request(RAG_URL, {"query": {}})
report.record(
    "RAG_Boundary",
    "RAG query: {} (dict) returns 400 not 500",
    code == 400 and isinstance(body, dict) and "Query must be a non-empty string" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)

# 2.5 {"query": ""}
code, body, el = make_request(RAG_URL, {"query": ""})
report.record(
    "RAG_Boundary",
    "RAG query: empty string returns 400",
    code == 400 and isinstance(body, dict) and "query is required" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)

# 2.6 {"query": "   \n\t  "}
code, body, el = make_request(RAG_URL, {"query": "   \n\t  "})
report.record(
    "RAG_Boundary",
    "RAG query: whitespace/tab/newline only returns 400",
    code == 400 and isinstance(body, dict) and "query is required" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)

# 2.7 Missing "query" key: {}
code, body, el = make_request(RAG_URL, {})
report.record(
    "RAG_Boundary",
    "RAG query: missing key returns 400",
    code == 400 and isinstance(body, dict) and "query is required" in body.get("error", ""),
    f"Status {code}, err: {body.get('error') if isinstance(body, dict) else body}",
)


print("\n" + "=" * 80)
print("CHALLENGER 2 - SECTION 3: CPU DoS & LATENCY STRESS TESTING (HYBRID & RAG)")
print("=" * 80)

# 3.1 100,000 characters on Hybrid Search
payload_100k = "đắc nhân tâm " * 7500  # ~105,000 chars
code, body, el = make_request(HYBRID_URL, {"query": payload_100k, "limit": 5})
report.record(
    "DoS_Stress",
    "100,000 char query to HybridSearch latency < 1.0s",
    code == 200 and el < 1.0 and isinstance(body, dict) and len(body.get("query", "")) == 500,
    f"Status {code}, elapsed {el:.3f}s, query len in resp: {len(body.get('query', '')) if isinstance(body, dict) else 'N/A'}",
)

# 3.2 500,000 characters on Hybrid Search
payload_500k = "tâm lý học ứng xử và giao tiếp xã hội " * 13500  # ~513,000 chars
code, body, el = make_request(HYBRID_URL, {"query": payload_500k, "limit": 5})
report.record(
    "DoS_Stress",
    "500,000 char query to HybridSearch latency < 1.0s",
    code == 200 and el < 1.0 and isinstance(body, dict) and len(body.get("query", "")) == 500,
    f"Status {code}, elapsed {el:.3f}s, truncated cleanly to 500 chars",
)

# 3.3 100,000 characters on RAG Endpoint
code, body, el = make_request(RAG_URL, {"query": payload_100k}, is_sse=True)
report.record(
    "DoS_Stress",
    "100,000 char query to RAGQueryView latency < 1.0s",
    code == 200 and el < 1.0,
    f"Status {code}, elapsed {el:.3f}s, response snippet: {repr(body[:60])}",
)

# 3.4 500,000 characters on RAG Endpoint
code, body, el = make_request(RAG_URL, {"query": payload_500k}, is_sse=True)
report.record(
    "DoS_Stress",
    "500,000 char query to RAGQueryView latency < 1.0s",
    code == 200 and el < 1.0,
    f"Status {code}, elapsed {el:.3f}s, response snippet: {repr(body[:60])}",
)


print("\n" + "=" * 80)
print("CHALLENGER 2 - SECTION 4: ROOT PAYLOAD TYPE & MALFORMED BODY MUTATIONS")
print("=" * 80)

# 4.1 Non-dictionary JSON root: array
code, body, el = make_request(HYBRID_URL, raw_body="[1, 2, 3]")
report.record(
    "Root_Type",
    "HybridSearch array root returns 400",
    code == 400 and isinstance(body, dict) and body.get("error") == "Invalid request",
    f"Status {code}, resp: {body}",
)

# 4.2 Non-dictionary JSON root: string
code, body, el = make_request(HYBRID_URL, raw_body='"just a string"')
report.record(
    "Root_Type",
    "HybridSearch string root returns 400",
    code == 400 and isinstance(body, dict) and body.get("error") == "Invalid request",
    f"Status {code}, resp: {body}",
)

# 4.3 Non-dictionary JSON root: integer
code, body, el = make_request(HYBRID_URL, raw_body="12345")
report.record(
    "Root_Type",
    "HybridSearch integer root returns 400",
    code == 400 and isinstance(body, dict) and body.get("error") == "Invalid request",
    f"Status {code}, resp: {body}",
)

# 4.4 Non-dictionary JSON root: boolean
code, body, el = make_request(HYBRID_URL, raw_body="true")
report.record(
    "Root_Type",
    "HybridSearch boolean root returns 400",
    code == 400 and isinstance(body, dict) and body.get("error") == "Invalid request",
    f"Status {code}, resp: {body}",
)

# 4.5 Malformed JSON syntax
code, body, el = make_request(HYBRID_URL, raw_body='{"query": "test", broken_json')
report.record(
    "Root_Type",
    "HybridSearch malformed JSON returns 400",
    code == 400 and isinstance(body, dict) and body.get("error") == "Invalid request",
    f"Status {code}, resp: {body}",
)

# 4.6 Same for RAG: array root
code, body, el = make_request(RAG_URL, raw_body="[1, 2, 3]")
report.record(
    "Root_Type",
    "RAG array root returns 400",
    code == 400 and isinstance(body, dict) and body.get("error") == "Invalid request",
    f"Status {code}, resp: {body}",
)

# 4.7 RAG: malformed JSON syntax
code, body, el = make_request(RAG_URL, raw_body='{"query": "test", broken_json')
report.record(
    "Root_Type",
    "RAG malformed JSON returns 400",
    code == 400 and isinstance(body, dict) and body.get("error") == "Invalid request",
    f"Status {code}, resp: {body}",
)


print("\n" + "=" * 80)
print("CHALLENGER 2 - SECTION 5: PARAMETER ADVERSARIAL MUTATIONS (LIMIT & PRODUCT_ID)")
print("=" * 80)

# 5.1 Limit = None
code, body, el = make_request(HYBRID_URL, {"query": "dac nhan tam", "limit": None})
report.record(
    "Limit_Mutation",
    "Limit: null defaults cleanly without 500",
    code == 200 and isinstance(body, dict) and "results" in body,
    f"Status {code}, results count: {len(body.get('results', [])) if isinstance(body, dict) else 'N/A'}",
)

# 5.2 Limit = float (3.14)
code, body, el = make_request(HYBRID_URL, {"query": "dac nhan tam", "limit": 3.14})
report.record(
    "Limit_Mutation",
    "Limit: float handled gracefully without 500",
    code in (200, 400),
    f"Status {code}, resp: {body}",
)

# 5.3 Limit = massive integer (10,000,000)
code, body, el = make_request(HYBRID_URL, {"query": "dac nhan tam", "limit": 10000000})
report.record(
    "Limit_Mutation",
    "Limit: 10,000,000 does not OOM or crash",
    code == 200 and isinstance(body, dict) and len(body.get("results", [])) <= 1597,
    f"Status {code}, retrieved {len(body.get('results', [])) if isinstance(body, dict) else 'N/A'} chunks",
)

# 5.4 Limit = negative number (-50)
code, body, el = make_request(HYBRID_URL, {"query": "dac nhan tam", "limit": -50})
report.record(
    "Limit_Mutation",
    "Limit: negative slice returns 0 results cleanly",
    code == 200 and isinstance(body, dict) and len(body.get("results", [])) == 0,
    f"Status {code}, results count: {len(body.get('results', [])) if isinstance(body, dict) else 'N/A'}",
)

# 5.5 Limit = list []
code, body, el = make_request(HYBRID_URL, {"query": "dac nhan tam", "limit": []})
report.record(
    "Limit_Mutation",
    "Limit: list [] returns 400 Invalid request",
    code == 400 and isinstance(body, dict) and body.get("error") == "Invalid request",
    f"Status {code}, resp: {body}",
)

# 5.6 Limit = object {}
code, body, el = make_request(HYBRID_URL, {"query": "dac nhan tam", "limit": {}})
report.record(
    "Limit_Mutation",
    "Limit: dict {} returns 400 Invalid request",
    code == 400 and isinstance(body, dict) and body.get("error") == "Invalid request",
    f"Status {code}, resp: {body}",
)

# 5.7 RAG product_id = numeric (123)
code, body, el = make_request(RAG_URL, {"query": "dac nhan tam", "product_id": 123}, is_sse=True)
report.record(
    "RAG_ProductID",
    "RAG product_id: numeric converted to string without 500",
    code == 200,
    f"Status {code}, response preview: {repr(body[:60])}",
)

# 5.8 RAG product_id = null
code, body, el = make_request(RAG_URL, {"query": "dac nhan tam", "product_id": None}, is_sse=True)
report.record(
    "RAG_ProductID",
    "RAG product_id: null defaults to global search without 500",
    code == 200,
    f"Status {code}, response preview: {repr(body[:60])}",
)

# 5.9 RAG product_id = SQL injection string
code, body, el = make_request(RAG_URL, {"query": "dac nhan tam", "product_id": "' OR 1=1 --"}, is_sse=True)
report.record(
    "RAG_ProductID",
    "RAG product_id: SQLi payload handled safely by ORM",
    code == 200,
    f"Status {code}, response preview: {repr(body[:60])}",
)


print("\n" + "=" * 80)
print("CHALLENGER 2 - SECTION 6: CONCURRENT BURST STRESS TEST (20 PARALLEL QUERIES)")
print("=" * 80)

def burst_worker(idx):
    payload = {"query": f"truy vấn đối kháng đồng thời #{idx} đắc nhân tâm " * 50, "limit": 5}
    return make_request(HYBRID_URL, payload)

t_start = time.perf_counter()
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(burst_worker, i) for i in range(20)]
    burst_results = [f.result() for f in futures]
t_burst = time.perf_counter() - t_start

all_200 = all(r[0] == 200 for r in burst_results)
max_latency = max(r[2] for r in burst_results)
report.record(
    "Concurrency_Burst",
    "20 concurrent 2500-char hybrid search queries all return 200",
    all_200 and max_latency < 2.0,
    f"Total burst time: {t_burst:.3f}s, max single query latency: {max_latency:.3f}s, all 200: {all_200}",
)


print("\n" + "=" * 80)
print("CHALLENGER 2 DEEP ADVERSARIAL SUITE SUMMARY")
print("=" * 80)
print(f"TOTAL TESTS: {len(report.results)}")
print(f"PASSED     : {report.passed}")
print(f"FAILED     : {report.failed}")
print("=" * 80)

if report.failed == 0:
    print("VERDICT: EMPIRICALLY CONFIRMED - ALL ADVERSARIAL STRESS CHALLENGES PASSED.")
else:
    print(f"VERDICT: FAILURES DETECTED ({report.failed} failed tests)!")

sys.exit(0 if report.failed == 0 else 1)
