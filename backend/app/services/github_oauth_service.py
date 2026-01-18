"""GitHub OAuth Service - Handle GitHub OAuth flow"""

import secrets
from typing import Any
from urllib.parse import urlencode

import httpx

from ..config import get_settings
from ..utils.exceptions import GitHubOAuthError


class GitHubOAuthService:
    """Service for GitHub OAuth operations"""

    AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
    TOKEN_URL = "https://github.com/login/oauth/access_token"
    USER_API_URL = "https://api.github.com/user"

    def __init__(self):
        settings = get_settings()
        self.client_id = settings.github_client_id
        self.client_secret = settings.github_client_secret
        self.redirect_uri = settings.github_redirect_uri

        if not self.client_id or not self.client_secret:
            raise ValueError(
                "GitHub OAuth not configured. "
                "Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables."
            )

    def generate_state(self) -> str:
        """Generate a random state token for CSRF protection"""
        return secrets.token_urlsafe(32)

    def get_authorize_url(self, state: str, scope: str = "repo,user") -> str:
        """
        Generate GitHub OAuth authorization URL.

        Args:
            state: Random state token for CSRF protection
            scope: OAuth scopes (default: repo,user for full repo access)

        Returns:
            Full authorization URL to redirect user to
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": scope,
            "state": state,
        }
        return f"{self.AUTHORIZE_URL}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> dict[str, Any]:
        """
        Exchange authorization code for access token.

        Args:
            code: Authorization code from GitHub callback

        Returns:
            Dict containing access_token, token_type, scope

        Raises:
            GitHubOAuthError: If token exchange fails
        """
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": self.redirect_uri,
        }

        headers = {
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    self.TOKEN_URL,
                    data=payload,
                    headers=headers,
                )
                response.raise_for_status()
                data = response.json()

                if "error" in data:
                    raise GitHubOAuthError(
                        f"GitHub OAuth error: {data.get('error_description', data['error'])}"
                    )

                return {
                    "access_token": data["access_token"],
                    "token_type": data.get("token_type", "bearer"),
                    "scope": data.get("scope", ""),
                }

            except httpx.HTTPError as e:
                raise GitHubOAuthError(f"Failed to exchange code: {e}")

    async def get_user_info(self, access_token: str) -> dict[str, Any]:
        """
        Get GitHub user information using access token.

        Args:
            access_token: GitHub OAuth access token

        Returns:
            Dict containing user info (id, login, name, email, avatar_url)

        Raises:
            GitHubOAuthError: If API call fails
        """
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    self.USER_API_URL,
                    headers=headers,
                )
                response.raise_for_status()
                data = response.json()

                return {
                    "id": data["id"],
                    "login": data["login"],
                    "name": data.get("name"),
                    "email": data.get("email"),
                    "avatar_url": data.get("avatar_url"),
                }

            except httpx.HTTPError as e:
                raise GitHubOAuthError(f"Failed to get user info: {e}")

    async def validate_token(self, access_token: str) -> bool:
        """
        Validate that an access token is still valid.

        Args:
            access_token: GitHub OAuth access token

        Returns:
            True if token is valid, False otherwise
        """
        try:
            await self.get_user_info(access_token)
            return True
        except GitHubOAuthError:
            return False
