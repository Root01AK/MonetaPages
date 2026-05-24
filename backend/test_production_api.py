import urllib.request
import urllib.parse
import json

api_url = "https://api.getmoneta.tech/api"
login_payload = {
    "username": "kirubanand20@gmail.com",
    "password": "Kirub@2001"
}

try:
    print("Logging in to get token...")
    data = urllib.parse.urlencode(login_payload).encode('utf-8')
    req = urllib.request.Request(f"{api_url}/auth/token", data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    
    with urllib.request.urlopen(req) as response:
        res_body = response.read().decode('utf-8')
        print("Login status: 200")
        token = json.loads(res_body)["access_token"]
        print("Token retrieved successfully.")
    
    print("Fetching transactions...")
    req_tx = urllib.request.Request(f"{api_url}/transactions/?month=2026-05", method="GET")
    req_tx.add_header("Authorization", f"Bearer {token}")
    
    try:
        with urllib.request.urlopen(req_tx) as response_tx:
            print("Transactions status: 200")
            print("Response body:")
            print(response_tx.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Transactions API failed with status code: {e.code}")
        print("Response body:")
        print(e.read().decode('utf-8'))

except Exception as e:
    print("Error:", e)
