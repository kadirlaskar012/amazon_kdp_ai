from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class ConnectorResult(BaseModel):
    success: bool
    data: Any
    source: str
    marketplace: str
    status: str # 'LIVE', 'CACHED', 'UNAVAILABLE', 'RATE_LIMITED'
    error_message: Optional[str] = None
    retrieved_at: datetime = datetime.utcnow()

class BaseConnector(ABC):
    @abstractmethod
    async def search_books(self, query: str, marketplace: str, page: int = 1, category: str = "books") -> ConnectorResult:
        pass

    @abstractmethod
    async def get_book_details(self, asin: str, marketplace: str) -> ConnectorResult:
        pass

    @abstractmethod
    async def get_keyword_suggestions(self, prefix: str, marketplace: str) -> List[str]:
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        pass
