"""User Preference DTOs"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator

from ..models.user_preference import (
    SKILL_CATEGORY_MAP,
    Familiarity,
    IssueInterest,
    ProjectInterest,
    Skill,
    SkillCategory,
    SkillName,
)


class SkillInputDTO(BaseModel):
    """Skill input for creating/updating preferences"""

    name: SkillName
    familiarity: Familiarity
    category: SkillCategory | None = None  # Auto-resolved if not provided

    @field_validator("category", mode="before")
    @classmethod
    def resolve_category(cls, v, info):
        """Auto-resolve category from skill name if not provided"""
        if v is None and "name" in info.data:
            return SKILL_CATEGORY_MAP.get(info.data["name"], SkillCategory.OTHER)
        return v

    def to_skill(self) -> Skill:
        """Convert to Skill model"""
        category = self.category or SKILL_CATEGORY_MAP.get(
            self.name, SkillCategory.OTHER
        )
        return Skill(name=self.name, category=category, familiarity=self.familiarity)


class SkillDTO(BaseModel):
    """Skill response DTO"""

    name: str
    category: str
    familiarity: str

    @classmethod
    def from_skill(cls, skill: Skill) -> "SkillDTO":
        """Create from Skill model"""
        return cls(
            name=skill.name.value,
            category=skill.category.value,
            familiarity=skill.familiarity.value,
        )

    @classmethod
    def from_dict(cls, data: dict) -> "SkillDTO":
        """Create from dictionary"""
        return cls(
            name=data["name"],
            category=data["category"],
            familiarity=data["familiarity"],
        )


class UserPreferenceCreateDTO(BaseModel):
    """User preference creation request"""

    user_name: str | None = None
    languages: list[str] = []
    skills: list[SkillInputDTO] = []
    project_interests: list[ProjectInterest] = []
    issue_interests: list[IssueInterest] = []
    github_token: str | None = None
    github_username: str | None = None


class UserPreferenceUpdateDTO(BaseModel):
    """User preference update request"""

    user_name: str | None = None
    languages: list[str] | None = None
    skills: list[SkillInputDTO] | None = None
    project_interests: list[ProjectInterest] | None = None
    issue_interests: list[IssueInterest] | None = None
    github_token: str | None = None
    github_username: str | None = None


class UserPreferenceDTO(BaseModel):
    """User preference response"""

    id: UUID
    user_id: UUID
    user_name: str | None = None
    languages: list[str]
    skills: list[SkillDTO]
    project_interests: list[str]
    issue_interests: list[str]
    github_username: str | None = None
    github_connected: bool = False
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, model) -> "UserPreferenceDTO":
        """Create from SQLAlchemy model"""
        skills = [SkillDTO.from_dict(s) for s in (model.skills or [])]
        return cls(
            id=model.id,
            user_id=model.user_id,
            user_name=model.user_name,
            languages=model.languages or [],
            skills=skills,
            project_interests=model.project_interests or [],
            issue_interests=model.issue_interests or [],
            github_username=model.github_username,
            github_connected=model.github_token is not None,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    model_config = {"from_attributes": True}


class GitHubConnectDTO(BaseModel):
    """Request to connect GitHub account"""

    access_token: str
    username: str


class GitHubStatusDTO(BaseModel):
    """GitHub connection status response"""

    connected: bool
    username: str | None = None
