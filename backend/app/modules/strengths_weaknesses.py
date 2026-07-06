"""
Module: Strengths & Weaknesses Analyzer
Derives strengths and weaknesses from actual crawl data, issues, and intelligence.
Never hardcoded - always generated dynamically from analysis results.
"""
import logging
from typing import List, Dict, Tuple

logger = logging.getLogger(__name__)


class StrengthsWeaknessesAnalyzer:
    """Analyze website strengths and weaknesses from crawl data."""

    def analyze(
        self,
        extracted_content: Dict,
        profile: Dict,
        issues: List[Dict],
        scores: Dict,
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Generate strengths and weaknesses from actual data.

        Args:
            extracted_content: Extracted content from all pages
            profile: Website intelligence profile
            issues: Detected issues
            scores: Calculated scores

        Returns:
            (strengths, weaknesses) - Lists of dicts with title, description, impact
        """
        logger.info("[STRENGTHS/WEAKNESSES] Starting analysis...")

        strengths = []
        weaknesses = []

        # Analyze from extracted content
        content_strengths, content_weaknesses = self._analyze_content(extracted_content)
        strengths.extend(content_strengths)
        weaknesses.extend(content_weaknesses)

        # Analyze from schema and structured data
        schema_strengths, schema_weaknesses = self._analyze_schema(extracted_content)
        strengths.extend(schema_strengths)
        weaknesses.extend(schema_weaknesses)

        # Analyze from FAQ coverage
        faq_strengths, faq_weaknesses = self._analyze_faq(extracted_content)
        strengths.extend(faq_strengths)
        weaknesses.extend(faq_weaknesses)

        # Analyze from internal linking
        linking_strengths, linking_weaknesses = self._analyze_linking(extracted_content)
        strengths.extend(linking_strengths)
        weaknesses.extend(linking_weaknesses)

        # Analyze from authority signals
        authority_strengths, authority_weaknesses = self._analyze_authority(extracted_content)
        strengths.extend(authority_strengths)
        weaknesses.extend(authority_weaknesses)

        # Analyze from technical SEO
        tech_strengths, tech_weaknesses = self._analyze_technical_seo(extracted_content)
        strengths.extend(tech_strengths)
        weaknesses.extend(tech_weaknesses)

        # Analyze from profile data
        profile_strengths, profile_weaknesses = self._analyze_profile(profile)
        strengths.extend(profile_strengths)
        weaknesses.extend(profile_weaknesses)

        # Analyze from detected issues
        issue_weaknesses = self._analyze_issues(issues)
        weaknesses.extend(issue_weaknesses)

        # Analyze from scores
        score_strengths, score_weaknesses = self._analyze_scores(scores)
        strengths.extend(score_strengths)
        weaknesses.extend(score_weaknesses)

        # Remove duplicates and sort by impact
        strengths = self._deduplicate_and_sort(strengths)
        weaknesses = self._deduplicate_and_sort(weaknesses)

        logger.info(f"[STRENGTHS/WEAKNESSES] Found {len(strengths)} strengths")
        logger.info(f"[STRENGTHS/WEAKNESSES] Found {len(weaknesses)} weaknesses")

        for s in strengths[:5]:
            logger.debug(f"  ✓ {s['title']}")
        for w in weaknesses[:5]:
            logger.debug(f"  ✗ {w['title']}")

        return strengths, weaknesses

    # ── Content Analysis ──────────────────────────────────────────────────

    def _analyze_content(self, extracted_content: Dict) -> Tuple[List[Dict], List[Dict]]:
        """Analyze content quality and depth."""
        strengths = []
        weaknesses = []

        page_count = len(extracted_content)
        if page_count == 0:
            return strengths, weaknesses

        # Calculate content metrics
        pages_with_content = 0
        total_words = 0
        pages_with_h2 = 0
        pages_with_h3 = 0
        avg_word_count = 0

        for page in extracted_content.values():
            word_count = page.get("word_count", 0) or 0
            if word_count > 0:
                pages_with_content += 1
                total_words += word_count

            if page.get("h2"):
                pages_with_h2 += 1
            if page.get("h3"):
                pages_with_h3 += 1

        if pages_with_content > 0:
            avg_word_count = total_words / pages_with_content

        # Strengths
        if avg_word_count > 1500:
            strengths.append({
                "title": "Comprehensive Content",
                "description": f"Average page length of {avg_word_count:.0f} words indicates deep, authoritative content.",
                "impact": "high",
                "evidence": f"{pages_with_content}/{page_count} pages with substantial content"
            })
        elif avg_word_count > 1000:
            strengths.append({
                "title": "Good Content Depth",
                "description": f"Average page length of {avg_word_count:.0f} words shows solid content coverage.",
                "impact": "medium",
                "evidence": f"{pages_with_content}/{page_count} pages with good content"
            })

        if pages_with_h2 > page_count * 0.8:
            strengths.append({
                "title": "Strong Content Structure",
                "description": "Most pages use H2 headings for proper content hierarchy.",
                "impact": "medium",
                "evidence": f"{pages_with_h2}/{page_count} pages with H2 structure"
            })

        # Weaknesses
        if avg_word_count < 300:
            weaknesses.append({
                "title": "Thin Content",
                "description": f"Average page length of {avg_word_count:.0f} words is too short for AI citation.",
                "impact": "high",
                "evidence": f"Only {pages_with_content}/{page_count} pages have substantial content"
            })
        elif avg_word_count < 500:
            weaknesses.append({
                "title": "Shallow Content Depth",
                "description": f"Average page length of {avg_word_count:.0f} words lacks depth for AI models.",
                "impact": "medium",
                "evidence": f"Average content is below 500 words"
            })

        if pages_with_h2 < page_count * 0.5:
            weaknesses.append({
                "title": "Poor Content Structure",
                "description": "Many pages lack H2 headings for proper hierarchy.",
                "impact": "medium",
                "evidence": f"Only {pages_with_h2}/{page_count} pages use H2 structure"
            })

        return strengths, weaknesses

    # ── Schema Analysis ───────────────────────────────────────────────────

    def _analyze_schema(self, extracted_content: Dict) -> Tuple[List[Dict], List[Dict]]:
        """Analyze structured data coverage."""
        strengths = []
        weaknesses = []

        page_count = len(extracted_content)
        if page_count == 0:
            return strengths, weaknesses

        pages_with_schema = 0
        schema_types = set()
        pages_with_faq_schema = 0
        pages_with_review_schema = 0
        pages_with_breadcrumb = 0

        for page in extracted_content.values():
            types = page.get("schema_types", []) or []
            if types:
                pages_with_schema += 1
                schema_types.update(types)

            if any("FAQ" in t for t in types if t):
                pages_with_faq_schema += 1
            if any("Review" in t or "AggregateRating" in t for t in types if t):
                pages_with_review_schema += 1
            if any("Breadcrumb" in t for t in types if t):
                pages_with_breadcrumb += 1

        schema_coverage = (pages_with_schema / page_count) * 100

        # Strengths
        if schema_coverage > 80:
            strengths.append({
                "title": "Excellent Structured Data",
                "description": f"{schema_coverage:.0f}% of pages have schema markup for AI understanding.",
                "impact": "high",
                "evidence": f"{pages_with_schema}/{page_count} pages with schema"
            })
        elif schema_coverage > 50:
            strengths.append({
                "title": "Good Schema Coverage",
                "description": f"{schema_coverage:.0f}% of pages have structured data markup.",
                "impact": "medium",
                "evidence": f"{pages_with_schema}/{page_count} pages with schema"
            })

        if pages_with_faq_schema > 0:
            strengths.append({
                "title": "FAQ Schema Implementation",
                "description": f"{pages_with_faq_schema} pages use FAQ schema for featured snippets.",
                "impact": "medium",
                "evidence": f"{pages_with_faq_schema} pages with FAQPage schema"
            })

        if pages_with_review_schema > 0:
            strengths.append({
                "title": "Review Schema Present",
                "description": f"{pages_with_review_schema} pages have review/rating schema.",
                "impact": "medium",
                "evidence": f"{pages_with_review_schema} pages with Review schema"
            })

        # Weaknesses
        if schema_coverage < 20:
            weaknesses.append({
                "title": "Missing Structured Data",
                "description": "Very few pages have schema markup - critical for AI models.",
                "impact": "critical",
                "evidence": f"Only {pages_with_schema}/{page_count} pages with schema"
            })
        elif schema_coverage < 50:
            weaknesses.append({
                "title": "Incomplete Schema Coverage",
                "description": f"Only {schema_coverage:.0f}% of pages have structured data.",
                "impact": "high",
                "evidence": f"{pages_with_schema}/{page_count} pages with schema"
            })

        if pages_with_faq_schema == 0:
            weaknesses.append({
                "title": "No FAQ Schema",
                "description": "Missing FAQ schema reduces chances of featured snippets.",
                "impact": "medium",
                "evidence": "0 pages with FAQPage schema"
            })

        if pages_with_review_schema == 0:
            weaknesses.append({
                "title": "No Review Schema",
                "description": "Missing review schema reduces trust signals.",
                "impact": "medium",
                "evidence": "0 pages with Review schema"
            })

        return strengths, weaknesses

    # ── FAQ Analysis ──────────────────────────────────────────────────────

    def _analyze_faq(self, extracted_content: Dict) -> Tuple[List[Dict], List[Dict]]:
        """Analyze FAQ coverage."""
        strengths = []
        weaknesses = []

        page_count = len(extracted_content)
        if page_count == 0:
            return strengths, weaknesses

        pages_with_faq = 0
        total_faqs = 0

        for page in extracted_content.values():
            faqs = page.get("faqs", [])
            if faqs:
                pages_with_faq += 1
                total_faqs += len(faqs)

        faq_coverage = (pages_with_faq / page_count) * 100

        # Strengths
        if total_faqs > 20:
            strengths.append({
                "title": "Extensive FAQ Content",
                "description": f"{total_faqs} FAQs across {pages_with_faq} pages help AI models understand common questions.",
                "impact": "high",
                "evidence": f"{total_faqs} FAQs found"
            })
        elif total_faqs > 10:
            strengths.append({
                "title": "Good FAQ Coverage",
                "description": f"{total_faqs} FAQs help answer common user questions.",
                "impact": "medium",
                "evidence": f"{total_faqs} FAQs found"
            })

        # Weaknesses
        if total_faqs == 0:
            weaknesses.append({
                "title": "No FAQ Content",
                "description": "Missing FAQ content reduces AI citation probability.",
                "impact": "high",
                "evidence": "0 FAQs detected"
            })
        elif total_faqs < 5:
            weaknesses.append({
                "title": "Limited FAQ Coverage",
                "description": f"Only {total_faqs} FAQs - more would help AI models.",
                "impact": "medium",
                "evidence": f"{total_faqs} FAQs found"
            })

        return strengths, weaknesses

    # ── Internal Linking Analysis ─────────────────────────────────────────

    def _analyze_linking(self, extracted_content: Dict) -> Tuple[List[Dict], List[Dict]]:
        """Analyze internal linking structure."""
        strengths = []
        weaknesses = []

        page_count = len(extracted_content)
        if page_count == 0:
            return strengths, weaknesses

        pages_with_internal_links = 0
        pages_with_external_links = 0
        total_internal_links = 0
        total_external_links = 0

        for page in extracted_content.values():
            internal = page.get("internal_links", [])
            external = page.get("external_links", [])

            if internal:
                pages_with_internal_links += 1
                total_internal_links += len(internal)

            if external:
                pages_with_external_links += 1
                total_external_links += len(external)

        internal_coverage = (pages_with_internal_links / page_count) * 100
        external_coverage = (pages_with_external_links / page_count) * 100

        # Strengths
        if internal_coverage > 80:
            strengths.append({
                "title": "Strong Internal Linking",
                "description": f"{internal_coverage:.0f}% of pages have internal links for better crawlability.",
                "impact": "high",
                "evidence": f"{pages_with_internal_links}/{page_count} pages with internal links"
            })

        if external_coverage > 50:
            strengths.append({
                "title": "Good External References",
                "description": f"{external_coverage:.0f}% of pages cite external sources for authority.",
                "impact": "medium",
                "evidence": f"{pages_with_external_links}/{page_count} pages with external links"
            })

        # Weaknesses
        if internal_coverage < 30:
            weaknesses.append({
                "title": "Poor Internal Linking",
                "description": "Few pages have internal links - hurts crawlability and authority distribution.",
                "impact": "high",
                "evidence": f"Only {pages_with_internal_links}/{page_count} pages with internal links"
            })

        if external_coverage < 20:
            weaknesses.append({
                "title": "Limited External References",
                "description": "Few external links reduce topical authority signals.",
                "impact": "medium",
                "evidence": f"Only {pages_with_external_links}/{page_count} pages with external links"
            })

        return strengths, weaknesses

    # ── Authority Analysis ────────────────────────────────────────────────

    def _analyze_authority(self, extracted_content: Dict) -> Tuple[List[Dict], List[Dict]]:
        """Analyze authority signals (reviews, pricing, contact)."""
        strengths = []
        weaknesses = []

        page_count = len(extracted_content)
        if page_count == 0:
            return strengths, weaknesses

        pages_with_reviews = 0
        pages_with_pricing = 0
        pages_with_phones = 0
        pages_with_emails = 0

        for page in extracted_content.values():
            if page.get("reviews"):
                pages_with_reviews += 1
            if page.get("prices"):
                pages_with_pricing += 1
            if page.get("phones"):
                pages_with_phones += 1
            if page.get("emails"):
                pages_with_emails += 1

        # Strengths
        if pages_with_reviews > 0:
            strengths.append({
                "title": "Review Signals Present",
                "description": f"{pages_with_reviews} pages have review/rating content for trust.",
                "impact": "high",
                "evidence": f"{pages_with_reviews} pages with reviews"
            })

        if pages_with_pricing > 0:
            strengths.append({
                "title": "Transparent Pricing",
                "description": f"{pages_with_pricing} pages display pricing information.",
                "impact": "medium",
                "evidence": f"{pages_with_pricing} pages with pricing"
            })

        contact_pages = pages_with_phones + pages_with_emails
        if contact_pages > 0:
            strengths.append({
                "title": "Clear Contact Information",
                "description": f"{contact_pages} pages have phone/email for customer trust.",
                "impact": "medium",
                "evidence": f"{contact_pages} pages with contact info"
            })

        # Weaknesses
        if pages_with_reviews == 0:
            weaknesses.append({
                "title": "No Review Signals",
                "description": "Missing review content reduces trust and citation probability.",
                "impact": "high",
                "evidence": "0 pages with reviews"
            })

        if pages_with_pricing == 0:
            weaknesses.append({
                "title": "Missing Pricing Information",
                "description": "No pricing transparency reduces AI model confidence.",
                "impact": "medium",
                "evidence": "0 pages with pricing"
            })

        if contact_pages == 0:
            weaknesses.append({
                "title": "No Contact Information",
                "description": "Missing phone/email reduces trust signals.",
                "impact": "high",
                "evidence": "0 pages with contact info"
            })

        return strengths, weaknesses

    # ── Technical SEO Analysis ────────────────────────────────────────────

    def _analyze_technical_seo(self, extracted_content: Dict) -> Tuple[List[Dict], List[Dict]]:
        """Analyze technical SEO signals."""
        strengths = []
        weaknesses = []

        page_count = len(extracted_content)
        if page_count == 0:
            return strengths, weaknesses

        pages_with_title = 0
        pages_with_meta = 0
        pages_with_h1 = 0
        pages_with_canonical = 0
        pages_with_og = 0
        pages_with_noindex = 0

        for page in extracted_content.values():
            if page.get("title"):
                pages_with_title += 1
            if page.get("meta_description"):
                pages_with_meta += 1
            if page.get("h1"):
                pages_with_h1 += 1
            if page.get("canonical"):
                pages_with_canonical += 1
            if page.get("og_tags"):
                pages_with_og += 1

            robots = page.get("robots_meta", "")
            if robots and "noindex" in robots.lower():
                pages_with_noindex += 1

        title_coverage = (pages_with_title / page_count) * 100
        meta_coverage = (pages_with_meta / page_count) * 100
        h1_coverage = (pages_with_h1 / page_count) * 100
        canonical_coverage = (pages_with_canonical / page_count) * 100

        # Strengths
        if title_coverage > 95:
            strengths.append({
                "title": "Complete Title Tags",
                "description": f"{title_coverage:.0f}% of pages have unique title tags.",
                "impact": "high",
                "evidence": f"{pages_with_title}/{page_count} pages with titles"
            })

        if meta_coverage > 95:
            strengths.append({
                "title": "Complete Meta Descriptions",
                "description": f"{meta_coverage:.0f}% of pages have meta descriptions.",
                "impact": "high",
                "evidence": f"{pages_with_meta}/{page_count} pages with meta"
            })

        if h1_coverage > 95:
            strengths.append({
                "title": "Complete H1 Tags",
                "description": f"{h1_coverage:.0f}% of pages have H1 tags.",
                "impact": "medium",
                "evidence": f"{pages_with_h1}/{page_count} pages with H1"
            })

        if canonical_coverage > 90:
            strengths.append({
                "title": "Canonical Tags Present",
                "description": f"{canonical_coverage:.0f}% of pages have canonical tags.",
                "impact": "medium",
                "evidence": f"{pages_with_canonical}/{page_count} pages with canonical"
            })

        # Weaknesses
        if title_coverage < 80:
            weaknesses.append({
                "title": "Missing Title Tags",
                "description": f"Only {title_coverage:.0f}% of pages have title tags.",
                "impact": "critical",
                "evidence": f"Only {pages_with_title}/{page_count} pages with titles"
            })

        if meta_coverage < 80:
            weaknesses.append({
                "title": "Missing Meta Descriptions",
                "description": f"Only {meta_coverage:.0f}% of pages have meta descriptions.",
                "impact": "high",
                "evidence": f"Only {pages_with_meta}/{page_count} pages with meta"
            })

        if h1_coverage < 80:
            weaknesses.append({
                "title": "Missing H1 Tags",
                "description": f"Only {h1_coverage:.0f}% of pages have H1 tags.",
                "impact": "high",
                "evidence": f"Only {pages_with_h1}/{page_count} pages with H1"
            })

        if pages_with_noindex > 0:
            weaknesses.append({
                "title": "Noindex Pages Detected",
                "description": f"{pages_with_noindex} pages have noindex - verify this is intentional.",
                "impact": "critical",
                "evidence": f"{pages_with_noindex} pages with noindex"
            })

        return strengths, weaknesses

    # ── Profile Analysis ──────────────────────────────────────────────────

    def _analyze_profile(self, profile: Dict) -> Tuple[List[Dict], List[Dict]]:
        """Analyze website profile data."""
        strengths = []
        weaknesses = []

        # Strengths
        if profile.get("unique_selling_points") and len(profile["unique_selling_points"]) > 2:
            strengths.append({
                "title": "Clear Unique Value Proposition",
                "description": f"{len(profile['unique_selling_points'])} distinct USPs help AI models understand differentiation.",
                "impact": "high",
                "evidence": f"{len(profile['unique_selling_points'])} USPs identified"
            })

        if profile.get("services") and len(profile["services"]) > 5:
            strengths.append({
                "title": "Comprehensive Service Offering",
                "description": f"{len(profile['services'])} services show business breadth.",
                "impact": "medium",
                "evidence": f"{len(profile['services'])} services listed"
            })

        if profile.get("locations") and len(profile["locations"]) > 1:
            strengths.append({
                "title": "Multi-Location Presence",
                "description": f"{len(profile['locations'])} locations indicate geographic reach.",
                "impact": "medium",
                "evidence": f"{len(profile['locations'])} locations"
            })

        if profile.get("entities") and len(profile["entities"]) > 5:
            strengths.append({
                "title": "Strong Entity Coverage",
                "description": f"{len(profile['entities'])} entities help AI models understand context.",
                "impact": "medium",
                "evidence": f"{len(profile['entities'])} entities"
            })

        # Weaknesses
        if not profile.get("unique_selling_points") or len(profile.get("unique_selling_points", [])) < 2:
            weaknesses.append({
                "title": "Weak Value Proposition",
                "description": "Missing clear USPs - AI models need differentiation signals.",
                "impact": "high",
                "evidence": f"Only {len(profile.get('unique_selling_points', []))} USPs"
            })

        if not profile.get("services") or len(profile.get("services", [])) < 3:
            weaknesses.append({
                "title": "Limited Service Definition",
                "description": "Few services defined - reduces AI understanding of offerings.",
                "impact": "medium",
                "evidence": f"Only {len(profile.get('services', []))} services"
            })

        if not profile.get("locations"):
            weaknesses.append({
                "title": "No Location Information",
                "description": "Missing location data hurts local search visibility.",
                "impact": "high",
                "evidence": "0 locations identified"
            })

        return strengths, weaknesses

    # ── Issues Analysis ───────────────────────────────────────────────────

    def _analyze_issues(self, issues: List[Dict]) -> List[Dict]:
        """Convert critical/high issues to weaknesses."""
        weaknesses = []

        critical_issues = [i for i in issues if i.get("severity") == "critical"]
        high_issues = [i for i in issues if i.get("severity") == "high"]

        for issue in critical_issues[:3]:
            weaknesses.append({
                "title": f"Critical: {issue.get('issue_type', 'Unknown').replace('_', ' ').title()}",
                "description": issue.get("recommendation", "Fix this critical issue"),
                "impact": "critical",
                "evidence": f"{len(issue.get('affected_pages', []))} pages affected"
            })

        for issue in high_issues[:3]:
            weaknesses.append({
                "title": f"High Priority: {issue.get('issue_type', 'Unknown').replace('_', ' ').title()}",
                "description": issue.get("recommendation", "Address this high-priority issue"),
                "impact": "high",
                "evidence": f"{len(issue.get('affected_pages', []))} pages affected"
            })

        return weaknesses

    # ── Scores Analysis ───────────────────────────────────────────────────

    def _analyze_scores(self, scores: Dict) -> Tuple[List[Dict], List[Dict]]:
        """Analyze scores for strengths and weaknesses."""
        strengths = []
        weaknesses = []

        seo_score = scores.get("seo_score", 0)
        aeo_score = scores.get("aeo_score", 0)
        ai_score = scores.get("ai_readiness_score", 0)
        geo_score = scores.get("geo_score", 0)

        # Strengths
        if seo_score > 85:
            strengths.append({
                "title": "Strong SEO Foundation",
                "description": f"SEO score of {seo_score} indicates solid technical optimization.",
                "impact": "high",
                "evidence": f"SEO score: {seo_score}/100"
            })

        if aeo_score > 85:
            strengths.append({
                "title": "Excellent Answer Engine Optimization",
                "description": f"AEO score of {aeo_score} shows strong AI-ready content.",
                "impact": "high",
                "evidence": f"AEO score: {aeo_score}/100"
            })

        if ai_score > 85:
            strengths.append({
                "title": "High AI Readiness",
                "description": f"AI readiness score of {ai_score} means AI models can easily cite your content.",
                "impact": "high",
                "evidence": f"AI score: {ai_score}/100"
            })

        if geo_score > 85:
            strengths.append({
                "title": "Strong Local SEO",
                "description": f"GEO score of {geo_score} indicates excellent local optimization.",
                "impact": "high",
                "evidence": f"GEO score: {geo_score}/100"
            })

        # Weaknesses
        if seo_score < 60:
            weaknesses.append({
                "title": "Weak SEO Performance",
                "description": f"SEO score of {seo_score} indicates technical SEO issues.",
                "impact": "high",
                "evidence": f"SEO score: {seo_score}/100"
            })

        if aeo_score < 60:
            weaknesses.append({
                "title": "Poor Answer Engine Optimization",
                "description": f"AEO score of {aeo_score} means content isn't optimized for AI.",
                "impact": "high",
                "evidence": f"AEO score: {aeo_score}/100"
            })

        if ai_score < 60:
            weaknesses.append({
                "title": "Low AI Readiness",
                "description": f"AI readiness score of {ai_score} - AI models struggle to cite your content.",
                "impact": "high",
                "evidence": f"AI score: {ai_score}/100"
            })

        if geo_score < 60:
            weaknesses.append({
                "title": "Weak Local SEO",
                "description": f"GEO score of {geo_score} indicates local optimization gaps.",
                "impact": "high",
                "evidence": f"GEO score: {geo_score}/100"
            })

        return strengths, weaknesses

    # ── Utility Methods ───────────────────────────────────────────────────

    def _deduplicate_and_sort(self, items: List[Dict]) -> List[Dict]:
        """Remove duplicates and sort by impact."""
        seen = set()
        unique = []

        for item in items:
            key = item.get("title", "")
            if key not in seen:
                seen.add(key)
                unique.append(item)

        # Sort by impact
        impact_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        unique.sort(key=lambda x: impact_order.get(x.get("impact", "low"), 4))

        return unique
