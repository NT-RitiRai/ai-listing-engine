import asyncio
import threading

def run_playwright():
    try:
        asyncio.get_event_loop()
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())
    
    from playwright.sync_api import sync_playwright
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()
            page.goto("https://example.com")
            content = page.content()
            browser.close()
            return len(content)
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"

async def main():
    res = await asyncio.to_thread(run_playwright)
    print("Result:", res)

asyncio.run(main())
