import sys
import urllib.request
import urllib.parse
import json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

queries = [
    "tìm sách về phát triển bản thân",
    "sách cho người mới bắt đầu lập trình",
    "đắc nhân tâm",
    "dac nhan tam",
    "Harry Potter"
]

print("--- Testing Backend Hybrid Search (port 8000) ---")
for q in queries:
    req = urllib.request.Request(
        "http://localhost:8000/aurabook/search/hybrid",
        data=json.dumps({"query": q, "limit": 5}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
            print(f"Query: '{q}' -> Total: {data.get('total')}")
            for res in data.get("results", [])[:3]:
                print(f"   [{res.get('score')}] {res.get('title')} ({res.get('product_slug')})")
    except Exception as e:
        print(f"Query '{q}' Error: {e}")

print("\n--- Testing Next.js GraphRAG Search (port 3000) ---")
for q in queries:
    url = f"http://localhost:3000/api/ai/graphrag/search?query={urllib.parse.quote(q)}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
            print(f"Query: '{q}' -> isGraphRAG: {data.get('isGraphRAG')}, Total: {data.get('totalCount')}")
            for p in data.get("products", [])[:3]:
                print(f"   {p.get('name')} ({p.get('slug')})")
    except Exception as e:
        print(f"Query '{q}' Error: {e}")

print("\n--- Testing Next.js AI Search Proxy (port 3000) ---")
for q in queries:
    req = urllib.request.Request(
        "http://localhost:3000/api/search/ai",
        data=json.dumps({"query": q, "limit": 5}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
            print(f"Query: '{q}' -> Source: {data.get('source')}, Total: {data.get('total')}")
            for res in data.get("results", [])[:3]:
                print(f"   [{res.get('score')}] {res.get('title')} ({res.get('product_slug')})")
    except Exception as e:
        print(f"Query '{q}' Error: {e}")
