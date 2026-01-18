"""Prompt Service - Build LLM Prompts from User Preferences"""

from string import Template

from ..models.user_preference import UserPreference


class PromptService:
    """Service for building LLM prompts from user preferences"""

    # System prompt for repository recommendation
    SYSTEM_PROMPT = """You are an expert open-source project recommender specializing in matching developers with GitHub repositories.

Your role is to recommend real, existing GitHub repositories that:
1. Match the user's programming languages and skills
2. Align with their project interests
3. Have issues suitable for their skill level and issue interests
4. Are actively maintained and welcoming to contributors
5. Have "good first issue" labels for beginners

You must return ONLY a valid JSON array of repositories. Each repository must have accurate, real information from GitHub.

Important guidelines:
- Only recommend repositories that actually exist on GitHub
- Prioritize repositories with active maintainers and recent commits
- Consider the user's familiarity level when matching difficulty
- Include a mix of popular and lesser-known but quality projects
- Focus on repositories with good documentation and contribution guidelines"""

    # User prompt template with variables
    USER_PROMPT_TEMPLATE = """Based on the following user preferences, recommend GitHub repositories for open-source contribution.

## User Profile

### Programming Languages
$languages

### Technical Skills (with proficiency levels)
$skills

### Project Interests
$project_interests

### Issue Type Preferences
$issue_interests

## Search Criteria
- Minimum stars: $min_stars
- Maximum stars: $max_stars
- Number of recommendations: $limit

## Required Output Format

Return a JSON array with exactly $limit repositories. Each repository object must have this exact structure:

```json
[
  {
    "id": 123456789,
    "name": "repository-name",
    "full_name": "owner/repository-name",
    "url": "https://github.com/owner/repository-name",
    "description": "A brief description of the repository",
    "language": "Python",
    "stars": 1500,
    "open_issues_count": 42,
    "topics": ["python", "web", "api"],
    "good_first_issue_count": 5
  }
]
```

Respond with ONLY the JSON array, no additional text or explanation."""

    def __init__(self):
        self.user_template = Template(self.USER_PROMPT_TEMPLATE)

    def build_recommendation_prompt(
        self,
        user_preference: UserPreference | None,
        limit: int = 10,
        min_stars: int = 100,
        max_stars: int | None = None,
    ) -> tuple[str, str]:
        """
        Build system and user prompts for repository recommendation.

        Args:
            user_preference: User's preference model (can be None for defaults)
            limit: Number of recommendations to request
            min_stars: Minimum star count filter
            max_stars: Maximum star count filter (optional)

        Returns:
            Tuple of (system_prompt, user_prompt)
        """
        # Format user preferences or use defaults
        if user_preference:
            languages = self._format_languages(user_preference.languages)
            skills = self._format_skills(user_preference.skills)
            project_interests = self._format_project_interests(
                user_preference.project_interests
            )
            issue_interests = self._format_issue_interests(
                user_preference.issue_interests
            )
        else:
            languages = "No specific preference (recommend popular languages)"
            skills = (
                "No specific skills provided (recommend beginner-friendly projects)"
            )
            project_interests = "Open to all project types"
            issue_interests = "Open to all issue types"

        # Format max_stars
        max_stars_str = str(max_stars) if max_stars else "No limit"

        # Substitute template variables
        user_prompt = self.user_template.substitute(
            languages=languages,
            skills=skills,
            project_interests=project_interests,
            issue_interests=issue_interests,
            limit=limit,
            min_stars=min_stars,
            max_stars=max_stars_str,
        )

        return self.SYSTEM_PROMPT, user_prompt

    def _format_languages(self, languages: list[str] | None) -> str:
        """Format programming languages list for prompt"""
        if not languages:
            return "No specific preference"
        return ", ".join(languages)

    def _format_skills(self, skills: list[dict] | None) -> str:
        """Format skills with familiarity levels for prompt"""
        if not skills:
            return "No specific skills provided"

        # Group skills by familiarity level
        familiarity_groups: dict[str, list[str]] = {
            "expert": [],
            "advanced": [],
            "intermediate": [],
            "beginner": [],
        }

        for skill in skills:
            name = skill.get("name", "unknown")
            familiarity = skill.get("familiarity", "beginner")
            category = skill.get("category", "other")

            skill_str = f"{name} ({category})"
            if familiarity in familiarity_groups:
                familiarity_groups[familiarity].append(skill_str)
            else:
                familiarity_groups["beginner"].append(skill_str)

        # Format output
        lines = []
        for level, skill_list in familiarity_groups.items():
            if skill_list:
                level_display = level.capitalize()
                lines.append(f"- {level_display}: {', '.join(skill_list)}")

        return "\n".join(lines) if lines else "No specific skills provided"

    def _format_project_interests(self, interests: list[str] | None) -> str:
        """Format project interests for prompt"""
        if not interests:
            return "Open to all project types"

        # Map enum values to human-readable names
        interest_names = {
            "webapp": "Web Applications",
            "mobile": "Mobile Apps",
            "desktop": "Desktop Applications",
            "cli": "Command Line Tools",
            "api": "APIs & Backend Services",
            "library": "Libraries & SDKs",
            "llm": "Large Language Models",
            "ml": "Machine Learning",
            "data": "Data Processing & Analytics",
            "devtools": "Developer Tools",
            "game": "Games",
            "blockchain": "Blockchain",
            "iot": "Internet of Things",
            "security": "Security Tools",
            "automation": "Automation",
            "infrastructure": "Infrastructure",
        }

        formatted = [interest_names.get(i, i) for i in interests]
        return ", ".join(formatted)

    def _format_issue_interests(self, interests: list[str] | None) -> str:
        """Format issue type interests for prompt"""
        if not interests:
            return "Open to all issue types"

        # Map enum values to human-readable names
        interest_names = {
            "bug_fix": "Bug Fixes",
            "feature": "New Features",
            "enhancement": "Enhancements",
            "optimization": "Performance Optimization",
            "refactor": "Code Refactoring",
            "testing": "Testing",
            "documentation": "Documentation",
            "accessibility": "Accessibility",
            "security": "Security",
            "ui_ux": "UI/UX Improvements",
            "dependency": "Dependency Updates",
            "ci_cd": "CI/CD",
            "cleanup": "Code Cleanup",
        }

        formatted = [interest_names.get(i, i) for i in interests]
        return ", ".join(formatted)

    def get_repo_json_schema(self) -> dict:
        """Get JSON schema for repository recommendation response"""
        return {
            "name": "repo_recommendations",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "repositories": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "integer"},
                                "name": {"type": "string"},
                                "full_name": {"type": "string"},
                                "url": {"type": "string"},
                                "description": {"type": ["string", "null"]},
                                "language": {"type": "string"},
                                "stars": {"type": "integer"},
                                "open_issues_count": {"type": "integer"},
                                "topics": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                                "good_first_issue_count": {"type": "integer"},
                            },
                            "required": [
                                "id",
                                "name",
                                "full_name",
                                "url",
                                "language",
                                "stars",
                                "open_issues_count",
                                "topics",
                                "good_first_issue_count",
                            ],
                            "additionalProperties": False,
                        },
                    },
                },
                "required": ["repositories"],
                "additionalProperties": False,
            },
        }

    # System prompt for issue ranking
    ISSUE_RANKING_SYSTEM_PROMPT = """You are an expert at matching developers with suitable GitHub issues for contribution.

Your role is to rank and filter GitHub issues based on:
1. The user's programming languages and skills
2. Their skill level (beginner, intermediate, advanced, expert)
3. Their issue type preferences (bug fixes, features, documentation, etc.)
4. Issue difficulty and complexity
5. How well the issue matches their interests

You will receive a list of issues from a repository and should return them ranked by relevance, with the most suitable issues first."""

    # User prompt template for issue ranking
    ISSUE_RANKING_PROMPT_TEMPLATE = """Rank the following GitHub issues from the repository "$repo_name" based on the user's preferences.

## User Profile

### Programming Languages
$languages

### Technical Skills (with proficiency levels)
$skills

### Issue Type Preferences
$issue_interests

## Issues to Rank

$issues_list

## Instructions

1. Analyze each issue's title, labels, and context
2. Rank issues by how well they match the user's:
   - Programming languages and skills
   - Skill level (prioritize issues appropriate for their familiarity)
   - Issue type preferences
   - Overall fit for contribution
3. Return the top $limit issues, ranked from most to least suitable

## Required Output Format

Return a JSON object with a "ranked_issue_ids" array containing the issue IDs in order of relevance (most relevant first):

```json
{
  "ranked_issue_ids": [123, 456, 789, ...]
}
```

Only include issue IDs that are suitable for the user. If fewer than $limit issues are suitable, return only those."""

    def build_issue_ranking_prompt(
        self,
        user_preference: UserPreference | None,
        repo_name: str,
        issues: list[dict],
        limit: int = 20,
    ) -> tuple[str, str]:
        """
        Build system and user prompts for issue ranking.

        Args:
            user_preference: User's preference model (can be None for defaults)
            repo_name: Name of the repository (e.g., "owner/repo")
            issues: List of issue dictionaries with id, title, labels, etc.
            limit: Number of top issues to return

        Returns:
            Tuple of (system_prompt, user_prompt)
        """
        # Format user preferences or use defaults
        if user_preference:
            languages = self._format_languages(user_preference.languages)
            skills = self._format_skills(user_preference.skills)
            issue_interests = self._format_issue_interests(
                user_preference.issue_interests
            )
        else:
            languages = "No specific preference"
            skills = "No specific skills provided"
            issue_interests = "Open to all issue types"

        # Format issues list
        issues_list = []
        for issue in issues:
            issue_str = f"- Issue #{issue.get('id', 'unknown')}: {issue.get('title', 'No title')}"
            labels = issue.get('labels', [])
            if labels:
                issue_str += f" [Labels: {', '.join(labels)}]"
            issues_list.append(issue_str)

        issues_text = "\n".join(issues_list) if issues_list else "No issues provided"

        # Substitute template variables
        from string import Template
        user_template = Template(self.ISSUE_RANKING_PROMPT_TEMPLATE)
        user_prompt = user_template.substitute(
            repo_name=repo_name,
            languages=languages,
            skills=skills,
            issue_interests=issue_interests,
            issues_list=issues_text,
            limit=limit,
        )

        return self.ISSUE_RANKING_SYSTEM_PROMPT, user_prompt

    def get_issue_ranking_json_schema(self) -> dict:
        """Get JSON schema for issue ranking response"""
        return {
            "name": "issue_ranking",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "ranked_issue_ids": {
                        "type": "array",
                        "items": {"type": "integer"},
                    },
                },
                "required": ["ranked_issue_ids"],
                "additionalProperties": False,
            },
        }
