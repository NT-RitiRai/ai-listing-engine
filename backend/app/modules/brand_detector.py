from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.models import Brand, Citation, PromptRun, WebsiteIntelligence
import logging

logger = logging.getLogger(__name__)

class BrandDetector:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def analyze_citations(self, citations: list[Citation], prompt_run: PromptRun, response_text: str, analysis_id: str = None):
        """
        Compare citations against known brands and aliases in the database.
        Extracts product mentions and parent company mentions from response.
        """
        result = await self.db.execute(select(Brand).options(selectinload(Brand.aliases)))
        brands = list(result.scalars().all())
        
        brand_mentions = 0
        product_mentions = 0
        
        response_lower = response_text.lower() if response_text else ""
        
        # 1. Global Brands check
        for brand in brands:
            # Check direct mentions in response
            if brand.name.lower() in response_lower:
                brand_mentions += 1
                
            for alias in brand.aliases:
                if alias.alias_name.lower() in response_lower:
                    if alias.alias_type == "product":
                        product_mentions += 1
                    else:
                        brand_mentions += 1

            # Check domains in citations
            for citation in citations:
                if citation.domain and brand.domain and brand.domain in citation.domain:
                    brand.citation_count += 1
        
        # 2. Dynamic WebsiteIntelligence check
        if analysis_id:
            intel_result = await self.db.execute(select(WebsiteIntelligence).where(WebsiteIntelligence.analysis_id == analysis_id))
            intel = intel_result.scalar_one_or_none()
            if intel:
                for b in (intel.brands or []):
                    if b and str(b).lower() in response_lower:
                        brand_mentions += 1
                
                # Treat products and services as product mentions
                for p in (intel.products or []) + (intel.services or []):
                    if p and str(p).lower() in response_lower:
                        product_mentions += 1
        
        prompt_run.brand_mentions_count = brand_mentions
        prompt_run.product_mentions_count = product_mentions
        
        await self.db.commit()

