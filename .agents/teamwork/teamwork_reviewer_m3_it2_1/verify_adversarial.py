import requests
import json
import sys
import io

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

queries = [
    # Books NOT in catalog and NOT in any regex pattern
    "Nhà giả kim",
    "Hoàng tử bé",
    "Đồi gió hú",
    "Trăm năm cô đơn",
    "Không gia đình",
    "Chiến tranh và hòa bình",
    "Tội ác và trừng phạt",
    "Suối nguồn",
    "Elon Musk",
    "Warren Buffett",
    "Người giàu có nhất thành Babylon",
    
    # Foreign / unicode
    "三國演義",
    "해리 포터",
    "مرحبا",
    
    # Injection & boundary
    "a",
    "   ",
    "SELECT * FROM product_product",
    "<script>alert(1)</script>",
    "!@#$%^&*()_+",
    
    # Series boundary
    "chiến tranh tiền tệ",
    "chiến tranh tiền tệ tập 1",
    "chiến tranh tiền tệ tập 2",
    "chiến tranh tiền tệ tập 3",
    "chiến tranh tiền tệ tập 4", # Not existing volume
    
    # In-catalog queries
    "dac nhan tam",
    "Đắc Nhân Tâm",
    "tư duy nhanh và chậm",
    "sapiens",
    "chủ nghĩa khắc kỷ",
    "nghệ thuật giao tiếp và thu phục lòng người",
    "rèn luyện trí nhớ phi thường",
    "tâm lý học",
    "kinh tế học"
]

print("=== BACKEND HYBRID SEARCH ADVERSARIAL VERIFICATION ===")
for q in queries:
    r = requests.post("http://localhost:8000/aurabook/search/hybrid", json={"query": q, "limit": 5})
    data = r.json()
    total = data.get("total", 0)
    slugs = [x["product_slug"] for x in data.get("results", [])]
    scores = [x["score"] for x in data.get("results", [])]
    print(f"[{total:2d}] {q:40} -> {slugs} (scores: {scores})")

print("\n=== FRONTEND AI SEARCH (/api/search/ai) ADVERSARIAL VERIFICATION ===")
for q in ["Nhà giả kim", "dac nhan tam", "chiến tranh tiền tệ", "!@#$%", "   ", ""]:
    r = requests.post("http://localhost:3000/api/search/ai", json={"query": q, "limit": 5})
    data = r.json()
    total = data.get("total", 0)
    slugs = [x["product_slug"] for x in data.get("results", [])]
    print(f"[{total:2d}] {q:25} -> {slugs}")

print("\n=== ALPHA BOUNDARY & SCORE LEAKAGE VERIFICATION ===")
for alpha in [0.0, 0.5, 1.0, -1.0, 2.0]:
    r = requests.post("http://localhost:8000/aurabook/search/hybrid", json={"query": "dac nhan tam", "alpha": alpha, "limit": 5})
    data = r.json()
    slugs = [x["product_slug"] for x in data.get("results", [])]
    scores = [x["score"] for x in data.get("results", [])]
    print(f"alpha={alpha:4} -> slugs={slugs}, scores={scores}")

# Check alpha=0.0 with out-of-catalog query
r0 = requests.post("http://localhost:8000/aurabook/search/hybrid", json={"query": "Chúa tể những chiếc nhẫn", "alpha": 0.0})
print(f"alpha=0.0 out-of-catalog -> total={r0.json().get('total')}, results={r0.json().get('results')}")

# Check alpha=1.0 with out-of-catalog query
r1 = requests.post("http://localhost:8000/aurabook/search/hybrid", json={"query": "Chúa tể những chiếc nhẫn", "alpha": 1.0})
print(f"alpha=1.0 out-of-catalog -> total={r1.json().get('total')}, results={r1.json().get('results')}")
