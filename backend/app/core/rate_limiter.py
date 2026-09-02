import asyncio
import time
from typing import Dict

class RateLimiter:
    """Token-bucket style rate limiter per domain/connector."""
    def __init__(self, max_calls_per_minute: int = 15):
        self.interval = 60.0 / max_calls_per_minute
        self.last_call: Dict[str, float] = {}
        self.locks: Dict[str, asyncio.Lock] = {}

    async def acquire(self, domain: str = "default"):
        if domain not in self.locks:
            self.locks[domain] = asyncio.Lock()

        async with self.locks[domain]:
            now = time.time()
            elapsed = now - self.last_call.get(domain, 0.0)
            if elapsed < self.interval:
                wait_time = self.interval - elapsed
                await asyncio.sleep(wait_time)
            self.last_call[domain] = time.time()

# Global instances for connectors
amazon_rate_limiter = RateLimiter(max_calls_per_minute=20)
trends_rate_limiter = RateLimiter(max_calls_per_minute=10)
suggest_rate_limiter = RateLimiter(max_calls_per_minute=30)
