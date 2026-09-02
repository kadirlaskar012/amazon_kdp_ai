from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.models.db_models import Keyword, KeywordObservation, SearchHistory
from backend.app.models.schemas import (
    KeywordSchema, KeywordResearchRequest, KeywordResearchResponse
)
from backend.app.engines.keyword_engine import keyword_engine

router = APIRouter()

@router.post("/research", response_model=KeywordResearchResponse)
async def research_keywords(
    req: KeywordResearchRequest,
    db: AsyncSession = Depends(get_db)
):
    res = await keyword_engine.research_keywords(
        seed=req.seed_keyword,
        marketplace=req.marketplace,
        expand_depth=req.expand_depth,
        include_questions=req.include_questions,
        include_buyer_intent=req.include_buyer_intent
    )

    # Save to search history
    history = SearchHistory(
        query=req.seed_keyword,
        query_type="KEYWORD_RESEARCH",
        marketplace=req.marketplace,
        results_count=len(res["keywords"])
    )
    db.add(history)

    # Persist keywords in DB
    for kw_item in res["keywords"]:
        stmt = select(Keyword).where(
            Keyword.keyword == kw_item["keyword"],
            Keyword.marketplace == req.marketplace.upper()
        )
        existing = (await db.execute(stmt)).scalar_one_or_none()
        
        if not existing:
            kw_obj = Keyword(
                keyword=kw_item["keyword"],
                marketplace=req.marketplace.upper(),
                seed_keyword=req.seed_keyword,
                opportunity_score=kw_item["opportunity_score"],
                competition_score=kw_item["competition_score"],
                trend_score=kw_item["trend_score"],
                opportunity_label=kw_item["opportunity_label"],
                cluster_group=kw_item["cluster_group"],
                recommended_use=kw_item["recommended_use"],
                last_checked_at=datetime.utcnow()
            )
            db.add(kw_obj)
            await db.flush()
            
            obs = KeywordObservation(
                keyword_id=kw_obj.id,
                source="amazon_suggest",
                search_volume_indicator=kw_item["search_volume_indicator"],
                observed_results_count=0,
                retrieved_at=datetime.utcnow()
            )
            db.add(obs)
            kw_item["id"] = kw_obj.id
        else:
            existing.opportunity_score = kw_item["opportunity_score"]
            existing.competition_score = kw_item["competition_score"]
            existing.opportunity_label = kw_item["opportunity_label"]
            existing.last_checked_at = datetime.utcnow()
            kw_item["id"] = existing.id

    await db.commit()

    return KeywordResearchResponse(
        seed_keyword=req.seed_keyword,
        marketplace=req.marketplace.upper(),
        keywords=[KeywordSchema(**k) for k in res["keywords"]],
        clusters={k: [KeywordSchema(**item) for item in v] for k, v in res["clusters"].items()},
        top_opportunities=[KeywordSchema(**k) for k in res["top_opportunities"]],
        data_status=res["data_status"]
    )

@router.post("/easy-rank")
async def get_easy_rank_keywords(
    req: KeywordResearchRequest,
    max_competition: float = 45.0,
    min_opportunity: float = 65.0
):
    res = await keyword_engine.research_keywords(
        seed=req.seed_keyword,
        marketplace=req.marketplace,
        expand_depth=req.expand_depth
    )
    gems = keyword_engine.filter_easy_rank_gems(
        res["keywords"],
        max_competition=max_competition,
        min_opportunity=min_opportunity
    )
    return {
        "seed_keyword": req.seed_keyword,
        "marketplace": req.marketplace.upper(),
        "total_gems_found": len(gems),
        "gems": [KeywordSchema(**g) for g in gems],
        "data_status": res["data_status"]
    }
