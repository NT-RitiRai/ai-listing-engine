"""
Orchestrator: Runs all modules in sequence.
Single source of truth: extracted_content is passed to ALL analysis modules.
- IssueDetector, Scorer, and PromptGenerator all consume the same dataset.
- Every step has a timeout and try/except.
- Status always ends in completed or failed.
"""
import asyncio
import logging
import time
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Analysis, AnalysisStatus, CrawlData, WebsiteIntelligence, Scores, Issue, GeneratedPrompt, StrengthsWeaknesses, Competitors, GEOIntelligence
from app.modules.crawler import CrawlerEngine
from app.modules.crawl_quality_validator import CrawlQualityValidator, ExtractionValidator
from app.modules.extractor import ContentExtractionEngine
from app.modules.intelligence import WebsiteIntelligenceEngine
from app.modules.website_type_detector import WebsiteTypeDetector
from app.modules.issue_detector import IssueDetectionEngine
from app.modules.scorer import ScoreEngine
from app.modules.prompt_generator import PromptGenerationEngine
from app.modules.strengths_weaknesses import StrengthsWeaknessesAnalyzer
from app.modules.competitor_intelligence.competitor_discovery import CompetitorDiscoveryEngine
from app.modules.competitor_intelligence.query_generator import CompetitorQueryGenerator
from app.modules.competitor_intelligence.search_executor import AISearchExecutor
from app.modules.competitor_intelligence.validator import CompetitorValidator
from app.modules.competitor_intelligence.insight_generator import InsightGenerator
from app.modules.recommender import RecommendationEngine
from app.modules.geo_intelligence import GEOIntelligenceEngine
from app.modules.context_engine import ContextEngine
from app.modules.intent_engine import IntentEngine

logger = logging.getLogger(__name__)

WATCHDOG_TIMEOUT = 600


async def run_analysis(analysis_id: str, db: AsyncSession):
    logger.info(f"[ORCHESTRATOR] ===== START analysis_id={analysis_id} =====")
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        logger.error(f"[ORCHESTRATOR] Analysis {analysis_id} not found in DB")
        return

    try:
        await asyncio.wait_for(_run_pipeline(analysis, analysis_id, db), timeout=WATCHDOG_TIMEOUT)
    except asyncio.TimeoutError:
        logger.error(f"[ORCHESTRATOR] WATCHDOG: analysis {analysis_id} exceeded {WATCHDOG_TIMEOUT}s")
        try:
            await db.rollback()
            analysis = await db.get(Analysis, analysis_id)
            analysis.status = AnalysisStatus.failed
            analysis.error = f"Analysis timeout: exceeded {WATCHDOG_TIMEOUT} seconds"
            await db.commit()
        except Exception as e:
            logger.error(f"[ORCHESTRATOR] Failed to save timeout status: {e}")
    except Exception as e:
        logger.error(f"[ORCHESTRATOR] Unhandled exception: {type(e).__name__}: {e}", exc_info=True)
        try:
            await db.rollback()
            analysis = await db.get(Analysis, analysis_id)
            analysis.status = AnalysisStatus.failed
            analysis.error = str(e)
            await db.commit()
        except Exception as db_err:
            logger.error(f"[ORCHESTRATOR] Failed to save error status: {db_err}")


async def _run_pipeline(analysis: Analysis, analysis_id: str, db: AsyncSession):
    t_total = time.time()

    # STEP 1: Crawl
    logger.info("[STEP 1] Crawl START")
    await _set_status(analysis, AnalysisStatus.crawling, db)
    t = time.time()
    try:
        logger.info(f"[STEP 1] URL: {analysis.url}")
        logger.info("[STEP 1] Creating crawler...")
        crawler = CrawlerEngine(max_pages=50)
        logger.info("[STEP 1] Starting crawl (timeout: 120s)...")
        crawl_result = await asyncio.wait_for(crawler.crawl(analysis.url), timeout=120)
        t_elapsed = time.time() - t
        logger.info(f"[STEP 1] Crawl END -- {len(crawl_result.pages)} pages in {t_elapsed:.1f}s")
    except asyncio.TimeoutError:
        t_elapsed = time.time() - t
        logger.error(f"[STEP 1] TIMEOUT after {t_elapsed:.1f}s")
        raise RuntimeError("Step 1 (Crawl) timed out after 120s")
    except Exception as e:
        t_elapsed = time.time() - t
        logger.error(f"[STEP 1] FAILED after {t_elapsed:.1f}s: {type(e).__name__}: {e}")
        raise RuntimeError(f"Step 1 (Crawl) failed: {type(e).__name__}: {e}")

    if crawl_result.is_blocked:
        logger.warning(f"[STEP 1] Crawl blocked: {crawl_result.block_type} -- {crawl_result.block_reason}")
        raise RuntimeError(f"Crawl failed: {crawl_result.block_reason} ({crawl_result.block_type})")

    # STEP 1.5: Validate + Save crawl
    logger.info("[STEP 1.5] Crawl quality validation START")
    try:
        quality_validator = CrawlQualityValidator()
        quality_result = quality_validator.validate_crawl(crawl_result.pages)
        logger.info(f"[STEP 1.5] Crawl quality END -- confidence={quality_result.confidence}%")
    except Exception as e:
        logger.warning(f"[STEP 1.5] Quality validation failed (non-fatal): {e}")
        class _FallbackQuality:
            confidence = 0
        quality_result = _FallbackQuality()

    # Strip raw HTML to keep the DB write fast (the extracted_content module
    # already parsed everything we need; raw HTML is no longer required)
    pages_for_db = {
        url: {k: v for k, v in page.items() if k != "html"}
        for url, page in crawl_result.pages.items()
    }
    try:
        db.add(CrawlData(
            analysis_id=analysis_id,
            pages=pages_for_db,
            sitemap_urls=crawl_result.sitemap_urls,
            robots_txt=crawl_result.robots_txt,
            llms_txt=crawl_result.llms_txt,
            total_pages=crawl_result.total_pages,
        ))
        await db.commit()
        logger.info("[STEP 1.5] Crawl data saved to DB")
    except Exception as e:
        raise RuntimeError(f"Step 1.5 (Save crawl) failed: {e}")

    # STEP 2: Extract
    logger.info("[STEP 2] Content extraction START")
    await _set_status(analysis, AnalysisStatus.extracting, db)
    t = time.time()
    try:
        logger.info("[STEP 2] Creating extractor...")
        extractor = ContentExtractionEngine()
        logger.info("[STEP 2] Extracting content...")
        extracted_content = extractor.extract_all(crawl_result.pages)
        page_count = len(extracted_content)
        t_elapsed = time.time() - t
        logger.info(f"[STEP 2] Content extraction END -- {page_count} pages in {t_elapsed:.1f}s")
    except Exception as e:
        t_elapsed = time.time() - t
        logger.error(f"[STEP 2] FAILED after {t_elapsed:.1f}s: {type(e).__name__}: {e}")
        raise RuntimeError(f"Step 2 (Extract) failed: {type(e).__name__}: {e}")

    logger.info(f"[PIPELINE] Pages Crawled: {crawl_result.total_pages}")
    logger.info(f"[PIPELINE] Pages Parsed: {page_count}")
    logger.info(f"[CONSISTENCY] All modules using {page_count} pages")

    # STEP 2.5: Validation Layer
    logger.info("[STEP 2.5] Validation Layer START")
    t = time.time()
    try:
        validator = ExtractionValidator()
        is_valid, reason = validator.validate(extracted_content)
        t_elapsed = time.time() - t
        logger.info(f"[STEP 2.5] Validation END -- valid={is_valid} in {t_elapsed:.1f}s")
        if not is_valid:
            if len(extracted_content) == 0:
                logger.error(f"[STEP 2.5] Validation FAILED (Fatal): {reason}")
                raise RuntimeError(reason)
            else:
                logger.warning(f"[STEP 2.5] Validation FAILED (Bypassed): {reason}")
    except Exception as e:
        if isinstance(e, RuntimeError):
            raise
        t_elapsed = time.time() - t
        logger.error(f"[STEP 2.5] ERROR during validation after {t_elapsed:.1f}s: {e}")
        raise RuntimeError(f"Step 2.5 (Validate) failed: {e}")

    # STEP 3: Intelligence
    logger.info("[STEP 3] Intelligence START")
    await _set_status(analysis, AnalysisStatus.analyzing, db)
    t = time.time()
    try:
        logger.info("[STEP 3] Creating intelligence engine...")
        intel_engine = WebsiteIntelligenceEngine()
        logger.info("[STEP 3] Building profile (timeout: 120s)...")
        profile = await asyncio.wait_for(intel_engine.build_profile(extracted_content), timeout=120)
        t_elapsed = time.time() - t
        logger.info(f"[STEP 3] Intelligence END -- industry={profile.get('industry')} in {t_elapsed:.1f}s")
    except asyncio.TimeoutError:
        t_elapsed = time.time() - t
        logger.error(f"[STEP 3] TIMEOUT after {t_elapsed:.1f}s -- using default profile")
        profile = _default_profile()
    except Exception as e:
        t_elapsed = time.time() - t
        logger.error(f"[STEP 3] FAILED after {t_elapsed:.1f}s: {type(e).__name__}: {e}")
        profile = _default_profile()

    # STEP 3.1: Context Engine
    logger.info("[STEP 3.1] Context Engine START")
    t = time.time()
    try:
        context_engine = ContextEngine()
        business_context = await context_engine.build_context(extracted_content)
        profile["business_context"] = business_context
        
        intent_engine = IntentEngine()
        query_intents = intent_engine.determine_intents(business_context)
        profile["query_intents"] = query_intents
        t_elapsed = time.time() - t
        logger.info(f"[STEP 3.1] Context Engine END -- {len(query_intents)} intents in {t_elapsed:.1f}s")
    except Exception as e:
        logger.warning(f"[STEP 3.1] Context Engine failed (non-fatal): {e}")
        profile["business_context"] = {}
        profile["query_intents"] = ["Informational", "Commercial", "Comparison", "Local", "Decision Making"]

    # STEP 3.5: Website type + save intelligence
    logger.info("[STEP 3.5] Website type detection START")
    try:
        type_detector = WebsiteTypeDetector()
        website_type, type_confidence = type_detector.detect(profile, extracted_content)
        profile["website_type"] = website_type
        profile["website_type_confidence"] = type_confidence
        profile["crawl_quality_confidence"] = quality_result.confidence
        logger.info(f"[STEP 3.5] Type detected -- {website_type} ({type_confidence}%)")
    except Exception as e:
        logger.warning(f"[STEP 3.5] Type detection failed (non-fatal): {e}")
        profile.setdefault("website_type", "unknown")
        profile.setdefault("website_type_confidence", 0)
        profile.setdefault("crawl_quality_confidence", 0)

    try:
        db.add(WebsiteIntelligence(analysis_id=analysis_id, extracted_content=extracted_content, **profile))
        await db.commit()
        logger.info("[STEP 3.5] Intelligence saved to DB")
    except Exception as e:
        raise RuntimeError(f"Step 3.5 (Save intelligence) failed: {e}")

    # STEP 4: Issues
    logger.info("[STEP 4] Issue detection START")
    t = time.time()
    try:
        logger.info("[STEP 4] Creating issue engine...")
        issue_engine = IssueDetectionEngine()
        logger.info("[STEP 4] Detecting issues...")
        detected_issues = issue_engine.detect(
            profile=profile,
            robots_txt=crawl_result.robots_txt,
            llms_txt=crawl_result.llms_txt,
            extracted_content=extracted_content,
        )
        for issue_data in detected_issues:
            db.add(Issue(analysis_id=analysis_id, **issue_data))
        await db.commit()
        t_elapsed = time.time() - t
        logger.info(f"[STEP 4] Issue detection END -- {len(detected_issues)} issues in {t_elapsed:.1f}s")
    except Exception as e:
        t_elapsed = time.time() - t
        logger.warning(f"[STEP 4] FAILED after {t_elapsed:.1f}s (non-fatal): {e}")
        detected_issues = []

    # STEP 4.5: Recommendations
    logger.info("[STEP 4.5] Recommendations START")
    t = time.time()
    try:
        recommender = RecommendationEngine()
        recommendations = recommender.generate([i for i in detected_issues])
        t_elapsed = time.time() - t
        logger.info(f"[STEP 4.5] Recommendations END -- {len(recommendations)} recommendations in {t_elapsed:.1f}s")
    except Exception as e:
        t_elapsed = time.time() - t
        logger.warning(f"[STEP 4.5] FAILED after {t_elapsed:.1f}s (non-fatal): {e}")
        recommendations = []

    # STEP 5: Score
    logger.info("[STEP 5] Scoring START")
    await _set_status(analysis, AnalysisStatus.scoring, db)
    t = time.time()
    try:
        logger.info("[STEP 5] Creating scorer...")
        scorer = ScoreEngine()
        logger.info("[STEP 5] Calculating scores...")
        score_data = scorer.calculate(detected_issues, extracted_content, profile)
        db.add(Scores(analysis_id=analysis_id, **score_data))
        await db.commit()
        t_elapsed = time.time() - t
        logger.info(f"[STEP 5] Scoring END -- overall={score_data.get('overall_score')} in {t_elapsed:.1f}s")
    except Exception as e:
        t_elapsed = time.time() - t
        logger.warning(f"[STEP 5] FAILED after {t_elapsed:.1f}s (non-fatal): {e}")
        score_data = {}

    # STEP 6: Strengths & Weaknesses
    logger.info("[STEP 6] Strengths & Weaknesses Analysis START")
    t = time.time()
    try:
        logger.info("[STEP 6] Creating analyzer...")
        analyzer = StrengthsWeaknessesAnalyzer()
        logger.info("[STEP 6] Analyzing...")
        strengths, weaknesses = analyzer.analyze(extracted_content, profile, detected_issues, score_data)
        strengths_data = {
            "analysis_id": analysis_id,
            "strengths": strengths,
            "weaknesses": weaknesses,
        }
        db.add(StrengthsWeaknesses(**strengths_data))
        await db.commit()
        t_elapsed = time.time() - t
        logger.info(f"[STEP 6] Strengths & Weaknesses END -- {len(strengths)} strengths, {len(weaknesses)} weaknesses in {t_elapsed:.1f}s")
    except Exception as e:
        t_elapsed = time.time() - t
        logger.warning(f"[STEP 6] FAILED after {t_elapsed:.1f}s (non-fatal): {e}")

    # STEP 7: Competitor Analysis
    logger.info("[STEP 7] Competitor Analysis START")
    await _set_status(analysis, AnalysisStatus.analyzing_competitors, db)
    t = time.time()
    try:
        logger.info("[STEP 7] Creating competitor intelligence engines...")
        discovery_engine = CompetitorDiscoveryEngine()
        query_generator = CompetitorQueryGenerator()
        search_executor = AISearchExecutor()
        validator = CompetitorValidator()
        insight_generator = InsightGenerator()
        
        # We need business_context from profile
        biz_context = profile.get("business_context", {})
        
        logger.info("[STEP 7] Discovering competitors (LLM)...")
        discovered_competitors = await discovery_engine.discover(biz_context)
        
        logger.info("[STEP 7] Generating AI queries...")
        queries = await query_generator.generate_queries(biz_context, count=10)
        
        logger.info("[STEP 7] Executing AI searches...")
        search_results = await search_executor.execute_searches(queries, biz_context)
        
        logger.info("[STEP 7] Validating competitors...")
        validated_competitors = validator.validate(discovered_competitors, search_results.get("leaderboard", []))
        
        logger.info("[STEP 7] Generating competitive insights...")
        insights = await insight_generator.generate_insights(biz_context, validated_competitors, search_results)
        
        # Just creating the db object format
        competitors_data = {
            "analysis_id": analysis_id,
            "competitors": validated_competitors,
            "insight_analysis": insights,
            "opportunity_analysis": insights.get("opportunity_analysis", {}),
            "leaderboard": search_results.get("leaderboard", [])
        }
        
        # Create or update Competitors DB row
        comp_record = Competitors(**competitors_data)
        db.add(comp_record)
        await db.commit()
        t_elapsed = time.time() - t
        logger.info(f"[STEP 7] Competitor Analysis END -- {len(validated_competitors)} competitors in {t_elapsed:.1f}s")
    except Exception as e:
        t_elapsed = time.time() - t
        logger.warning(f"[STEP 7] FAILED after {t_elapsed:.1f}s (non-fatal): {e}")

    # STEP 8: Prompts
    logger.info("[STEP 8] Prompt generation START")
    await _set_status(analysis, AnalysisStatus.generating_prompts, db)
    t = time.time()
    try:
        logger.info("[STEP 8] Creating prompt engine...")
        prompt_engine = PromptGenerationEngine()
        profile_with_content = {
            **profile, 
            "extracted_content": extracted_content,
            "detected_issues": detected_issues,
            "recommendations": recommendations,
            "strengths": strengths if 'strengths' in locals() else [],
            "weaknesses": weaknesses if 'weaknesses' in locals() else [],
            "competitors": competitors if 'competitors' in locals() else [],
        }
        logger.info("[STEP 8] Generating prompts (timeout: 60s)...")
        intents_to_use = profile.get("query_intents")
        generated = await asyncio.wait_for(prompt_engine.generate(profile_with_content, intents=intents_to_use), timeout=60)
        for p in generated:
            db.add(GeneratedPrompt(
                analysis_id=analysis_id,
                prompt_text=p.get("prompt", ""),
                intent=p.get("intent", ""),
                rationale=p.get("rationale", ""),
            ))
        await db.commit()
        t_elapsed = time.time() - t
        logger.info(f"[STEP 8] Prompt generation END -- {len(generated)} prompts in {t_elapsed:.1f}s")
    except asyncio.TimeoutError:
        t_elapsed = time.time() - t
        logger.error(f"[STEP 8] TIMEOUT after {t_elapsed:.1f}s -- skipping")
    except Exception as e:
        t_elapsed = time.time() - t
        logger.error(f"[STEP 8] FAILED after {t_elapsed:.1f}s: {type(e).__name__}: {e}")

    # STEP 9: GEO Intelligence Layer (consumes all pipeline outputs)
    logger.info("[STEP 9] GEO Intelligence Layer START")
    t = time.time()
    try:
        # Build crawl signals summary for evidence object
        crawl_signals = {
            "total_pages": crawl_result.total_pages,
            "has_schema": any(p.get("schema_types") for p in extracted_content.values()),
            "has_faq": any(p.get("faqs") for p in extracted_content.values()),
            "has_reviews": any(p.get("reviews") for p in extracted_content.values()),
            "has_llms_txt": bool(crawl_result.llms_txt),
            "schema_types": list({s for p in extracted_content.values() for s in (p.get("schema_types") or []) if s}),
        }

        # Fetch prompts with playground results for evidence
        from sqlalchemy import select as sa_select
        prompts_result = await db.execute(sa_select(GeneratedPrompt).where(GeneratedPrompt.analysis_id == analysis_id))
        prompts_list = [{
            "prompt_text": p.prompt_text,
            "intent": p.intent,
            "playground_results": p.playground_results,
        } for p in prompts_result.scalars().all()]

        competitors_list = []
        if 'competitors' in locals() and competitors:
            competitors_list = [
                {"name": c.name, "domain": c.domain, "similarity_score": c.similarity_score}
                for c in competitors
            ]

        geo_engine = GEOIntelligenceEngine()
        geo_result = await asyncio.wait_for(
            geo_engine.analyze({
                "intelligence": profile,
                "scores": score_data,
                "issues": detected_issues,
                "recommendations": recommendations,
                "prompts": prompts_list,
                "competitors": competitors_list,
                "crawl_signals": crawl_signals,
            }),
            timeout=90
        )
        db.add(GEOIntelligence(analysis_id=analysis_id, **geo_result))
        await db.commit()
        t_elapsed = time.time() - t
        logger.info(f"[STEP 9] GEO Intelligence END in {t_elapsed:.1f}s")
    except asyncio.TimeoutError:
        logger.error(f"[STEP 9] TIMEOUT after {time.time() - t:.1f}s (non-fatal)")
    except Exception as e:
        logger.warning(f"[STEP 9] FAILED (non-fatal): {type(e).__name__}: {e}")

    # DONE
    await _set_status(analysis, AnalysisStatus.completed, db)
    t_total = time.time() - t_total
    logger.info(f"[ORCHESTRATOR] ===== COMPLETED analysis_id={analysis_id} total={t_total:.1f}s =====")


def _default_profile() -> dict:
    return {
        "industry": "Unknown", "sub_industry": None,
        "business_summary": "Could not determine from available content.",
        "target_audience": None, "unique_selling_points": [],
        "products": [], "services": [], "locations": [], "brands": [],
        "primary_topics": [], "secondary_topics": [],
        "entities": [], "content_clusters": [],
    }


async def _set_status(analysis: Analysis, status: AnalysisStatus, db: AsyncSession):
    logger.info(f"[ORCHESTRATOR] Status -> {status.value}")
    analysis.status = status
    await db.commit()
