from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    books, keywords, competition, trends, events, ideas, seo, cover, strategy,
    projects, watchlist, reports, settings as settings_endpoint, logs
)
from backend.app.models.schemas import MarketplaceSchema

api_router = APIRouter()

# Marketplace Matrix
MARKETPLACES_LIST = [
    {"code": "US", "name": "United States", "domain": "amazon.com", "currency": "USD", "currency_symbol": "$", "region": "North America", "pa_api_supported": True, "suggest_api_supported": True, "is_active": True},
    {"code": "UK", "name": "United Kingdom", "domain": "amazon.co.uk", "currency": "GBP", "currency_symbol": "£", "region": "Europe", "pa_api_supported": True, "suggest_api_supported": True, "is_active": True},
    {"code": "DE", "name": "Germany", "domain": "amazon.de", "currency": "EUR", "currency_symbol": "€", "region": "Europe", "pa_api_supported": True, "suggest_api_supported": True, "is_active": True},
    {"code": "CA", "name": "Canada", "domain": "amazon.ca", "currency": "CAD", "currency_symbol": "$", "region": "North America", "pa_api_supported": True, "suggest_api_supported": True, "is_active": True},
    {"code": "AU", "name": "Australia", "domain": "amazon.com.au", "currency": "AUD", "currency_symbol": "$", "region": "Oceania", "pa_api_supported": True, "suggest_api_supported": True, "is_active": True},
    {"code": "FR", "name": "France", "domain": "amazon.fr", "currency": "EUR", "currency_symbol": "€", "region": "Europe", "pa_api_supported": True, "suggest_api_supported": True, "is_active": True},
    {"code": "IT", "name": "Italy", "domain": "amazon.it", "currency": "EUR", "currency_symbol": "€", "region": "Europe", "pa_api_supported": True, "suggest_api_supported": True, "is_active": True},
    {"code": "ES", "name": "Spain", "domain": "amazon.es", "currency": "EUR", "currency_symbol": "€", "region": "Europe", "pa_api_supported": True, "suggest_api_supported": True, "is_active": True},
    {"code": "IN", "name": "India", "domain": "amazon.in", "currency": "INR", "currency_symbol": "₹", "region": "Asia", "pa_api_supported": True, "suggest_api_supported": True, "is_active": True},
    {"code": "JP", "name": "Japan", "domain": "amazon.co.jp", "currency": "JPY", "currency_symbol": "¥", "region": "Asia", "pa_api_supported": True, "suggest_api_supported": True, "is_active": True},
]

@api_router.get("/marketplaces", response_model=list[MarketplaceSchema])
async def list_marketplaces():
    return [MarketplaceSchema(**m) for m in MARKETPLACES_LIST]

api_router.include_router(books.router, prefix="/books", tags=["Books"])
api_router.include_router(keywords.router, prefix="/keywords", tags=["Keywords"])
api_router.include_router(competition.router, prefix="/competition", tags=["Competition"])
api_router.include_router(trends.router, prefix="/trends", tags=["Trends"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(ideas.router, prefix="/ideas", tags=["Book Ideas"])
api_router.include_router(seo.router, prefix="/seo", tags=["SEO Studio"])
api_router.include_router(cover.router, prefix="/cover", tags=["Cover Intelligence"])
api_router.include_router(strategy.router, prefix="/strategy", tags=["Ranking Strategy"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(watchlist.router, prefix="/watchlist", tags=["Watchlist"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(settings_endpoint.router, prefix="/settings", tags=["Settings"])
api_router.include_router(logs.router, prefix="/logs", tags=["Logs"])
