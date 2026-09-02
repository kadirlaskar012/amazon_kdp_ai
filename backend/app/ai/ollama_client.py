import httpx
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings

class OllamaClient:
    """Client for communicating with local Ollama instance without external SaaS dependencies."""

    def __init__(self, base_url: str = None):
        self.base_url = base_url or settings.OLLAMA_BASE_URL

    async def list_models(self) -> List[str]:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    models = [m.get("name") for m in resp.json().get("models", []) if m.get("name")]
                    return models
        except Exception:
            pass
        return []

    async def check_health(self) -> Dict[str, Any]:
        try:
            models = await self.list_models()
            if models:
                return {
                    "status": "CONNECTED",
                    "available_models": models,
                    "default_model": models[0] if models else "llama3:latest",
                    "message": f"Connected to local Ollama with {len(models)} installed model(s)."
                }
            return {
                "status": "DISCONNECTED",
                "available_models": [],
                "message": f"Ollama is running at {self.base_url} but no models are downloaded yet (run 'ollama pull llama3' or configure an alternate model)."
            }
        except Exception as e:
            return {
                "status": "DISCONNECTED",
                "available_models": [],
                "message": f"Could not connect to Ollama at {self.base_url}. Ensure Ollama is installed and running locally, or configure OpenAI-compatible API in Settings."
            }

    async def generate_response(self, prompt: str, system_prompt: str = "", model: str = None, temperature: float = 0.7) -> Optional[str]:
        target_model = model or settings.OLLAMA_MODEL
        try:
            payload = {
                "model": target_model,
                "prompt": prompt,
                "system": system_prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_ctx": 4096
                }
            }
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(f"{self.base_url}/api/generate", json=payload)
                if resp.status_code == 200:
                    return resp.json().get("response")
        except Exception:
            pass
        return None

ollama_client = OllamaClient()
