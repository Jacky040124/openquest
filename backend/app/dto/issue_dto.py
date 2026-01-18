"""Issue DTOs"""

from datetime import datetime

from pydantic import BaseModel, HttpUrl


class IssueFilterDTO(BaseModel):
    """Issue filter request parameters"""

    repo_url: HttpUrl
    tags: list[str] = ["good first issue", "help wanted"]
    languages: list[str] | None = None
    exclude_assigned: bool = True
    limit: int = 20


class IssueDTO(BaseModel):
    """Issue response"""

    id: int
    title: str
    url: str
    labels: list[str]
    language: str | None = None
    created_at: datetime
    is_assigned: bool
    comments_count: int

    model_config = {"from_attributes": True}
