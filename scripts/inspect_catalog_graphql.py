import sys
sys.stdout.reconfigure(encoding="utf-8")
import json
import urllib.request

URL = "http://localhost:8000/graphql/"

def run_query(query, variables=None):
    payload = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
    req = urllib.request.Request(URL, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

query = """
query GetCatalog {
    categories(first: 50) {
        edges {
            node {
                id
                name
                slug
                parent { name }
                products(channel: "channel-vnd") {
                    totalCount
                }
            }
        }
    }
    products(channel: "channel-vnd", first: 50) {
        totalCount
        edges {
            node {
                id
                name
                slug
                category { name }
                productType { name }
                thumbnail { url }
                variants {
                    id
                    name
                    sku
                    pricing {
                        price {
                            gross {
                                amount
                                currency
                            }
                        }
                    }
                }
            }
        }
    }
}
"""

res = run_query(query)
if "errors" in res:
    print("GraphQL Errors:", json.dumps(res["errors"], indent=2))
data = res.get("data") or {}

print("=== CATEGORIES ===")
for edge in data.get("categories", {}).get("edges", []):
    cat = edge["node"]
    parent = cat["parent"]["name"] if cat["parent"] else "ROOT"
    count = cat["products"]["totalCount"] if cat["products"] else 0
    print(f"📁 [{parent}] > {cat['name']} (slug={cat['slug']}, sản phẩm={count})")

print(f"\n=== SÁCH THẬT TRONG HỆ THỐNG ({data.get('products', {}).get('totalCount', 0)} sách) ===")
for edge in data.get("products", {}).get("edges", []):
    p = edge["node"]
    cat = p["category"]["name"] if p["category"] else "None"
    pt = p["productType"]["name"]
    thumb = p.get("thumbnail", {}).get("url") if p.get("thumbnail") else "None"
    print(f"\n📖 Tên sách: {p['name']}")
    print(f"   • Danh mục : {cat}")
    print(f"   • Slug     : {p['slug']}")
    print(f"   • Ảnh bìa  : {thumb}")
    print("   • Phân loại sản phẩm (Biến thể):")
    for v in p["variants"]:
        price = v["pricing"]["price"]["gross"]["amount"] if v.get("pricing") and v["pricing"].get("price") else 0
        curr = v["pricing"]["price"]["gross"]["currency"] if v.get("pricing") and v["pricing"].get("price") else "VND"
        print(f"     - {v['name']}: {price:,.0f} {curr} (SKU: {v['sku']})")
