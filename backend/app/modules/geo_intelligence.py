"""
GEO Intelligence Layer — sits ON TOP of the existing pipeline.
Consumes the Evidence Object (all pipeline outputs) and calls OpenAI once
to generate enterprise-grade business reasoning, conversation analysis, and revenue opportunity.
"""
import json
import logging
from app.modules.intelligence import _call_llm

logger = logging.getLogger(__name__)

class GEOIntelligenceEngine:
    async def analyze(self, evidence: dict) -> dict:
        logger.info("[GEO] Building Evidence Object...")
        evidence_obj = self._build_evidence_object(evidence)

        logger.info("[GEO] Calling OpenAI for Business Intelligence transformation...")
        try:
            raw = await _call_llm(self._build_prompt(evidence_obj), json_mode=True)
            result = json.loads(raw)
        except Exception as e:
            logger.error(f"[GEO] LLM call failed: {e}")
            result = {}

        return {
            "evidence_object": evidence_obj,
            "executive_summary": result.get("executive_summary", ""),
            "ai_conversation_analysis": result.get("ai_conversation_analysis", {}),
            "revenue_opportunity": result.get("revenue_opportunity", {}),
            "business_risks": result.get("business_risks", []),
            "business_opportunities": result.get("business_opportunities", []),
            "growth_opportunities": result.get("growth_opportunities", []),
            "ai_recommendation_summary": result.get("ai_recommendation_summary", ""),
            "executive_insights": result.get("executive_insights", []),
            "roadmap_90_day": result.get("roadmap_90_day", {}),
            "top_priorities": result.get("top_priorities", []),
            "expected_outcomes": result.get("expected_outcomes", []),
        }

    def _build_evidence_object(self, evidence: dict) -> dict:
        intel = evidence.get("intelligence", {})
        scores = evidence.get("scores", {})
        issues = evidence.get("issues", [])
        recommendations = evidence.get("recommendations", [])
        prompts = evidence.get("prompts", [])
        competitors_data = evidence.get("competitors", [])
        crawl_signals = evidence.get("crawl_signals", {})
        
        # New Context Engine Data
        business_context = intel.get("business_context", {})

        ai_responses = {"openai": [], "gemini": []}
        citation_domains = []
        competitor_mentions = {}
        brand_mentioned_count = 0
        total_prompts_run = 0

        for p in prompts:
            live = (p.get("playground_results") or {}).get("live", {})
            for provider, data in live.items():
                total_prompts_run += 1
                if data.get("full_response"):
                    ai_responses[provider].append({
                        "prompt": p.get("prompt_text", ""),
                        "intent": p.get("intent", ""),
                        "brand_mentioned": (data.get("brand_mentions") or 0) > 0,
                        "product_mentions": data.get("product_mentions") or 0,
                        "citations_found": data.get("citations_found") or 0,
                        "status": data.get("status"),
                        "relevance_score": (data.get("validation") or {}).get("relevance_score", 0),
                    })
                    brand_mentioned_count += 1 if (data.get("brand_mentions") or 0) > 0 else 0
                    for c in data.get("citations", []):
                        if c.get("url"):
                            citation_domains.append(c["url"])
                    for comp in data.get("competitors", []):
                        name = comp.get("name", "")
                        if name:
                            competitor_mentions[name] = competitor_mentions.get(name, 0) + (comp.get("count") or 1)

        issue_summary = {}
        for issue in issues:
            cat = issue.get("category", "other")
            sev = issue.get("severity", "low")
            issue_summary.setdefault(cat, {}).setdefault(sev, 0)
            issue_summary[cat][sev] += 1

        top_competitors = sorted(competitor_mentions.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "business": {
                "name": business_context.get("business_name", intel.get("brands", ["Unknown"])[0] if intel.get("brands") else "Unknown"),
                "industry": business_context.get("industry", intel.get("industry", "Unknown")),
                "commercial_intent": business_context.get("commercial_intent", "Medium"),
                "target_audience": business_context.get("target_audience", intel.get("target_audience", "")),
                "unique_selling_points": business_context.get("unique_selling_proposition", intel.get("unique_selling_points", [])),
                "products": business_context.get("products", intel.get("products", [])),
                "services": business_context.get("services", intel.get("services", [])),
                "locations": business_context.get("locations", intel.get("locations", [])),
            },
            "scores": scores,
            "crawl": crawl_signals,
            "ai_visibility": {
                "total_prompts_run": total_prompts_run,
                "brand_mentioned_count": brand_mentioned_count,
                "visibility_rate": round(brand_mentioned_count / total_prompts_run * 100) if total_prompts_run else 0,
                "openai_responses": ai_responses["openai"][:3],
                "gemini_responses": ai_responses["gemini"][:3],
                "top_competitors_in_ai": top_competitors,
            },
            "issues": {
                "total": len(issues),
                "by_category": issue_summary,
            },
        }

    def _build_prompt(self, evidence: dict) -> str:
        evidence_json = json.dumps(evidence, indent=2)
        if len(evidence_json) > 15000:
            evidence_json = evidence_json[:15000] + "\\n... [evidence truncated for token budget]"

        return f"""You are an Enterprise Business Strategy Consultant and AI Visibility Expert.

Using ONLY the supplied evidence object below, generate a comprehensive enterprise AI intelligence report.

EVIDENCE OBJECT:
{evidence_json}

Return a JSON object with EXACTLY these keys:

{{
  "executive_summary": "3-4 sentence summary of current AI visibility position and commercial readiness.",

  "ai_conversation_analysis": {{
    "how_ai_describes_company": "Summary based on responses",
    "misunderstood_services": ["Services AI seems confused about"],
    "missing_knowledge": ["What AI doesn't know about this business"],
    "hallucinations": ["Any incorrect assumptions AI made (if visible in evidence, else empty)"],
    "overall_confidence": "High | Medium | Low",
    "recommendation_probability": "High | Medium | Low"
  }},

  "revenue_opportunity": {{
    "commercial_visibility_status": "Current status string",
    "lost_recommendation_share": "Estimate of percentage of commercial queries lost (e.g. '80%')",
    "priority_fixes": ["Top 3 fixes required"],
    "expected_improvement": "What happens to visibility if fixed"
  }},

  "business_risks": [
    {{"risk": "Specific risk", "evidence": "Support", "severity": "high|medium|low", "business_impact": "Impact"}}
  ],

  "business_opportunities": [
    {{"opportunity": "Opportunity", "evidence": "Support", "potential_impact": "Outcome", "effort": "low|medium|high"}}
  ],

  "growth_opportunities": [
    {{"area": "Growth area", "description": "Specific opportunity", "ai_relevance": "Why this matters to AI"}}
  ],

  "ai_recommendation_summary": "2-3 sentences explaining AI's current stance.",

  "executive_insights": [
    "Insight 1", "Insight 2", "Insight 3"
  ],

  "roadmap_90_day": {{
    "week_1": {{"theme": "Theme", "actions": ["Action 1", "Action 2"]}},
    "week_2": {{"theme": "Theme", "actions": ["Action 1", "Action 2"]}},
    "week_3": {{"theme": "Theme", "actions": ["Action 1", "Action 2"]}},
    "week_4": {{"theme": "Theme", "actions": ["Action 1", "Action 2"]}},
    "month_2": {{"theme": "Theme", "actions": ["Action 1", "Action 2"]}},
    "month_3": {{"theme": "Theme", "actions": ["Action 1", "Action 2"]}}
  }},

  "top_priorities": [
    {{"priority": 1, "action": "Action", "finding": "Finding", "business_impact": "Impact", "timeline": "Week 1", "confidence": "high"}}
  ],

  "expected_outcomes": [
    {{"outcome": "Measurable outcome", "timeframe": "90 days", "metric": "Metric improved"}}
  ]
}}

Return ONLY valid JSON."""
