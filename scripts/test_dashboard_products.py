import urllib.request
import json

# 1. Login
login_payload = json.dumps({'query': 'mutation { tokenCreate(email: "basduygame@gmail.com", password: "admin") { token errors { field message } } }'}).encode()
req = urllib.request.Request('http://localhost:8000/graphql/', data=login_payload, headers={'Content-Type': 'application/json'})
try:
    resp = json.loads(urllib.request.urlopen(req).read())
    tok = resp['data']['tokenCreate']['token']
    print("Login OK")
except Exception as e:
    print("Login error:", e)
    # Check what user password is
    sys.exit(1)

# 2. Test Dashboard's exact ProductList query
product_list_query = """
query ProductList(
  $first: Int
  $after: String
  $last: Int
  $before: String
  $filter: ProductFilterInput
  $sort: ProductOrder
  $channel: String
) {
  products(
    before: $before
    after: $after
    first: $first
    last: $last
    filter: $filter
    sortBy: $sort
    channel: $channel
  ) {
    edges {
      node {
        id
        name
        thumbnail {
          url
        }
        productType {
          id
          name
        }
        channelListings {
          isPublished
          publicationDate
          isAvailableForPurchase
          availableForPurchase
          visibleInListings
          channel {
            id
            name
            currencyCode
          }
        }
      }
    }
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
  }
}
"""

req_prod = urllib.request.Request(
    'http://localhost:8000/graphql/',
    data=json.dumps({'query': product_list_query, 'variables': {'first': 20, 'channel': 'channel-vnd'}}).encode(),
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {tok}'}
)
try:
    res = json.loads(urllib.request.urlopen(req_prod).read())
    if 'errors' in res:
        print("ProductList Errors:", json.dumps(res['errors'], indent=2))
    else:
        print("ProductList SUCCESS, count:", res['data']['products']['totalCount'])
except Exception as e:
    print("ProductList Exception:", e)
