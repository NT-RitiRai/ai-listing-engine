"""
Module 3: Website Intelligence Engine
Input: extracted_content (per-page structured data)
Output: One unified WebsiteIntelligence profile
Uses OpenAI ONLY for: industry detection, business summary, entity/topic classification
Never invents services/products - only classifies what was extracted
"""
import asyncio
import json
import logging
import time
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

# Timeout constants (seconds)
CONNECT_TIMEOUT = 10.0
READ_TIMEOUT = 90.0
WRITE_TIMEOUT = 10.0
POOL_TIMEOUT = 5.0
TOTAL_TIMEOUT = 100.0


async def _call_llm(prompt: str, json_mode: bool = True) -> str:
    """Call OpenAI first (1 retry), fallback to Gemini. Every network call has explicit timeout."""
    t_start = time.time()
    logger.info("[LLM] ===== START =====")
    
    timeout = httpx.Timeout(
        connect=CONNECT_TIMEOUT,
        read=READ_TIMEOUT,
        write=WRITE_TIMEOUT,
        pool=POOL_TIMEOUT
    )

    # Try OpenAI (up to 2 attempts)
    if settings.OPENAI_API_KEY:
        body = {
            "model": settings.OPENAI_MODEL or "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}

        for attempt in range(1, 3):
            t_attempt = time.time()
            logger.info(f"[LLM] OpenAI attempt {attempt} START")
            
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    logger.info(f"[LLM] OpenAI attempt {attempt}: Sending request...")
                    
                    response_task = client.post(
                        OPENAI_URL,
                        headers={
                            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json=body,
                    )
                    
                    r = await asyncio.wait_for(response_task, timeout=TOTAL_TIMEOUT)
                    
                    t_attempt_elapsed = time.time() - t_attempt
                    logger.info(f"[LLM] OpenAI attempt {attempt}: Response received in {t_attempt_elapsed:.1f}s (HTTP {r.status_code})")
                    
                    if r.status_code == 200:
                        content = r.json()["choices"][0]["message"]["content"]
                        t_total = time.time() - t_start
                        logger.info(f"[LLM] OpenAI SUCCESS (attempt {attempt}) in {t_total:.1f}s")
                        return content
                    else:
                        logger.warning(f"[LLM] OpenAI attempt {attempt} failed: HTTP {r.status_code}")
                        logger.debug(f"[LLM] Response: {r.text[:200]}")
                        
            except asyncio.TimeoutError:
                t_attempt_elapsed = time.time() - t_attempt
                logger.warning(f"[LLM] OpenAI attempt {attempt} TIMED OUT after {t_attempt_elapsed:.1f}s")
                
            except httpx.ConnectError as e:
                t_attempt_elapsed = time.time() - t_attempt
                logger.warning(f"[LLM] OpenAI attempt {attempt} connection error after {t_attempt_elapsed:.1f}s: {e}")
                
            except Exception as e:
                t_attempt_elapsed = time.time() - t_attempt
                logger.warning(f"[LLM] OpenAI attempt {attempt} error after {t_attempt_elapsed:.1f}s: {type(e).__name__}: {e}")
            
            if attempt < 2:
                logger.info("[LLM] Waiting 1s before retry...")
                await asyncio.sleep(1)

        logger.warning("[LLM] OpenAI failed after 2 attempts — trying Gemini fallback")

    # Fallback: Gemini
    if settings.GEMINI_API_KEY:
        t_gemini = time.time()
        logger.info("[LLM] Gemini fallback START")
        
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                logger.info("[LLM] Gemini: Sending request...")
                
                response_task = client.post(
                    f"{GEMINI_URL}?key={settings.GEMINI_API_KEY}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{"parts": [{"text": prompt + "\n\nReturn only valid JSON."}]}],
                        "generationConfig": {
                            "temperature": 0.1,
                            "responseMimeType": "application/json"
                        },
                    },
                )
                
                r = await asyncio.wait_for(response_task, timeout=TOTAL_TIMEOUT)
                
                t_gemini_elapsed = time.time() - t_gemini
                logger.info(f"[LLM] Gemini: Response received in {t_gemini_elapsed:.1f}s (HTTP {r.status_code})")
                
                if r.status_code == 200:
                    content = r.json()["candidates"][0]["content"]["parts"][0]["text"]
                    t_total = time.time() - t_start
                    logger.info(f"[LLM] Gemini SUCCESS in {t_total:.1f}s")
                    return content
                else:
                    logger.error(f"[LLM] Gemini failed: HTTP {r.status_code}")
                    logger.debug(f"[LLM] Response: {r.text[:200]}")
                    
        except asyncio.TimeoutError:
            t_gemini_elapsed = time.time() - t_gemini
            logger.error(f"[LLM] Gemini TIMED OUT after {t_gemini_elapsed:.1f}s")
            
        except httpx.ConnectError as e:
            t_gemini_elapsed = time.time() - t_gemini
            logger.error(f"[LLM] Gemini connection error after {t_gemini_elapsed:.1f}s: {e}")
            
        except Exception as e:
            t_gemini_elapsed = time.time() - t_gemini
            logger.error(f"[LLM] Gemini error after {t_gemini_elapsed:.1f}s: {type(e).__name__}: {e}")

    t_total = time.time() - t_start
    logger.error(f"[LLM] ===== FAILED ({t_total:.1f}s) - Both OpenAI and Gemini failed =====")
    raise RuntimeError("Both OpenAI and Gemini failed")


class WebsiteIntelligenceEngine:
    def __init__(self):
        pass

    async def build_profile(self, extracted_content: dict[str, dict]) -> dict:
        t_start = time.time()
        logger.info("[INTELLIGENCE] build_profile START")
        
        try:
            logger.info("[INTELLIGENCE] Aggregating content...")
            t_agg = time.time()
            aggregated = self._aggregate(extracted_content)
            t_agg_elapsed = time.time() - t_agg
            logger.info(f"[INTELLIGENCE] Aggregation done in {t_agg_elapsed:.1f}s — {len(aggregated.get('titles', []))} titles, {len(aggregated.get('h2', []))} h2s")
            
            logger.info("[INTELLIGENCE] Classifying with AI...")
            t_class = time.time()
            ai_profile = await self._ai_classify(aggregated)
            t_class_elapsed = time.time() - t_class
            logger.info(f"[INTELLIGENCE] Classification done in {t_class_elapsed:.1f}s")
            
            t_total = time.time() - t_start
            logger.info(f"[INTELLIGENCE] build_profile END ({t_total:.1f}s)")
            
            return {
                "industry": ai_profile.get("industry"),
                "sub_industry": ai_profile.get("sub_industry"),
                "business_summary": ai_profile.get("business_summary"),
                "target_audience": ai_profile.get("target_audience"),
                "unique_selling_points": ai_profile.get("unique_selling_points", []),
                "products": ai_profile["products"] if "products" in ai_profile else aggregated["products"],
                "services": ai_profile["services"] if "services" in ai_profile else aggregated["services"],
                "locations": ai_profile["locations"] if "locations" in ai_profile else aggregated["locations"],
                "brands": aggregated["brands"],
                "primary_topics": ai_profile.get("primary_topics", []),
                "secondary_topics": ai_profile.get("secondary_topics", []),
                "entities": ai_profile.get("entities", []),
                "content_clusters": ai_profile.get("content_clusters", []),
            }
        except Exception as e:
            logger.error(f"[INTELLIGENCE] build_profile FAILED: {type(e).__name__}: {e}", exc_info=True)
            t_total = time.time() - t_start
            logger.info(f"[INTELLIGENCE] build_profile END (FAILED in {t_total:.1f}s) - using default profile")
            return self._default_profile()

    def _aggregate(self, extracted_content: dict[str, dict]) -> dict:
        all_titles, all_h1, all_h2, all_paragraphs = [], [], [], []
        all_faqs, all_prices, all_schema_types = [], [], []
        all_locations, all_emails, all_phones = [], [], []

        for page in extracted_content.values():
            if page.get("title"):
                all_titles.append(page["title"])
            all_h1.extend(page.get("h1", []))
            all_h2.extend(page.get("h2", []))
            all_paragraphs.extend(page.get("paragraphs", [])[:3])  # top 3 per page
            all_faqs.extend(page.get("faqs", []))
            all_prices.extend(page.get("prices", []))
            all_schema_types.extend(page.get("schema_types", []))
            all_locations.extend(page.get("emails", []))  # reuse for location hints
            all_emails.extend(page.get("emails", []))
            all_phones.extend(page.get("phones", []))

        # Heuristic extraction of services/products from headings
        services = self._extract_from_headings(all_h2, keywords=["service", "solution", "offer", "provide", "help"])
        products = self._extract_from_headings(all_h2, keywords=["product", "buy", "shop", "package", "plan", "price"])
        brands = self._extract_brands(all_titles + all_h1)
        locations = self._extract_locations(all_paragraphs + all_h2)

        return {
            "titles": list(dict.fromkeys(all_titles))[:10],
            "h1": list(dict.fromkeys(all_h1))[:10],
            "h2": list(dict.fromkeys(all_h2))[:20],
            "paragraphs": all_paragraphs[:15],
            "faqs": all_faqs[:10],
            "prices": list(dict.fromkeys(all_prices))[:10],
            "schema_types": list(dict.fromkeys(filter(None, all_schema_types))),
            "services": services,
            "products": products,
            "locations": locations,
            "brands": brands,
            "emails": list(dict.fromkeys(all_emails))[:5],
            "phones": list(dict.fromkeys(all_phones))[:5],
        }

    def _extract_from_headings(self, headings: list[str], keywords: list[str]) -> list[str]:
        results = []
        for h in headings:
            if any(kw in h.lower() for kw in keywords):
                results.append(h)
        return list(dict.fromkeys(results))[:15]

    def _extract_brands(self, texts: list[str]) -> list[str]:
        # Simple heuristic: capitalized multi-word phrases
        import re
        brands = set()
        for text in texts:
            matches = re.findall(r'\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b', text)
            brands.update(matches)
        return list(brands)[:10]

    def _extract_locations(self, texts: list[str]) -> list[str]:
        import re
        location_patterns = [
            r'\b[A-Z][a-z]+(?:,\s*[A-Z]{2})?\b',  # City, ST
            r'\b\d{5,6}\b',  # Postal codes
        ]
        locations = set()
        for text in texts:
            for pattern in location_patterns:
                matches = re.findall(pattern, text)
                locations.update(matches)
        return list(locations)[:10]

    async def _ai_classify(self, aggregated: dict) -> dict:
        t_start = time.time()
        logger.info("[INTELLIGENCE] _ai_classify START")

        content_sample = {
            "titles": aggregated["titles"],
            "headings": aggregated["h1"] + aggregated["h2"],
            "paragraphs": aggregated["paragraphs"][:5],
            "services_detected": aggregated["services"],
            "products_detected": aggregated["products"],
            "schema_types": aggregated["schema_types"],
            "prices": aggregated["prices"],
            "locations": aggregated["locations"],
        }

        prompt = f"""Analyze this website content and return a JSON object.
Only use information present in the content. Do not invent anything.

Content:
{json.dumps(content_sample, indent=2)[:3000]}

Return JSON with these exact keys:
- industry (string)
- sub_industry (string)
- business_summary (2-3 sentences, based only on content)
- target_audience (string)
- unique_selling_points (array of strings, max 5, from content only)
- primary_topics (array of strings, max 5)
- secondary_topics (array of strings, max 8)
- entities (array of strings - brands, people, places, organizations mentioned)
- content_clusters (array of strings - main content themes)
- locations (array of strings - ONLY actual geographical cities, states, countries, or regions mentioned. Filter out random words.)
- services (array of strings - ONLY actual services provided by the business)
- products (array of strings - ONLY actual physical or digital products sold by the business)

Return only valid JSON, no explanation."""

        try:
            logger.info("[INTELLIGENCE] Calling _call_llm with timeout...")
            raw = await asyncio.wait_for(_call_llm(prompt), timeout=50)
            logger.info("[INTELLIGENCE] _call_llm returned, parsing JSON...")
            result = json.loads(raw)
            t_total = time.time() - t_start
            logger.info(f"[INTELLIGENCE] _ai_classify END ({t_total:.1f}s)")
            return result
        except asyncio.TimeoutError:
            logger.error("[INTELLIGENCE] _ai_classify TIMED OUT")
            return self._default_profile()
        except Exception as e:
            logger.error(f"[INTELLIGENCE] _ai_classify FAILED: {type(e).__name__}: {e}", exc_info=True)
            return self._default_profile()

    def _default_profile(self) -> dict:
        return {
            "industry": "Unknown",
            "sub_industry": None,
            "business_summary": "Could not determine from available content.",
            "target_audience": None,
            "unique_selling_points": [],
            "primary_topics": [],
            "secondary_topics": [],
            "entities": [],
            "content_clusters": [],
        }
