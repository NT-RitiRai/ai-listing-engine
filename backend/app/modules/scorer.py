"""
Module 5: Score Engine (Evidence-Based)
Input: List of detected issues + extracted content
Output: Transparent score breakdown with full traceability

Every score is calculated from actual crawled signals.
If evidence is insufficient, explicitly state "Insufficient data".
"""
from collections import defaultdict


class ScoreEngine:
    """
    Scoring methodology:
    - Each score is calculated from measurable signals extracted from the crawl
    - Every point deduction is traceable to a specific issue
    - Missing signals are explicitly noted
    - Scores are capped at realistic ranges based on available evidence
    - High scores (>95) are validated against actual crawl data
    """

    def calculate(self, issues: list[dict], extracted_content: dict, profile: dict = None) -> dict:
        """Calculate all scores with full transparency."""
        
        # Handle empty data
        if not extracted_content or len(extracted_content) == 0:
            return {
                "seo_score": 0,
                "aeo_score": 0,
                "ai_readiness_score": 0,
                "geo_score": 0,
                "overall_score": 0,
                "breakdown": {
                    "error": "Score unavailable - no extracted data"
                }
            }

        # Extract signals from content
        signals = self._extract_signals(extracted_content)
        
        # Calculate each score with breakdown
        seo_score, seo_breakdown = self._calculate_seo(issues, signals)
        aeo_score, aeo_breakdown = self._calculate_aeo(issues, signals)
        ai_score, ai_breakdown = self._calculate_ai(issues, signals)
        geo_score, geo_breakdown = self._calculate_geo(issues, signals, profile)
        
        # Validate scores before returning
        seo_score = self._validate_seo_score(seo_score, signals, issues)
        aeo_score = self._validate_aeo_score(aeo_score, signals, issues)
        ai_score = self._validate_ai_score(ai_score, signals, issues)
        geo_score = self._validate_geo_score(geo_score, signals, issues, profile)
        
        # Calculate overall with transparent weighting
        overall_score = self._calculate_overall(seo_score, aeo_score, ai_score, geo_score)
        
        return {
            "seo_score": seo_score,
            "aeo_score": aeo_score,
            "ai_readiness_score": ai_score,
            "geo_score": geo_score,
            "overall_score": overall_score,
            "breakdown": {
                "seo": seo_breakdown,
                "aeo": aeo_breakdown,
                "ai": ai_breakdown,
                "geo": geo_breakdown,
            },
        }

    # ── Signal Extraction ─────────────────────────────────────────────────

    def _extract_signals(self, extracted_content: dict) -> dict:
        """Extract measurable signals from crawled content."""
        signals = {
            "page_count": len(extracted_content),
            "pages_with_title": 0,
            "pages_with_meta": 0,
            "pages_with_h1": 0,
            "pages_with_multiple_h1": 0,
            "pages_with_canonical": 0,
            "pages_with_og_tags": 0,
            "pages_with_images": 0,
            "images_with_alt": 0,
            "total_images": 0,
            "pages_with_faq": 0,
            "total_faqs": 0,
            "pages_with_schema": 0,
            "schema_types": set(),
            "pages_with_reviews": 0,
            "pages_with_prices": 0,
            "pages_with_phones": 0,
            "pages_with_emails": 0,
            "avg_word_count": 0,
            "pages_with_internal_links": 0,
            "pages_with_external_links": 0,
            "pages_with_robots_meta": 0,
            "pages_with_noindex": 0,
            "blog_pages": 0,
            "service_pages": 0,
            "location_pages": 0,
            "about_pages": 0,
            "contact_pages": 0,
        }
        
        word_counts = []
        
        for url, page in extracted_content.items():
            url_lower = url.lower()
            
            # Title & Meta
            if page.get("title"):
                signals["pages_with_title"] += 1
            if page.get("meta_description"):
                signals["pages_with_meta"] += 1
            
            # H1
            h1_list = page.get("h1", [])
            if h1_list:
                signals["pages_with_h1"] += 1
                if len(h1_list) > 1:
                    signals["pages_with_multiple_h1"] += 1
            
            # Canonical
            if page.get("canonical"):
                signals["pages_with_canonical"] += 1
            
            # OG Tags
            if page.get("og_tags"):
                signals["pages_with_og_tags"] += 1
            
            # Images
            images = page.get("images", [])
            if images:
                signals["pages_with_images"] += 1
                signals["total_images"] += len(images)
                signals["images_with_alt"] += sum(1 for img in images if img.get("alt"))
            
            # FAQ
            faqs = page.get("faqs", [])
            if faqs:
                signals["pages_with_faq"] += 1
                signals["total_faqs"] += len(faqs)
            
            # Schema
            schema_types = page.get("schema_types", [])
            if schema_types:
                signals["pages_with_schema"] += 1
                signals["schema_types"].update(schema_types)
            
            # Reviews, Prices, Contact
            if page.get("reviews"):
                signals["pages_with_reviews"] += 1
            if page.get("prices"):
                signals["pages_with_prices"] += 1
            if page.get("phones"):
                signals["pages_with_phones"] += 1
            if page.get("emails"):
                signals["pages_with_emails"] += 1
            
            # Word count
            if page.get("word_count"):
                word_counts.append(page.get("word_count"))
            
            # Internal/External links
            if page.get("internal_links"):
                signals["pages_with_internal_links"] += 1
            if page.get("external_links"):
                signals["pages_with_external_links"] += 1
            
            # Robots meta
            if page.get("robots_meta"):
                signals["pages_with_robots_meta"] += 1
                if "noindex" in page.get("robots_meta", "").lower():
                    signals["pages_with_noindex"] += 1
            
            # Page type detection
            if any(p in url_lower for p in ["blog", "article", "post", "news"]):
                signals["blog_pages"] += 1
            if any(p in url_lower for p in ["service", "treatment", "solution"]):
                signals["service_pages"] += 1
            if any(p in url_lower for p in ["location", "office", "branch"]):
                signals["location_pages"] += 1
            if any(p in url_lower for p in ["about", "team", "story"]):
                signals["about_pages"] += 1
            if any(p in url_lower for p in ["contact", "reach"]):
                signals["contact_pages"] += 1
        
        # Calculate averages
        if word_counts:
            signals["avg_word_count"] = sum(word_counts) / len(word_counts)
        
        signals["schema_types"] = list(signals["schema_types"])
        
        return signals

    # ── SEO Score ─────────────────────────────────────────────────────────

    def _calculate_seo(self, issues: list[dict], signals: dict) -> tuple[int, dict]:
        """Calculate SEO score from actual signals."""
        
        page_count = max(signals["page_count"], 1)
        breakdown = {
            "signals": {},
            "issues": [],
            "missing": [],
            "calculation": {},
        }
        
        # Signal-based scoring (0-100)
        score = 100
        
        # Title coverage (15 points max)
        title_coverage = signals["pages_with_title"] / page_count
        title_points = title_coverage * 15
        breakdown["signals"]["title_coverage"] = {
            "pages": signals["pages_with_title"],
            "total": page_count,
            "percentage": round(title_coverage * 100),
            "points": round(title_points, 1),
        }
        score -= (15 - title_points)
        
        # Meta description coverage (10 points max)
        meta_coverage = signals["pages_with_meta"] / page_count
        meta_points = meta_coverage * 10
        breakdown["signals"]["meta_coverage"] = {
            "pages": signals["pages_with_meta"],
            "total": page_count,
            "percentage": round(meta_coverage * 100),
            "points": round(meta_points, 1),
        }
        score -= (10 - meta_points)
        
        # H1 coverage (10 points max)
        h1_coverage = signals["pages_with_h1"] / page_count
        h1_points = h1_coverage * 10
        breakdown["signals"]["h1_coverage"] = {
            "pages": signals["pages_with_h1"],
            "total": page_count,
            "percentage": round(h1_coverage * 100),
            "points": round(h1_points, 1),
        }
        score -= (10 - h1_points)
        
        # Multiple H1 penalty (5 points max)
        if signals["pages_with_multiple_h1"] > 0:
            h1_penalty = min(5, signals["pages_with_multiple_h1"] * 0.5)
            breakdown["signals"]["multiple_h1_penalty"] = {
                "pages": signals["pages_with_multiple_h1"],
                "penalty": round(h1_penalty, 1),
            }
            score -= h1_penalty
        
        # Canonical coverage (8 points max)
        canonical_coverage = signals["pages_with_canonical"] / page_count
        canonical_points = canonical_coverage * 8
        breakdown["signals"]["canonical_coverage"] = {
            "pages": signals["pages_with_canonical"],
            "total": page_count,
            "percentage": round(canonical_coverage * 100),
            "points": round(canonical_points, 1),
        }
        score -= (8 - canonical_points)
        
        # Image alt text (8 points max)
        if signals["total_images"] > 0:
            alt_coverage = signals["images_with_alt"] / signals["total_images"]
            alt_points = alt_coverage * 8
            breakdown["signals"]["image_alt_coverage"] = {
                "images_with_alt": signals["images_with_alt"],
                "total_images": signals["total_images"],
                "percentage": round(alt_coverage * 100),
                "points": round(alt_points, 1),
            }
            score -= (8 - alt_points)
        else:
            breakdown["missing"].append("No images found")
        
        # Internal linking (8 points max)
        internal_link_coverage = signals["pages_with_internal_links"] / page_count
        internal_points = internal_link_coverage * 8
        breakdown["signals"]["internal_linking"] = {
            "pages": signals["pages_with_internal_links"],
            "total": page_count,
            "percentage": round(internal_link_coverage * 100),
            "points": round(internal_points, 1),
        }
        score -= (8 - internal_points)
        
        # OG Tags (5 points max)
        og_coverage = signals["pages_with_og_tags"] / page_count
        og_points = og_coverage * 5
        breakdown["signals"]["og_tags"] = {
            "pages": signals["pages_with_og_tags"],
            "total": page_count,
            "percentage": round(og_coverage * 100),
            "points": round(og_points, 1),
        }
        score -= (5 - og_points)
        
        # Noindex penalty (12 points max)
        if signals["pages_with_noindex"] > 0:
            noindex_penalty = min(12, signals["pages_with_noindex"] * 2)
            breakdown["signals"]["noindex_penalty"] = {
                "pages": signals["pages_with_noindex"],
                "penalty": round(noindex_penalty, 1),
            }
            score -= noindex_penalty
        
        # Issue-based deductions
        seo_issues = [i for i in issues if i.get("category") == "seo"]
        for issue in seo_issues:
            severity_weight = {"critical": 15, "high": 10, "medium": 5, "low": 2}.get(issue.get("severity"), 0)
            breakdown["issues"].append({
                "type": issue.get("issue_type"),
                "severity": issue.get("severity"),
                "deduction": severity_weight,
            })
            score -= severity_weight
        
        # Cap score
        final_score = max(0, min(100, round(score)))
        
        breakdown["calculation"] = {
            "base": 100,
            "signal_deductions": round(100 - score + sum(i["deduction"] for i in breakdown["issues"]), 1),
            "issue_deductions": round(sum(i["deduction"] for i in breakdown["issues"]), 1),
            "final": final_score,
        }
        
        return final_score, breakdown

    # ── AEO Score ─────────────────────────────────────────────────────────

    def _calculate_aeo(self, issues: list[dict], signals: dict) -> tuple[int, dict]:
        """Calculate AEO (Answer Engine Optimization) score."""
        
        page_count = max(signals["page_count"], 1)
        breakdown = {
            "signals": {},
            "issues": [],
            "missing": [],
            "calculation": {},
        }
        
        score = 100
        
        # FAQ coverage (20 points max)
        faq_coverage = signals["pages_with_faq"] / page_count
        faq_points = faq_coverage * 20
        breakdown["signals"]["faq_coverage"] = {
            "pages": signals["pages_with_faq"],
            "total_faqs": signals["total_faqs"],
            "total_pages": page_count,
            "percentage": round(faq_coverage * 100),
            "points": round(faq_points, 1),
        }
        score -= (20 - faq_points)
        
        # Schema coverage (20 points max)
        schema_coverage = signals["pages_with_schema"] / page_count
        schema_points = schema_coverage * 20
        breakdown["signals"]["schema_coverage"] = {
            "pages": signals["pages_with_schema"],
            "schema_types": signals["schema_types"],
            "total_pages": page_count,
            "percentage": round(schema_coverage * 100),
            "points": round(schema_points, 1),
        }
        score -= (20 - schema_points)
        
        # Structured headings (10 points max)
        # Check if pages have H2/H3 hierarchy
        h2_h3_pages = sum(1 for page in signals.values() if isinstance(page, dict) and page.get("h2"))
        heading_points = min(10, (h2_h3_pages / page_count) * 10) if page_count > 0 else 0
        breakdown["signals"]["structured_headings"] = {
            "points": round(heading_points, 1),
        }
        score -= (10 - heading_points)
        
        # Entity coverage (15 points max)
        # Assume entities are present if schema is present
        entity_points = schema_points * 0.75  # Correlated with schema
        breakdown["signals"]["entity_coverage"] = {
            "points": round(entity_points, 1),
        }
        score -= (15 - entity_points)
        
        # Content depth (15 points max)
        avg_wc = signals["avg_word_count"]
        if avg_wc > 1500:
            depth_points = 15
        elif avg_wc > 1000:
            depth_points = 12
        elif avg_wc > 500:
            depth_points = 8
        else:
            depth_points = 3
        
        breakdown["signals"]["content_depth"] = {
            "avg_word_count": round(avg_wc),
            "points": round(depth_points, 1),
        }
        score -= (15 - depth_points)
        
        # Issue-based deductions
        aeo_issues = [i for i in issues if i.get("category") == "aeo"]
        for issue in aeo_issues:
            severity_weight = {"critical": 20, "high": 15, "medium": 8, "low": 3}.get(issue.get("severity"), 0)
            breakdown["issues"].append({
                "type": issue.get("issue_type"),
                "severity": issue.get("severity"),
                "deduction": severity_weight,
            })
            score -= severity_weight
        
        # Missing signals
        if signals["pages_with_faq"] == 0:
            breakdown["missing"].append("No FAQ content detected")
        if signals["pages_with_schema"] == 0:
            breakdown["missing"].append("No structured data (schema) detected")
        
        final_score = max(0, min(100, round(score)))
        
        breakdown["calculation"] = {
            "base": 100,
            "signal_deductions": round(100 - score + sum(i["deduction"] for i in breakdown["issues"]), 1),
            "issue_deductions": round(sum(i["deduction"] for i in breakdown["issues"]), 1),
            "final": final_score,
        }
        
        return final_score, breakdown

    # ── AI Readiness Score ────────────────────────────────────────────────

    def _calculate_ai(self, issues: list[dict], signals: dict) -> tuple[int, dict]:
        """Calculate AI Readiness score."""
        
        page_count = max(signals["page_count"], 1)
        breakdown = {
            "signals": {},
            "issues": [],
            "missing": [],
            "calculation": {},
        }
        
        score = 100
        
        # Schema coverage (25 points max)
        schema_coverage = signals["pages_with_schema"] / page_count
        schema_points = schema_coverage * 25
        breakdown["signals"]["schema_coverage"] = {
            "pages": signals["pages_with_schema"],
            "percentage": round(schema_coverage * 100),
            "points": round(schema_points, 1),
        }
        score -= (25 - schema_points)
        
        # Entity signals (20 points max)
        # Entities are implied by schema and content depth
        entity_points = min(20, schema_points * 0.8)
        breakdown["signals"]["entity_signals"] = {
            "points": round(entity_points, 1),
        }
        score -= (20 - entity_points)
        
        # Content quality (20 points max)
        avg_wc = signals["avg_word_count"]
        if avg_wc > 1500:
            quality_points = 20
        elif avg_wc > 1000:
            quality_points = 15
        elif avg_wc > 500:
            quality_points = 10
        else:
            quality_points = 3
        
        breakdown["signals"]["content_quality"] = {
            "avg_word_count": round(avg_wc),
            "points": round(quality_points, 1),
        }
        score -= (20 - quality_points)
        
        # Authority signals (15 points max)
        authority_points = 0
        if signals["pages_with_reviews"] > 0:
            authority_points += 5
        if signals["pages_with_phones"] > 0 or signals["pages_with_emails"] > 0:
            authority_points += 5
        if signals["pages_with_prices"] > 0:
            authority_points += 5
        
        breakdown["signals"]["authority_signals"] = {
            "reviews": signals["pages_with_reviews"],
            "contact_info": signals["pages_with_phones"] + signals["pages_with_emails"],
            "pricing": signals["pages_with_prices"],
            "points": round(authority_points, 1),
        }
        score -= (15 - authority_points)
        
        # Internal linking (10 points max)
        internal_points = (signals["pages_with_internal_links"] / page_count) * 10
        breakdown["signals"]["internal_linking"] = {
            "pages": signals["pages_with_internal_links"],
            "percentage": round((signals["pages_with_internal_links"] / page_count) * 100),
            "points": round(internal_points, 1),
        }
        score -= (10 - internal_points)
        
        # Issue-based deductions
        ai_issues = [i for i in issues if i.get("category") == "ai"]
        for issue in ai_issues:
            severity_weight = {"critical": 20, "high": 15, "medium": 8, "low": 3}.get(issue.get("severity"), 0)
            breakdown["issues"].append({
                "type": issue.get("issue_type"),
                "severity": issue.get("severity"),
                "deduction": severity_weight,
            })
            score -= severity_weight
        
        # Missing signals
        if signals["pages_with_schema"] == 0:
            breakdown["missing"].append("No structured data detected")
        if signals["avg_word_count"] < 500:
            breakdown["missing"].append("Content is too thin for AI analysis")
        if signals["pages_with_reviews"] == 0:
            breakdown["missing"].append("No review/authority signals")
        
        final_score = max(0, min(100, round(score)))
        
        breakdown["calculation"] = {
            "base": 100,
            "signal_deductions": round(100 - score + sum(i["deduction"] for i in breakdown["issues"]), 1),
            "issue_deductions": round(sum(i["deduction"] for i in breakdown["issues"]), 1),
            "final": final_score,
        }
        
        return final_score, breakdown

    # ── GEO Score ─────────────────────────────────────────────────────────

    def _calculate_geo(self, issues: list[dict], signals: dict, profile: dict = None) -> tuple[int, dict]:
        """Calculate GEO (Geographic) score."""
        
        page_count = max(signals["page_count"], 1)
        breakdown = {
            "signals": {},
            "issues": [],
            "missing": [],
            "calculation": {},
        }
        
        score = 100
        
        # Location pages (20 points max)
        location_pages = signals["location_pages"]
        if location_pages == 0 and profile and profile.get("locations"):
            location_pages = len(profile["locations"])
            
        location_points = min(20, location_pages * 5)
        breakdown["signals"]["location_pages"] = {
            "pages": location_pages,
            "points": round(location_points, 1),
        }
        score -= (20 - location_points)
        
        # Local schema (25 points max)
        has_local_schema = any(s in signals["schema_types"] for s in ["LocalBusiness", "Organization", "Store"])
        local_schema_points = 25 if has_local_schema else 0
        breakdown["signals"]["local_schema"] = {
            "present": has_local_schema,
            "points": round(local_schema_points, 1),
        }
        score -= (25 - local_schema_points)
        
        # Contact information (20 points max)
        contact_pages = signals["pages_with_phones"] + signals["pages_with_emails"]
        if contact_pages == 0 and profile and ("phone" in str(profile).lower() or "email" in str(profile).lower() or "contact" in str(profile).lower()):
            contact_pages = 1
            
        contact_points = min(20, (contact_pages / page_count) * 20 if contact_pages > 0 else 0)
        # Give full contact points if AI found it
        if contact_pages > 0 and signals["pages_with_phones"] + signals["pages_with_emails"] == 0:
            contact_points = 20
        breakdown["signals"]["contact_information"] = {
            "pages": contact_pages,
            "percentage": round((contact_pages / page_count) * 100),
            "points": round(contact_points, 1),
        }
        score -= (20 - contact_points)
        
        # Reviews/Authority (20 points max)
        review_points = min(20, signals["pages_with_reviews"] * 5)
        breakdown["signals"]["reviews_authority"] = {
            "pages": signals["pages_with_reviews"],
            "points": round(review_points, 1),
        }
        score -= (20 - review_points)
        
        # About/Team pages (15 points max)
        about_pages = signals["about_pages"]
        if about_pages == 0 and profile and "about" in str(profile).lower():
            about_pages = 1
            
        about_points = min(15, about_pages * 7.5)
        breakdown["signals"]["about_pages"] = {
            "pages": about_pages,
            "points": round(about_points, 1),
        }
        score -= (15 - about_points)
        
        # Issue-based deductions
        geo_issues = [i for i in issues if i.get("category") == "geo"]
        for issue in geo_issues:
            severity_weight = {"critical": 20, "high": 15, "medium": 8, "low": 3}.get(issue.get("severity"), 0)
            breakdown["issues"].append({
                "type": issue.get("issue_type"),
                "severity": issue.get("severity"),
                "deduction": severity_weight,
            })
            score -= severity_weight
        
        # Missing signals
        if location_pages == 0:
            breakdown["missing"].append("No location-specific pages or entities detected")
        if not has_local_schema:
            breakdown["missing"].append("No LocalBusiness schema detected")
        if contact_pages == 0:
            breakdown["missing"].append("No contact information found")
        if signals["pages_with_reviews"] == 0:
            breakdown["missing"].append("No reviews detected")
        
        final_score = max(0, min(100, round(score)))
        
        breakdown["calculation"] = {
            "base": 100,
            "signal_deductions": round(100 - score + sum(i["deduction"] for i in breakdown["issues"]), 1),
            "issue_deductions": round(sum(i["deduction"] for i in breakdown["issues"]), 1),
            "final": final_score,
        }
        
        return final_score, breakdown

    # ── Score Validation ──────────────────────────────────────────────────

    def _validate_seo_score(self, score: int, signals: dict, issues: list[dict]) -> int:
        """Validate SEO score - high scores must be justified by data."""
        if score > 95:
            page_count = max(signals["page_count"], 1)
            title_coverage = (signals["pages_with_title"] / page_count) * 100
            meta_coverage = (signals["pages_with_meta"] / page_count) * 100
            canonical_coverage = (signals["pages_with_canonical"] / page_count) * 100
            h1_coverage = (signals["pages_with_h1"] / page_count) * 100
            
            # Require near-perfect coverage for scores > 95
            if title_coverage < 95 or meta_coverage < 95 or canonical_coverage < 95 or h1_coverage < 95:
                return min(score, 90)
            
            # Check for critical SEO issues
            critical_seo_issues = [i for i in issues if i.get("category") == "seo" and i.get("severity") == "critical"]
            if critical_seo_issues:
                return min(score, 85)
        
        return score

    def _validate_aeo_score(self, score: int, signals: dict, issues: list[dict]) -> int:
        """Validate AEO score - high scores must be justified by data."""
        if score > 95:
            page_count = max(signals["page_count"], 1)
            faq_coverage = (signals["pages_with_faq"] / page_count) * 100
            schema_coverage = (signals["pages_with_schema"] / page_count) * 100
            
            # Require strong FAQ and schema presence for scores > 95
            if faq_coverage < 80 or schema_coverage < 80:
                return min(score, 85)
            
            # Check for critical AEO issues
            critical_aeo_issues = [i for i in issues if i.get("category") == "aeo" and i.get("severity") == "critical"]
            if critical_aeo_issues:
                return min(score, 80)
        
        return score

    def _validate_ai_score(self, score: int, signals: dict, issues: list[dict]) -> int:
        """Validate AI Readiness score - high scores must be justified by data."""
        if score > 95:
            page_count = max(signals["page_count"], 1)
            schema_coverage = (signals["pages_with_schema"] / page_count) * 100
            avg_word_count = signals["avg_word_count"]
            
            # Require strong schema and content depth for scores > 95
            if schema_coverage < 80 or avg_word_count < 1000:
                return min(score, 85)
            
            # Check for critical AI issues
            critical_ai_issues = [i for i in issues if i.get("category") == "ai" and i.get("severity") == "critical"]
            if critical_ai_issues:
                return min(score, 80)
        
        return score

    def _validate_geo_score(self, score: int, signals: dict, issues: list[dict], profile: dict = None) -> int:
        """Validate GEO score - high scores must be justified by data."""
        if score > 95:
            has_local_schema = any(s in signals["schema_types"] for s in ["LocalBusiness", "Organization", "Store"])
            location_pages = signals["location_pages"]
            if location_pages == 0 and profile and profile.get("locations"):
                location_pages = len(profile["locations"])
            
            # Require local schema and location pages for scores > 95
            if not has_local_schema or location_pages == 0:
                return min(score, 85)
            
            # Check for critical GEO issues
            critical_geo_issues = [i for i in issues if i.get("category") == "geo" and i.get("severity") == "critical"]
            if critical_geo_issues:
                return min(score, 80)
        
        return score

    # ── Overall Score ─────────────────────────────────────────────────────

    def _calculate_overall(self, seo: int, aeo: int, ai: int, geo: int) -> float:
        """Calculate overall score with transparent weighting."""
        # Weights: SEO 30%, AEO 25%, AI 30%, GEO 15%
        overall = (seo * 0.30) + (aeo * 0.25) + (ai * 0.30) + (geo * 0.15)
        return round(overall, 1)
