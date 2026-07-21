import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class CompetitorValidator:
    """
    Step 5: Competitor Validation
    Merges LLM Competitors and AI Search Competitors, calculates final confidence.
    """

    def validate(self, discovered_competitors: List[Dict[str, Any]], search_mentions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        logger.info("[VALIDATOR] Validating and merging competitors...")
        
        # Create a map for quick lookup
        mentions_map = {item["name"].lower(): item["mentions"] for item in search_mentions}
        
        validated = []
        max_mentions = max(mentions_map.values()) if mentions_map else 1
        
        # 1. Process LLM discovered competitors
        processed_names = set()
        
        for comp in discovered_competitors:
            name = comp.get("company_name", "").lower()
            if not name:
                continue
                
            processed_names.add(name)
            
            # Base similarity from LLM
            base_sim = comp.get("similarity_score", 50)
            base_conf = comp.get("confidence_score", 50)
            
            # Frequency from Search
            freq = mentions_map.get(name, 0)
            freq_score = (freq / max_mentions) * 100 if max_mentions > 0 else 0
            
            # Final Score Calculation
            # Final Score = Similarity (40%) + Mention Frequency (40%) + Confidence (20%)
            final_score = (base_sim * 0.4) + (freq_score * 0.4) + (base_conf * 0.2)
            
            if final_score >= 75:
                validated.append({
                    "company_name": comp.get("company_name"),
                    "website": comp.get("website", ""),
                    "industry": comp.get("industry", ""),
                    "category": comp.get("category", "direct_competitors"),
                    "why_it_competes": comp.get("why_it_competes", ""),
                    "mentions": freq,
                    "final_score": round(final_score, 1)
                })

        # 2. Add high-frequency Search Competitors that LLM missed
        for search_comp in search_mentions:
            name = search_comp["name"].lower()
            if name not in processed_names:
                freq = search_comp["mentions"]
                freq_score = (freq / max_mentions) * 100
                
                # If they are mentioned frequently enough, they are competitors
                # Assuming base sim/conf of 60 if LLM missed them
                final_score = (60 * 0.4) + (freq_score * 0.4) + (60 * 0.2)
                
                if final_score >= 75:
                    validated.append({
                        "company_name": search_comp["name"],
                        "website": "",
                        "industry": "Unknown",
                        "category": "discovered_via_search",
                        "why_it_competes": f"Highly recommended by AI models ({freq} mentions) for target queries.",
                        "mentions": freq,
                        "final_score": round(final_score, 1)
                    })
        
        # Sort by final score
        validated = sorted(validated, key=lambda x: x["final_score"], reverse=True)
        
        logger.info(f"[VALIDATOR] Validation complete. {len(validated)} verified competitors (>= 75% score).")
        return validated
