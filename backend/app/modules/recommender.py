"""
Module 6: Recommendation Engine
Input: Detected issues
Output: Prioritized recommendations derived ONLY from detected issues
Never generates generic recommendations.
"""


PRIORITY_MAP = {"critical": 1, "high": 2, "medium": 3, "low": 4}
GAIN_MAP = {
    "missing_title": "High CTR improvement expected",
    "duplicate_title": "Improved page differentiation in SERPs",
    "missing_meta_description": "Better CTR from search results",
    "missing_h1": "Improved on-page SEO signal",
    "missing_structured_data": "Eligibility for rich results and AI citations",
    "missing_faq_schema": "Featured snippet eligibility",
    "missing_llms_txt": "Better AI crawler indexing",
    "missing_local_business_schema": "Improved local search visibility",
    "thin_content": "Higher AI citation probability",
    "noindex_pages": "Pages become indexable",
    "missing_canonical": "Duplicate content resolution",
    "weak_entity_coverage": "Improved knowledge graph presence",
}


class RecommendationEngine:
    def generate(self, issues: list[dict]) -> list[dict]:
        recommendations = []
        for issue in issues:
            recommendations.append({
                "issue_type": issue["issue_type"],
                "category": issue["category"],
                "severity": issue["severity"],
                "priority": PRIORITY_MAP.get(issue["severity"], 4),
                "recommendation": issue["recommendation"],
                "impact": issue["impact"],
                "expected_gain": GAIN_MAP.get(issue["issue_type"], "Improved overall score"),
                "fix_difficulty": issue["fix_difficulty"],
                "affected_pages": issue.get("affected_pages", []),
                "affected_pages_count": len(issue.get("affected_pages", [])),
            })

        return sorted(recommendations, key=lambda r: (r["priority"], -r["affected_pages_count"]))
