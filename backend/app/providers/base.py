from abc import ABC, abstractmethod
from typing import Any

class BaseLLMProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the name of the provider (e.g., 'openai')."""
        pass

    @abstractmethod
    async def run_prompt(self, prompt: str, **kwargs) -> dict[str, Any]:
        """
        Execute a prompt against the provider.
        
        Returns a dictionary containing:
        - full_response: str
        - token_usage: int
        - latency: float
        - request_id: str | None
        """
        pass
