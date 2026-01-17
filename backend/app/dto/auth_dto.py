"""Authentication DTOs"""

from pydantic import BaseModel, EmailStr


class RegisterDTO(BaseModel):
    """User registration request"""

    email: EmailStr
    password: str


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
