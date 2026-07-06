import asyncio, httpx, sys

async def test():
    url = 'https://dentalstudio.co/'
    print(f'Testing: {url}', flush=True)
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, verify=False) as client:
            r = await client.get(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'})
            print(f'Status: {r.status_code}', flush=True)
            print(f'Size: {len(r.text)} bytes', flush=True)
            print(f'First 200 chars: {r.text[:200]}', flush=True)
    except Exception as e:
        print(f'ERROR: {type(e).__name__}: {e}', flush=True)

asyncio.run(test())
print('DONE', flush=True)
