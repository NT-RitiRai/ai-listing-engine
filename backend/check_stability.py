#!/usr/bin/env python3
"""
Quick Stability Check - No Database Required
Tests core modules without database.
"""
import asyncio
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

async def check_stability():
    logger.info("\n" + "="*70)
    logger.info("STABILITY CHECK - Core Modules")
    logger.info("="*70 + "\n")
    
    # Check 1: Imports
    logger.info("[CHECK 1] Module Imports...")
    try:
        from app.modules.crawler import CrawlerEngine
        from app.modules.extractor import ContentExtractionEngine
        from app.modules.crawl_quality_validator import ExtractionValidator
        from app.modules.issue_detector import IssueDetectionEngine
        from app.modules.scorer import ScoreEngine
        from app.modules.recommender import RecommendationEngine
        logger.info("✓ All modules import successfully\n")
    except Exception as e:
        logger.error(f"✗ Import failed: {e}\n")
        return False
    
    # Check 2: Validation Logic
    logger.info("[CHECK 2] Validation Logic...")
    try:
        validator = ExtractionValidator()
        
        # Test: Empty content
        is_valid, reason = validator.validate({})
        assert not is_valid, "Should fail on empty content"
        logger.info(f"  ✓ Empty content: {reason}")
        
        # Test: Low word count
        is_valid, reason = validator.validate({
            "page1": {"word_count": 50}
        })
        assert not is_valid, "Should fail on low word count"
        logger.info(f"  ✓ Low word count: {reason}")
        
        # Test: Valid content
        is_valid, reason = validator.validate({
            "page1": {"word_count": 500, "title": "Test"},
            "page2": {"word_count": 600, "title": None},  # Missing title is OK
        })
        assert is_valid, "Should pass with sufficient content"
        logger.info(f"  ✓ Valid content: {reason}\n")
        
    except Exception as e:
        logger.error(f"✗ Validation check failed: {e}\n")
        return False
    
    # Check 3: Issue Detection
    logger.info("[CHECK 3] Issue Detection...")
    try:
        issue_engine = IssueDetectionEngine()
        
        # Test with minimal data
        extracted_content = {
            "page1": {
                "title": "Test Page",
                "h1": ["Test"],
                "h2": [],
                "h3": [],
                "meta_description": "Test",
                "word_count": 500,
                "schema_types": [],
                "json_ld": [],
                "images": [],
                "internal_links": ["http://example.com/page2"],
                "external_links": [],
                "canonical": "http://example.com/page1",
                "robots_meta": None,
                "og_tags": {},
                "twitter_tags": {},
                "faqs": [],
            }
        }
        
        issues = issue_engine.detect(
            profile={"industry": "Test", "entities": []},
            robots_txt=None,
            llms_txt=None,
            extracted_content=extracted_content,
        )
        
        logger.info(f"  ✓ Detected {len(issues)} issues\n")
        
    except Exception as e:
        logger.error(f"✗ Issue detection failed: {e}\n")
        return False
    
    # Check 4: Scoring
    logger.info("[CHECK 4] Scoring...")
    try:
        scorer = ScoreEngine()
        
        score_data = scorer.calculate(issues, extracted_content)
        
        logger.info(f"  ✓ Overall score: {score_data.get('overall_score')}\n")
        
    except Exception as e:
        logger.error(f"✗ Scoring failed: {e}\n")
        return False
    
    # Check 5: Recommendations
    logger.info("[CHECK 5] Recommendations...")
    try:
        recommender = RecommendationEngine()
        
        recommendations = recommender.generate(issues)
        
        logger.info(f"  ✓ Generated {len(recommendations)} recommendations\n")
        
    except Exception as e:
        logger.error(f"✗ Recommendations failed: {e}\n")
        return False
    
    logger.info("="*70)
    logger.info("✓ ALL CHECKS PASSED - Pipeline is stable")
    logger.info("="*70 + "\n")
    
    return True

if __name__ == "__main__":
    success = asyncio.run(check_stability())
    exit(0 if success else 1)
