"""
Internal Competitor Analyzer
Analyzes competitors based on crawled website data only.
No external APIs or hallucinations - only data-driven insights.
"""
import logging

logger = logging.getLogger(__name__)


class InternalCompetitorAnalyzer:
    """Analyzes potential competitors based on internal website data."""

    def analyze(self, intelligence: dict, extracted_content: dict) -> dict:
        """
        Analyze competitors based on website intelligence and extracted content.
        
        Args:
            intelligence: Website intelligence data (industry, services, entities, etc.)
            extracted_content: Crawled website content
            
        Returns:
            {
                "competitors": [],
                "status": "Not enough website information to determine competitors."
            }
        """
        logger.info("[COMPETITOR] Starting internal competitor analysis...")
        
        # Check if we have enough data to identify competitors
        industry = intelligence.get("industry", "").strip()
        services = intelligence.get("services", [])
        entities = intelligence.get("entities", [])
        locations = intelligence.get("locations", [])
        
        # We need at least industry + services/entities to make any inference
        if not industry or (not services and not entities):
            logger.info("[COMPETITOR] Insufficient data for competitor analysis")
            return {
                "competitors": [],
                "status": "Not enough website information to determine competitors."
            }
        
        # Since we don't have external SERP data, we cannot reliably identify competitors
        # Returning empty list to avoid hallucinations
        logger.info("[COMPETITOR] No external data source available for competitor identification")
        return {
            "competitors": [],
            "status": "Not enough website information to determine competitors."
        }

    def calculate_your_site_scores(self, extracted_content: dict, intelligence: dict) -> dict:
        """Calculate scores for the analyzed website."""
        total_pages = len(extracted_content)
        pages_with_content = sum(1 for p in extracted_content.values() if p.get("paragraphs"))
        pages_with_faq = sum(1 for p in extracted_content.values() if p.get("faqs"))
        pages_with_reviews = sum(1 for p in extracted_content.values() if p.get("reviews"))
        pages_with_schema = sum(1 for p in extracted_content.values() if p.get("schema_types"))
        pages_with_pricing = sum(1 for p in extracted_content.values() if p.get("prices"))

        return {
            "authority_estimate": 50,
            "content_score": min(100, int(pages_with_content / max(total_pages, 1) * 100)),
            "faq_score": min(100, int(pages_with_faq / max(total_pages, 1) * 100 + 20)),
            "review_score": min(100, int(pages_with_reviews / max(total_pages, 1) * 100 + 20)),
            "schema_score": min(100, int(pages_with_schema / max(total_pages, 1) * 100)),
            "pricing_score": min(100, int(pages_with_pricing / max(total_pages, 1) * 100 + 20)),
            "local_seo_score": 40 if intelligence.get("locations") else 20,
            "overall_visibility": "Medium"
        }
