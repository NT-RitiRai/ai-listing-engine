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

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="competitors")
