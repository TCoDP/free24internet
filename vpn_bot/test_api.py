import config
import requests
import json
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

session = requests.Session()
login_data = {
    "username": config.PANEL_USER,
    "password": config.PANEL_PASS
}
if hasattr(config, 'PANEL_SECRET') and config.PANEL_SECRET:
    login_data["LoginSecret"] = config.PANEL_SECRET

print("Logging in...")
resp = session.post(f"{config.PANEL_URL}/login", data=login_data, timeout=5, verify=False)
print("Login status:", resp.status_code)
print("Login response:", resp.text)

payload = {
    "id": 6,
    "settings": json.dumps({"clients": [{"id": "b831381d-6324-4d53-ad4f-8cda48b30811", "flow": "xtls-rprx-vision", "email": "test", "limitIp": 1, "totalGB": 0, "expiryTime": 0, "enable": True, "tgId": "", "subId": ""}]})
}

print("Adding client...")
resp2 = session.post(f"{config.PANEL_URL}/panel/api/inbounds/addClient", json=payload, timeout=5, verify=False)
print("Add client status:", resp2.status_code)
print("Add client response:", resp2.text)
