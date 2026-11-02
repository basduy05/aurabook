"""
Challenger M1 Reproducibility Harness
Demonstrating empirical bugs found in GraphRAG diacritics and entity search.
"""
import sys
import json
import urllib.request
import urllib.parse

def test_endpoint(query):
    url = "http://localhost:3000/api/ai/graphrag/search?" + urllib.parse.urlencode({"query": query})
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    sys.stdout.reconfigure(encoding="utf-8")
    print("=" * 70)
    print("CHALLENGER M1 EMPIRICAL BUG REPRODUCTION")
    print("=" * 70)

    # 1. Hallucination on out-of-catalog entities escaping hardcoded regex
    hallucination_queries = [
        "cách nấu phở bò",
        "chúa tể những chiếc nhẫn",
        "tây du ký tôn ngộ không",
        "cấu trúc dữ liệu và giải thuật",
        "hướng dẫn làm bánh mì",
        "naruto đại chiến",
    ]

    print("\n--- BUG 1: Out-of-catalog Entity Hallucination ---")
    for q in hallucination_queries:
        res = test_endpoint(q)
        total = res.get("totalCount", 0)
        prods = [p.get("name") for p in res.get("products", [])]
        recs = res.get("recommendations", [])
        top_score = recs[0].get("similarityScore") if recs else "N/A"
        print(f"Query: '{q}' -> Returned {total} books (Top: {prods[:1]}, Sim: {top_score}%)")
        if total > 0:
            print(f"   [FAIL - HALLUCINATION] System recommended: {prods}")

    # 2. Abbreviations returning 0 products on live endpoint
    abbr_queries = ["dnt", "đnt", "btu", "cttt 2"]
    print("\n--- BUG 2: Abbreviations Failing on Live Endpoint ---")
    for q in abbr_queries:
        res = test_endpoint(q)
        total = res.get("totalCount", 0)
        print(f"Query: '{q}' -> Returned {total} books (Expected: 1 book)")
        if total == 0:
            print(f"   [FAIL - MISSED ABBREVIATION] Endpoint returned 0 results despite resolveBookEntity supporting it.")

    # 3. Accented vs Unaccented Stop Words Bug
    print("\n--- BUG 3: Stop Words Not Filtered When Unaccented ---")
    for q in ["cuốn sách hay", "những cuốn sách nên đọc"]:
        res = test_endpoint(q)
        total = res.get("totalCount", 0)
        prods = [p.get("name") for p in res.get("products", [])]
        print(f"Query: '{q}' -> Returned {total} books: {prods[:3]}")

if __name__ == "__main__":
    main()
