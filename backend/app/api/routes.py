import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db, AsyncSessionLocal
from app.models.models import Analysis, AnalysisStatus, CrawlData, WebsiteIntelligence, Scores, Issue, GeneratedPrompt, StrengthsWeaknesses, Competitors
from app.orchestrator import run_analysis
from app.modules.recommender import RecommendationEngine
from app.modules.playground import PromptPlaygroundEngine
from app.modules.competitor_analysis import CompetitorAnalysisEngine

logger = logging.getLogger(__name__)

router = APIRouter()


class StartAnalysisRequest(BaseModel):
    url: str


class PlaygroundRequest(BaseModel):
    prompt_id: str


@router.post("/analyses")
async def start_analysis(req: StartAnalysisRequest, db: AsyncSession = Depends(get_db)):
    analysis = Analysis(url=str(req.url))
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    analysis_id = analysis.id
    status = analysis.status
    url = analysis.url

    async def run_in_new_session():
        logger.info(f"[TASK] Starting background task for {analysis_id}")
        try:
            async with AsyncSessionLocal() as new_db:
                await run_analysis(analysis_id, new_db)
        except Exception as e:
            logger.error(f"[TASK] Background task failed: {e}", exc_info=True)

    asyncio.create_task(run_in_new_session())
    return {"id": analysis_id, "status": status, "url": url}


@router.get("/analyses/{analysis_id}")
async def get_analysis(analysis_id: str, db: AsyncSession = Depends(get_db)):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    return {
        "id": analysis.id,
        "url": analysis.url,
        "status": analysis.status,
        "error": analysis.error,
        "created_at": analysis.created_at,
    }


@router.get("/analyses/{analysis_id}/scores")
async def get_scores(analysis_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scores).where(Scores.analysis_id == analysis_id))
    scores = result.scalar_one_or_none()
    if not scores:
        raise HTTPException(404, "Scores not ready")
    return {
        "seo_score": scores.seo_score,
        "aeo_score": scores.aeo_score,
        "geo_score": scores.geo_score,
        "ai_readiness_score": scores.ai_readiness_score,
        "overall_score": scores.overall_score,
        "breakdown": scores.breakdown,
    }


@router.get("/analyses/{analysis_id}/issues")
async def get_issues(analysis_id: str, category: str = None, db: AsyncSession = Depends(get_db)):
    query = select(Issue).where(Issue.analysis_id == analysis_id)
    if category:
        query = query.where(Issue.category == category)
    result = await db.execute(query)
    issues = result.scalars().all()
    return [{"id": i.id, "category": i.category, "issue_type": i.issue_type,
             "severity": i.severity, "affected_pages": i.affected_pages,
             "element": i.element, "recommendation": i.recommendation,
             "impact": i.impact, "fix_difficulty": i.fix_difficulty} for i in issues]


@router.get("/analyses/{analysis_id}/recommendations")
async def get_recommendations(analysis_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Issue).where(Issue.analysis_id == analysis_id))
    issues = result.scalars().all()
    recommender = RecommendationEngine()
    return recommender.generate([{
        "issue_type": i.issue_type, "category": i.category, "severity": i.severity,
        "recommendation": i.recommendation, "impact": i.impact,
        "fix_difficulty": i.fix_difficulty, "affected_pages": i.affected_pages,
    } for i in issues])


@router.get("/analyses/{analysis_id}/intelligence")
async def get_intelligence(analysis_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WebsiteIntelligence).where(WebsiteIntelligence.analysis_id == analysis_id))
    intel = result.scalar_one_or_none()
    if not intel:
        raise HTTPException(404, "Intelligence not ready")
    return {
        "industry": intel.industry,
        "sub_industry": intel.sub_industry,
        "business_summary": intel.business_summary,
        "products": intel.products,
        "services": intel.services,
        "locations": intel.locations,
        "brands": intel.brands,
        "primary_topics": intel.primary_topics,
        "secondary_topics": intel.secondary_topics,
        "entities": intel.entities,
        "target_audience": intel.target_audience,
        "unique_selling_points": intel.unique_selling_points,
        "content_clusters": intel.content_clusters,
        "website_type": intel.website_type,
        "website_type_confidence": intel.website_type_confidence,
        "crawl_quality_confidence": intel.crawl_quality_confidence,
    }


@router.get("/analyses/{analysis_id}/strengths-weaknesses")
async def get_strengths_weaknesses(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Get strengths and weaknesses analysis."""
    result = await db.execute(select(StrengthsWeaknesses).where(StrengthsWeaknesses.analysis_id == analysis_id))
    sw = result.scalar_one_or_none()
    if not sw:
        raise HTTPException(404, "Strengths & Weaknesses analysis not ready")
    return {
        "strengths": sw.strengths,
        "weaknesses": sw.weaknesses,
    }


@router.get("/analyses/{analysis_id}/competitors")
async def get_competitors(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Get competitor analysis."""
    result = await db.execute(select(Competitors).where(Competitors.analysis_id == analysis_id))
    comp = result.scalar_one_or_none()
    if not comp:
        raise HTTPException(404, "Competitor analysis not ready")
    return {
        "competitors": comp.competitors,
    }


@router.get("/analyses/{analysis_id}/citation-readiness")
async def get_citation_readiness(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Get citation readiness analysis."""
    crawl_result = await db.execute(select(CrawlData).where(CrawlData.analysis_id == analysis_id))
    crawl_data = crawl_result.scalar_one_or_none()
    
    intel_result = await db.execute(select(WebsiteIntelligence).where(WebsiteIntelligence.analysis_id == analysis_id))
    intel = intel_result.scalar_one_or_none()
    
    if not crawl_data or not intel:
        raise HTTPException(404, "Analysis data not ready")
    
    engine = CompetitorAnalysisEngine()
    readiness = engine.analyze_citation_readiness({"pages": crawl_data.pages}, {
        "industry": intel.industry,
        "sub_industry": intel.sub_industry,
        "entities": intel.entities,
    })
    
    return {
        "overall_score": readiness.overall_score,
        "positive_signals": readiness.positive_signals,
        "negative_signals": readiness.negative_signals,
        "platform_readiness": readiness.platform_readiness,
        "citation_sources": readiness.citation_sources,
        "missing_signals": readiness.missing_signals,
        "confidence": readiness.confidence,
    }


@router.get("/analyses/{analysis_id}/prompts")
async def get_prompts(analysis_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GeneratedPrompt).where(GeneratedPrompt.analysis_id == analysis_id))
    prompts = result.scalars().all()
    return [{"id": p.id, "prompt_text": p.prompt_text, "intent": p.intent,
             "rationale": p.rationale, "playground_results": p.playground_results} for p in prompts]


@router.post("/prompts/{prompt_id}/analyze")
async def analyze_prompt(prompt_id: str, db: AsyncSession = Depends(get_db)):
    prompt = await db.get(GeneratedPrompt, prompt_id)
    if not prompt:
        raise HTTPException(404, "Prompt not found")

    result = await db.execute(select(WebsiteIntelligence).where(WebsiteIntelligence.analysis_id == prompt.analysis_id))
    intel = result.scalar_one_or_none()
    if not intel:
        raise HTTPException(404, "Intelligence not ready")

    playground = PromptPlaygroundEngine()
    intelligence_dict = {
        "industry": intel.industry, "sub_industry": intel.sub_industry,
        "business_summary": intel.business_summary,
        "services": intel.services, "products": intel.products,
        "primary_topics": intel.primary_topics, "secondary_topics": intel.secondary_topics,
        "entities": intel.entities,
        "unique_selling_points": intel.unique_selling_points,
        "locations": intel.locations, "content_clusters": intel.content_clusters,
        "target_audience": intel.target_audience,
        "extracted_content": intel.extracted_content,
    }
    results = await playground.analyze(prompt.prompt_text, intelligence_dict)

    prompt.playground_results = results
    await db.commit()
    return {"prompt_id": prompt_id, "prompt_text": prompt.prompt_text, "results": results}
