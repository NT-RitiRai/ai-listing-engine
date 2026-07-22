
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
