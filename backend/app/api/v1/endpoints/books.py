import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.core.database import get_db
from backend.app.models.db_models import Book, BookObservation, SearchHistory
from backend.app.models.schemas import (
    BookSchema, BookSearchResponse, BookDetailResponse, BookObservationSchema
)
from backend.app.connectors.amazon_live import amazon_live_connector
from backend.app.connectors.amazon_paapi import amazon_paapi_connector
from backend.app.engines.opportunity_engine import opportunity_engine
from backend.app.ai.prompt_templates import prompt_templates

router = APIRouter()

@router.get("/search", response_model=BookSearchResponse)
async def search_books(
    query: str,
    marketplace: str = "US",
    category: str = "books",
    page: int = 1,
    min_bsr: Optional[int] = None,
    max_bsr: Optional[int] = None,
    min_reviews: Optional[int] = None,
    max_reviews: Optional[int] = None,
    min_rating: Optional[float] = None,
    max_rating: Optional[float] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: AsyncSession = Depends(get_db)
):
    # Try PA-API first if configured, else use live connector
    conn_res = None
    if amazon_paapi_connector.is_configured():
        pa_res = await amazon_paapi_connector.search_books(query, marketplace=marketplace, page=page)
        if pa_res.success and pa_res.data:
            conn_res = pa_res
            
    if not conn_res or not conn_res.success:
        conn_res = await amazon_live_connector.search_books(query, marketplace=marketplace, page=page, category=category)

    books_raw = conn_res.data if conn_res and isinstance(conn_res.data, list) else []
    
    # Save search query in history
    history = SearchHistory(query=query, query_type="BOOK_SEARCH", marketplace=marketplace, results_count=len(books_raw))
    db.add(history)
    
    filtered_books = []
    prices = []
    reviews_list = []
    bsrs = []

    for b in books_raw:
        # Filter checks
        p = b.get("price")
        r = b.get("current_rating")
        rev = b.get("current_review_count")
        bsr = b.get("current_bsr")

        if min_price is not None and (p is None or p < min_price): continue
        if max_price is not None and (p is None or p > max_price): continue
        if min_rating is not None and (r is None or r < min_rating): continue
        if max_rating is not None and (r is None or r > max_rating): continue
        if min_reviews is not None and (rev is None or rev < min_reviews): continue
        if max_reviews is not None and (rev is None or rev > max_reviews): continue
        if min_bsr is not None and (bsr is None or bsr < min_bsr): continue
        if max_bsr is not None and (bsr is None or bsr > max_bsr): continue

        if p: prices.append(p)
        if rev: reviews_list.append(rev)
        if bsr: bsrs.append(bsr)

        # Estimate monthly sales if BSR present
        if bsr:
            est = opportunity_engine.estimate_monthly_sales_from_bsr(bsr, marketplace)
            b["estimated_monthly_sales"] = est["estimated_monthly_sales"]
            if p and est["estimated_monthly_sales"]:
                b["estimated_monthly_revenue"] = round(p * est["estimated_monthly_sales"], 2)

        # Upsert book record to local database & record observation
        asin = b.get("asin")
        if asin:
            book_obj = await db.get(Book, asin)
            if not book_obj:
                book_obj = Book(
                    asin=asin,
                    marketplace=marketplace.upper(),
                    title=b.get("title", "Unknown"),
                    subtitle=b.get("subtitle"),
                    author=b.get("author"),
                    price=p,
                    currency=b.get("currency", "USD"),
                    format=b.get("format", "Paperback"),
                    cover_image_url=b.get("cover_image_url"),
                    amazon_url=b.get("amazon_url", f"https://amazon.com/dp/{asin}"),
                    current_rating=r,
                    current_review_count=rev,
                    current_bsr=bsr
                )
                db.add(book_obj)
            else:
                book_obj.current_rating = r or book_obj.current_rating
                book_obj.current_review_count = rev or book_obj.current_review_count
                book_obj.current_bsr = bsr or book_obj.current_bsr
                book_obj.price = p or book_obj.price

            # Add time-series observation
            obs = BookObservation(
                asin=asin,
                marketplace=marketplace.upper(),
                source=conn_res.source,
                data_type="OBSERVED",
                bsr=bsr,
                price=p,
                rating=r,
                review_count=rev,
                retrieved_at=datetime.utcnow()
            )
            db.add(obs)

        filtered_books.append(BookSchema(**b))

    await db.commit()

    avg_p = round(sum(prices) / len(prices), 2) if prices else None
    avg_rev = round(sum(reviews_list) / len(reviews_list), 1) if reviews_list else None
    avg_b = int(sum(bsrs) / len(bsrs)) if bsrs else None

    return BookSearchResponse(
        query=query,
        marketplace=marketplace.upper(),
        total_results=len(filtered_books),
        results=filtered_books,
        source=conn_res.source if conn_res else "amazon_live",
        data_status=conn_res.status if conn_res else "UNAVAILABLE",
        avg_price=avg_p,
        avg_reviews=avg_rev,
        avg_bsr=avg_b
    )

@router.get("/bestsellers", response_model=BookSearchResponse)
async def get_bestsellers(
    category: str = "coloring books",
    marketplace: str = "US",
    db: AsyncSession = Depends(get_db)
):
    # Try live bestsellers chart first
    bs_res = await amazon_live_connector.get_bestsellers(category=category, marketplace=marketplace)
    books_raw = bs_res.data if bs_res.success and bs_res.data else []
    
    if not books_raw:
        return await search_books(
            query=f"best sellers {category}",
            marketplace=marketplace,
            category="books",
            db=db
        )
        
    prices = [b["price"] for b in books_raw if b.get("price")]
    reviews = [b["current_review_count"] for b in books_raw if b.get("current_review_count")]
    bsrs = [b["current_bsr"] for b in books_raw if b.get("current_bsr")]
    
    for b in books_raw:
        asin = b.get("asin")
        if asin:
            book_obj = await db.get(Book, asin)
            if not book_obj:
                book_obj = Book(
                    asin=asin,
                    marketplace=marketplace.upper(),
                    title=b.get("title", "Unknown"),
                    subtitle=b.get("subtitle"),
                    author=b.get("author"),
                    price=b.get("price"),
                    currency=b.get("currency", "USD"),
                    format=b.get("format", "Paperback"),
                    cover_image_url=b.get("cover_image_url"),
                    amazon_url=b.get("amazon_url", f"https://amazon.com/dp/{asin}"),
                    current_rating=b.get("current_rating"),
                    current_review_count=b.get("current_review_count"),
                    current_bsr=b.get("current_bsr"),
                )
                db.add(book_obj)
            else:
                book_obj.current_bsr = b.get("current_bsr") or book_obj.current_bsr
                book_obj.current_rating = b.get("current_rating") or book_obj.current_rating
                book_obj.current_review_count = b.get("current_review_count") or book_obj.current_review_count
    await db.commit()

    book_schemas = []
    for b in books_raw:
        try:
            book_schemas.append(BookSchema(**b))
        except Exception:
            pass

    return BookSearchResponse(
        query=f"Best Sellers in {category}",
        marketplace=marketplace.upper(),
        total_results=len(book_schemas),
        results=book_schemas,
        avg_price=round(float(sum(prices)/len(prices)), 2) if prices else None,
        avg_reviews=float(round(sum(reviews)/len(reviews), 1)) if reviews else None,
        avg_bsr=int(sum(bsrs)/len(bsrs)) if bsrs else None,
        median_reviews=float(sorted(reviews)[len(reviews)//2]) if reviews else None,
        source="amazon_live",
        data_status="LIVE"
    )

@router.get("/{asin}", response_model=BookDetailResponse)
async def get_book_details(
    asin: str,
    marketplace: str = "US",
    db: AsyncSession = Depends(get_db)
):
    # Try fetching fresh live details
    detail_res = await amazon_live_connector.get_book_details(asin, marketplace)
    book_dict = detail_res.data if detail_res.success and detail_res.data else None
    
    # Check DB if live unavailable
    book_db = await db.get(Book, asin)
    if not book_dict and not book_db:
        raise HTTPException(status_code=404, detail="Book not found and live Amazon detail unavailable.")

    if not book_dict and book_db:
        book_dict = {
            "asin": book_db.asin,
            "marketplace": book_db.marketplace,
            "title": book_db.title,
            "subtitle": book_db.subtitle,
            "author": book_db.author,
            "publisher": book_db.publisher,
            "publication_date": book_db.publication_date,
            "isbn": book_db.isbn,
            "price": book_db.price,
            "currency": book_db.currency,
            "format": book_db.format,
            "page_count": book_db.page_count,
            "cover_image_url": book_db.cover_image_url,
            "amazon_url": book_db.amazon_url,
            "current_bsr": book_db.current_bsr,
            "current_rating": book_db.current_rating,
            "current_review_count": book_db.current_review_count,
            "is_tracked": book_db.is_tracked,
            "data_status": "CACHED",
            "source": "local_database"
        }
    else:
        # Update / store in DB
        if not book_db:
            book_db = Book(
                asin=asin,
                marketplace=marketplace.upper(),
                title=book_dict.get("title", ""),
                subtitle=book_dict.get("subtitle"),
                author=book_dict.get("author"),
                publisher=book_dict.get("publisher"),
                publication_date=book_dict.get("publication_date"),
                price=book_dict.get("price"),
                currency=book_dict.get("currency", "USD"),
                page_count=book_dict.get("page_count"),
                cover_image_url=book_dict.get("cover_image_url"),
                amazon_url=book_dict.get("amazon_url", f"https://amazon.com/dp/{asin}"),
                current_bsr=book_dict.get("current_bsr"),
                current_rating=book_dict.get("current_rating"),
                current_review_count=book_dict.get("current_review_count")
            )
            db.add(book_db)
        else:
            book_db.current_bsr = book_dict.get("current_bsr") or book_db.current_bsr
            book_db.current_rating = book_dict.get("current_rating") or book_db.current_rating
            book_db.current_review_count = book_dict.get("current_review_count") or book_db.current_review_count
            book_db.price = book_dict.get("price") or book_db.price
            
        # Record observation
        obs = BookObservation(
            asin=asin,
            marketplace=marketplace.upper(),
            source="amazon_live",
            data_type="OBSERVED",
            bsr=book_dict.get("current_bsr"),
            price=book_dict.get("price"),
            rating=book_dict.get("current_rating"),
            review_count=book_dict.get("current_review_count")
        )
        db.add(obs)
        await db.commit()

    # Query all historical observations
    stmt = select(BookObservation).where(BookObservation.asin == asin).order_by(desc(BookObservation.retrieved_at)).limit(30)
    obs_res = await db.execute(stmt)
    observations = obs_res.scalars().all()

    # Determine competitor strength
    rev_cnt = book_dict.get("current_review_count") or 0
    if rev_cnt > 1000:
        strength = "DOMINANT"
    elif rev_cnt > 300:
        strength = "HIGH"
    elif rev_cnt > 50:
        strength = "MEDIUM"
    else:
        strength = "LOW"

    # AI listing analysis
    ai_analysis = await prompt_templates.analyze_book_detail(book_dict)

    return BookDetailResponse(
        book=BookSchema(**book_dict),
        observations=[BookObservationSchema.from_orm(o) for o in observations],
        competitor_strength=strength,
        ai_analysis=ai_analysis
    )

@router.post("/{asin}/track")
async def toggle_book_tracking(
    asin: str,
    db: AsyncSession = Depends(get_db)
):
    book = await db.get(Book, asin)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found in database.")
    book.is_tracked = not book.is_tracked
    await db.commit()
    return {"asin": asin, "is_tracked": book.is_tracked}
