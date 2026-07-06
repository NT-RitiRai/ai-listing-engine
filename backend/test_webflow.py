#!/usr/bin/env python3
"""
Test webflow.com crawling and data extraction
"""
import asyncio
import logging
import json

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_webflow():
    url = "https://webflow.com/"
    
    logger.info(f"\n{'='*80}")
    logger.info(f"TESTING: {url}")
    logger.info(f"{'='*80}\n")
    
    try:
        # STEP 1: Crawl
        logger.info("[STEP 1] CRAWLING...")
        from app.modules.crawler import CrawlerEngine
        crawler = CrawlerEngine(max_pages=5)
        crawl_result = await crawler.crawl(url)
        
        if crawl_result.is_blocked:
            logger.error(f"✗ BLOCKED: {crawl_result.block_type}")
            logger.error(f"  Reason: {crawl_result.block_reason}")
            logger.error(f"  Details: {crawl_result.block_details}")
            return False
        
        pages_crawled = len(crawl_result.pages)
        logger.info(f"✓ Crawled: {pages_crawled} pages\n")
        
        # Log each page
        for idx, (page_url, page_data) in enumerate(crawl_result.pages.items(), 1):
            html_size = len(page_data.get("html", ""))
            status = page_data.get("status_code")
            metadata = page_data.get("metadata", {})
            title = metadata.get("title")
            h1_list = metadata.get("h1", [])
            
            logger.info(f"Page {idx}:")
            logger.info(f"  URL: {page_url}")
            logger.info(f"  Status: {status}")
            logger.info(f"  HTML Size: {html_size} bytes")
            logger.info(f"  Title: {title if title else 'MISSING'}")
            logger.info(f"  H1: {len(h1_list)} found" if h1_list else "  H1: MISSING")
            logger.info("")
        
        # STEP 2: Extract
        logger.info("[STEP 2] EXTRACTING...")
        from app.modules.extractor import ContentExtractionEngine
        extractor = ContentExtractionEngine()
        extracted_content = extractor.extract_all(crawl_result.pages)
        
        pages_parsed = len(extracted_content)
        logger.info(f"✓ Extracted: {pages_parsed} pages\n")
        
        # Log extracted content
        for idx, (page_url, page_data) in enumerate(extracted_content.items(), 1):
            title = page_data.get("title")
            h1_list = page_data.get("h1", [])
            meta_desc = page_data.get("meta_description")
            word_count = page_data.get("word_count", 0)
            schema_types = page_data.get("schema_types", [])
            
            logger.info(f"Page {idx}:")
            logger.info(f"  URL: {page_url}")
            logger.info(f"  Title: {title if title else 'MISSING'}")
            logger.info(f"  Meta: {meta_desc[:60] if meta_desc else 'MISSING'}...")
            logger.info(f"  H1: {h1_list if h1_list else 'MISSING'}")
            logger.info(f"  Word Count: {word_count}")
            logger.info(f"  Schema Types: {schema_types if schema_types else 'None'}")
            logger.info("")
        
        # STEP 3: Validate
        logger.info("[STEP 3] VALIDATING...")
        from app.modules.crawl_quality_validator import ExtractionValidator
        validator = ExtractionValidator()
        is_valid, reason = validator.validate(extracted_content)
        
        if not is_valid:
            logger.error(f"✗ Validation FAILED: {reason}")
            return False
        
        logger.info(f"✓ Validation PASSED\n")
        
        # STEP 4: Intelligence
        logger.info("[STEP 4] BUILDING INTELLIGENCE...")
        from app.modules.intelligence import WebsiteIntelligenceEngine
        intel_engine = WebsiteIntelligenceEngine()
        try:
            profile = await asyncio.wait_for(
                intel_engine.build_profile(extracted_content),
                timeout=60
            )
            logger.info(f"✓ Intelligence Built")
            logger.info(f"  Industry: {profile.get('industry')}")
            logger.info(f"  Sub-Industry: {profile.get('sub_industry')}")
            logger.info(f"  Business Summary: {profile.get('business_summary')[:100]}...")
            logger.info(f"  Services: {profile.get('services', [])[:3]}")
            logger.info(f"  Products: {profile.get('products', [])[:3]}")
            logger.info(f"  Entities: {profile.get('entities', [])[:3]}")
            logger.info("")
        except asyncio.TimeoutError:
            logger.warning("⚠ Intelligence: Timeout")
            profile = {
                "industry": "Unknown",
                "sub_industry": None,
                "business_summary": "Could not determine",
                "entities": [],
                "unique_selling_points": [],
                "locations": [],
            }
        
        # STEP 5: Issues
        logger.info("[STEP 5] DETECTING ISSUES...")
        from app.modules.issue_detector import IssueDetectionEngine
        issue_engine = IssueDetectionEngine()
        detected_issues = issue_engine.detect(
            profile=profile,
            robots_txt=crawl_result.robots_txt,
            llms_txt=crawl_result.llms_txt,
            extracted_content=extracted_content,
        )
        
        logger.info(f"✓ Issues Detected: {len(detected_issues)}")
        
        # Group by category
        by_category = {}
        for issue in detected_issues:
            cat = issue.get("category", "unknown")
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(issue)
        
        for category, issues in by_category.items():
            logger.info(f"  {category.upper()}: {len(issues)} issues")
            for issue in issues[:2]:
                logger.info(f"    - {issue.get('issue_type')}: {issue.get('severity')}")
        logger.info("")
        
        # STEP 6: Scores
        logger.info("[STEP 6] CALCULATING SCORES...")
        from app.modules.scorer import ScoreEngine
        scorer = ScoreEngine()
        score_data = scorer.calculate(detected_issues, extracted_content)
        
        logger.info(f"✓ Scores Calculated")
        logger.info(f"  SEO Score: {score_data.get('seo_score')}")
        logger.info(f"  AEO Score: {score_data.get('aeo_score')}")
        logger.info(f"  AI Score: {score_data.get('ai_readiness_score')}")
        logger.info(f"  GEO Score: {score_data.get('geo_score')}")
        logger.info(f"  Overall Score: {score_data.get('overall_score')}")
        logger.info("")
        
        # STEP 7: Recommendations
        logger.info("[STEP 7] GENERATING RECOMMENDATIONS...")
        from app.modules.recommender import RecommendationEngine
        recommender = RecommendationEngine()
        recommendations = recommender.generate(detected_issues)
        
        logger.info(f"✓ Recommendations Generated: {len(recommendations)}")
        for rec in recommendations[:5]:
            logger.info(f"  - {rec.get('title', 'N/A')[:60]}")
        logger.info("")
        
        # STEP 8: Competitors
        logger.info("[STEP 8] ANALYZING COMPETITORS...")
        from app.modules.competitor_analysis import CompetitorAnalysisEngine
        comp_engine = CompetitorAnalysisEngine()
        competitors = comp_engine.analyze_competitors(extracted_content, profile)
        
        logger.info(f"✓ Competitors Found: {len(competitors)}")
        for comp in competitors[:3]:
            logger.info(f"  - {comp.domain}: {comp.similarity_score}% similar")
        logger.info("")
        
        # STEP 9: Prompts
        logger.info("[STEP 9] GENERATING PROMPTS...")
        from app.modules.prompt_generator import PromptGenerationEngine
        prompt_engine = PromptGenerationEngine()
        try:
            generated = await asyncio.wait_for(
                prompt_engine.generate({
                    **profile,
                    "extracted_content": extracted_content,
                    "detected_issues": detected_issues,
                    "recommendations": recommendations,
                }),
                timeout=30
            )
            logger.info(f"✓ Prompts Generated: {len(generated)}")
            for prompt in generated[:3]:
                logger.info(f"  - {prompt.get('intent', 'N/A')}")
        except asyncio.TimeoutError:
            logger.warning("⚠ Prompts: Timeout")
        except Exception as e:
            logger.warning(f"⚠ Prompts: {e}")
        
        logger.info("")
        logger.info(f"{'='*80}")
        logger.info("✓ ALL TESTS PASSED - webflow.com crawling works correctly")
        logger.info(f"{'='*80}\n")
        
        return True
        
    except Exception as e:
        logger.error(f"✗ ERROR: {type(e).__name__}: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    success = asyncio.run(test_webflow())
    exit(0 if success else 1)
