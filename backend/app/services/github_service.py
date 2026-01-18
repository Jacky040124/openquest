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
        # Clean up the URL
        repo_url = str(repo_url).strip()

        # Remove trailing slash
        if repo_url.endswith("/"):
            repo_url = repo_url[:-1]

        # Remove .git suffix if present
        if repo_url.endswith(".git"):
            repo_url = repo_url[:-4]

        parsed = urlparse(repo_url)
        path_parts = parsed.path.strip("/").split("/")

        if len(path_parts) >= 2:
            owner = path_parts[0]
            repo = path_parts[1]
            # Remove .git from repo name if still present
            if repo.endswith(".git"):
                repo = repo[:-4]
            return owner, repo

        raise ValueError(
            f"Invalid GitHub repository URL: {repo_url}. Expected format: https://github.com/owner/repo"
        )

    async def get_issues(
        self,
        repo_url: str,
        labels: list[str] | None = None,
        state: str = "open",
        per_page: int = 20,
        page: int = 1,
    ) -> list[IssueDTO]:
        """Get issues from a repository"""
        owner, repo = self._parse_repo_url(repo_url)

        params = {
            "state": state,
            "per_page": per_page,
            "page": page,
        }
        # GitHub API: multiple labels use AND logic (all must match)
        # If you want OR logic, we need to fetch all issues and filter client-side
        if labels:
            # Join labels with comma (GitHub expects comma-separated)
            params["labels"] = ",".join(labels)

        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                # Fetch repository info first to get language (language is repo-level, not issue-level)
                repo_response = await client.get(
                    f"{self.BASE_URL}/repos/{owner}/{repo}",
                    headers=self.headers,
                    timeout=30.0,
                )
                repo_response.raise_for_status()
                repo_data = repo_response.json()
                repo_language = repo_data.get("language")

                # Fetch issues
                response = await client.get(
                    f"{self.BASE_URL}/repos/{owner}/{repo}/issues",
                    headers=self.headers,
                    params=params,
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    raise ValueError(f"Repository not found: {owner}/{repo}")
                raise ValueError(
                    f"GitHub API error: {e.response.status_code} - {e.response.text}"
                )
            except Exception as e:
                raise ValueError(f"Failed to fetch issues: {str(e)}")

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
                    language=repo_language,  # Use repository language (from repo API call)
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

        async with httpx.AsyncClient(follow_redirects=True) as client:
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
        """Get count of unassigned issues with a specific label"""
        # Count unassigned issues with the label (matching what Issues page shows)
        async with httpx.AsyncClient(follow_redirects=True) as client:
            unassigned_count = 0
            page = 1
            per_page = 100

            while True:
                response = await client.get(
                    f"{self.BASE_URL}/repos/{owner}/{repo}/issues",
                    headers=self.headers,
                    params={
                        "labels": label,
                        "state": "open",
                        "per_page": per_page,
                        "page": page,
                    },
                )
                response.raise_for_status()
                data = response.json()

                # If no more issues, break
                if not data:
                    break

                # Filter out pull requests and assigned issues
                for item in data:
                    # Skip pull requests
                    if "pull_request" in item:
                        continue
                    # Count only unassigned issues
                    if item.get("assignee") is None:
                        unassigned_count += 1

                # Check if there are more pages
                link_header = response.headers.get("Link", "")
                if 'rel="next"' not in link_header:
                    break

                page += 1
                # Limit to first 10 pages (1000 issues max) for performance
                if page > 10:
                    break

            return unassigned_count

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

        async with httpx.AsyncClient(follow_redirects=True) as client:
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