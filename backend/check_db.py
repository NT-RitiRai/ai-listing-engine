import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.models import Analysis

async def main():
    db = AsyncSessionLocal()
    async with db as session:
        res = await session.execute(select(Analysis).order_by(Analysis.created_at.desc()).limit(10))
        for a in res.scalars():
            print(a.id, a.url, a.status, a.error)

asyncio.run(main())
