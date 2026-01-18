"""Agent DTO - Data Transfer Objects for Agent communication"""

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class AgentStep(str, Enum):
    """Agent execution steps"""

    CLONING = "cloning"
    ANALYZING = "analyzing"
    PROPOSING = "proposing"
    IMPLEMENTING = "implementing"
    PUSHING = "pushing"
    DONE = "done"
    ERROR = "error"


class AgentAnalyzeRequest(BaseModel):
    """Request to analyze a GitHub issue"""

    repo_url: str = Field(..., description="GitHub repository URL")
    issue_title: str = Field(..., description="Issue title")
    issue_body: str = Field(..., description="Issue body/description")
    issue_number: int = Field(..., description="Issue number")


class AgentImplementRequest(BaseModel):
    """Request to implement the solution from a previous analysis"""

    session_id: str = Field(..., description="Session ID from analyze response")
    branch_name: str = Field(..., description="Git branch name to create")
    github_token: str = Field(..., description="GitHub OAuth token for pushing")
    commit_message: str | None = Field(
        None,
        description="Custom commit message (uses solution's message if not provided)",
    )


class AgentStatusEvent(BaseModel):
    """Status update event during agent execution"""

    type: Literal["status"] = "status"
    step: AgentStep
    message: str


class AgentThinkingEvent(BaseModel):
    """Agent thinking/reasoning event"""

    type: Literal["thinking"] = "thinking"
    content: str


class AgentToolEvent(BaseModel):
    """Tool execution event"""

    type: Literal["tool"] = "tool"
    tool_name: str
    tool_input: dict[str, Any]
    tool_result: str | None = None


class AgentSolutionEvent(BaseModel):
    """Final solution event with session_id for subsequent implement call"""

    type: Literal["solution"] = "solution"
    session_id: str | None = Field(
        None, description="Session ID to use for implement endpoint"
    )
    data: dict[str, Any] = Field(
        ...,
        description="Solution data containing summary, affected_files, solution, code_changes, commit_message",
    )


class AgentErrorEvent(BaseModel):
    """Error event"""

    type: Literal["error"] = "error"
    message: str


class AgentDoneEvent(BaseModel):
    """Done event signaling completion"""

    type: Literal["done"] = "done"


class AgentDiffEvent(BaseModel):
    """Diff event showing code changes"""

    type: Literal["diff"] = "diff"
    data: str = Field(..., description="Git diff output")


class AgentImplementResultEvent(BaseModel):
    """Result event after successful implementation"""

    type: Literal["result"] = "result"
    branch: str = Field(..., description="Branch name created")
    branch_url: str = Field(..., description="URL to the branch on user's fork")
    pr_url: str = Field(
        ..., description="URL to create a PR from fork to original repo"
    )
    diff: str = Field(..., description="Git diff of the changes")


# Union type for all agent events
AgentEvent = (
    AgentStatusEvent
    | AgentThinkingEvent
    | AgentToolEvent
    | AgentSolutionEvent
    | AgentErrorEvent
    | AgentDoneEvent
    | AgentDiffEvent
    | AgentImplementResultEvent
)


# =============================================================================
# Response Models for REST endpoints
# =============================================================================


class SessionResponse(BaseModel):
    """Response for GET /sessions/{session_id}"""

    session_id: str = Field(..., description="The session ID")
    repo_url: str = Field(..., description="GitHub repository URL")
    issue_number: int = Field(..., description="GitHub issue number")
    issue_title: str = Field(..., description="GitHub issue title")
    created_at: str = Field(
        ..., description="ISO format datetime when session was created"
    )
    expires_at: str = Field(..., description="ISO format datetime when session expires")
    status: str = Field(
        ...,
        description="Session status: pending, implementing, completed, expired, failed",
    )
    solution_summary: str = Field(
        ..., description="Brief summary of the proposed solution"
    )


class DeleteSessionResponse(BaseModel):
    """Response for DELETE /sessions/{session_id}"""

    message: str = Field(..., description="Confirmation message")


class AgentHealthChecks(BaseModel):
    """Health check details"""

    openrouter_configured: bool = Field(
        ..., description="Whether OpenRouter API key is set"
    )
    e2b_configured: bool = Field(..., description="Whether E2B API key is set")


class AgentHealthResponse(BaseModel):
    """Response for GET /health"""

    status: Literal["healthy", "degraded"] = Field(
        ..., description="Overall health status"
    )
    checks: AgentHealthChecks = Field(..., description="Individual health checks")
    active_sessions: int = Field(..., description="Number of active agent sessions")
