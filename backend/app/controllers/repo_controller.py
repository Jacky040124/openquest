"""Repository Controller - /repos/* Routes"""

import logging

from fastapi import APIRouter, HTTPException, Query, status

from ..config import get_settings
from ..dto.repo_dto import RepoDTO, RepoRecommendQueryDTO
from ..services.github_service import GitHubService
from ..services.openrouter_service import OpenRouterService
from ..services.prompt_service import PromptService
from ..services.repo_service import RepoService
from ..utils.dependencies import CurrentUser, DBSession

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/repos", tags=["Repositories"])


def _get_openrouter_service() -> OpenRouterService | None:
    """Get OpenRouter service if API key is configured"""
    settings = get_settings()
    if settings.openrouter_api_key:
        try:
            return OpenRouterService()
        except ValueError as e:
            logger.warning(f"Failed to initialize OpenRouter service: {e}")
    return None


@router.get("/recommend", response_model=list[RepoDTO])
async def recommend_repos(
    current_user: CurrentUser,
    db: DBSession,
    limit: int = Query(
        default=10, ge=1, le=50, description="Number of repos to return"
    ),
    min_stars: int = Query(default=100, ge=0, description="Minimum star count"),
    max_stars: int | None = Query(
        default=None, ge=0, description="Maximum star count (optional)"
    ),
) -> list[RepoDTO]:
    """
    Get repository recommendations based on user preferences.

    The recommendations are based on the authenticated user's preferences:
    - Languages
    - Skills
    - Interests

    Query parameters allow filtering:
    - **limit**: Number of repos to return (default: 10)
    - **min_stars**: Minimum star count (default: 100)
    - **max_stars**: Maximum star count (optional, for finding smaller projects)
    """
    from uuid import UUID

    try:
        user_id = UUID(str(current_user["id"]))
        query = RepoRecommendQueryDTO(
            limit=limit,
            min_stars=min_stars,
            max_stars=max_stars,
        )

        # Initialize services
        github_service = GitHubService()
        openrouter_service = _get_openrouter_service()
        prompt_service = PromptService()

        repo_service = RepoService(
            github_service=github_service,
            supabase=db,
            openrouter_service=openrouter_service,
            prompt_service=prompt_service,
        )

        return await repo_service.recommend_repos(user_id, query)
    except Exception as e:
        logger.error(f"Failed to fetch recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch recommendations: {str(e)}",
        )


@router.get("/{owner}/{repo}", response_model=RepoDTO)
async def get_repo_info(
    owner: str,
    repo: str,
    current_user: CurrentUser,
) -> RepoDTO:
    """Get information about a specific repository"""
    try:
        github_service = GitHubService()
        repo_url = f"https://github.com/{owner}/{repo}"
        return await github_service.get_repo_info(repo_url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository not found: {str(e)}",
        )
