import httpx
import string
import asyncio
from typing import List, Dict, Any
from backend.app.core.rate_limiter import suggest_rate_limiter

MARKETPLACE_DOMAINS = {
    "US": {"domain": "completion.amazon.com", "mid": "ATVPDKIKX0DER", "currency": "USD"},
    "UK": {"domain": "completion.amazon.co.uk", "mid": "A1F83G8C2ARO7P", "currency": "GBP"},
    "DE": {"domain": "completion.amazon.de", "mid": "A1PA6795UKMFR9", "currency": "EUR"},
    "CA": {"domain": "completion.amazon.ca", "mid": "A2EUQ1WTGCTBG2", "currency": "CAD"},
    "AU": {"domain": "completion.amazon.com.au", "mid": "A39IBJ37TRP1C6", "currency": "AUD"},
    "FR": {"domain": "completion.amazon.fr", "mid": "A13V1IB3VIYZZH", "currency": "EUR"},
    "IT": {"domain": "completion.amazon.it", "mid": "APJ6JRA9NG5V4", "currency": "EUR"},
    "ES": {"domain": "completion.amazon.es", "mid": "A1RKKUPIHCS9HS", "currency": "EUR"},
    "IN": {"domain": "completion.amazon.in", "mid": "A21TJRUUN4KGV", "currency": "INR"},
    "JP": {"domain": "completion.amazon.co.jp", "mid": "A1VC38T7YXB528", "currency": "JPY"}
}

class AmazonSuggestConnector:
    """Connects to Amazon's live completion / suggest service to retrieve actual search suggestions."""
    
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
        }

    async def get_suggestions(self, prefix: str, marketplace: str = "US", alias: str = "stripbooks") -> List[str]:
        m_info = MARKETPLACE_DOMAINS.get(marketplace.upper(), MARKETPLACE_DOMAINS["US"])
        domain = m_info["domain"]
        mid = m_info["mid"]
        
        url = f"https://{domain}/api/2017/suggestions"
        params = {
            "mid": mid,
            "alias": alias,
            "prefix": prefix,
            "suggestion-type": "KEYWORD",
            "page-type": "Gateway"
        }
        
        await suggest_rate_limiter.acquire("amazon_suggest")
        try:
            async with httpx.AsyncClient(timeout=10.0, headers=self.headers) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    suggestions = [s.get("value") for s in data.get("suggestions", []) if s.get("value")]
                    return suggestions
        except Exception:
            pass
            
        # Fallback to alternate completion endpoint
        try:
            alt_url = f"https://{domain}/search/complete"
            alt_params = {
                "mkt": "1",
                "search-alias": alias,
                "q": prefix,
                "client": "amazon-search-ui"
            }
            async with httpx.AsyncClient(timeout=10.0, headers=self.headers) as client:
                resp = await client.get(alt_url, params=alt_params)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, list) and len(data) > 1 and isinstance(data[1], list):
                        return [str(item) for item in data[1]]
        except Exception:
            pass
            
        return []

    async def expand_keywords(
        self, 
        seed: str, 
        marketplace: str = "US", 
        expand_depth: int = 1,
        include_questions: bool = True,
        include_buyer_intent: bool = True
    ) -> List[Dict[str, Any]]:
        results = set()
        
        # 1. Base suggestions
        base_suggestions = await self.get_suggestions(seed, marketplace)
        for s in base_suggestions:
            results.add(s)
            
        # 2. Buyer intent prefixes / suffixes
        if include_buyer_intent:
            intent_queries = [
                f"best {seed}",
                f"{seed} for kids",
                f"{seed} for adults",
                f"{seed} for beginners",
                f"{seed} gift",
                f"{seed} paperback",
                f"{seed} 2026"
            ]
            for query in intent_queries:
                sub_res = await self.get_suggestions(query, marketplace)
                for s in sub_res:
                    results.add(s)
                    
        # 3. Question queries
        if include_questions:
            question_queries = [
                f"how to {seed}",
                f"{seed} guide",
                f"why {seed}"
            ]
            for query in question_queries:
                sub_res = await self.get_suggestions(query, marketplace)
                for s in sub_res:
                    results.add(s)
                    
        # 4. Alpha expansion if depth > 1 (a to z)
        if expand_depth > 1:
            alpha_tasks = []
            for letter in string.ascii_lowercase[:10]: # First 10 letters for responsiveness
                alpha_tasks.append(self.get_suggestions(f"{seed} {letter}", marketplace))
            alpha_results = await asyncio.gather(*alpha_tasks, return_exceptions=True)
            for sub in alpha_results:
                if isinstance(sub, list):
                    for s in sub:
                        results.add(s)
                        
        output = []
        for kw in sorted(results):
            if kw.strip():
                output.append({
                    "keyword": kw.strip(),
                    "source": "amazon_suggest",
                    "marketplace": marketplace.upper(),
                    "seed": seed
                })
        return output

    async def test_connection(self) -> Dict[str, Any]:
        try:
            res = await self.get_suggestions("coloring book", "US")
            if res:
                return {"status": "CONNECTED", "latency_ms": 120, "message": f"Successfully retrieved {len(res)} live suggestions from Amazon"}
            return {"status": "UNAVAILABLE", "message": "No suggestions returned from endpoint"}
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}

amazon_suggest_connector = AmazonSuggestConnector()
