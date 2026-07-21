import sys
import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import settings
from app.api.routes import router
from app.database import engine, Base

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


app = FastAPI(title="AI Listing Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # Enable WAL mode for SQLite to avoid write-lock hangs
        if settings.DATABASE_URL.startswith("sqlite"):
            await conn.execute(text("PRAGMA journal_mode=WAL"))
            await conn.execute(text("PRAGMA synchronous=NORMAL"))
            await conn.execute(text("PRAGMA busy_timeout=30000"))
            logger.info("[STARTUP] SQLite WAL mode enabled")
        await conn.run_sync(Base.metadata.create_all)

    # Reset any analyses stuck in-progress when the server was killed
    try:
        async with engine.begin() as conn:
            result = await conn.execute(
                text(
                    "UPDATE analyses SET status='failed', "
                    "error='Server restarted while analysis was in progress. Please re-run.' "
                    "WHERE status IN ('pending','crawling','extracting','analyzing','scoring','generating_prompts')"
                )
            )
            count = result.rowcount
        if count:
            logger.info(f"[STARTUP] Reset {count} stale in-progress analyses to failed")
        else:
            logger.info("[STARTUP] No stale analyses found")
    except Exception as e:
        logger.warning(f"[STARTUP] Could not reset stale analyses (non-fatal): {e}")



@app.get("/health")
async def health():
    return {"status": "ok"}

