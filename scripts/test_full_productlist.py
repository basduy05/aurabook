import urllib.request
import json

# Full query with all fragments
full_query = """
    query ProductList($first: Int, $after: String, $last: Int, $before: String, $filter: ProductFilterInput, $search: String, $where: ProductWhereInput, $channel: String, $sort: ProductOrder, $hasChannel: Boolean!, $includeCategories: Boolean!, $includeCollections: Boolean!) {
  products(
    before: $before
    after: $after
    first: $first
    last: $last
    filter: $filter
    search: $search
    where: $where
    sortBy: $sort
    channel: $channel
  ) {
    edges {
      node {
        ...ProductWithChannelListings
        updatedAt
        created
        description
        attributes {
          ...ProductListAttribute
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
    
fragment ProductWithChannelListings on Product {
  id
  name
  thumbnail(size: 1024) {
    url
  }
  productType {
    id
    name
    hasVariants
  }
  category @include(if: $includeCategories) {
    id
    name
  }
  collections @include(if: $includeCollections) {
    id
    name
  }
  channelListings @include(if: $hasChannel) {
    id
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
    pricing @include(if: $hasChannel) {
      onSale
      priceRangeUndiscounted {
        start {
          gross {
            amount
            currency
          }
        }
        stop {
          gross {
            amount
            currency
          }
        }
      }
      priceRange {
        start {
          gross {
            amount
            currency
          }
        }
        stop {
          gross {
            amount
            currency
          }
        }
      }
    }
  }
}

fragment ProductListAttribute on SelectedAttribute {
  attribute {
    id
  }
  values {
    ...AttributeValue
  }
}

fragment AttributeValue on AttributeValue {
  id
  name
  slug
  value
  reference
  file {
    url
    contentType
  }
  boolean
  date
  dateTime
  plainText
  richText
}
"""

login_payload = json.dumps({'query': 'mutation { tokenCreate(email: "basduygame@gmail.com", password: "admin") { token } }'}).encode()
req = urllib.request.Request('http://localhost:8000/graphql/', data=login_payload, headers={'Content-Type': 'application/json'})
tok = json.loads(urllib.request.urlopen(req).read())['data']['tokenCreate']['token']

vars_list = [
    {"first": 20, "hasChannel": True, "channel": "channel-vnd", "includeCategories": True, "includeCollections": True},
    {"first": 20, "hasChannel": False, "channel": None, "includeCategories": True, "includeCollections": True},
    {"first": 20, "hasChannel": True, "channel": "default-channel", "includeCategories": True, "includeCollections": True},
]

for v in vars_list:
    print("\nTesting with vars:", v)
    req_p = urllib.request.Request(
        'http://localhost:8000/graphql/',
        data=json.dumps({'query': full_query, 'variables': v}).encode(),
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {tok}'}
    )
    try:
        r = json.loads(urllib.request.urlopen(req_p).read())
        if 'errors' in r:
            print("ERRORS:", json.dumps(r['errors'], indent=2))
        else:
            print("SUCCESS! Product count:", len(r['data']['products']['edges']))
    except urllib.error.HTTPError as e:
        print("HTTP ERROR:", e.code, e.read().decode())
    except Exception as e:
        print("EXCEPTION:", e)
