import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.core.database import get_db
from backend.app.models.db_models import Project, ProjectBook, ProjectKeyword
from backend.app.models.schemas import ProjectCreateRequest, ProjectStatusUpdateRequest, ProjectSchema

router = APIRouter()

@router.get("", response_model=List[ProjectSchema])
async def list_projects(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Project).order_by(desc(Project.updated_at))
    if status and status.upper() != "ALL":
        stmt = stmt.where(Project.status == status.upper())
    res = await db.execute(stmt)
    projects = res.scalars().all()
    return [ProjectSchema.from_orm(p) for p in projects]

@router.post("", response_model=ProjectSchema)
async def create_project(req: ProjectCreateRequest, db: AsyncSession = Depends(get_db)):
    project = Project(
        title=req.title,
        niche=req.niche,
        target_audience=req.target_audience or "General KDP Readers",
        marketplace=req.marketplace.upper(),
        status=(req.status or "PENDING").upper(),
        seo_data_json=req.seo_data_json or "{}",
        cover_prompt_json=req.cover_prompt_json or "{}",
        ranking_strategy_json=req.ranking_strategy_json or "{}",
        notes=req.notes or "",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return ProjectSchema.from_orm(project)

@router.get("/{project_id}", response_model=ProjectSchema)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    p = await db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found.")
    return ProjectSchema.from_orm(p)

@router.patch("/{project_id}/status", response_model=ProjectSchema)
async def update_project_status(
    project_id: int,
    req: ProjectStatusUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    p = await db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found.")
    p.status = req.status.upper()
    p.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(p)
    return ProjectSchema.from_orm(p)

@router.put("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: int,
    title: Optional[str] = None,
    status: Optional[str] = None,
    notes: Optional[str] = None,
    seo_data_json: Optional[str] = None,
    cover_prompt_json: Optional[str] = None,
    ranking_strategy_json: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    p = await db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found.")
    if title: p.title = title
    if status: p.status = status.upper()
    if notes is not None: p.notes = notes
    if seo_data_json is not None: p.seo_data_json = seo_data_json
    if cover_prompt_json is not None: p.cover_prompt_json = cover_prompt_json
    if ranking_strategy_json is not None: p.ranking_strategy_json = ranking_strategy_json
    p.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(p)
    return ProjectSchema.from_orm(p)

@router.delete("/{project_id}")
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    p = await db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found.")
    await db.delete(p)
    await db.commit()
    return {"success": True, "deleted_id": project_id}
