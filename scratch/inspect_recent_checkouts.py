import urllib.request
import json

# Login admin to inspect checkouts
login_payload = json.dumps({'query': 'mutation { tokenCreate(email: "basduygame@gmail.com", password: "admin") { token } }'}).encode()
req = urllib.request.Request('http://localhost:8000/graphql/', data=login_payload, headers={'Content-Type': 'application/json'})
tok = json.loads(urllib.request.urlopen(req).read())['data']['tokenCreate']['token']
headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {tok}'}

def gql(query, variables=None):
    payload = json.dumps({'query': query, 'variables': variables or {}}).encode()
    r = urllib.request.Request('http://localhost:8000/graphql/', data=payload, headers=headers)
    return json.loads(urllib.request.urlopen(r).read())

# Check recent checkouts
res = gql("""
query {
  checkouts(first: 5) {
    edges {
      node {
        id
        email
        isShippingRequired
        shippingAddress {
          country { code }
          countryArea
          city
          streetAddress1
          postalCode
        }
        deliveryMethod {
          ... on ShippingMethod {
            id
            name
          }
        }
        lines {
          id
          quantity
          variant {
            id
            name
            product {
              name
              slug
            }
            quantityAvailable
            stocks {
              warehouse {
                name
                shippingZones {
                  name
                  countries { code }
                }
              }
              quantity
              quantityAllocated
            }
          }
        }
      }
    }
  }
}
""")

print(json.dumps(res, ensure_ascii=False, indent=2))
