import urllib.request
import json

query = """
query {
  product(slug: "dash-force", channel: "channel-vnd") {
    name
    pricing {
      onSale
      priceRange {
        start {
          gross {
            amount
            currency
          }
        }
      }
      priceRangeUndiscounted {
        start {
          gross {
            amount
            currency
          }
        }
      }
    }
  }
}
"""

req = urllib.request.Request('http://localhost:8000/graphql/', data=json.dumps({'query': query}).encode(), headers={'Content-Type': 'application/json'})
res = json.loads(urllib.request.urlopen(req).read())
print(json.dumps(res, indent=2))
