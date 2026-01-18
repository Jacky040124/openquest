"""GitHub OAuth Controller - OAuth endpoints for GitHub authentication"""

import logging

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from ..services.github_oauth_service import GitHubOAuthService
from ..utils.exceptions import GitHubOAuthError

router = APIRouter(prefix="/oauth", tags=["OAuth"])
logger = logging.getLogger("oauth")


class AuthorizeResponse(BaseModel):
    """Response containing OAuth authorization URL"""

    authorize_url: str
    state: str


class TokenResponse(BaseModel):
    """Response containing OAuth tokens"""

    access_token: str
    token_type: str
    scope: str


class GitHubUserResponse(BaseModel):
    """GitHub user information"""

    id: int
    login: str
    name: str | None
    email: str | None
    avatar_url: str | None


class CallbackRequest(BaseModel):
    """OAuth callback request"""

    code: str
    state: str


@router.get("/github/authorize", response_model=AuthorizeResponse)
async def github_authorize(
    scope: str = Query(
        default="repo,user",
        description="OAuth scopes (comma-separated)",
    ),
) -> AuthorizeResponse:
    """
    Get GitHub OAuth authorization URL.

    This endpoint generates an authorization URL that the frontend should
    redirect the user to. The state parameter should be stored client-side
    and verified when the callback is received.

    **Scopes:**
    - `repo`: Full control of private and public repositories
    - `user`: Read user profile data
    - `read:org`: Read org membership (optional)

    Args:
        scope: Comma-separated OAuth scopes

    Returns:
        Authorization URL and state token

    Raises:
        503: If GitHub OAuth is not configured
    """
    try:
        oauth_service = GitHubOAuthService()
        state = oauth_service.generate_state()
        authorize_url = oauth_service.get_authorize_url(state, scope)

        logger.info("Generated OAuth authorize URL", extra={"scope": scope})

        return AuthorizeResponse(
            authorize_url=authorize_url,
            state=state,
        )

    except ValueError as e:
        logger.error("OAuth not configured", extra={"error": str(e)})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )


@router.post("/github/callback", response_model=TokenResponse)
async def github_callback(request: CallbackRequest) -> TokenResponse:
    """
    Handle GitHub OAuth callback.

    Exchange the authorization code for an access token. The frontend should
    call this endpoint after receiving the callback from GitHub.

    **Important:** The frontend should verify that the state parameter matches
    the one received from the authorize endpoint before calling this.

    Args:
        request: Callback data containing code and state

    Returns:
        Access token and token metadata

    Raises:
        400: If code exchange fails
        503: If GitHub OAuth is not configured
    """
    try:
        oauth_service = GitHubOAuthService()
        token_data = await oauth_service.exchange_code(request.code)

        logger.info(
            "Successfully exchanged OAuth code",
            extra={"scope": token_data.get("scope")},
        )

        return TokenResponse(
            access_token=token_data["access_token"],
            token_type=token_data["token_type"],
            scope=token_data["scope"],
        )

    except ValueError as e:
        logger.error("OAuth not configured", extra={"error": str(e)})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )

    except GitHubOAuthError as e:
        logger.error("OAuth code exchange failed", extra={"error": str(e)})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/github/user", response_model=GitHubUserResponse)
async def get_github_user(
    access_token: str = Query(..., description="GitHub access token"),
) -> GitHubUserResponse:
    """
    Get GitHub user information using access token.

    This endpoint fetches the authenticated user's GitHub profile information.

    Args:
        access_token: GitHub OAuth access token

    Returns:
        GitHub user profile information

    Raises:
        401: If token is invalid or expired
        503: If GitHub OAuth is not configured
    """
    try:
        oauth_service = GitHubOAuthService()
        user_data = await oauth_service.get_user_info(access_token)

        return GitHubUserResponse(
            id=user_data["id"],
            login=user_data["login"],
            name=user_data.get("name"),
            email=user_data.get("email"),
            avatar_url=user_data.get("avatar_url"),
        )

    except ValueError as e:
        logger.error("OAuth not configured", extra={"error": str(e)})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )

    except GitHubOAuthError as e:
        logger.error("Failed to get GitHub user", extra={"error": str(e)})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )


@router.get("/github/validate")
async def validate_github_token(
    access_token: str = Query(..., description="GitHub access token"),
) -> dict:
    """
    Validate a GitHub access token.

    Args:
        access_token: GitHub OAuth access token

    Returns:
        Validation status
    """
    try:
        oauth_service = GitHubOAuthService()
        is_valid = await oauth_service.validate_token(access_token)

        return {
            "valid": is_valid,
        }

    except ValueError:
        return {
            "valid": False,
            "error": "OAuth not configured",
        }
