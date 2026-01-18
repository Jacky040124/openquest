"""User Preference Data Access Object"""

from datetime import datetime
from uuid import UUID

from supabase import Client

from ..models.user_preference import UserPreference


class UserPreferenceDAO:
    """DAO for UserPreference model using Supabase"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table = "user_preferences"

    def get_by_user_id(self, user_id: UUID) -> UserPreference | None:
        """Get user preference by user_id (Supabase auth.users.id)"""
        try:
            response = (
                self.supabase.table(self.table)
                .select("*")
                .eq("user_id", str(user_id))
                .maybe_single()
                .execute()
            )

            if not response.data:
                return None

            return self._dict_to_model(response.data)
        except Exception:
            return None

    def create_or_update(
        self,
        user_id: UUID,
        languages: list[str],
        skills: list[dict],
        project_interests: list[str],
        issue_interests: list[str],
        github_token: str | None = None,
        github_username: str | None = None,
    ) -> UserPreference:
        """Create or update user preference"""
        existing = self.get_by_user_id(user_id)

        data = {
            "user_id": str(user_id),
            "languages": languages,
            "skills": skills,
            "project_interests": project_interests,
            "issue_interests": issue_interests,
            "updated_at": datetime.utcnow().isoformat(),
        }

        # Only include GitHub fields if provided
        if github_token is not None:
            data["github_token"] = github_token
        if github_username is not None:
            data["github_username"] = github_username

        if existing:
            # Update existing
            response = (
                self.supabase.table(self.table)
                .update(data)
                .eq("user_id", str(user_id))
                .execute()
            )
            return self._dict_to_model(response.data[0] if response.data else data)
        else:
            # Create new
            data["created_at"] = datetime.utcnow().isoformat()
            response = self.supabase.table(self.table).insert(data).execute()
            return self._dict_to_model(response.data[0] if response.data else data)

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

        update_data = {"updated_at": datetime.utcnow().isoformat()}
        if languages is not None:
            update_data["languages"] = languages
        if skills is not None:
            update_data["skills"] = skills
        if project_interests is not None:
            update_data["project_interests"] = project_interests
        if issue_interests is not None:
            update_data["issue_interests"] = issue_interests

        if len(update_data) > 1:  # More than just updated_at
            response = (
                self.supabase.table(self.table)
                .update(update_data)
                .eq("user_id", str(user_id))
                .execute()
            )
            return self._dict_to_model(
                response.data[0]
                if response.data
                else {**existing.__dict__, **update_data}
            )
        return existing

    def update_github(
        self,
        user_id: UUID,
        github_token: str | None,
        github_username: str | None,
    ) -> UserPreference | None:
        """Update GitHub token and username for a user"""
        existing = self.get_by_user_id(user_id)

        if not existing:
            return None

        update_data = {
            "github_token": github_token,
            "github_username": github_username,
            "updated_at": datetime.utcnow().isoformat(),
        }

        response = (
            self.supabase.table(self.table)
            .update(update_data)
            .eq("user_id", str(user_id))
            .execute()
        )

        return self._dict_to_model(
            response.data[0] if response.data else {**existing.__dict__, **update_data}
        )

    def delete_by_user_id(self, user_id: UUID) -> bool:
        """Delete user preference by user_id"""
        try:
            response = (
                self.supabase.table(self.table)
                .delete()
                .eq("user_id", str(user_id))
                .execute()
            )
            return len(response.data) > 0 if response.data else False
        except Exception:
            return False

    def _dict_to_model(self, data: dict) -> UserPreference:
        """Convert dictionary to UserPreference model"""

        # Create a simple object that mimics the SQLAlchemy model
        class PreferenceObj:
            def __init__(self, data: dict):
                self.id = (
                    UUID(data["id"])
                    if isinstance(data.get("id"), str)
                    else data.get("id")
                )
                self.user_id = (
                    UUID(data["user_id"])
                    if isinstance(data.get("user_id"), str)
                    else data.get("user_id")
                )
                self.languages = data.get("languages", [])
                self.skills = data.get("skills", [])
                self.project_interests = data.get("project_interests", [])
                self.issue_interests = data.get("issue_interests", [])
                self.github_token = data.get("github_token")
                self.github_username = data.get("github_username")
                self.created_at = (
                    datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
                    if isinstance(data.get("created_at"), str)
                    else data.get("created_at")
                )
                self.updated_at = (
                    datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00"))
                    if isinstance(data.get("updated_at"), str)
                    else data.get("updated_at")
                )

        return PreferenceObj(data)
