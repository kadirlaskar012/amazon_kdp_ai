import httpx
from typing import Optional, Dict, Any
from backend.app.core.config import settings

class OpenAIClient:
    """Client for OpenAI or any OpenAI-compatible local/remote endpoint (LM Studio, vLLM, Groq, OpenRouter)."""

    def __init__(self, api_key: str = None, base_url: str = None, model: str = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.base_url = (base_url or settings.OPENAI_BASE_URL or "https://api.openai.com/v1").rstrip("/")
        self.model = model or settings.OPENAI_MODEL or "gpt-4o-mini"

    def is_configured(self) -> bool:
        return bool(self.api_key or "localhost" in self.base_url or "127.0.0.1" in self.base_url)

    async def check_health(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "status": "AUTH_REQUIRED",
                "message": "OpenAI / compatible API Key not configured in Settings."
            }
        try:
            headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
            async with httpx.AsyncClient(timeout=6.0, headers=headers) as client:
                resp = await client.get(f"{self.base_url}/models")
                if resp.status_code == 200:
                    return {"status": "CONNECTED", "message": "Connected to OpenAI-compatible endpoint successfully."}
            return {"status": "ERROR", "message": "API endpoint returned non-200 status."}
        except Exception as e:
            return {"status": "DISCONNECTED", "message": str(e)}

    async def generate_response(self, prompt: str, system_prompt: str = "", model: str = None, temperature: float = 0.7) -> Optional[str]:
        if not self.is_configured():
            return None
            
        target_model = model or self.model
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}" if self.api_key else ""
        }
        payload = {
            "model": target_model,
            "messages": [
                {"role": "system", "content": system_prompt or "You are an expert Amazon KDP intelligence strategist. Analyze factual data accurately and never invent fake Amazon metrics."},
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature
        }
        try:
            async with httpx.AsyncClient(timeout=45.0, headers=headers) as client:
                resp = await client.post(f"{self.base_url}/chat/completions", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content")
        except Exception:
            pass
        return None

openai_client = OpenAIClient()
