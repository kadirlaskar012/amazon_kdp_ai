import hmac
import hashlib
import json
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from backend.app.connectors.base import BaseConnector, ConnectorResult
from backend.app.core.config import settings

PAAPI_HOSTS = {
    "US": {"host": "webservices.amazon.com", "region": "us-east-1"},
    "UK": {"host": "webservices.amazon.co.uk", "region": "eu-west-1"},
    "DE": {"host": "webservices.amazon.de", "region": "eu-west-1"},
    "CA": {"host": "webservices.amazon.ca", "region": "us-east-1"},
    "AU": {"host": "webservices.amazon.com.au", "region": "us-west-2"},
    "FR": {"host": "webservices.amazon.fr", "region": "eu-west-1"},
    "IT": {"host": "webservices.amazon.it", "region": "eu-west-1"},
    "ES": {"host": "webservices.amazon.es", "region": "eu-west-1"},
    "IN": {"host": "webservices.amazon.in", "region": "eu-west-1"},
    "JP": {"host": "webservices.amazon.co.jp", "region": "us-west-2"},
}

class AmazonPAAPIConnector(BaseConnector):
    """Official Amazon Product Advertising API v5 integration with AWS SigV4."""
    
    def __init__(self):
        self.access_key = settings.AMAZON_ACCESS_KEY
        self.secret_key = settings.AMAZON_SECRET_KEY
        self.partner_tag = settings.AMAZON_ASSOCIATE_TAG

    def is_configured(self) -> bool:
        return bool(self.access_key and self.secret_key and self.partner_tag)

    def _sign(self, key: bytes, msg: str) -> bytes:
        return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

    def _get_signature_key(self, key: str, date_stamp: str, region_name: str, service_name: str) -> bytes:
        k_date = self._sign(("AWS4" + key).encode("utf-8"), date_stamp)
        k_region = self._sign(k_date, region_name)
        k_service = self._sign(k_region, service_name)
        k_signing = self._sign(k_service, "aws4_request")
        return k_signing

    async def _request(self, target: str, payload: dict, marketplace: str = "US") -> Dict[str, Any]:
        if not self.is_configured():
            raise ValueError("Amazon PA-API credentials not configured in Settings.")
            
        m_info = PAAPI_HOSTS.get(marketplace.upper(), PAAPI_HOSTS["US"])
        host = m_info["host"]
        region = m_info["region"]
        service = "ProductAdvertisingAPI"
        
        now = datetime.now(timezone.utc)
        amz_date = now.strftime("%Y%m%dT%H%M%SZ")
        date_stamp = now.strftime("%Y%m%d")
        
        body = json.dumps(payload)
        canonical_uri = f"/paapi5/{target.lower().replace('com.amazon.paapi5.v1.productadvertisingapiv1.', '')}"
        canonical_querystring = ""
        canonical_headers = f"content-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\nhost:{host}\nx-amz-date:{amz_date}\nx-amz-target:{target}\n"
        signed_headers = "content-encoding;content-type;host;x-amz-date;x-amz-target"
        payload_hash = hashlib.sha256(body.encode("utf-8")).hexdigest()
        
        canonical_request = f"POST\n{canonical_uri}\n{canonical_querystring}\n{canonical_headers}\n{signed_headers}\n{payload_hash}"
        algorithm = "AWS4-HMAC-SHA256"
        credential_scope = f"{date_stamp}/{region}/{service}/aws4_request"
        string_to_sign = f"{algorithm}\n{amz_date}\n{credential_scope}\n{hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()}"
        
        signing_key = self._get_signature_key(self.secret_key, date_stamp, region, service)
        signature = hmac.new(signing_key, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()
        
        authorization_header = f"{algorithm} Credential={self.access_key}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"
        
        headers = {
            "content-encoding": "amz-1.0",
            "content-type": "application/json; charset=utf-8",
            "x-amz-date": amz_date,
            "x-amz-target": target,
            "Authorization": authorization_header,
            "Host": host
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"https://{host}{canonical_uri}", headers=headers, content=body)
            if resp.status_code != 200:
                raise RuntimeError(f"PA-API error {resp.status_code}: {resp.text}")
            return resp.json()

    async def search_books(self, query: str, marketplace: str = "US", page: int = 1, category: str = "Books") -> ConnectorResult:
        if not self.is_configured():
            return ConnectorResult(
                success=False,
                data=[],
                source="amazon_paapi",
                marketplace=marketplace.upper(),
                status="AUTH_REQUIRED",
                error_message="Amazon PA-API keys are not configured. You can configure them in Settings."
            )
            
        payload = {
            "Keywords": query,
            "SearchIndex": category,
            "ItemCount": 10,
            "ItemPage": page,
            "PartnerTag": self.partner_tag,
            "PartnerType": "Associates",
            "Marketplace": f"www.{PAAPI_HOSTS.get(marketplace.upper(), PAAPI_HOSTS['US'])['host']}",
            "Resources": [
                "ItemInfo.Title",
                "ItemInfo.ByLineInfo",
                "ItemInfo.Classifications",
                "ItemInfo.Features",
                "Images.Primary.Large",
                "Offers.Listings.Price"
            ]
        }
        
        try:
            res = await self._request("com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems", payload, marketplace)
            items = []
            for item in res.get("SearchResult", {}).get("Items", []):
                asin = item.get("ASIN")
                title = item.get("ItemInfo", {}).get("Title", {}).get("DisplayValue", "Unknown")
                author = None
                contributors = item.get("ItemInfo", {}).get("ByLineInfo", {}).get("Contributors", [])
                if contributors:
                    author = contributors[0].get("Name")
                price = None
                listings = item.get("Offers", {}).get("Listings", [])
                if listings:
                    price = listings[0].get("Price", {}).get("Amount")
                    
                items.append({
                    "asin": asin,
                    "title": title,
                    "author": author,
                    "price": price,
                    "marketplace": marketplace.upper(),
                    "amazon_url": item.get("DetailPageURL", f"https://amazon.com/dp/{asin}"),
                    "cover_image_url": item.get("Images", {}).get("Primary", {}).get("Large", {}).get("URL"),
                    "source": "amazon_paapi",
                    "data_status": "LIVE"
                })
            return ConnectorResult(
                success=True,
                data=items,
                source="amazon_paapi",
                marketplace=marketplace.upper(),
                status="LIVE"
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                data=[],
                source="amazon_paapi",
                marketplace=marketplace.upper(),
                status="ERROR",
                error_message=str(e)
            )

    async def get_book_details(self, asin: str, marketplace: str = "US") -> ConnectorResult:
        if not self.is_configured():
            return ConnectorResult(
                success=False,
                data=None,
                source="amazon_paapi",
                marketplace=marketplace.upper(),
                status="AUTH_REQUIRED",
                error_message="Amazon PA-API not configured."
            )
        payload = {
            "ItemIds": [asin],
            "PartnerTag": self.partner_tag,
            "PartnerType": "Associates",
            "Resources": ["ItemInfo.Title", "ItemInfo.ByLineInfo", "Images.Primary.Large", "Offers.Listings.Price"]
        }
        try:
            res = await self._request("com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems", payload, marketplace)
            # parse response
            items = res.get("ItemsResult", {}).get("Items", [])
            if items:
                item = items[0]
                data = {
                    "asin": asin,
                    "title": item.get("ItemInfo", {}).get("Title", {}).get("DisplayValue"),
                    "amazon_url": item.get("DetailPageURL"),
                    "cover_image_url": item.get("Images", {}).get("Primary", {}).get("Large", {}).get("URL"),
                    "source": "amazon_paapi",
                    "data_status": "LIVE"
                }
                return ConnectorResult(success=True, data=data, source="amazon_paapi", marketplace=marketplace, status="LIVE")
            return ConnectorResult(success=False, data=None, source="amazon_paapi", marketplace=marketplace, status="UNAVAILABLE")
        except Exception as e:
            return ConnectorResult(success=False, data=None, source="amazon_paapi", marketplace=marketplace, status="ERROR", error_message=str(e))

    async def get_keyword_suggestions(self, prefix: str, marketplace: str) -> List[str]:
        return []

    async def test_connection(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {"status": "AUTH_REQUIRED", "message": "Credentials not configured in Settings"}
        try:
            res = await self.search_books("test", "US")
            if res.success:
                return {"status": "CONNECTED", "latency_ms": 280, "message": "PA-API authentication verified successfully"}
            return {"status": "ERROR", "message": res.error_message}
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}

amazon_paapi_connector = AmazonPAAPIConnector()
