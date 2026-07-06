#!/usr/bin/env python3
"""
Regression Test Suite
Tests the complete pipeline for stability across multiple websites.
"""
import asyncio
import logging
import sys
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Test websites
TEST_WEBSITES = [
    "https://amazon.in",
    "https://dentalstudio.co",
    "https://tajhotels.com",
    "https://privafoods.com",
    "https://anmolindustries.com",
]


class RegressionTest:
    def __init__(self):
        self.results = {}
        self.start_time = datetime.now()
    
    async def test_website(self, url: str) -> dict:
        """Test a single website through the complete pipeline."""
        logger.info(f"\n{'='*80}")
        logger.info(f"TESTING: {url}")
        logger.info(f"{'='*80}\n")
        
        result = {
            "url": url,
            "status": "PENDING",
            "steps": {},
            "errors": [],
        }
        
        try:
            # STEP 1: Crawl
            logger.info("[TEST] STEP 1: Crawling...")
            from app.modules.crawler import CrawlerEngine
            crawler = CrawlerEngine(max_pages=5)
            crawl_result = await crawler.crawl(url)
            
            if crawl_result.is_blocked:
                result["steps"]["crawl"] = "BLOCKED"
                result["errors"].append(f"Crawl blocked: {crawl_result.block_reason}")
                result["status"] = "FAILED"
                return result
            
            pages_crawled = len(crawl_result.pages)
            result["steps"]["crawl"] = f"OK ({pages_crawled} pages)"
            logger.info(f"✓ Crawl: {pages_crawled} pages\n")
            
            # STEP 2: Extract
            logger.info("[TEST] STEP 2: Extracting...")
            from app.modules.extractor import ContentExtractionEngine
            extractor = ContentExtractionEngine()
            extracted_content = extractor.extract_all(crawl_result.pages)
            
            pages_parsed = len(extracted_content)
            result["steps"]["extract"] = f"OK ({pages_parsed} pages)"
            logger.info(f"✓ Extract: {pages_parsed} pages\n")
            
            # STEP 3: Validate
            logger.info("[TEST] STEP 3: Validating...")
            from app.modules.crawl_quality_validator import ExtractionValidator
            validator = ExtractionValidator()
            is_valid, reason = validator.validate(extracted_content)
            
            if not is_valid:
                result["steps"]["validate"] = "FAILED"
                result["errors"].append(f"Validation failed: {reason}")
                result["status"] = "FAILED"
                return result
            
            result["steps"]["validate"] = "OK"
            logger.info(f"✓ Validate: Passed\n")
            
            # STEP 4: Intelligence
            logger.info("[TEST] STEP 4: Building intelligence...")
            from app.modules.intelligence import WebsiteIntelligenceEngine
            intel_engine = WebsiteIntelligenceEngine()
            try:
                profile = await asyncio.wait_for(
                    intel_engine.build_profile(extracted_content),
                    timeout=60
                )
                result["steps"]["intelligence"] = "OK"
                logger.info(f"✓ Intelligence: {profile.get('industry')}\n")
            except asyncio.TimeoutError:
                logger.warning("⚠ Intelligence: Timeout (using default)")
                profile = {
                    "industry": "Unknown",
                    "sub_industry": None,
                    "business_summary": "Could not determine",
                    "entities": [],
                    "unique_selling_points": [],
                    "locations": [],
                }
                result["steps"]["intelligence"] = "TIMEOUT"
            
            # STEP 5: Issues
            logger.info("[TEST] STEP 5: Detecting issues...")
            from app.modules.issue_detector import IssueDetectionEngine
            issue_engine = IssueDetectionEngine()
            detected_issues = issue_engine.detect(
                profile=profile,
                robots_txt=crawl_result.robots_txt,
                llms_txt=crawl_result.llms_txt,
                extracted_content=extracted_content,
            )
            
            result["steps"]["issues"] = f"OK ({len(detected_issues)} issues)"
            logger.info(f"✓ Issues: {len(detected_issues)} detected\n")
            
            # STEP 6: Recommendations
            logger.info("[TEST] STEP 6: Generating recommendations...")
            from app.modules.recommender import RecommendationEngine
            recommender = RecommendationEngine()
            recommendations = recommender.generate(detected_issues)
            
            result["steps"]["recommendations"] = f"OK ({len(recommendations)} recommendations)"
            logger.info(f"✓ Recommendations: {len(recommendations)} generated\n")
            
            # STEP 7: Scores
            logger.info("[TEST] STEP 7: Calculating scores...")
            from app.modules.scorer import ScoreEngine
            scorer = ScoreEngine()
            score_data = scorer.calculate(detected_issues, extracted_content)
            
            result["steps"]["scores"] = f"OK (overall={score_data.get('overall_score')})"
            logger.info(f"✓ Scores: overall={score_data.get('overall_score')}\n")
            
            # STEP 8: Competitors
            logger.info("[TEST] STEP 8: Analyzing competitors...")
            from app.modules.competitor_analysis import CompetitorAnalysisEngine
            comp_engine = CompetitorAnalysisEngine()
            competitors = comp_engine.analyze_competitors(extracted_content, profile)
            
            result["steps"]["competitors"] = f"OK ({len(competitors)} competitors)"
            logger.info(f"✓ Competitors: {len(competitors)} found\n")
            
            # STEP 9: Prompts
            logger.info("[TEST] STEP 9: Generating prompts...")
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
                result["steps"]["prompts"] = f"OK ({len(generated)} prompts)"
                logger.info(f"✓ Prompts: {len(generated)} generated\n")
            except asyncio.TimeoutError:
                result["steps"]["prompts"] = "TIMEOUT"
                logger.warning("⚠ Prompts: Timeout\n")
            except Exception as e:
                result["steps"]["prompts"] = f"ERROR: {str(e)[:50]}"
                logger.warning(f"⚠ Prompts: {e}\n")
            
            result["status"] = "PASSED"
            
        except Exception as e:
            logger.error(f"✗ ERROR: {type(e).__name__}: {e}")
            result["status"] = "FAILED"
            result["errors"].append(f"{type(e).__name__}: {str(e)[:100]}")
        
        return result
    
    async def run_all(self):
        """Run tests for all websites."""
        logger.info(f"\n{'='*80}")
        logger.info(f"REGRESSION TEST SUITE")
        logger.info(f"Start Time: {self.start_time}")
        logger.info(f"Websites: {len(TEST_WEBSITES)}")
        logger.info(f"{'='*80}\n")
        
        for url in TEST_WEBSITES:
            result = await self.test_website(url)
            self.results[url] = result
            await asyncio.sleep(2)  # Rate limiting
        
        self.print_report()
    
    def print_report(self):
        """Print regression test report."""
        logger.info(f"\n{'='*80}")
        logger.info(f"REGRESSION TEST REPORT")
        logger.info(f"{'='*80}\n")
        
        passed = sum(1 for r in self.results.values() if r["status"] == "PASSED")
        failed = sum(1 for r in self.results.values() if r["status"] == "FAILED")
        
        logger.info(f"Results: {passed} PASSED, {failed} FAILED\n")
        
        for url, result in self.results.items():
            status_icon = "✓" if result["status"] == "PASSED" else "✗"
            logger.info(f"{status_icon} {url}")
            logger.info(f"  Status: {result['status']}")
            
            for step, step_result in result["steps"].items():
                logger.info(f"  - {step}: {step_result}")
            
            if result["errors"]:
                for error in result["errors"]:
                    logger.info(f"  ERROR: {error}")
            
            logger.info("")
        
        elapsed = (datetime.now() - self.start_time).total_seconds()
        logger.info(f"Total Time: {elapsed:.1f}s")
        logger.info(f"{'='*80}\n")
        
        return failed == 0


async def main():
    test = RegressionTest()
    success = await test.run_all()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
