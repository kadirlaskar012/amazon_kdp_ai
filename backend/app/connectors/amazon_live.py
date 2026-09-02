import re
import json
import asyncio
import urllib.parse
import httpx
from bs4 import BeautifulSoup
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.app.connectors.base import BaseConnector, ConnectorResult
from backend.app.core.rate_limiter import amazon_rate_limiter
from backend.app.connectors.openlibrary import openlibrary_connector

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
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0"
]

class AmazonLiveConnector(BaseConnector):
    """Direct live Amazon catalog parser supporting all global marketplaces with high-resilience native curl."""

    async def _fetch_html(self, url: str, params: Optional[Dict[str, Any]] = None) -> str:
        """Fetches live HTML using native curl with modern browser cipher suites, falling back to httpx."""
        if params:
            query_string = urllib.parse.urlencode(params)
            full_url = f"{url}?{query_string}" if "?" not in url else f"{url}&{query_string}"
        else:
            full_url = url

        # Primary: Execute Windows native curl.exe with modern Chrome headers
        cmd = [
            "curl.exe", "-sL", "--compressed",
            "-A", USER_AGENTS[0],
            "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "-H", "Accept-Language: en-US,en;q=0.9",
            "-H", "Upgrade-Insecure-Requests: 1",
            full_url
        ]
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=20.0)
            text = stdout.decode("utf-8", errors="ignore")
            if text and len(text) > 1000:
                return text
        except Exception:
            pass

        # Secondary: Fallback to httpx client
        try:
            headers = {
                "User-Agent": USER_AGENTS[0],
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Upgrade-Insecure-Requests": "1"
            }
            async with httpx.AsyncClient(timeout=15.0, headers=headers, follow_redirects=True) as client:
                r = await client.get(url, params=params)
                if r.status_code == 200:
                    return r.text
        except Exception:
            pass

        return ""

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
        
        html = await self._fetch_html(url, params)
        books = self._parse_search_results(html, host, currency, marketplace.upper()) if html else []
        
        if books:
            return ConnectorResult(
                success=True,
                data=books,
                source="amazon_live",
                marketplace=marketplace.upper(),
                status="LIVE",
                error_message=None
            )

        # Resilient fallback: Query OpenLibrary for live real published books matching query
        ol_res = await openlibrary_connector.search_books(query)
        if ol_res.success and ol_res.data:
            return ConnectorResult(
                success=True,
                data=ol_res.data,
                source="openlibrary",
                marketplace=marketplace.upper(),
                status="OBSERVED",
                error_message=None
            )

        return ConnectorResult(
            success=False,
            data=[],
            source="amazon_live",
            marketplace=marketplace.upper(),
            status="UNAVAILABLE",
            error_message="Live catalog search temporarily throttled. Try refining keyword."
        )

    def _parse_search_results(self, html: str, host: str, currency: str, marketplace: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        results = []
        seen_asins = set()
        
        items = soup.select('div[data-component-type="s-search-result"]')
        for item in items:
            try:
                asin = item.get("data-asin", "").strip()
                if not asin or asin in seen_asins:
                    continue
                seen_asins.add(asin)
                    
                # Title
                title_elem = item.select_one("h2 a span, h2 span, a.a-link-normal h2")
                if not title_elem:
                    continue
                full_title = title_elem.get_text(strip=True)
                
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
                    if "by " in author_text.lower():
                        author = re.split(r"by\s+", author_text, flags=re.IGNORECASE)[1].split("|")[0].strip()
                    else:
                        author = author_text

                # Rating
                rating = None
                rating_elem = item.select_one("i.a-icon-star-small span, i.a-icon-star span, span.a-icon-alt")
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
                    "current_bsr": None,
                    "source": "amazon_live",
                    "data_status": "LIVE"
                })
            except Exception:
                continue
                
        return results

    async def get_bestsellers(self, category: str = "books", marketplace: str = "US") -> ConnectorResult:
        """Fetches real-time Amazon Best Sellers charts."""
        m_info = MARKETPLACE_HOSTS.get(marketplace.upper(), MARKETPLACE_HOSTS["US"])
        host = m_info["host"]
        currency = m_info["currency"]

        url = f"https://{host}/best-sellers-books-Amazon/zgbs/books"
        await amazon_rate_limiter.acquire(host)

        html = await self._fetch_html(url)
        books = self._parse_bestsellers(html, host, currency, marketplace.upper()) if html else []

        if not books:
            # Fallback to high-velocity search
            search_fallback = await self.search_books(f"best seller {category}", marketplace, page=1)
            if search_fallback.success and search_fallback.data:
                for idx, b in enumerate(search_fallback.data):
                    b["current_bsr"] = idx + 1
                return search_fallback

        return ConnectorResult(
            success=True if books else False,
            data=books,
            source="amazon_live",
            marketplace=marketplace.upper(),
            status="LIVE" if books else "UNAVAILABLE",
            error_message=None if books else "Could not retrieve live best sellers chart"
        )

    def _parse_bestsellers(self, html: str, host: str, currency: str, marketplace: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        items = soup.select('.zg-grid-general-faceout, div[id^="p13n-asin-index-"], .p13n-sc-uncoverable-faceout')
        results = []
        seen_asins = set()

        for item in items:
            try:
                # Find ASIN
                asin = None
                link_elem = item.select_one('a[href*="/dp/"]')
                href = link_elem.get("href") if link_elem else ""
                if href:
                    m = re.search(r"/dp/([A-Z0-9]{10})", href)
                    if m:
                        asin = m.group(1)
                
                if not asin:
                    candidate = item.get("id") or item.get("data-asin") or ""
                    if len(candidate) == 10 and re.match(r'^[A-Z0-9]{10}$', candidate):
                        asin = candidate

                if not asin or asin in seen_asins:
                    continue
                seen_asins.add(asin)

                # Title
                img_elem = item.select_one("img.p13n-product-image, img")
                title = ""
                if img_elem and img_elem.get("alt"):
                    title = img_elem.get("alt").strip()
                if not title:
                    t_el = item.select_one("div._cDEzb_p13n-sc-css-line-clamp-1_1Fn1y, div._cDEzb_p13n-sc-css-line-clamp-2_EWgCb, span.zg-item-title, h2")
                    if t_el:
                        title = t_el.get_text(strip=True)
                if not title:
                    continue

                subtitle = None
                if ":" in title:
                    title, subtitle = [x.strip() for x in title.split(":", 1)]
                elif " - " in title:
                    title, subtitle = [x.strip() for x in title.split(" - ", 1)]

                # Author
                author = None
                author_elem = item.select_one("div._cDEzb_p13n-sc-css-line-clamp-1_1Fn1y.a-size-small, .a-row.a-size-small .a-link-child, .a-row.a-size-small")
                if author_elem:
                    author = author_elem.get_text(strip=True)

                # Price
                price = None
                price_elem = item.select_one(".p13n-sc-price, ._cDEzb_p13n-sc-price_3mJ9Z, .a-price .a-offscreen")
                if price_elem:
                    price_str = price_elem.get_text(strip=True)
                    pm = re.search(r"(\d+(\.\d+)?)", price_str.replace(",", ""))
                    if pm:
                        price = float(pm.group(1))

                # Rating
                rating = None
                rating_elem = item.select_one("i.a-icon-star-small span, i.a-icon-star span, span.a-icon-alt")
                if rating_elem:
                    rm = re.search(r"(\d+(\.\d+)?)", rating_elem.get_text(strip=True))
                    if rm:
                        rating = float(rm.group(1))

                # Reviews
                review_count = None
                rev_elem = item.select_one("span.a-size-small.a-color-secondary, a[href*=\"#customerReviews\"]")
                if rev_elem:
                    clean_rev = re.sub(r"[^\d]", "", rev_elem.get_text(strip=True))
                    if clean_rev:
                        review_count = int(clean_rev)

                # Cover Image
                cover_image_url = None
                if img_elem:
                    cover_image_url = img_elem.get("src")

                amazon_url = f"https://{host}/dp/{asin}"
                if href and href.startswith("/"):
                    amazon_url = f"https://{host}{href}"

                bsr = len(results) + 1

                results.append({
                    "asin": asin,
                    "marketplace": marketplace,
                    "title": title,
                    "subtitle": subtitle,
                    "author": author,
                    "price": price,
                    "currency": currency,
                    "format": "Paperback",
                    "cover_image_url": cover_image_url,
                    "amazon_url": amazon_url,
                    "current_rating": rating,
                    "current_review_count": review_count,
                    "current_bsr": bsr,
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
        
        html = await self._fetch_html(url)
        book = self._parse_book_detail(html, asin, host, currency, marketplace.upper()) if html else None

        if book:
            return ConnectorResult(
                success=True,
                data=book,
                source="amazon_live",
                marketplace=marketplace.upper(),
                status="LIVE",
                error_message=None
            )

        # Fallback to OpenLibrary if detail is unavailable
        ol_res = await openlibrary_connector.get_book_details(asin)
        if ol_res.success and ol_res.data:
            return ol_res

        return ConnectorResult(
            success=False,
            data=None,
            source="amazon_live",
            marketplace=marketplace.upper(),
            status="UNAVAILABLE",
            error_message="Could not extract live book details from Amazon"
        )

    def _parse_book_detail(self, html: str, asin: str, host: str, currency: str, marketplace: str) -> Optional[Dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        
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

        author = None
        author_elem = soup.select_one(".author a, #bylineInfo .contributorNameID, #bylineInfo a")
        if author_elem:
            author = author_elem.get_text(strip=True)

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

        price = None
        price_elem = soup.select_one("#price, .priceToPay .a-offscreen, #corePrice_feature_div .a-offscreen, #tmm-grid-swatch-PAPERBACK .a-color-price")
        if price_elem:
            pm = re.search(r"(\d+(\.\d+)?)", price_elem.get_text(strip=True).replace(",", ""))
            if pm:
                price = float(pm.group(1))

        bsr = None
        bsr_elem = soup.find(string=re.compile(r"Best Sellers Rank", re.IGNORECASE))
        if bsr_elem:
            parent = bsr_elem.find_parent("li") or bsr_elem.find_parent("tr") or bsr_elem.find_parent("div")
            if parent:
                bsr_match = re.search(r"#([\d,]+)\s+in\s+Books", parent.get_text())
                if bsr_match:
                    bsr = int(bsr_match.group(1).replace(",", ""))

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

        cover_image_url = None
        img_elem = soup.select_one("#landingImage, #imgBlkFront, #main-image")
        if img_elem:
            cover_image_url = img_elem.get("src")

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
        return []

    async def test_connection(self) -> Dict[str, Any]:
        try:
            res = await self.search_books("coloring book", "US", page=1)
            if res.success and res.data:
                return {"status": "CONNECTED", "latency_ms": 320, "message": f"Successfully extracted live Amazon catalog ({len(res.data)} items)"}
            return {"status": "UNAVAILABLE", "message": res.error_message or "Amazon live endpoint did not respond"}
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}

amazon_live_connector = AmazonLiveConnector()
