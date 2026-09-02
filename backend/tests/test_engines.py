import pytest
from backend.app.engines.opportunity_engine import opportunity_engine
from backend.app.engines.seo_engine import seo_engine
from backend.app.connectors.events_connector import events_connector

def test_competition_score_calculation():
    # Test low review barrier
    low_comp = opportunity_engine.calculate_competition_score(
        avg_reviews=25.0,
        median_reviews=15.0,
        median_bsr=150000,
        avg_rating=4.2,
        books_count=15
    )
    assert low_comp["score"] < 45.0
    assert low_comp["level"] in ["VERY_EASY", "EASY"]

    # Test high review barrier
    high_comp = opportunity_engine.calculate_competition_score(
        avg_reviews=1500.0,
        median_reviews=1200.0,
        median_bsr=1200,
        avg_rating=4.8,
        books_count=20
    )
    assert high_comp["score"] > 65.0
    assert high_comp["level"] in ["DIFFICULT", "VERY_DIFFICULT"]

def test_opportunity_score_calculation():
    opp = opportunity_engine.calculate_keyword_opportunity_score(
        competition_score=25.0,
        search_volume_indicator="HIGH",
        trend_score=70.0
    )
    assert opp["score"] >= 70.0
    assert opp["label"] in ["EXCELLENT", "GOOD"]

def test_bsr_sales_estimation_model():
    est = opportunity_engine.estimate_monthly_sales_from_bsr(5000, "US")
    assert est["status"] == "ESTIMATED"
    assert est["estimated_monthly_sales"] > 0
    assert est["estimated_daily_sales"] > 0

    unavail = opportunity_engine.estimate_monthly_sales_from_bsr(None, "US")
    assert unavail["status"] == "UNAVAILABLE"

def test_seo_backend_keywords_deduplication():
    res = seo_engine.generate_backend_keywords(
        niche="coloring book",
        primary_keyword="mandala coloring book",
        secondary_keywords=["mindfulness", "stress relief"],
        title_words=["mandala", "coloring", "book"]
    )
    assert len(res["boxes"]) == 7
    # Ensure no title words leaked into backend keywords
    for b in res["boxes"]:
        assert "mandala" not in b.lower()

def test_dynamic_events_calendar():
    events = events_connector.get_upcoming_events(days_ahead=365)
    assert len(events) > 0
    for ev in events:
        assert ev["days_until_event"] >= 0
        assert len(ev["related_niches"]) > 0
