import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, JSON, Float, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum

class AnalysisStatus(str, enum.Enum):
    pending = "pending"
    crawling = "crawling"
    extracting = "extracting"
    analyzing = "analyzing"
    analyzing_competitors = "analyzing_competitors"
    scoring = "scoring"
    generating_prompts = "generating_prompts"
    completed = "completed"
    failed = "failed"

class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    url: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[AnalysisStatus] = mapped_column(String, default=AnalysisStatus.pending)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    crawl_data: Mapped["CrawlData | None"] = relationship("CrawlData", back_populates="analysis", uselist=False)
    website_intelligence: Mapped["WebsiteIntelligence | None"] = relationship("WebsiteIntelligence", back_populates="analysis", uselist=False)
    scores: Mapped["Scores | None"] = relationship("Scores", back_populates="analysis", uselist=False)
    issues: Mapped[list["Issue"]] = relationship("Issue", back_populates="analysis")
    prompts: Mapped[list["GeneratedPrompt"]] = relationship("GeneratedPrompt", back_populates="analysis")
    strengths_weaknesses: Mapped["StrengthsWeaknesses | None"] = relationship("StrengthsWeaknesses", back_populates="analysis", uselist=False)
    competitors: Mapped["Competitors | None"] = relationship("Competitors", back_populates="analysis", uselist=False)
    summary_report: Mapped["AISummaryReport | None"] = relationship("AISummaryReport", back_populates="analysis", uselist=False)

class CrawlData(Base):
    __tablename__ = "crawl_data"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(ForeignKey("analyses.id"), unique=True)
    pages: Mapped[dict] = mapped_column(JSON)  # {url: {html, metadata, links, images, schema, ...}}
    sitemap_urls: Mapped[list] = mapped_column(JSON, default=list)
    robots_txt: Mapped[str | None] = mapped_column(Text, nullable=True)
    llms_txt: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_pages: Mapped[int] = mapped_column(Integer, default=0)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="crawl_data")

class WebsiteIntelligence(Base):
    __tablename__ = "website_intelligence"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(ForeignKey("analyses.id"), unique=True)
    industry: Mapped[str | None] = mapped_column(String, nullable=True)
    sub_industry: Mapped[str | None] = mapped_column(String, nullable=True)
    business_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    products: Mapped[list] = mapped_column(JSON, default=list)
    services: Mapped[list] = mapped_column(JSON, default=list)
    locations: Mapped[list] = mapped_column(JSON, default=list)
    brands: Mapped[list] = mapped_column(JSON, default=list)
    primary_topics: Mapped[list] = mapped_column(JSON, default=list)
    secondary_topics: Mapped[list] = mapped_column(JSON, default=list)
    entities: Mapped[list] = mapped_column(JSON, default=list)
    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)
    unique_selling_points: Mapped[list] = mapped_column(JSON, default=list)
    content_clusters: Mapped[list] = mapped_column(JSON, default=list)
    extracted_content: Mapped[dict] = mapped_column(JSON, default=dict)
    business_context: Mapped[dict] = mapped_column(JSON, default=dict)  # Complete context from ContextEngine
    query_intents: Mapped[list] = mapped_column(JSON, default=list) # Query intents mapped by IntentEngine
    website_type: Mapped[str | None] = mapped_column(String, nullable=True)
    website_type_confidence: Mapped[int] = mapped_column(Integer, default=0)
    crawl_quality_confidence: Mapped[int] = mapped_column(Integer, default=0)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="website_intelligence")

class Scores(Base):
    __tablename__ = "scores"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(ForeignKey("analyses.id"), unique=True)
    seo_score: Mapped[float] = mapped_column(Float, default=0)
    aeo_score: Mapped[float] = mapped_column(Float, default=0)
    geo_score: Mapped[float] = mapped_column(Float, default=0)
    ai_readiness_score: Mapped[float] = mapped_column(Float, default=0)
    overall_score: Mapped[float] = mapped_column(Float, default=0)
    breakdown: Mapped[dict] = mapped_column(JSON, default=dict)  # transparent calculation details

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="scores")

class Issue(Base):
    __tablename__ = "issues"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(ForeignKey("analyses.id"))
    category: Mapped[str] = mapped_column(String)  # seo, aeo, geo, ai
    issue_type: Mapped[str] = mapped_column(String)
    severity: Mapped[str] = mapped_column(String)  # critical, high, medium, low
    affected_pages: Mapped[list] = mapped_column(JSON, default=list)
    element: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommendation: Mapped[str] = mapped_column(Text)
    impact: Mapped[str] = mapped_column(Text)
    fix_difficulty: Mapped[str] = mapped_column(String)  # easy, medium, hard

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="issues")

class GeneratedPrompt(Base):
    __tablename__ = "generated_prompts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(ForeignKey("analyses.id"))
    prompt_text: Mapped[str] = mapped_column(Text)
    intent: Mapped[str] = mapped_column(String)  # informational, commercial, transactional, comparison, local/educational
    rationale: Mapped[str] = mapped_column(Text)  # why this prompt was generated
    playground_results: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # results after playground analysis

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="prompts")

class StrengthsWeaknesses(Base):
    __tablename__ = "strengths_weaknesses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(ForeignKey("analyses.id"), unique=True)
    strengths: Mapped[list] = mapped_column(JSON, default=list)  # [{title, description, impact, evidence}, ...]
    weaknesses: Mapped[list] = mapped_column(JSON, default=list)  # [{title, description, impact, evidence}, ...]

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="strengths_weaknesses")

class Competitors(Base):
    __tablename__ = "competitors"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(ForeignKey("analyses.id"), unique=True)
    competitors: Mapped[list] = mapped_column(JSON, default=list)  # [{domain, name, similarity_score, ...}, ...]
    insight_analysis: Mapped[dict] = mapped_column(JSON, default=dict) # Why they win, why we lost
    opportunity_analysis: Mapped[dict] = mapped_column(JSON, default=dict) # Lost recommendations, revenue impact
    leaderboard: Mapped[list] = mapped_column(JSON, default=list) # AI Visibility Leaderboard

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="competitors")

# --- New Models for AI Search Intelligence Platform ---

class Provider(Base):
    __tablename__ = "providers"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    enabled: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    runs: Mapped[list["PromptRun"]] = relationship("PromptRun", back_populates="provider")
    logs: Mapped[list["ProviderLog"]] = relationship("ProviderLog", back_populates="provider")

class Prompt(Base):
    __tablename__ = "prompts"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    industry: Mapped[str | None] = mapped_column(String, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    language: Mapped[str | None] = mapped_column(String, nullable=True)
    country: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    intent: Mapped[str | None] = mapped_column(String, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    frequency: Mapped[str | None] = mapped_column(String, nullable=True)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    enabled: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    runs: Mapped[list["PromptRun"]] = relationship("PromptRun", back_populates="prompt_ref")

class PromptRun(Base):
    __tablename__ = "prompt_runs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt_id: Mapped[str] = mapped_column(ForeignKey("prompts.id"))
    provider_id: Mapped[str] = mapped_column(ForeignKey("providers.id"))
    model: Mapped[str | None] = mapped_column(String, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    full_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    latency: Mapped[float] = mapped_column(Float, default=0.0)
    token_usage: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String, default="completed") # completed, failed
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    request_id: Mapped[str | None] = mapped_column(String, nullable=True)
    remediation_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    prompt_category: Mapped[str | None] = mapped_column(String, nullable=True)
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0)
    valid_response: Mapped[bool] = mapped_column(default=True)
    validation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    sentiment: Mapped[str | None] = mapped_column(String, nullable=True)
    brand_mentions_count: Mapped[int] = mapped_column(Integer, default=0)
    product_mentions_count: Mapped[int] = mapped_column(Integer, default=0)
    competitor_mentions_count: Mapped[int] = mapped_column(Integer, default=0)
    
    prompt_ref: Mapped["Prompt"] = relationship("Prompt", back_populates="runs")
    provider: Mapped["Provider"] = relationship("Provider", back_populates="runs")
    citations: Mapped[list["Citation"]] = relationship("Citation", back_populates="prompt_run")
    entities: Mapped[list["EntityAnalysis"]] = relationship("EntityAnalysis", back_populates="prompt_run")
    competitor_mentions: Mapped[list["CompetitorMention"]] = relationship("CompetitorMention", back_populates="prompt_run")

class Citation(Base):
    __tablename__ = "citations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt_run_id: Mapped[str] = mapped_column(ForeignKey("prompt_runs.id"))
    citation_title: Mapped[str | None] = mapped_column(String, nullable=True)
    citation_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    domain: Mapped[str | None] = mapped_column(String, nullable=True)
    root_domain: Mapped[str | None] = mapped_column(String, nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    anchor_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    response_snippet: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    citation_order: Mapped[int] = mapped_column(Integer, default=0)
    
    prompt_run: Mapped["PromptRun"] = relationship("PromptRun", back_populates="citations")

class Brand(Base):
    __tablename__ = "brands"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    domain: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    is_client: Mapped[bool] = mapped_column(default=False)
    is_competitor: Mapped[bool] = mapped_column(default=False)
    is_partner: Mapped[bool] = mapped_column(default=False)
    mention_count: Mapped[int] = mapped_column(Integer, default=0)
    citation_count: Mapped[int] = mapped_column(Integer, default=0)

    aliases: Mapped[list["BrandAlias"]] = relationship("BrandAlias", back_populates="brand")

class BrandAlias(Base):
    __tablename__ = "brand_aliases"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id: Mapped[str] = mapped_column(ForeignKey("brands.id"))
    alias_name: Mapped[str] = mapped_column(String, nullable=False)
    alias_type: Mapped[str] = mapped_column(String, nullable=False) # product, parent, synonym
    
    brand: Mapped["Brand"] = relationship("Brand", back_populates="aliases")

class CompetitorMention(Base):
    __tablename__ = "competitor_mentions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt_run_id: Mapped[str] = mapped_column(ForeignKey("prompt_runs.id"))
    competitor_name: Mapped[str] = mapped_column(String, nullable=False)
    times_cited: Mapped[int] = mapped_column(Integer, default=1)
    
    prompt_run: Mapped["PromptRun"] = relationship("PromptRun", back_populates="competitor_mentions")

class VisibilityMetric(Base):
    __tablename__ = "visibility_metrics"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    provider_id: Mapped[str | None] = mapped_column(ForeignKey("providers.id"), nullable=True)
    industry: Mapped[str | None] = mapped_column(String, nullable=True)
    country: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ai_visibility_percent: Mapped[float] = mapped_column(Float, default=0.0)
    citation_percent: Mapped[float] = mapped_column(Float, default=0.0)
    mention_percent: Mapped[float] = mapped_column(Float, default=0.0)
    win_rate: Mapped[float] = mapped_column(Float, default=0.0)
    loss_rate: Mapped[float] = mapped_column(Float, default=0.0)
    avg_citation_position: Mapped[float] = mapped_column(Float, default=0.0)
    avg_response_position: Mapped[float] = mapped_column(Float, default=0.0)
    prompt_coverage: Mapped[float] = mapped_column(Float, default=0.0)
    competitor_coverage: Mapped[float] = mapped_column(Float, default=0.0)

class EntityAnalysis(Base):
    __tablename__ = "entity_analysis"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt_run_id: Mapped[str] = mapped_column(ForeignKey("prompt_runs.id"))
    entity_type: Mapped[str] = mapped_column(String, nullable=False) # Brand, Product, Location, etc.
    entity_name: Mapped[str] = mapped_column(String, nullable=False)
    coverage_status: Mapped[str | None] = mapped_column(String, nullable=True) # missing, weak, duplicate
    
    prompt_run: Mapped["PromptRun"] = relationship("PromptRun", back_populates="entities")

class ProviderLog(Base):
    __tablename__ = "provider_logs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    provider_id: Mapped[str] = mapped_column(ForeignKey("providers.id"))
    endpoint: Mapped[str | None] = mapped_column(String, nullable=True)
    status_code: Mapped[int] = mapped_column(Integer, default=200)
    latency: Mapped[float] = mapped_column(Float, default=0.0)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    token_usage: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    provider: Mapped["Provider"] = relationship("Provider", back_populates="logs")

class GEOIntelligence(Base):
    __tablename__ = "geo_intelligence"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(ForeignKey("analyses.id"), unique=True)
    evidence_object: Mapped[dict] = mapped_column(JSON, default=dict)
    executive_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_risks: Mapped[list] = mapped_column(JSON, default=list)
    business_opportunities: Mapped[list] = mapped_column(JSON, default=list)
    growth_opportunities: Mapped[list] = mapped_column(JSON, default=list)
    ai_recommendation_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    executive_insights: Mapped[list] = mapped_column(JSON, default=list)
    roadmap_90_day: Mapped[dict] = mapped_column(JSON, default=dict)
    top_priorities: Mapped[list] = mapped_column(JSON, default=list)
    expected_outcomes: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class HistoricalScore(Base):
    __tablename__ = "historical_scores"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str | None] = mapped_column(ForeignKey("analyses.id"), nullable=True)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ai_readiness_score: Mapped[float] = mapped_column(Float, default=0.0)
    visibility: Mapped[float] = mapped_column(Float, default=0.0)
    mentions: Mapped[int] = mapped_column(Integer, default=0)
    citations: Mapped[int] = mapped_column(Integer, default=0)
    entity_count: Mapped[int] = mapped_column(Integer, default=0)

class TrendData(Base):
    __tablename__ = "trend_data"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    metric_name: Mapped[str] = mapped_column(String, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    value: Mapped[float] = mapped_column(Float, default=0.0)
    dimension: Mapped[str | None] = mapped_column(String, nullable=True) # weekly, monthly


class AISummaryReport(Base):
    __tablename__ = "ai_summary_reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(ForeignKey("analyses.id"), unique=True)
    overview: Mapped[str] = mapped_column(Text)
    key_insights: Mapped[list] = mapped_column(JSON)
    competitor_analysis: Mapped[str] = mapped_column(Text)
    failures_analysis: Mapped[str] = mapped_column(Text)
    improvement_plan: Mapped[list] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="summary_report")
