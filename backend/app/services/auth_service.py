"""Authentication Service - Supabase Auth Operations"""

import logging

from supabase import Client

from ..dto.auth_dto import LoginDTO, RegisterDTO, TokenDTO, UserResponseDTO

logger = logging.getLogger(__name__)


class AuthService:
    """Service for handling Supabase authentication operations"""

    def __init__(self, supabase: Client):
        self.supabase = supabase

    def register(self, data: RegisterDTO) -> UserResponseDTO:
        """
        Register a new user.
        
        Note: If email confirmation is enabled in Supabase, the user will need to
        confirm their email before they can log in. The registration will still
        succeed and return the user object.
        """
        try:
            # Validate password length (Supabase minimum is typically 6 characters)
            if len(data.password) < 6:
                raise ValueError("Password must be at least 6 characters long")
            
            response = self.supabase.auth.sign_up(
                {
                    "email": data.email,
                    "password": data.password,
                }
            )

            # Check if registration was successful
            if response.user is None:
                # Check for error message in response
                error_msg = getattr(response, "message", None) or "Registration failed"
                logger.error(f"Registration failed: {error_msg}")
                raise ValueError(f"Registration failed: {error_msg}")

            # Handle email confirmation scenario
            # When email confirmation is enabled, session might be None
            # but user object is still created
            if response.session is None:
                logger.info(
                    f"User registered but email confirmation required: {response.user.email}"
                )

            return UserResponseDTO(
                id=str(response.user.id),
                email=response.user.email or "",
                created_at=str(response.user.created_at)
                if response.user.created_at
                else None,
            )
        except ValueError:
            # Re-raise ValueError (validation errors)
            raise
        except Exception as e:
            # Catch Supabase-specific exceptions
            error_msg = str(e)
            logger.error(f"Registration error: {error_msg}")
            
            # Handle common Supabase errors
            if "already registered" in error_msg.lower() or "already exists" in error_msg.lower():
                raise ValueError("Email already registered")
            elif "password" in error_msg.lower():
                raise ValueError(f"Password validation failed: {error_msg}")
            elif "email" in error_msg.lower():
                raise ValueError(f"Invalid email: {error_msg}")
            else:
                raise ValueError(f"Registration failed: {error_msg}")

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
