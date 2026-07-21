import asyncio
import json
import logging
import time
from typing import Dict, Any
from app.modules.intelligence import _call_llm

logger = logging.getLogger(__name__)

class ContextEngine:
    """
    Context Engine: Sits after extraction.
    Consumes extracted content to build a massive `Business Context` object.
    Extracts Business Name, Industry, Categories, Products, Services, Locations, 
    Target Audience, Ideal Customer, Business Type, Brand Positioning, USP, 
    Competitors, Keywords, Commercial Intent, Business Goals, Authority Signals, 
    Trust Signals, Entity Relationships, EEAT Signals.
    """

    async def build_context(self, extracted_content: Dict[str, Any]) -> Dict[str, Any]:
        t_start = time.time()
        logger.info("[CONTEXT ENGINE] START")

        # Aggregate top content to avoid blowing up the context window
        aggregated = self._aggregate_for_context(extracted_content)

        prompt = f"""You are a Principal Business Intelligence Architect and SEO/AEO Expert.
Analyze the following extracted website content and construct a comprehensive Business Context profile.
Do NOT invent information; infer intelligently from what is available.

Extracted Content:
{json.dumps(aggregated, indent=2)[:8000]}

Return a JSON object with the following structure:
{{
    "business_name": "String",
    "industry": "String",
    "primary_category": "String",
    "secondary_categories": ["String"],
    "products": ["String"],
    "services": ["String"],
    "locations": ["String"],
    "target_audience": "String",
    "ideal_customer": "String",
    "business_type": "B2B | B2C | D2C | etc.",
    "brand_positioning": "String describing how they position themselves",
    "unique_selling_proposition": "String",
    "competitors": ["String names if mentioned, else empty"],
    "industry_keywords": ["String"],
    "commercial_intent": "High | Medium | Low",
    "business_goals": ["Inferred goals like Lead Gen, E-commerce sales, Brand Awareness"],
    "authority_signals": ["String - e.g. awards, years in business, partnerships"],
    "trust_signals": ["String - e.g. reviews, guarantees, security badges"],
    "eeat_signals": ["String - e.g. author bios, citations, expert mentions"]
}}

Return ONLY valid JSON."""

        try:
            logger.info("[CONTEXT ENGINE] Calling LLM for business context...")
            raw = await asyncio.wait_for(_call_llm(prompt, json_mode=True), timeout=60)
            context = json.loads(raw)
            t_total = time.time() - t_start
            logger.info(f"[CONTEXT ENGINE] END ({t_total:.1f}s) - Context Built")
            return context
        except asyncio.TimeoutError:
            logger.error("[CONTEXT ENGINE] LLM TIMEOUT")
            return self._fallback_context()
        except Exception as e:
            logger.error(f"[CONTEXT ENGINE] FAILED: {e}", exc_info=True)
            return self._fallback_context()

    def _aggregate_for_context(self, extracted_content: Dict[str, Any]) -> Dict[str, Any]:
        # Gather titles, headings, and a sample of paragraphs/lists
        titles = []
        headings = []
        paragraphs = []
        schema_types = []
        for url, page in list(extracted_content.items())[:15]: # Process up to 15 pages for context
            if page.get("title"):
                titles.append(page["title"])
            headings.extend(page.get("h1", []))
            headings.extend(page.get("h2", []))
            paragraphs.extend(page.get("paragraphs", [])[:3])
            schema_types.extend(page.get("schema_types", []))
            
        return {
            "titles": list(dict.fromkeys(titles)),
            "headings": list(dict.fromkeys(headings))[:30],
            "paragraphs": paragraphs[:15],
            "schema_types": list(dict.fromkeys(schema_types))
        }

    def _fallback_context(self) -> Dict[str, Any]:
        return {
            "business_name": "Unknown",
            "industry": "Unknown",
            "primary_category": "Unknown",
            "secondary_categories": [],
            "products": [],
            "services": [],
            "locations": [],
            "target_audience": "Unknown",
            "ideal_customer": "Unknown",
            "business_type": "Unknown",
            "brand_positioning": "Unknown",
            "unique_selling_proposition": "Unknown",
            "competitors": [],
            "industry_keywords": [],
            "commercial_intent": "Low",
            "business_goals": [],
            "authority_signals": [],
            "trust_signals": [],
            "eeat_signals": []
        }
