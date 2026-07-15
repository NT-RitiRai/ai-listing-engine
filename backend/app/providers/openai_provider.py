import time
from typing import Any
import openai
from app.config import settings
from app.providers.base import BaseLLMProvider

class OpenAIProvider(BaseLLMProvider):
    @property
    def provider_name(self) -> str:
        return "openai"

    async def run_prompt(self, prompt: str, **kwargs) -> dict[str, Any]:
        start_time = time.time()
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        model = kwargs.get("model", "gpt-4o")
        
        try:
            # Using the actual standard model configured in env
            extra_body = {}

            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                extra_body=extra_body
            )
            end_time = time.time()
            
            message = response.choices[0].message
            annotations = getattr(message, "annotations", [])
            
            return {
                "full_response": message.content,
                "token_usage": response.usage.total_tokens if response.usage else 0,
                "latency": end_time - start_time,
                "request_id": response.id,
                "model": model,
                "status": "completed",
                "raw_annotations": annotations
            }
        except Exception as e:
            end_time = time.time()
            logger.error(f"OpenAI API failed: {repr(e)}")
            return {
                "full_response": f"API Error: {str(e)}",
                "token_usage": 0,
                "latency": end_time - start_time,
                "request_id": None,
                "model": model,
                "status": "failed",
                "raw_annotations": []
            }
