import time
from typing import Any
import google.generativeai as genai
from app.config import settings
from app.providers.base import BaseLLMProvider
import logging

logger = logging.getLogger(__name__)

class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-2.5-pro"

    @property
    def provider_name(self) -> str:
        return "gemini"

    async def run_prompt(self, prompt: str, **kwargs) -> dict[str, Any]:
        start_time = time.time()
        
        try:
            # We must use a model that supports Google Search Grounding if requested
            # Currently Gemini allows search tools
            model = genai.GenerativeModel(
                model_name=self.model_name
            )
            
            response = await model.generate_content_async(prompt)
            end_time = time.time()
            
            # The citations in Gemini are part of the response candidates grounding metadata
            annotations = []
            try:
                grounding_chunks = response.candidates[0].grounding_metadata.grounding_chunks
                for chunk in grounding_chunks:
                    if chunk.web:
                        annotations.append({
                            "title": chunk.web.title,
                            "url": chunk.web.uri
                        })
            except Exception:
                pass
            
            return {
                "full_response": response.text,
                "token_usage": getattr(response.usage_metadata, "total_token_count", 0),
                "latency": end_time - start_time,
                "request_id": None,
                "model": self.model_name,
                "status": "completed",
                "raw_annotations": annotations
            }
        except Exception as e:
            end_time = time.time()
            logger.error(f"Gemini API failed: {repr(e)}")
            return {
                "full_response": f"API Error: {str(e)}",
                "error": str(e),
                "token_usage": 0,
                "latency": end_time - start_time,
                "request_id": None,
                "model": self.model_name,
                "status": "failed",
                "raw_annotations": []
            }
