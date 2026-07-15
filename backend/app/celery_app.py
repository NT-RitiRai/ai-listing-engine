from celery import Celery
from app.config import settings
import asyncio
from app.database import AsyncSessionLocal
from app.modules.ai_search_executor import AISearchExecutor
from app.models.models import Prompt
from sqlalchemy import select

# We assume a Redis broker URL is available in settings
broker_url = getattr(settings, "CELERY_BROKER_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "ai_listing_tasks",
    broker=broker_url,
    backend=broker_url
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

@celery_app.task
def run_scheduled_prompts():
    """Background task to run all enabled prompts."""
    async def _run():
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Prompt).where(Prompt.enabled == True))
            prompts = result.scalars().all()
            
            executor = AISearchExecutor(db)
            for prompt in prompts:
                # In production, we would fan this out to multiple workers
                # and run against all enabled providers.
                await executor.execute_prompt(
                    prompt_id=prompt.id,
                    prompt_text=prompt.prompt,
                    provider_id="mock_provider_id",
                    provider_name="openai"
                )
    
    asyncio.run(_run())

# Configure periodic tasks
@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Run every day at midnight (example)
    sender.add_periodic_task(86400.0, run_scheduled_prompts.s(), name='run-prompts-daily')
