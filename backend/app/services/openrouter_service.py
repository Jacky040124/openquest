"""OpenRouter LLM Service - API Integration for LLM-based Recommendations"""

import json
from typing import Any

import httpx

from ..config import get_settings


class OpenRouterService:
    """Service for OpenRouter LLM API integration"""

    BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self, api_key: str | None = None, model: str | None = None):
        settings = get_settings()
        self.api_key = api_key or settings.openrouter_api_key
        self.model = model or settings.openrouter_model

        if not self.api_key:
            raise ValueError("OpenRouter API key is required")

        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://openquest.dev",
            "X-Title": "OpenQuest",
        }

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        json_schema: dict[str, Any] | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> dict[str, Any]:
        """
        Generate a JSON response from the LLM.

        Args:
            system_prompt: The system message defining the AI's role
            user_prompt: The user message with the actual request
            json_schema: Optional JSON schema for structured output
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response

        Returns:
            Parsed JSON response from the LLM

        Raises:
            ValueError: If response is not valid JSON
            httpx.HTTPError: If API request fails
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # Add response format if JSON schema is provided
        if json_schema:
            payload["response_format"] = {
                "type": "json_schema",
                "json_schema": json_schema,
            }
        else:
            # Request JSON mode without strict schema
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.BASE_URL,
                headers=self.headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        # Extract content from response
        content = data["choices"][0]["message"]["content"]

        # Parse JSON from content
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            # Try to extract JSON from markdown code block
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
                return json.loads(json_str)
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0].strip()
                return json.loads(json_str)
            raise ValueError(f"Failed to parse JSON response: {e}") from e

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """
        Generate a text response from the LLM.

        Args:
            system_prompt: The system message defining the AI's role
            user_prompt: The user message with the actual request
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response

        Returns:
            Text response from the LLM
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.BASE_URL,
                headers=self.headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        return data["choices"][0]["message"]["content"]
