import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.core.database import get_db
from backend.app.models.db_models import Project, ProjectBook, ProjectKeyword
from backend.app.models.schemas import ProjectCreateRequest, ProjectSchema

router = APIRouter()

@router.get("", response_model=List[ProjectSchema])
async def list_projects(db: AsyncSession = Depends(get_db)):
    stmt = select(Project).order_by(desc(Project.updated_at))
    res = await db.execute(stmt)
    projects = res.scalars().all()
    return [ProjectSchema.from_orm(p) for p in projects]

@router.post("", response_model=ProjectSchema)
async def create_project(req: ProjectCreateRequest, db: AsyncSession = Depends(get_db)):
    project = Project(
        title=req.title,
        niche=req.niche,
        target_audience=req.target_audience,
        marketplace=req.marketplace.upper(),
        status="RESEARCH",
        seo_data_json="{}",
        cover_prompt_json="{}",
        ranking_strategy_json="{}",
        notes="",
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
    if status: p.status = status
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
