from fastapi import APIRouter, Query
from typing import List
from datetime import date
from backend.app.connectors.events_connector import events_connector
from backend.app.models.schemas import EventSchema

router = APIRouter()

@router.get("/calendar", response_model=List[EventSchema])
async def get_seasonal_calendar(
    marketplace: str = "US",
    days_ahead: int = Query(180, description="Lookahead window in days")
):
    events = events_connector.get_upcoming_events(
        reference_date=date.today(),
        marketplace=marketplace,
        days_ahead=days_ahead
    )
    return [EventSchema(**e) for e in events]
