import json

with open("ecommerce-ai-platform/data/graphrag_store.json", encoding="utf-8") as f:
    data = json.load(f)

for n in data.get("nodes", []):
    p = n.get("properties", {})
    if "slug" in p and "title" in p:
        print(f"{p.get('slug')} | {p.get('title')} | {p.get('author')} | ebook={p.get('ebookPrice')} | physical={p.get('physicalPrice')}")
