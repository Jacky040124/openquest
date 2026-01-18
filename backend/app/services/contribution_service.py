"""Contribution Heatmap Service - Repository Observability Analysis"""

import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

from ..config import get_settings

logger = logging.getLogger(__name__)


class ContributionService:
    """Service for analyzing repository contributions and generating heatmaps"""

    BASE_URL = "https://api.github.com"

    def __init__(self):
        settings = get_settings()
        self.github_token = settings.github_token
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
        }
        if self.github_token:
            self.headers["Authorization"] = f"token {self.github_token}"

    def _parse_repo_url(self, repo_url: str) -> tuple[str, str]:
        """Parse GitHub repository URL to extract owner and repo name"""
        # Remove protocol and .git suffix
        repo_url = (
            repo_url.replace("https://", "")
            .replace("http://", "")
            .replace("github.com/", "")
        )
        if repo_url.endswith(".git"):
            repo_url = repo_url[:-4]
        if repo_url.endswith("/"):
            repo_url = repo_url[:-1]

        parts = repo_url.split("/")
        if len(parts) >= 2:
            return parts[0], parts[1]
        raise ValueError(f"Invalid GitHub repository URL: {repo_url}")

    async def get_contribution_data(
        self, repo_url: str, days_back: int = 90
    ) -> list[dict[str, Any]]:
        """
        Fetch contribution data from GitHub API.

        For demo purposes, this mocks data. In production, you would:
        1. Fetch commits via GitHub API
        2. Fetch PRs and their file changes
        3. Aggregate by author and file path

        Args:
            repo_url: GitHub repository URL
            days_back: Number of days to look back

        Returns:
            List of contribution records with:
            - author: str
            - file_path: str
            - lines_added: int
            - lines_deleted: int
            - commit_count: int
            - last_modified_timestamp: datetime
        """
        owner, repo = self._parse_repo_url(repo_url)

        # For demo: Generate mock data based on repository
        # In production, fetch real data from GitHub API
        contributions = self._generate_mock_contributions(owner, repo, days_back)

        return contributions

    def _generate_mock_contributions(
        self, owner: str, repo: str, days_back: int
    ) -> list[dict[str, Any]]:
        """
        Generate mock contribution data for demo purposes.

        In production, replace this with actual GitHub API calls:
        - GET /repos/{owner}/{repo}/commits
        - GET /repos/{owner}/{repo}/pulls
        - GET /repos/{owner}/{repo}/stats/contributors
        """
        import random
        from datetime import datetime

        # Mock contributors
        contributors = [
            f"{owner}-dev",
            "contributor-1",
            "contributor-2",
            "contributor-3",
            "new-contributor",
        ]

        # Mock top-level directories/modules
        modules = [
            "src",
            "tests",
            "docs",
            "config",
            "scripts",
            "frontend",
            "backend",
            "api",
        ]

        contributions = []
        base_date = datetime.now() - timedelta(days=days_back)

        # Generate contributions with realistic patterns
        for day in range(days_back):
            date = base_date + timedelta(days=day)
            # Some days have more activity
            commits_today = random.randint(0, 5) if random.random() > 0.3 else 0

            for _ in range(commits_today):
                author = random.choice(contributors)
                module = random.choice(modules)
                # Some contributors specialize in certain modules
                if author == f"{owner}-dev":
                    module = random.choice(["src", "api", "backend"])
                elif author == "contributor-1":
                    module = random.choice(["frontend", "src"])
                elif author == "contributor-2":
                    module = random.choice(["tests", "docs"])

                # Generate file path within module
                file_path = f"{module}/{'subdir' if random.random() > 0.5 else ''}/file_{random.randint(1, 20)}.py"

                contributions.append(
                    {
                        "author": author,
                        "file_path": file_path,
                        "lines_added": random.randint(5, 200),
                        "lines_deleted": random.randint(0, 50),
                        "commit_count": 1,
                        "last_modified_timestamp": date,
                    }
                )

        return contributions

    def generate_heatmap_data(
        self, contributions: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """
        Generate heatmap matrix data from contribution records.

        Returns:
            Dictionary with:
            - matrix: 2D array [contributors][modules] with effort scores
            - contributors: List of contributor names
            - modules: List of module/directory names
            - effort_scores: Raw effort scores for each cell
        """
        # Extract top-level modules from file paths
        module_contributions: dict[str, dict[str, dict[str, int]]] = defaultdict(
            lambda: defaultdict(lambda: {"commits": 0, "lines_changed": 0})
        )

        for contrib in contributions:
            author = contrib["author"]
            file_path = contrib["file_path"]
            # Extract top-level directory
            module = file_path.split("/")[0] if "/" in file_path else "root"

            module_contributions[module][author]["commits"] += contrib["commit_count"]
            module_contributions[module][author]["lines_changed"] += (
                contrib["lines_added"] + contrib["lines_deleted"]
            )

        # Get unique contributors and modules
        all_contributors = set()
        all_modules = set(module_contributions.keys())

        for module_data in module_contributions.values():
            all_contributors.update(module_data.keys())

        contributors = sorted(all_contributors)
        modules = sorted(all_modules)

        # Build heatmap matrix with weighted effort scores
        # Score = commit_count × log(lines_changed + 1)
        import math

        matrix = []
        effort_scores = []

        for contributor in contributors:
            row = []
            row_scores = []
            for module in modules:
                data = module_contributions[module][contributor]
                commits = data["commits"]
                lines = data["lines_changed"]

                # Weighted effort score: commits × log(lines_changed + 1)
                # Using log to prevent large files from dominating
                effort_score = commits * math.log(lines + 1) if lines > 0 else 0
                row.append(effort_score)
                row_scores.append(
                    {
                        "commits": commits,
                        "lines_changed": lines,
                        "effort_score": effort_score,
                    }
                )

            matrix.append(row)
            effort_scores.append(row_scores)

        return {
            "matrix": matrix,
            "contributors": contributors,
            "modules": modules,
            "effort_scores": effort_scores,
        }

    def identify_neglected_modules(
        self,
        contributions: list[dict[str, Any]],
        days_back: int = 90,
        threshold_days: int = 30,
    ) -> list[dict[str, Any]]:
        """
        Identify modules with low activity over time window.

        Args:
            contributions: List of contribution records
            days_back: Time window to analyze
            threshold_days: Module is neglected if no activity in last N days

        Returns:
            List of neglected modules with:
            - module: Module name
            - days_since_last_activity: Days since last modification
            - total_contributions: Total contributions in time window
        """
        from collections import defaultdict

        module_last_activity: dict[str, datetime] = {}
        module_contribution_count: dict[str, int] = defaultdict(int)

        for contrib in contributions:
            file_path = contrib["file_path"]
            module = file_path.split("/")[0] if "/" in file_path else "root"
            timestamp = contrib["last_modified_timestamp"]

            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))

            module_contribution_count[module] += contrib["commit_count"]

            if (
                module not in module_last_activity
                or timestamp > module_last_activity[module]
            ):
                module_last_activity[module] = timestamp

        neglected = []
        now = datetime.now()

        for module, last_activity in module_last_activity.items():
            days_since = (now - last_activity).days
            if days_since > threshold_days:
                neglected.append(
                    {
                        "module": module,
                        "days_since_last_activity": days_since,
                        "total_contributions": module_contribution_count[module],
                    }
                )

        # Sort by days since last activity (most neglected first)
        neglected.sort(key=lambda x: x["days_since_last_activity"], reverse=True)

        return neglected

    def get_contributor_specializations(
        self, contributions: list[dict[str, Any]], top_n: int = 3
    ) -> dict[str, list[dict[str, Any]]]:
        """
        Identify each contributor's specialization (top modules by relative effort).

        Args:
            contributions: List of contribution records
            top_n: Number of top modules to return per contributor

        Returns:
            Dictionary mapping contributor -> list of specializations with:
            - module: Module name
            - effort_share: Percentage of contributor's total effort
            - commits: Number of commits
            - lines_changed: Total lines changed
        """
        import math
        from collections import defaultdict

        contributor_module_effort: dict[str, dict[str, dict[str, int]]] = defaultdict(
            lambda: defaultdict(lambda: {"commits": 0, "lines": 0})
        )

        # Aggregate contributions by contributor and module
        for contrib in contributions:
            author = contrib["author"]
            file_path = contrib["file_path"]
            module = file_path.split("/")[0] if "/" in file_path else "root"

            contributor_module_effort[author][module]["commits"] += contrib[
                "commit_count"
            ]
            contributor_module_effort[author][module]["lines"] += (
                contrib["lines_added"] + contrib["lines_deleted"]
            )

        specializations = {}

        for contributor, modules in contributor_module_effort.items():
            # Calculate total effort for this contributor
            total_effort = sum(
                data["commits"] * math.log(data["lines"] + 1)
                for data in modules.values()
                if data["lines"] > 0
            )

            if total_effort == 0:
                continue

            # Calculate effort share for each module
            module_efforts = []
            for module, data in modules.items():
                if data["lines"] > 0:
                    effort = data["commits"] * math.log(data["lines"] + 1)
                    effort_share = (
                        (effort / total_effort) * 100 if total_effort > 0 else 0
                    )

                    module_efforts.append(
                        {
                            "module": module,
                            "effort_share": round(effort_share, 2),
                            "commits": data["commits"],
                            "lines_changed": data["lines"],
                        }
                    )

            # Sort by effort share and take top N
            module_efforts.sort(key=lambda x: x["effort_share"], reverse=True)
            specializations[contributor] = module_efforts[:top_n]

        return specializations

    async def analyze_repository(
        self, repo_url: str, days_back: int = 90
    ) -> dict[str, Any]:
        """
        Complete repository contribution analysis.

        Returns:
            Dictionary with:
            - heatmap: Heatmap matrix data
            - neglected_modules: List of neglected modules
            - specializations: Contributor specialization data
        """
        # Fetch contribution data
        contributions = await self.get_contribution_data(repo_url, days_back)

        # Generate heatmap
        heatmap_data = self.generate_heatmap_data(contributions)

        # Identify neglected modules
        neglected = self.identify_neglected_modules(contributions, days_back)

        # Get specializations
        specializations = self.get_contributor_specializations(contributions)

        return {
            "heatmap": heatmap_data,
            "neglected_modules": neglected,
            "specializations": specializations,
            "summary": {
                "total_contributions": len(contributions),
                "unique_contributors": len(heatmap_data["contributors"]),
                "unique_modules": len(heatmap_data["modules"]),
                "analysis_period_days": days_back,
            },
        }
