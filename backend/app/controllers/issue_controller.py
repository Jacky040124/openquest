"""Issue Controller - /issues/* Routes"""

import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from ..config import get_settings
from ..dao.user_preference_dao import UserPreferenceDAO
from ..dto.issue_dto import IssueDTO, IssueFilterDTO
from ..services.github_service import GitHubService
from ..services.issue_service import IssueService
from ..services.openrouter_service import OpenRouterService
from ..services.prompt_service import PromptService
from ..utils.dependencies import CurrentUser, SupabaseClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/issues", tags=["Issues"])


def _get_openrouter_service() -> OpenRouterService | None:
    """Get OpenRouter service if API key is configured"""
    settings = get_settings()
    if settings.openrouter_api_key:
        try:
            return OpenRouterService()
        except ValueError as e:
            logger.warning(f"Failed to initialize OpenRouter service: {e}")
    return None


@router.post("/search", response_model=list[IssueDTO])
async def search_issues(
    filter_data: IssueFilterDTO,
    current_user: CurrentUser,  # Require authentication
    supabase: SupabaseClient,
) -> list[IssueDTO]:
    """
    Search and filter issues from a GitHub repository.
    Uses AI-powered ranking based on user preferences if OpenRouter is configured.

    - **repo_url**: GitHub repository URL
    - **tags**: Labels to filter by (default: ["good first issue"])
    - **languages**: Optional language filter
    - **exclude_assigned**: Exclude issues that are already assigned (default: True)
    - **limit**: Maximum number of issues to return (default: 20)
    """
    try:
        # Get user preferences for AI ranking
        user_id = UUID(str(current_user["id"]))
        user_preference_dao = UserPreferenceDAO(supabase)
        user_preference = user_preference_dao.get_by_user_id(user_id)

        # Initialize services
        github_service = GitHubService()
        openrouter_service = _get_openrouter_service()
        prompt_service = PromptService()

        issue_service = IssueService(
            github_service=github_service,
            openrouter_service=openrouter_service,
            prompt_service=prompt_service,
        )

        return await issue_service.search_issues(
            filter_data,
            user_preference=user_preference,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to fetch issues: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch issues from GitHub: {str(e)}",
        )
