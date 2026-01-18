"""Contribution Analysis DTOs"""

from pydantic import BaseModel, HttpUrl, field_validator


class ContributionAnalysisQueryDTO(BaseModel):
    """Query parameters for contribution analysis"""

    repo_url: str
    days_back: int = 90

    @field_validator("repo_url")
    @classmethod
    def validate_repo_url(cls, v: str) -> str:
        """Validate and normalize repository URL"""
        if not v:
            raise ValueError("repo_url is required")

        v = v.strip()
        if not v.startswith(("http://", "https://")):
            if "github.com" in v:
                v = f"https://{v}" if not v.startswith("//") else f"https:{v}"
            else:
                v = f"https://{v}"

        return v

    @field_validator("days_back")
    @classmethod
    def validate_days_back(cls, v: int) -> int:
        """Validate days_back is reasonable"""
        if v < 1:
            raise ValueError("days_back must be at least 1")
        if v > 365:
            raise ValueError("days_back cannot exceed 365 days")
        return v


class HeatmapDataDTO(BaseModel):
    """Heatmap matrix data"""

    matrix: list[list[float]]
    contributors: list[str]
    modules: list[str]
    effort_scores: list[list[dict]]


class NeglectedModuleDTO(BaseModel):
    """Neglected module information"""

    module: str
    days_since_last_activity: int
    total_contributions: int


class ContributorSpecializationDTO(BaseModel):
    """Contributor specialization information"""

    module: str
    effort_share: float
    commits: int
    lines_changed: int


class ContributionAnalysisDTO(BaseModel):
    """Complete contribution analysis response"""

    heatmap: HeatmapDataDTO
    neglected_modules: list[NeglectedModuleDTO]
    specializations: dict[str, list[ContributorSpecializationDTO]]
    summary: dict[str, int | str]

