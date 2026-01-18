"""OpenRouter LLM Service - API Integration for LLM-based Recommendations"""

import json
import logging
from typing import Any

import httpx

from ..config import get_settings

logger = logging.getLogger("agent.openrouter")


class OpenRouterService:
    """Service for OpenRouter LLM API integration"""

    BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self, api_key: str | None = None, model: str | None = None):
        settings = get_settings()
        self.api_key = api_key or settings.openrouter_api_key
        self.model = model or settings.openrouter_model

        logger.info(f"[LLM] Initializing OpenRouterService with model={self.model}")

        if not self.api_key:
            logger.error("[LLM] OpenRouter API key is not configured!")
            raise ValueError("OpenRouter API key is required")

        logger.info(f"[LLM] API key present (length={len(self.api_key)})")

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

    async def generate_with_tools(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> dict[str, Any]:
        """
        Generate a response with tool/function calling support.

        Args:
            messages: List of message dicts with role and content
            tools: List of tool definitions in OpenAI function calling format
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response

        Returns:
            Full API response dict containing:
            - choices[0].message.content: Text response (if any)
            - choices[0].message.tool_calls: List of tool calls (if any)
            - choices[0].finish_reason: 'stop', 'tool_calls', or 'length'
        """
        logger.info(
            f"[LLM] generate_with_tools called: messages={len(messages)}, "
            f"tools={len(tools)}, model={self.model}"
        )

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # Only include tools if provided
        if tools:
            payload["tools"] = tools

        logger.debug(f"[LLM] Request payload keys: {list(payload.keys())}")

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                logger.info(f"[LLM] Sending request to {self.BASE_URL}...")
                response = await client.post(
                    self.BASE_URL,
                    headers=self.headers,
                    json=payload,
                )
                logger.info(f"[LLM] Response status: {response.status_code}")

                if response.status_code != 200:
                    logger.error(f"[LLM] Error response: {response.text[:1000]}")

                response.raise_for_status()
                result = response.json()

                # Log response summary
                choices = result.get("choices", [])
                if choices:
                    finish_reason = choices[0].get("finish_reason", "unknown")
                    message = choices[0].get("message", {})
                    has_content = bool(message.get("content"))
                    tool_calls = message.get("tool_calls", [])
                    logger.info(
                        f"[LLM] Response: finish_reason={finish_reason}, "
                        f"has_content={has_content}, tool_calls={len(tool_calls)}"
                    )
                else:
                    logger.warning("[LLM] No choices in response")

                return result
        except httpx.HTTPStatusError as e:
            logger.error(
                f"[LLM] HTTP error: {e.response.status_code} - {e.response.text[:500]}"
            )
            raise
        except Exception as e:
            import traceback

            logger.error(f"[LLM] Request failed: {type(e).__name__}: {e}")
            logger.error(f"[LLM] Traceback: {traceback.format_exc()}")
            raise

    def parse_tool_calls(self, response: dict[str, Any]) -> list[dict[str, Any]]:
        """
        Parse tool calls from API response.

        Args:
            response: API response from generate_with_tools

        Returns:
            List of tool call dicts with id, name, and arguments
        """
        tool_calls = []
        message = response.get("choices", [{}])[0].get("message", {})

        if "tool_calls" in message:
            for tc in message["tool_calls"]:
                tool_calls.append(
                    {
                        "id": tc.get("id"),
                        "name": tc.get("function", {}).get("name"),
                        "arguments": json.loads(
                            tc.get("function", {}).get("arguments", "{}")
                        ),
                    }
                )

        return tool_calls

    def get_finish_reason(self, response: dict[str, Any]) -> str:
        """Get the finish reason from API response"""
        return response.get("choices", [{}])[0].get("finish_reason", "unknown")

    def get_text_content(self, response: dict[str, Any]) -> str | None:
        """Get text content from API response (if any)"""
        return response.get("choices", [{}])[0].get("message", {}).get("content")
