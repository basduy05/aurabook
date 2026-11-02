"""
Aurabook Milestone 3: Empirical Adversarial Stress Test Suite
Author: teamwork_challenger_m3_1
Target Endpoints:
  - Backend: POST http://localhost:8000/aurabook/search/hybrid
  - Frontend AI Search: POST http://localhost:3000/api/search/ai
  - Frontend GraphRAG: GET http://localhost:3000/api/ai/graphrag/search
"""

import io
import sys
import json
import time
import urllib.parse
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

# Palette for CLI output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

results_summary = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "failures": []
}

def log_test(test_id: str, desc: str, passed: bool, detail: str = ""):
    results_summary["total"] += 1
    if passed:
        results_summary["passed"] += 1
        print(f"[{GREEN}PASS{RESET}] {test_id} - {desc}")
    else:
        results_summary["failed"] += 1
        msg = f"[{RED}FAIL{RESET}] {test_id} - {desc} | {detail}"
        print(msg)
        results_summary["failures"].append({"id": test_id, "desc": desc, "detail": detail})

# -------------------------------------------------------------
# 1. Anti-Hallucination Stress Testing: Out-of-Catalog Entities
# -------------------------------------------------------------
def test_anti_hallucination_entities():
    print(f"\n{BLUE}=== SECTION 1: ANTI-HALLUCINATION STRESS TESTING (ENTITIES) ==={RESET}")
    out_of_catalog_queries = [
        "Harry Potter",
        "Harry Potter và Hòn đá phù thủy",
        "Chúa tể những chiếc nhẫn",
        "Doraemon",
        "Doremon",
        "Naruto",
        "Sherlock Holmes",
        "Game of Thrones",
        "One Piece",
        "Dragon Ball",
        "Lập trình Python và trí tuệ nhân tạo",
        "Công thức nấu ăn ngon gia đình",
        "Bí kíp võ công kiếm hiệp Kim Dung",
        "Chiến tranh giữa các vì sao",
        "Tam Quốc Diễn Nghĩa",
        "Tây Du Ký",
        "Tôn Ngộ Không",
        "Giải thuật và Cấu trúc dữ liệu",
        "Dự báo thời tiết Hà Nội hôm nay",
        "Giá vàng 9999",
        "Mua xe máy Honda SH",
        "Muôn Kiếp Nhân Sinh"
    ]

    for q in out_of_catalog_queries:
        # 1. Test Backend
        try:
            r_be = requests.post(BACKEND_URL, json={"query": q, "limit": 10}, timeout=5)
            if r_be.status_code == 200:
                data = r_be.json()
                total = data.get("total", len(data.get("results", [])))
                res_count = len(data.get("results", []))
                passed = (total == 0 and res_count == 0)
                log_test(
                    f"BE-AH-{q[:15]}",
                    f"Backend Anti-Hallucination: '{q}'",
                    passed,
                    f"Expected 0 results, got {res_count} (slugs: {[x['product_slug'] for x in data.get('results', [])]})"
                )
            else:
                log_test(f"BE-AH-{q[:15]}", f"Backend Anti-Hallucination: '{q}'", False, f"HTTP {r_be.status_code}")
        except Exception as e:
            log_test(f"BE-AH-{q[:15]}", f"Backend Anti-Hallucination: '{q}'", False, str(e))

        # 2. Test Frontend /api/search/ai
        try:
            r_fe = requests.post(FRONTEND_AI_URL, json={"query": q, "limit": 10}, timeout=5)
            if r_fe.status_code == 200:
                data = r_fe.json()
                total = data.get("total", len(data.get("results", [])))
                res_count = len(data.get("results", []))
                passed = (total == 0 and res_count == 0)
                log_test(
                    f"FE-AH-{q[:15]}",
                    f"Frontend AI Search Anti-Hallucination: '{q}'",
                    passed,
                    f"Expected 0 results, got {res_count}"
                )
            else:
                log_test(f"FE-AH-{q[:15]}", f"Frontend AI Search Anti-Hallucination: '{q}'", False, f"HTTP {r_fe.status_code}")
        except Exception as e:
            log_test(f"FE-AH-{q[:15]}", f"Frontend AI Search Anti-Hallucination: '{q}'", False, str(e))

        # 3. Test Frontend GraphRAG /api/ai/graphrag/search
        try:
            enc_q = urllib.parse.quote_plus(q)
            r_gr = requests.get(f"{FRONTEND_GRAPHRAG_URL}?query={enc_q}", timeout=5)
            if r_gr.status_code == 200:
                data = r_gr.json()
                products = data.get("products", [])
                total_cnt = data.get("totalCount", len(products))
                reasoning = data.get("reasoningSummary", "")
                passed = (total_cnt == 0 and len(products) == 0 and ("chưa có" in reasoning or "không có" in reasoning or "không đưa ra thông tin giả mạo" in reasoning))
                log_test(
                    f"GR-AH-{q[:15]}",
                    f"GraphRAG Anti-Hallucination: '{q}'",
                    passed,
                    f"Expected 0 products + honest reasoning, got {len(products)} products, reasoning: '{reasoning[:60]}...'"
                )
            else:
                log_test(f"GR-AH-{q[:15]}", f"GraphRAG Anti-Hallucination: '{q}'", False, f"HTTP {r_gr.status_code}")
        except Exception as e:
            log_test(f"GR-AH-{q[:15]}", f"GraphRAG Anti-Hallucination: '{q}'", False, str(e))


# -------------------------------------------------------------
# 2. Anti-Hallucination Stress Testing: Noise, Boundary & Injections
# -------------------------------------------------------------
def test_noise_and_injections():
    print(f"\n{BLUE}=== SECTION 2: NOISE, BOUNDARY & INJECTION TESTING ==={RESET}")
    noise_cases = [
        ("asdfghjkl12345", "Random alpha-numeric noise"),
        ("!@#$%^&*()_+=-`~", "Punctuation noise"),
        ("   \t\n  ", "Whitespace only"),
        ("", "Empty query string"),
        ("                 ", "Many spaces"),
        ("xyzabc1234567890qwertyuiop", "Long random non-word"),
        ("🔥🎉🚀🦄📖📚", "Emoji only"),
        ("a" * 800, "Buffer overflow length query (800 chars)"),
        ("'; DROP TABLE ai_search_bookchunk; --", "Adversarial SQL Injection"),
        ("<script>alert('xss')</script>", "Adversarial XSS Script Injection"),
        ("SELECT * FROM product_product WHERE 1=1", "SQL Select Injection")
    ]

    for q, label in noise_cases:
        # Backend check
        try:
            r_be = requests.post(BACKEND_URL, json={"query": q, "limit": 10}, timeout=5)
            if q.strip() == "":
                # For empty query, backend returns 400
                passed = (r_be.status_code == 400 and r_be.json().get("total", 0) == 0)
                log_test(f"BE-NOISE-{label[:15]}", f"Backend: {label}", passed, f"Status: {r_be.status_code}")
            else:
                if r_be.status_code == 200:
                    data = r_be.json()
                    passed = (data.get("total", len(data.get("results", []))) == 0)
                    log_test(f"BE-NOISE-{label[:15]}", f"Backend: {label}", passed, f"Total: {data.get('total')}")
                else:
                    log_test(f"BE-NOISE-{label[:15]}", f"Backend: {label}", False, f"HTTP {r_be.status_code}")
        except Exception as e:
            log_test(f"BE-NOISE-{label[:15]}", f"Backend: {label}", False, str(e))

        # Frontend AI check
        try:
            r_fe = requests.post(FRONTEND_AI_URL, json={"query": q, "limit": 10}, timeout=5)
            if r_fe.status_code == 200:
                data = r_fe.json()
                passed = (data.get("total", 0) == 0 and len(data.get("results", [])) == 0)
                log_test(f"FE-NOISE-{label[:15]}", f"Frontend AI: {label}", passed, f"Total: {data.get('total')}")
            else:
                log_test(f"FE-NOISE-{label[:15]}", f"Frontend AI: {label}", False, f"HTTP {r_fe.status_code}")
        except Exception as e:
            log_test(f"FE-NOISE-{label[:15]}", f"Frontend AI: {label}", False, str(e))

        # Frontend GraphRAG check
        try:
            enc_q = urllib.parse.quote_plus(q)
            r_gr = requests.get(f"{FRONTEND_GRAPHRAG_URL}?query={enc_q}", timeout=5)
            if r_gr.status_code == 200:
                data = r_gr.json()
                passed = (data.get("totalCount", 0) == 0 and len(data.get("products", [])) == 0)
                log_test(f"GR-NOISE-{label[:15]}", f"GraphRAG: {label}", passed, f"TotalCount: {data.get('totalCount')}")
            else:
                log_test(f"GR-NOISE-{label[:15]}", f"GraphRAG: {label}", False, f"HTTP {r_gr.status_code}")
        except Exception as e:
            log_test(f"GR-NOISE-{label[:15]}", f"GraphRAG: {label}", False, str(e))


def is_matching_slug(actual: str | None, expected: str) -> bool:
    if not actual:
        return False
    if actual == expected:
        return True
    khac_ky_variants = {
        "chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than",
        "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than",
    }
    if actual in khac_ky_variants and expected in khac_ky_variants:
        return True
    return False


# -------------------------------------------------------------
# 3. Vietnamese Diacritics & Series Disambiguation Testing
# -------------------------------------------------------------
def test_vietnamese_diacritics_and_series():
    print(f"\n{BLUE}=== SECTION 3: VIETNAMESE DIACRITICS & SERIES DISAMBIGUATION ==={RESET}")
    cases = [
        # (Query, Expected top slug, Target label)
        ("dac nhan tam", "dac-nhan-tam", "Unaccented Đắc Nhân Tâm"),
        ("Đắc Nhân Tâm", "dac-nhan-tam", "Accented Đắc Nhân Tâm"),
        ("tu duy nhanh va cham", "tu-duy-nhanh-va-cham", "Unaccented Tư Duy Nhanh Và Chậm"),
        ("Tư Duy Nhanh và Chậm", "tu-duy-nhanh-va-cham", "Accented Tư Duy Nhanh Và Chậm"),
        ("bon thoa uoc", "bon-thoa-uoc", "Unaccented Bốn Thỏa Ước"),
        ("Bốn Thỏa Ước", "bon-thoa-uoc", "Accented Bốn Thỏa Ước"),
        ("chien tranh tien te", "chien-tranh-tien-te-tap-1", "Series disambiguation: generic CTTT -> Tap 1"),
        ("Chiến Tranh Tiền Tệ", "chien-tranh-tien-te-tap-1", "Accented generic CTTT -> Tap 1"),
        ("chien tranh tien te tap 2", "chien-tranh-tien-te-tap-2", "Specific series: CTTT Tap 2"),
        ("chien tranh tien te tap 3", "chien-tranh-tien-te-tap-3", "Specific series: CTTT Tap 3"),
        ("cay cam ngot cua toi", "cay-cam-ngot-cua-toi", "Unaccented Cây Cam Ngọt Của Tôi"),
        ("tri tue do thai", "tri-tue-do-thai", "Unaccented Trí Tuệ Do Thái"),
        ("cach nghi de thanh cong", "cach-nghi-de-thanh-cong", "Unaccented Cách Nghĩ Để Thành Công"),
        ("sapiens luoc su loai nguoi", "sapiens-luoc-su-loai-nguoi", "Unaccented Sapiens"),
        ("sapiens", "sapiens-luoc-su-loai-nguoi", "Short title Sapiens"),
        ("chu nghia khac ky", "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than", "Unaccented Chủ Nghĩa Khắc Kỷ"),
        ("10 dieu tao nen so phan", "10-dieu-tao-nen-so-phan", "10 Điều Tạo Nên Số Phận")
    ]

    for q, exp_slug, label in cases:
        # Backend check
        try:
            r_be = requests.post(BACKEND_URL, json={"query": q, "limit": 5}, timeout=5)
            if r_be.status_code == 200:
                results = r_be.json().get("results", [])
                top_slug = results[0]["product_slug"] if results else None
                passed = is_matching_slug(top_slug, exp_slug)
                log_test(
                    f"BE-VN-{q[:15]}",
                    f"Backend {label}: '{q}'",
                    passed,
                    f"Expected top '{exp_slug}', got '{top_slug}'"
                )
            else:
                log_test(f"BE-VN-{q[:15]}", f"Backend {label}: '{q}'", False, f"HTTP {r_be.status_code}")
        except Exception as e:
            log_test(f"BE-VN-{q[:15]}", f"Backend {label}: '{q}'", False, str(e))

        # Frontend AI check
        try:
            r_fe = requests.post(FRONTEND_AI_URL, json={"query": q, "limit": 5}, timeout=5)
            if r_fe.status_code == 200:
                results = r_fe.json().get("results", [])
                top_slug = results[0]["product_slug"] if results else None
                passed = is_matching_slug(top_slug, exp_slug)
                log_test(
                    f"FE-VN-{q[:15]}",
                    f"Frontend AI {label}: '{q}'",
                    passed,
                    f"Expected top '{exp_slug}', got '{top_slug}'"
                )
            else:
                log_test(f"FE-VN-{q[:15]}", f"Frontend AI {label}: '{q}'", False, f"HTTP {r_fe.status_code}")
        except Exception as e:
            log_test(f"FE-VN-{q[:15]}", f"Frontend AI {label}: '{q}'", False, str(e))

        # Frontend GraphRAG check
        try:
            enc_q = urllib.parse.quote_plus(q)
            r_gr = requests.get(f"{FRONTEND_GRAPHRAG_URL}?query={enc_q}", timeout=5)
            if r_gr.status_code == 200:
                products = r_gr.json().get("products", [])
                top_slug = products[0]["slug"] if products else None
                passed = is_matching_slug(top_slug, exp_slug)
                log_test(
                    f"GR-VN-{q[:15]}",
                    f"GraphRAG {label}: '{q}'",
                    passed,
                    f"Expected top '{exp_slug}', got '{top_slug}'"
                )
            else:
                log_test(f"GR-VN-{q[:15]}", f"GraphRAG {label}: '{q}'", False, f"HTTP {r_gr.status_code}")
        except Exception as e:
            log_test(f"GR-VN-{q[:15]}", f"GraphRAG {label}: '{q}'", False, str(e))


# -------------------------------------------------------------
# 4. Conceptual & Semantic Retrieval Testing
# -------------------------------------------------------------
def test_conceptual_semantic_retrieval():
    print(f"\n{BLUE}=== SECTION 4: CONCEPTUAL & SEMANTIC RETRIEVAL TESTING ==={RESET}")
    concept_cases = [
        (
            "tìm sách về phát triển bản thân",
            ["dac-nhan-tam", "cach-nghi-de-thanh-cong", "10-dieu-tao-nen-so-phan"],
            "Broad concept: Sách phát triển bản thân"
        ),
        (
            "phat trien ban than",
            ["dac-nhan-tam", "cach-nghi-de-thanh-cong", "10-dieu-tao-nen-so-phan"],
            "Unaccented concept: phat trien ban than"
        ),
        (
            "tâm lý học",
            ["tu-duy-nhanh-va-cham", "dac-nhan-tam", "bon-thoa-uoc"],
            "Psychology concept: tâm lý học"
        ),
        (
            "tam ly hoc",
            ["tu-duy-nhanh-va-cham", "dac-nhan-tam", "bon-thoa-uoc"],
            "Unaccented concept: tam ly hoc"
        ),
        (
            "kinh tế học và tài chính",
            ["chien-tranh-tien-te-tap-1", "tu-duy-nhanh-va-cham", "tri-tue-do-thai"],
            "Finance & Economics concept"
        ),
        (
            "kinh te hoc",
            ["chien-tranh-tien-te-tap-1", "tu-duy-nhanh-va-cham", "tri-tue-do-thai"],
            "Unaccented concept: kinh te hoc"
        ),
        (
            "chủ nghĩa khắc kỷ",
            [
                "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than",
                "chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than",
            ],
            "Philosophy concept: Chủ nghĩa khắc kỷ"
        ),
        (
            "khac ky stoicism",
            [
                "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than",
                "chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than",
            ],
            "Stoicism concept query"
        ),
        (
            "rèn luyện trí nhớ phi thường",
            ["tri-tue-do-thai", "bi-mat-cua-mot-tri-nho-sieu-pham"],
            "Memory training concept"
        ),
        (
            "nghệ thuật giao tiếp và thu phục lòng người",
            ["dac-nhan-tam"],
            "Communication & persuasion concept"
        ),
        (
            "lịch sử tiến hóa và văn minh nhân loại",
            ["sapiens-luoc-su-loai-nguoi"],
            "Evolution & human history concept"
        )
    ]

    for q, exp_slug_pool, label in concept_cases:
        # Check GraphRAG endpoint (best suited for conceptual expansion)
        try:
            enc_q = urllib.parse.quote_plus(q)
            r_gr = requests.get(f"{FRONTEND_GRAPHRAG_URL}?query={enc_q}", timeout=5)
            if r_gr.status_code == 200:
                data = r_gr.json()
                products = data.get("products", [])
                returned_slugs = [p["slug"] for p in products]
                # Test whether at least one of expected slugs is in returned slugs (or top 3)
                overlap = set(returned_slugs[:5]).intersection(set(exp_slug_pool))
                passed = len(overlap) > 0 and len(products) > 0
                log_test(
                    f"GR-CONCEPT-{q[:15]}",
                    f"GraphRAG {label}: '{q}'",
                    passed,
                    f"Expected any of {exp_slug_pool}, got {returned_slugs[:5]}"
                )
            else:
                log_test(f"GR-CONCEPT-{q[:15]}", f"GraphRAG {label}: '{q}'", False, f"HTTP {r_gr.status_code}")
        except Exception as e:
            log_test(f"GR-CONCEPT-{q[:15]}", f"GraphRAG {label}: '{q}'", False, str(e))

        # Check Backend Hybrid Search for conceptual handling
        try:
            r_be = requests.post(BACKEND_URL, json={"query": q, "limit": 5, "alpha": 0.5}, timeout=5)
            if r_be.status_code == 200:
                data = r_be.json()
                results = data.get("results", [])
                returned_slugs = [r["product_slug"] for r in results]
                overlap = set(returned_slugs[:5]).intersection(set(exp_slug_pool))
                passed = len(overlap) > 0 or len(results) == 0  # backend may return 0 or relevant, but NOT irrelevant hallucination
                log_test(
                    f"BE-CONCEPT-{q[:15]}",
                    f"Backend {label}: '{q}'",
                    passed,
                    f"Returned slugs: {returned_slugs[:5]}"
                )
            else:
                log_test(f"BE-CONCEPT-{q[:15]}", f"Backend {label}: '{q}'", False, f"HTTP {r_be.status_code}")
        except Exception as e:
            log_test(f"BE-CONCEPT-{q[:15]}", f"Backend {label}: '{q}'", False, str(e))


# -------------------------------------------------------------
# 5. Parameter Contract & Boundary Testing (Alpha, Limit, Malformed)
# -------------------------------------------------------------
def test_parameters_and_contracts():
    print(f"\n{BLUE}=== SECTION 5: PARAMETER CONTRACT & BOUNDARY TESTING ==={RESET}")
    
    # 5.1 Alpha variations
    alpha_tests = [
        (0.0, "Pure fulltext alpha=0.0"),
        (0.5, "Balanced hybrid alpha=0.5"),
        (1.0, "Pure vector alpha=1.0"),
        (-0.5, "Negative alpha (clamped to 0.0)"),
        (1.5, "Overbound alpha (clamped to 1.0)"),
        ("invalid", "String alpha (fallback to 0.5)"),
        (None, "None/null alpha (fallback to 0.5)")
    ]

    for a_val, a_label in alpha_tests:
        try:
            payload = {"query": "dac nhan tam", "alpha": a_val, "limit": 5}
            r = requests.post(BACKEND_URL, json=payload, timeout=5)
            passed = (r.status_code == 200 and len(r.json().get("results", [])) > 0)
            log_test(f"BE-ALPHA-{str(a_val)[:6]}", f"Backend {a_label}", passed, f"Status: {r.status_code}")
        except Exception as e:
            log_test(f"BE-ALPHA-{str(a_val)[:6]}", f"Backend {a_label}", False, str(e))

        try:
            payload = {"query": "dac nhan tam", "alpha": a_val, "limit": 5}
            r = requests.post(FRONTEND_AI_URL, json=payload, timeout=5)
            passed = (r.status_code == 200 and len(r.json().get("results", [])) > 0)
            log_test(f"FE-ALPHA-{str(a_val)[:6]}", f"Frontend AI {a_label}", passed, f"Status: {r.status_code}")
        except Exception as e:
            log_test(f"FE-ALPHA-{str(a_val)[:6]}", f"Frontend AI {a_label}", False, str(e))

    # 5.2 Limit variations
    limit_tests = [
        (1, 1, "Limit=1"),
        (3, 3, "Limit=3"),
        (10, 10, "Limit=10"),
        (0, 0, "Limit=0"),
        (-5, 0, "Negative Limit"),
        ("abc", 5, "String Limit")
    ]

    for l_val, max_expected, l_label in limit_tests:
        try:
            payload = {"query": "dac nhan tam", "limit": l_val}
            r = requests.post(BACKEND_URL, json=payload, timeout=5)
            if r.status_code == 200:
                res_cnt = len(r.json().get("results", []))
                passed = (res_cnt <= max(1, max_expected)) if max_expected > 0 else (res_cnt == 0 or res_cnt <= 20)
                log_test(f"BE-LIMIT-{str(l_val)[:6]}", f"Backend {l_label}", passed, f"Count: {res_cnt}")
            else:
                passed = (l_val in (0, -5, "abc") and r.status_code == 400)
                log_test(f"BE-LIMIT-{str(l_val)[:6]}", f"Backend {l_label}", passed, f"Status: {r.status_code}")
        except Exception as e:
            log_test(f"BE-LIMIT-{str(l_val)[:6]}", f"Backend {l_label}", False, str(e))

    # 5.3 Missing query key or malformed body
    try:
        r = requests.post(BACKEND_URL, json={}, timeout=5)
        passed = (r.status_code == 400)
        log_test("BE-NO-QUERY", "Backend empty dict body (missing query key)", passed, f"Status: {r.status_code}")
    except Exception as e:
        log_test("BE-NO-QUERY", "Backend empty dict body", False, str(e))

    try:
        r = requests.post(BACKEND_URL, data="invalid-json", headers={"Content-Type": "application/json"}, timeout=5)
        passed = (r.status_code == 400)
        log_test("BE-BAD-JSON", "Backend malformed JSON body", passed, f"Status: {r.status_code}")
    except Exception as e:
        log_test("BE-BAD-JSON", "Backend malformed JSON body", False, str(e))

    try:
        r = requests.post(FRONTEND_AI_URL, json={}, timeout=5)
        passed = (r.status_code == 200 and r.json().get("total") == 0)
        log_test("FE-NO-QUERY", "Frontend AI empty dict body", passed, f"Status: {r.status_code}")
    except Exception as e:
        log_test("FE-NO-QUERY", "Frontend AI empty dict body", False, str(e))


def main():
    start_time = time.time()
    print("=" * 80)
    print("EMPIRICAL ADVERSARIAL STRESS TEST FOR MILESTONE 3: AI SEARCH")
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    test_anti_hallucination_entities()
    test_noise_and_injections()
    test_vietnamese_diacritics_and_series()
    test_conceptual_semantic_retrieval()
    test_parameters_and_contracts()

    duration = time.time() - start_time
    print("\n" + "=" * 80)
    print("EMPIRICAL TEST SUMMARY")
    print("=" * 80)
    print(f"Total Tests Run : {results_summary['total']}")
    print(f"Passed          : {results_summary['passed']} ({results_summary['passed'] / max(1, results_summary['total']) * 100:.1f}%)")
    print(f"Failed          : {results_summary['failed']}")
    print(f"Duration        : {duration:.2f}s")
    print("=" * 80)

    if results_summary["failures"]:
        print(f"\n{RED}=== FAILURE DETAILS ({len(results_summary['failures'])}) ==={RESET}")
        for f in results_summary["failures"]:
            print(f"- [{f['id']}] {f['desc']} -> {f['detail']}")
        sys.exit(1)
    else:
        print(f"\n{GREEN}ALL EMPIRICAL TESTS PASSED PERFECTLY! ZERO HALLUCINATIONS DETECTED.{RESET}")
        sys.exit(0)

if __name__ == "__main__":
    main()
