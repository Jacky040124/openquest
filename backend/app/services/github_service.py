"""GitHub API Integration Service"""

from datetime import datetime
from urllib.parse import urlparse

import httpx

from ..config import get_settings
from ..dto.issue_dto import IssueDTO
from ..dto.repo_dto import RepoDTO


class GitHubService:
    """Service for GitHub API integration"""

    BASE_URL = "https://api.github.com"

    def __init__(self, token: str | None = None):
        settings = get_settings()
        self.token = token or settings.github_token
        self.headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"

    def _parse_repo_url(self, repo_url: str) -> tuple[str, str]:
        """Parse owner and repo from GitHub URL"""
        parsed = urlparse(str(repo_url))
        path_parts = parsed.path.strip("/").split("/")
        if len(path_parts) >= 2:
            return path_parts[0], path_parts[1]
        raise ValueError(f"Invalid GitHub repository URL: {repo_url}")

    async def get_issues(
        self,
        repo_url: str,
        labels: list[str] | None = None,
        state: str = "open",
        per_page: int = 20,
    ) -> list[IssueDTO]:
        """Get issues from a repository"""
        owner, repo = self._parse_repo_url(repo_url)

        params = {
            "state": state,
            "per_page": per_page,
        }
        if labels:
            params["labels"] = ",".join(labels)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/issues",
                headers=self.headers,
                params=params,
            )
            response.raise_for_status()
            data = response.json()

        issues = []
        for item in data:
            # Skip pull requests (they show up in issues endpoint)
            if "pull_request" in item:
                continue

            issues.append(
                IssueDTO(
                    id=item["id"],
                    title=item["title"],
                    url=item["html_url"],
                    labels=[label["name"] for label in item.get("labels", [])],
                    language=None,  # Will be set from repo info if needed
                    created_at=datetime.fromisoformat(
                        item["created_at"].replace("Z", "+00:00")
                    ),
                    is_assigned=item.get("assignee") is not None
                    or len(item.get("assignees", [])) > 0,
                    comments_count=item.get("comments", 0),
                )
            )

        return issues

    async def get_repo_info(self, repo_url: str) -> RepoDTO:
        """Get repository information"""
        owner, repo = self._parse_repo_url(repo_url)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}",
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()

        # Get good first issue count
        good_first_issue_count = await self._get_label_issue_count(
            owner, repo, "good first issue"
        )

        return RepoDTO(
            id=data["id"],
            name=data["name"],
            full_name=data["full_name"],
            url=data["html_url"],
            description=data.get("description"),
            language=data.get("language") or "Unknown",
            stars=data.get("stargazers_count", 0),
            open_issues_count=data.get("open_issues_count", 0),
            topics=data.get("topics", []),
            good_first_issue_count=good_first_issue_count,
        )

    async def _get_label_issue_count(self, owner: str, repo: str, label: str) -> int:
        """Get count of issues with a specific label"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/issues",
                headers=self.headers,
                params={"labels": label, "state": "open", "per_page": 1},
            )
            response.raise_for_status()

        # Parse Link header for total count
        link_header = response.headers.get("Link", "")
        if "last" in link_header:
            # Extract page number from last page link
            import re

            match = re.search(r'page=(\d+)>; rel="last"', link_header)
            if match:
                return int(match.group(1))
        return len(response.json())

    async def search_repos(
        self,
        languages: list[str] | None = None,
        topics: list[str] | None = None,
        min_stars: int = 100,
        max_stars: int | None = None,
        has_good_first_issues: bool = True,
        limit: int = 10,
    ) -> list[RepoDTO]:
        """Search repositories based on criteria"""
        query_parts = []

        # Add language filters
        if languages:
            for lang in languages:
                query_parts.append(f"language:{lang}")

        # Add topic filters
        if topics:
            for topic in topics:
                query_parts.append(f"topic:{topic}")

        # Add star range
        if max_stars:
            query_parts.append(f"stars:{min_stars}..{max_stars}")
        else:
            query_parts.append(f"stars:>={min_stars}")

        # Add good first issues label filter
        if has_good_first_issues:
            query_parts.append('label:"good first issue"')

        query = " ".join(query_parts) if query_parts else "stars:>=100"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/search/repositories",
                headers=self.headers,
                params={
                    "q": query,
                    "sort": "stars",
                    "order": "desc",
                    "per_page": limit,
                },
            )
            response.raise_for_status()
            data = response.json()

        repos = []
        for item in data.get("items", []):
            repos.append(
                RepoDTO(
                    id=item["id"],
                    name=item["name"],
                    full_name=item["full_name"],
                    url=item["html_url"],
                    description=item.get("description"),
                    language=item.get("language") or "Unknown",
                    stars=item.get("stargazers_count", 0),
                    open_issues_count=item.get("open_issues_count", 0),
                    topics=item.get("topics", []),
                    good_first_issue_count=0,  # Would need separate API call for each
                )
            )

        return repos
