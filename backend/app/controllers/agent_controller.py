"""Agent Controller - SSE endpoints for agent operations"""

import logging
from collections.abc import AsyncGenerator

from fastapi import APIRouter, HTTPException, status
from sse_starlette.sse import EventSourceResponse

from ..dao.agent_session_dao import AgentSessionDAO
from ..dto.agent_dto import (
    AgentAnalyzeRequest,
    AgentDoneEvent,
    AgentErrorEvent,
    AgentHealthChecks,
    AgentHealthResponse,
    AgentImplementRequest,
    AgentSolutionEvent,
    DeleteSessionResponse,
    SessionResponse,
)
from ..services.agent_service import AgentService
from ..services.openrouter_service import OpenRouterService
from ..utils.dependencies import CurrentUser
from ..utils.supabase_client import get_supabase_client

router = APIRouter(prefix="/agent", tags=["Agent"])
logger = logging.getLogger("agent")


def get_session_dao() -> AgentSessionDAO:
    """Get AgentSessionDAO instance"""
    return AgentSessionDAO(get_supabase_client())


@router.post("/analyze")
async def analyze_issue(
    request: AgentAnalyzeRequest,
    current_user: CurrentUser,
) -> EventSourceResponse:
    """
    Analyze a GitHub issue and stream results via SSE.

    This endpoint starts an agent that:
    1. Clones the repository into an E2B sandbox
    2. Explores the codebase using LLM-driven tool calls
    3. Analyzes the issue and proposes a solution
    4. Streams progress events back to the client
    5. Saves session to database and returns session_id

    **SSE Event Types:**
    - `status`: Current step status (cloning, analyzing, proposing, done)
    - `thinking`: Agent's reasoning/thinking process
    - `tool`: Tool execution (name, input, result)
    - `solution`: Final solution with code changes AND session_id
    - `error`: Error message if something fails
    - `done`: Signals completion

    The solution event includes a `session_id` that can be used with
    the `/implement` endpoint to execute the code changes.
    Session expires after 1 hour of inactivity.

    Args:
        request: Analysis request containing repo URL and issue details
        current_user: Authenticated user (from JWT token)

    Returns:
        EventSourceResponse streaming agent events
    """
    user_id = str(current_user["id"])
    session_dao = get_session_dao()

    logger.info(
        "Starting issue analysis",
        extra={
            "user_id": user_id,
            "repo_url": request.repo_url,
            "issue_number": request.issue_number,
        },
    )

    async def event_generator() -> AsyncGenerator[dict, None]:
        agent: AgentService | None = None
        session_id: str | None = None
        solution_data: dict | None = None
        event_count = 0

        logger.info(f"[SSE] Starting event generator for user {user_id}")

        try:
            # Initialize agent service
            logger.info("[SSE] Initializing OpenRouterService...")
            openrouter = OpenRouterService()
            logger.info("[SSE] OpenRouterService initialized")

            logger.info("[SSE] Initializing AgentService...")
            agent = AgentService(openrouter)
            logger.info("[SSE] AgentService initialized")

            # Stream events from agent
            logger.info("[SSE] Starting to stream events from agent...")
            async for event in agent.analyze_issue_stream(request):
                event_count += 1
                logger.info(f"[SSE] Received event #{event_count}: type={event.type}")

                # Intercept solution event to save to database
                if event.type == "solution":
                    logger.info("[SSE] Processing solution event")
                    solution_data = event.data
                    logger.info(
                        f"[SSE] Solution data keys: {list(solution_data.keys()) if solution_data else 'None'}"
                    )

                    # Save session to Supabase
                    try:
                        logger.info("[SSE] Attempting to save session to database...")
                        session_id = session_dao.create(
                            user_id=user_id,
                            repo_url=request.repo_url,
                            issue_number=request.issue_number,
                            issue_title=request.issue_title,
                            solution=solution_data,
                        )
                        logger.info(f"[SSE] Session saved successfully: {session_id}")
                    except Exception as e:
                        import traceback

                        logger.error(
                            f"[SSE] Failed to save session: {type(e).__name__}: {e}"
                        )
                        logger.error(f"[SSE] Traceback: {traceback.format_exc()}")
                        # Still yield the solution even if session save fails
                        session_id = None

                    # Yield solution with session_id
                    event_data = AgentSolutionEvent(
                        session_id=session_id,
                        data=solution_data,
                    ).model_dump_json()
                    logger.info(
                        f"[SSE] Yielding solution event (session_id={session_id})"
                    )
                    yield {
                        "event": "solution",
                        "data": event_data,
                    }
                else:
                    event_data = event.model_dump_json()
                    logger.debug(f"[SSE] Yielding event: type={event.type}")
                    yield {
                        "event": event.type,
                        "data": event_data,
                    }

            logger.info(f"[SSE] Finished streaming events. Total events: {event_count}")

        except ValueError as e:
            # Configuration errors (missing API keys, etc.)
            import traceback

            logger.error(f"[SSE] Configuration error: {e}")
            logger.error(f"[SSE] Traceback: {traceback.format_exc()}")
            yield {
                "event": "error",
                "data": AgentErrorEvent(
                    message=f"Configuration error: {e}"
                ).model_dump_json(),
            }

        except Exception as e:
            # Unexpected errors
            import traceback

            logger.error(
                f"[SSE] Unexpected error during analysis: {type(e).__name__}: {e}"
            )
            logger.error(f"[SSE] Traceback: {traceback.format_exc()}")
            yield {
                "event": "error",
                "data": AgentErrorEvent(message=str(e)).model_dump_json(),
            }

        finally:
            # Always send done event
            logger.info("[SSE] Sending done event and cleaning up")
            yield {
                "event": "done",
                "data": AgentDoneEvent().model_dump_json(),
            }

    return EventSourceResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.post("/implement")
async def implement_solution(
    request: AgentImplementRequest,
    current_user: CurrentUser,
) -> EventSourceResponse:
    """
    Implement the solution from a previous analysis.

    This endpoint:
    1. Retrieves the session from database
    2. Creates a fresh sandbox and clones the repo
    3. Creates a new git branch
    4. Writes the code changes
    5. Commits and pushes to user's GitHub fork

    **Prerequisites:**
    - A valid session_id from the analyze endpoint (not expired)
    - GitHub token with repo scope

    **SSE Event Types:**
    - `status`: Current step status (cloning, implementing, pushing, done)
    - `diff`: Git diff of the changes
    - `result`: Final result with branch URL and PR URL
    - `error`: Error message if something fails
    - `done`: Signals completion

    Args:
        request: Implement request with session_id and branch name
        current_user: Authenticated user (from JWT token)

    Returns:
        EventSourceResponse streaming implementation events
    """
    user_id = str(current_user["id"])
    session_dao = get_session_dao()

    # Get session from database
    session = session_dao.get(request.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # Verify session belongs to user
    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session does not belong to current user",
        )

    # Check if session is expired
    if session.is_expired:
        # Mark as expired in database
        session_dao.set_status(request.session_id, "expired")
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Session has expired. Please analyze the issue again.",
        )

    # Update last_accessed_at to reset TTL
    session_dao.update_last_accessed(request.session_id)

    # Mark as implementing
    session_dao.set_status(request.session_id, "implementing")

    logger.info(
        "Starting implementation",
        extra={
            "user_id": user_id,
            "session_id": request.session_id,
            "branch_name": request.branch_name,
        },
    )

    async def event_generator() -> AsyncGenerator[dict, None]:
        success = False
        try:
            # Create a fresh agent service (will create new sandbox)
            agent = AgentService()

            # Stream implementation events
            async for event in agent.implement_solution_stream(
                solution=session.solution,
                repo_url=session.repo_url,
                branch_name=request.branch_name,
                github_token=request.github_token,
                commit_message=request.commit_message,
            ):
                yield {
                    "event": event.type,
                    "data": event.model_dump_json(),
                }

                # Check if this was a successful result
                if event.type == "result":
                    success = True

        except Exception as e:
            logger.error("Implementation failed", extra={"error": str(e)})
            yield {
                "event": "error",
                "data": AgentErrorEvent(message=str(e)).model_dump_json(),
            }

        finally:
            # Update session status based on result
            if success:
                session_dao.set_status(request.session_id, "completed")
            else:
                session_dao.set_status(request.session_id, "failed")

            yield {
                "event": "done",
                "data": AgentDoneEvent().model_dump_json(),
            }

    return EventSourceResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: CurrentUser,
) -> SessionResponse:
    """
    Get information about an agent session.

    Also updates last_accessed_at to reset TTL.

    Args:
        session_id: The session ID
        current_user: Authenticated user

    Returns:
        Session information including repo URL and expiry time
    """
    user_id = str(current_user["id"])
    session_dao = get_session_dao()

    session = session_dao.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session does not belong to current user",
        )

    # Update last_accessed_at to reset TTL
    session_dao.update_last_accessed(session_id)

    return SessionResponse(
        session_id=session_id,
        repo_url=session.repo_url,
        issue_number=session.issue_number,
        issue_title=session.issue_title,
        created_at=session.created_at.isoformat(),
        expires_at=session.expires_at.isoformat(),
        status=session.status,
        solution_summary=session.solution.get("summary", ""),
    )


@router.delete("/sessions/{session_id}", response_model=DeleteSessionResponse)
async def delete_session(
    session_id: str,
    current_user: CurrentUser,
) -> DeleteSessionResponse:
    """
    Delete an agent session.

    Args:
        session_id: The session ID
        current_user: Authenticated user

    Returns:
        Confirmation message
    """
    user_id = str(current_user["id"])
    session_dao = get_session_dao()

    session = session_dao.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session does not belong to current user",
        )

    session_dao.delete(session_id)

    return DeleteSessionResponse(message="Session deleted successfully")


@router.get("/sessions")
async def list_sessions(current_user: CurrentUser) -> list[SessionResponse]:
    """
    List all sessions for the current user.

    Args:
        current_user: Authenticated user

    Returns:
        List of session info
    """
    user_id = str(current_user["id"])
    session_dao = get_session_dao()

    sessions = session_dao.get_by_user(user_id)

    return [
        SessionResponse(
            session_id=s.id,
            repo_url=s.repo_url,
            issue_number=s.issue_number,
            issue_title=s.issue_title,
            created_at=s.created_at.isoformat(),
            expires_at=s.expires_at.isoformat(),
            status=s.status,
            solution_summary=s.solution.get("summary", ""),
        )
        for s in sessions
    ]


@router.post("/sessions/cleanup")
async def cleanup_expired_sessions(current_user: CurrentUser) -> dict:
    """
    Clean up expired sessions (admin/maintenance endpoint).

    Args:
        current_user: Authenticated user

    Returns:
        Number of sessions cleaned up
    """
    session_dao = get_session_dao()
    count = session_dao.cleanup_expired()

    logger.info("Cleaned up expired sessions", extra={"count": count})

    return {"deleted": count}


@router.get("/health", response_model=AgentHealthResponse)
async def agent_health() -> AgentHealthResponse:
    """
    Health check for agent service.

    Verifies that required configuration is present:
    - OpenRouter API key
    - E2B API key

    Returns:
        Health status and configuration check results
    """
    from ..config import get_settings

    settings = get_settings()

    checks = AgentHealthChecks(
        openrouter_configured=bool(settings.openrouter_api_key),
        e2b_configured=bool(settings.e2b_api_key),
    )

    all_healthy = checks.openrouter_configured and checks.e2b_configured

    # Note: active_sessions now comes from database
    # We don't query here to keep health check fast
    return AgentHealthResponse(
        status="healthy" if all_healthy else "degraded",
        checks=checks,
        active_sessions=0,  # Placeholder - would need DB query
    )
