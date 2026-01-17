"""Data Access Objects Package"""

from .base import BaseDAO
from .user_preference_dao import UserPreferenceDAO

__all__ = ["BaseDAO", "UserPreferenceDAO"]
