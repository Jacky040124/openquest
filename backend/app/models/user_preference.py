"""User Preference Model and Skill Definitions"""

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import ARRAY, DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class SkillCategory(str, Enum):
    """Skill category enumeration"""

    PROGRAMMING_LANGUAGE = "programming_language"
    FRAMEWORK = "framework"
    TOOL = "tool"
    DATABASE = "database"
    CLOUD = "cloud"
    DEVOPS = "devops"
    OTHER = "other"


class Familiarity(str, Enum):
    """Skill familiarity/proficiency level enumeration"""

    BEGINNER = "beginner"          # 初学者 - 了解基础概念
    INTERMEDIATE = "intermediate"  # 中级 - 能独立完成任务
    ADVANCED = "advanced"          # 高级 - 能解决复杂问题
    EXPERT = "expert"              # 专家 - 深入理解，能指导他人


class SkillName(str, Enum):
    """Available skill names enumeration"""

    # Programming Languages
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    GO = "go"
    RUST = "rust"
    JAVA = "java"
    CPP = "cpp"
    CSHARP = "csharp"
    RUBY = "ruby"
    PHP = "php"
    SWIFT = "swift"
    KOTLIN = "kotlin"

    # Frameworks
    REACT = "react"
    VUE = "vue"
    ANGULAR = "angular"
    NEXTJS = "nextjs"
    DJANGO = "django"
    FASTAPI = "fastapi"
    SPRING = "spring"
    EXPRESS = "express"
    FLASK = "flask"

    # Tools
    DOCKER = "docker"
    KUBERNETES = "kubernetes"
    GIT = "git"
    NGINX = "nginx"
    GRAPHQL = "graphql"

    # Databases
    POSTGRES = "postgres"
    MONGODB = "mongodb"
    REDIS = "redis"
    MYSQL = "mysql"
    SQLITE = "sqlite"

    # Cloud Platforms
    AWS = "aws"
    GCP = "gcp"
    AZURE = "azure"


# Mapping of skill names to their categories
SKILL_CATEGORY_MAP: dict[SkillName, SkillCategory] = {
    # Programming Languages
    SkillName.PYTHON: SkillCategory.PROGRAMMING_LANGUAGE,
    SkillName.JAVASCRIPT: SkillCategory.PROGRAMMING_LANGUAGE,
    SkillName.TYPESCRIPT: SkillCategory.PROGRAMMING_LANGUAGE,
    SkillName.GO: SkillCategory.PROGRAMMING_LANGUAGE,
    SkillName.RUST: SkillCategory.PROGRAMMING_LANGUAGE,
    SkillName.JAVA: SkillCategory.PROGRAMMING_LANGUAGE,
    SkillName.CPP: SkillCategory.PROGRAMMING_LANGUAGE,
    SkillName.CSHARP: SkillCategory.PROGRAMMING_LANGUAGE,
    SkillName.RUBY: SkillCategory.PROGRAMMING_LANGUAGE,
    SkillName.PHP: SkillCategory.PROGRAMMING_LANGUAGE,
    SkillName.SWIFT: SkillCategory.PROGRAMMING_LANGUAGE,
    SkillName.KOTLIN: SkillCategory.PROGRAMMING_LANGUAGE,
    # Frameworks
    SkillName.REACT: SkillCategory.FRAMEWORK,
    SkillName.VUE: SkillCategory.FRAMEWORK,
    SkillName.ANGULAR: SkillCategory.FRAMEWORK,
    SkillName.NEXTJS: SkillCategory.FRAMEWORK,
    SkillName.DJANGO: SkillCategory.FRAMEWORK,
    SkillName.FASTAPI: SkillCategory.FRAMEWORK,
    SkillName.SPRING: SkillCategory.FRAMEWORK,
    SkillName.EXPRESS: SkillCategory.FRAMEWORK,
    SkillName.FLASK: SkillCategory.FRAMEWORK,
    # Tools
    SkillName.DOCKER: SkillCategory.DEVOPS,
    SkillName.KUBERNETES: SkillCategory.DEVOPS,
    SkillName.GIT: SkillCategory.TOOL,
    SkillName.NGINX: SkillCategory.TOOL,
    SkillName.GRAPHQL: SkillCategory.TOOL,
    # Databases
    SkillName.POSTGRES: SkillCategory.DATABASE,
    SkillName.MONGODB: SkillCategory.DATABASE,
    SkillName.REDIS: SkillCategory.DATABASE,
    SkillName.MYSQL: SkillCategory.DATABASE,
    SkillName.SQLITE: SkillCategory.DATABASE,
    # Cloud
    SkillName.AWS: SkillCategory.CLOUD,
    SkillName.GCP: SkillCategory.CLOUD,
    SkillName.AZURE: SkillCategory.CLOUD,
}


class ProjectInterest(str, Enum):
    """Project type interests - what kind of projects you want to work on"""

    # Application Types
    WEBAPP = "webapp"                    # Web 应用
    MOBILE = "mobile"                    # 移动应用
    DESKTOP = "desktop"                  # 桌面应用
    CLI = "cli"                          # 命令行工具
    API = "api"                          # API/后端服务
    LIBRARY = "library"                  # 库/SDK

    # Domain-specific
    LLM = "llm"                          # 大语言模型
    ML = "ml"                            # 机器学习
    DATA = "data"                        # 数据处理/分析
    DEVTOOLS = "devtools"                # 开发者工具
    GAME = "game"                        # 游戏
    BLOCKCHAIN = "blockchain"            # 区块链
    IOT = "iot"                          # 物联网
    SECURITY = "security"                # 安全工具
    AUTOMATION = "automation"            # 自动化工具
    INFRASTRUCTURE = "infrastructure"    # 基础设施


class IssueInterest(str, Enum):
    """Issue type interests - what kind of issues you want to work on"""

    # Code Changes
    BUG_FIX = "bug_fix"                  # Bug 修复
    FEATURE = "feature"                  # 新功能
    ENHANCEMENT = "enhancement"          # 功能增强
    OPTIMIZATION = "optimization"        # 性能优化
    REFACTOR = "refactor"                # 代码重构

    # Quality
    TESTING = "testing"                  # 测试相关
    DOCUMENTATION = "documentation"      # 文档
    ACCESSIBILITY = "accessibility"      # 可访问性
    SECURITY = "security"                # 安全修复
    UI_UX = "ui_ux"                      # UI/UX 改进

    # Maintenance
    DEPENDENCY = "dependency"            # 依赖更新
    CI_CD = "ci_cd"                      # CI/CD 相关
    CLEANUP = "cleanup"                  # 代码清理


class Skill(BaseModel):
    """Structured skill with name, category, and familiarity"""

    name: SkillName
    category: SkillCategory
    familiarity: Familiarity

    @classmethod
    def create(cls, name: SkillName, familiarity: Familiarity) -> "Skill":
        """Create a skill with auto-resolved category"""
        category = SKILL_CATEGORY_MAP.get(name, SkillCategory.OTHER)
        return cls(name=name, category=category, familiarity=familiarity)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON storage"""
        return {
            "name": self.name.value,
            "category": self.category.value,
            "familiarity": self.familiarity.value,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Skill":
        """Create from dictionary"""
        return cls(
            name=SkillName(data["name"]),
            category=SkillCategory(data["category"]),
            familiarity=Familiarity(data["familiarity"]),
        )


class Base(DeclarativeBase):
    """SQLAlchemy Declarative Base"""

    pass


class UserPreference(Base):
    """User Preference Model - stored in local database"""

    __tablename__ = "user_preferences"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        unique=True,
        nullable=False,
        index=True,
        comment="FK -> Supabase auth.users",
    )
    languages: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        default=list,
        comment="Programming languages like Python, TypeScript, Go",
    )
    skills: Mapped[list[dict]] = mapped_column(
        JSONB,
        default=list,
        comment="List of Skill objects with name, category, familiarity",
    )
    project_interests: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        default=list,
        comment="Project types from ProjectInterest enum (webapp, llm, mobile, etc.)",
    )
    issue_interests: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        default=list,
        comment="Issue types from IssueInterest enum (bug_fix, optimization, etc.)",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    def get_skills(self) -> list[Skill]:
        """Get skills as Skill objects"""
        return [Skill.from_dict(s) for s in (self.skills or [])]

    def set_skills(self, skills: list[Skill]) -> None:
        """Set skills from Skill objects"""
        self.skills = [s.to_dict() for s in skills]

    def __repr__(self) -> str:
        return f"<UserPreference(user_id={self.user_id})>"
