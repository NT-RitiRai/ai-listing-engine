import asyncio
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import AsyncSessionLocal
from app.models.models import Analysis, CrawlData

async def main():
    db = AsyncSessionLocal()
    async with db as session:
        res = await session.execute(
            select(Analysis)
            .options(selectinload(Analysis.crawl_data))
            .where(Analysis.id=='b6e5b246-ce05-46b9-a82b-73b99455b43b')
        )
        a = res.scalar_one_or_none()
        if a:
            print("ID:", a.id)
            print("Status:", a.status)
            print("Error:", a.error)
            if a.crawl_data and a.crawl_data.pages:
                print("Pages extracted:", len(a.crawl_data.pages))
                # print first page keys
                first_url = list(a.crawl_data.pages.keys())[0]
                first_page = a.crawl_data.pages[first_url]
                print(f"First page URL: {first_url}")
                print(f"Title: {first_page.get('metadata', {}).get('title')}")
                print(f"H1: {first_page.get('metadata', {}).get('h1')}")
                print(f"HTML size: {len(first_page.get('html', ''))}")
                print(f"HTML snippet: {first_page.get('html', '')[:200]}")

asyncio.run(main())
