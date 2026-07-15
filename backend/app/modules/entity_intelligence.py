import re
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import EntityAnalysis

class EntityIntelligence:
    def __init__(self, db: AsyncSession):
        self.db = db

    def extract_entities_from_text(self, text: str) -> list[str]:
        # Very basic entity extraction for demonstration (e.g., capitalized words > 3 chars)
        # In production, use spaCy, transformers, or the LLM response directly.
        words = re.findall(r'\b[A-Z][a-z]{3,}\b', text)
        return list(set(words))

    async def analyze_run(self, prompt_run_id: str, response_text: str):
        entities = self.extract_entities_from_text(response_text)
        
        analysis_records = []
        for ent in entities:
            record = EntityAnalysis(
                prompt_run_id=prompt_run_id,
                entity_type="Unknown",
                entity_name=ent,
                coverage_status="discovered"
            )
            self.db.add(record)
            analysis_records.append(record)
            
        await self.db.commit()
        return analysis_records
