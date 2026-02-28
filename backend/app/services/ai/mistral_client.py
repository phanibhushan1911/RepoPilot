"""Mistral AI client wrapper for RepoPilot."""
import json
from typing import Optional, List, Dict, Any
from mistralai import Mistral
from app.config import settings


class MistralClient:
    """Singleton wrapper around the Mistral AI SDK."""
    
    _instance: Optional["MistralClient"] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._client = Mistral(api_key=settings.MISTRAL_API_KEY)
        self._initialized = True
    
    async def chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        json_mode: bool = False,
        temperature: float = 0.3,
        max_tokens: int = 8192,
    ) -> str:
        """Send a chat completion request and return the response text."""
        kwargs: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        
        response = await self._client.chat.complete_async(**kwargs)
        
        if response and response.choices:
            return response.choices[0].message.content or ""
        
        return ""
    
    async def chat_json(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 8192,
    ) -> Dict[str, Any]:
        """Send a chat completion and parse the response as JSON."""
        text = await self.chat(
            model=model,
            messages=messages,
            json_mode=True,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code block
            if "```json" in text:
                json_str = text.split("```json")[1].split("```")[0].strip()
                return json.loads(json_str)
            elif "```" in text:
                json_str = text.split("```")[1].split("```")[0].strip()
                return json.loads(json_str)
            raise ValueError(f"Failed to parse JSON response: {text[:500]}")
    
    async def chat_stream(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 8192,
    ):
        """Stream a chat completion response token by token."""
        response = await self._client.chat.stream_async(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        async for chunk in response:
            if chunk.data.choices and chunk.data.choices[0].delta.content:
                yield chunk.data.choices[0].delta.content


# Singleton instance
mistral_client = MistralClient()
