import json
import urllib.request

query = """
mutation checkoutDeliveryMethodUpdate(
	$checkoutId: ID!
	$deliveryMethodId: ID!
) {
	checkoutDeliveryMethodUpdate(
		id: $checkoutId
		deliveryMethodId: $deliveryMethodId
	) {
		errors {
			field
			message
			code
		}
		checkout {
			id
			deliveryMethod {
				... on ShippingMethod {
					id
					name
					price {
						amount
					}
				}
			}
			totalPrice {
				gross {
					amount
					currency
				}
			}
		}
	}
}
"""

variables = {
    "checkoutId": "Q2hlY2tvdXQ6MTc5OWZlNjMtNzdmZi00YWFhLTk0NjMtZmZhODdkZGUyM2Vm",
    "deliveryMethodId": "U2hpcHBpbmdNZXRob2Q6NDg="
}

req = urllib.request.Request(
    "http://127.0.0.1:8000/graphql/",
    data=json.dumps({"query": query, "variables": variables}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode("utf-8"))
        print(json.dumps(res, indent=2, ensure_ascii=True))
except Exception as e:
    print(f"Error: {e}")
