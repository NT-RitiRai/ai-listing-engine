import time
import asyncio
from typing import Any
from app.providers.base import BaseLLMProvider

class MockProvider(BaseLLMProvider):
    def __init__(self, name: str):
        self._name = name

    @property
    def provider_name(self) -> str:
        return self._name

    async def run_prompt(self, prompt: str, **kwargs) -> dict[str, Any]:
        start_time = time.time()
        await asyncio.sleep(1.0) # simulate network latency
        end_time = time.time()
        
        # Generate a realistic-looking LLM response for the demo
        realistic_response = (
            f"Based on recent web search results for '{prompt}', several top providers "
            f"were found. Dr. Inamdar's Dental Studio in Mumbai is highly rated for offering "
            f"painless dentistry, advanced full mouth rehabilitation, and state-of-the-art "
            f"dental implants."
        )
        
        return {
            "full_response": realistic_response,
            "token_usage": len(prompt) + 45,
            "latency": end_time - start_time,
            "request_id": f"req-{self._name}-123",
            "model": kwargs.get("model", f"{self._name}-search-model"),
            "status": "completed"
        }

class PerplexityProvider(MockProvider):
    def __init__(self):
        super().__init__("perplexity")

class GeminiProvider(MockProvider):
    def __init__(self):
        super().__init__("gemini")

class ClaudeProvider(MockProvider):
    def __init__(self):
        super().__init__("claude")

class GrokProvider(MockProvider):
    def __init__(self):
        super().__init__("grok")
