import json
import urllib.request
import urllib.parse
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

with open(r'C:\Users\basduy05\Downloads\aurabook\tests\test_dataset_ground_truth.json', encoding='utf-8') as f:
    data = json.load(f)

test_cases = [tc for tc in data['test_cases'] if tc['feature'] == 'ai_search' or tc['id'] in ['TC-T3-01', 'TC-T3-02']]

print(f"Total target test cases: {len(test_cases)}")

for tc in test_cases:
    req = tc['request']
    url = req['endpoint']
    params = req.get('params')
    if params:
        url += '?' + urllib.parse.urlencode(params)
    method = req.get('method', 'GET')
    body = req.get('body')
    data_bytes = json.dumps(body).encode('utf-8') if body else None
    headers = req.get('headers') or {}
    if body and 'Content-Type' not in headers:
        headers['Content-Type'] = 'application/json'

    request = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            status = response.getcode()
            res_body = response.read().decode('utf-8', errors='replace')
            try:
                res_json = json.loads(res_body)
                summary = ""
                if isinstance(res_json, dict):
                    if 'products' in res_json:
                        prods = res_json.get('products', [])
                        summary = f"products count: {len(prods)}, slugs: {[p.get('slug') for p in prods[:3]]}"
                    elif 'results' in res_json:
                        results = res_json.get('results', [])
                        summary = f"results count: {len(results)}, titles: {[r.get('title') for r in results[:3]]}"
                    else:
                        summary = f"keys: {list(res_json.keys())}"
                print(f"[{tc['id']}] STATUS: {status} | {summary}")
            except Exception as e:
                print(f"[{tc['id']}] STATUS: {status} | NON-JSON: {res_body[:100]}")
    except Exception as e:
        print(f"[{tc['id']}] ERROR: {e}")
