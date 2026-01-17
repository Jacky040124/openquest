"""Issue Controller - /issues/* Routes"""

from fastapi import APIRouter, HTTPException, status

from ..dto.issue_dto import IssueDTO, IssueFilterDTO
from ..services.github_service import GitHubService
from ..services.issue_service import IssueService
from ..utils.dependencies import CurrentUser

router = APIRouter(prefix="/issues", tags=["Issues"])


@router.post("/search", response_model=list[IssueDTO])
async def search_issues(
    filter_data: IssueFilterDTO,
    current_user: CurrentUser,  # Require authentication
) -> list[IssueDTO]:
    """
    Search and filter issues from a GitHub repository.

    - **repo_url**: GitHub repository URL
    - **tags**: Labels to filter by (default: ["good first issue", "help wanted"])
    - **languages**: Optional language filter
    - **exclude_assigned**: Exclude issues that are already assigned (default: True)
    - **limit**: Maximum number of issues to return (default: 20)
    """
    try:
        github_service = GitHubService()
        issue_service = IssueService(github_service)
        return await issue_service.search_issues(filter_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch issues from GitHub: {str(e)}",
        )
