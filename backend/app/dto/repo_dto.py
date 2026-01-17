"""Repository DTOs"""

from pydantic import BaseModel


class RepoRecommendQueryDTO(BaseModel):
    """Repository recommendation query parameters"""

    limit: int = 10
    min_stars: int = 100
    max_stars: int | None = None


class RepoDTO(BaseModel):
    """Repository response"""

    id: int
    name: str
    full_name: str
    url: str
    description: str | None = None
    language: str
    stars: int
    open_issues_count: int
    topics: list[str]
    good_first_issue_count: int

    model_config = {"from_attributes": True}
