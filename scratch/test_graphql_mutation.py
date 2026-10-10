import json
import urllib.request

query = """
mutation checkoutShippingAddressUpdate(
	$checkoutId: ID!
	$shippingAddress: AddressInput!
) {
	checkoutShippingAddressUpdate(
		id: $checkoutId
		shippingAddress: $shippingAddress
	) {
		errors {
			field
			message
			code
		}
		checkout {
			id
			isShippingRequired
			lines {
				id
				quantity
				variant {
					name
					product {
						name
					}
				}
			}
			shippingMethods {
				id
				name
				price {
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
    "shippingAddress": {
        "firstName": "Duy",
        "lastName": "Bas",
        "streetAddress1": "Coc Thon",
        "streetAddress2": "Cam Thuong",
        "city": "THỊ XÃ SƠN TÂY",
        "postalCode": "100000",
        "country": "VN",
        "phone": "+84912345678"
    }
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
