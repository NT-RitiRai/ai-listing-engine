import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.models import Analysis, WebsiteIntelligence, CrawlData, PromptRun, Citation, Brand

logger = logging.getLogger(__name__)

class RemediationMappingEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def analyze_failure(self, prompt_run_id: str, prompt_text: str, analysis_id: str = None):
        """
        Cross-references an API failure (0 citations for client) with technical crawl data
        to generate a remediation note explaining exactly WHY the LLM dropped the page.
        """
        logger.info(f"[REMEDIATION] Analyzing failure for prompt run {prompt_run_id}")
        
        # 1. Fetch the Prompt Run and Citations
        prompt_run = await self.db.get(PromptRun, prompt_run_id)
        if not prompt_run:
            logger.error("PromptRun not found")
            return
            
        result = await self.db.execute(select(Citation).where(Citation.prompt_run_id == prompt_run_id))
        citations = result.scalars().all()
        cited_domains = {c.domain for c in citations if c.domain}

        # 2. Identify the target analysis and domain
        analysis = None
        domain_to_check = None
        
        if analysis_id:
            analysis = await self.db.get(Analysis, analysis_id)
            if analysis:
                from urllib.parse import urlparse
                domain_to_check = urlparse(analysis.url).netloc.replace("www.", "")
        
        if not analysis:
            # Fallback to the old global brand logic
            brand_result = await self.db.execute(select(Brand).where(Brand.is_client == True))
            client_brands = brand_result.scalars().all()
            if not client_brands:
                logger.warning("No client brand defined and no analysis_id provided. Skipping remediation.")
                return
            domain_to_check = client_brands[0].domain
            
            analysis_result = await self.db.execute(
                select(Analysis)
                .where(Analysis.url.ilike(f"%{domain_to_check}%"))
                .order_by(desc(Analysis.created_at))
                .limit(1)
            )
            analysis = analysis_result.scalar_one_or_none()

        # If client was cited, no remediation needed!
        if domain_to_check and any(domain_to_check in d for d in cited_domains):
            logger.info(f"Target domain {domain_to_check} was cited successfully. No remediation needed.")
            prompt_run.remediation_note = None
            await self.db.commit()
            return
            
        # 3. Client NOT cited. We must map this to crawler data.
        if not analysis:
            logger.warning(f"No technical crawl data found for {domain_to_check}. Cannot generate remediation note.")
            prompt_run.remediation_note = "LLM omitted your domain, and no technical crawl data is available to diagnose why. Please run a technical scan."
            await self.db.commit()
            return

        # Fetch intelligence and crawl data
        intel_result = await self.db.execute(select(WebsiteIntelligence).where(WebsiteIntelligence.analysis_id == analysis.id))
        intel = intel_result.scalar_one_or_none()
        
        crawl_result = await self.db.execute(select(CrawlData).where(CrawlData.analysis_id == analysis.id))
        crawl = crawl_result.scalar_one_or_none()
        
        if not intel or not crawl:
            prompt_run.remediation_note = "LLM omitted your domain. Technical crawl data is incomplete."
            await self.db.commit()
            return

        # 4. Generate the Note based on logical rules
        provider = prompt_run.provider.name if prompt_run.provider else "The AI Engine"
        note = self._generate_mapping_note(provider, prompt_text, intel, crawl)
        
        prompt_run.remediation_note = note
        await self.db.commit()
        logger.info(f"[REMEDIATION] Note generated: {note}")
        
    def _generate_mapping_note(self, provider: str, prompt_text: str, intel: WebsiteIntelligence, crawl: CrawlData) -> str:
        """
        The Core Absorption Gate Logic (Data-Driven).
        Maps the AI failure to specific schema, content, or entity deficits using actual crawl evidence.
        """
        import json
        pages = crawl.pages or {}
        
        # Extract aggregate metrics
        total_pages = max(len(pages), 1)
        schema_pages = sum(1 for p in pages.values() if p.get("json_ld"))
        faq_pages = sum(1 for p in pages.values() if any("FAQPage" in str(s) for s in p.get("json_ld", [])))
        product_schema = sum(1 for p in pages.values() if any("Product" in str(s) for s in p.get("json_ld", [])))
        review_schema = sum(1 for p in pages.values() if any("Review" in str(s) for s in p.get("json_ld", [])))
        has_local_schema = any(any("LocalBusiness" in str(s) or "Organization" in str(s) for s in p.get("json_ld", [])) for p in pages.values())
        
        word_counts = []
        for p in pages.values():
            text = p.get("html", "")
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(text, "lxml")
            word_counts.append(len(soup.get_text().split()))
            
        avg_wc = sum(word_counts) / len(word_counts) if word_counts else 0
        
        prompt_lower = prompt_text.lower()
        
        evidence = []
        recommendations = []
        
        # Rule 1: Local intent
        if any(w in prompt_lower for w in ["near", "mumbai", "delhi", "location", "best"]):
            if not has_local_schema:
                evidence.append(f"✓ No LocalBusiness or Organization Schema found across {total_pages} pages.")
                recommendations.append("Deploy structured LocalBusiness Schema on all location and contact pages.")
                
        # Rule 2: Informational / FAQ intent
        if any(w in prompt_lower for w in ["what", "how", "guide", "why", "features", "benefits"]):
            if faq_pages == 0:
                evidence.append(f"✓ Missing FAQ Schema on informational pages.")
                recommendations.append("Implement FAQPage schema markup to provide structured answers to the LLM.")
            if avg_wc < 600:
                evidence.append(f"✓ Content depth is extremely low (average {round(avg_wc)} words per page).")
                recommendations.append("Expand top-of-funnel content to > 1,000 words to improve semantic extraction.")
                
        # Rule 3: Product/Commercial intent
        if any(w in prompt_lower for w in ["buy", "price", "product", "features", "chatbot", "review"]):
            if product_schema == 0:
                evidence.append(f"✓ Missing Product Schema.")
                recommendations.append("Add Product schema with detailed descriptions, brand, and feature definitions.")
            if review_schema == 0:
                evidence.append(f"✓ No Review Schema detected.")
                recommendations.append("Incorporate aggregate ratings and review schema to build authority.")

        # Rule 4: General Schema Deficit
        if schema_pages / total_pages < 0.2:
            evidence.append(f"✓ Less than 20% of crawled pages contain any Schema markup.")
            recommendations.append("Deploy comprehensive technical schema across the entire domain.")
            
        # Fallback if no specific rules triggered
        if not evidence:
            evidence.append(f"✓ Entity extraction coverage for '{intel.industry}' topics is weak.")
            recommendations.append("Improve semantic entity relationships in H1/H2 headers.")

        # Return as a structured JSON string so the frontend can parse it
        return json.dumps({
            "status": f"{provider.capitalize()} intercepted your domain because it lacks necessary structural and content signals.",
            "evidence": evidence,
            "recommendations": recommendations
        })
