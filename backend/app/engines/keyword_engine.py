import re
from typing import List, Dict, Any
from backend.app.connectors.amazon_suggest import amazon_suggest_connector
from backend.app.engines.opportunity_engine import opportunity_engine

class KeywordEngine:
    """Expands, clusters, scores, and categorizes keywords using real live Amazon suggestions."""

    async def research_keywords(
        self, 
        seed: str, 
        marketplace: str = "US", 
        expand_depth: int = 1,
        include_questions: bool = True,
        include_buyer_intent: bool = True
    ) -> Dict[str, Any]:
        # 1. Expand raw live suggestions from Amazon
        raw_kws = await amazon_suggest_connector.expand_keywords(
            seed=seed,
            marketplace=marketplace,
            expand_depth=expand_depth,
            include_questions=include_questions,
            include_buyer_intent=include_buyer_intent
        )

        keyword_items = []
        clusters: Dict[str, List[Dict[str, Any]]] = {
            "Primary": [],
            "Long-Tail": [],
            "Buyer-Intent": [],
            "Audience": [],
            "Seasonal / Occasion": [],
            "Questions": []
        }

        for item in raw_kws:
            kw = item["keyword"].strip()
            word_count = len(kw.split())
            
            # Determine cluster & recommended use
            kw_lower = kw.lower()
            cluster = "Long-Tail"
            rec_use = "Backend Keyword"
            
            if kw_lower == seed.lower() or word_count <= 2:
                cluster = "Primary"
                rec_use = "Title"
            elif any(q in kw_lower for q in ["how", "why", "what", "guide", "tutorial"]):
                cluster = "Questions"
                rec_use = "Description"
            elif any(b in kw_lower for b in ["best", "buy", "gift", "paperback", "cheap", "2026"]):
                cluster = "Buyer-Intent"
                rec_use = "Subtitle"
            elif any(a in kw_lower for a in ["kids", "adults", "toddlers", "beginners", "women", "men", "teens", "seniors", "girls", "boys"]):
                cluster = "Audience"
                rec_use = "Subtitle"
            elif any(s in kw_lower for s in ["christmas", "halloween", "summer", "winter", "fall", "easter", "valentine"]):
                cluster = "Seasonal / Occasion"
                rec_use = "Backend Keyword"
            elif word_count >= 4:
                cluster = "Long-Tail"
                rec_use = "Backend Keyword"

            # Synthetic competition score proxy from keyword length and intent specificity
            # Long-tail keywords with clear audience have significantly lower competition barrier
            comp_score = 75.0 if cluster == "Primary" else (40.0 if cluster == "Long-Tail" else 50.0)
            if word_count >= 5:
                comp_score = 30.0

            # Demand proxy: shorter & primary suggestions appear first in autocomplete
            volume_ind = "HIGH" if cluster in ["Primary", "Buyer-Intent"] else ("MEDIUM" if word_count <= 4 else "EMERGING")
            
            opp = opportunity_engine.calculate_keyword_opportunity_score(
                competition_score=comp_score,
                search_volume_indicator=volume_ind,
                trend_score=65.0
            )

            kw_obj = {
                "keyword": kw,
                "marketplace": marketplace.upper(),
                "seed_keyword": seed,
                "opportunity_score": opp["score"],
                "competition_score": comp_score,
                "trend_score": 65.0,
                "opportunity_label": opp["label"],
                "cluster_group": cluster,
                "recommended_use": rec_use,
                "relevant_books_count": 0,
                "avg_competitor_reviews": 0.0,
                "search_volume_indicator": volume_ind,
                "data_status": "LIVE",
                "source": "amazon_suggest"
            }
            
            keyword_items.append(kw_obj)
            clusters[cluster].append(kw_obj)

        # Sort top opportunities
        top_opps = sorted(keyword_items, key=lambda x: x["opportunity_score"], reverse=True)[:10]

        return {
            "seed_keyword": seed,
            "marketplace": marketplace.upper(),
            "keywords": keyword_items,
            "clusters": clusters,
            "top_opportunities": top_opps,
            "data_status": "LIVE" if keyword_items else "UNAVAILABLE"
        }

    def filter_easy_rank_gems(self, keywords: List[Dict[str, Any]], max_competition: float = 45.0, min_opportunity: float = 65.0) -> List[Dict[str, Any]]:
        """Filters keywords specifically for low competition and high entry opportunity."""
        gems = [
            k for k in keywords 
            if k.get("competition_score", 100) <= max_competition and k.get("opportunity_score", 0) >= min_opportunity
        ]
        return sorted(gems, key=lambda x: x["opportunity_score"], reverse=True)

keyword_engine = KeywordEngine()
