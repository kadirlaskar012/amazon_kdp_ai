from fastapi import APIRouter
from backend.app.models.schemas import CoverAnalysisRequest, CoverAnalysisResponse
from backend.app.engines.cover_engine import cover_engine

router = APIRouter()

@router.post("/intelligence", response_model=CoverAnalysisResponse)
async def analyze_cover_intelligence(req: CoverAnalysisRequest):
    analysis = await cover_engine.analyze_covers_for_niche(req.keyword, req.marketplace)
    return CoverAnalysisResponse(**analysis)

@router.post("/prompt-maker")
async def generate_cover_prompt(
    niche: str,
    title: str,
    target_audience: str = "Kids & Adults",
    style_preference: str = "Bold minimalist vector",
    trim_size: str = "8.5 x 11 inches"
):
    prompt = (
        f"Professional Amazon KDP book cover design for '{title}'. "
        f"Niche: {niche}. Audience: {target_audience}. "
        f"Art Style: {style_preference}, high contrast commercial illustration, clean typography layout, "
        f"vibrant aesthetic palette, designed for {trim_size} Paperback, 300 DPI print-ready quality, centered focal artwork."
    )
    return {
        "title": title,
        "niche": niche,
        "trim_size": trim_size,
        "bleed_spec": "Add 0.125 inch (3.2 mm) bleed on top, bottom, and outside edges",
        "recommended_aspect_ratio": "1:1.3" if "8.5" in trim_size else "1:1.5",
        "prompt": prompt,
        "negative_prompt": "blurry, low resolution, watermark, amateur text overlay, pixelated, cropped"
    }
