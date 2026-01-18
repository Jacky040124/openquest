"""Issue DTOs"""

from datetime import datetime

from pydantic import BaseModel, field_validator


class IssueFilterDTO(BaseModel):
    """Issue filter request parameters"""

    repo_url: str
    tags: list[str] = ["good first issue", "help wanted"]
    languages: list[str] | None = None
    exclude_assigned: bool = True
    limit: int = 20

    @field_validator("repo_url")
    @classmethod
    def validate_repo_url(cls, v: str) -> str:
        """Validate and normalize repository URL"""
        if not v:
            raise ValueError("repo_url is required")

        # Ensure URL has protocol
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            # If it's a GitHub URL without protocol, add https://
            if "github.com" in v:
                v = f"https://{v}" if not v.startswith("//") else f"https:{v}"
            else:
                v = f"https://{v}"

        return v


class IssueDTO(BaseModel):
    """Issue response"""

    id: int
    number: int  # The human-readable issue number (e.g., #123)
    title: str
    url: str
    labels: list[str]
    language: str | None = None
    created_at: datetime
    is_assigned: bool
    comments_count: int

    model_config = {"from_attributes": True}
