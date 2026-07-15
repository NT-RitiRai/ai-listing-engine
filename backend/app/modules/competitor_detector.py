import logging
import re
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import CompetitorMention, PromptRun, Citation

logger = logging.getLogger(__name__)

class CompetitorDetectionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        # A simple list of known top FMCG/Biscuits competitors (Can be loaded from DB in production)
        self.known_competitors = [
            "parle", "sunfeast", "mcvitie", "kellogg", "cremica", "priyagold", "patanjali", "anmol", "unibic"
        ]

    async def extract_competitors(self, response_text: str, citations: List[Citation], prompt_run: PromptRun):
        """
        Extract competitors mentioned in the response or citations.
        """
        if not response_text:
            return

        response_lower = response_text.lower()
        competitors_found = {}

        for comp in self.known_competitors:
            # Simple regex to find full word mentions
            pattern = r'\b' + comp + r'[a-z]*\b'
            matches = re.findall(pattern, response_lower)
            if matches:
                competitors_found[comp] = len(matches)

        # Look in citations too
        for citation in citations:
            if citation.domain:
                domain_lower = citation.domain.lower()
                for comp in self.known_competitors:
                    if comp in domain_lower:
                        competitors_found[comp] = competitors_found.get(comp, 0) + 1

        prompt_run.competitor_mentions_count = len(competitors_found)
        
        for comp_name, count in competitors_found.items():
            mention = CompetitorMention(
                prompt_run_id=prompt_run.id,
                competitor_name=comp_name.capitalize(),
                times_cited=count
            )
            self.db.add(mention)

        await self.db.commit()
