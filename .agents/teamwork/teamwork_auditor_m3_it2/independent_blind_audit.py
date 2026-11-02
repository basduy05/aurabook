import io
import json
import re
import sys
import time
import requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

BACKEND_URL = "http://localhost:8000/aurabook/search/hybrid"
FRONTEND_AI_URL = "http://localhost:3000/api/search/ai"
GRAPHRAG_URL = "http://localhost:3000/api/ai/graphrag/search"

results_summary = {"total": 0, "passed": 0, "failed": 0, "details": []}

def record_test(name, passed, message):
    results_summary["total"] += 1
    if passed:
        results_summary["passed"] += 1
        status = "[PASS]"
    else:
        results_summary["failed"] += 1
        status = "[FAIL]"
    print(f"{status} {name}: {message}")
    results_summary["details"].append({"name": name, "status": status, "message": message})

print("=" * 80)
print("AUDITOR INDEPENDENT BLIND VERIFICATION & STRESS TEST")
print("=" * 80)

# ==============================================================================
# TEST SUITE 1: OUT-OF-CATALOG BLIND QUERIES (ZERO HALLUCINATION VERIFICATION)
# None of these titles or topics exist in the catalog or any blacklists
# ==============================================================================
blind_out_of_catalog = [
    "Chúa ruồi William Golding",
    "Don Quixote xứ Mancha Miguel de Cervantes",
    "Trăm năm cô đơn Gabriel Garcia Marquez",
    "Bắt trẻ đồng xanh J.D. Salinger",
    "Hoàng tử bé Antoine de Saint-Exupery",
    "Tội ác và hình phạt Fyodor Dostoevsky",
    "Chiến tranh và hòa bình Lev Tolstoy",
    "Nhà giả kim Paulo Coelho",
    "Khởi nghiệp tinh gọn Eric Ries",
    "Dạy con làm giàu Robert Kiyosaki",
    "Thép đã tôi thế đấy Nikolai Ostrovsky",
    "Biến đổi khí hậu toàn cầu và băng tan Bắc Cực",
    "Cách làm trà sữa trân châu đường đen tại nhà",
    "Bảng xếp hạng bóng đá Ngoại hạng Anh hôm nay",
    "Cổ phiếu VinFast và thị trường chứng khoán Nasdaq",
    "Dịch thuật tiếng Nhật N2 sang tiếng Việt",
    "Xe ô tô điện Tesla Model 3 giá bao nhiêu",
]

print("\n--- 1. Testing Out-of-Catalog Blind Queries (Zero Hallucination) ---")
for q in blind_out_of_catalog:
    # Test Backend
    try:
        r = requests.post(BACKEND_URL, json={"query": q}, timeout=5)
        data = r.json()
        total = data.get("total", 0)
        items = data.get("results", [])
        passed = (total == 0 and len(items) == 0)
        record_test(
            f"BE-ZeroHallucination: '{q[:30]}'",
            passed,
            f"Expected total=0, got total={total}, items={[x.get('product_slug') for x in items]}"
        )
    except Exception as e:
        record_test(f"BE-ZeroHallucination: '{q[:30]}'", False, f"Exception: {e}")

    # Test Frontend AI Search
    try:
        r = requests.post(FRONTEND_AI_URL, json={"query": q}, timeout=5)
        data = r.json()
        total = data.get("total", 0)
        items = data.get("results", [])
        passed = (total == 0 and len(items) == 0)
        record_test(
            f"FE-ZeroHallucination: '{q[:30]}'",
            passed,
            f"Expected total=0, got total={total}"
        )
    except Exception as e:
        record_test(f"FE-ZeroHallucination: '{q[:30]}'", False, f"Exception: {e}")

# ==============================================================================
# TEST SUITE 2: IN-CATALOG NATURAL LANGUAGE & CONCEPTUAL BLIND QUERIES
# Complex paraphrasing and thematic expressions
# ==============================================================================
blind_in_catalog = [
    {
        "query": "nguyên tắc đối nhân xử thế và lắng nghe thấu cảm người khác",
        "expected_slug": "dac-nhan-tam",
        "desc": "Đắc Nhân Tâm",
    },
    {
        "query": "thực hành buông bỏ phán xét và suy diễn để tâm hồn tự do an lạc",
        "expected_slug": "bon-thoa-uoc",
        "desc": "Bốn Thỏa Ước",
    },
    {
        "query": "hành trình loài vượn đứng thẳng chinh phục các lục địa và cách mạng nhận thức",
        "expected_slug": "sapiens-luoc-su-loai-nguoi",
        "desc": "Sapiens",
    },
    {
        "query": "câu chuyện cảm động về chú bé Zeze nghèo khổ và cây cam nhỏ",
        "expected_slug": "cay-cam-ngot-cua-toi",
        "desc": "Cây Cam Ngọt Của Tôi",
    },
    {
        "query": "triết học Hy Lạp La Mã cổ đại về kiểm soát cảm xúc và sự bình thản trước biến cố",
        "expected_slug": ["chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than", "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than"],
        "desc": "Chủ Nghĩa Khắc Kỷ",
    },
    {
        "query": "hai hệ thống tư duy trực giác nhanh và suy luận chậm của con người",
        "expected_slug": "tu-duy-nhanh-va-cham",
        "desc": "Tư Duy Nhanh Và Chậm",
    },
    {
        "query": "khát vọng làm giàu và niềm tin kiên định vươn tới thành công của Napoleon Hill",
        "expected_slug": "cach-nghi-de-thanh-cong",
        "desc": "Cách Nghĩ Để Thành Công",
    },
    {
        "query": "10 quy luật vượt qua nghịch cảnh làm chủ vận mệnh bản thân David Simon",
        "expected_slug": "10-dieu-tao-nen-so-phan",
        "desc": "10 Điều Tạo Nên Số Phận",
    },
    {
        "query": "phương pháp liên tưởng hình ảnh và căn phòng La Mã của người Do Thái Eran Katz",
        "expected_slug": ["tri-tue-do-thai", "bi-mat-cua-mot-tri-nho-sieu-pham"],
        "desc": "Trí Tuệ Do Thái / Kỷ Lục Trí Nhớ",
    },
]

print("\n--- 2. Testing In-Catalog Thematic Blind Queries ---")
for tc in blind_in_catalog:
    q = tc["query"]
    exp = tc["expected_slug"]
    if isinstance(exp, str):
        exp = [exp]

    # Test Backend
    try:
        r = requests.post(BACKEND_URL, json={"query": q, "limit": 5}, timeout=5)
        data = r.json()
        results = data.get("results", [])
        top_slug = results[0]["product_slug"] if results else None
        top_score = results[0]["score"] if results else 0
        passed = (top_slug in exp and top_score > 0)
        record_test(
            f"BE-BlindConcept: {tc['desc']}",
            passed,
            f"Top slug: {top_slug} (score={top_score}), Expected one of: {exp}"
        )
    except Exception as e:
        record_test(f"BE-BlindConcept: {tc['desc']}", False, f"Exception: {e}")

    # Test GraphRAG Context Search
    try:
        r = requests.get(f"{GRAPHRAG_URL}?query={requests.utils.quote(q)}", timeout=5)
        data = r.json()
        products = data.get("products", [])
        top_prod_slug = products[0]["slug"] if products else None
        passed = (top_prod_slug in exp or data.get("hasDirectMatch") is True)
        record_test(
            f"GR-BlindConcept: {tc['desc']}",
            passed,
            f"Top product: {top_prod_slug}, directMatch={data.get('hasDirectMatch')}"
        )
    except Exception as e:
        record_test(f"GR-BlindConcept: {tc['desc']}", False, f"Exception: {e}")

# ==============================================================================
# TEST SUITE 3: MULTI-VOLUME SERIES GENERALIZED RANKING
# ==============================================================================
print("\n--- 3. Testing Series Disambiguation & Chronological Priority ---")
series_tests = [
    {
        "query": "chiến tranh tiền tệ",
        "expected_top": "chien-tranh-tien-te-tap-1",
        "desc": "Generic series query should prioritize Volume 1",
    },
    {
        "query": "chien tranh tien te tap 2",
        "expected_top": "chien-tranh-tien-te-tap-2",
        "desc": "Explicit Volume 2 query should prioritize Volume 2",
    },
    {
        "query": "chien tranh tien te tap 3",
        "expected_top": "chien-tranh-tien-te-tap-3",
        "desc": "Explicit Volume 3 query should prioritize Volume 3",
    },
    {
        "query": "chien tranh tien te vol ii",
        "expected_top": "chien-tranh-tien-te-tap-2",
        "desc": "Roman numeral Vol II query should prioritize Volume 2",
    },
    {
        "query": "chien tranh tien te vol iii",
        "expected_top": "chien-tranh-tien-te-tap-3",
        "desc": "Roman numeral Vol III query should prioritize Volume 3",
    },
]

for st in series_tests:
    q = st["query"]
    exp = st["expected_top"]
    try:
        r = requests.post(BACKEND_URL, json={"query": q, "limit": 3}, timeout=5)
        data = r.json()
        results = data.get("results", [])
        top_slug = results[0]["product_slug"] if results else None
        top_score = results[0]["score"] if results else 0
        passed = (top_slug == exp)
        record_test(
            f"BE-Series: {st['desc']}",
            passed,
            f"Top slug: {top_slug} (score={top_score}), Expected: {exp}"
        )
    except Exception as e:
        record_test(f"BE-Series: {st['desc']}", False, f"Exception: {e}")

# ==============================================================================
# TEST SUITE 4: ALPHA BOUNDARY & SCORE LEAKAGE PREVENTION
# Verify alpha=0.0 (pure fulltext) and alpha=1.0 (pure vector)
# ==============================================================================
print("\n--- 4. Testing Alpha Boundaries & Score Leakage ---")
try:
    # When alpha=0.0, only items with fulltext matches should be returned.
    r_ft = requests.post(BACKEND_URL, json={"query": "loài vượn đứng thẳng thời cổ đại", "alpha": 0.0}, timeout=5)
    data_ft = r_ft.json()
    zero_scores_ft = [x for x in data_ft.get("results", []) if x["score"] <= 0.0]
    passed_ft = (len(zero_scores_ft) == 0)
    record_test(
        "BE-Alpha-0.0-NoZeroScores",
        passed_ft,
        f"Returned items: {len(data_ft.get('results', []))}, Items with score<=0: {len(zero_scores_ft)}"
    )

    # When alpha=1.0, only items from vector search with distance <= 0.36 are returned.
    r_vec = requests.post(BACKEND_URL, json={"query": "chủ nghĩa khắc kỷ", "alpha": 1.0}, timeout=5)
    data_vec = r_vec.json()
    zero_scores_vec = [x for x in data_vec.get("results", []) if x["score"] <= 0.0]
    passed_vec = (len(zero_scores_vec) == 0 and len(data_vec.get("results", [])) > 0)
    record_test(
        "BE-Alpha-1.0-NoZeroScores",
        passed_vec,
        f"Returned items: {len(data_vec.get('results', []))}, Items with score<=0: {len(zero_scores_vec)}"
    )
except Exception as e:
    record_test("BE-Alpha-Boundaries", False, f"Exception: {e}")

# ==============================================================================
# TEST SUITE 5: ADVERSARIAL PAYLOADS & EDGE BOUNDARIES
# ==============================================================================
print("\n--- 5. Testing Adversarial Payloads & Edge Boundaries ---")
edge_cases = [
    {"query": "   \n\t   ", "desc": "Pure whitespace string"},
    {"query": "!@#$%^&*()_+=-[]{};:'\"\\|,.<>/?`~", "desc": "Pure punctuation symbols"},
    {"query": "✨🎉🔥🤖💡📘🍀🌟🚀🦄", "desc": "Pure Unicode emojis"},
    {"query": "a", "desc": "Single character below minimum length 2"},
    {"query": "abc " * 2000, "desc": "10,000 character buffer overflow stress"},
    {"query": "' OR '1'='1' -- ", "desc": "SQL Injection attempt"},
    {"query": "<script>alert('xss');</script>", "desc": "XSS Injection attempt"},
]

for ec in edge_cases:
    q = ec["query"]
    desc = ec["desc"]
    try:
        r = requests.post(BACKEND_URL, json={"query": q}, timeout=5)
        passed = (r.status_code in [200, 400])
        if r.status_code == 200:
            data = r.json()
            passed = passed and (data.get("total", 0) == 0 and len(data.get("results", [])) == 0)
        record_test(
            f"BE-Edge: {desc}",
            passed,
            f"Status code: {r.status_code}, Response: {r.text[:60]}"
        )
    except Exception as e:
        record_test(f"BE-Edge: {desc}", False, f"Exception: {e}")

print("\n" + "=" * 80)
print(f"SUMMARY: Total Tests: {results_summary['total']} | Passed: {results_summary['passed']} | Failed: {results_summary['failed']}")
print("=" * 80)

if results_summary["failed"] > 0:
    sys.exit(1)
sys.exit(0)
