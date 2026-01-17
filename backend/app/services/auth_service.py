"""Authentication Service - Supabase Auth Operations"""

from supabase import Client

from ..dto.auth_dto import LoginDTO, RegisterDTO, TokenDTO, UserResponseDTO


class AuthService:
    """Service for handling Supabase authentication operations"""

    def __init__(self, supabase: Client):
        self.supabase = supabase

    def register(self, data: RegisterDTO) -> UserResponseDTO:
        """Register a new user"""
        response = self.supabase.auth.sign_up(
            {
                "email": data.email,
                "password": data.password,
            }
        )

        if response.user is None:
            raise ValueError("Registration failed")

        return UserResponseDTO(
            id=str(response.user.id),
            email=response.user.email or "",
            created_at=str(response.user.created_at)
            if response.user.created_at
            else None,
        )

    def login(self, data: LoginDTO) -> TokenDTO:
        """Login user and return tokens"""
        response = self.supabase.auth.sign_in_with_password(
            {
                "email": data.email,
                "password": data.password,
            }
        )

        if response.session is None:
            raise ValueError("Login failed")

        return TokenDTO(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            expires_in=response.session.expires_in,
        )

    def logout(self, access_token: str) -> bool:
        """Logout user (invalidate session)"""
        try:
            self.supabase.auth.sign_out()
            return True
        except Exception:
            return False

    def get_user(self, access_token: str) -> UserResponseDTO | None:
        """Get current user information from token"""
        try:
            response = self.supabase.auth.get_user(access_token)
            if response.user:
                return UserResponseDTO(
                    id=str(response.user.id),
                    email=response.user.email or "",
                    created_at=str(response.user.created_at)
                    if response.user.created_at
                    else None,
                )
            return None
        except Exception:
            return None

    def refresh_token(self, refresh_token: str) -> TokenDTO | None:
        """Refresh access token using refresh token"""
        try:
            response = self.supabase.auth.refresh_session(refresh_token)
            if response.session:
                return TokenDTO(
                    access_token=response.session.access_token,
                    refresh_token=response.session.refresh_token,
                    expires_in=response.session.expires_in,
                )
            return None
        except Exception:
            return None
