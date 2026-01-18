"""Repository Service - LLM-based Repo Recommendation Logic"""

import logging
from uuid import UUID

from pydantic import ValidationError
from supabase import Client

from ..dao.user_preference_dao import UserPreferenceDAO
from ..dto.repo_dto import RepoDTO, RepoRecommendQueryDTO
from .github_service import GitHubService
from .openrouter_service import OpenRouterService
from .prompt_service import PromptService

logger = logging.getLogger(__name__)


class RepoService:
    """Service for repository recommendation based on user preferences using LLM"""

    def __init__(
        self,
        github_service: GitHubService,
        supabase: Client,
        openrouter_service: OpenRouterService | None = None,
        prompt_service: PromptService | None = None,
    ):
        self.github_service = github_service
        self.supabase = supabase
        self.user_preference_dao = UserPreferenceDAO(supabase)
        self.openrouter_service = openrouter_service
        self.prompt_service = prompt_service or PromptService()

    async def recommend_repos(
        self,
        user_id: UUID,
        query: RepoRecommendQueryDTO | None = None,
    ) -> list[RepoDTO]:
        """
        Recommend repositories based on user preferences using LLM.

        Falls back to GitHub API search if LLM is not available or fails.

        Args:
            user_id: The user's ID (from Supabase auth)
            query: Optional query parameters for filtering

        Returns:
            List of recommended repositories
        """
        # Get user preferences
        user_preference = self.user_preference_dao.get_by_user_id(user_id)

        # Get query parameters
        limit = query.limit if query else 10
        min_stars = query.min_stars if query else 100
        max_stars = query.max_stars if query else None

        # Try LLM-based recommendations first
        if self.openrouter_service:
            try:
                repos = await self._get_llm_recommendations(
                    user_preference=user_preference,
                    limit=limit,
                    min_stars=min_stars,
                    max_stars=max_stars,
                )
                if repos:
                    return repos
            except Exception as e:
                logger.warning(
                    f"LLM recommendation failed, falling back to GitHub API: {e}"
                )

        # Fallback to GitHub API search
        return await self._get_github_recommendations(
            user_preference=user_preference,
            limit=limit,
            min_stars=min_stars,
            max_stars=max_stars,
        )

    async def _get_llm_recommendations(
        self,
        user_preference,
        limit: int,
        min_stars: int,
        max_stars: int | None,
    ) -> list[RepoDTO]:
        """
        Get repository recommendations using LLM.

        Args:
            user_preference: User's preference model (can be None)
            limit: Number of recommendations to request
            min_stars: Minimum star count filter
            max_stars: Maximum star count filter (optional)

        Returns:
            List of recommended repositories

        Raises:
            Exception: If LLM call or parsing fails
        """
        # Build prompts
        system_prompt, user_prompt = self.prompt_service.build_recommendation_prompt(
            user_preference=user_preference,
            limit=limit,
            min_stars=min_stars,
            max_stars=max_stars,
        )

        # Get JSON schema for structured output
        json_schema = self.prompt_service.get_repo_json_schema()

        # Call LLM
        response = await self.openrouter_service.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            json_schema=json_schema,
            temperature=0.7,
        )

        # Parse and validate response
        repos = self._parse_llm_response(response)

        # Filter by language if user has language preferences (PRIMARY requirement)
        if user_preference and user_preference.languages:
            languages_lower = [lang.lower() for lang in user_preference.languages]
            filtered_repos = [
                repo
                for repo in repos
                if repo.language and repo.language.lower() in languages_lower
            ]
            if filtered_repos:
                repos = filtered_repos
            else:
                # If no repos match language, log warning but return empty
                logger.warning(
                    f"LLM returned no repositories matching user languages: {user_preference.languages}"
                )

        return repos

    def _parse_llm_response(self, response: dict) -> list[RepoDTO]:
        """
        Parse and validate LLM response into RepoDTO list.

        Args:
            response: JSON response from LLM

        Returns:
            List of validated RepoDTO objects

        Raises:
            ValueError: If response format is invalid
        """
        # Handle both array and object with repositories key
        if isinstance(response, list):
            repo_data = response
        elif isinstance(response, dict):
            if "repositories" in response:
                repo_data = response["repositories"]
            else:
                # Try to find an array in the response
                for value in response.values():
                    if isinstance(value, list):
                        repo_data = value
                        break
                else:
                    raise ValueError("No repository array found in LLM response")
        else:
            raise ValueError(f"Unexpected response type: {type(response)}")

        repos = []
        for item in repo_data:
            try:
                # Validate and create RepoDTO
                repo = RepoDTO(
                    id=item.get("id", 0),
                    name=item.get("name", ""),
                    full_name=item.get("full_name", ""),
                    url=item.get("url", ""),
                    description=item.get("description"),
                    language=item.get("language", "Unknown"),
                    stars=item.get("stars", 0),
                    open_issues_count=item.get("open_issues_count", 0),
                    topics=item.get("topics", []),
                    good_first_issue_count=item.get("good_first_issue_count", 0),
                )
                repos.append(repo)
            except ValidationError as e:
                logger.warning(f"Failed to validate repo from LLM response: {e}")
                continue

        if not repos:
            raise ValueError("No valid repositories in LLM response")

        return repos

    async def _get_github_recommendations(
        self,
        user_preference,
        limit: int,
        min_stars: int,
        max_stars: int | None,
    ) -> list[RepoDTO]:
        """
        Get repository recommendations using GitHub API (fallback).

        Language is PRIMARY - if user has language preferences, only return repos in those languages.
        Other preferences (skills, project interests) are SECONDARY.

        Args:
            user_preference: User's preference model (can be None)
            limit: Number of recommendations to request
            min_stars: Minimum star count filter
            max_stars: Maximum star count filter (optional)

        Returns:
            List of recommended repositories filtered by language (if specified)
        """
        if not user_preference:
            return await self.github_service.search_repos(
                min_stars=min_stars,
                has_good_first_issues=True,
                limit=limit,
            )

        # Extract preferences - LANGUAGE IS PRIMARY
        languages = user_preference.languages or []
        skills = user_preference.skills or []
        project_interests = user_preference.project_interests or []

        # If user has language preferences, they are MANDATORY
        # Search for repositories - language is required if specified
        repos = await self.github_service.search_repos(
            languages=languages if languages else None,
            topics=None,  # Topics are secondary, only use if no language filter
            min_stars=min_stars,
            max_stars=max_stars,
            has_good_first_issues=True,
            limit=limit * 2,  # Fetch more to filter by secondary criteria
        )

        # Filter results to ensure language match (PRIMARY requirement)
        if languages:
            # Normalize language names for comparison
            languages_lower = [lang.lower() for lang in languages]
            filtered_repos = [
                repo
                for repo in repos
                if repo.language and repo.language.lower() in languages_lower
            ]
            repos = filtered_repos

        # If we have enough repos after language filtering, apply secondary filters
        if len(repos) >= limit:
            # Map skills to topics for secondary filtering
            topics = self._skills_to_topics(skills)
            topics.extend(self._project_interests_to_topics(project_interests))

            # Score repos by secondary criteria (topics match)
            if topics:
                scored_repos = []
                for repo in repos:
                    score = 0
                    repo_topics_lower = [t.lower() for t in repo.topics]
                    for topic in topics:
                        if topic.lower() in repo_topics_lower:
                            score += 1
                    scored_repos.append((score, repo))

                # Sort by secondary score (descending), then by stars
                scored_repos.sort(key=lambda x: (x[0], x[1].stars), reverse=True)
                repos = [repo for _, repo in scored_repos]

        # Return top N repos
        return repos[:limit]

    def _skills_to_topics(self, skills: list[dict]) -> list[str]:
        """
        Map skills to GitHub topics.

        Skills are structured objects with name, category, and familiarity.
        We prioritize skills with higher familiarity levels.
        """
        skill_topic_map = {
            "python": "python",
            "javascript": "javascript",
            "typescript": "typescript",
            "go": "golang",
            "rust": "rust",
            "java": "java",
            "react": "react",
            "vue": "vuejs",
            "angular": "angular",
            "nextjs": "nextjs",
            "django": "django",
            "fastapi": "fastapi",
            "spring": "spring-boot",
            "express": "expressjs",
            "flask": "flask",
            "docker": "docker",
            "kubernetes": "kubernetes",
            "aws": "aws",
            "gcp": "google-cloud",
            "azure": "azure",
            "postgres": "postgresql",
            "mongodb": "mongodb",
            "redis": "redis",
            "mysql": "mysql",
            "graphql": "graphql",
            "git": "git",
            "nginx": "nginx",
        }

        # Sort skills by familiarity level (expert > advanced > intermediate > beginner)
        familiarity_order = {
            "expert": 0,
            "advanced": 1,
            "intermediate": 2,
            "beginner": 3,
        }
        sorted_skills = sorted(
            skills,
            key=lambda s: familiarity_order.get(s.get("familiarity", "beginner"), 4),
        )

        topics = []
        for skill in sorted_skills:
            skill_name = skill.get("name", "").lower()
            if skill_name in skill_topic_map:
                topic = skill_topic_map[skill_name]
                if topic not in topics:
                    topics.append(topic)

        return topics

    def _project_interests_to_topics(self, project_interests: list[str]) -> list[str]:
        """Map ProjectInterest enum values to GitHub topics"""
        project_topic_map = {
            "webapp": "web",
            "mobile": "mobile",
            "desktop": "desktop",
            "cli": "cli",
            "api": "api",
            "library": "library",
            "llm": "llm",
            "ml": "machine-learning",
            "data": "data-science",
            "devtools": "developer-tools",
            "game": "game",
            "blockchain": "blockchain",
            "iot": "iot",
            "security": "security",
            "automation": "automation",
            "infrastructure": "infrastructure",
        }

        topics = []
        for interest in project_interests:
            if interest in project_topic_map:
                topic = project_topic_map[interest]
                if topic not in topics:
                    topics.append(topic)

        return topics
