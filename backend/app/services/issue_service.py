"""Issue Service - Issue Filtering Logic"""

import logging
from urllib.parse import urlparse

from ..dto.issue_dto import IssueDTO, IssueFilterDTO
from .github_service import GitHubService
from .openrouter_service import OpenRouterService
from .prompt_service import PromptService

logger = logging.getLogger(__name__)


class IssueService:
    """Service for issue filtering and retrieval with AI-powered ranking"""

    def __init__(
        self,
        github_service: GitHubService,
        openrouter_service: OpenRouterService | None = None,
        prompt_service: PromptService | None = None,
    ):
        self.github_service = github_service
        self.openrouter_service = openrouter_service
        self.prompt_service = prompt_service or PromptService()

    async def search_issues(
        self,
        filter_dto: IssueFilterDTO,
        user_preference=None,
    ) -> list[IssueDTO]:
        """
        Search and filter issues based on criteria, with optional AI-powered ranking.

        Args:
            filter_dto: Filter criteria for issues
            user_preference: User's preference model (optional, for AI ranking)

        Returns:
            List of filtered and ranked issues
        """
        # GitHub API uses AND logic for multiple labels (all labels must match)
        # For OR logic (any label matches), we fetch without labels and filter client-side
        use_client_side_label_filter = len(filter_dto.tags) > 1

        if use_client_side_label_filter:
            # Fetch all open issues, then filter by tags (OR logic)
            issues = await self.github_service.get_issues(
                repo_url=str(filter_dto.repo_url),
                labels=None,  # Don't filter by labels in API
                per_page=min(
                    filter_dto.limit * 3, 100
                ),  # Get more to account for filtering
            )
        else:
            # Single label or no labels - use API filtering
            # Fetch more pages to ensure we get unassigned issues
            # GitHub returns issues in order, and if first pages are all assigned,
            # we need to fetch more to find unassigned ones
            issues = await self.github_service.get_issues(
                repo_url=str(filter_dto.repo_url),
                labels=filter_dto.tags if filter_dto.tags else None,
                per_page=100,  # Fetch more per page
            )

            # If we need more issues and exclude_assigned is True, fetch additional pages
            if (
                filter_dto.exclude_assigned
                and len([i for i in issues if not i.is_assigned]) < filter_dto.limit
            ):
                # Fetch more pages to find unassigned issues
                page = 2
                max_pages = 5  # Limit to 5 pages (500 issues) for performance
                while page <= max_pages:
                    additional_issues = await self.github_service.get_issues(
                        repo_url=str(filter_dto.repo_url),
                        labels=filter_dto.tags if filter_dto.tags else None,
                        per_page=100,
                        page=page,
                    )
                    if not additional_issues:
                        break
                    issues.extend(additional_issues)
                    # Check if we have enough unassigned issues
                    unassigned_count = len([i for i in issues if not i.is_assigned])
                    if unassigned_count >= filter_dto.limit:
                        break
                    page += 1

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

        # Try AI-powered ranking if OpenRouter is available and user has preferences
        if self.openrouter_service and user_preference and filtered_issues:
            try:
                ranked_issues = await self._rank_issues_with_ai(
                    user_preference=user_preference,
                    repo_url=filter_dto.repo_url,
                    issues=filtered_issues,
                    limit=filter_dto.limit,
                )
                if ranked_issues:
                    return ranked_issues
            except Exception as e:
                logger.warning(f"AI issue ranking failed, using default order: {e}")

        # Return filtered issues (limited to requested amount)
        return filtered_issues[: filter_dto.limit]

    async def _rank_issues_with_ai(
        self,
        user_preference,
        repo_url: str,
        issues: list[IssueDTO],
        limit: int,
    ) -> list[IssueDTO]:
        """
        Rank issues using AI based on user preferences.

        Args:
            user_preference: User's preference model
            repo_url: Repository URL
            issues: List of issues to rank
            limit: Maximum number of issues to return

        Returns:
            List of ranked issues (most relevant first)
        """
        # Parse repo name from URL
        parsed = urlparse(repo_url)
        path_parts = parsed.path.strip("/").split("/")
        repo_name = "/".join(path_parts[:2]) if len(path_parts) >= 2 else "repository"

        # Convert issues to dict format for prompt
        issues_data = []
        for issue in issues:
            issues_data.append(
                {
                    "id": issue.id,
                    "title": issue.title,
                    "labels": issue.labels,
                    "language": issue.language,
                    "comments_count": issue.comments_count,
                    "is_assigned": issue.is_assigned,
                }
            )

        # Build prompts
        system_prompt, user_prompt = self.prompt_service.build_issue_ranking_prompt(
            user_preference=user_preference,
            repo_name=repo_name,
            issues=issues_data,
            limit=limit,
        )

        # Get JSON schema
        json_schema = self.prompt_service.get_issue_ranking_json_schema()

        # Call LLM
        response = await self.openrouter_service.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            json_schema=json_schema,
            temperature=0.3,  # Lower temperature for more consistent ranking
        )

        # Parse response
        ranked_ids = response.get("ranked_issue_ids", [])
        if not ranked_ids:
            return issues[:limit]

        # Create a map of issue ID to issue
        issue_map = {issue.id: issue for issue in issues}

        # Reorder issues based on AI ranking
        ranked_issues = []
        for issue_id in ranked_ids:
            if issue_id in issue_map:
                ranked_issues.append(issue_map[issue_id])
                if len(ranked_issues) >= limit:
                    break

        # Add any remaining issues that weren't ranked (in case AI missed some)
        for issue in issues:
            if issue.id not in ranked_ids and len(ranked_issues) < limit:
                ranked_issues.append(issue)

        return ranked_issues[:limit]

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
