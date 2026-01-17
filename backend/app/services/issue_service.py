"""Issue Service - Issue Filtering Logic"""

from ..dto.issue_dto import IssueDTO, IssueFilterDTO
from .github_service import GitHubService


class IssueService:
    """Service for issue filtering and retrieval"""

    def __init__(self, github_service: GitHubService):
        self.github_service = github_service

    async def search_issues(self, filter_dto: IssueFilterDTO) -> list[IssueDTO]:
        """Search and filter issues based on criteria"""
        # Get issues from GitHub
        issues = await self.github_service.get_issues(
            repo_url=str(filter_dto.repo_url),
            labels=filter_dto.tags,
            per_page=filter_dto.limit * 2,  # Get extra to account for filtering
        )

        # Apply additional filters
        filtered_issues = []
        for issue in issues:
            # Exclude assigned issues if requested
            if filter_dto.exclude_assigned and issue.is_assigned:
                continue

            # Filter by languages if specified
            if filter_dto.languages:
                # Note: Issue language comes from repo, need to set it
                pass  # Language filtering would be done at repo level

            filtered_issues.append(issue)

            # Stop if we have enough
            if len(filtered_issues) >= filter_dto.limit:
                break

        return filtered_issues

    async def get_issue_details(self, repo_url: str, issue_number: int) -> IssueDTO | None:
        """Get details of a specific issue"""
        # This would require a specific API call to get a single issue
        # For now, we can search through issues
        issues = await self.github_service.get_issues(repo_url=repo_url, per_page=100)
        for issue in issues:
            if f"/issues/{issue_number}" in issue.url:
                return issue
        return None
