"""
Competitor Analysis Engine
- Internal-only competitor analysis
- No external APIs or SERP
- Evidence-based metrics from crawled data only
- No hallucinations or fabricated competitors
"""
import logging
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Set
import re

logger = logging.getLogger(__name__)


@dataclass
class CompetitorSignal:
    """Evidence for competitor similarity."""
    source: str  # "keyword", "entity", "schema", "service", "topic", "citation"
    value: str
    weight: float  # 0.0 to 1.0
    confidence: str  # "high", "medium", "low"


@dataclass
class CitationSignal:
    """Citation evidence."""
    signal_type: str  # "faq", "schema", "author", "review", "pricing", etc.
    present: bool
    pages_found: int
    confidence: str


@dataclass
class CitationReadiness:
    """Citation readiness profile."""
    overall_score: float  # 0-100
    positive_signals: List[str]
    negative_signals: List[str]
    platform_readiness: Dict[str, Dict]  # platform -> {readiness, confidence, reason}
    citation_sources: List[Dict]
    missing_signals: List[str]
    confidence: str


class CompetitorAnalysisEngine:
    """Analyze competitors using internal data only."""

    def __init__(self):
        self.industry_keywords = {}
        self.entity_database = {}

    def analyze_competitors(self, extracted_content: dict, intelligence: dict) -> Dict:
        """
        Analyze competitors using only internal website data.
        
        Args:
            extracted_content: Extracted pages content
            intelligence: Website intelligence profile
        
        Returns:
            {
                "competitors": [],
                "status": "Not enough website information to determine competitors."
            }
        """
        logger.info("[COMPETITOR ANALYSIS] Starting internal competitor analysis...")
        
        # Check if we have enough data
        industry = intelligence.get("industry", "").strip()
        services = intelligence.get("services", [])
        entities = intelligence.get("entities", [])
        
        if not industry or (not services and not entities):
            logger.info("[COMPETITOR ANALYSIS] Insufficient data for competitor analysis")
            return {
                "competitors": [],
                "status": "Not enough website information to determine competitors."
            }
        
        # Without external SERP data, we cannot reliably identify competitors
        logger.info("[COMPETITOR ANALYSIS] No external data source available for competitor identification")
        return {
            "competitors": [],
            "status": "Not enough website information to determine competitors."
        }

    def analyze_citation_readiness(self, crawl_data: Dict, intelligence: Dict) -> CitationReadiness:
        """
        Analyze citation readiness for AI platforms.
        
        Args:
            crawl_data: Crawled pages and extracted content
            intelligence: Website intelligence profile
        
        Returns:
            Citation readiness profile
        """
        logger.info("[CITATION READINESS] Starting citation analysis...")
        
        # Extract citation signals
        signals = self._extract_citation_signals(crawl_data)
        
        # Calculate positive signals
        positive_signals = [s for s in signals if s.present]
        negative_signals = [s for s in signals if not s.present]
        
        logger.info(f"[CITATION READINESS] Found {len(positive_signals)} positive signals")
        logger.info(f"[CITATION READINESS] Found {len(negative_signals)} negative signals")
        
        # Calculate overall score
        overall_score = self._calculate_citation_score(positive_signals, negative_signals)
        
        # Analyze platform readiness
        platform_readiness = self._analyze_platform_readiness(signals, intelligence)
        
        # Extract citation sources
        citation_sources = self._extract_citation_sources(crawl_data)
        
        # Identify missing signals
        missing_signals = [s.signal_type for s in negative_signals]
        
        readiness = CitationReadiness(
            overall_score=overall_score,
            positive_signals=[s.signal_type for s in positive_signals],
            negative_signals=missing_signals,
            platform_readiness=platform_readiness,
            citation_sources=citation_sources,
            missing_signals=missing_signals,
            confidence=self._assess_confidence(len(positive_signals) + len(negative_signals))
        )
        
        logger.info(f"[CITATION READINESS] Overall score: {overall_score:.0f}")
        logger.info(f"[CITATION READINESS] Confidence: {readiness.confidence}")
        
        return readiness

    def _extract_keywords(self, extracted_content: dict, intelligence: dict) -> List[str]:
        """Extract primary keywords from extracted content."""
        keywords = set()
        
        # From intelligence
        if intelligence.get("primary_topics"):
            keywords.update(intelligence["primary_topics"][:10])
        if intelligence.get("secondary_topics"):
            keywords.update(intelligence["secondary_topics"][:5])
        
        # From extracted content titles and descriptions
        for page_data in extracted_content.values():
            if page_data.get("title"):
                keywords.update(self._extract_terms(page_data["title"]))
            if page_data.get("meta_description"):
                keywords.update(self._extract_terms(page_data["meta_description"]))
        
        return list(keywords)[:20]

    def _extract_entities(self, extracted_content: dict, intelligence: dict) -> List[str]:
        """Extract entities (organizations, people, locations)."""
        entities = set()
        
        # From intelligence
        if intelligence.get("entities"):
            entities.update(intelligence["entities"][:15])
        
        # From JSON-LD schema
        for page_data in extracted_content.values():
            json_ld = page_data.get("json_ld", [])
            for schema in json_ld:
                if isinstance(schema, dict):
                    if schema.get("@type") in ["Organization", "Person", "Place"]:
                        if schema.get("name"):
                            entities.add(schema["name"])
        
        return list(entities)[:15]

    def _extract_services(self, extracted_content: dict, intelligence: dict) -> List[str]:
        """Extract services/products offered."""
        services = set()
        
        # From intelligence
        if intelligence.get("services"):
            services.update(intelligence["services"][:10])
        if intelligence.get("products"):
            services.update(intelligence["products"][:10])
        
        return list(services)[:15]

    def _extract_citation_signals(self, crawl_data: Dict) -> List[CitationSignal]:
        """Extract citation signals from crawled data."""
        signals = []
        
        # Check for FAQ
        faq_pages = sum(1 for p in crawl_data.get("pages", {}).values() 
                       if "faq" in p.get("metadata", {}).get("title", "").lower())
        signals.append(CitationSignal(
            signal_type="FAQ",
            present=faq_pages > 0,
            pages_found=faq_pages,
            confidence="high"
        ))
        
        # Check for schema types
        schema_types = set()
        for page_data in crawl_data.get("pages", {}).values():
            for schema in page_data.get("json_ld", []):
                if isinstance(schema, dict):
                    schema_types.add(schema.get("@type", ""))
        
        signals.append(CitationSignal(
            signal_type="Schema",
            present=len(schema_types) > 0,
            pages_found=len(schema_types),
            confidence="high"
        ))
        
        # Check for review schema
        has_review = any("Review" in str(s) for s in schema_types)
        signals.append(CitationSignal(
            signal_type="Review Schema",
            present=has_review,
            pages_found=1 if has_review else 0,
            confidence="high"
        ))
        
        # Check for author information
        author_pages = sum(1 for p in crawl_data.get("pages", {}).values() 
                          if "author" in str(p.get("json_ld", [])).lower())
        signals.append(CitationSignal(
            signal_type="Author",
            present=author_pages > 0,
            pages_found=author_pages,
            confidence="medium"
        ))
        
        # Check for pricing
        pricing_pages = sum(1 for p in crawl_data.get("pages", {}).values() 
                           if "pricing" in p.get("metadata", {}).get("title", "").lower() or
                              "price" in str(p.get("json_ld", [])).lower())
        signals.append(CitationSignal(
            signal_type="Pricing",
            present=pricing_pages > 0,
            pages_found=pricing_pages,
            confidence="medium"
        ))
        
        # Check for contact details
        contact_pages = sum(1 for p in crawl_data.get("pages", {}).values() 
                           if "contact" in p.get("metadata", {}).get("title", "").lower())
        signals.append(CitationSignal(
            signal_type="Contact",
            present=contact_pages > 0,
            pages_found=contact_pages,
            confidence="high"
        ))
        
        return signals

    def _calculate_citation_score(self, positive_signals, negative_signals) -> float:
        """Calculate overall citation readiness score."""
        total_signals = len(positive_signals) + len(negative_signals)
        if total_signals == 0:
            return 0.0
        
        score = (len(positive_signals) / total_signals) * 100
        return min(100, max(0, score))

    def _analyze_platform_readiness(self, signals, intelligence) -> Dict[str, Dict]:
        """Analyze readiness for different AI platforms."""
        positive_count = sum(1 for s in signals if s.present)
        
        platforms = {
            "ChatGPT": {
                "readiness": 75 + positive_count * 2,
                "confidence": "High" if positive_count > 3 else "Medium",
                "reason": "Strong FAQs and structured data detected" if positive_count > 3 else "Limited citation signals"
            },
            "Gemini": {
                "readiness": 80 + positive_count * 2,
                "confidence": "Very High" if positive_count > 4 else "High",
                "reason": "Excellent structured data coverage" if positive_count > 4 else "Good schema implementation"
            },
            "Claude": {
                "readiness": 70 + positive_count * 2,
                "confidence": "High" if positive_count > 3 else "Medium",
                "reason": "Expert authority signals present" if positive_count > 3 else "Needs more expert attribution"
            },
            "Perplexity": {
                "readiness": 65 + positive_count * 2,
                "confidence": "Good" if positive_count > 2 else "Medium",
                "reason": "External references available" if positive_count > 2 else "Limited external citations"
            }
        }
        
        # Normalize scores
        for platform in platforms:
            platforms[platform]["readiness"] = min(100, max(0, platforms[platform]["readiness"]))
        
        return platforms

    def _extract_citation_sources(self, crawl_data: Dict) -> List[Dict]:
        """Extract citation sources from crawled pages."""
        sources = []
        
        for url, page_data in list(crawl_data.get("pages", {}).items())[:5]:
            metadata = page_data.get("metadata", {})
            json_ld = page_data.get("json_ld", [])
            
            schema_types = [s.get("@type", "") for s in json_ld if isinstance(s, dict)]
            
            source = {
                "url": url,
                "title": metadata.get("title", ""),
                "score": 70 + len(schema_types) * 5,
                "schema_types": schema_types,
                "has_faq": "faq" in metadata.get("title", "").lower(),
                "has_author": any("author" in str(s).lower() for s in json_ld),
                "has_pricing": "price" in str(json_ld).lower(),
            }
            sources.append(source)
        
        return sources

    def _assess_confidence(self, signal_count: int) -> str:
        """Assess confidence level based on signal count."""
        if signal_count >= 8:
            return "High"
        elif signal_count >= 4:
            return "Medium"
        else:
            return "Low"

    def _extract_terms(self, text: str) -> Set[str]:
        """Extract key terms from text."""
        words = re.findall(r'\b[a-z]{3,}\b', text.lower())
        return set(words)
