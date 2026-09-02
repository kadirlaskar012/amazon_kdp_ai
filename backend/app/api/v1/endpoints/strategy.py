from fastapi import APIRouter
from backend.app.models.schemas import RankingStrategyRequest, RankingStrategyResponse
from backend.app.engines.ranking_engine import ranking_engine

router = APIRouter()

@router.post("/how-to-rank", response_model=RankingStrategyResponse)
async def generate_how_to_rank_strategy(req: RankingStrategyRequest):
    strat = ranking_engine.generate_ranking_strategy(
        niche=req.niche,
        primary_keyword=req.primary_keyword,
        marketplace=req.marketplace,
        target_price=req.target_price
    )
    return RankingStrategyResponse(**strat)
