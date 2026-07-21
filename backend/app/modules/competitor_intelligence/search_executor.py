import asyncio
import json
import logging
import time
from typing import Dict, List, Any
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class AISearchExecutor:
    """
    Step 4: Execute AI Searches
    Runs every query through OpenAI and Gemini and collects recommended companies and mention counts.
    """

    async def execute_searches(self, queries: List[Dict[str, str]], business_context: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[SEARCH EXECUTOR] Executing {len(queries)} queries across LLMs...")
        t_start = time.time()

        mentions = {}
        results = []

        # We will throttle concurrency to avoid rate limits.
        # Batch size of 10 for safety on standard tiers.
        batch_size = 10
        for i in range(0, len(queries), batch_size):
            batch = queries[i:i+batch_size]
            tasks = []
            for q in batch:
                tasks.append(self._execute_query(q["query"], business_context))
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for res in batch_results:
                if isinstance(res, dict):
                    results.append(res)
                    for company in res.get("mentioned_companies", []):
                        name = company.lower().strip()
                        if name:
                            mentions[name] = mentions.get(name, 0) + 1

        # Sort mentions
        leaderboard = sorted([{"name": k.title(), "mentions": v} for k, v in mentions.items()], key=lambda x: x["mentions"], reverse=True)

        t_elapsed = time.time() - t_start
        logger.info(f"[SEARCH EXECUTOR] Completed in {t_elapsed:.1f}s. Extracted {len(leaderboard)} unique competitors.")
        
        return {
            "leaderboard": leaderboard,
            "raw_results": results
        }

    async def _execute_query(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single query against both models if possible, returning extracted companies."""
        
        prompt = f"""You are an AI Search Assistant. A user searches: "{query}"
Based on your knowledge, recommend the best real companies for this search.
List the companies and briefly state why they are recommended.

Return ONLY a JSON object:
{{
  "response": "Brief text response as the AI",
  "recommended_companies": ["Company A", "Company B"]
}}"""

        mentioned = []
        
        # 1. Try OpenAI
        if settings.OPENAI_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=30) as client:
                    resp = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                        json={
                            "model": "gpt-4o-mini",
                            "messages": [{"role": "user", "content": prompt}],
                            "response_format": {"type": "json_object"}
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()["choices"][0]["message"]["content"]
                        parsed = json.loads(data)
                        mentioned.extend(parsed.get("recommended_companies", []))
            except Exception as e:
                logger.warning(f"[SEARCH EXECUTOR] OpenAI failed for query '{query}': {e}")

        # 2. Try Gemini
        if settings.GEMINI_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=30) as client:
                    resp = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}",
                        json={
                            "contents": [{"parts": [{"text": prompt}]}],
                            "generationConfig": {"responseMimeType": "application/json"}
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                        parsed = json.loads(data)
                        mentioned.extend(parsed.get("recommended_companies", []))
            except Exception as e:
                logger.warning(f"[SEARCH EXECUTOR] Gemini failed for query '{query}': {e}")

        return {
            "query": query,
            "mentioned_companies": list(set(mentioned))
        }
