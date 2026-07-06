import asyncio, httpx, sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.config import settings

async def main():
    print(f"[1] API Key: {settings.OPENAI_API_KEY[:12]}...", flush=True)
    print(f"[2] Connecting to OpenAI...", flush=True)
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"},
                json={"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "say ok"}], "max_tokens": 5}
            )
        print(f"[3] Status: {r.status_code}", flush=True)
        print(f"[4] Response: {r.text[:200]}", flush=True)
    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {e}", flush=True)

asyncio.run(main())
print("DONE", flush=True)
