import httpx, time, sys

BASE = "http://localhost:8000/api/v1"

def start():
    r = httpx.post(f"{BASE}/analyses", json={"url": "https://dentalstudio.co/"}, timeout=10)
    data = r.json()
    print(f"Started: {data['id']} | status: {data['status']}", flush=True)
    return data["id"]

def poll(analysis_id):
    prev = None
    for i in range(60):
        r = httpx.get(f"{BASE}/analyses/{analysis_id}", timeout=10)
        data = r.json()
        status = data["status"]
        error = data.get("error")
        if status != prev:
            print(f"[{i*3}s] STATUS: {status}", flush=True)
            prev = status
        if error:
            print(f"ERROR: {error}", flush=True)
            break
        if status == "completed":
            print("SUCCESS - Analysis completed!", flush=True)
            break
        if status == "failed":
            print(f"FAILED: {error}", flush=True)
            break
        time.sleep(3)
    else:
        print(f"TIMEOUT - stuck at: {status}", flush=True)

aid = start()
poll(aid)
