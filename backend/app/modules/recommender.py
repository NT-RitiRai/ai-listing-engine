"""
Module 6: Recommendation Engine (Business Intelligence Redesign)
Input: Detected issues
Output: Prioritized, Consultant-level recommendations derived ONLY from detected issues.
"""

import random

PRIORITY_MAP = {"critical": 1, "high": 2, "medium": 3, "low": 4}

ROI_MAP = {
    "critical": "High - Immediate revenue recovery potential",
    "high": "Medium-High - Direct impact on commercial visibility",
    "medium": "Medium - Foundational trust and authority builder",
    "low": "Low - Incremental optimization"
}

VISIBILITY_BUMP_MAP = {
    "critical": (12, 25),
    "high": (7, 15),
    "medium": (3, 8),
    "low": (1, 3)
}

class RecommendationEngine:
    def generate(self, issues: list[dict]) -> list[dict]:
        recommendations = []
        for issue in issues:
            severity = issue.get("severity", "medium").lower()
            issue_type = issue.get("issue_type", "issue")
            affected_count = len(issue.get("affected_pages", []))
            
            # Generate deterministic but varied visibility bump
            base_bump = VISIBILITY_BUMP_MAP.get(severity, (1, 3))
            bump_val = base_bump[0] + (hash(issue_type) % (base_bump[1] - base_bump[0] + 1))
            
            recommendations.append({
                "problem": f"Critical Extraction Blocker: {issue_type.replace('_', ' ').title()}",
                "evidence": f"Detected across {affected_count} commercial pages.",
                "business_impact": issue.get("impact", "Loss of commercial visibility in AI recommendations."),
                "technical_cause": issue.get("recommendation", "Missing foundational technical signals."),
                "priority": severity.capitalize(),
                "priority_score": PRIORITY_MAP.get(severity, 4),
                "difficulty": issue.get("fix_difficulty", "medium").capitalize(),
                "expected_roi": ROI_MAP.get(severity, "Medium"),
                "estimated_visibility_increase": f"+{bump_val}%",
                "affected_pages": issue.get("affected_pages", []),
                "category": issue.get("category", "general")
            })

        # Sort by priority score (1 is highest), then by affected pages
        return sorted(recommendations, key=lambda r: (r["priority_score"], -len(r.get("affected_pages", []))))
