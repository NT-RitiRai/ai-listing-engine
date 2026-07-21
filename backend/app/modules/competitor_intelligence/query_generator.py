import asyncio
import json
import logging
import time
from typing import Dict, List, Any
from app.modules.intelligence import _call_llm

logger = logging.getLogger(__name__)

class CompetitorQueryGenerator:
    """
    Step 3: AI Search Competitor Validation - Query Generator
    Generates high-intent search queries dynamically.
    """

    async def generate_queries(self, business_context: Dict[str, Any], count: int = 25) -> List[Dict[str, str]]:
        logger.info(f"[QUERY GENERATOR] Generating {count} high-intent queries...")
        t_start = time.time()

        prompt = f"""You are an expert AI Search Engineer.
Based on the following Business Context, generate {count} highly realistic, high-intent search queries that potential customers would use to find this business or its competitors.

BUSINESS CONTEXT:
{json.dumps(business_context, indent=2)[:3000]}

Include a mix of:
- Commercial (e.g. "Best AI SEO agency India")
- Informational (e.g. "How to improve AI visibility")
- Comparison (e.g. "Best alternatives to [Business Name]")
- Transactional (e.g. "Hire AI marketing company pricing")
- Location Based (if locations are present)

Return ONLY a JSON object with a single key "queries" containing an array of objects.
Each object must have:
- "query": the search string
- "intent": one of ["Commercial", "Informational", "Comparison", "Transactional", "Location Based"]

Return ONLY valid JSON."""

        try:
            raw = await asyncio.wait_for(_call_llm(prompt, json_mode=True), timeout=90)
            result = json.loads(raw)
            queries = result.get("queries", [])
            
            # Ensure we return at least a few even if parsing fails
            if not isinstance(queries, list) or len(queries) == 0:
                return self._fallback_queries(business_context)
                
            t_elapsed = time.time() - t_start
            logger.info(f"[QUERY GENERATOR] Generated {len(queries)} queries in {t_elapsed:.1f}s")
            return queries[:count]
            
        except Exception as e:
            logger.error(f"[QUERY GENERATOR] FAILED: {e}")
            return self._fallback_queries(business_context)

    def _fallback_queries(self, context: Dict[str, Any]) -> List[Dict[str, str]]:
        biz_name = context.get("business_name", "this business")
        industry = context.get("industry", "industry")
        return [
            {"query": f"Best {industry} companies", "intent": "Commercial"},
            {"query": f"Top alternatives to {biz_name}", "intent": "Comparison"},
            {"query": f"Hire expert for {industry}", "intent": "Transactional"},
            {"query": f"What is {industry}?", "intent": "Informational"},
            {"query": f"Top rated {industry} providers near me", "intent": "Location Based"}
        ]
