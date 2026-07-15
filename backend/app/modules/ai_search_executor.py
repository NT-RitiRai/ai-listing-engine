import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import PromptRun, Citation
from app.providers import get_provider
from app.modules.citation_extractor import CitationExtractor
from app.modules.brand_detector import BrandDetector
from app.modules.remediation_engine import RemediationMappingEngine
from app.modules.validation_engine import ValidationEngine
from app.modules.competitor_detector import CompetitorDetectionService

logger = logging.getLogger(__name__)

class AISearchExecutor:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.citation_extractor = CitationExtractor()
        self.brand_detector = BrandDetector(db)
        self.remediation_engine = RemediationMappingEngine(db)
        self.validation_engine = ValidationEngine()
        self.competitor_detector = CompetitorDetectionService(db)

    async def execute_prompt(self, prompt_id: str, prompt_text: str, provider_id: str, provider_name: str, analysis_id: str = None):
        provider = get_provider(provider_name)
        
        logger.info(f"Executing prompt {prompt_id} on {provider_name}")
        result = await provider.run_prompt(prompt_text)
        
        full_response = result.get("full_response", "")
        
        # Validate Prompt and Response
        prompt_category = self.validation_engine.classify_prompt(prompt_text)
        validation_data = self.validation_engine.validate_response(prompt_text, full_response, {})
        
        # Save PromptRun
        prompt_run = PromptRun(
            prompt_id=prompt_id,
            provider_id=provider_id,
            model=result.get("model"),
            full_response=full_response,
            latency=result.get("latency", 0.0),
            token_usage=result.get("token_usage", 0),
            status=result.get("status", "completed"),
            error=result.get("error"),
            request_id=result.get("request_id"),
            prompt_category=prompt_category,
            relevance_score=validation_data["relevance_score"],
            valid_response=validation_data["valid"],
            validation_reason=validation_data["validation_reason"],
            sentiment=validation_data["sentiment"]
        )
        self.db.add(prompt_run)
        await self.db.commit()
        await self.db.refresh(prompt_run)
        
        # Extract citations
        citations = []
        if full_response and validation_data["valid"]:
            citations_data = self.citation_extractor.extract_citations(
                text=full_response, 
                raw_annotations=result.get("raw_annotations")
            )
            for c_data in citations_data:
                citation = Citation(prompt_run_id=prompt_run.id, **c_data)
                citations.append(citation)
                self.db.add(citation)
            
            await self.db.commit()
            
            # Run brand detection (updates prompt_run directly)
            await self.brand_detector.analyze_citations(citations, prompt_run, full_response, analysis_id)
            
            # Run competitor detection
            await self.competitor_detector.extract_competitors(full_response, citations, prompt_run)
                
        # Run Remediation Mapping (Absorption Gate) if valid response
        if validation_data["valid"]:
            await self.remediation_engine.analyze_failure(prompt_run.id, prompt_text, analysis_id)
                
        return prompt_run
