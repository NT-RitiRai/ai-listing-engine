import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Analysis, AISummaryReport, WebsiteIntelligence, GEOIntelligence, Scores, Issue, Competitors
from app.providers.openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)

class SummaryGeneratorEngine:
    def __init__(self):
        self.llm = OpenAIProvider()
        
    async def generate_summary_report(self, analysis_id: str, db: AsyncSession) -> AISummaryReport:
        # Check if already exists
        result = await db.execute(select(AISummaryReport).where(AISummaryReport.analysis_id == analysis_id))
        existing = result.scalar_one_or_none()
        if existing:
            return existing
            
        logger.info(f"Generating AI Summary Report for {analysis_id}")
        
        # Fetch all required data
        analysis = await db.get(Analysis, analysis_id)
        if not analysis:
            raise ValueError("Analysis not found")
            
        intel = await db.execute(select(WebsiteIntelligence).where(WebsiteIntelligence.analysis_id == analysis_id))
        intel = intel.scalar_one_or_none()
        
        geo = await db.execute(select(GEOIntelligence).where(GEOIntelligence.analysis_id == analysis_id))
        geo = geo.scalar_one_or_none()
        
        scores = await db.execute(select(Scores).where(Scores.analysis_id == analysis_id))
        scores = scores.scalar_one_or_none()
        
        issues = await db.execute(select(Issue).where(Issue.analysis_id == analysis_id))
        issues = issues.scalars().all()
        
        comp = await db.execute(select(Competitors).where(Competitors.analysis_id == analysis_id))
        comp = comp.scalar_one_or_none()
        
        # Build prompt context
        context = f"Business URL: {analysis.url}\n"
        if intel:
            context += f"Business Summary: {intel.business_summary}\n"
            context += f"Industry: {intel.industry}, Sub-industry: {intel.sub_industry}\n"
            context += f"Target Audience: {intel.target_audience}\n"
            context += f"USP: {intel.unique_selling_points}\n"
            
        if scores:
            context += f"\nScores - Overall: {scores.overall_score}, SEO: {scores.seo_score}, AEO: {scores.aeo_score}, GEO: {scores.geo_score}, AI Readiness: {scores.ai_readiness_score}\n"
            
        if geo:
            context += f"\nGEO Executive Insights: {json.dumps(geo.executive_insights)}\n"
            context += f"Business Risks: {json.dumps(geo.business_risks)}\n"
            context += f"Growth Opportunities: {json.dumps(geo.growth_opportunities)}\n"
            context += f"Top Priorities: {json.dumps(geo.top_priorities)}\n"
            
        if comp:
            context += f"\nCompetitors: {json.dumps(comp.competitors)}\n"
            
        if issues:
            high_sev = [i for i in issues if i.severity.lower() in ["critical", "high"]]
            context += f"\nCritical Issues (Failures): {[i.issue_type + ' - ' + i.impact for i in high_sev[:15]]}\n"

        prompt = f"""You are a top-tier Chief Marketing Officer and AI Search Consultant.
I have provided you with a massive amount of analysis data about a business from an AI listing engine.

Context:
{context}

LANGUAGE AND TONE INSTRUCTIONS:
Ensure that you use non-technical, easy-to-understand language so that a common business owner can understand it. If you MUST use a technical term (like Citation, Schema, AEO, GEO, Structured Data, Entity, etc.), you MUST immediately provide a brief, simple explanation of its main aim or meaning right next to it in parentheses. For example: "Citation (how often AI models link to your website as a trusted source)" or "Schema markup (hidden code that helps AI read your website)".

Your task is to write a highly professional, 3-to-4 page Executive AI Summary Report.
You must output a raw JSON object with EXACTLY these keys:
"overview": A detailed string (markdown format REQUIRED). Write this entirely as a concise, structured bullet-point list covering the business overview, industry standing, and overall AI visibility score analysis. DO NOT write long paragraphs. USE \\n FOR NEWLINES.
"key_insights": A list of strings, each containing a major insight discovered about their AI visibility, content gaps, or strengths. Make them detailed and actionable (5-7 insights).
"competitor_analysis": A detailed string (markdown REQUIRED). Write this entirely as a structured bullet-point list analyzing their competitors, share of voice, and how they stack up against them in AI search. DO NOT write long paragraphs. USE \\n FOR NEWLINES.
"failures_analysis": A detailed string (markdown REQUIRED). Write this entirely as a structured bullet-point list analyzing where the business specifically failed in the AI evaluations (e.g. 0% live citation rates, critical schema issues, lack of authority). Be brutally honest. DO NOT write long paragraphs. USE \\n FOR NEWLINES.
"improvement_plan": A list of detailed string action items. A step-by-step roadmap on exactly how to fix the failures and dominate AI search (7-10 detailed steps).

CRITICAL JSON RULES:
1. Do NOT wrap the JSON in ```json or any other formatting. Output ONLY raw JSON.
2. You MUST escape all line breaks as \\n inside your strings. Do NOT use literal line breaks in string values."""

        response_dict = await self.llm.run_prompt(prompt)
        response_text = response_dict.get("full_response", "")
        
        try:
            # Clean up potential markdown formatting
            clean_text = response_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            
            data = json.loads(clean_text)
            
            report = AISummaryReport(
                analysis_id=analysis_id,
                overview=data.get("overview", "Overview not generated."),
                key_insights=data.get("key_insights", []),
                competitor_analysis=data.get("competitor_analysis", "Competitor analysis not generated."),
                failures_analysis=data.get("failures_analysis", "Failures analysis not generated."),
                improvement_plan=data.get("improvement_plan", [])
            )
            
            db.add(report)
            await db.commit()
            await db.refresh(report)
            
            return report
        except Exception as e:
            logger.error(f"Failed to generate summary report: {e}\nResponse: {response_text}")
            raise ValueError(f"Failed to parse LLM response: {e}")
