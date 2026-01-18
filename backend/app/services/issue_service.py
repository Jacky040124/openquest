"""Issue Service - Issue Filtering Logic"""

from ..dto.issue_dto import IssueDTO, IssueFilterDTO
from .github_service import GitHubService


class IssueService:
    """Service for issue filtering and retrieval"""

    def __init__(self, github_service: GitHubService):
        self.github_service = github_service

    async def search_issues(self, filter_dto: IssueFilterDTO) -> list[IssueDTO]:
        """Search and filter issues based on criteria"""
        # GitHub API uses AND logic for multiple labels (all labels must match)
        # For OR logic (any label matches), we fetch without labels and filter client-side
        use_client_side_label_filter = len(filter_dto.tags) > 1
        
        if use_client_side_label_filter:
            # Fetch all open issues, then filter by tags (OR logic)
            issues = await self.github_service.get_issues(
                repo_url=str(filter_dto.repo_url),
                labels=None,  # Don't filter by labels in API
                per_page=min(filter_dto.limit * 3, 100),  # Get more to account for filtering
            )
        else:
            # Single label or no labels - use API filtering
            issues = await self.github_service.get_issues(
                repo_url=str(filter_dto.repo_url),
                labels=filter_dto.tags if filter_dto.tags else None,
                per_page=filter_dto.limit * 2,
            )

        # Apply additional filters
        filtered_issues = []
        for issue in issues:
            # Filter by tags (OR logic - issue has any of the tags)
            if filter_dto.tags and use_client_side_label_filter:
                issue_labels_lower = [label.lower() for label in issue.labels]
                tags_lower = [tag.lower() for tag in filter_dto.tags]
                if not any(tag in issue_labels_lower for tag in tags_lower):
                    continue
            
            # Exclude assigned issues if requested
            if filter_dto.exclude_assigned and issue.is_assigned:
                continue

            # Filter by languages if specified (would need repo language info)
            # For now, we skip this as language is repo-level, not issue-level
            if filter_dto.languages:
                pass  # Language filtering would be done at repo level

            filtered_issues.append(issue)

            # Stop if we have enough
            if len(filtered_issues) >= filter_dto.limit:
                break

        return filtered_issues

    async def get_issue_details(
        self, repo_url: str, issue_number: int
    ) -> IssueDTO | None:
        """Get details of a specific issue"""
        # This would require a specific API call to get a single issue
        # For now, we can search through issues
        issues = await self.github_service.get_issues(repo_url=repo_url, per_page=100)
        for issue in issues:
            if f"/issues/{issue_number}" in issue.url:
                return issue
        return None
