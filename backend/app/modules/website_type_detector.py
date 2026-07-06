"""
Website Type Detector
Classifies websites before scoring so scoring adapts to website type.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class WebsiteTypeDetector:
    """Detects website type from extracted content."""

    WEBSITE_TYPES = {
        "ecommerce": {
            "keywords": ["product", "price", "cart", "checkout", "buy", "shop", "store", "order", "payment"],
            "schema_types": ["Product", "Offer", "AggregateOffer", "ShoppingCart"],
            "patterns": ["products", "categories", "pricing", "cart", "checkout"],
        },
        "healthcare": {
            "keywords": ["doctor", "patient", "appointment", "medical", "health", "clinic", "hospital", "treatment", "diagnosis"],
            "schema_types": ["MedicalBusiness", "Physician", "Hospital", "HealthAndBeautyBusiness"],
            "patterns": ["appointments", "services", "doctors", "specialties"],
        },
        "saas": {
            "keywords": ["software", "cloud", "api", "integration", "subscription", "pricing", "features", "dashboard", "account"],
            "schema_types": ["SoftwareApplication", "WebApplication"],
            "patterns": ["features", "pricing", "documentation", "api", "integrations"],
        },
        "local_business": {
            "keywords": ["location", "address", "phone", "hours", "near me", "local", "service area"],
            "schema_types": ["LocalBusiness", "Restaurant", "Store", "ServiceArea"],
            "patterns": ["locations", "hours", "contact", "services"],
        },
        "law_firm": {
            "keywords": ["attorney", "lawyer", "legal", "practice", "case", "consultation", "law"],
            "schema_types": ["Attorney", "LegalService"],
            "patterns": ["practice areas", "attorneys", "consultation"],
        },
        "blog": {
            "keywords": ["article", "post", "blog", "author", "published", "category", "tag"],
            "schema_types": ["BlogPosting", "Article", "NewsArticle"],
            "patterns": ["blog", "articles", "categories", "tags"],
        },
        "marketplace": {
            "keywords": ["seller", "vendor", "listing", "auction", "bid", "marketplace"],
            "schema_types": ["Product", "Offer", "AggregateOffer"],
            "patterns": ["sellers", "listings", "categories"],
        },
        "restaurant": {
            "keywords": ["menu", "reservation", "dining", "cuisine", "chef", "restaurant", "food"],
            "schema_types": ["Restaurant", "FoodEstablishment"],
            "patterns": ["menu", "reservations", "hours", "location"],
        },
        "real_estate": {
            "keywords": ["property", "listing", "real estate", "agent", "broker", "rent", "sale", "mortgage"],
            "schema_types": ["RealEstateAgent", "Residence", "House", "Apartment"],
            "patterns": ["listings", "properties", "agents", "contact"],
        },
        "education": {
            "keywords": ["course", "student", "teacher", "school", "university", "education", "learning", "enrollment"],
            "schema_types": ["EducationalOrganization", "Course", "SchoolEvent"],
            "patterns": ["courses", "programs", "enrollment", "faculty"],
        },
    }

    def detect(self, intelligence: dict, extracted_content: dict) -> tuple[str, int]:
        """
        Detect website type.
        Returns: (website_type, confidence_0_to_100)
        """
        logger.info("\n[WEBSITE TYPE] Detecting website type...")

        industry = intelligence.get("industry", "").lower()
        services = [s.lower() for s in intelligence.get("services", [])]
        entities = [e.lower() for e in intelligence.get("entities", [])]
        topics = [t.lower() for t in intelligence.get("primary_topics", [])]

        # Collect all schema types from extracted content
        all_schema_types = []
        for page in extracted_content.values():
            schema_types = page.get("schema_types", [])
            all_schema_types.extend([s for s in schema_types if s])

        # Score each website type
        scores = {}

        for website_type, indicators in self.WEBSITE_TYPES.items():
            score = 0

            # Check keywords in industry, services, entities, topics
            all_text = " ".join([industry] + services + entities + topics).lower()
            keyword_matches = sum(1 for kw in indicators["keywords"] if kw in all_text)
            score += keyword_matches * 10

            # Check schema types
            schema_matches = sum(1 for st in indicators["schema_types"] if st in all_schema_types)
            score += schema_matches * 15

            # Check patterns in extracted content
            pattern_matches = sum(1 for p in indicators["patterns"] if p in all_text)
            score += pattern_matches * 8

            scores[website_type] = score

        # Find best match
        if not scores or max(scores.values()) == 0:
            logger.info("[WEBSITE TYPE] No clear type detected - defaulting to 'general'")
            return "general", 0

        best_type = max(scores, key=scores.get)
        best_score = scores[best_type]
        confidence = min(100, best_score)

        logger.info(f"[WEBSITE TYPE] Detected: {best_type}")
        logger.info(f"[WEBSITE TYPE] Confidence: {confidence}%")
        logger.info(f"[WEBSITE TYPE] Scores: {scores}")

        return best_type, confidence

    def get_scoring_adjustments(self, website_type: str) -> dict:
        """Get scoring adjustments for website type."""
        adjustments = {
            "ecommerce": {
                "penalize_missing_schema": False,  # Ecommerce should have Product schema
                "penalize_missing_faq": True,  # Less critical
                "penalize_missing_reviews": False,  # Very important for ecommerce
                "penalize_missing_pricing": False,  # Critical for ecommerce
                "penalize_missing_local_schema": True,  # Not needed
            },
            "healthcare": {
                "penalize_missing_schema": False,  # Medical schema important
                "penalize_missing_faq": False,  # Important for healthcare
                "penalize_missing_reviews": False,  # Important for trust
                "penalize_missing_pricing": True,  # Less critical
                "penalize_missing_local_schema": False,  # LocalBusiness important
            },
            "saas": {
                "penalize_missing_schema": True,  # Less critical
                "penalize_missing_faq": False,  # Important for SaaS
                "penalize_missing_reviews": False,  # Important for trust
                "penalize_missing_pricing": False,  # Critical for SaaS
                "penalize_missing_local_schema": True,  # Not needed
            },
            "local_business": {
                "penalize_missing_schema": False,  # LocalBusiness schema critical
                "penalize_missing_faq": True,  # Less critical
                "penalize_missing_reviews": False,  # Very important
                "penalize_missing_pricing": True,  # Less critical
                "penalize_missing_local_schema": False,  # Critical
            },
            "blog": {
                "penalize_missing_schema": False,  # Article schema important
                "penalize_missing_faq": True,  # Less critical
                "penalize_missing_reviews": True,  # Less critical
                "penalize_missing_pricing": True,  # Not needed
                "penalize_missing_local_schema": True,  # Not needed
            },
            "general": {
                "penalize_missing_schema": False,
                "penalize_missing_faq": False,
                "penalize_missing_reviews": False,
                "penalize_missing_pricing": False,
                "penalize_missing_local_schema": False,
            },
        }

        return adjustments.get(website_type, adjustments["general"])
