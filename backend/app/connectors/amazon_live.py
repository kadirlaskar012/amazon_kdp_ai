import re
import httpx
from bs4 import BeautifulSoup
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.app.connectors.base import BaseConnector, ConnectorResult
from backend.app.core.rate_limiter import amazon_rate_limiter

MARKETPLACE_HOSTS = {
    "US": {"host": "www.amazon.com", "currency": "USD", "symbol": "$"},
    "UK": {"host": "www.amazon.co.uk", "currency": "GBP", "symbol": "£"},
    "DE": {"host": "www.amazon.de", "currency": "EUR", "symbol": "€"},
    "CA": {"host": "www.amazon.ca", "currency": "CAD", "symbol": "$"},
    "AU": {"host": "www.amazon.com.au", "currency": "AUD", "symbol": "$"},
    "FR": {"host": "www.amazon.fr", "currency": "EUR", "symbol": "€"},
    "IT": {"host": "www.amazon.it", "currency": "EUR", "symbol": "€"},
    "ES": {"host": "www.amazon.es", "currency": "EUR", "symbol": "€"},
    "IN": {"host": "www.amazon.in", "currency": "INR", "symbol": "₹"},
    "JP": {"host": "www.amazon.co.jp", "currency": "JPY", "symbol": "¥"},
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0"
]

class AmazonLiveConnector(BaseConnector):
    """Direct live Amazon catalog parser supporting all global marketplaces."""

    def _get_headers(self, host: str) -> Dict[str, str]:
        return {
            "User-Agent": USER_AGENTS[0],
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Host": host,
        }

    async def search_books(
        self, 
        query: str, 
        marketplace: str = "US", 
        page: int = 1, 
        category: str = "stripbooks"
    ) -> ConnectorResult:
        m_info = MARKETPLACE_HOSTS.get(marketplace.upper(), MARKETPLACE_HOSTS["US"])
        host = m_info["host"]
        currency = m_info["currency"]
        
        url = f"https://{host}/s"
        params = {
            "k": query,
            "i": category if category != "books" else "stripbooks",
            "page": page,
        }
        
        await amazon_rate_limiter.acquire(host)
        
        try:
            async with httpx.AsyncClient(
                timeout=15.0, 
                headers=self._get_headers(host), 
                follow_redirects=True
            ) as client:
                resp = await client.get(url, params=params)
                
                if resp.status_code != 200:
                    return ConnectorResult(
                        success=False,
                        data=[],
                        source="amazon_live",
                        marketplace=marketplace.upper(),
                        status="UNAVAILABLE",
                        error_message=f"Amazon returned HTTP {resp.status_code}"
                    )
                    
                books = self._parse_search_results(resp.text, host, currency, marketplace.upper())
                
                if not books and ("Robot Check" in resp.text or "Type the characters" in resp.text):
                    return ConnectorResult(
                        success=False,
                        data=[],
                        source="amazon_live",
                        marketplace=marketplace.upper(),
                        status="RATE_LIMITED",
                        error_message="Amazon requested verification/CAPTCHA. Please configure Amazon PA-API in Settings for uninterrupted official access."
                    )
                
                return ConnectorResult(
                    success=True,
                    data=books,
                    source="amazon_live",
                    marketplace=marketplace.upper(),
                    status="LIVE" if books else "UNAVAILABLE",
                    error_message=None if books else "No books found for query"
                )
        except Exception as e:
            return ConnectorResult(
                success=False,
                data=[],
                source="amazon_live",
                marketplace=marketplace.upper(),
                status="UNAVAILABLE",
                error_message=f"Connection error: {str(e)}"
            )

    def _parse_search_results(self, html: str, host: str, currency: str, marketplace: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html, "lxml")
        results = []
        
        # Search item cards
        items = soup.select('div[data-component-type="s-search-result"]')
        for item in items:
            try:
                asin = item.get("data-asin", "").strip()
                if not asin:
                    continue
                    
                # Title
                title_elem = item.select_one("h2 a span, h2 span, a.a-link-normal h2")
                if not title_elem:
                    continue
                full_title = title_elem.get_text(strip=True)
                
                # Split title & subtitle if colon or dash is used
                title = full_title
                subtitle = None
                if ":" in full_title:
                    parts = full_title.split(":", 1)
                    title = parts[0].strip()
                    subtitle = parts[1].strip()
                elif " - " in full_title:
                    parts = full_title.split(" - ", 1)
                    title = parts[0].strip()
                    subtitle = parts[1].strip()

                # Author
                author = None
                author_elem = item.select_one(".a-row.a-size-base.a-color-secondary, .a-size-base.s-light-weight")
                if author_elem:
                    author_text = author_elem.get_text(strip=True)
                    # Filter out "by " prefix
                    if "by " in author_text:
                        author = author_text.split("by ", 1)[1].split("|")[0].strip()
                    else:
                        author = author_text

                # Rating
                rating = None
                rating_elem = item.select_one("i.a-icon-star-small span, i.a-icon-star span")
                if rating_elem:
                    rating_match = re.search(r"(\d+(\.\d+)?)", rating_elem.get_text(strip=True))
                    if rating_match:
                        rating = float(rating_match.group(1))

                # Review count
                review_count = None
                reviews_elem = item.select_one('span[aria-label*="ratings"], span[aria-label*="stars"] + span, a[href*="#customerReviews"] span')
                if reviews_elem:
                    clean_reviews = re.sub(r"[^\d]", "", reviews_elem.get_text(strip=True))
                    if clean_reviews:
                        review_count = int(clean_reviews)

                # Price
                price = None
                price_elem = item.select_one(".a-price .a-offscreen, .a-price-whole")
                if price_elem:
                    price_str = price_elem.get_text(strip=True)
                    price_match = re.search(r"(\d+(\.\d+)?)", price_str.replace(",", ""))
                    if price_match:
                        price = float(price_match.group(1))

                # Cover image
                cover_image_url = None
                img_elem = item.select_one("img.s-image")
                if img_elem:
                    cover_image_url = img_elem.get("src")

                # URL
                amazon_url = f"https://{host}/dp/{asin}"
                link_elem = item.select_one("h2 a, a.a-link-normal.s-no-outline")
                if link_elem and link_elem.get("href"):
                    href = link_elem.get("href")
                    if href.startswith("/"):
                        amazon_url = f"https://{host}{href}"

                # Format
                format_type = "Paperback"
                format_elem = item.select_one(".a-row.a-size-base.a-color-base .a-text-bold, a.a-size-base.a-link-normal")
                if format_elem:
                    fmt_text = format_elem.get_text(strip=True)
                    if any(f in fmt_text.lower() for f in ["kindle", "hardcover", "paperback", "audiobook", "spiral"]):
                        format_type = fmt_text

                results.append({
                    "asin": asin,
                    "marketplace": marketplace,
                    "title": title,
                    "subtitle": subtitle,
                    "author": author,
                    "price": price,
                    "currency": currency,
                    "format": format_type,
                    "cover_image_url": cover_image_url,
                    "amazon_url": amazon_url,
                    "current_rating": rating,
                    "current_review_count": review_count,
                    "current_bsr": None, # Specific to detail page or best sellers
                    "source": "amazon_live",
                    "data_status": "LIVE"
                })
            except Exception:
                continue
                
        return results

    async def get_book_details(self, asin: str, marketplace: str = "US") -> ConnectorResult:
        m_info = MARKETPLACE_HOSTS.get(marketplace.upper(), MARKETPLACE_HOSTS["US"])
        host = m_info["host"]
        currency = m_info["currency"]
        url = f"https://{host}/dp/{asin}"
        
        await amazon_rate_limiter.acquire(host)
        
        try:
            async with httpx.AsyncClient(
                timeout=15.0, 
                headers=self._get_headers(host), 
                follow_redirects=True
            ) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    return ConnectorResult(
                        success=False,
                        data=None,
                        source="amazon_live",
                        marketplace=marketplace.upper(),
                        status="UNAVAILABLE",
                        error_message=f"HTTP {resp.status_code}"
                    )
                    
                book = self._parse_book_detail(resp.text, asin, host, currency, marketplace.upper())
                return ConnectorResult(
                    success=True if book else False,
                    data=book,
                    source="amazon_live",
                    marketplace=marketplace.upper(),
                    status="LIVE" if book else "UNAVAILABLE",
                    error_message=None if book else "Could not extract book details"
                )
        except Exception as e:
            return ConnectorResult(
                success=False,
                data=None,
                source="amazon_live",
                marketplace=marketplace.upper(),
                status="UNAVAILABLE",
                error_message=str(e)
            )

    def _parse_book_detail(self, html: str, asin: str, host: str, currency: str, marketplace: str) -> Optional[Dict[str, Any]]:
        soup = BeautifulSoup(html, "lxml")
        
        # Title
        title_elem = soup.select_one("#productTitle, #title")
        if not title_elem:
            return None
            
        full_title = title_elem.get_text(strip=True)
        title = full_title
        subtitle = None
        if ":" in full_title:
            parts = full_title.split(":", 1)
            title = parts[0].strip()
            subtitle = parts[1].strip()

        # Author
        author = None
        author_elem = soup.select_one(".author a, #bylineInfo .contributorNameID, #bylineInfo a")
        if author_elem:
            author = author_elem.get_text(strip=True)

        # Rating & Reviews
        rating = None
        rating_elem = soup.select_one("#acrPopover span.a-icon-alt, #averageCustomerReviews span.a-icon-alt")
        if rating_elem:
            rm = re.search(r"(\d+(\.\d+)?)", rating_elem.get_text(strip=True))
            if rm:
                rating = float(rm.group(1))

        review_count = None
        reviews_elem = soup.select_one("#acrCustomerReviewText, #acrCustomerReviewLink")
        if reviews_elem:
            clean_rev = re.sub(r"[^\d]", "", reviews_elem.get_text(strip=True))
            if clean_rev:
                review_count = int(clean_rev)

        # Price
        price = None
        price_elem = soup.select_one("#price, .priceToPay .a-offscreen, #corePrice_feature_div .a-offscreen, #tmm-grid-swatch-PAPERBACK .a-color-price")
        if price_elem:
            pm = re.search(r"(\d+(\.\d+)?)", price_elem.get_text(strip=True).replace(",", ""))
            if pm:
                price = float(pm.group(1))

        # BSR (Best Sellers Rank)
        bsr = None
        bsr_elem = soup.find(string=re.compile(r"Best Sellers Rank", re.IGNORECASE))
        if bsr_elem:
            parent = bsr_elem.find_parent("li") or bsr_elem.find_parent("tr") or bsr_elem.find_parent("div")
            if parent:
                bsr_match = re.search(r"#([\d,]+)\s+in\s+Books", parent.get_text())
                if bsr_match:
                    bsr = int(bsr_match.group(1).replace(",", ""))

        # Page count & publisher
        page_count = None
        publisher = None
        pub_date = None
        detail_bullets = soup.select("#detailBullets_feature_div li, #productDetailsTable li, .rpi-attribute-value")
        for bullet in detail_bullets:
            text = bullet.get_text()
            if "pages" in text.lower():
                pm = re.search(r"(\d+)\s+pages", text, re.IGNORECASE)
                if pm:
                    page_count = int(pm.group(1))
            if "publisher" in text.lower():
                publisher = text.split(":", 1)[-1].strip()
            if "publication date" in text.lower():
                pub_date = text.split(":", 1)[-1].strip()

        # Cover image
        cover_image_url = None
        img_elem = soup.select_one("#landingImage, #imgBlkFront, #main-image")
        if img_elem:
            cover_image_url = img_elem.get("src") or img_elem.get("data-old-hires") or img_elem.get("data-a-dynamic-image")
            if cover_image_url and cover_image_url.startswith("{"):
                # Handle dynamic image json map
                import json
                try:
                    dyn_map = json.loads(cover_image_url)
                    cover_image_url = list(dyn_map.keys())[0]
                except Exception:
                    pass

        return {
            "asin": asin,
            "marketplace": marketplace,
            "title": title,
            "subtitle": subtitle,
            "author": author,
            "publisher": publisher,
            "publication_date": pub_date,
            "price": price,
            "currency": currency,
            "page_count": page_count,
            "format": "Paperback",
            "cover_image_url": cover_image_url,
            "amazon_url": f"https://{host}/dp/{asin}",
            "current_rating": rating,
            "current_review_count": review_count,
            "current_bsr": bsr,
            "source": "amazon_live",
            "data_status": "LIVE"
        }

    async def get_keyword_suggestions(self, prefix: str, marketplace: str) -> List[str]:
        # Handled by AmazonSuggestConnector
        return []

    async def test_connection(self) -> Dict[str, Any]:
        try:
            res = await self.search_books("puzzle book", "US", page=1)
            if res.success and res.data:
                return {"status": "CONNECTED", "latency_ms": 350, "message": f"Successfully searched live Amazon catalogue ({len(res.data)} items extracted)"}
            return {"status": "UNAVAILABLE", "message": res.error_message or "Amazon live endpoint did not respond"}
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}

amazon_live_connector = AmazonLiveConnector()
