"""FastAPI Dependencies"""

from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from supabase import Client

from ..config import get_settings
from .supabase_client import get_supabase_client

# Security scheme
security = HTTPBearer()

# Database engine and session factory (lazy initialization)
_engine = None
_SessionLocal = None


def _get_engine():
    """Get or create database engine"""
    global _engine
    if _engine is None:
        settings = get_settings()
        if settings.database_url:
            _engine = create_engine(settings.database_url, pool_pre_ping=True)
    return _engine


def _get_session_local():
    """Get or create session factory"""
    global _SessionLocal
    if _SessionLocal is None:
        engine = _get_engine()
        if engine:
            _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Get database session dependency"""
    SessionLocal = _get_session_local()
    if SessionLocal is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not configured",
        )
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_supabase() -> Client:
    """Get Supabase client dependency"""
    return get_supabase_client()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    supabase: Annotated[Client, Depends(get_supabase)],
) -> dict:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials

    try:
        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)
        if user_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {
            "id": user_response.user.id,
            "email": user_response.user.email,
            "created_at": str(user_response.user.created_at)
            if user_response.user.created_at
            else None,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Type aliases for dependency injection
DBSession = Annotated[Session, Depends(get_db)]
SupabaseClient = Annotated[Client, Depends(get_supabase)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
