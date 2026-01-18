"""Data Transfer Objects Package"""

from .auth_dto import LoginDTO, RegisterDTO, TokenDTO, UserResponseDTO
from .issue_dto import IssueDTO, IssueFilterDTO
from .repo_dto import RepoDTO, RepoRecommendQueryDTO
from .user_dto import (
    SkillDTO,
    SkillInputDTO,
    UserPreferenceCreateDTO,
    UserPreferenceDTO,
    UserPreferenceUpdateDTO,
)

__all__ = [
    "LoginDTO",
    "RegisterDTO",
    "TokenDTO",
    "UserResponseDTO",
    "IssueDTO",
    "IssueFilterDTO",
    "RepoDTO",
    "RepoRecommendQueryDTO",
    "SkillDTO",
    "SkillInputDTO",
    "UserPreferenceDTO",
    "UserPreferenceCreateDTO",
    "UserPreferenceUpdateDTO",
]
