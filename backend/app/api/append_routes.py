
from app.models.models import AISummaryReport
from app.modules.summary_generator import SummaryGeneratorEngine

@router.get("/analyses/{analysis_id}/summary-report")
async def get_summary_report(analysis_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AISummaryReport).where(AISummaryReport.analysis_id == analysis_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(404, "Summary report not generated yet")
    return {
        "overview": report.overview,
        "key_insights": report.key_insights,
        "competitor_analysis": report.competitor_analysis,
        "failures_analysis": report.failures_analysis,
        "improvement_plan": report.improvement_plan,
        "created_at": report.created_at
    }

@router.post("/analyses/{analysis_id}/summary-report")
async def generate_summary_report_endpoint(analysis_id: str, db: AsyncSession = Depends(get_db)):
    engine = SummaryGeneratorEngine()
    try:
        report = await engine.generate_summary_report(analysis_id, db)
        return {
            "overview": report.overview,
            "key_insights": report.key_insights,
            "competitor_analysis": report.competitor_analysis,
            "failures_analysis": report.failures_analysis,
            "improvement_plan": report.improvement_plan,
            "created_at": report.created_at
        }
    except Exception as e:
        logger.error(f"Failed to generate summary report: {e}", exc_info=True)
        raise HTTPException(500, str(e))
