from fastapi import APIRouter, Query
from typing import List
from backend.app.connectors.google_trends import google_trends_connector
from backend.app.models.schemas import TrendSignalSchema

router = APIRouter()

@router.get("/signals", response_model=TrendSignalSchema)
async def get_trend_signals(
    query: str = Query("coloring book", description="Topic to check trends for"),
    marketplace: str = "US"
):
    signal = await google_trends_connector.get_trend_signals(query, marketplace)
    return TrendSignalSchema(**signal)

@router.get("/rising")
async def get_rising_trends(marketplace: str = "US"):
    seed_topics = [
        "bold and easy coloring book",
        "habit tracker journal",
        "brain games for seniors",
        "toddler scissor skills activity",
        "handwriting practice workbook",
        "daily gratitude journal",
        "cozy mystery puzzle book"
    ]
    signals = []
    for t in seed_topics:
        s = await google_trends_connector.get_trend_signals(t, marketplace)
        signals.append(s)
    return {"marketplace": marketplace.upper(), "trends": signals}
