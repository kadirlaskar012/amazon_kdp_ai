from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.core.database import get_db
from backend.app.models.db_models import SystemLog, SearchHistory

router = APIRouter()

@router.get("/system")
async def get_system_logs(
    level: Optional[str] = None,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SystemLog).order_by(desc(SystemLog.created_at)).limit(limit)
    if level:
        stmt = stmt.where(SystemLog.level == level.upper())
    res = await db.execute(stmt)
    logs = res.scalars().all()
    return logs

@router.get("/history")
async def get_search_history(
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SearchHistory).order_by(desc(SearchHistory.created_at)).limit(limit)
    res = await db.execute(stmt)
    history = res.scalars().all()
    return history
