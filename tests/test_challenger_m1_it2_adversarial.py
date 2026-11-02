"""
Adversarial Exploration Test Suite for Milestone 1 Iteration 2
Testing out-of-catalog queries, abbreviations, stop words, and tricky edge cases against GraphRAG endpoint.
"""
import sys
import json
import urllib.request
import urllib.parse

ENDPOINT = "http://localhost:3000/api/ai/graphrag/search"

def query_endpoint(q):
    url = ENDPOINT + "?" + urllib.parse.urlencode({"query": q})
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))
    except Exception as e:
        return 500, {"error": str(e)}

def main():
    sys.stdout.reconfigure(encoding="utf-8")
    print("=" * 80)
    print("CHALLENGER M1 ITERATION 2 ADVERSARIAL STRESS TEST")
    print("=" * 80)

    # 1. Verification of the 3 flagged issues from Iteration 1
    print("\n--- TEST SUITE 1: The 3 Iteration 1 Flagged Issues ---")
    
    # 1.1 Out-of-catalog queries flagged in It1
    it1_out_of_catalog = [
        "cách nấu phở bò",
        "chúa tể những chiếc nhẫn",
        "tây du ký tôn ngộ không",
        "cấu trúc dữ liệu và giải thuật",
        "hướng dẫn làm bánh mì",
        "naruto đại chiến",
    ]
    it1_ooc_passed = True
    for q in it1_out_of_catalog:
        status, data = query_endpoint(q)
        total = data.get("totalCount", 0)
        prods = [p.get("name") for p in data.get("products", [])]
        reason = data.get("reasoningSummary", "")
        if total == 0 and "hiện chưa có" in (reason + data.get("queryInterpretation", "")):
            print(f"  [PASS] '{q}' -> 0 products, honest explanation: {reason[:60]}...")
        else:
            print(f"  [FAIL] '{q}' -> {total} products returned: {prods}")
            it1_ooc_passed = False

    # 1.2 Abbreviations
    expected_abbr = {
        "dnt": "Đắc Nhân Tâm",
        "đnt": "Đắc Nhân Tâm",
        "btu": "Bốn Thỏa Ước",
        "cttt 2": "Chiến Tranh Tiền Tệ - Tập 2",
        "lsln": "Sapiens: Lược Sử Loài Người",
        "ttdt": "Trí Tuệ Do Thái",
        "cndtc": "Cách Nghĩ Để Thành Công",
        "ccnct": "Cây Cam Ngọt Của Tôi",
        "cttt 1": "Chiến Tranh Tiền Tệ - Tập 1",
        "cttt 3": "Chiến Tranh Tiền Tệ - Tập 3",
        "cnkk": "Chủ Nghĩa Khắc Kỷ",
        "tdnvc": "Tư Duy Nhanh Và Chậm"
    }
    abbr_passed = True
    print("\n--- TEST SUITE 2: Abbreviation Resolution ---")
    for abbr, expected_title in expected_abbr.items():
        status, data = query_endpoint(abbr)
        prods = [p.get("name") for p in data.get("products", [])]
        if len(prods) == 1 and expected_title.lower() in prods[0].lower():
            print(f"  [PASS] '{abbr}' -> Exactly matched: '{prods[0]}'")
        else:
            print(f"  [FAIL] '{abbr}' -> Expected '{expected_title}', got: {prods}")
            abbr_passed = False

    # 1.3 Stop words without accents
    stop_word_queries = [
        "cuốn sách hay",
        "những cuốn sách nên đọc",
        "cuon sach hay",
        "nhung cuon sach nen doc",
        "sach hay nen doc",
        "tim sach de doc",
        "muon mua sach gi",
        "cac cuon sach nay"
    ]
    stop_passed = True
    print("\n--- TEST SUITE 3: Stop Words (Accented & Diacritic-Free) ---")
    for q in stop_word_queries:
        status, data = query_endpoint(q)
        total = data.get("totalCount", 0)
        prods = [p.get("name") for p in data.get("products", [])]
        if total == 0:
            print(f"  [PASS] '{q}' -> Filtered to 0 products")
        else:
            print(f"  [FAIL] '{q}' -> Returned {total} products: {prods}")
            stop_passed = False

    # 2. Aggressive Novel Out-Of-Catalog Queries (Testing generalization of anti-hallucination)
    novel_ooc_queries = [
        "học tiếng anh giao tiếp cho người đi làm",
        "kinh tế vi mô giáo trình đại học",
        "nấu lẩu thái chua cay",
        "sửa chữa xe máy honda wave",
        "thơ xuân quỳnh sóng",
        "truyện kiều nguyễn du",
        "lịch sử thế giới cổ đại ai cập",
        "chứng khoán cơ bản cho f0",
        "lập trình python cơ bản",
        "phim hoạt hình doremon nobita",
        "bóng đá việt nam aff cup",
        "thuốc trị cảm cúm đau đầu hạ sốt",
        "cách tán gái qua tin nhắn facebook",
        "phong thủy phòng ngủ hút tài lộc",
        "khoa học vũ trụ hố đen hawking",
        "đại số tuyến tính đại học bách khoa",
        "bản đồ du lịch đà lạt 3 ngày 2 đêm",
        "cách làm giàu nhanh không cần vốn",
        "vật lý lượng tử cho người mới bắt đầu",
        "giải bài tập toán lớp 12 nguyên hàm"
    ]
    novel_ooc_passed = True
    print("\n--- TEST SUITE 4: Novel Out-of-Catalog Adversarial Queries ---")
    for q in novel_ooc_queries:
        status, data = query_endpoint(q)
        total = data.get("totalCount", 0)
        prods = [p.get("name") for p in data.get("products", [])]
        reason = data.get("reasoningSummary", "")
        if total == 0:
            print(f"  [PASS] '{q}' -> 0 products (Anti-hallucination held)")
        else:
            print(f"  [FAIL - HALLUCINATION] '{q}' -> Returned {total} products: {prods}")
            novel_ooc_passed = False

    # 3. Tricky Overlap Attacks (Queries sharing 1 common word with a book title)
    # E.g. "chiếc bánh ngọt ngào" has "ngọt" from "Cây Cam Ngọt Của Tôi"
    # "bản lĩnh người đàn ông" has "bản lĩnh" from "Chủ Nghĩa Khắc Kỷ: Phong Cách Sống Bản Lĩnh & Bình Thản"
    # "chiến tranh thế giới thứ hai" has "chiến tranh" from "Chiến Tranh Tiền Tệ"
    # "phong cách thời trang đường phố" has "phong cách" from "Chủ Nghĩa Khắc Kỷ: Phong Cách Sống..."
    # "tư duy thiết kế design thinking" has "tư duy" from "Tư Duy Nhanh Và Chậm"
    # "thành công trong kỳ thi tốt nghiệp" has "thành công" from "Cách Nghĩ Để Thành Công"
    # "trí tuệ nhân tạo chatgpt" has "trí tuệ" from "Trí Tuệ Do Thái"
    print("\n--- TEST SUITE 5: Tricky Partial Overlap Attacks (Single Word / Generic Phrase) ---")
    overlap_queries = [
        ("chiếc bánh ngọt ngào", "Cây Cam Ngọt Của Tôi", False), # should NOT return Cây cam ngọt
        ("bản lĩnh chính trị", "Chủ Nghĩa Khắc Kỷ", False), # should NOT return Chủ Nghĩa Khắc Kỷ
        ("phong cách thời trang hiện đại", "Chủ Nghĩa Khắc Kỷ", False), # should NOT return
        ("chiến tranh lạnh nga mỹ", "Chiến Tranh Tiền Tệ", False), # should NOT return
        ("bình thản trước sóng gió cuộc đời", "Chủ Nghĩa Khắc Kỷ", True), # conceptual query, let's see
        ("nghệ thuật giao tiếp ứng xử", "Đắc Nhân Tâm", True), # SHOULD match ĐNT
        ("làm thế nào để nhớ lâu", "Bí Mật Của Một Trí Nhớ Siêu Phàm", True), # SHOULD match Trí nhớ
        ("lịch sử tiến hóa của loài người", "Sapiens: Lược Sử Loài Người", True), # SHOULD match Sapiens
        ("quản lý tài chính cá nhân", "Chiến Tranh Tiền Tệ", False), # generic query
    ]
    overlap_passed = True
    for q, target_book, expect_match in overlap_queries:
        status, data = query_endpoint(q)
        total = data.get("totalCount", 0)
        prods = [p.get("name") for p in data.get("products", [])]
        if not expect_match:
            if total == 0 or not any(target_book.lower() in p.lower() for p in prods):
                print(f"  [PASS] '{q}' -> correctly avoided false positive for '{target_book}' (Found: {prods})")
            else:
                print(f"  [FAIL - FALSE POSITIVE] '{q}' -> incorrectly matched '{target_book}' (Found: {prods})")
                overlap_passed = False
        else:
            if any(target_book.lower() in p.lower() for p in prods):
                print(f"  [PASS] '{q}' -> correctly semantically matched target '{target_book}' (Found: {prods})")
            else:
                print(f"  [INFO] '{q}' -> Did not match '{target_book}' (Found: {prods})")

    # 4. Injections & Edge Cases
    print("\n--- TEST SUITE 6: Edge Cases, Punctuation, Whitespace, & Injections ---")
    edge_queries = [
        "",
        "   ",
        "???!!!...",
        "'' OR '1'='1",
        "<script>alert('xss')</script>",
        "📚📖🔥",
        "a" * 500,
        "ĐẮC NHÂN TÂM",
        "  bon   thoa   uoc  ",
        "d-n-t",
        "DNT",
        "ĐNT",
        "BTU"
    ]
    edge_passed = True
    for q in edge_queries:
        status, data = query_endpoint(q)
        if status in (200, 400):
            print(f"  [PASS] Edge query repr({repr(q)[:30]}) -> Status {status}, returned {data.get('totalCount', 0)} results")
        else:
            print(f"  [FAIL] Edge query repr({repr(q)[:30]}) -> Unexpected Status {status}")
            edge_passed = False

    print("\n" + "=" * 80)
    all_passed = it1_ooc_passed and abbr_passed and stop_passed and novel_ooc_passed and overlap_passed and edge_passed
    if all_passed:
        print("FINAL VERDICT: ALL ADVERSARIAL CHALLENGES PASSED! SYSTEM PROVEN ROBUST.")
    else:
        print("FINAL VERDICT: CHALLENGES FAILED! VULNERABILITIES DETECTED.")
    print("=" * 80)

if __name__ == "__main__":
    main()
