from fastapi import APIRouter
from typing import List, Dict, Any
from backend.app.models.schemas import (
    SEOTitleRequest, SEOTitleOption, SEODescriptionRequest, SEODescriptionResponse,
    BackendKeywordsRequest, BackendKeywordsResponse, ListingAuditRequest, ListingAuditResponse
)
from backend.app.engines.seo_engine import seo_engine
from backend.app.connectors.amazon_live import amazon_live_connector

router = APIRouter()

@router.post("/title-studio", response_model=List[SEOTitleOption])
async def generate_seo_titles(req: SEOTitleRequest):
    options = seo_engine.generate_seo_titles(
        niche=req.niche,
        primary_keyword=req.primary_keyword,
        secondary_keywords=req.secondary_keywords,
        target_audience=req.target_audience,
        book_type=req.book_type
    )
    return [SEOTitleOption(**opt) for opt in options]

@router.post("/description", response_model=SEODescriptionResponse)
async def generate_seo_description(req: SEODescriptionRequest):
    desc = seo_engine.generate_description(
        title=req.title,
        subtitle=req.subtitle,
        niche=req.niche,
        primary_keyword=req.primary_keyword,
        secondary_keywords=req.secondary_keywords,
        target_audience=req.target_audience,
        key_features=req.key_features
    )
    return SEODescriptionResponse(**desc)

@router.post("/backend-keywords", response_model=BackendKeywordsResponse)
async def generate_backend_keywords(req: BackendKeywordsRequest):
    res = seo_engine.generate_backend_keywords(
        niche=req.niche,
        primary_keyword=req.primary_keyword,
        secondary_keywords=req.secondary_keywords,
        title_words=req.title_words
    )
    return BackendKeywordsResponse(**res)

@router.post("/audit-listing", response_model=ListingAuditResponse)
async def audit_listing(req: ListingAuditRequest):
    title = req.title
    subtitle = req.subtitle
    price = req.price
    bsr = req.bsr
    rating = req.rating
    rev_count = req.review_count

    # If ASIN provided and fields are missing, attempt live Amazon fetch
    if req.asin and (not title or price is None):
        detail_res = await amazon_live_connector.get_book_details(req.asin, req.marketplace)
        if detail_res.success and detail_res.data:
            d = detail_res.data
            title = title or d.get("title")
            subtitle = subtitle or d.get("subtitle")
            price = price or d.get("price")
            bsr = bsr or d.get("current_bsr")
            rating = rating or d.get("current_rating")
            rev_count = rev_count or d.get("current_review_count")

    res = seo_engine.audit_listing(
        title=title,
        subtitle=subtitle,
        description=req.description,
        price=price,
        bsr=bsr,
        rating=rating,
        review_count=rev_count,
        marketplace=req.marketplace
    )
    if req.asin:
        res["evidence"]["evaluated_asin"] = req.asin

    return ListingAuditResponse(**res)
