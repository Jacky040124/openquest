"""Authentication DTOs"""

from pydantic import BaseModel, EmailStr, field_validator


class RegisterDTO(BaseModel):
    """User registration request"""

    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Validate email format with helpful error message"""
        # EmailStr already validates, but we can add custom message
        # Check for common mistakes
        if "@" not in v:
            raise ValueError("Email must contain '@' symbol (e.g., user@example.com)")
        parts = v.split("@")
        if len(parts) != 2:
            raise ValueError("Invalid email format. Expected format: user@domain.com")
        if not parts[1] or "." not in parts[1]:
            raise ValueError(
                "Invalid email format. Domain must include a top-level domain "
                "(e.g., user@example.com, not user@123)"
            )
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password with helpful error message"""
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v


class LoginDTO(BaseModel):
    """User login request"""

    email: EmailStr
    password: str


class TokenDTO(BaseModel):
    """Authentication token response"""

    access_token: str
    token_type: str = "bearer"
    refresh_token: str | None = None
    expires_in: int | None = None


class UserResponseDTO(BaseModel):
    """User information response"""

    id: str
    email: str
    created_at: str | None = None

    model_config = {"from_attributes": True}
