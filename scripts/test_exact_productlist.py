import urllib.request
import json

with open('infra/dashboard-custom/index-exGxSnlq.js', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('query ProductList(')
print('idx:', idx)
if idx != -1:
    query_str = content[idx:idx+2500]
    # find ending `
    end_idx = query_str.find('`')
    exact_query = query_str[:end_idx]
    print("Exact query snippet:\n", exact_query[:500])

    # Login as admin
    login_payload = json.dumps({'query': 'mutation { tokenCreate(email: "basduygame@gmail.com", password: "admin") { token } }'}).encode()
    req = urllib.request.Request('http://localhost:8000/graphql/', data=login_payload, headers={'Content-Type': 'application/json'})
    tok = json.loads(urllib.request.urlopen(req).read())['data']['tokenCreate']['token']

    # Test with typical dashboard variables
    vars_list = [
        {"first": 20, "hasChannel": True, "channel": "channel-vnd", "includeCategories": True, "includeCollections": True},
        {"first": 20, "hasChannel": False, "channel": None, "includeCategories": True, "includeCollections": True},
        {"first": 20, "hasChannel": True, "channel": "default-channel", "includeCategories": True, "includeCollections": True},
    ]

    for v in vars_list:
        print("\nTesting with vars:", v)
        req_p = urllib.request.Request(
            'http://localhost:8000/graphql/',
            data=json.dumps({'query': exact_query, 'variables': v}).encode(),
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
