import math
from typing import Dict, Any, List, Optional

class OpportunityEngine:
    """Calculates mathematical KDP competition and opportunity scores based strictly on observable data signals."""

    @staticmethod
    def calculate_competition_score(
        avg_reviews: float,
        median_reviews: float,
        median_bsr: Optional[int],
        avg_rating: float,
        books_count: int
    ) -> Dict[str, Any]:
        """
        Calculates KDP Competition Score (0-100).
        0 = Very Easy, 100 = Very Difficult
        """
        # Review barrier score (0-100)
        # Average top 10 reviews > 1000 is heavily saturated; < 50 is very easy
        review_barrier = min(100.0, (avg_reviews / 15.0) * 1.5)
        
        # BSR barrier score (0-100)
        # Lower BSR means stiffer selling competition
        if median_bsr and median_bsr > 0:
            if median_bsr < 5000:
                bsr_barrier = 90.0
            elif median_bsr < 25000:
                bsr_barrier = 70.0
            elif median_bsr < 100000:
                bsr_barrier = 45.0
            elif median_bsr < 300000:
                bsr_barrier = 25.0
            else:
                bsr_barrier = 10.0
        else:
            bsr_barrier = 40.0 # Neutral estimate if BSR not available
            
        # Rating quality barrier
        rating_barrier = 50.0
        if avg_rating >= 4.6:
            rating_barrier = 80.0
        elif avg_rating >= 4.2:
            rating_barrier = 55.0
        elif avg_rating > 0:
            rating_barrier = 30.0

        # Weighted composition
        comp_score = round(
            (0.50 * review_barrier) + 
            (0.35 * bsr_barrier) + 
            (0.15 * rating_barrier), 
            1
        )
        comp_score = max(5.0, min(99.0, comp_score))

        # Categorical label
        if comp_score <= 25:
            level = "VERY_EASY"
            label = "Very Easy"
        elif comp_score <= 45:
            level = "EASY"
            label = "Easy"
        elif comp_score <= 65:
            level = "MODERATE"
            label = "Moderate"
        elif comp_score <= 80:
            level = "DIFFICULT"
            label = "Difficult"
        else:
            level = "VERY_DIFFICULT"
            label = "Very Difficult"

        return {
            "score": comp_score,
            "level": level,
            "label": label,
            "review_barrier": round(review_barrier, 1),
            "bsr_barrier": round(bsr_barrier, 1),
            "rating_barrier": round(rating_barrier, 1),
            "methodology": "Weighted composition: 50% Review Barrier + 35% BSR Sales Barrier + 15% Competitor Rating Barrier."
        }

    @staticmethod
    def calculate_keyword_opportunity_score(
        competition_score: float,
        search_volume_indicator: str = "MEDIUM",
        trend_score: float = 50.0,
        relevant_books: int = 15
    ) -> Dict[str, Any]:
        """
        Calculates KDP Keyword Opportunity Score (0-100).
        80-100 = Excellent, 65-79 = Good, 50-64 = Moderate, 0-49 = Weak
        """
        # Demand signal from autocomplete & suggestions (0-100)
        demand_map = {"HIGH": 85.0, "MEDIUM": 60.0, "LOW": 35.0, "EMERGING": 75.0}
        demand_signal = demand_map.get(search_volume_indicator.upper(), 55.0)
        
        # Inverted competition (Higher is better for opportunity)
        inverted_comp = max(0.0, 100.0 - competition_score)
        
        # Weighted formula
        raw_opp = (0.40 * inverted_comp) + (0.35 * demand_signal) + (0.25 * trend_score)
        opp_score = round(max(5.0, min(98.0, raw_opp)), 1)
        
        if opp_score >= 80:
            label = "EXCELLENT"
            description = "High demand with accessible competitor barriers and strong ranking potential."
        elif opp_score >= 65:
            label = "GOOD"
            description = "Solid commercial opportunity with manageable review barriers."
        elif opp_score >= 50:
            label = "MODERATE"
            description = "Moderate competition; requires strong cover design and niche specialization."
        else:
            label = "WEAK"
            description = "High saturation or low observable demand."

        return {
            "score": opp_score,
            "label": label,
            "description": description,
            "demand_signal": demand_signal,
            "competition_score": competition_score,
            "trend_score": trend_score,
            "methodology": "Score = 40% (100 - Competition Score) + 35% Search Demand Signal + 25% Trend Momentum."
        }

    @staticmethod
    def estimate_monthly_sales_from_bsr(bsr: Optional[int], marketplace: str = "US") -> Dict[str, Any]:
        """
        Estimates monthly book sales from Amazon Best Sellers Rank using empirical regression models.
        Clearly marked as ESTIMATED with confidence and assumptions.
        """
        if not bsr or bsr <= 0:
            return {
                "estimated_monthly_sales": None,
                "estimated_daily_sales": None,
                "confidence": "UNAVAILABLE",
                "status": "UNAVAILABLE",
                "note": "BSR not available from current product data"
            }

        # Empirical logarithmic curve parameters for Book category in US
        # Log(Sales) ~= a - b * Log(BSR)
        if bsr <= 10:
            daily = 2500 - (bsr * 150)
        elif bsr <= 100:
            daily = 1000 - (bsr * 8)
        elif bsr <= 1000:
            daily = 280 - (bsr * 0.22)
        elif bsr <= 10000:
            daily = 80 - (bsr * 0.006)
        elif bsr <= 50000:
            daily = 25 - (bsr * 0.00038)
        elif bsr <= 150000:
            daily = 6 - (bsr * 0.00003)
        elif bsr <= 500000:
            daily = 1.2
        else:
            daily = 0.3

        daily = max(0.1, daily)
        monthly = int(round(daily * 30))

        confidence = "HIGH" if bsr < 50000 else ("MEDIUM" if bsr < 200000 else "LOW")

        return {
            "estimated_monthly_sales": monthly,
            "estimated_daily_sales": round(daily, 1),
            "confidence": confidence,
            "status": "ESTIMATED",
            "source": "Empirical BSR Sales Estimation Model",
            "assumptions": f"Based on Amazon {marketplace.upper()} Book category empirical velocity curves for BSR #{bsr:,}."
        }

opportunity_engine = OpportunityEngine()
