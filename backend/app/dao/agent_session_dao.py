"""Agent Session Data Access Object - Supabase persistence for agent sessions"""

import logging
import traceback
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from supabase import Client

logger = logging.getLogger("agent.dao")


@dataclass
class AgentSessionRecord:
    """Represents an agent session from the database"""

    id: str
    user_id: str
    repo_url: str
    issue_number: int
    issue_title: str
    solution: dict[str, Any]
    created_at: datetime
    last_accessed_at: datetime
    expires_at: datetime
    status: str

    @property
    def is_expired(self) -> bool:
        """Check if the session has expired"""
        return datetime.now(UTC) > self.expires_at


class AgentSessionDAO:
    """DAO for agent sessions using Supabase"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table = "agent_sessions"

    def create(
        self,
        user_id: str,
        repo_url: str,
        issue_number: int,
        issue_title: str,
        solution: dict[str, Any],
    ) -> str:
        """
        Create a new agent session.

        Args:
            user_id: The user's ID
            repo_url: GitHub repository URL
            issue_number: Issue number
            issue_title: Issue title
            solution: The analysis solution dict

        Returns:
            The session ID
        """
        logger.info(
            f"Creating session: user_id={user_id}, repo_url={repo_url}, "
            f"issue_number={issue_number}, issue_title={issue_title[:50]}..."
        )
        logger.debug(
            f"Solution data keys: {list(solution.keys()) if solution else 'None'}"
        )

        now = datetime.now(UTC)
        expires_at = now + timedelta(hours=1)

        data = {
            "user_id": user_id,
            "repo_url": repo_url,
            "issue_number": issue_number,
            "issue_title": issue_title,
            "solution": solution,
            "created_at": now.isoformat(),
            "last_accessed_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "status": "pending",
        }

        logger.debug(f"Inserting data into {self.table}")

        try:
            response = self.supabase.table(self.table).insert(data).execute()
            logger.debug(f"Supabase response: data={response.data is not None}")

            if response.data:
                session_id = response.data[0]["id"]
                logger.info(f"Session created successfully: {session_id}")
                return session_id

            logger.error("No data returned from Supabase insert")
            raise Exception("Failed to create session - no data returned")
        except Exception as e:
            logger.error(f"Failed to create session: {type(e).__name__}: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise

    def get(self, session_id: str) -> AgentSessionRecord | None:
        """
        Get a session by ID.

        Args:
            session_id: The session ID

        Returns:
            The session record if found, None otherwise
        """
        try:
            response = (
                self.supabase.table(self.table)
                .select("*")
                .eq("id", session_id)
                .maybe_single()
                .execute()
            )

            if not response.data:
                return None

            return self._dict_to_record(response.data)
        except Exception:
            return None

    def get_by_user(self, user_id: str) -> list[AgentSessionRecord]:
        """
        Get all sessions for a user.

        Args:
            user_id: The user ID

        Returns:
            List of session records
        """
        try:
            response = (
                self.supabase.table(self.table)
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )

            if not response.data:
                return []

            return [self._dict_to_record(d) for d in response.data]
        except Exception:
            return []

    def update_last_accessed(self, session_id: str) -> bool:
        """
        Update last_accessed_at to reset the TTL.
        The database trigger will automatically update expires_at.

        Args:
            session_id: The session ID

        Returns:
            True if updated, False otherwise
        """
        try:
            now = datetime.now(UTC)
            expires_at = now + timedelta(hours=1)

            response = (
                self.supabase.table(self.table)
                .update(
                    {
                        "last_accessed_at": now.isoformat(),
                        "expires_at": expires_at.isoformat(),
                    }
                )
                .eq("id", session_id)
                .execute()
            )

            return bool(response.data)
        except Exception:
            return False

    def set_status(self, session_id: str, status: str) -> bool:
        """
        Update the session status.

        Args:
            session_id: The session ID
            status: New status (pending, implementing, completed, expired, failed)

        Returns:
            True if updated, False otherwise
        """
        try:
            response = (
                self.supabase.table(self.table)
                .update({"status": status})
                .eq("id", session_id)
                .execute()
            )

            return bool(response.data)
        except Exception:
            return False

    def delete(self, session_id: str) -> bool:
        """
        Delete a session.

        Args:
            session_id: The session ID

        Returns:
            True if deleted, False otherwise
        """
        try:
            response = (
                self.supabase.table(self.table).delete().eq("id", session_id).execute()
            )

            return bool(response.data)
        except Exception:
            return False

    def cleanup_expired(self) -> int:
        """
        Delete all expired sessions.

        Returns:
            Number of sessions deleted
        """
        try:
            now = datetime.now(UTC)

            response = (
                self.supabase.table(self.table)
                .delete()
                .lt("expires_at", now.isoformat())
                .execute()
            )

            return len(response.data) if response.data else 0
        except Exception:
            return 0

    def count_by_user(self, user_id: str) -> int:
        """
        Count active sessions for a user.

        Args:
            user_id: The user ID

        Returns:
            Number of active sessions
        """
        try:
            response = (
                self.supabase.table(self.table)
                .select("id", count="exact")
                .eq("user_id", user_id)
                .gt("expires_at", datetime.now(UTC).isoformat())
                .execute()
            )

            return response.count or 0
        except Exception:
            return 0

    def _dict_to_record(self, data: dict) -> AgentSessionRecord:
        """Convert dictionary to AgentSessionRecord"""
        return AgentSessionRecord(
            id=data["id"],
            user_id=data["user_id"],
            repo_url=data["repo_url"],
            issue_number=data["issue_number"],
            issue_title=data["issue_title"],
            solution=data["solution"],
            created_at=self._parse_datetime(data["created_at"]),
            last_accessed_at=self._parse_datetime(data["last_accessed_at"]),
            expires_at=self._parse_datetime(data["expires_at"]),
            status=data["status"],
        )

    def _parse_datetime(self, value: str | datetime) -> datetime:
        """Parse datetime from string or return as-is"""
        if isinstance(value, datetime):
            return value
        # Handle ISO format with Z suffix
        if value.endswith("Z"):
            value = value[:-1] + "+00:00"
        return datetime.fromisoformat(value)
