import sys
import json
import requests

sys.stdout.reconfigure(encoding="utf-8")

BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

results_summary = {}

def log_test(title, passed, details):
    status = "PASS" if passed else "FAIL"
    print(f"[{status}] {title}")
    results_summary[title] = {"passed": passed, "details": details}
    for k, v in details.items():
        print(f"    {k}: {v}")

def audit_backend_hybrid_search():
    print("=" * 80)
    print("FORENSIC AUDIT PART 1: Backend /aurabook/search/hybrid Verification")
    print("=" * 80)
    
    # Test 1.1: Alpha weighting verification
    res_vec = requests.post(f"{BACKEND_URL}/aurabook/search/hybrid", json={"query": "tam ly con nguoi va hanh phuc", "alpha": 1.0}).json()
    res_ft = requests.post(f"{BACKEND_URL}/aurabook/search/hybrid", json={"query": "tam ly con nguoi va hanh phuc", "alpha": 0.0}).json()
    res_mid = requests.post(f"{BACKEND_URL}/aurabook/search/hybrid", json={"query": "tam ly con nguoi va hanh phuc", "alpha": 0.5}).json()
    
    vec_scores = [r.get("score") for r in res_vec.get("results", [])]
    ft_scores = [r.get("score") for r in res_ft.get("results", [])]
    mid_scores = [r.get("score") for r in res_mid.get("results", [])]
    
    alpha_responsive = (vec_scores != ft_scores)
    log_test("Alpha Weighting Responsiveness", alpha_responsive, {
        "alpha_1.0_scores": vec_scores[:3],
        "alpha_0.0_scores": ft_scores[:3],
        "alpha_0.5_scores": mid_scores[:3],
    })
    
    # Test 1.2: Boundary Alpha clamping
    res_neg = requests.post(f"{BACKEND_URL}/aurabook/search/hybrid", json={"query": "dac nhan tam", "alpha": -5.0}).json()
    res_high = requests.post(f"{BACKEND_URL}/aurabook/search/hybrid", json={"query": "dac nhan tam", "alpha": 10.0}).json()
    res_str = requests.post(f"{BACKEND_URL}/aurabook/search/hybrid", json={"query": "dac nhan tam", "alpha": "invalid"}).json()
    log_test("Alpha Clamping & Sanitization", len(res_neg.get("results", [])) > 0 and len(res_high.get("results", [])) > 0, {
        "alpha_-5_total": res_neg.get("total"),
        "alpha_10_total": res_high.get("total"),
        "alpha_invalid_total": res_str.get("total"),
    })

    # Test 1.3: Series disambiguation: generic vs explicit
    cttt_gen = requests.post(f"{BACKEND_URL}/aurabook/search/hybrid", json={"query": "chien tranh tien te"}).json()
    cttt_t1 = requests.post(f"{BACKEND_URL}/aurabook/search/hybrid", json={"query": "chien tranh tien te tap 1"}).json()
    cttt_t2 = requests.post(f"{BACKEND_URL}/aurabook/search/hybrid", json={"query": "chien tranh tien te tap 2"}).json()
    cttt_t3 = requests.post(f"{BACKEND_URL}/aurabook/search/hybrid", json={"query": "chien tranh tien te tap 3"}).json()
    
    first_gen = cttt_gen.get("results", [{}])[0].get("product_slug")
    first_t2 = cttt_t2.get("results", [{}])[0].get("product_slug")
    first_t3 = cttt_t3.get("results", [{}])[0].get("product_slug")
    
    series_ok = (first_gen == "chien-tranh-tien-te-tap-1" and 
                 first_t2 == "chien-tranh-tien-te-tap-2" and 
                 first_t3 == "chien-tranh-tien-te-tap-3")
    log_test("Series Disambiguation (Vol 1 vs Vol 2 vs Vol 3)", series_ok, {
        "generic_first": first_gen,
        "tap_2_first": first_t2,
        "tap_3_first": first_t3,
    })

    # Test 1.4: Blind Unseen Out-of-Catalog Queries
    blind_out_queries = [
        "Sherlock Holmes Arthur Conan Doyle",
        "Game of Thrones George R R Martin",
        "Romeo and Juliet William Shakespeare",
        "Kỹ thuật trồng cây thanh long ruột đỏ",
        "Lịch sử kiến trúc Gothic châu Âu",
        "Vật lý hạt nhân và cơ học lượng tử",
        "Công thức pha chế cocktail margarita",
        "Kinh tế vĩ mô Hoa Kỳ thế kỷ 19",
        "Tiểu thuyết trinh thám Agatha Christie"
    ]
    
    blind_out_results = {}
    all_zero_hallucination = True
    for q in blind_out_queries:
        r = requests.post(f"{BACKEND_URL}/aurabook/search/hybrid", json={"query": q}).json()
        total = r.get("total", 0)
        results = r.get("results", [])
        blind_out_results[q] = {"total": total, "results_count": len(results), "top_matches": [x.get("product_slug") for x in results[:2]]}
        if total != 0 or len(results) != 0:
            all_zero_hallucination = False
            
    log_test("Unseen Out-Of-Catalog Queries (Algorithmic Zero-Hallucination)", all_zero_hallucination, blind_out_results)

    # Test 1.5: Blind In-Catalog Conceptual & Author Queries
    blind_in_queries = [
        ("nghệ thuật thu phục lòng người và lắng nghe", "dac-nhan-tam"),
        ("chú bé zeze và tình yêu thương tuổi thơ", "cay-cam-ngot-cua-toi"),
        ("tư duy hệ thống 1 và hệ thống 2 thiên kiến", "tu-duy-nhanh-va-cham"),
        ("tiền tệ dòng chảy ngầm gia tộc rothschild", "chien-tranh-tien-te-tap-1"),
        ("triết lý sống bình thản và khắc kỷ", "chu-nghia-khac-ky"),
        ("tiến hóa và cách mạng nhận thức loài người", "sapiens-luoc-su-loai-nguoi"),
        ("rèn luyện trí nhớ phương pháp phòng La Mã", "tri-tue-do-thai"),
        ("nghĩ giàu làm giàu kiên trì khát vọng", "cach-nghi-de-thanh-cong"),
        ("thực hành 4 thỏa ước bình an nội tâm", "bon-thoa-uoc")
    ]
    
    blind_in_results = {}
    all_in_matched = True
    for q, expected_slug in blind_in_queries:
        r = requests.post(f"{BACKEND_URL}/aurabook/search/hybrid", json={"query": q, "limit": 5}).json()
        results = r.get("results", [])
        top_slug = results[0].get("product_slug") if results else None
        matched = any(res.get("product_slug") == expected_slug for res in results[:3])
        blind_in_results[q] = {"expected": expected_slug, "top_slug": top_slug, "matched_top_3": matched}
        if not matched:
            all_in_matched = False
            
    log_test("Blind In-Catalog Conceptual Queries Retrieval", all_in_matched, blind_in_results)


def audit_frontend_ai_route():
    print("\n" + "=" * 80)
    print("FORENSIC AUDIT PART 2: Frontend /api/search/ai Route Verification")
    print("=" * 80)
    
    # Test 2.1: Route pass-through and parameter handling
    r_normal = requests.post(f"{FRONTEND_URL}/api/search/ai", json={"query": "dac nhan tam", "limit": 3, "alpha": 0.7}).json()
    r_empty = requests.post(f"{FRONTEND_URL}/api/search/ai", json={"query": "", "limit": 5}).json()
    r_ws = requests.post(f"{FRONTEND_URL}/api/search/ai", json={"query": "    "}).json()
    r_out = requests.post(f"{FRONTEND_URL}/api/search/ai", json={"query": "Sherlock Holmes"}).json()
    
    log_test("Frontend /api/search/ai Response Contract", 
             r_normal.get("source") == "ai_hybrid_rrf" and len(r_normal.get("results", [])) <= 3, {
                 "normal_source": r_normal.get("source"),
                 "normal_results_count": len(r_normal.get("results", [])),
                 "empty_source": r_empty.get("source"),
                 "whitespace_source": r_ws.get("source"),
                 "out_of_catalog_total": r_out.get("total")
             })


def audit_frontend_graphrag_search():
    print("\n" + "=" * 80)
    print("FORENSIC AUDIT PART 3: Frontend /api/ai/graphrag/search Verification")
    print("=" * 80)
    
    # Test 3.1: Natural language query for self-help
    r_phattrien = requests.get(f"{FRONTEND_URL}/api/ai/graphrag/search", params={"query": "tìm sách về phát triển bản thân"}).json()
    slugs = [p.get("slug") for p in r_phattrien.get("products", [])]
    expected_phattrien = {"cach-nghi-de-thanh-cong", "dac-nhan-tam"}
    pt_ok = any(s in slugs for s in expected_phattrien)
    log_test("GraphRAG Self-Development Query ('tìm sách về phát triển bản thân')", pt_ok, {
        "returned_slugs": slugs,
        "hasDirectMatch": r_phattrien.get("hasDirectMatch"),
        "totalCount": r_phattrien.get("totalCount")
    })
    
    # Test 3.2: Out of catalog query
    r_out = requests.get(f"{FRONTEND_URL}/api/ai/graphrag/search", params={"query": "Sherlock Holmes Arthur Conan Doyle"}).json()
    out_ok = (r_out.get("totalCount") == 0 and len(r_out.get("products", [])) == 0 and r_out.get("hasDirectMatch") == False)
    log_test("GraphRAG Out-Of-Catalog Honest Refusal ('Sherlock Holmes')", out_ok, {
        "products_count": len(r_out.get("products", [])),
        "totalCount": r_out.get("totalCount"),
        "hasDirectMatch": r_out.get("hasDirectMatch"),
        "reasoningSummary": r_out.get("reasoningSummary")
    })

    # Test 3.3: Diacritics Normalization across various accents
    diacritics_tests = [
        ("dAc NhAn TaM", "dac-nhan-tam"),
        ("Sapiens luoc su loai nguoi", "sapiens-luoc-su-loai-nguoi"),
        ("tu duy nhanh va cham", "tu-duy-nhanh-va-cham"),
        ("chu nghia khac ky", "chu-nghia-khac-ky")
    ]
    diacritics_all_ok = True
    diacritics_results = {}
    for q, exp_slug in diacritics_tests:
        res = requests.get(f"{FRONTEND_URL}/api/ai/graphrag/search", params={"query": q}).json()
        top_prod = res.get("products", [{}])[0].get("slug") if res.get("products") else None
        ok = (top_prod == exp_slug)
        diacritics_results[q] = {"expected": exp_slug, "top_slug": top_prod}
        if not ok:
            diacritics_all_ok = False
            
    log_test("GraphRAG Case & Diacritics Invariance", diacritics_all_ok, diacritics_results)


if __name__ == "__main__":
    audit_backend_hybrid_search()
    audit_frontend_ai_route()
    audit_frontend_graphrag_search()
    
    with open("audit_results.json", "w", encoding="utf-8") as f:
        json.dump(results_summary, f, ensure_ascii=False, indent=2)
    print("\nAudit test execution finished. Results saved to audit_results.json")
