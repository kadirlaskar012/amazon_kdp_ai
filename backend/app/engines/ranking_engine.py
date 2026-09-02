from typing import List, Dict, Any
from datetime import datetime

class RankingEngine:
    """Generates evidence-based 10-stage KDP launch and algorithmic ranking blueprints."""

    def generate_ranking_strategy(
        self, 
        niche: str, 
        primary_keyword: str, 
        marketplace: str = "US",
        target_price: float = 8.99
    ) -> Dict[str, Any]:
        niche_cap = niche.title()
        pk_cap = primary_keyword.title()

        kw_strat = (
            f"Front-load the exact match primary keyword '{pk_cap}' in the main title. "
            f"Reserve the 7 backend boxes exclusively for long-tail search intent phrases without repeating any words from the title or subtitle. "
            f"Target 3-5 low-competition long-tail keywords in your A+ content text to capture broad algorithmic indexing."
        )

        title_strat = (
            f"Keep the main title concise and keyword-focused: '{pk_cap}'. "
            f"Avoid generic fluff in the primary title to maximize Amazon A9 search weighting."
        )

        subtitle_strat = (
            f"Construct the subtitle to capture secondary keywords and audience triggers: "
            f"e.g. 'A Relaxing {niche_cap} for Beginners, Kids & Adults with 50+ Creative Illustrations'. "
            f"Ensure character length stays between 100 and 150 characters to prevent mobile truncation."
        )

        cat_strat = (
            f"Select 3 precise, non-competitive KDP categories where BSR #10,000 earns a '#1 New Release' or '#1 Best Seller' badge. "
            f"Avoid dumping into broad parent categories like 'Activity Books' where you compete against million-copy established bestsellers."
        )

        cover_strat = (
            f"Design for 120px mobile thumbnail resolution. Use high-contrast color duotones and an ultra-bold title font. "
            f"Include 3 thumbnail preview badges showcasing interior sample pages to visually differentiate from 80% of text-only competitors."
        )

        desc_strat = (
            f"Use formatted HTML (h2, b, ul, li) with an emotional hook in the first 2 lines (before the 'Read More' cutoff). "
            f"Clearly list page count, dimensions (8.5x11), bleed-through prevention, and a direct Call to Action."
        )

        launch_strat = (
            f"Leverage Amazon's initial 30-day 'Honeymoon Period' algorithm boost. "
            f"In Days 1-7: Price aggressively at introductory ${target_price - 2.0:.2f} to maximize early conversion velocity. "
            f"Drive initial verified purchases from your email list, social channels, or early reader groups to signal positive conversion rate to the A9 algorithm."
        )

        rev_strat = (
            f"Include a warm, polite 'Thank You' note page on the final leaf of the interior inviting honest reader feedback. "
            f"Never incentivize reviews or offer gifts for reviews to strictly uphold KDP community terms of service."
        )

        price_strat = (
            f"Launch at introductory ${target_price - 2.0:.2f} during week 1. "
            f"Once you accumulate 5-10 positive reviews, step up price to the sweet spot of ${target_price:.2f} for standard 60% KDP paperback royalty margin."
        )

        mon_strat = (
            f"Add top 5 direct competitors to your KDP Studio Watchlist. "
            f"Track BSR fluctuations weekly. If a competitor runs a price drop or ad surge, adjust backend keywords and Amazon Ads bids accordingly."
        )

        why_recs = [
            f"Evidence 1: Amazon A9 algorithm heavily weights exact keyword matches in the Title over backend metadata.",
            f"Evidence 2: Over 70% of Amazon book purchases originate on mobile devices where small, high-contrast covers outperform busy complex art.",
            f"Evidence 3: Lowering launch price increases click-to-purchase conversion rate, triggering organic algorithmic recommendation carousels ('Customers also bought').",
            f"Evidence 4: Niche-specific category selection enables rapid acquisition of the orange '#1 Best Seller' badge with minimal initial sales velocity."
        ]

        return {
            "niche": niche,
            "keyword_strategy": kw_strat,
            "title_strategy": title_strat,
            "subtitle_strategy": subtitle_strat,
            "category_strategy": cat_strat,
            "cover_strategy": cover_strat,
            "description_strategy": desc_strat,
            "launch_strategy": launch_strat,
            "review_strategy": rev_strat,
            "pricing_strategy": price_strat,
            "competitor_strategy": f"Analyze 1-star reviews on top 3 competing books in '{niche}' and solve their primary complaints (e.g. paper thickness, duplicate art) in your volume.",
            "monitoring_strategy": mon_strat,
            "why_this_recommendation": why_recs,
            "generated_at": datetime.utcnow()
        }

ranking_engine = RankingEngine()
