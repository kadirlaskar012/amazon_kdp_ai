import statistics
from typing import List, Dict, Any
from backend.app.connectors.amazon_live import amazon_live_connector
from backend.app.engines.opportunity_engine import opportunity_engine

class CompetitionEngine:
    """Performs deep competitive analysis on top-ranking books for any niche."""

    async def analyze_niche(self, keyword: str, marketplace: str = "US") -> Dict[str, Any]:
        # 1. Fetch live search results
        search_res = await amazon_live_connector.search_books(keyword, marketplace=marketplace, page=1)
        books = search_res.data if search_res.success and isinstance(search_res.data, list) else []
        
        if not books:
            return {
                "keyword": keyword,
                "marketplace": marketplace.upper(),
                "competition_score": 0.0,
                "competition_level": "UNKNOWN",
                "opportunity_score": 0.0,
                "opportunity_level": "UNKNOWN",
                "top_books": [],
                "metrics": {},
                "score_breakdown": {},
                "content_gaps": [],
                "cover_differentiation_opportunities": [],
                "evidence": {"note": "No live books found for this niche"},
                "data_status": "UNAVAILABLE"
            }

        # 2. Extract metrics
        prices = [b["price"] for b in books if b.get("price") is not None and b["price"] > 0]
        ratings = [b["current_rating"] for b in books if b.get("current_rating") is not None]
        reviews = [b["current_review_count"] for b in books if b.get("current_review_count") is not None]
        bsrs = [b["current_bsr"] for b in books if b.get("current_bsr") is not None]

        avg_price = round(statistics.mean(prices), 2) if prices else 8.99
        avg_rating = round(statistics.mean(ratings), 2) if ratings else 4.4
        avg_reviews = round(statistics.mean(reviews), 1) if reviews else 0.0
        median_reviews = round(statistics.median(reviews), 1) if reviews else 0.0
        median_bsr = int(statistics.median(bsrs)) if bsrs else None

        # 3. Calculate scores
        comp_calc = opportunity_engine.calculate_competition_score(
            avg_reviews=avg_reviews,
            median_reviews=median_reviews,
            median_bsr=median_bsr,
            avg_rating=avg_rating,
            books_count=len(books)
        )
        
        opp_calc = opportunity_engine.calculate_keyword_opportunity_score(
            competition_score=comp_calc["score"],
            search_volume_indicator="HIGH" if len(books) >= 15 else "MEDIUM"
        )

        # 4. Review distribution brackets
        low_review_books = sum(1 for r in reviews if r < 100)
        mid_review_books = sum(1 for r in reviews if 100 <= r < 500)
        high_review_books = sum(1 for r in reviews if r >= 500)

        # 5. Content gaps derived from titles & observed traits
        titles_combined = " ".join([b["title"].lower() for b in books])
        gaps = []
        if "beginner" not in titles_combined:
            gaps.append("Beginner-focused edition: Most competitors target general audience without explicit beginner step-by-step guidance.")
        if "large print" not in titles_combined and "pocket" not in titles_combined:
            gaps.append("Format Differentiation: High contrast / Large print / 8.5x11 inches format gap detected.")
        if "toddler" not in titles_combined and "senior" not in titles_combined:
            gaps.append("Age Specialization: Create targeted versions specifically for ages 4-8, teens, or seniors rather than broad demographics.")
        if not gaps:
            gaps.append("Value Additions: Include bonus interior pages, downloadable extras, or checklist tracking not found in top 5 competitors.")

        # 6. Cover differentiation suggestions
        cover_diff = [
            "Use vibrant high-contrast backgrounds to pop against predominantly white/pastel competitor covers.",
            "Enlarge main title typography to ensure clear legibility in 120px mobile search thumbnails.",
            "Display 3-4 interior page preview badges on the front cover to immediately communicate interior value."
        ]

        # 7. Add sales estimations to books
        for b in books:
            if b.get("current_bsr"):
                est = opportunity_engine.estimate_monthly_sales_from_bsr(b["current_bsr"], marketplace)
                b["estimated_monthly_sales"] = est["estimated_monthly_sales"]
                if b.get("price") and est["estimated_monthly_sales"]:
                    b["estimated_monthly_revenue"] = round(b["price"] * est["estimated_monthly_sales"], 2)

        return {
            "keyword": keyword,
            "marketplace": marketplace.upper(),
            "competition_score": comp_calc["score"],
            "competition_level": comp_calc["level"],
            "opportunity_score": opp_calc["score"],
            "opportunity_level": opp_calc["label"],
            "top_books": books[:20],
            "metrics": {
                "total_books_analyzed": len(books),
                "avg_price": avg_price,
                "min_price": min(prices) if prices else 0.0,
                "max_price": max(prices) if prices else 0.0,
                "avg_rating": avg_rating,
                "avg_reviews": avg_reviews,
                "median_reviews": median_reviews,
                "low_review_competitors_count": low_review_books,
                "mid_review_competitors_count": mid_review_books,
                "high_review_competitors_count": high_review_books,
                "accessible_market_share_percent": round((low_review_books / max(1, len(reviews))) * 100, 1)
            },
            "score_breakdown": comp_calc,
            "content_gaps": gaps,
            "cover_differentiation_opportunities": cover_diff,
            "evidence": {
                "sample_size": len(books),
                "source": "Amazon Live Search",
                "retrieved_at": search_res.retrieved_at.isoformat()
            },
            "data_status": "LIVE"
        }

competition_engine = CompetitionEngine()
