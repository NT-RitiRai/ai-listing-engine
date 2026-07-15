from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.models import PromptRun, VisibilityMetric, Citation

class ShareOfVoiceEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_metrics(self, provider_id: str | None = None) -> VisibilityMetric:
        # A simple placeholder logic for share of voice calculation
        # In a real implementation, this would group by brand, industry, etc.
        query = select(PromptRun)
        if provider_id:
            query = query.where(PromptRun.provider_id == provider_id)
            
        result = await self.db.execute(query)
        runs = list(result.scalars().all())
        
        total_runs = len(runs)
        
        if total_runs == 0:
            return VisibilityMetric(
                provider_id=provider_id,
                ai_visibility_percent=0.0,
                citation_percent=0.0
            )
            
        # Example metric: average citations per run
        # We need a robust calculation based on Brand matches
        metric = VisibilityMetric(
            provider_id=provider_id,
            ai_visibility_percent=50.0, # Placeholder
            citation_percent=75.0, # Placeholder
            mention_percent=40.0,
            win_rate=60.0,
            loss_rate=40.0,
            avg_citation_position=2.5,
            avg_response_position=1.5
        )
        self.db.add(metric)
        await self.db.commit()
        await self.db.refresh(metric)
        return metric
