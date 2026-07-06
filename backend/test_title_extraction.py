#!/usr/bin/env python3
"""
Diagnostic script to trace title extraction through the complete flow.
Tests with real websites.
"""
import asyncio
import logging
from app.modules.crawler import PerformanceOptimizedCrawler
from app.modules.extractor import ContentExtractionEngine
from app.modules.crawl_quality_validator import ExtractionValidator

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

async def test_website(url: str):
    logger.info(f"\n{'='*80}")
    logger.info(f"TESTING: {url}")
    logger.info(f"{'='*80}\n")
    
    # STEP 1: Crawl
    logger.info("[STEP 1] CRAWLING...")
    crawler = PerformanceOptimizedCrawler(max_pages=5)
    crawl_result = await crawler.crawl(url)
    
    if crawl_result.is_blocked:
        logger.error(f"BLOCKED: {crawl_result.block_type} - {crawl_result.block_reason}")
        return
    
    logger.info(f"\n[CRAWL RESULT] {len(crawl_result.pages)} pages crawled")
    
    # Log raw HTML titles
    logger.info("\n[RAW HTML ANALYSIS]")
    for page_url, page_data in list(crawl_result.pages.items())[:3]:
        html = page_data.get("html", "")
        metadata = page_data.get("metadata", {})
        raw_title = metadata.get("title")
        logger.info(f"\n  URL: {page_url}")
        logger.info(f"  HTML Size: {len(html)} bytes")
        logger.info(f"  Raw Title from Crawler: {raw_title if raw_title else 'MISSING'}")
        
        # Check if title exists in raw HTML
        if "<title>" in html:
            import re
            match = re.search(r"<title[^>]*>([^<]+)</title>", html, re.IGNORECASE)
            if match:
                logger.info(f"  Title in HTML: {match.group(1)}")
            else:
                logger.info(f"  Title tag found but regex failed")
        else:
            logger.info(f"  No <title> tag in HTML")
    
    # STEP 2: Extract
    logger.info("\n[STEP 2] EXTRACTING...")
    extractor = ContentExtractionEngine()
    extracted_content = extractor.extract_all(crawl_result.pages)
    
    logger.info(f"\n[EXTRACTION RESULT] {len(extracted_content)} pages extracted")
    
    # Log extracted titles
    logger.info("\n[EXTRACTED CONTENT ANALYSIS]")
    for page_url, page_data in list(extracted_content.items())[:3]:
        title = page_data.get("title")
        h1_list = page_data.get("h1", [])
        logger.info(f"\n  URL: {page_url}")
        logger.info(f"  Extracted Title: {title if title else 'MISSING'}")
        logger.info(f"  H1: {h1_list if h1_list else 'MISSING'}")
    
    # STEP 3: Validate
    logger.info("\n[STEP 3] VALIDATING...")
    validator = ExtractionValidator()
    is_valid, reason = validator.validate(extracted_content)
    
    logger.info(f"\n[VALIDATION RESULT] Valid: {is_valid}")
    if not is_valid:
        logger.error(f"Reason: {reason}")

async def main():
    test_urls = [
        "https://amazon.in",
        "https://tajhotels.com",
        "https://anmolindustries.com",
        "https://dentalstudio.co",
    ]
    
    for url in test_urls:
        try:
            await test_website(url)
        except Exception as e:
            logger.error(f"ERROR testing {url}: {e}", exc_info=True)
        await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(main())
