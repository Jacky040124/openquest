"""Supabase Client Initialization"""

from functools import lru_cache

from supabase import Client, create_client

from ..config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    """Get cached Supabase client instance"""
    settings = get_settings()
    
    if not settings.supabase_url or not settings.supabase_key:
        raise ValueError(
            "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY "
            "environment variables or in .env file."
        )
    
    return create_client(settings.supabase_url, settings.supabase_key)
