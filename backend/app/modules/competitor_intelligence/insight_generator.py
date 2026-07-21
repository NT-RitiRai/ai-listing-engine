import asyncio
import json
import logging
import time
from typing import Dict, List, Any
from app.modules.intelligence import _call_llm

logger = logging.getLogger(__name__)

class InsightGenerator:
    """
    Step 6-9: Competitor Intelligence & Insight Generation
    Explains Why Competitors Win, Why We Lost, and Opportunity Analysis.
    """

    async def generate_insights(self, business_context: Dict[str, Any], validated_competitors: List[Dict[str, Any]], search_results: Dict[str, Any]) -> Dict[str, Any]:
        logger.info("[INSIGHT GENERATOR] Generating competitive insights...")
        t_start = time.time()

        # Build payload for LLM analysis
        analysis_payload = {
            "business_context": business_context,
            "top_competitors": validated_competitors[:10],
            "total_queries_run": len(search_results.get("raw_results", [])),
            "top_mentions": search_results.get("leaderboard", [])[:10]
        }

        prompt = f"""You are a Principal Business Intelligence Analyst.
Analyze the following competitive data from AI search engines (ChatGPT, Gemini, etc.).

DATA PAYLOAD:
{json.dumps(analysis_payload, indent=2)[:6000]}

Generate the following insights based strictly on the provided data and business context:
1. "Why Competitors Win": Explain why the top 3 competitors are dominating AI search recommendations (e.g. better topical authority, entity coverage, schema).
2. "Why Our Business Lost": An executive-friendly explanation of why our business is being ignored by AI for commercial queries (Do NOT use technical SEO jargon).
3. "Opportunity Analysis": Provide an analysis estimating lost recommendations, lost visibility, priority improvements, and potential revenue/lead impact.
4. "Radar Dimensions": Score the target business vs its top 2 competitors (0-100) on Entity Strength, Content Depth, Topical Authority, Trust/EEAT, and Commercial Intent.
5. "Intent Matrix": Evaluate how the top 5 competitors perform (0-100 score) across 5 search query intents: Commercial, Informational, Comparison, Transactional, and Location.

Return a JSON object with this exact structure:
{{
  "why_competitors_win": [
    {{
      "company": "Competitor Name",
      "reason": "Executive explanation of why AI prefers them",
      "evidence": "Data point supporting this"
    }}
  ],
  "why_we_lost": "1-2 paragraphs of executive-friendly explanation.",
  "opportunity_analysis": {{
    "lost_recommendations": "Percentage or descriptive volume",
    "priority_improvements": ["Action 1", "Action 2"],
    "visibility_gain": "Estimated improvement if fixed",
    "potential_impact": "Impact on leads/revenue"
  }},
  "radar_dimensions": {{
    "target_business": {{
      "entity_strength": 45, "content_depth": 55, "topical_authority": 30, "trust_eeat": 60, "commercial_intent": 25
    }},
    "competitors": [
      {{
        "company": "Top Competitor",
        "entity_strength": 80, "content_depth": 85, "topical_authority": 90, "trust_eeat": 75, "commercial_intent": 95
      }}
    ]
  }},
  "intent_matrix": [
    {{
      "company": "Top Competitor",
      "scores": {{
        "Commercial": 85, "Informational": 70, "Comparison": 90, "Transactional": 80, "Location": 65
      }}
    }}
  ]
}}

Return ONLY valid JSON."""

        try:
            raw = await asyncio.wait_for(_call_llm(prompt, json_mode=True), timeout=90)
            result = json.loads(raw)
            t_elapsed = time.time() - t_start
            logger.info(f"[INSIGHT GENERATOR] Generated insights in {t_elapsed:.1f}s")
            return result
        except Exception as e:
            logger.error(f"[INSIGHT GENERATOR] FAILED: {e}")
            return self._fallback_insights()

    def _fallback_insights(self) -> Dict[str, Any]:
        return {
            "why_competitors_win": [],
            "why_we_lost": "Insufficient data to determine why AI models are ignoring the business.",
            "opportunity_analysis": {
                "lost_recommendations": "Unknown",
                "priority_improvements": ["Improve entity extraction", "Add structured data"],
                "visibility_gain": "Moderate",
                "potential_impact": "Unknown"
            },
            "radar_dimensions": {
                "target_business": { "entity_strength": 0, "content_depth": 0, "topical_authority": 0, "trust_eeat": 0, "commercial_intent": 0 },
                "competitors": []
            },
            "intent_matrix": []
        }
