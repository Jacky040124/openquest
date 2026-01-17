"""Repository Service - Repo Recommendation Logic"""

from uuid import UUID

from sqlalchemy.orm import Session

from ..dao.user_preference_dao import UserPreferenceDAO
from ..dto.repo_dto import RepoDTO, RepoRecommendQueryDTO
from .github_service import GitHubService


class RepoService:
    """Service for repository recommendation based on user preferences"""

    def __init__(self, github_service: GitHubService, db: Session):
        self.github_service = github_service
        self.db = db
        self.user_preference_dao = UserPreferenceDAO(db)

    async def recommend_repos(
        self,
        user_id: UUID,
        query: RepoRecommendQueryDTO | None = None,
    ) -> list[RepoDTO]:
        """
        Recommend repositories based on user preferences.

        Args:
            user_id: The user's ID (from Supabase auth)
            query: Optional query parameters for filtering

        Returns:
            List of recommended repositories
        """
        # Get user preferences
        user_preference = self.user_preference_dao.get_by_user_id(user_id)

        if not user_preference:
            # Return default recommendations if no preferences set
            return await self._get_default_recommendations(query)

        # Extract preferences
        languages = user_preference.languages or []
        skills = user_preference.skills or []  # List of dicts with name, category, familiarity
        project_interests = user_preference.project_interests or []

        # Map skills to topics for GitHub search (prioritize by familiarity)
        topics = self._skills_to_topics(skills)

        # Add project interests as topics
        topics.extend(self._project_interests_to_topics(project_interests))

        # Get query parameters
        limit = query.limit if query else 10
        min_stars = query.min_stars if query else 100
        max_stars = query.max_stars if query else None

        # Search for repositories
        repos = await self.github_service.search_repos(
            languages=languages if languages else None,
            topics=topics if topics else None,
            min_stars=min_stars,
            max_stars=max_stars,
            has_good_first_issues=True,
            limit=limit,
        )

        return repos

    async def _get_default_recommendations(
        self, query: RepoRecommendQueryDTO | None = None
    ) -> list[RepoDTO]:
        """Get default recommendations for users without preferences"""
        limit = query.limit if query else 10
        min_stars = query.min_stars if query else 100

        return await self.github_service.search_repos(
            min_stars=min_stars,
            has_good_first_issues=True,
            limit=limit,
        )

    def _skills_to_topics(self, skills: list[dict]) -> list[str]:
        """
        Map skills to GitHub topics.

        Skills are now structured objects with name, category, and familiarity.
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
        familiarity_order = {"expert": 0, "advanced": 1, "intermediate": 2, "beginner": 3}
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
