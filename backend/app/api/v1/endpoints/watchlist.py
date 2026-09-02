import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.core.database import get_db
from backend.app.models.db_models import Watchlist, Alert, Book
from backend.app.models.schemas import WatchlistCreateRequest, WatchlistSchema, AlertSchema

router = APIRouter()

@router.get("", response_model=List[WatchlistSchema])
async def get_watchlist(db: AsyncSession = Depends(get_db)):
    stmt = select(Watchlist).order_by(desc(Watchlist.last_checked_at))
    res = await db.execute(stmt)
    items = res.scalars().all()
    
    output = []
    for it in items:
        # Calculate deltas
        base = json.loads(it.baseline_metrics_json) if it.baseline_metrics_json else {}
        curr = json.loads(it.current_metrics_json) if it.current_metrics_json else {}
        
        delta = {}
        if base.get("bsr") and curr.get("bsr"):
            delta["bsr_change"] = curr["bsr"] - base["bsr"]
        if base.get("reviews") is not None and curr.get("reviews") is not None:
            delta["reviews_change"] = curr["reviews"] - base["reviews"]
        if base.get("price") and curr.get("price"):
            delta["price_change"] = round(curr["price"] - base["price"], 2)

        w_schema = WatchlistSchema.from_orm(it)
        w_schema.delta = delta
        output.append(w_schema)
        
    return output

@router.post("", response_model=WatchlistSchema)
async def add_to_watchlist(req: WatchlistCreateRequest, db: AsyncSession = Depends(get_db)):
    # Fetch baseline if book
    base_metrics = {}
    label = req.label
    if req.item_type == "BOOK":
        b = await db.get(Book, req.item_id)
        if b:
            label = label or b.title
            base_metrics = {
                "bsr": b.current_bsr,
                "reviews": b.current_review_count,
                "price": b.price,
                "rating": b.current_rating
            }
            b.is_tracked = True

    w = Watchlist(
        item_type=req.item_type.upper(),
        item_id=req.item_id,
        marketplace=req.marketplace.upper(),
        label=label or req.item_id,
        baseline_metrics_json=json.dumps(base_metrics),
        current_metrics_json=json.dumps(base_metrics),
        last_checked_at=datetime.utcnow()
    )
    db.add(w)
    await db.commit()
    await db.refresh(w)
    return WatchlistSchema.from_orm(w)

@router.delete("/{watchlist_id}")
async def remove_from_watchlist(watchlist_id: int, db: AsyncSession = Depends(get_db)):
    w = await db.get(Watchlist, watchlist_id)
    if not w:
        raise HTTPException(status_code=404, detail="Watchlist item not found.")
    await db.delete(w)
    await db.commit()
    return {"success": True, "deleted_id": watchlist_id}

@router.get("/alerts", response_model=List[AlertSchema])
async def get_alerts(db: AsyncSession = Depends(get_db)):
    stmt = select(Alert).order_by(desc(Alert.created_at)).limit(50)
    res = await db.execute(stmt)
    alerts = res.scalars().all()
    return [AlertSchema.from_orm(a) for a in alerts]

@router.post("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: int, db: AsyncSession = Depends(get_db)):
    a = await db.get(Alert, alert_id)
    if a:
        a.is_read = True
        await db.commit()
    return {"success": True}
