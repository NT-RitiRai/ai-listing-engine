"""
Module 8: Prompt Playground Engine (Production-Grade)
Input: prompt_text + WebsiteIntelligence (with extracted_content)
Output: Prompt-specific evidence-driven analysis with citation analysis.

Citation analysis: based on schema, FAQ, authority signals, author info
Competitor analysis: internal only, based on crawled data
"""
import json
import re
import logging
from app.modules.intelligence import _call_llm
from app.modules.internal_competitor_analyzer import InternalCompetitorAnalyzer

logger = logging.getLogger(__name__)


class PromptPlaygroundEngine:
    def __init__(self):
        pass

    async def analyze(self, prompt_text: str, intelligence: dict) -> dict:
        logger.info(f"[PLAYGROUND] Starting analysis for prompt: {prompt_text[:50]}...")
        extracted = intelligence.get("extracted_content", {})
        logger.info(f"[PLAYGROUND] Extracted content pages: {len(extracted)}")
        
        # Compute prompt-specific signals
        try:
            prompt_signals = self._analyze_prompt_signals(prompt_text, intelligence, extracted)
            visibility_score = self._calculate_visibility_score(prompt_signals)
            model_probs = self._calculate_model_probabilities(prompt_signals)
            evidence_items = self._build_evidence_panel(prompt_text, prompt_signals, extracted)
            clusters = self._analyze_prompt_clusters(prompt_text, intelligence, extracted)
            logger.info(f"[PLAYGROUND] Signals computed - visibility: {visibility_score}")
        except Exception as e:
            logger.error(f"[PLAYGROUND] Signal analysis failed: {e}", exc_info=True)
            raise
        
        # Internal competitor analysis (no external APIs)
        try:
            competitor_analyzer = InternalCompetitorAnalyzer()
            competitor_analysis = competitor_analyzer.analyze(intelligence, extracted)
            logger.info(f"[PLAYGROUND] Competitor analysis done")
        except Exception as e:
            logger.warning(f"[PLAYGROUND] Competitor analysis failed: {e}")
            competitor_analysis = {"competitors": [], "status": "Analysis skipped"}
        
        # Citation readiness analysis
        try:
            citation_readiness = self._analyze_citation_readiness(prompt_signals, extracted, intelligence)
            citation_sources = self._identify_citation_sources(prompt_text, extracted)
            citation_potential = self._calculate_citation_potential(prompt_signals, citation_readiness)
            logger.info(f"[PLAYGROUND] Citation analysis done - score: {citation_readiness.get('overall_score')}")
        except Exception as e:
            logger.warning(f"[PLAYGROUND] Citation analysis failed: {e}")
            citation_readiness = {"overall_score": 0, "evidence_used": [], "missing_signals": []}
            citation_sources = []
            citation_potential = {}
        
        # Per-prompt strengths, weaknesses, opportunities
        try:
            strengths = self._analyze_prompt_strengths(prompt_text, prompt_signals, extracted, intelligence)
            weaknesses = self._analyze_prompt_weaknesses(prompt_text, prompt_signals, extracted, intelligence)
            opportunities = self._analyze_prompt_opportunities(prompt_text, prompt_signals, extracted, intelligence)
            content_score = self._calculate_content_score(prompt_signals, extracted)
            platform_readiness = self._analyze_platform_readiness(prompt_signals, model_probs, evidence_items)
            action_plan = self._generate_action_plan(weaknesses, opportunities, prompt_signals)
            competitor_gap = self._analyze_competitor_gap(prompt_text, extracted, intelligence)
            logger.info(f"[PLAYGROUND] Per-prompt analysis done")
        except Exception as e:
            logger.warning(f"[PLAYGROUND] Per-prompt analysis failed: {e}")
            strengths = []
            weaknesses = []
            opportunities = []
            content_score = {}
            platform_readiness = {}
            action_plan = []
            competitor_gap = {}
        
        # Call LLM for qualitative prompt-specific analysis
        try:
            logger.info(f"[PLAYGROUND] Calling LLM for analysis...")
            llm_result = await self._llm_prompt_analysis(
                prompt_text, intelligence, extracted, prompt_signals,
                visibility_score, model_probs, evidence_items, clusters,
                competitor_analysis, citation_readiness
            )
            logger.info(f"[PLAYGROUND] LLM analysis completed")
        except Exception as e:
            logger.warning(f"[PLAYGROUND] LLM analysis failed: {e}", exc_info=True)
            llm_result = {
                "model_analysis": {},
                "brand_overview": {},
                "content_gaps": [],
                "optimization_suggestions": [],
                "error": str(e),
            }

        return {
            "visibility_score": visibility_score,
            "recommendation_probability": round(sum(model_probs.values()) / len(model_probs)),
            "model_probabilities": model_probs,
            "signals": prompt_signals,
            "prompt_clusters": clusters,
            "evidence_panel": evidence_items,
            "competitor_analysis": competitor_analysis,
            "citation_readiness": citation_readiness,
            "citation_sources": citation_sources,
            "citation_potential": citation_potential,
            "model_analysis": llm_result.get("model_analysis", {}),
            "brand_overview": llm_result.get("brand_overview", {}),
            "content_gaps": llm_result.get("content_gaps", []),
            "optimization_suggestions": llm_result.get("optimization_suggestions", []),
            "strengths": strengths,
            "weaknesses": weaknesses,
            "opportunities": opportunities,
            "content_score": content_score,
            "platform_readiness": platform_readiness,
            "action_plan": action_plan,
            "competitor_gap": competitor_gap,
        }

    def _analyze_prompt_signals(self, prompt: str, intel: dict, extracted: dict) -> dict:
        """Analyze how well the website matches this specific prompt."""
        prompt_lower = prompt.lower()
        prompt_words = set(re.findall(r'\w+', prompt_lower))
        
        all_h1, all_h2, all_h3, all_para, all_faq_q = [], [], [], [], []
        all_schema_types = []
        page_count = len(extracted)
        
        for page in extracted.values():
            all_h1.extend(page.get("h1", []))
            all_h2.extend(page.get("h2", []))
            all_h3.extend(page.get("h3", []))
            all_para.extend(page.get("paragraphs", [])[:2])
            all_faq_q.extend([f["question"] for f in page.get("faqs", [])])
            all_schema_types.extend(page.get("schema_types", []))
        
        all_headings = all_h1 + all_h2 + all_h3
        heading_matches = sum(1 for h in all_headings if any(w in h.lower() for w in prompt_words))
        heading_coverage = min(100, int(heading_matches / max(len(all_headings), 1) * 100))
        
        faq_matches = sum(1 for q in all_faq_q if any(w in q.lower() for w in prompt_words))
        faq_coverage = min(100, int(faq_matches / max(len(all_faq_q), 1) * 100) + (30 if faq_matches > 0 else 0))
        
        entities = [e.lower() for e in intel.get("entities", [])]
        entity_matches = sum(1 for e in entities if any(w in e for w in prompt_words))
        entity_coverage = min(100, int(entity_matches / max(len(entities), 1) * 100) + (20 if entities else 0))
        
        topics = intel.get("primary_topics", []) + intel.get("secondary_topics", [])
        topic_matches = sum(1 for t in topics if any(w in t.lower() for w in prompt_words))
        topic_coverage = min(100, int(topic_matches / max(len(topics), 1) * 100))
        
        schema_pages = sum(1 for p in extracted.values() if p.get("schema_types"))
        schema_coverage = int(100 * schema_pages / max(page_count, 1))
        
        word_counts = [p.get("word_count", 0) for p in extracted.values() if p.get("word_count")]
        avg_wc = sum(word_counts) / max(len(word_counts), 1) if word_counts else 0
        content_depth = min(100, int(avg_wc / 15))
        
        has_reviews = any(p.get("reviews") for p in extracted.values())
        has_phones = any(p.get("phones") for p in extracted.values())
        has_prices = any(p.get("prices") for p in extracted.values())
        authority = (has_reviews * 40) + (has_phones * 30) + (has_prices * 30)
        
        urls = list(extracted.keys())
        fresh_patterns = ["blog", "news", "update", "2024", "2025", "latest"]
        freshness = min(100, sum(15 for u in urls if any(p in u.lower() for p in fresh_patterns)))
        
        commercial_words = ["buy", "price", "cost", "order", "shop"]
        transactional_words = ["book", "schedule", "contact", "call"]
        informational_words = ["what", "how", "why", "guide"]
        
        commercial_match = sum(1 for w in commercial_words if w in prompt_lower)
        transactional_match = sum(1 for w in transactional_words if w in prompt_lower)
        informational_match = sum(1 for w in informational_words if w in prompt_lower)
        
        intent_alignment = max(commercial_match * 30, transactional_match * 35, informational_match * 25)
        
        evidence_count = len([p for p in extracted.values() 
                             if any(w in " ".join(p.get("h1", []) + p.get("h2", [])).lower() 
                                   for w in prompt_words)])
        
        return {
            "heading_coverage": heading_coverage,
            "faq_coverage": faq_coverage,
            "entity_coverage": entity_coverage,
            "topic_coverage": topic_coverage,
            "schema_coverage": schema_coverage,
            "content_depth": content_depth,
            "authority": authority,
            "freshness": freshness,
            "intent_alignment": intent_alignment,
            "evidence_count": evidence_count,
            "has_reviews": has_reviews,
            "has_prices": has_prices,
            "all_schema_types": all_schema_types,
        }

    def _calculate_visibility_score(self, signals: dict) -> int:
        """Visibility = how well the website answers this specific prompt."""
        weights = {
            "heading_coverage": 0.20,
            "faq_coverage": 0.15,
            "entity_coverage": 0.12,
            "topic_coverage": 0.12,
            "schema_coverage": 0.10,
            "content_depth": 0.10,
            "authority": 0.08,
            "freshness": 0.08,
            "intent_alignment": 0.05,
        }
        score = sum(signals.get(k, 0) * w for k, w in weights.items())
        return max(8, min(98, round(score)))

    def _calculate_model_probabilities(self, signals: dict) -> dict:
        """Each platform has different preferences for this prompt."""
        weights = {
            "ChatGPT": {
                "content_depth": 0.22, "heading_coverage": 0.16, "faq_coverage": 0.12,
                "entity_coverage": 0.12, "topic_coverage": 0.12, "schema_coverage": 0.08,
                "authority": 0.10, "freshness": 0.04, "intent_alignment": 0.04,
            },
            "Gemini": {
                "schema_coverage": 0.24, "entity_coverage": 0.16, "heading_coverage": 0.12,
                "faq_coverage": 0.10, "content_depth": 0.10, "topic_coverage": 0.10,
                "authority": 0.10, "freshness": 0.04, "intent_alignment": 0.04,
            },
            "Claude": {
                "content_depth": 0.24, "heading_coverage": 0.14, "entity_coverage": 0.12,
                "topic_coverage": 0.12, "authority": 0.12, "faq_coverage": 0.10,
                "schema_coverage": 0.08, "freshness": 0.04, "intent_alignment": 0.04,
            },
            "Perplexity": {
                "faq_coverage": 0.22, "freshness": 0.18, "authority": 0.16,
                "heading_coverage": 0.12, "entity_coverage": 0.12, "content_depth": 0.10,
                "schema_coverage": 0.06, "topic_coverage": 0.02, "intent_alignment": 0.02,
            },
        }
        
        result = {}
        for model, model_weights in weights.items():
            score = sum(signals.get(k, 0) * w for k, w in model_weights.items())
            result[model] = max(5, min(99, round(score)))
        
        return result

    def _build_evidence_panel(self, prompt: str, signals: dict, extracted: dict) -> list:
        """Build evidence items from pages that actually match this prompt."""
        prompt_words = set(re.findall(r'\w+', prompt.lower()))
        evidence_items = []
        
        for url, page in list(extracted.items())[:8]:
            headings = page.get("h1", []) + page.get("h2", [])
            matched_h = [h for h in headings if any(w in h.lower() for w in prompt_words)]
            matched_p = [p for p in page.get("paragraphs", [])
                         if any(w in p.lower() for w in prompt_words)][:1]
            matched_faq = [f["question"] for f in page.get("faqs", [])
                           if any(w in f["question"].lower() for w in prompt_words)][:1]
            
            if matched_h or matched_p or matched_faq:
                heading_words = set(re.findall(r'\w+', " ".join(headings).lower()))
                overlap = len(prompt_words & heading_words)
                similarity = round(overlap / max(len(prompt_words), 1) * 100)
                
                evidence_items.append({
                    "page_url": url,
                    "matched_headings": matched_h[:2],
                    "matched_paragraphs": [p[:100] + "..." if len(p) > 100 else p for p in matched_p],
                    "matched_faqs": matched_faq,
                    "schema_types": page.get("schema_types", [])[:2],
                    "similarity_score": similarity,
                    "confidence": "high" if similarity > 60 else "medium" if similarity > 30 else "low",
                    "reason": f"Prompt matches {len(matched_h)} headings, {len(matched_p)} paragraphs, {len(matched_faq)} FAQs",
                })
        
        return evidence_items[:5]

    def _analyze_citation_readiness(self, signals: dict, extracted: dict, intel: dict) -> dict:
        """Analyze how citation-ready the website is for this prompt."""
        
        has_faq = signals.get("faq_coverage", 0) > 0
        has_schema = signals.get("schema_coverage", 0) > 30
        has_reviews = signals.get("has_reviews", False)
        has_prices = signals.get("has_prices", False)
        has_authority = signals.get("authority", 0) > 30
        
        all_text = " ".join(" ".join(p.get("paragraphs", [])[:1]) for p in extracted.values()).lower()
        has_author_info = any(kw in all_text for kw in ["dr.", "author", "expert", "certified", "founder"])
        
        all_schema = [s for s in signals.get("all_schema_types", []) if s is not None]
        has_medical_schema = any("Medical" in s or "Health" in s for s in all_schema)
        has_org_schema = any("Organization" in s or "LocalBusiness" in s for s in all_schema)
        has_review_schema = any("Review" in s or "Rating" in s for s in all_schema)
        
        citation_score = 0
        citation_score += 15 if has_faq else 0
        citation_score += 15 if has_schema else 0
        citation_score += 12 if has_reviews else 0
        citation_score += 10 if has_prices else 0
        citation_score += 12 if has_author_info else 0
        citation_score += 10 if has_authority else 0
        citation_score += 8 if has_medical_schema else 0
        citation_score += 8 if has_org_schema else 0
        
        evidence_used = []
        if has_faq:
            evidence_used.append("FAQ")
        if has_schema:
            evidence_used.append("Schema Markup")
        if has_author_info:
            evidence_used.append("Author Information")
        if has_reviews:
            evidence_used.append("Reviews")
        if has_prices:
            evidence_used.append("Pricing")
        if has_authority:
            evidence_used.append("Authority Signals")
        
        missing_signals = []
        if not has_review_schema:
            missing_signals.append("Review Schema")
        if not has_medical_schema and "medical" in intel.get("industry", "").lower():
            missing_signals.append("Medical Schema")
        if not any("external" in p.lower() for p in " ".join(" ".join(p.get("paragraphs", [])[:1]) for p in extracted.values()).lower().split()):
            missing_signals.append("External References")
        if not any("source" in p.lower() or "cite" in p.lower() for p in " ".join(" ".join(p.get("paragraphs", [])[:1]) for p in extracted.values()).lower().split()):
            missing_signals.append("Source Citations")
        
        return {
            "overall_score": min(99, citation_score),
            "evidence_used": evidence_used,
            "missing_signals": missing_signals[:4],
        }

    def _identify_citation_sources(self, prompt: str, extracted: dict) -> list:
        """Identify which pages would be cited for this prompt."""
        prompt_words = set(re.findall(r'\w+', prompt.lower()))
        citation_sources = []
        
        for url, page in list(extracted.items())[:5]:
            headings = page.get("h1", []) + page.get("h2", [])
            matched_h = [h for h in headings if any(w in h.lower() for w in prompt_words)]
            
            if matched_h or page.get("faqs"):
                heading_words = set(re.findall(r'\w+', " ".join(headings).lower()))
                overlap = len(prompt_words & heading_words)
                confidence = min(99, 50 + overlap * 10)
                
                reasons = []
                if matched_h:
                    reasons.append(f"Contains {len(matched_h)} matching headings")
                if page.get("faqs"):
                    reasons.append("Has FAQ content")
                if page.get("schema_types"):
                    reasons.append(f"Has {', '.join(page.get('schema_types', [])[:2])} schema")
                
                citation_sources.append({
                    "page_url": url,
                    "reason": " + ".join(reasons),
                    "confidence": confidence,
                })
        
        return citation_sources[:3]

    def _calculate_citation_potential(self, signals: dict, citation_readiness: dict) -> dict:
        """Calculate citation potential per platform."""
        base_score = citation_readiness.get("overall_score", 0)
        
        potential = {
            "ChatGPT": {
                "likelihood": "high" if base_score > 70 else "medium" if base_score > 40 else "low",
                "reason": "Prefers FAQ content and clear explanations" if signals.get("faq_coverage", 0) > 30 else "Needs more FAQ content",
            },
            "Gemini": {
                "likelihood": "very high" if signals.get("schema_coverage", 0) > 50 else "high" if base_score > 60 else "medium",
                "reason": "Strong structured data coverage" if signals.get("schema_coverage", 0) > 50 else "Needs better schema markup",
            },
            "Claude": {
                "likelihood": "high" if len(citation_readiness.get("evidence_used", [])) > 4 else "medium",
                "reason": "Good expert authority signals" if "Author Information" in citation_readiness.get("evidence_used", []) else "Needs author credentials",
            },
            "Perplexity": {
                "likelihood": "high" if signals.get("freshness", 0) > 30 and signals.get("authority", 0) > 30 else "medium",
                "reason": "Good freshness and authority" if signals.get("freshness", 0) > 30 else "Needs more recent content",
            },
        }
        
        return potential

    def _analyze_prompt_clusters(self, prompt: str, intel: dict, extracted: dict) -> list:
        """Determine which clusters this prompt belongs to."""
        prompt_lower = prompt.lower()
        clusters = []
        
        if any(w in prompt_lower for w in ["what", "how", "why", "guide", "learn", "explain"]):
            faq_count = sum(1 for p in extracted.values() if p.get("faqs"))
            clusters.append({
                "cluster": "Informational",
                "confidence": min(95, 50 + faq_count * 5),
                "reason": f"Found {faq_count} pages with FAQ content"
            })
        
        if any(w in prompt_lower for w in ["buy", "price", "cost", "order", "shop", "deal"]):
            price_pages = sum(1 for p in extracted.values() if p.get("prices"))
            clusters.append({
                "cluster": "Commercial",
                "confidence": min(95, 50 + price_pages * 10),
                "reason": f"Found {price_pages} pages with pricing information"
            })
        
        if any(w in prompt_lower for w in ["book", "schedule", "contact", "call", "appointment"]):
            contact_pages = sum(1 for p in extracted.values() if p.get("phones") or p.get("emails"))
            clusters.append({
                "cluster": "Transactional",
                "confidence": min(95, 50 + contact_pages * 10),
                "reason": f"Found {contact_pages} pages with contact information"
            })
        
        if intel.get("locations"):
            clusters.append({
                "cluster": "Local",
                "confidence": 85,
                "reason": f"Website operates in {len(intel.get('locations', []))} locations"
            })
        
        if any(w in prompt_lower for w in ["vs", "versus", "compare", "difference", "better"]):
            clusters.append({
                "cluster": "Comparison",
                "confidence": 60,
                "reason": "Prompt asks for comparison"
            })
        
        return clusters if clusters else [{"cluster": "General", "confidence": 50, "reason": "No specific cluster detected"}]

    def _analyze_prompt_strengths(self, prompt: str, signals: dict, extracted: dict, intel: dict) -> list:
        """Generate 5 strengths specific to this prompt only."""
        strengths = []
        prompt_lower = prompt.lower()
        
        if signals.get("heading_coverage", 0) > 60:
            strengths.append("Strong heading coverage for this query")
        if signals.get("faq_coverage", 0) > 50:
            strengths.append("Dedicated FAQ answers this prompt")
        if signals.get("schema_coverage", 0) > 50:
            strengths.append("Strong schema markup coverage")
        if signals.get("entity_coverage", 0) > 60:
            strengths.append("Good entity matching for this prompt")
        if signals.get("content_depth", 0) > 70:
            strengths.append("Deep content available")
        
        has_reviews = any(p.get("reviews") for p in extracted.values())
        has_prices = any(p.get("prices") for p in extracted.values())
        
        if has_reviews and any(w in prompt_lower for w in ["review", "rating", "opinion"]):
            strengths.append("Customer reviews available")
        if has_prices and any(w in prompt_lower for w in ["price", "cost", "how much"]):
            strengths.append("Pricing information available")
        
        return strengths[:5]
    
    def _analyze_prompt_weaknesses(self, prompt: str, signals: dict, extracted: dict, intel: dict) -> list:
        """Generate 6 weaknesses specific to this prompt only."""
        weaknesses = []
        prompt_lower = prompt.lower()
        
        if signals.get("heading_coverage", 0) < 40:
            weaknesses.append("Limited heading coverage for this query")
        if signals.get("faq_coverage", 0) < 30:
            weaknesses.append("Missing FAQ answers for this prompt")
        if signals.get("schema_coverage", 0) < 30:
            weaknesses.append("Weak schema markup coverage")
        if signals.get("entity_coverage", 0) < 40:
            weaknesses.append("Poor entity matching")
        if signals.get("content_depth", 0) < 40:
            weaknesses.append("Thin content for this query")
        if signals.get("authority", 0) < 30:
            weaknesses.append("Weak authority signals")
        
        has_reviews = any(p.get("reviews") for p in extracted.values())
        has_prices = any(p.get("prices") for p in extracted.values())
        
        if not has_reviews and any(w in prompt_lower for w in ["review", "rating", "opinion"]):
            weaknesses.append("No customer reviews")
        if not has_prices and any(w in prompt_lower for w in ["price", "cost", "how much"]):
            weaknesses.append("Missing pricing information")
        
        return weaknesses[:6]
    
    def _analyze_prompt_opportunities(self, prompt: str, signals: dict, extracted: dict, intel: dict) -> list:
        """Generate opportunities specific to this prompt."""
        opportunities = []
        prompt_lower = prompt.lower()
        
        if signals.get("faq_coverage", 0) < 50:
            opportunities.append("Add FAQ section for this query")
        if signals.get("schema_coverage", 0) < 60:
            opportunities.append("Improve schema markup")
        if signals.get("content_depth", 0) < 70:
            opportunities.append("Expand content depth")
        if any(w in prompt_lower for w in ["compare", "vs", "versus"]):
            opportunities.append("Create comparison content")
        if any(w in prompt_lower for w in ["price", "cost", "how much"]):
            opportunities.append("Add pricing table")
        if any(w in prompt_lower for w in ["review", "rating"]):
            opportunities.append("Encourage customer reviews")
        if any(w in prompt_lower for w in ["how", "guide", "tutorial"]):
            opportunities.append("Create step-by-step guide")
        
        return opportunities[:7]
    
    def _calculate_content_score(self, signals: dict, extracted: dict) -> dict:
        """Calculate per-prompt content scores."""
        return {
            "content_relevance": signals.get("heading_coverage", 0),
            "entity_coverage": signals.get("entity_coverage", 0),
            "intent_match": signals.get("intent_alignment", 0),
            "semantic_coverage": signals.get("topic_coverage", 0),
            "citation_readiness": signals.get("faq_coverage", 0),
            "authority": signals.get("authority", 0),
            "freshness": signals.get("freshness", 0),
        }
    
    def _analyze_platform_readiness(self, signals: dict, model_probs: dict, evidence: list) -> dict:
        """Explain WHY each platform is/isn't ready for this prompt."""
        return {
            "ChatGPT": {
                "probability": model_probs.get("ChatGPT", 0),
                "strengths": ["Prefers deep content", "Handles FAQ well"] if signals.get("content_depth", 0) > 60 else ["Needs more content depth"],
                "weaknesses": ["Lacks FAQ answers"] if signals.get("faq_coverage", 0) < 30 else [],
            },
            "Gemini": {
                "probability": model_probs.get("Gemini", 0),
                "strengths": ["Strong schema coverage", "Good entity matching"] if signals.get("schema_coverage", 0) > 50 else [],
                "weaknesses": ["Weak schema markup"] if signals.get("schema_coverage", 0) < 30 else [],
            },
            "Claude": {
                "probability": model_probs.get("Claude", 0),
                "strengths": ["Detailed explanations available", "Good authority signals"] if signals.get("authority", 0) > 50 else [],
                "weaknesses": ["Missing authority signals"] if signals.get("authority", 0) < 30 else [],
            },
            "Perplexity": {
                "probability": model_probs.get("Perplexity", 0),
                "strengths": ["Citations available", "Recent content"] if signals.get("freshness", 0) > 40 else [],
                "weaknesses": ["Missing recent references"] if signals.get("freshness", 0) < 20 else [],
            },
        }
    
    def _generate_action_plan(self, weaknesses: list, opportunities: list, signals: dict) -> list:
        """Generate top 5 fixes ranked by impact."""
        actions = []
        
        if signals.get("heading_coverage", 0) < 40:
            actions.append({"priority": "High", "action": "Improve heading coverage for this query", "impact": "Directly improves visibility"})
        if signals.get("faq_coverage", 0) < 30:
            actions.append({"priority": "High", "action": "Add FAQ section", "impact": "Increases citation likelihood"})
        if signals.get("schema_coverage", 0) < 50:
            actions.append({"priority": "Medium", "action": "Implement schema markup", "impact": "Improves platform recognition"})
        if signals.get("content_depth", 0) < 60:
            actions.append({"priority": "Medium", "action": "Expand content", "impact": "Better query coverage"})
        if signals.get("freshness", 0) < 30:
            actions.append({"priority": "Low", "action": "Update with recent information", "impact": "Improves freshness signals"})
        
        return actions[:5]
    
    def _analyze_competitor_gap(self, prompt: str, extracted: dict, intel: dict) -> dict:
        """Analyze what competitors might have for this prompt."""
        prompt_lower = prompt.lower()
        gaps = []
        
        if any(w in prompt_lower for w in ["price", "cost", "financing"]):
            has_financing = any("financing" in " ".join(p.get("paragraphs", [])).lower() for p in extracted.values())
            if not has_financing:
                gaps.append("Competitors mention financing options")
        
        if any(w in prompt_lower for w in ["compare", "vs", "versus"]):
            has_comparison = any("vs" in " ".join(p.get("h2", [])).lower() or "comparison" in " ".join(p.get("h2", [])).lower() for p in extracted.values())
            if not has_comparison:
                gaps.append("Competitors have comparison tables")
        
        if any(w in prompt_lower for w in ["review", "rating", "testimonial"]):
            has_testimonials = any("testimonial" in " ".join(p.get("paragraphs", [])).lower() for p in extracted.values())
            if not has_testimonials:
                gaps.append("Competitors showcase customer testimonials")
        
        if any(w in prompt_lower for w in ["how", "guide", "tutorial"]):
            has_guide = any("guide" in " ".join(p.get("h2", [])).lower() or "tutorial" in " ".join(p.get("h2", [])).lower() for p in extracted.values())
            if not has_guide:
                gaps.append("Competitors have detailed guides")
        
        return {"gaps": gaps[:4], "count": len(gaps)}

    async def _llm_prompt_analysis(self, prompt: str, intel: dict, extracted: dict,
                                    signals: dict, visibility: int, model_probs: dict,
                                    evidence: list, clusters: list,
                                    competitor_analysis: dict, citation_readiness: dict) -> dict:
        """Call LLM for prompt-specific qualitative insights."""
        
        sample_pages = []
        for url, page in list(extracted.items())[:5]:
            sample_pages.append({
                "url": url,
                "title": page.get("title"),
                "h1": page.get("h1", [])[:2],
                "h2": page.get("h2", [])[:3],
                "has_faq": bool(page.get("faqs")),
                "has_reviews": bool(page.get("reviews")),
                "has_prices": bool(page.get("prices")),
                "schema_types": page.get("schema_types", [])[:3],
            })
        
        context = {
            "prompt": prompt,
            "visibility_score": visibility,
            "model_probabilities": model_probs,
            "signals": {k: v for k, v in signals.items() if not isinstance(v, list)},
            "industry": intel.get("industry"),
            "services": intel.get("services", [])[:5],
            "entities": intel.get("entities", [])[:5],
            "locations": intel.get("locations", [])[:3],
            "evidence_count": len(evidence),
            "clusters": clusters,
            "citation_readiness": citation_readiness,
            "sample_pages": sample_pages,
        }
        
        system = (
            "You are a Senior AI Search Engineer analyzing a specific search prompt. "
            "Provide insights ONLY about this prompt, not the website in general. "
            "Every insight must be traceable to the provided crawled data. "
            "Never invent facts."
        )
        
        user = f"""You are a Senior AI Search Engineer. Analyze this specific search prompt based on crawled website data.
Provide insights ONLY about this prompt. Every insight must be traceable to the provided data. Never invent facts.

{json.dumps(context, indent=2)[:4000]}

Return a JSON object with:

- "model_analysis": object with keys "ChatGPT","Gemini","Claude","Perplexity" — each with:
    - "probability": the integer from model_probabilities
    - "analysis": 2-3 sentences specific to THIS prompt vs this platform's preferences
    - "strength": one specific strength for this prompt on this platform
    - "weakness": one specific weakness for this prompt on this platform

- "brand_overview": object with keys "ChatGPT","Gemini","Claude","Perplexity" — each with:
    - "recognition": "high"|"medium"|"low" (for this prompt)
    - "confidence": integer 0-100
    - "reason": one sentence explaining why this platform would/wouldn't recommend for this prompt

- "content_gaps": list of 3-5 specific gaps for THIS prompt only (e.g. "No pricing for this service", not generic)

- "optimization_suggestions": list of 4-6 specific suggestions to improve ranking for THIS prompt

Return only valid JSON."""
        
        try:
            logger.info("[PLAYGROUND] Calling LLM for prompt analysis...")
            raw = await _call_llm(user, json_mode=True)
            return json.loads(raw)
        except Exception as e:
            logger.warning(f"[PLAYGROUND] LLM analysis failed: {e}")
            return {
                "model_analysis": {},
                "brand_overview": {},
                "content_gaps": [],
                "optimization_suggestions": [],
                "error": str(e),
            }
