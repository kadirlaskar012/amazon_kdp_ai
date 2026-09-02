import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

def test_api_endpoints():
    with TestClient(app) as client:
        # 1. Health check
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

        # 2. Marketplaces list
        m_resp = client.get("/api/v1/marketplaces")
        assert m_resp.status_code == 200
        assert len(m_resp.json()) == 10

        # 3. Seasonal events calendar
        ev_resp = client.get("/api/v1/events/calendar?days_ahead=180")
        assert ev_resp.status_code == 200
        assert len(ev_resp.json()) > 0

        # 4. SEO title studio
        title_resp = client.post("/api/v1/seo/title-studio", json={
            "niche": "Coloring Book",
            "primary_keyword": "mindfulness coloring book",
            "secondary_keywords": ["stress relief", "calming art"],
            "target_audience": "Adults"
        })
        assert title_resp.status_code == 200
        assert len(title_resp.json()) > 0

        # 5. Backend keywords
        backend_resp = client.post("/api/v1/seo/backend-keywords", json={
            "niche": "Coloring Book",
            "primary_keyword": "mindfulness coloring book",
            "secondary_keywords": ["stress relief", "relaxing art"],
            "title_words": ["mindfulness", "coloring", "book"]
        })
        assert backend_resp.status_code == 200
        assert len(backend_resp.json()["boxes"]) == 7

        # 6. Listing audit
        audit_resp = client.post("/api/v1/seo/audit-listing", json={
            "title": "Mindfulness Coloring Book",
            "price": 8.99,
            "bsr": 25000,
            "rating": 4.5,
            "review_count": 80
        })
        assert audit_resp.status_code == 200
        assert "top_5_fixes" in audit_resp.json()

        # 7. Book idea generator
        idea_resp = client.post("/api/v1/ideas/generate", json={
            "niche": "mandala coloring",
            "target_audience": "Adults",
            "book_type": "Coloring Book"
        })
        assert idea_resp.status_code == 200
        assert len(idea_resp.json()["ideas"]) > 0

        # 8. Ranking strategy
        strat_resp = client.post("/api/v1/strategy/how-to-rank", json={
            "niche": "Coloring Book",
            "primary_keyword": "mandala coloring book",
            "target_price": 8.99
        })
        assert strat_resp.status_code == 200
        assert "keyword_strategy" in strat_resp.json()
