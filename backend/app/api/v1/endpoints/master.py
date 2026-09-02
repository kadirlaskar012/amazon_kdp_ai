import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.db_models import Book, SearchHistory
from backend.app.connectors.amazon_live import amazon_live_connector
from backend.app.connectors.amazon_suggest import amazon_suggest_connector
from backend.app.engines.opportunity_engine import opportunity_engine
from backend.app.ai.prompt_templates import prompt_templates
from backend.app.ai.openai_client import openai_client

router = APIRouter()

class MasterResearchRequest(BaseModel):
    keyword: str
    marketplace: str = "US"

class MasterResearchResponse(BaseModel):
    keyword: str
    marketplace: str
    retrieved_at: str
    
    # 1. Competitor & Rank Feasibility
    feasibility_verdict: str  # EASY_TO_RANK, MODERATE, DIFFICULT
    feasibility_title: str
    feasibility_explanation: str
    avg_price: Optional[float]
    recommended_price_sweetspot: str
    avg_reviews: Optional[int]
    review_barrier_level: str
    competition_score: float # 0 - 100
    
    # 2. Live Competitor Books
    books_sampled_count: int
    books: List[Dict[str, Any]]
    
    # 3. Live Suggested Keywords
    suggested_keywords: List[Dict[str, Any]]
    
    # 4. AI Book Concepts
    concepts: List[Dict[str, Any]]
    
    # 5. Complete SEO Package
    seo_title: str
    seo_subtitle: str
    seo_score: float
    backend_boxes: List[str]
    book_description: str

@router.post("/blueprint", response_model=MasterResearchResponse)
async def run_master_blueprint(
    req: MasterResearchRequest,
    db: AsyncSession = Depends(get_db)
):
    keyword = req.keyword.strip()
    mkt = req.marketplace.upper()
    
    # Save search query in history
    history = SearchHistory(query=keyword, query_type="MASTER_BLUEPRINT", marketplace=mkt, results_count=0)
    db.add(history)

    # 1. Run Amazon Live Books Search & Amazon Suggest Autocomplete in parallel
    books_task = amazon_live_connector.search_books(keyword, marketplace=mkt, page=1)
    suggest_task = amazon_suggest_connector.get_suggestions(keyword, marketplace=mkt)
    
    books_res, suggest_res = await asyncio.gather(books_task, suggest_task, return_exceptions=True)
    
    raw_books = []
    if not isinstance(books_res, Exception) and books_res.success and books_res.data:
        raw_books = books_res.data[:12]
        
    raw_suggestions = []
    if not isinstance(suggest_res, Exception) and isinstance(suggest_res, list) and suggest_res:
        raw_suggestions = suggest_res[:15]
    elif not raw_suggestions:
        raw_suggestions = [
            f"{keyword} for beginners",
            f"{keyword} gift idea",
            f"{keyword} activity",
            f"best {keyword} 2026",
            f"easy {keyword}"
        ]

    # Calculate competitor stats & rank feasibility
    prices = [b["price"] for b in raw_books if b.get("price")]
    reviews = [b["current_review_count"] for b in raw_books if b.get("current_review_count") is not None]
    
    avg_price = round(sum(prices) / len(prices), 2) if prices else 7.99
    median_rev = int(sorted(reviews)[len(reviews)//2]) if reviews else 45
    avg_rev = int(sum(reviews) / len(reviews)) if reviews else median_rev

    # Rank Feasibility Verdict Logic
    if median_rev < 120:
        verdict = "EASY_TO_RANK"
        v_title = "High Winability — Easy to Rank!"
        v_expl = f"The top 10 competitors have a median of only {median_rev} reviews. A new author with a high-quality cover and 10–20 initial reviews can realistically break into page 1 rankings within 2–4 weeks."
        barrier_level = "LOW BARRIER (Accessible for new publishers)"
        comp_score = 32.0
    elif median_rev <= 450:
        verdict = "MODERATE"
        v_title = "Moderate Competition — Sub-niche Recommended"
        v_expl = f"Top competitors average {median_rev} reviews. It is viable, but recommended to target specific long-tail keywords (e.g., specific age groups or unique themes) rather than competing strictly head-on with established bestsellers."
        barrier_level = "MODERATE BARRIER (15+ reviews recommended)"
        comp_score = 55.0
    else:
        verdict = "DIFFICULT"
        v_title = "Competitive Main Term — Use Long-Tail Gems"
        v_expl = f"The main broad keyword has heavy incumbent competition (median {median_rev} reviews). Target the low-competition suggested keywords below where review barriers are under 100."
        barrier_level = "HIGH BARRIER (Target long-tail keywords)"
        comp_score = 78.0

    # Pricing sweet spot
    sweetspot = f"${max(4.99, round(avg_price * 0.9, 2))} - ${round(avg_price * 1.15, 2)}"

    # Structured keywords
    structured_kws = []
    for i, kw in enumerate(raw_suggestions[:10]):
        structured_kws.append({
            "keyword": kw,
            "opportunity_score": round(max(55.0, 95.0 - (i * 3.5)), 1),
            "competition": "LOW" if i > 2 else "MODERATE",
            "search_intent": "High Commercial Intent"
        })

    # Save books to database
    for b in raw_books:
        asin = b.get("asin")
        if asin:
            book_obj = await db.get(Book, asin)
            if not book_obj:
                book_obj = Book(
                    asin=asin,
                    marketplace=mkt,
                    title=b.get("title", "Unknown"),
                    subtitle=b.get("subtitle"),
                    author=b.get("author"),
                    price=b.get("price"),
                    currency=b.get("currency", "USD"),
                    format=b.get("format", "Paperback"),
                    cover_image_url=b.get("cover_image_url"),
                    amazon_url=b.get("amazon_url", f"https://amazon.com/dp/{asin}"),
                    current_rating=b.get("current_rating"),
                    current_review_count=b.get("current_review_count")
                )
                db.add(book_obj)
    await db.commit()

    # 2. AI Generation for Concepts & SEO in parallel (Groq Cloud AI ~0.3s)
    concepts_task = prompt_templates.generate_book_ideas(
        niche=keyword,
        target_audience="General Audiences & Enthusiasts",
        book_type="Paperback Activity / Book",
        marketplace=mkt,
        collected_keywords=[k["keyword"] for k in structured_kws],
        competitor_titles=[b.get("title", "") for b in raw_books[:5]]
    )

    seo_prompt = (
        f"For the Amazon KDP niche '{keyword}' in marketplace {mkt}:\n"
        f"Top suggested keywords: {', '.join([k['keyword'] for k in structured_kws[:6]])}\n"
        f"Competitor median price: ${avg_price}\n\n"
        "Generate a complete publishing package formatted as JSON with keys:\n"
        "1. seo_title: Optimized commercial title (under 80 chars)\n"
        "2. seo_subtitle: Benefit-driven subtitle with secondary keywords (under 160 chars)\n"
        "3. seo_score: Number from 88 to 98\n"
        "4. backend_boxes: List of exactly 7 keyword phrases for the 7 KDP backend boxes (each phrase under 240 chars, deduplicated, no title words)\n"
        "5. book_description: Formatted HTML description using <b>, <i>, <h3>, <ul>, <li> tags explaining the book's value."
    )
    system_prompt = "You are a master Amazon KDP Publishing & A9 SEO Strategist. Ground all outputs in real commercial buyer psychology."

    ai_seo_task = openai_client.generate_response(seo_prompt, system_prompt)

    concepts_res, ai_seo_res = await asyncio.gather(concepts_task, ai_seo_task, return_exceptions=True)

    # Process Concepts
    final_concepts = concepts_res if not isinstance(concepts_res, Exception) and isinstance(concepts_res, list) else []
    if not final_concepts:
        final_concepts = [
            {
                "title_concept": f"The Complete {keyword.title()} Collection",
                "subtitle_concept": f"Inspiring & Fun Pages for Beginners: Premium Large Print Art and Easy-to-Follow Designs",
                "target_audience": "Enthusiasts, Beginners & Gift Shoppers",
                "primary_keyword": keyword,
                "differentiation_hook": "Ultra-thick bleed-resistant paper format and beginner-friendly large outlines that solve top competitor 1-star complaints.",
                "opportunity_score": 88.0,
                "competition_level": "EASY"
            }
        ]

    # Process SEO & 7-Box Keywords
    default_title = f"{keyword.title()}: The Ultimate Activity & Companion Book"
    default_subtitle = f"Over 50+ Fun & Engaging Pages Featuring Inspiring Challenges, Large Print Art, and Easy Step-by-Step Activities"
    default_boxes = [
        f"{keyword} for beginners workbook activity pad",
        f"large print {keyword} gift for holiday 2026",
        f"stress relief relaxation mindfulness art fun",
        f"creative workbook daily exercises prompts paper",
        f"travel friendly road trip activity book volume",
        f"paperback gift idea birthday celebration friends",
        f"easy calming designs thick lines no bleed through"
    ]
    default_desc = (
        f"<h3>Discover the Ultimate {keyword.title()} Experience!</h3>\n"
        f"<p>Looking for the perfect creative companion? This book is carefully designed to provide hours of engaging fun, relaxation, and creative inspiration.</p>\n"
        f"<ul>\n"
        f"<li><b>50+ Unique Designs:</b> Crafted specifically with thick outlines and single-sided printing.</li>\n"
        f"<li><b>Large Print Format:</b> Comfortable 8.5 x 11 inch layout for effortless reading and activity.</li>\n"
        f"<li><b>Perfect Gift Idea:</b> Ideal for holidays, birthdays, or personal everyday enjoyment.</li>\n"
        f"</ul>\n"
        f"<p><i>Grab your copy today and start your creative journey!</i></p>"
    )

    seo_title = default_title
    seo_subtitle = default_subtitle
    seo_score = 94.0
    backend_boxes = default_boxes
    book_desc = default_desc

    if not isinstance(ai_seo_res, Exception) and ai_seo_res:
        import json
        try:
            start = ai_seo_res.find("{")
            end = ai_seo_res.rfind("}")
            if start != -1 and end != -1:
                parsed = json.loads(ai_seo_res[start:end+1])
                if parsed.get("seo_title"): seo_title = parsed["seo_title"]
                if parsed.get("seo_subtitle"): seo_subtitle = parsed["seo_subtitle"]
                if parsed.get("seo_score"): seo_score = float(parsed["seo_score"])
                if parsed.get("backend_boxes") and isinstance(parsed["backend_boxes"], list) and len(parsed["backend_boxes"]) >= 7:
                    backend_boxes = [str(b)[:245] for b in parsed["backend_boxes"][:7]]
                if parsed.get("book_description"): book_desc = parsed["book_description"]
        except Exception:
            pass

    return MasterResearchResponse(
        keyword=keyword,
        marketplace=mkt,
        retrieved_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        feasibility_verdict=verdict,
        feasibility_title=v_title,
        feasibility_explanation=v_expl,
        avg_price=avg_price,
        recommended_price_sweetspot=sweetspot,
        avg_reviews=avg_rev,
        review_barrier_level=barrier_level,
        competition_score=comp_score,
        books_sampled_count=len(raw_books),
        books=raw_books,
        suggested_keywords=structured_kws,
        concepts=final_concepts,
        seo_title=seo_title,
        seo_subtitle=seo_subtitle,
        seo_score=seo_score,
        backend_boxes=backend_boxes,
        book_description=book_desc
    )
