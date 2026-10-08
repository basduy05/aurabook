import urllib.request
import json

login_payload = json.dumps({'query': 'mutation { tokenCreate(email: "basduygame@gmail.com", password: "admin") { token } }'}).encode()
req = urllib.request.Request('http://localhost:8000/graphql/', data=login_payload, headers={'Content-Type': 'application/json'})
tok = json.loads(urllib.request.urlopen(req).read())['data']['tokenCreate']['token']

query = '{ channels { id name slug currencyCode stockSettings { allocationStrategy } } }'
req2 = urllib.request.Request('http://localhost:8000/graphql/', data=json.dumps({'query': query}).encode(), headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {tok}'})
res = json.loads(urllib.request.urlopen(req2).read())
print(json.dumps(res, indent=2))
