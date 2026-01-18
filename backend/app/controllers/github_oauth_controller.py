"""GitHub OAuth Controller - OAuth endpoints for GitHub authentication"""

import logging
import traceback
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from ..dao.user_preference_dao import UserPreferenceDAO
from ..services.github_oauth_service import GitHubOAuthService
from ..utils.exceptions import GitHubOAuthError
from ..utils.supabase_client import get_supabase_client

router = APIRouter(prefix="/oauth", tags=["OAuth"])
logger = logging.getLogger("oauth")

# Optional bearer token for detecting logged-in users
security = HTTPBearer(auto_error=False)


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


class CallbackResponse(BaseModel):
    """OAuth callback response - matches frontend expectations"""

    model_config = {"populate_by_name": True}

    username: str
    is_logged_in: bool = Field(serialization_alias="isLoggedIn")


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


@router.post("/github/callback", response_model=CallbackResponse)
async def github_callback(
    request: CallbackRequest,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security)
    ] = None,
) -> CallbackResponse:
    """
    Handle GitHub OAuth callback.

    Exchange the authorization code for an access token, get the GitHub user info,
    and if the user is logged in (has valid JWT), save the token to their preferences.

    **Flow:**
    1. Exchange code for access token
    2. Get GitHub user info (username)
    3. If user is logged in, save token to user_preferences
    4. Return username and login status

    Args:
        request: Callback data containing code and state
        credentials: Optional JWT token (if user is already logged in)

    Returns:
        GitHub username and whether user is logged in

    Raises:
        400: If code exchange fails
        503: If GitHub OAuth is not configured
    """
    code_preview = request.code[:8] if len(request.code) > 8 else request.code
    state_preview = request.state[:8] if len(request.state) > 8 else request.state
    logger.info(
        f"[OAuth] Starting callback: code={code_preview}..., state={state_preview}..."
    )

    oauth_service = GitHubOAuthService()
    supabase = get_supabase_client()

    # Step 1: Exchange code for token
    try:
        logger.info("[OAuth] Step 1: Exchanging code for access token...")
        token_data = await oauth_service.exchange_code(request.code)
        access_token = token_data["access_token"]
        scope = token_data.get("scope", "")
        logger.info(f"[OAuth] Token exchanged successfully, scope={scope}")
    except ValueError as e:
        logger.error(f"[OAuth] OAuth not configured: {e}")
        logger.error(f"[OAuth] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except GitHubOAuthError as e:
        logger.error(f"[OAuth] Code exchange failed: {e}")
        logger.error(f"[OAuth] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Step 2: Get GitHub user info
    try:
        logger.info("[OAuth] Step 2: Getting GitHub user info...")
        user_data = await oauth_service.get_user_info(access_token)
        github_username = user_data["login"]
        logger.info(f"[OAuth] GitHub user: {github_username}")
    except GitHubOAuthError as e:
        logger.error(f"[OAuth] Failed to get GitHub user info: {e}")
        logger.error(f"[OAuth] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get GitHub user info: {e}",
        )

    # Step 3: Check if user is logged in and save token
    is_logged_in = False
    user_id = None

    if credentials:
        try:
            logger.info("[OAuth] Step 3: Verifying JWT and saving token...")
            token = credentials.credentials
            user_response = supabase.auth.get_user(token)

            if user_response.user:
                user_id = str(user_response.user.id)
                is_logged_in = True
                logger.info(f"[OAuth] User authenticated: user_id={user_id}")

                # Save token to user preferences
                dao = UserPreferenceDAO(supabase)
                preference = dao.update_github(
                    user_id=UUID(user_id),
                    github_token=access_token,
                    github_username=github_username,
                )

                if preference:
                    logger.info(
                        f"[OAuth] Token saved to preferences for user {user_id}"
                    )
                else:
                    # User might not have preferences yet, create them
                    logger.info(
                        f"[OAuth] No existing preferences, creating new for user {user_id}"
                    )
                    dao.create_or_update(
                        user_id=UUID(user_id),
                        languages=[],
                        skills=[],
                        project_interests=[],
                        issue_interests=[],
                        github_token=access_token,
                        github_username=github_username,
                    )
                    logger.info(
                        f"[OAuth] Created preferences with GitHub token for user {user_id}"
                    )
            else:
                logger.warning("[OAuth] JWT provided but user not found in Supabase")
        except Exception as e:
            # Don't fail the whole callback if saving fails
            logger.error(f"[OAuth] Failed to verify JWT or save token: {e}")
            logger.error(f"[OAuth] Traceback: {traceback.format_exc()}")
            # Still continue - user can try again from dashboard
    else:
        logger.info("[OAuth] No JWT provided - user not logged in (onboarding flow)")

    logger.info(
        f"[OAuth] Callback complete: username={github_username}, isLoggedIn={is_logged_in}"
    )

    return CallbackResponse(
        username=github_username,
        is_logged_in=is_logged_in,
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
