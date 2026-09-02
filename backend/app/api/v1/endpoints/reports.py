import os
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import Dict, Any, List
from backend.app.services.report_generator import report_generator
from backend.app.core.config import REPORTS_DIR

router = APIRouter()

@router.post("/pdf")
async def generate_pdf(report_data: Dict[str, Any]):
    filename = report_generator.generate_pdf_report(report_data)
    return {"success": True, "filename": filename, "download_url": f"/api/v1/reports/download/{filename}"}

@router.post("/excel")
async def generate_excel(data_items: List[Dict[str, Any]], sheet_name: str = "ResearchData"):
    filename = report_generator.generate_excel_report(data_items, sheet_name)
    return {"success": True, "filename": filename, "download_url": f"/api/v1/reports/download/{filename}"}

@router.post("/csv")
async def generate_csv(data_items: List[Dict[str, Any]]):
    filename = report_generator.generate_csv_report(data_items)
    return {"success": True, "filename": filename, "download_url": f"/api/v1/reports/download/{filename}"}

@router.post("/json")
async def generate_json(data_items: Any):
    filename = report_generator.generate_json_report(data_items)
    return {"success": True, "filename": filename, "download_url": f"/api/v1/reports/download/{filename}"}

@router.get("/download/{filename}")
async def download_report_file(filename: str):
    filepath = os.path.join(REPORTS_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Requested report file not found.")
    return FileResponse(filepath, filename=filename)
