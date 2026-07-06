"""
Crawl Quality Validator
Ensures complete data extraction before analysis begins.
Validates that all major page components are present.
"""
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class CrawlQualityResult:
    is_complete: bool
    confidence: int  # 0-100
    missing_components: list[str]
    warnings: list[str]
    evidence: dict
    should_retry: bool
    retry_reason: Optional[str] = None


class CrawlQualityValidator:
    """Validates crawl completeness before analysis."""

    def validate_page(self, page: dict) -> CrawlQualityResult:
        """Validate a single page for completeness."""
        missing = []
        warnings = []
        evidence = {}
        confidence = 100

        # 1. Check title
        title = page.get("metadata", {}).get("title")
        if not title or len(title.strip()) < 3:
            missing.append("Page title")
            confidence -= 15
        else:
            evidence["title"] = title[:50]

        # 2. Check meta description
        meta_desc = page.get("metadata", {}).get("meta_description")
        if not meta_desc:
            warnings.append("No meta description")
            confidence -= 5
        else:
            evidence["meta_description"] = meta_desc[:50]

        # 3. Check canonical
        canonical = page.get("canonical")
        if not canonical:
            warnings.append("No canonical URL")
            confidence -= 3
        else:
            evidence["canonical"] = canonical

        # 4. Check H1
        h1_list = page.get("metadata", {}).get("h1", [])
        if not h1_list or len(h1_list) == 0:
            missing.append("H1 heading")
            confidence -= 10
        else:
            evidence["h1_count"] = len(h1_list)

        # 5. Check H2
        h2_list = page.get("metadata", {}).get("h2", [])
        if not h2_list or len(h2_list) == 0:
            warnings.append("No H2 headings")
            confidence -= 5
        else:
            evidence["h2_count"] = len(h2_list)

        # 6. Check structured data (JSON-LD)
        json_ld = page.get("json_ld", [])
        if not json_ld or len(json_ld) == 0:
            warnings.append("No structured data (JSON-LD)")
            confidence -= 8
        else:
            evidence["json_ld_count"] = len(json_ld)
            evidence["schema_types"] = [s.get("@type") for s in json_ld if isinstance(s, dict)][:3]

        # 7. Check internal links
        internal_links = page.get("internal_links", [])
        if not internal_links or len(internal_links) == 0:
            missing.append("Internal links")
            confidence -= 10
        else:
            evidence["internal_links_count"] = len(internal_links)

        # 8. Check main content (paragraphs)
        paragraphs = page.get("paragraphs", [])
        if not paragraphs or len(paragraphs) == 0:
            missing.append("Main content (paragraphs)")
            confidence -= 15
        else:
            evidence["paragraph_count"] = len(paragraphs)
            evidence["avg_paragraph_length"] = sum(len(p) for p in paragraphs) // len(paragraphs)

        # 9. Check word count
        word_count = page.get("word_count", 0)
        if word_count < 100:
            missing.append("Sufficient content (word count < 100)")
            confidence -= 12
        else:
            evidence["word_count"] = word_count

        # 10. Check navigation extraction
        if not page.get("internal_links"):
            warnings.append("Navigation not extracted")
            confidence -= 5

        # 11. Check footer extraction
        # Footer is typically in the last few links
        if internal_links and len(internal_links) > 5:
            evidence["navigation_extracted"] = True
        else:
            warnings.append("Limited navigation data")
            confidence -= 3

        # Determine if page is complete
        is_complete = len(missing) == 0 and confidence >= 70
        should_retry = len(missing) > 2 or confidence < 50

        return CrawlQualityResult(
            is_complete=is_complete,
            confidence=max(0, confidence),
            missing_components=missing,
            warnings=warnings,
            evidence=evidence,
            should_retry=should_retry,
            retry_reason="Critical components missing" if should_retry else None,
        )

    def validate_crawl(self, pages: dict[str, dict]) -> CrawlQualityResult:
        """Validate entire crawl for completeness."""
        if not pages:
            return CrawlQualityResult(
                is_complete=False,
                confidence=0,
                missing_components=["No pages crawled"],
                warnings=[],
                evidence={},
                should_retry=True,
                retry_reason="Crawl returned no pages",
            )

        # Validate homepage (first page)
        homepage_url = list(pages.keys())[0]
        homepage = pages[homepage_url]

        logger.info(f"\n[CRAWL QUALITY] Validating {len(pages)} pages")
        logger.info(f"[CRAWL QUALITY] Homepage: {homepage_url}")

        # Validate homepage
        homepage_quality = self.validate_page(homepage)

        logger.info(f"[CRAWL QUALITY] Homepage Quality: {homepage_quality.confidence}%")
        logger.info(f"[CRAWL QUALITY] Missing: {homepage_quality.missing_components}")
        logger.info(f"[CRAWL QUALITY] Warnings: {homepage_quality.warnings}")

        # Aggregate stats across all pages
        total_pages = len(pages)
        pages_with_h1 = sum(1 for p in pages.values() if p.get("metadata", {}).get("h1"))
        pages_with_h2 = sum(1 for p in pages.values() if p.get("metadata", {}).get("h2"))
        pages_with_schema = sum(1 for p in pages.values() if p.get("json_ld"))
        pages_with_content = sum(1 for p in pages.values() if p.get("paragraphs"))
        pages_with_faqs = sum(1 for p in pages.values() if p.get("faqs"))

        total_word_count = sum(p.get("word_count", 0) for p in pages.values())
        avg_word_count = total_word_count // max(total_pages, 1)

        evidence = {
            "total_pages": total_pages,
            "pages_with_h1": pages_with_h1,
            "pages_with_h2": pages_with_h2,
            "pages_with_schema": pages_with_schema,
            "pages_with_content": pages_with_content,
            "pages_with_faqs": pages_with_faqs,
            "total_word_count": total_word_count,
            "avg_word_count": avg_word_count,
        }

        logger.info(f"[CRAWL QUALITY] Aggregate Stats:")
        logger.info(f"  Pages with H1: {pages_with_h1}/{total_pages}")
        logger.info(f"  Pages with H2: {pages_with_h2}/{total_pages}")
        logger.info(f"  Pages with Schema: {pages_with_schema}/{total_pages}")
        logger.info(f"  Pages with Content: {pages_with_content}/{total_pages}")
        logger.info(f"  Pages with FAQs: {pages_with_faqs}/{total_pages}")
        logger.info(f"  Total Word Count: {total_word_count}")
        logger.info(f"  Avg Word Count: {avg_word_count}")

        # Determine overall crawl quality
        missing_components = []
        warnings = []
        confidence = 100

        # Check if homepage has critical components
        if not homepage.get("metadata", {}).get("title"):
            missing_components.append("Homepage title")
            confidence -= 20

        if not homepage.get("metadata", {}).get("h1"):
            missing_components.append("Homepage H1")
            confidence -= 15

        if not homepage.get("paragraphs") or len(homepage.get("paragraphs", [])) == 0:
            missing_components.append("Homepage main content")
            confidence -= 20

        if not homepage.get("internal_links") or len(homepage.get("internal_links", [])) < 3:
            missing_components.append("Homepage navigation")
            confidence -= 10

        # Check aggregate stats
        if pages_with_h1 < total_pages * 0.5:
            warnings.append(f"Only {pages_with_h1}/{total_pages} pages have H1")
            confidence -= 8

        if pages_with_content < total_pages * 0.6:
            warnings.append(f"Only {pages_with_content}/{total_pages} pages have main content")
            confidence -= 10

        if total_word_count < 500:
            missing_components.append("Insufficient total content")
            confidence -= 15

        if pages_with_schema < total_pages * 0.3:
            warnings.append(f"Only {pages_with_schema}/{total_pages} pages have structured data")
            confidence -= 5

        is_complete = len(missing_components) == 0 and confidence >= 70
        should_retry = len(missing_components) > 1 or confidence < 50

        logger.info(f"[CRAWL QUALITY] Overall Confidence: {max(0, confidence)}%")
        logger.info(f"[CRAWL QUALITY] Complete: {is_complete}")
        logger.info(f"[CRAWL QUALITY] Should Retry: {should_retry}")

        return CrawlQualityResult(
            is_complete=is_complete,
            confidence=max(0, confidence),
            missing_components=missing_components,
            warnings=warnings,
            evidence=evidence,
            should_retry=should_retry,
            retry_reason="Crawl incomplete - critical components missing" if should_retry else None,
        )


class ExtractionValidator:
    """Validates the final extracted content before analysis begins."""
    
    def validate(self, extracted_content: dict) -> tuple[bool, str]:
        """
        Validate extracted content.
        FATAL failures:
        - Zero pages extracted
        - Total word count < 100
        
        NON-FATAL: Missing titles, H1, meta, schema on some pages.
        """
        if not extracted_content:
            return False, "Validation failed: No pages extracted."
            
        page_count = len(extracted_content)
        total_word_count = sum(p.get("word_count", 0) for p in extracted_content.values())
        
        if page_count == 0:
            return False, "Validation failed: Zero pages extracted."
            
        if total_word_count < 100:
            return False, f"Validation failed: Insufficient content depth ({total_word_count} total words across {page_count} pages)."
        
        return True, "Success"
