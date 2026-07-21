import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class IntentEngine:
    """
    Intent Engine: Determines search intents and assigns appropriate prompt strategies.
    Supported Intents: Informational, Commercial, Transactional, Comparison, Local, 
    Navigational, Problem Solving, Research, Decision Making, Purchase, Recommendation, Service Discovery.
    """

    def __init__(self):
        self.ALL_INTENTS = [
            "Informational", "Commercial", "Transactional", "Comparison", "Local",
            "Navigational", "Problem Solving", "Research", "Decision Making", 
            "Purchase", "Recommendation", "Service Discovery"
        ]

    def determine_intents(self, business_context: Dict[str, Any]) -> List[str]:
        """
        Dynamically selects the top 5 most relevant intents based on the business context.
        """
        logger.info("[INTENT ENGINE] Determining intent strategy based on business context...")
        
        intents = []
        biz_type = str(business_context.get("business_type", "")).lower()
        commercial = str(business_context.get("commercial_intent", "")).lower()
        locations = business_context.get("locations", [])
        products = business_context.get("products", [])
        services = business_context.get("services", [])
        
        # 1. Base Intent
        intents.append("Recommendation")
        
        # 2. Local Intent
        if len(locations) > 0:
            intents.append("Local")
            
        # 3. Commercial / E-commerce Intents
        if "high" in commercial or len(products) > 0 or "b2c" in biz_type or "d2c" in biz_type:
            intents.extend(["Commercial", "Purchase"])
        else:
            # Service-based / B2B Intents
            if len(services) > 0 or "b2b" in biz_type:
                intents.extend(["Service Discovery", "Comparison", "Decision Making"])
                
        # 4. Fill remaining slots with informational/problem-solving
        if len(intents) < 5:
            intents.append("Problem Solving")
        if len(intents) < 5:
            intents.append("Informational")
            
        # Deduplicate and cap to 5
        final_intents = list(dict.fromkeys(intents))[:5]
        
        # If still less than 5, grab from defaults
        for fallback in self.ALL_INTENTS:
            if len(final_intents) >= 5:
                break
            if fallback not in final_intents:
                final_intents.append(fallback)
                
        logger.info(f"[INTENT ENGINE] Selected Intents: {final_intents}")
        return final_intents
