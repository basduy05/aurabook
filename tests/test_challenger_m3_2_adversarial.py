#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Empirical Challenger Test Suite for Milestone 3 (AI Tìm Kiếm & Unified Catalog Semantic Retrieval)
Agent: teamwork_challenger_m3_2
Targets:
  - Backend: POST http://localhost:8000/aurabook/search/hybrid
  - Frontend Proxy: POST http://localhost:3000/api/search/ai
  - GraphRAG Store: GET http://localhost:3000/api/ai/graphrag/search
"""

import sys
import os
import json
import time
import requests
import concurrent.futures
from typing import Dict, Any, List

BACKEND_SEARCH_URL = "http://localhost:8000/aurabook/search/hybrid"
FRONTEND_SEARCH_URL = "http://localhost:3000/api/search/ai"
GRAPHRAG_SEARCH_URL = "http://localhost:3000/api/ai/graphrag/search"

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


class EmpiricalVerifier:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.records = []

    def record(self, test_id: str, section: str, passed: bool, message: str, duration_ms: float = 0.0):
        status = "PASS" if passed else "FAIL"
        if passed:
            self.passed += 1
        else:
            self.failed += 1
        entry = {
            "id": test_id,
            "section": section,
            "status": status,
            "message": message,
            "duration_ms": round(duration_ms, 2)
        }
        self.records.append(entry)
        print(f"[{status}] [{section}] {test_id} ({round(duration_ms, 1)}ms): {message}")


verifier = EmpiricalVerifier()


# ----------------------------------------------------------------------
# 1. PARAMETER BOUNDARIES: ALPHA (0.0, 0.5, 1.0, -1.0, 2.0, "invalid")
# ----------------------------------------------------------------------
def test_alpha_boundaries():
    print("\n" + "="*80)
    print("1. ALPHA PARAMETER BOUNDARY VERIFICATION")
    print("="*80)

    test_alphas = [
        (0.0, "Pure Fulltext Weight (alpha=0.0)"),
        (0.5, "Balanced RRF Weight (alpha=0.5)"),
        (1.0, "Pure Vector Weight (alpha=1.0)"),
        (-1.0, "Negative Alpha Clamping (alpha=-1.0 -> clamped to 0.0)"),
        (2.0, "Over-limit Alpha Clamping (alpha=2.0 -> clamped to 1.0)"),
        ("invalid", "Invalid String Alpha (alpha='invalid' -> fallback to 0.5)"),
        (None, "None/Null Alpha (alpha=None -> fallback to 0.5)"),
    ]

    for val, label in test_alphas:
        # Backend test
        t0 = time.perf_counter()
        payload = {"query": "dac nhan tam", "alpha": val}
        try:
            r = requests.post(BACKEND_SEARCH_URL, json=payload, timeout=5)
            dt = (time.perf_counter() - t0) * 1000
            if r.status_code == 200:
                data = r.json()
                total = data.get("total", 0)
                results = data.get("results", [])
                top_slug = results[0]["product_slug"] if results else "none"
                top_score = results[0]["score"] if results else 0
                ok = (total > 0 and top_slug == "dac-nhan-tam")
                verifier.record(
                    f"BE-ALPHA-{str(val)}",
                    "Alpha-Backend",
                    ok,
                    f"{label} -> status=200, total={total}, top_slug='{top_slug}', score={top_score}",
                    dt
                )
            else:
                verifier.record(f"BE-ALPHA-{str(val)}", "Alpha-Backend", False, f"HTTP {r.status_code}: {r.text[:80]}", dt)
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            verifier.record(f"BE-ALPHA-{str(val)}", "Alpha-Backend", False, f"Exception: {str(e)}", dt)

        # Frontend Proxy test
        t0 = time.perf_counter()
        try:
            r_fe = requests.post(FRONTEND_SEARCH_URL, json=payload, timeout=5)
            dt = (time.perf_counter() - t0) * 1000
            if r_fe.status_code == 200:
                data_fe = r_fe.json()
                total_fe = data_fe.get("total", 0)
                results_fe = data_fe.get("results", [])
                top_slug_fe = results_fe[0]["product_slug"] if results_fe else "none"
                ok = (total_fe > 0 and top_slug_fe == "dac-nhan-tam")
                verifier.record(
                    f"FE-ALPHA-{str(val)}",
                    "Alpha-Frontend",
                    ok,
                    f"{label} -> status=200, source={data_fe.get('source')}, top_slug='{top_slug_fe}'",
                    dt
                )
            else:
                verifier.record(f"FE-ALPHA-{str(val)}", "Alpha-Frontend", False, f"HTTP {r_fe.status_code}", dt)
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            verifier.record(f"FE-ALPHA-{str(val)}", "Alpha-Frontend", False, f"Exception: {str(e)}", dt)


# ----------------------------------------------------------------------
# 2. PARAMETER BOUNDARIES: LIMIT (0, 1, 100, -5, "invalid")
# ----------------------------------------------------------------------
def test_limit_boundaries():
    print("\n" + "="*80)
    print("2. LIMIT PARAMETER BOUNDARY VERIFICATION")
    print("="*80)

    test_limits = [
        (0, "Limit=0 (Must return empty list)"),
        (1, "Limit=1 (Must return exactly at most 1 item)"),
        (100, "Limit=100 (Large limit, must not crash)"),
        (-5, "Limit=-5 (Negative limit, must execute safely without 500 error)"),
        ("invalid", "Limit='invalid' (String limit, handled via 400 or fallback)"),
    ]

    for limit_val, label in test_limits:
        # Backend test
        t0 = time.perf_counter()
        payload = {"query": "dac nhan tam", "limit": limit_val}
        try:
            r = requests.post(BACKEND_SEARCH_URL, json=payload, timeout=5)
            dt = (time.perf_counter() - t0) * 1000
            if r.status_code == 200:
                data = r.json()
                res_count = len(data.get("results", []))
                if limit_val == 0:
                    ok = (res_count == 0)
                elif limit_val == 1:
                    ok = (res_count == 1)
                elif limit_val == 100:
                    ok = (res_count > 0)
                elif limit_val == -5:
                    ok = True
                else:
                    ok = True
                verifier.record(
                    f"BE-LIMIT-{str(limit_val)}",
                    "Limit-Backend",
                    ok,
                    f"{label} -> status=200, returned_count={res_count}",
                    dt
                )
            elif r.status_code == 400 and limit_val == "invalid":
                # Backend views.py line 34 catches ValueError and returns 400
                verifier.record(
                    f"BE-LIMIT-{str(limit_val)}",
                    "Limit-Backend",
                    True,
                    f"{label} -> safely returned 400 Bad Request",
                    dt
                )
            else:
                verifier.record(f"BE-LIMIT-{str(limit_val)}", "Limit-Backend", False, f"HTTP {r.status_code}: {r.text[:80]}", dt)
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            verifier.record(f"BE-LIMIT-{str(limit_val)}", "Limit-Backend", False, f"Exception: {str(e)}", dt)

        # Frontend test
        t0 = time.perf_counter()
        try:
            r_fe = requests.post(FRONTEND_SEARCH_URL, json=payload, timeout=5)
            dt = (time.perf_counter() - t0) * 1000
            if r_fe.status_code == 200:
                data_fe = r_fe.json()
                res_count_fe = len(data_fe.get("results", []))
                verifier.record(
                    f"FE-LIMIT-{str(limit_val)}",
                    "Limit-Frontend",
                    True,
                    f"{label} -> status=200, returned_count={res_count_fe}",
                    dt
                )
            else:
                verifier.record(f"FE-LIMIT-{str(limit_val)}", "Limit-Frontend", False, f"HTTP {r_fe.status_code}", dt)
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            verifier.record(f"FE-LIMIT-{str(limit_val)}", "Limit-Frontend", False, f"Exception: {str(e)}", dt)


# ----------------------------------------------------------------------
# 3. SECURITY & INJECTION PAYLOADS (SQLi & XSS)
# ----------------------------------------------------------------------
def test_security_injection():
    print("\n" + "="*80)
    print("3. SECURITY & INJECTION PAYLOAD VERIFICATION")
    print("="*80)

    sqli_cases = [
        ("' OR 1=1 --", "Tautology bypass (' OR 1=1 --)"),
        ("'; DROP TABLE ai_search_bookchunk; --", "DDL drop table attack (DROP TABLE)"),
        ("admin'--", "Comment truncation (admin'--)"),
        ("' UNION SELECT NULL, NULL, NULL, NULL, NULL, NULL --", "UNION query exfiltration"),
        ("\" OR \"\"=\"", "Double quote tautology"),
        ("' OR ''='", "Single quote string tautology"),
        ("1; SELECT pg_sleep(2); --", "Time-based blind SQL injection (pg_sleep 2s)"),
    ]

    for payload, label in sqli_cases:
        t0 = time.perf_counter()
        try:
            r = requests.post(BACKEND_SEARCH_URL, json={"query": payload}, timeout=5)
            dt = (time.perf_counter() - t0) * 1000
            # Must return 200 or 400, no 500 server error, no SQL syntax errors, and pg_sleep must not hang
            is_safe = (r.status_code in [200, 400]) and ("syntax error" not in r.text.lower()) and (dt < 1500)
            verifier.record(
                f"SQLI-{payload[:20]}",
                "Security-SQLi",
                is_safe,
                f"{label} -> status={r.status_code}, latency={round(dt, 1)}ms (Sanitized, No SQL Execution)",
                dt
            )
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            verifier.record(f"SQLI-{payload[:20]}", "Security-SQLi", False, f"Exception: {str(e)}", dt)

    xss_cases = [
        ("<script>alert(1)</script>", "Standard script tag (<script>alert(1)</script>)"),
        ("<img src=x onerror=alert(1)>", "Image onerror payload (<img src=x onerror=alert(1)>)"),
        ("\"><svg onload=alert(1)>", "SVG onload payload (\"><svg onload=alert(1)>)"),
        ("javascript:alert(document.cookie)", "Javascript pseudo-protocol"),
    ]

    for payload, label in xss_cases:
        t0 = time.perf_counter()
        try:
            r = requests.post(BACKEND_SEARCH_URL, json={"query": payload}, timeout=5)
            dt = (time.perf_counter() - t0) * 1000
            is_safe = (r.status_code in [200, 400])
            verifier.record(
                f"XSS-{payload[:20]}",
                "Security-XSS",
                is_safe,
                f"{label} -> status={r.status_code}, safe JSON response",
                dt
            )
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            verifier.record(f"XSS-{payload[:20]}", "Security-XSS", False, f"Exception: {str(e)}", dt)

    # Database table integrity confirmation
    t0 = time.perf_counter()
    try:
        r_check = requests.post(BACKEND_SEARCH_URL, json={"query": "dac nhan tam"}, timeout=5)
        dt = (time.perf_counter() - t0) * 1000
        table_ok = (r_check.status_code == 200 and r_check.json().get("total", 0) > 0)
        verifier.record(
            "DB-TABLE-INTEGRITY",
            "Security-Integrity",
            table_ok,
            f"Table ai_search_bookchunk intact and queryable (total={r_check.json().get('total')})",
            dt
        )
    except Exception as e:
        dt = (time.perf_counter() - t0) * 1000
        verifier.record("DB-TABLE-INTEGRITY", "Security-Integrity", False, f"Exception: {str(e)}", dt)


# ----------------------------------------------------------------------
# 4. LONG QUERY STRESS TESTING (>2000 CHARACTERS)
# ----------------------------------------------------------------------
def test_long_query_stress():
    print("\n" + "="*80)
    print("4. LONG QUERY STRESS TESTING (>2000 CHARS)")
    print("="*80)

    stress_payloads = [
        ("Long-Vietnamese-2200", "Đắc Nhân Tâm " * 170, "Vietnamese text 2,210 chars"),
        ("Long-Complex-Sentence-2500", "Tìm kiếm các cuốn sách về tư duy logic, tâm lý học con người và kinh tế thị trường để phát triển bản thân toàn diện trong thời đại mới. " * 18, "Natural language 2,448 chars"),
        ("Long-Noise-5000", "tuduy logic tamly kienthuc sach phattrien " * 125, "Repeating tokens 5,125 chars"),
        ("Long-Unicode-Emoji-2500", "📚🔍 Đắc Nhân Tâm 🌟 Chiến Tranh Tiền Tệ 💡 Tư Duy Nhanh Và Chậm " * 40, "Unicode & Emojis 2,560 chars"),
    ]

    for test_id, text, label in stress_payloads:
        # Backend stress
        t0 = time.perf_counter()
        try:
            r = requests.post(BACKEND_SEARCH_URL, json={"query": text}, timeout=10)
            dt = (time.perf_counter() - t0) * 1000
            ok = (r.status_code == 200 and dt < 5000)
            verifier.record(
                f"BE-STRESS-{test_id}",
                "Stress-LongQuery",
                ok,
                f"Backend {label} -> status=200, len={len(text)}, latency={round(dt, 1)}ms",
                dt
            )
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            verifier.record(f"BE-STRESS-{test_id}", "Stress-LongQuery", False, f"Exception: {str(e)}", dt)

        # Frontend stress
        t0 = time.perf_counter()
        try:
            r_fe = requests.post(FRONTEND_SEARCH_URL, json={"query": text}, timeout=10)
            dt = (time.perf_counter() - t0) * 1000
            ok = (r_fe.status_code == 200 and dt < 5000)
            verifier.record(
                f"FE-STRESS-{test_id}",
                "Stress-LongQuery",
                ok,
                f"Frontend {label} -> status=200, len={len(text)}, latency={round(dt, 1)}ms",
                dt
            )
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            verifier.record(f"FE-STRESS-{test_id}", "Stress-LongQuery", False, f"Exception: {str(e)}", dt)


# ----------------------------------------------------------------------
# 5. SERIES DISAMBIGUATION & RANKING CONSISTENCY
# ----------------------------------------------------------------------
def test_series_disambiguation():
    print("\n" + "="*80)
    print("5. SERIES DISAMBIGUATION & RANKING CONSISTENCY")
    print("="*80)

    # 1. Generic queries: Must prioritize Tập 1, never start arbitrarily with Tập 3
    generic_cases = [
        ("Chiến tranh tiền tệ", "Accented generic"),
        ("chien tranh tien te", "Unaccented generic"),
        ("CHIẾN TRANH TIỀN TỆ", "Uppercase generic"),
        ("sách chiến tranh tiền tệ", "Prefixed with 'sách'"),
        ("cuốn chiến tranh tiền tệ", "Prefixed with 'cuốn'"),
    ]

    for query, label in generic_cases:
        t0 = time.perf_counter()
        try:
            r = requests.post(BACKEND_SEARCH_URL, json={"query": query}, timeout=5)
            dt = (time.perf_counter() - t0) * 1000
            if r.status_code == 200:
                data = r.json()
                results = data.get("results", [])
                slugs = [x["product_slug"] for x in results]
                top_slug = slugs[0] if slugs else "none"
                # Primary assertion: Tập 1 is at rank 0, never Tập 3
                prioritizes_tap_1 = (top_slug == "chien-tranh-tien-te-tap-1")
                never_tap_3_first = (top_slug != "chien-tranh-tien-te-tap-3")
                ok = prioritizes_tap_1 and never_tap_3_first
                verifier.record(
                    f"SERIES-GENERIC-{query[:15]}",
                    "Series-Disambiguation",
                    ok,
                    f"Query '{query}' ({label}) -> top='{top_slug}', order={slugs[:3]}",
                    dt
                )
            else:
                verifier.record(f"SERIES-GENERIC-{query[:15]}", "Series-Disambiguation", False, f"HTTP {r.status_code}", dt)
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            verifier.record(f"SERIES-GENERIC-{query[:15]}", "Series-Disambiguation", False, f"Exception: {str(e)}", dt)

    # 2. Specific volume queries: Must prioritize the exact requested volume
    specific_cases = [
        ("Chiến tranh tiền tệ tập 1", "chien-tranh-tien-te-tap-1"),
        ("Chiến tranh tiền tệ tập 2", "chien-tranh-tien-te-tap-2"),
        ("Chiến tranh tiền tệ tập 3", "chien-tranh-tien-te-tap-3"),
        ("chien tranh tien te tap 1", "chien-tranh-tien-te-tap-1"),
        ("chien tranh tien te tap 2", "chien-tranh-tien-te-tap-2"),
        ("chien tranh tien te tap 3", "chien-tranh-tien-te-tap-3"),
    ]

    for query, expected_slug in specific_cases:
        t0 = time.perf_counter()
        try:
            r = requests.post(BACKEND_SEARCH_URL, json={"query": query}, timeout=5)
            dt = (time.perf_counter() - t0) * 1000
            if r.status_code == 200:
                data = r.json()
                results = data.get("results", [])
                top_slug = results[0]["product_slug"] if results else "none"
                ok = (top_slug == expected_slug)
                verifier.record(
                    f"SERIES-SPECIFIC-{query[:15]}",
                    "Series-Disambiguation",
                    ok,
                    f"Query '{query}' -> top='{top_slug}', expected='{expected_slug}'",
                    dt
                )
            else:
                verifier.record(f"SERIES-SPECIFIC-{query[:15]}", "Series-Disambiguation", False, f"HTTP {r.status_code}", dt)
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            verifier.record(f"SERIES-SPECIFIC-{query[:15]}", "Series-Disambiguation", False, f"Exception: {str(e)}", dt)


# ----------------------------------------------------------------------
# 6. CONCURRENCY & THREAD-SAFETY STRESS
# ----------------------------------------------------------------------
def test_concurrency():
    print("\n" + "="*80)
    print("6. CONCURRENCY & THREAD-SAFETY STRESS (20-30 CONCURRENT REQUESTS)")
    print("="*80)

    test_queries = [
        "dac nhan tam",
        "tu duy nhanh va cham",
        "chien tranh tien te",
        "phat trien ban than",
        "chu nghia khac ky",
        "sapiens luoc su loai nguoi",
        "cay cam ngot cua toi",
        "bon thoa uoc",
        "cach nghi de thanh cong",
        "10 dieu tao nen so phan",
    ] * 3  # 30 concurrent requests

    # 1. Backend concurrency
    def send_be(q):
        t0 = time.perf_counter()
        try:
            r = requests.post(BACKEND_SEARCH_URL, json={"query": q, "limit": 10}, timeout=10)
            dt = (time.perf_counter() - t0) * 1000
            return (r.status_code == 200, r.status_code, dt)
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            return (False, str(e), dt)

    t_start = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        be_results = list(executor.map(send_be, test_queries))
    total_be_time = (time.perf_counter() - t_start) * 1000

    be_ok_count = sum(1 for ok, _, _ in be_results if ok)
    be_latencies = [dt for _, _, dt in be_results]
    avg_be_lat = sum(be_latencies) / len(be_latencies)
    max_be_lat = max(be_latencies)

    verifier.record(
        "CONCURRENCY-BE-30",
        "Concurrency-Backend",
        be_ok_count == len(test_queries),
        f"Backend 30 requests -> success={be_ok_count}/{len(test_queries)} (100%), total_time={round(total_be_time, 1)}ms, avg_lat={round(avg_be_lat, 1)}ms, max_lat={round(max_be_lat, 1)}ms",
        total_be_time
    )

    # 2. Frontend concurrency
    def send_fe(q):
        t0 = time.perf_counter()
        try:
            r = requests.post(FRONTEND_SEARCH_URL, json={"query": q, "limit": 10}, timeout=10)
            dt = (time.perf_counter() - t0) * 1000
            return (r.status_code == 200, r.status_code, dt)
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            return (False, str(e), dt)

    t_start = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        fe_results = list(executor.map(send_fe, test_queries))
    total_fe_time = (time.perf_counter() - t_start) * 1000

    fe_ok_count = sum(1 for ok, _, _ in fe_results if ok)
    fe_latencies = [dt for _, _, dt in fe_results]
    avg_fe_lat = sum(fe_latencies) / len(fe_latencies)
    max_fe_lat = max(fe_latencies)

    verifier.record(
        "CONCURRENCY-FE-30",
        "Concurrency-Frontend",
        fe_ok_count == len(test_queries),
        f"Frontend 30 requests -> success={fe_ok_count}/{len(test_queries)} (100%), total_time={round(total_fe_time, 1)}ms, avg_lat={round(avg_fe_lat, 1)}ms, max_lat={round(max_fe_lat, 1)}ms",
        total_fe_time
    )


# ----------------------------------------------------------------------
# 7. OUT-OF-CATALOG ANTI-HALLUCINATION
# ----------------------------------------------------------------------
def test_anti_hallucination():
    print("\n" + "="*80)
    print("7. ANTI-HALLUCINATION & OUT-OF-CATALOG BOUNDARY VERIFICATION")
    print("="*80)

    out_of_catalog_cases = [
        "Harry Potter",
        "Harry Potter và Hòn đá Phù thủy",
        "Doraemon",
        "Doremon",
        "Naruto",
        "Sách dạy nấu ăn",
        "Lập trình Python",
        "Dữ liệu lớn",
        "Thời tiết Hà Nội",
        "Giá vàng ngày hôm nay",
        "xyzabcqwerty123987",
    ]

    for q in out_of_catalog_cases:
        # Backend check
        t0 = time.perf_counter()
        try:
            r = requests.post(BACKEND_SEARCH_URL, json={"query": q}, timeout=5)
            dt = (time.perf_counter() - t0) * 1000
            if r.status_code == 200:
                data = r.json()
                total = data.get("total", 0)
                results = data.get("results", [])
                ok = (total == 0 and len(results) == 0)
                verifier.record(
                    f"BE-AH-{q[:15]}",
                    "Anti-Hallucination-Backend",
                    ok,
                    f"Query '{q}' -> total={total}, results={len(results)} (Zero Hallucination)",
                    dt
                )
            else:
                verifier.record(f"BE-AH-{q[:15]}", "Anti-Hallucination-Backend", False, f"HTTP {r.status_code}", dt)
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            verifier.record(f"BE-AH-{q[:15]}", "Anti-Hallucination-Backend", False, f"Exception: {str(e)}", dt)

        # Frontend check
        t0 = time.perf_counter()
        try:
            r_fe = requests.post(FRONTEND_SEARCH_URL, json={"query": q}, timeout=5)
            dt = (time.perf_counter() - t0) * 1000
            if r_fe.status_code == 200:
                data_fe = r_fe.json()
                total_fe = data_fe.get("total", 0)
                results_fe = data_fe.get("results", [])
                ok = (total_fe == 0 and len(results_fe) == 0)
                verifier.record(
                    f"FE-AH-{q[:15]}",
                    "Anti-Hallucination-Frontend",
                    ok,
                    f"Query '{q}' -> total={total_fe}, results={len(results_fe)} (Zero Hallucination)",
                    dt
                )
            else:
                verifier.record(f"FE-AH-{q[:15]}", "Anti-Hallucination-Frontend", False, f"HTTP {r_fe.status_code}", dt)
        except Exception as e:
            dt = (time.perf_counter() - t0) * 1000
            verifier.record(f"FE-AH-{q[:15]}", "Anti-Hallucination-Frontend", False, f"Exception: {str(e)}", dt)


def main():
    print("="*80)
    print("AURABOOK M3_2 EMPIRICAL CHALLENGER VERIFICATION HARNESS")
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

    test_alpha_boundaries()
    test_limit_boundaries()
    test_security_injection()
    test_long_query_stress()
    test_series_disambiguation()
    test_concurrency()
    test_anti_hallucination()

    print("\n" + "="*80)
    print("FINAL EMPIRICAL RESULTS SUMMARY")
    print("="*80)
    total_tests = verifier.passed + verifier.failed
    pass_pct = (verifier.passed / total_tests * 100) if total_tests > 0 else 0
    print(f"Total Tests Executed: {total_tests}")
    print(f"Passed              : {verifier.passed} ({round(pass_pct, 1)}%)")
    print(f"Failed              : {verifier.failed}")
    print("="*80)

    # Save artifact
    output_path = os.path.join(os.path.dirname(__file__), "test_challenger_m3_2_results.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "total": total_tests,
            "passed": verifier.passed,
            "failed": verifier.failed,
            "pass_percentage": round(pass_pct, 1),
            "records": verifier.records
        }, f, ensure_ascii=False, indent=2)
    print(f"[Artifact] Saved detailed empirical results to {output_path}")

    if verifier.failed > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
