import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ValidationEngine:
    def __init__(self):
        pass

    def classify_prompt(self, prompt_text: str) -> str:
        """Classify the intent of the prompt."""
        text = prompt_text.lower()
        if "vs" in text or "compare" in text:
            return "Comparison"
        if "best" in text or "top" in text or "recommend" in text:
            return "Commercial"
        if "near" in text or "mumbai" in text or "delhi" in text or "location" in text:
            return "Local"
        if "what" in text or "how" in text or "why" in text or "features" in text:
            return "Informational"
        return "Brand"

    def validate_response(self, prompt_text: str, response_text: str, intelligence: dict) -> Dict[str, Any]:
        """
        Calculates relevance score and determines if response is valid.
        """
        score = 100
        reasons = []

        if not response_text or len(response_text) < 20:
            return {
                "valid": False,
                "relevance_score": 0,
                "validation_reason": "Empty or extremely short response.",
                "sentiment": "Neutral"
            }

        text = response_text.lower()
        prompt = prompt_text.lower()

        # Check for absolute failure
        if "as an ai" in text or "i cannot fulfill" in text or "api error" in text:
            return {
                "valid": False,
                "relevance_score": 0,
                "validation_reason": "AI refused to answer or API failed.",
                "sentiment": "Neutral"
            }

        # Check topic relevance
        key_terms = [w for w in prompt.split() if len(w) > 4]
        matches = sum(1 for t in key_terms if t in text)
        
        if key_terms and matches == 0:
            score -= 40
            reasons.append("Response does not mention any key terms from the prompt.")
        elif key_terms and matches / len(key_terms) < 0.5:
            score -= 20
            reasons.append("Response has low semantic overlap with the prompt.")

        valid = score >= 70
        reason_str = " ".join(reasons) if reasons else "Response is relevant and valid."
        if not valid:
            reason_str = "Response does not match the requested topic. " + reason_str

        return {
            "valid": valid,
            "relevance_score": score,
            "validation_reason": reason_str,
            "sentiment": "Neutral"
        }
