import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def clear_cache():
    async with AsyncSessionLocal() as db:
        await db.execute(text('DELETE FROM ai_summary_reports'))
        await db.commit()
        print("Cache cleared using AsyncSessionLocal")

if __name__ == "__main__":
    asyncio.run(clear_cache())
