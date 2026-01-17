"""User Preference Data Access Object"""

from uuid import UUID

from sqlalchemy.orm import Session

from ..models.user_preference import UserPreference
from .base import BaseDAO


class UserPreferenceDAO(BaseDAO[UserPreference]):
    """DAO for UserPreference model"""

    def __init__(self, db: Session):
        super().__init__(UserPreference, db)

    def get_by_user_id(self, user_id: UUID) -> UserPreference | None:
        """Get user preference by user_id (Supabase auth.users.id)"""
        return (
            self.db.query(UserPreference)
            .filter(UserPreference.user_id == user_id)
            .first()
        )

    def create_or_update(
        self,
        user_id: UUID,
        languages: list[str],
        skills: list[dict],
        project_interests: list[str],
        issue_interests: list[str],
    ) -> UserPreference:
        """Create or update user preference"""
        existing = self.get_by_user_id(user_id)

        if existing:
            return self.update(
                existing,
                {
                    "languages": languages,
                    "skills": skills,
                    "project_interests": project_interests,
                    "issue_interests": issue_interests,
                },
            )
        else:
            return self.create(
                {
                    "user_id": user_id,
                    "languages": languages,
                    "skills": skills,
                    "project_interests": project_interests,
                    "issue_interests": issue_interests,
                }
            )

    def update_partial(
        self,
        user_id: UUID,
        languages: list[str] | None = None,
        skills: list[dict] | None = None,
        project_interests: list[str] | None = None,
        issue_interests: list[str] | None = None,
    ) -> UserPreference | None:
        """Partially update user preference (only provided fields)"""
        existing = self.get_by_user_id(user_id)

        if not existing:
            return None

        update_data = {}
        if languages is not None:
            update_data["languages"] = languages
        if skills is not None:
            update_data["skills"] = skills
        if project_interests is not None:
            update_data["project_interests"] = project_interests
        if issue_interests is not None:
            update_data["issue_interests"] = issue_interests

        if update_data:
            return self.update(existing, update_data)
        return existing

    def delete_by_user_id(self, user_id: UUID) -> bool:
        """Delete user preference by user_id"""
        preference = self.get_by_user_id(user_id)
        if preference:
            self.db.delete(preference)
            self.db.commit()
            return True
        return False
