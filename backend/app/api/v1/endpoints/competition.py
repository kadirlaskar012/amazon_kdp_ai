from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.models.schemas import CompetitionAnalysisRequest, CompetitionAnalysisResponse, BookSchema
from backend.app.models.db_models import SearchHistory
from backend.app.engines.competition_engine import competition_engine

router = APIRouter()

@router.post("/analyze", response_model=CompetitionAnalysisResponse)
async def analyze_competition(
    req: CompetitionAnalysisRequest,
    db: AsyncSession = Depends(get_db)
):
    analysis = await competition_engine.analyze_niche(req.keyword, req.marketplace)
    
    # Save search history
    history = SearchHistory(
        query=req.keyword,
        query_type="NICHE_ANALYSIS",
        marketplace=req.marketplace,
        results_count=len(analysis.get("top_books", []))
    )
    db.add(history)
    await db.commit()

    return CompetitionAnalysisResponse(
        keyword=analysis["keyword"],
        marketplace=analysis["marketplace"],
        competition_score=analysis["competition_score"],
        competition_level=analysis["competition_level"],
        opportunity_score=analysis["opportunity_score"],
        opportunity_level=analysis["opportunity_level"],
        top_books=[BookSchema(**b) for b in analysis["top_books"]],
        metrics=analysis["metrics"],
        score_breakdown=analysis["score_breakdown"],
        content_gaps=analysis["content_gaps"],
        cover_differentiation_opportunities=analysis["cover_differentiation_opportunities"],
        evidence=analysis["evidence"],
        data_status=analysis["data_status"]
    )
