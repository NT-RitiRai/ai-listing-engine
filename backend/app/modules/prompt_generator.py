"""
Module 7: Prompt Generation Engine
Input: WebsiteIntelligence profile (includes extracted_content)
Output: Exactly 5 niche-specific prompts grounded in actual crawled content.

CRITICAL: Every LLM call has explicit timeout. Never waits forever.
"""
import asyncio
import json
import logging
import time
from app.modules.intelligence import _call_llm

logger = logging.getLogger(__name__)

INTENTS = ["informational", "commercial", "transactional", "comparison", "local"]
FALLBACK_INTENTS = ["informational", "commercial", "transactional", "comparison", "educational"]

# Timeout for LLM calls (seconds)
LLM_TIMEOUT = 30
TOTAL_TIMEOUT = 60


class PromptGenerationEngine:
    def __init__(self):
        pass

    async def generate(self, intelligence: dict) -> list[dict]:
        """Generate 5 niche-specific prompts with timeout protection."""
        t_start = time.time()
        logger.info("[PROMPT] ===== START =====")
        
        try:
            has_location = bool(intelligence.get("locations"))
            intents = INTENTS if has_location else FALLBACK_INTENTS
            logger.info(f"[PROMPT] Location detected: {has_location}, using intents: {intents}")

            # Extract evidence from crawled content
            logger.info("[PROMPT] Extracting evidence from crawled content...")
            extracted = intelligence.get("extracted_content", {})
            all_h1, all_h2, all_faqs, all_prices = [], [], [], []
            
            for page in extracted.values():
                all_h1.extend(page.get("h1", []))
                all_h2.extend(page.get("h2", []))
                all_faqs.extend([f["question"] for f in page.get("faqs", [])])
                all_prices.extend(page.get("prices", []))

            evidence = {
                "industry": intelligence.get("industry"),
                "sub_industry": intelligence.get("sub_industry"),
                "business_summary": intelligence.get("business_summary"),
                "services": intelligence.get("services", [])[:10],
                "products": intelligence.get("products", [])[:10],
                "locations": intelligence.get("locations", [])[:5],
                "entities": intelligence.get("entities", [])[:10],
                "unique_selling_points": intelligence.get("unique_selling_points", []),
                "target_audience": intelligence.get("target_audience"),
                "actual_page_headings": list(dict.fromkeys(all_h1 + all_h2))[:20],
                "actual_faqs": list(dict.fromkeys(all_faqs))[:10],
                "prices_found": list(dict.fromkeys(all_prices))[:5],
                "page_count": len(extracted),
                "competitors": [c.get("name") for c in intelligence.get("competitors", [])][:3] if isinstance(intelligence.get("competitors"), list) else [],
                "strengths": [s.get("title") for s in intelligence.get("strengths", [])][:3] if isinstance(intelligence.get("strengths"), list) else [],
                "weaknesses": [w.get("title") for w in intelligence.get("weaknesses", [])][:3] if isinstance(intelligence.get("weaknesses"), list) else [],
                "issues": [i.get("issue_type") for i in intelligence.get("detected_issues", [])][:3] if isinstance(intelligence.get("detected_issues"), list) else [],
                "recommendations": [r.get("recommendation") for r in intelligence.get("recommendations", [])][:3] if isinstance(intelligence.get("recommendations"), list) else [],
            }
            logger.info(f"[PROMPT] Evidence extracted: {len(evidence)} fields, {len(extracted)} pages")

            # Build prompt
            logger.info("[PROMPT] Building LLM prompt...")
            prompt = f"""You are generating AI search prompts for a specific website based on its actual crawled content.

Website Evidence (from actual crawl):
{json.dumps(evidence, indent=2)[:3000]}

Generate exactly 5 search prompts that a real user would type into ChatGPT, Gemini, or Perplexity to find this specific business.

Rules:
- STRICT GROUNDING: Each prompt MUST reference actual services, products, locations, entities, or competitors found in the evidence above.
- NEVER invent or guess services/products/locations that are not explicitly listed in the evidence.
- Do NOT use generic phrases like "what is healthcare" or "what is AI".
- Each prompt must be 3-9 words.
- Cover these 5 intents in order: {intents}
- No duplicates.
- Prompts must be specific enough that only this type of business would rank for them.

Return a JSON object with key "prompts" containing an array of 5 objects, each with:
- "prompt": the search query string (specific to this business)
- "intent": one of {intents}
- "rationale": one sentence citing which specific crawled evidence (heading/service/location/competitor) justifies this prompt"""


            logger.info("[PROMPT] Calling LLM with timeout protection...")
            t_llm = time.time()
            
            # Call LLM with timeout
            try:
                raw = await asyncio.wait_for(
                    _call_llm(prompt),
                    timeout=LLM_TIMEOUT
                )
                t_llm_elapsed = time.time() - t_llm
                logger.info(f"[PROMPT] LLM returned in {t_llm_elapsed:.1f}s")
            except asyncio.TimeoutError:
                logger.error(f"[PROMPT] LLM TIMED OUT after {LLM_TIMEOUT}s")
                logger.info("[PROMPT] Using fallback prompts")
                return self._fallback_prompts()
            except Exception as e:
                logger.error(f"[PROMPT] LLM error: {type(e).__name__}: {e}")
                logger.info("[PROMPT] Using fallback prompts")
                return self._fallback_prompts()

            # Parse JSON
            logger.info("[PROMPT] Parsing JSON response...")
            try:
                result = json.loads(raw)
                logger.info("[PROMPT] JSON parsed successfully")
            except json.JSONDecodeError as e:
                logger.error(f"[PROMPT] JSON parse error: {e}")
                logger.info("[PROMPT] Using fallback prompts")
                return self._fallback_prompts()

            # Extract prompts
            logger.info("[PROMPT] Extracting prompts from response...")
            if isinstance(result, dict):
                prompts_list = result.get("prompts") or result.get("results") or list(result.values())[0]
            else:
                prompts_list = result

            if not prompts_list:
                logger.warning("[PROMPT] No prompts in response")
                return self._fallback_prompts()

            prompts_list = prompts_list[:5]
            logger.info(f"[PROMPT] Generated {len(prompts_list)} prompts")
            
            # Validate each prompt
            validated = []
            for i, p in enumerate(prompts_list):
                logger.info(f"[PROMPT] Validating prompt {i+1}: {p.get('prompt', 'N/A')}")
                if isinstance(p, dict) and "prompt" in p and "intent" in p:
                    validated.append(p)
                    logger.info(f"[PROMPT] Prompt {i+1} valid")
                else:
                    logger.warning(f"[PROMPT] Prompt {i+1} invalid format")

            if not validated:
                logger.warning("[PROMPT] No valid prompts after validation")
                return self._fallback_prompts()

            t_total = time.time() - t_start
            logger.info(f"[PROMPT] ===== DONE ({len(validated)} prompts in {t_total:.1f}s) =====")
            return validated

        except Exception as e:
            logger.error(f"[PROMPT] Unexpected error: {type(e).__name__}: {e}", exc_info=True)
            t_total = time.time() - t_start
            logger.info(f"[PROMPT] ===== FAILED ({t_total:.1f}s) - using fallback =====")
            return self._fallback_prompts()

    def _fallback_prompts(self) -> list[dict]:
        """Return fallback prompts if generation fails."""
        logger.info("[PROMPT] Generating fallback prompts...")
        fallback = [
            {
                "prompt": "Business inquiry",
                "intent": "informational",
                "rationale": "Fallback prompt - LLM generation failed"
            },
            {
                "prompt": "Service information",
                "intent": "commercial",
                "rationale": "Fallback prompt - LLM generation failed"
            },
            {
                "prompt": "How to contact",
                "intent": "transactional",
                "rationale": "Fallback prompt - LLM generation failed"
            },
            {
                "prompt": "Compare options",
                "intent": "comparison",
                "rationale": "Fallback prompt - LLM generation failed"
            },
            {
                "prompt": "Local availability",
                "intent": "local",
                "rationale": "Fallback prompt - LLM generation failed"
            }
        ]
        logger.info(f"[PROMPT] Fallback: {len(fallback)} prompts generated")
        return fallback
