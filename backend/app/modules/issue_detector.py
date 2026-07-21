"""
Module 4: Issue Detection Engine
Single source of truth: extracted_content from ContentExtractionEngine.
All issues are detected from actual crawled data with full traceability.
"""
from dataclasses import dataclass
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class DetectedIssue:
    category: str
    issue_type: str
    severity: str
    affected_pages: list[str]
    element: Optional[str]
    recommendation: str
    impact: str
    fix_difficulty: str

    def to_dict(self) -> dict:
        return self.__dict__


class IssueDetectionEngine:
    def detect(
        self,
        profile: dict,
        robots_txt: Optional[str],
        llms_txt: Optional[str],
        extracted_content: Optional[dict] = None,
    ) -> list[dict]:
        """
        Use extracted_content as the single source of truth.
        extracted_content keys: title, meta_description, h1, h2, h3,
          paragraphs, faqs, schema_types, json_ld, canonical, robots_meta,
          og_tags, images, internal_links, word_count, phones, emails, prices
        """
        dataset = extracted_content if extracted_content is not None else {}
        page_count = len(dataset)
        logger.info(f"[ISSUES] Using {page_count} pages from extracted_content")

        if page_count == 0:
            logger.warning("[ISSUES] No pages — skipping content-dependent checks")
            issues: list[DetectedIssue] = []
            issues.extend(self._check_ai_issues({}, profile, robots_txt, llms_txt))
            issues.extend(self._check_geo_issues({}, profile))
            return [i.to_dict() for i in issues]

        issues = []
        issues.extend(self._check_seo_issues(dataset))
        issues.extend(self._check_aeo_issues(dataset, profile))
        issues.extend(self._check_ai_issues(dataset, profile, robots_txt, llms_txt))
        issues.extend(self._check_geo_issues(dataset, profile))
        
        logger.info(f"[ISSUES] Detected {len(issues)} issues from {page_count} pages")
        for issue in issues:
            logger.debug(f"[ISSUES] {issue.category.upper()} - {issue.issue_type} ({issue.severity}): {len(issue.affected_pages)} pages")
        
        return [i.to_dict() for i in issues]

    # ── SEO Issues ────────────────────────────────────────────────────────

    def _check_seo_issues(self, pages: dict[str, dict]) -> list[DetectedIssue]:
        """Detect SEO issues from extracted_content."""
        issues = []
        page_count = len(pages)
        
        titles_seen: dict[str, list[str]] = {}
        missing_title, missing_meta, missing_h1, multiple_h1 = [], [], [], []
        short_title, long_title, noindex_pages, missing_canonical = [], [], [], []
        missing_og, images_missing_alt, missing_internal_links = [], [], []
        pages_with_external_links = 0

        for url, page in pages.items():
            title = page.get("title")
            description = page.get("meta_description")
            h1_list = page.get("h1", [])

            # Title checks
            if not title:
                missing_title.append(url)
            else:
                titles_seen.setdefault(title, []).append(url)
                if len(title) < 30:
                    short_title.append(url)
                elif len(title) > 65:
                    long_title.append(url)

            # Meta description checks
            if not description:
                missing_meta.append(url)
            elif len(description) < 120:
                short_title.append(url)  # Reuse for short meta
            elif len(description) > 160:
                long_title.append(url)  # Reuse for long meta

            # H1 checks
            if not h1_list:
                missing_h1.append(url)
            elif len(h1_list) > 1:
                multiple_h1.append(url)

            # Robots meta checks
            robots_meta = page.get("robots_meta") or ""
            if "noindex" in robots_meta.lower():
                noindex_pages.append(url)

            # Canonical checks
            if not page.get("canonical"):
                missing_canonical.append(url)

            # OG tags checks
            if not page.get("og_tags"):
                missing_og.append(url)

            # Image alt text checks
            for img in page.get("images", []):
                if not img.get("alt"):
                    images_missing_alt.append(url)
                    break

            # Internal linking checks
            if not page.get("internal_links"):
                missing_internal_links.append(url)
            
            # External linking checks
            if page.get("external_links"):
                pages_with_external_links += 1

        # Duplicate title detection
        dup_titles = [pl for pl in titles_seen.values() if len(pl) > 1]
        if dup_titles:
            affected = [u for group in dup_titles for u in group]
            issues.append(DetectedIssue(
                "seo", "duplicate_title", "high", affected[:10], None,
                "Clearly differentiate page identities so AI models can accurately route commercial queries to the right service.",
                "AI assistants cannot distinguish between your offerings, causing them to skip your business in comparison queries.",
                "easy"
            ))
            logger.info(f"[SEO] Duplicate titles: {len(affected)} pages")

        # Missing title
        if missing_title:
            coverage = ((page_count - len(missing_title)) / page_count) * 100
            issues.append(DetectedIssue(
                "seo", "missing_title", "critical", missing_title[:10], "<title>",
                "Define the exact business value and target entity in the page identity to restore AI indexing confidence.",
                "AI models lack primary context for this page, leading to a complete loss of visibility for associated products/services.",
                "easy"
            ))
            logger.info(f"[SEO] Missing titles: {len(missing_title)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Missing meta description
        if missing_meta:
            coverage = ((page_count - len(missing_meta)) / page_count) * 100
            issues.append(DetectedIssue(
                "seo", "missing_meta_description", "high", missing_meta[:10],
                "<meta name='description'>",
                "Provide clear, concise summaries of business value on every page to ensure AI models can accurately describe you to buyers.",
                "AI assistants could not confidently understand this page because descriptive metadata is missing. This reduces recommendation confidence for commercial searches.",
                "easy"
            ))
            logger.info(f"[SEO] Missing meta descriptions: {len(missing_meta)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Missing H1
        if missing_h1:
            coverage = ((page_count - len(missing_h1)) / page_count) * 100
            issues.append(DetectedIssue(
                "seo", "missing_h1", "high", missing_h1[:10], "<h1>",
                "Establish a clear topical hierarchy starting with a strong primary entity declaration.",
                "Without a primary structural heading, AI models fail to parse the core topic, discarding the page from high-intent answers.",
                "easy"
            ))
            logger.info(f"[SEO] Missing H1: {len(missing_h1)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Multiple H1
        if multiple_h1:
            issues.append(DetectedIssue(
                "seo", "multiple_h1", "medium", multiple_h1[:10], "<h1>",
                "Consolidate the primary page topic into a single, authoritative declaration.",
                "Conflicting structural signals confuse AI models about the primary subject, reducing your authority score for target entities.",
                "easy"
            ))
            logger.info(f"[SEO] Multiple H1s: {len(multiple_h1)} pages")

        # Short title
        if short_title:
            issues.append(DetectedIssue(
                "seo", "short_title", "medium", short_title[:10], "<title>",
                "Expand page context to capture specific buyer intents and niche recommendations.",
                "Insufficient context prevents AI from associating this page with long-tail, high-conversion commercial queries.",
                "easy"
            ))
            logger.info(f"[SEO] Short titles: {len(short_title)} pages")

        # Long title
        if long_title:
            issues.append(DetectedIssue(
                "seo", "long_title", "medium", long_title[:10], "<title>",
                "Refine the page identity to focus strictly on the primary business entity and intent.",
                "Overly verbose identities dilute the core entity focus, causing AI models to miscategorize the offering.",
                "easy"
            ))
            logger.info(f"[SEO] Long titles: {len(long_title)} pages")

        # Noindex pages
        if noindex_pages:
            issues.append(DetectedIssue(
                "seo", "noindex_pages", "critical", noindex_pages[:10],
                "robots meta",
                "Audit AI blocking rules and open commercial pages to AI indexers to recover lost visibility.",
                "Explicit directives are blocking AI agents from reading this page, resulting in zero visibility for this content.",
                "medium"
            ))
            logger.info(f"[SEO] Noindex pages: {len(noindex_pages)} pages")

        # Missing canonical
        if missing_canonical:
            coverage = ((page_count - len(missing_canonical)) / page_count) * 100
            issues.append(DetectedIssue(
                "seo", "missing_canonical", "medium", missing_canonical[:10],
                "<link rel='canonical'>",
                "Establish clear canonical paths to consolidate AI trust signals to your primary pages.",
                "AI models penalize businesses with ambiguous content structures, reducing trust and citation frequency.",
                "easy"
            ))
            logger.info(f"[SEO] Missing canonical: {len(missing_canonical)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Missing OG tags
        if missing_og:
            coverage = ((page_count - len(missing_og)) / page_count) * 100
            issues.append(DetectedIssue(
                "seo", "missing_opengraph", "low", missing_og[:10],
                "<meta property='og:'>",
                "Implement OpenGraph data to ensure AI systems parse rich media and brand context correctly.",
                "Lack of structured graph data reduces your brand\'s footprint across ecosystem integrations used by AI.",
                "easy"
            ))
            logger.info(f"[SEO] Missing OG tags: {len(missing_og)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Images missing alt text
        if images_missing_alt:
            issues.append(DetectedIssue(
                "seo", "images_missing_alt", "medium", images_missing_alt[:10],
                "<img alt>",
                "Translate all visual business assets into text descriptions to maximize AI comprehension.",
                "AI models are blind to visual assets without descriptive text, losing valuable context for product and brand association.",
                "easy"
            ))
            logger.info(f"[SEO] Images missing alt text: {len(images_missing_alt)} pages")

        # Missing internal links
        if missing_internal_links:
            coverage = ((page_count - len(missing_internal_links)) / page_count) * 100
            issues.append(DetectedIssue(
                "seo", "missing_internal_links", "medium", missing_internal_links[:10],
                "<a href>",
                "Build a strong semantic web between your offerings to help AI understand your complete business ecosystem.",
                "Isolated pages prevent AI models from understanding the relationship between your services, reducing overall domain authority.",
                "medium"
            ))
            logger.info(f"[SEO] Missing internal links: {len(missing_internal_links)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Low external linking
        if pages_with_external_links < page_count * 0.3:
            issues.append(DetectedIssue(
                "seo", "low_external_links", "low", [],
                "<a href>",
                "Connect your content to authoritative industry entities to validate your expertise to AI models.",
                "Lack of outbound citations isolates your business from the broader industry knowledge graph, lowering trust scores.",
                "medium"
            ))
            logger.info(f"[SEO] Low external linking: {pages_with_external_links}/{page_count} pages")

        return issues

    # ── AEO Issues ────────────────────────────────────────────────────────

    def _check_aeo_issues(self, pages: dict[str, dict], profile: dict) -> list[DetectedIssue]:
        """Detect AEO (Answer Engine Optimization) issues from extracted_content."""
        issues = []
        page_count = len(pages)
        
        pages_without_faq = []
        pages_without_schema = []
        pages_without_review_schema = []
        pages_without_breadcrumb = []
        pages_without_h2_h3 = []
        total_faqs = 0

        for url, page in pages.items():
            # Schema types stored as list of strings
            schema_types = page.get("schema_types", []) or []

            # FAQ checks
            faqs = page.get("faqs", [])
            if not faqs:
                pages_without_faq.append(url)
            else:
                total_faqs += len(faqs)

            # Schema checks
            if not schema_types:
                pages_without_schema.append(url)
            
            # Review schema checks
            if not any("Review" in t or "AggregateRating" in t for t in schema_types if t):
                pages_without_review_schema.append(url)
            
            # Breadcrumb schema checks
            if not any("Breadcrumb" in t for t in schema_types if t):
                pages_without_breadcrumb.append(url)

            # H2/H3 hierarchy checks
            h2_list = page.get("h2", [])
            h3_list = page.get("h3", [])
            if not h2_list and not h3_list:
                pages_without_h2_h3.append(url)

        # Missing FAQ schema
        if pages_without_faq:
            coverage = ((page_count - len(pages_without_faq)) / page_count) * 100
            issues.append(DetectedIssue(
                "aeo", "missing_faq_schema", "high", pages_without_faq[:10],
                "JSON-LD FAQPage",
                "Deploy conversational schema to feed direct answers into AI memory, positioning your business as the default solution.",
                "Without structured Q&A data, AI assistants struggle to extract direct answers, costing you voice and conversational search visibility.",
                "medium"
            ))
            logger.info(f"[AEO] Missing FAQ schema: {len(pages_without_faq)}/{page_count} pages ({coverage:.1f}% coverage, {total_faqs} FAQs found)")

        # Missing structured data
        if pages_without_schema:
            coverage = ((page_count - len(pages_without_schema)) / page_count) * 100
            issues.append(DetectedIssue(
                "aeo", "missing_structured_data", "critical",
                pages_without_schema[:10], "JSON-LD",
                "Implement enterprise-grade structured data to explicitly define your products, services, and corporate entities for AI.",
                "AI models cannot reliably identify your business entities, making it less likely that your website will be cited in AI-generated answers.",
                "medium"
            ))
            logger.info(f"[AEO] Missing structured data: {len(pages_without_schema)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Missing review schema
        if pages_without_review_schema:
            coverage = ((page_count - len(pages_without_review_schema)) / page_count) * 100
            issues.append(DetectedIssue(
                "aeo", "missing_review_schema", "medium",
                pages_without_review_schema[:10], "JSON-LD Review",
                "Inject verifiable trust signals directly into the code to increase AI recommendation confidence.",
                "Missing reputation data prevents AI from verifying your credibility, causing it to recommend trusted competitors instead.",
                "medium"
            ))
            logger.info(f"[AEO] Missing review schema: {len(pages_without_review_schema)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Missing breadcrumb schema
        if pages_without_breadcrumb:
            coverage = ((page_count - len(pages_without_breadcrumb)) / page_count) * 100
            issues.append(DetectedIssue(
                "aeo", "missing_breadcrumb_schema", "low",
                pages_without_breadcrumb[:10], "JSON-LD BreadcrumbList",
                "Map your business architecture explicitly so AI can correctly categorize your offerings.",
                "Poor structural context makes it difficult for AI to map your service hierarchy, losing visibility for category-level queries.",
                "easy"
            ))
            logger.info(f"[AEO] Missing breadcrumb schema: {len(pages_without_breadcrumb)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Missing H2/H3 hierarchy
        if pages_without_h2_h3:
            coverage = ((page_count - len(pages_without_h2_h3)) / page_count) * 100
            issues.append(DetectedIssue(
                "aeo", "missing_heading_hierarchy", "medium",
                pages_without_h2_h3[:10], "<h2>, <h3>",
                "Organize business information with strict hierarchical logic to ensure flawless AI parsing.",
                "Flat content structures force AI to guess your service details, significantly reducing extraction accuracy for complex queries.",
                "easy"
            ))
            logger.info(f"[AEO] Missing heading hierarchy: {len(pages_without_h2_h3)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Weak entity coverage
        if not profile.get("entities") or len(profile.get("entities", [])) < 3:
            issues.append(DetectedIssue(
                "aeo", "weak_entity_coverage", "high", [],
                "Entity mentions",
                "Aggressively integrate recognized industry entities, brands, and terminology to anchor your business in the AI knowledge graph.",
                "Your content lacks recognizable industry entities, making AI perceive your business as an outlier rather than a market leader.",
                "hard"
            ))
            logger.info(f"[AEO] Weak entity coverage: {len(profile.get('entities', []))} entities detected")

        return issues

    # ── AI Readiness Issues ───────────────────────────────────────────────

    def _check_ai_issues(self, pages: dict[str, dict], profile: dict,
                         robots_txt: Optional[str], llms_txt: Optional[str]) -> list[DetectedIssue]:
        """Detect AI readiness issues from extracted_content."""
        issues = []
        page_count = len(pages)
        
        thin_pages = []
        pages_without_schema = []
        avg_word_count = 0
        total_words = 0
        pages_with_content = 0

        for url, page in pages.items():
            word_count = page.get("word_count", 0) or 0
            h2_list = page.get("h2", [])
            schema_types = page.get("schema_types", []) or []

            # Thin content check
            if word_count < 300 and len(h2_list) < 2:
                thin_pages.append(url)
            
            # Schema check
            if not schema_types:
                pages_without_schema.append(url)

            # Calculate average word count
            if word_count > 0:
                total_words += word_count
                pages_with_content += 1

        if pages_with_content > 0:
            avg_word_count = total_words / pages_with_content

        # Missing llms.txt
        if not llms_txt:
            issues.append(DetectedIssue(
                "ai", "missing_llms_txt", "high", ["/llms.txt"],
                "llms.txt",
                "Deploy an llms.txt file to spoon-feed high-priority business context and citations directly to AI models.",
                "Without an AI-specific entry point, modern LLMs default to generic crawling, often missing your most critical commercial data.",
                "easy"
            ))
            logger.info("[AI] Missing llms.txt")

        # Missing AI crawler rules
        if robots_txt:
            has_ai_rules = any(bot in robots_txt for bot in ["GPTBot", "anthropic-ai", "Google-Extended", "CCBot"])
            if not has_ai_rules:
                issues.append(DetectedIssue(
                    "ai", "missing_ai_crawler_rules", "medium", ["/robots.txt"],
                    "robots.txt",
                    "Update access protocols to explicitly authorize and guide next-generation AI agents to your commercial content.",
                    "Failing to explicitly welcome AI agents signals poor AI-readiness, potentially deprioritizing your brand in model training.",
                    "easy"
                ))
                logger.info("[AI] Missing AI crawler rules in robots.txt")

        # Thin content
        if thin_pages:
            coverage = ((page_count - len(thin_pages)) / page_count) * 100
            issues.append(DetectedIssue(
                "ai", "thin_content", "high", thin_pages[:10], "Page content",
                "Transform thin service pages into comprehensive, authoritative guides that dominate AI reference selection.",
                "Superficial content is instantly discarded by AI models seeking deep, authoritative answers for users.",
                "hard"
            ))
            logger.info(f"[AI] Thin content: {len(thin_pages)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Missing schema for AI
        if pages_without_schema:
            coverage = ((page_count - len(pages_without_schema)) / page_count) * 100
            issues.append(DetectedIssue(
                "ai", "missing_schema_for_ai", "high", pages_without_schema[:10],
                "JSON-LD",
                "Wrap all core business assets in strict JSON-LD to guarantee 100% accurate AI extraction.",
                "Without machine-readable context, AI models treat your business as raw text, ignoring key commercial attributes.",
                "medium"
            ))
            logger.info(f"[AI] Missing schema: {len(pages_without_schema)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Low average word count
        if avg_word_count < 500:
            issues.append(DetectedIssue(
                "ai", "low_content_depth", "medium", [],
                "Page content",
                "Deepen the semantic richness of your content to capture high-intent, long-form AI queries.",
                "Insufficient topical depth prevents AI from associating your business with complex, high-value buyer queries.",
                "hard"
            ))
            logger.info(f"[AI] Low content depth: {avg_word_count:.0f} avg words")

        # Missing USP content
        if not profile.get("unique_selling_points") or len(profile.get("unique_selling_points", [])) < 2:
            issues.append(DetectedIssue(
                "ai", "missing_usp_content", "medium", [],
                "USP content",
                "Hardcode your unique selling propositions into the text so AI models can explicitly argue why you are the best choice.",
                "Because your unique value is not explicitly stated, AI defaults to recommending generic competitors over you.",
                "medium"
            ))
            logger.info(f"[AI] Missing USP content: {len(profile.get('unique_selling_points', []))} USPs detected")

        return issues

    # ── GEO Issues ────────────────────────────────────────────────────────

    def _check_geo_issues(self, pages: dict[str, dict], profile: dict) -> list[DetectedIssue]:
        """Detect GEO (Geographic) issues from extracted_content."""
        issues = []
        page_count = len(pages)
        
        pages_without_local_schema = []
        pages_without_contact = []
        location_pages_count = 0

        for url, page in pages.items():
            schema_types = page.get("schema_types", []) or []
            phones = page.get("phones", [])
            emails = page.get("emails", [])

            # Local schema check
            if not any(t in ["LocalBusiness", "Organization", "Store"] for t in schema_types if t):
                pages_without_local_schema.append(url)

            # Contact info check
            if not phones and not emails:
                pages_without_contact.append(url)

            # Location page detection
            url_lower = url.lower()
            if any(p in url_lower for p in ["location", "office", "branch", "store"]):
                location_pages_count += 1

        # Missing LocalBusiness schema
        if pages_without_local_schema and profile.get("locations"):
            coverage = ((page_count - len(pages_without_local_schema)) / page_count) * 100
            issues.append(DetectedIssue(
                "geo", "missing_local_business_schema", "high",
                pages_without_local_schema[:10], "JSON-LD LocalBusiness",
                "Anchor your physical operations in the AI graph using strict local entity markup to dominate regional search.",
                "Without strict geographic bounding, AI models exclude your business from high-converting \'near me\' and local service recommendations.",
                "medium"
            ))
            logger.info(f"[GEO] Missing LocalBusiness schema: {len(pages_without_local_schema)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Missing contact information
        if pages_without_contact:
            coverage = ((page_count - len(pages_without_contact)) / page_count) * 100
            issues.append(DetectedIssue(
                "geo", "missing_contact_info", "medium", pages_without_contact[:10],
                "Phone/Email",
                "Ensure frictionless conversion paths by exposing direct contact entities to AI decision engines.",
                "Missing contact data prevents AI from fulfilling transactional intents, causing it to route ready-to-buy customers elsewhere.",
                "easy"
            ))
            logger.info(f"[GEO] Missing contact info: {len(pages_without_contact)}/{page_count} pages ({coverage:.1f}% coverage)")

        # Missing location signals
        if not profile.get("locations") or len(profile.get("locations", [])) == 0:
            issues.append(DetectedIssue(
                "geo", "missing_location_signals", "medium", [],
                "Location content",
                "Saturate your digital footprint with consistent geographic entities to secure local market dominance in AI answers.",
                "Geographic ambiguity causes AI models to pass over your business for localized commercial queries, directly losing regional revenue.",
                "medium"
            ))
            logger.info("[GEO] Missing location signals in profile")

        # Low location page count
        if profile.get("locations") and location_pages_count == 0:
            issues.append(DetectedIssue(
                "geo", "missing_location_pages", "high", [],
                "Location pages",
                "Deploy highly-targeted regional pages to capture hyper-local AI commercial queries across your entire service area.",
                "Failing to dedicate pages to specific markets blinds AI to your operational footprint, handing those territories to competitors.",
                "hard"
            ))
            logger.info("[GEO] Missing location pages")

        return issues
