from .base import BaseLLMProvider
from .openai_provider import OpenAIProvider
from .mock_providers import PerplexityProvider, ClaudeProvider, GrokProvider
from .gemini_provider import GeminiProvider
PROVIDER_REGISTRY = {
    "openai": OpenAIProvider(),
    # "perplexity": PerplexityProvider(),
    "gemini": GeminiProvider(),
    # "claude": ClaudeProvider(),
    # "grok": GrokProvider(),
}

def get_provider(name: str) -> BaseLLMProvider:
    provider = PROVIDER_REGISTRY.get(name.lower())
    if not provider:
        raise ValueError(f"Provider {name} not found")
    return provider
