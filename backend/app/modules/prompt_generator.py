"""
Module 7: Prompt Generation Engine (Business Intelligence Redesign)
Input: WebsiteIntelligence profile (includes extracted_content and business_context) + Intents
Output: Exactly 5 highly contextualized, persona-driven prompts.

CRITICAL: Every LLM call has explicit timeout. Never waits forever.
"""
import asyncio
import json
import logging
import time
from app.modules.intelligence import _call_llm

logger = logging.getLogger(__name__)

# Timeout for LLM calls (seconds)
LLM_TIMEOUT = 45

class PromptGenerationEngine:
    def __init__(self):
        pass

    async def generate(self, intelligence: dict, intents: list[str] = None) -> list[dict]:
        """Generate 5 highly-contextual search prompts."""
        t_start = time.time()
        logger.info("[PROMPT] ===== START =====")
        
        try:
            if not intents:
                intents = ["Informational", "Commercial", "Comparison", "Local", "Decision Making"]
                
            business_context = intelligence.get("business_context", {})
            if not business_context:
                logger.warning("[PROMPT] No business context found, using basic intelligence.")
                business_context = {
                    "business_name": intelligence.get("brands", ["Unknown"])[0] if intelligence.get("brands") else "Unknown",
                    "industry": intelligence.get("industry", "Unknown"),
                    "services": intelligence.get("services", []),
                    "products": intelligence.get("products", []),
                    "locations": intelligence.get("locations", []),
                    "target_audience": intelligence.get("target_audience", "Unknown")
                }

            # Build prompt for LLM
            logger.info("[PROMPT] Building Context-Aware LLM prompt...")
            prompt = f"""You are an Expert Prompt Engineer for AI Search (ChatGPT, Gemini, Perplexity).
Your goal is to generate search prompts that test if an AI model would recommend this business to a potential customer.

BUSINESS CONTEXT:
{json.dumps(business_context, indent=2)[:3000]}

REQUIRED INTENTS TO COVER:
{json.dumps(intents)}

Generate exactly 5 search prompts. 
Rules:
- STRICT GROUNDING: Each prompt MUST reflect how a real, high-intent user in the target audience would search for this specific business's services/products.
- NEVER invent services or locations not present in the context.
- Prompts should not be generic (e.g., "what is marketing"). They should be specific to the business's offerings (e.g., "best B2B SaaS marketing agency in London for series A startups").
- Cover each of the 5 requested intents.
- Do not mention the business name directly in the prompt unless it's a navigational/brand intent (which should be rare). The goal is to see if the AI *recommends* the business for non-branded searches.

Return a JSON object with key "prompts" containing an array of 5 objects, each with:
- "prompt": the search query string (specific to this business context)
- "intent": the matched intent from the requested list
- "rationale": one sentence explaining why a user would search this, and why we expect the AI to recommend this business based on its context."""


            logger.info("[PROMPT] Calling LLM with timeout protection...")
            t_llm = time.time()
            
            try:
                raw = await asyncio.wait_for(
                    _call_llm(prompt, json_mode=True),
                    timeout=LLM_TIMEOUT
                )
                logger.info(f"[PROMPT] LLM returned in {time.time() - t_llm:.1f}s")
            except asyncio.TimeoutError:
                logger.error(f"[PROMPT] LLM TIMED OUT after {LLM_TIMEOUT}s")
                return self._fallback_prompts(intents, business_context)
            except Exception as e:
                logger.error(f"[PROMPT] LLM error: {e}")
                return self._fallback_prompts(intents, business_context)

            # Parse JSON
            try:
                result = json.loads(raw)
            except json.JSONDecodeError as e:
                logger.error(f"[PROMPT] JSON parse error: {e}")
                return self._fallback_prompts(intents, business_context)

            # Extract prompts
            prompts_list = result.get("prompts") or result.get("results") or list(result.values())[0]

            if not prompts_list or not isinstance(prompts_list, list):
                return self._fallback_prompts(intents, business_context)

            prompts_list = prompts_list[:5]
            
            # Validate
            validated = []
            for i, p in enumerate(prompts_list):
                if isinstance(p, dict) and "prompt" in p and "intent" in p:
                    validated.append(p)

            if not validated:
                return self._fallback_prompts(intents, business_context)

            logger.info(f"[PROMPT] ===== DONE ({len(validated)} prompts in {time.time() - t_start:.1f}s) =====")
            return validated

        except Exception as e:
            logger.error(f"[PROMPT] Unexpected error: {e}", exc_info=True)
            return self._fallback_prompts(["Informational", "Commercial", "Local", "Comparison", "Decision Making"], {})

    def _fallback_prompts(self, intents: list[str], context: dict) -> list[dict]:
        """Return fallback prompts if generation fails."""
        logger.info("[PROMPT] Generating fallback prompts...")
        industry = context.get("industry", "this industry")
        location = context.get("locations", ["this area"])[0] if context.get("locations") else "my area"
        service = context.get("services", ["services"])[0] if context.get("services") else "services"
        
        fallback = [
            {
                "prompt": f"Top rated {industry} companies",
                "intent": intents[0] if len(intents) > 0 else "Informational",
                "rationale": "Fallback prompt"
            },
            {
                "prompt": f"Best providers for {service}",
                "intent": intents[1] if len(intents) > 1 else "Commercial",
                "rationale": "Fallback prompt"
            },
            {
                "prompt": f"Compare {industry} services",
                "intent": intents[2] if len(intents) > 2 else "Comparison",
                "rationale": "Fallback prompt"
            },
            {
                "prompt": f"{service} in {location}",
                "intent": intents[3] if len(intents) > 3 else "Local",
                "rationale": "Fallback prompt"
            },
            {
                "prompt": f"Who should I hire for {industry}?",
                "intent": intents[4] if len(intents) > 4 else "Decision Making",
                "rationale": "Fallback prompt"
            }
        ]
        return fallback
