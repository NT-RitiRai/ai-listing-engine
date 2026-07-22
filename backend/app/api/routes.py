import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db, AsyncSessionLocal
from app.models.models import Analysis, AnalysisStatus, CrawlData, WebsiteIntelligence, Scores, Issue, GeneratedPrompt, StrengthsWeaknesses, Competitors, GEOIntelligence
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


@router.get("/analyses/{analysis_id}/crawl-data")
async def get_crawl_data(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Get raw crawl data and extracted content."""
    crawl_result = await db.execute(select(CrawlData).where(CrawlData.analysis_id == analysis_id))
    crawl_data = crawl_result.scalar_one_or_none()
    
    intel_result = await db.execute(select(WebsiteIntelligence).where(WebsiteIntelligence.analysis_id == analysis_id))
    intel = intel_result.scalar_one_or_none()
    
    if not crawl_data and not intel:
        raise HTTPException(404, "Crawl data not found")
        
    # We strip huge HTML fields to prevent browser crash, keep clean raw data
    pages_summary = {}
    if crawl_data and crawl_data.pages:
        for url, data in crawl_data.pages.items():
            clean_data = data.copy()
            if "html" in clean_data:
                del clean_data["html"]
            pages_summary[url] = clean_data
            
    return {
        "sitemap_urls": crawl_data.sitemap_urls if crawl_data else [],
        "robots_txt": crawl_data.robots_txt if crawl_data else None,
        "llms_txt": crawl_data.llms_txt if crawl_data else None,
        "total_pages_crawled": crawl_data.total_pages if crawl_data else 0,
        "pages_data": pages_summary,
        "extracted_content": intel.extracted_content if intel else {}
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


@router.get("/analyses/{analysis_id}/geo-intelligence")
async def get_geo_intelligence(analysis_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GEOIntelligence).where(GEOIntelligence.analysis_id == analysis_id))
    geo = result.scalar_one_or_none()
    if not geo:
        raise HTTPException(404, "GEO Intelligence not ready")
    return {
        "evidence_object": geo.evidence_object,
        "executive_summary": geo.executive_summary,
        "business_risks": geo.business_risks,
        "business_opportunities": geo.business_opportunities,
        "growth_opportunities": geo.growth_opportunities,
        "ai_recommendation_summary": geo.ai_recommendation_summary,
        "executive_insights": geo.executive_insights,
        "roadmap_90_day": geo.roadmap_90_day,
        "top_priorities": geo.top_priorities,
        "expected_outcomes": geo.expected_outcomes,
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
        "insight_analysis": comp.insight_analysis,
        "opportunity_analysis": comp.opportunity_analysis,
        "leaderboard": comp.leaderboard,
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

    executor = AISearchExecutor(db)
    
    # 1. Ensure global prompt exists to satisfy FK
    result_p = await db.execute(select(AIPrompt).where(AIPrompt.prompt == prompt.prompt_text))
    global_prompt = result_p.scalar_one_or_none()
    if not global_prompt:
        global_prompt = AIPrompt(prompt=prompt.prompt_text, intent=prompt.intent)
        db.add(global_prompt)
        await db.commit()
        await db.refresh(global_prompt)

    live_results = {}
    for provider_name in ["openai", "gemini"]:
        try:
            # 2. Ensure provider exists to satisfy FK
            provider_record = await db.execute(select(Provider).where(Provider.name == provider_name))
            provider_db = provider_record.scalar_one_or_none()
            if not provider_db:
                provider_db = Provider(name=provider_name)
                db.add(provider_db)
                await db.commit()
                await db.refresh(provider_db)
                
            run = await executor.execute_prompt(global_prompt.id, prompt.prompt_text, provider_db.id, provider_name, prompt.analysis_id)
            
            # Fetch the citations
            run_result = await db.execute(select(Citation).where(Citation.prompt_run_id == run.id))
            citations = run_result.scalars().all()
            
            # Fetch competitors
            from app.models.models import CompetitorMention
            comp_result = await db.execute(select(CompetitorMention).where(CompetitorMention.prompt_run_id == run.id))
            competitors = comp_result.scalars().all()
            
            import json
            remediation = {}
            if run.remediation_note:
                try:
                    remediation = json.loads(run.remediation_note)
                except:
                    remediation = {"status": run.remediation_note, "evidence": [], "recommendations": []}

            live_results[provider_name] = {
                "status": run.status,
                "error": run.error,
                "latency": round(run.latency, 2) if run.latency else 0,
                "citations_found": len(citations),
                "citations": [{"title": c.citation_title, "url": c.citation_url, "snippet": c.response_snippet} for c in citations],
                "competitors": [{"name": c.competitor_name, "count": c.times_cited} for c in competitors],
                "remediation_note": remediation,
                "full_response": run.full_response,
                "validation": {
                    "valid": run.valid_response,
                    "relevance_score": run.relevance_score,
                    "reason": run.validation_reason,
                    "category": run.prompt_category
                },
                "brand_mentions": run.brand_mentions_count,
                "product_mentions": run.product_mentions_count
            }
        except Exception as e:
            logger.error(f"Error executing {provider_name}: {e}", exc_info=True)
            live_results[provider_name] = {"status": "failed", "error": str(e)}

    results["live"] = live_results
    prompt.playground_results = results
    await db.commit()
    return {"prompt_id": prompt_id, "prompt_text": prompt.prompt_text, "results": results}

# --- AI Search Intelligence Endpoints ---

from app.models.models import Provider, Prompt as AIPrompt, PromptRun, Citation, VisibilityMetric
from app.providers import PROVIDER_REGISTRY
from app.modules.ai_search_executor import AISearchExecutor
from app.modules.prompt_manager import PromptManager

@router.get("/providers")
async def get_providers():
    return [{"name": name, "enabled": True} for name in PROVIDER_REGISTRY.keys()]

@router.get("/prompts")
async def get_ai_prompts(db: AsyncSession = Depends(get_db)):
    manager = PromptManager(db)
    return await manager.get_all_prompts()

@router.post("/prompts")
async def create_ai_prompt(prompt_text: str, intent: str, db: AsyncSession = Depends(get_db)):
    manager = PromptManager(db)
    return await manager.create_prompt({
        "prompt": prompt_text,
        "intent": intent
    })

@router.post("/prompt/run")
async def run_ai_prompt(prompt_id: str, provider_name: str, db: AsyncSession = Depends(get_db)):
    manager = PromptManager(db)
    prompt = await manager.get_prompt_by_id(prompt_id)
    if not prompt:
        raise HTTPException(404, "Prompt not found")
        
    executor = AISearchExecutor(db)
    # create a mock provider_id for now or fetch from DB
    provider_id = "mock_provider_id"
    run = await executor.execute_prompt(prompt_id, prompt.prompt, provider_id, provider_name)
    return {"run_id": run.id, "status": run.status, "latency": run.latency}

@router.get("/citations")
async def get_citations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Citation).limit(100))
    citations = result.scalars().all()
    return citations

@router.get("/visibility")
async def get_visibility_metrics(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VisibilityMetric).limit(100))
    metrics = result.scalars().all()
    return metrics


from app.models.models import AISummaryReport
from app.modules.summary_generator import SummaryGeneratorEngine

@router.get("/analyses/{analysis_id}/summary-report")
async def get_summary_report(analysis_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AISummaryReport).where(AISummaryReport.analysis_id == analysis_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(404, "Summary report not generated yet")
    return {
        "overview": report.overview,
        "key_insights": report.key_insights,
        "competitor_analysis": report.competitor_analysis,
        "failures_analysis": report.failures_analysis,
        "improvement_plan": report.improvement_plan,
        "created_at": report.created_at
    }

@router.post("/analyses/{analysis_id}/summary-report")
async def generate_summary_report_endpoint(analysis_id: str, db: AsyncSession = Depends(get_db)):
    engine = SummaryGeneratorEngine()
    try:
        report = await engine.generate_summary_report(analysis_id, db)
        return {
            "overview": report.overview,
            "key_insights": report.key_insights,
            "competitor_analysis": report.competitor_analysis,
            "failures_analysis": report.failures_analysis,
            "improvement_plan": report.improvement_plan,
            "created_at": report.created_at
        }
    except Exception as e:
        logger.error(f"Failed to generate summary report: {e}", exc_info=True)
        raise HTTPException(500, str(e))
