"""Agent Service - Core agent loop with E2B sandbox and LLM integration"""

import logging
import os
import time
from collections.abc import AsyncGenerator
from typing import Any

from e2b_code_interpreter import Sandbox

from ..config import get_settings
from ..dto.agent_dto import (
    AgentAnalyzeRequest,
    AgentDiffEvent,
    AgentErrorEvent,
    AgentEvent,
    AgentImplementResultEvent,
    AgentSolutionEvent,
    AgentStatusEvent,
    AgentStep,
    AgentThinkingEvent,
    AgentToolEvent,
)
from ..utils.exceptions import (
    CloneError,
    LLMError,
    SandboxError,
    ToolExecutionError,
)
from .agent_tools import AGENT_TOOLS
from .openrouter_service import OpenRouterService

logger = logging.getLogger("agent")

# System prompt for issue analysis (Documentation Mode)
SYSTEM_PROMPT = """You are a senior software engineer analyzing a GitHub issue.

Your task:
1. Explore the codebase to understand the project structure
2. Find relevant files related to the issue
3. Analyze the root cause of the issue
4. Document your findings with explanations and comments

IMPORTANT WORKFLOW:
1. FIRST use get_file_tree to explore the project structure
2. Use search_code to find relevant files related to the issue keywords
3. Use read_file to examine the specific files you found
4. ONLY AFTER reading the actual files, provide your analysis

Use the available tools to read files, search code, and understand the codebase.

CRITICAL REQUIREMENTS:
- You MUST use read_file on files BEFORE including them in your analysis
- All file paths MUST be real paths you discovered
- NEVER use placeholder names like "unknown_file.tsx" or made-up paths
- If you cannot find the relevant files, say so instead of guessing

When you have enough information, provide your analysis in this JSON format:
```json
{
    "summary": "Brief description of the issue and root cause",
    "root_cause_analysis": "Detailed technical explanation of why this issue occurs",
    "affected_files": ["list", "of", "relevant", "files"],
    "key_insights": [
        {
            "file": "path/to/file.py",
            "line_range": "50-80",
            "code_snippet": "The relevant code snippet",
            "explanation": "What this code does and why it's relevant to the issue"
        }
    ],
    "suggested_fix": "High-level description of how to fix the issue",
    "comments_to_add": [
        {
            "file": "path/to/file.py",
            "line_number": 55,
            "comment": "# NOTE: This async generator needs an await statement to yield control back to the event loop"
        }
    ],
    "commit_message": "docs: add analysis for issue #X"
}
```

Focus on understanding and explaining the code, not on providing exact code fixes.
Be thorough in your analysis. Read relevant files, search for related code, and understand the context.
"""


class AgentService:
    """Service for running the agent loop with E2B sandbox"""

    def __init__(self, openrouter: OpenRouterService | None = None):
        settings = get_settings()
        self.settings = settings
        self.openrouter = openrouter or OpenRouterService()
        self.sandbox: Sandbox | None = None
        self.repo_path = "/home/user/repo"
        self.max_turns = settings.agent_max_turns
        self.max_tokens_per_tool = settings.agent_max_tokens_per_tool

    async def start_sandbox(self, repo_url: str) -> None:
        """
        Start E2B sandbox and clone the repository.

        Args:
            repo_url: GitHub repository URL to clone

        Raises:
            SandboxError: If sandbox creation fails
            CloneError: If git clone fails
        """
        logger.info(f"[SANDBOX] start_sandbox called with repo_url={repo_url}")
        settings = get_settings()

        if not settings.e2b_api_key:
            logger.error("[SANDBOX] E2B API key is not configured!")
            raise SandboxError("E2B API key is not configured")

        logger.info(
            f"[SANDBOX] E2B API key present (length={len(settings.e2b_api_key)})"
        )
        logger.info(f"[SANDBOX] Sandbox timeout: {settings.e2b_sandbox_timeout}s")

        # Set E2B API key as environment variable (SDK reads from env)
        os.environ["E2B_API_KEY"] = settings.e2b_api_key

        try:
            logger.info("[SANDBOX] Creating E2B sandbox...")
            # Use Sandbox.create() class method which accepts timeout
            self.sandbox = Sandbox.create(timeout=settings.e2b_sandbox_timeout)
            logger.info(
                f"[SANDBOX] Sandbox created successfully: id={self.sandbox.sandbox_id}"
            )
        except Exception as e:
            import traceback

            logger.error(f"[SANDBOX] Failed to create sandbox: {type(e).__name__}: {e}")
            logger.error(f"[SANDBOX] Traceback: {traceback.format_exc()}")
            raise SandboxError(f"Failed to create sandbox: {e}")

        # Clone the repository (shallow clone for speed - large repos like React can take forever otherwise)
        try:
            logger.info(f"[SANDBOX] Cloning repository (shallow): {repo_url}")
            clone_cmd = f"git clone --depth 1 {repo_url} {self.repo_path}"
            logger.debug(f"[SANDBOX] Clone command: {clone_cmd}")

            result = self.sandbox.commands.run(clone_cmd, timeout=120)
            logger.info(f"[SANDBOX] Clone exit code: {result.exit_code}")

            if result.stdout:
                logger.debug(f"[SANDBOX] Clone stdout: {result.stdout[:500]}")
            if result.stderr:
                logger.debug(f"[SANDBOX] Clone stderr: {result.stderr[:500]}")

            if result.exit_code != 0:
                logger.error(
                    f"[SANDBOX] Clone failed with exit code {result.exit_code}"
                )
                raise CloneError(repo_url, result.stderr or "Unknown error")

            logger.info("[SANDBOX] Repository cloned successfully")
        except CloneError:
            raise
        except Exception as e:
            import traceback

            logger.error(f"[SANDBOX] Clone failed: {type(e).__name__}: {e}")
            logger.error(f"[SANDBOX] Traceback: {traceback.format_exc()}")
            raise CloneError(repo_url, str(e))

    async def _start_sandbox_with_fork(self, fork_url: str, upstream_url: str) -> None:
        """
        Start E2B sandbox, clone user's fork, and sync with upstream.

        This ensures the branch we create is based on the upstream's main branch,
        so when pushed to the fork, it can be properly compared on GitHub.

        Args:
            fork_url: User's fork URL (with auth token embedded)
            upstream_url: Original/upstream repository URL

        Raises:
            SandboxError: If sandbox creation fails
            CloneError: If git operations fail
        """
        settings = get_settings()

        if not settings.e2b_api_key:
            raise SandboxError("E2B API key is not configured")

        os.environ["E2B_API_KEY"] = settings.e2b_api_key

        try:
            logger.info("Creating E2B sandbox for fork workflow")
            self.sandbox = Sandbox.create(timeout=settings.e2b_sandbox_timeout)
            logger.info(
                "Sandbox created",
                extra={"sandbox_id": self.sandbox.sandbox_id},
            )
        except Exception as e:
            logger.error("Failed to create sandbox", extra={"error": str(e)})
            raise SandboxError(f"Failed to create sandbox: {e}")

        try:
            # Verify sandbox is ready
            if not self.sandbox:
                raise SandboxError("Sandbox not initialized before clone")

            # Clone user's fork
            # Mask the token in the URL for logging
            safe_url = fork_url.split("@")[1] if "@" in fork_url else fork_url
            logger.info(f"Cloning user's fork: {safe_url}")

            # First, test network connectivity
            try:
                test_result = self.sandbox.commands.run(
                    "curl -s -o /dev/null -w '%{http_code}' https://github.com",
                    timeout=10,
                )
                logger.info(f"Network test to github.com: {test_result.stdout}")
            except Exception as net_exc:
                logger.warning(f"Network test failed: {net_exc}")
                # Continue anyway, the clone might still work

            try:
                result = self.sandbox.commands.run(
                    f"git clone --depth 1 {fork_url} {self.repo_path} 2>&1",
                    timeout=120,
                )
            except Exception as clone_exc:
                # E2B SDK might throw exception instead of returning result
                logger.error(
                    f"E2B clone command exception: {type(clone_exc).__name__}: {clone_exc}"
                )
                raise CloneError(
                    fork_url,
                    f"Sandbox command failed: {clone_exc}. "
                    f"Check if the repository exists and the token has access.",
                )

            logger.info(
                f"Clone result: exit_code={result.exit_code}, "
                f"stdout_len={len(result.stdout or '')}, "
                f"stderr_len={len(result.stderr or '')}"
            )

            if result.exit_code != 0:
                # Combine stdout and stderr for better error message
                error_output = (result.stdout or "") + (result.stderr or "")
                logger.error(f"Clone failed. Output: {error_output[:500]}")

                if not error_output.strip():
                    # If no output, try to get more info
                    error_output = f"Git clone failed with exit code {result.exit_code}. No error output captured."

                if (
                    "not found" in error_output.lower()
                    or "does not exist" in error_output.lower()
                ):
                    # Extract repo info from URL for helpful error message
                    try:
                        repo_part = fork_url.split("github.com/")[1].rstrip(".git")
                        error_msg = (
                            f"Repository '{repo_part}' not found. "
                            f"Please fork the original repository first, then try again."
                        )
                    except (IndexError, AttributeError):
                        error_msg = error_output
                elif (
                    "Authentication failed" in error_output
                    or "could not read Username" in error_output
                ):
                    error_msg = "GitHub authentication failed. Please check your token has 'repo' scope."
                else:
                    error_msg = error_output
                raise CloneError(fork_url, error_msg)

            # Add upstream remote
            logger.info("Adding upstream remote")
            try:
                self.sandbox.commands.run(
                    f"cd {self.repo_path} && git remote add upstream {upstream_url}",
                    timeout=30,
                )
            except Exception as remote_exc:
                logger.warning(f"Failed to add upstream remote: {remote_exc}")

            # Fetch upstream
            logger.info("Fetching upstream")
            try:
                result = self.sandbox.commands.run(
                    f"cd {self.repo_path} && git fetch upstream",
                    timeout=120,
                )
                if result.exit_code != 0:
                    logger.warning(f"Failed to fetch upstream: {result.stderr}")
            except Exception as fetch_exc:
                logger.warning(f"Failed to fetch upstream: {fetch_exc}")
                # Continue anyway - we'll work with what we have

            # Try to find the default branch (main or master)
            # E2B SDK throws CommandExitException on non-zero exit, so wrap in try-except
            default_branch = "main"
            try:
                self.sandbox.commands.run(
                    f"cd {self.repo_path} && git rev-parse --verify upstream/main",
                    timeout=10,
                )
                # If we get here, upstream/main exists
                logger.info("Found upstream/main branch")
            except Exception:
                # upstream/main doesn't exist, try master
                try:
                    self.sandbox.commands.run(
                        f"cd {self.repo_path} && git rev-parse --verify upstream/master",
                        timeout=10,
                    )
                    default_branch = "master"
                    logger.info("Found upstream/master branch")
                except Exception:
                    logger.warning(
                        "Could not find upstream/main or upstream/master, using main"
                    )

            # Reset to upstream's default branch
            logger.info(f"Resetting to upstream/{default_branch}")
            try:
                self.sandbox.commands.run(
                    f"cd {self.repo_path} && git checkout -B main upstream/{default_branch}",
                    timeout=30,
                )
            except Exception as checkout_exc:
                logger.warning(
                    f"Failed to reset to upstream: {checkout_exc}. "
                    "Continuing with current state."
                )

            logger.info("Fork cloned and synced with upstream successfully")

        except CloneError:
            raise
        except Exception as e:
            # Log detailed exception info
            import traceback

            logger.error(
                f"Fork clone failed with unexpected exception: {type(e).__name__}: {e}\n"
                f"Traceback: {traceback.format_exc()}"
            )
            # Check if this is an E2B SDK exception with command info
            error_msg = str(e)
            if "exit code" in error_msg.lower() or "128" in error_msg:
                error_msg = (
                    f"Git operation failed (exit code 128). This usually means:\n"
                    f"1. The repository doesn't exist or is not accessible\n"
                    f"2. The authentication token is invalid or lacks permissions\n"
                    f"3. Network connectivity issues in the sandbox\n"
                    f"Original error: {e}"
                )
            raise CloneError(fork_url, error_msg)

    def execute_tool(self, name: str, inputs: dict[str, Any]) -> str:
        """
        Execute a tool in the E2B sandbox.

        Args:
            name: Tool name
            inputs: Tool input parameters

        Returns:
            Tool execution result as string

        Raises:
            ToolExecutionError: If tool execution fails
        """
        if not self.sandbox:
            raise ToolExecutionError(name, "Sandbox not initialized")

        start_time = time.time()

        try:
            if name == "read_file":
                path = inputs.get("path", "")
                full_path = f"{self.repo_path}/{path}"
                content = self.sandbox.files.read(full_path)
                result = content

            elif name == "list_files":
                path = inputs.get("path", ".")
                full_path = f"{self.repo_path}/{path}"
                cmd_result = self.sandbox.commands.run(
                    f"ls -la {full_path}",
                    timeout=30,
                )
                result = cmd_result.stdout or cmd_result.stderr or ""

            elif name == "search_code":
                pattern = inputs.get("pattern", "")
                file_pattern = inputs.get("file_pattern", "")

                include_flags = ""
                if file_pattern:
                    # Handle brace expansion patterns like "*.{ts,tsx}"
                    if "{" in file_pattern and "}" in file_pattern:
                        # Extract patterns from brace expansion
                        import re as _re

                        brace_match = _re.match(r"(.+)\{(.+)\}(.*)$", file_pattern)
                        if brace_match:
                            prefix = brace_match.group(1)
                            options = brace_match.group(2).split(",")
                            suffix = brace_match.group(3)
                            include_flags = " ".join(
                                f"--include='{prefix}{opt}{suffix}'" for opt in options
                            )
                        else:
                            include_flags = f"--include='{file_pattern}'"
                    else:
                        include_flags = f"--include='{file_pattern}'"

                cmd = f"cd {self.repo_path} && grep -rn {include_flags} '{pattern}' . 2>/dev/null | head -100"
                cmd_result = self.sandbox.commands.run(cmd, timeout=60)

                if cmd_result.stdout and cmd_result.stdout.strip():
                    result = cmd_result.stdout
                elif cmd_result.exit_code == 1:
                    # grep returns 1 when no matches found
                    result = "No matches found"
                else:
                    result = cmd_result.stderr or "No matches found"

            elif name == "run_command":
                command = inputs.get("command", "")
                cmd_result = self.sandbox.commands.run(
                    f"cd {self.repo_path} && {command}",
                    timeout=120,
                )
                result = f"Exit code: {cmd_result.exit_code}\n"
                if cmd_result.stdout:
                    result += f"Stdout:\n{cmd_result.stdout}\n"
                if cmd_result.stderr:
                    result += f"Stderr:\n{cmd_result.stderr}"

            elif name == "get_file_tree":
                max_depth = inputs.get("max_depth", 3)
                cmd_result = self.sandbox.commands.run(
                    f"cd {self.repo_path} && find . -maxdepth {max_depth} -type f -not -path '*/\\.git/*' | head -200 | sort",
                    timeout=30,
                )
                result = cmd_result.stdout or "No files found"

            elif name == "write_file":
                path = inputs.get("path", "")
                content = inputs.get("content", "")
                full_path = f"{self.repo_path}/{path}"
                self.sandbox.files.write(full_path, content)
                result = f"Successfully written to {path}"

            else:
                raise ToolExecutionError(name, f"Unknown tool: {name}")

            # Truncate result if too long
            result = self._truncate_output(result)

            elapsed = int((time.time() - start_time) * 1000)
            logger.info(
                "Tool executed",
                extra={
                    "tool": name,
                    "input": inputs,
                    "duration_ms": elapsed,
                    "output_chars": len(result),
                },
            )

            return result

        except ToolExecutionError:
            raise
        except Exception as e:
            logger.error(
                "Tool execution failed",
                extra={"tool": name, "error": str(e)},
            )
            raise ToolExecutionError(name, str(e))

    def _truncate_output(self, text: str) -> str:
        """Truncate output if it exceeds max tokens (approximate by chars)"""
        max_chars = self.max_tokens_per_tool * 4  # Rough estimate: 1 token ≈ 4 chars

        if len(text) <= max_chars:
            return text

        # Keep first and last portions
        half = max_chars // 2
        return (
            text[:half]
            + f"\n\n... [TRUNCATED - original length: {len(text)} chars] ...\n\n"
            + text[-half:]
        )

    async def analyze_issue_stream(
        self, request: AgentAnalyzeRequest
    ) -> AsyncGenerator[AgentEvent, None]:
        """
        Analyze a GitHub issue and stream events.

        The sandbox is always cleaned up after analysis. Session data is
        persisted to Supabase by the controller.

        Args:
            request: Analysis request with repo URL and issue details

        Yields:
            AgentEvent objects for each step

        Raises:
            Various exceptions for different failure modes
        """
        logger.info(
            f"[AGENT] Starting analyze_issue_stream: repo={request.repo_url}, "
            f"issue=#{request.issue_number}: {request.issue_title}"
        )
        logger.debug(f"[AGENT] Issue body length: {len(request.issue_body)} chars")

        try:
            # Start sandbox and clone repo
            logger.info("[AGENT] Yielding CLONING status event...")
            yield AgentStatusEvent(
                step=AgentStep.CLONING,
                message=f"Starting sandbox and cloning {request.repo_url}...",
            )
            logger.info("[AGENT] CLONING event yielded")

            logger.info("[AGENT] Starting sandbox...")
            await self.start_sandbox(request.repo_url)
            logger.info("[AGENT] Sandbox started and repo cloned")

            yield AgentStatusEvent(
                step=AgentStep.CLONING,
                message="Repository cloned successfully",
            )
            logger.info("[AGENT] Clone success event yielded")

            # Start analysis
            logger.info("[AGENT] Yielding ANALYZING status event...")
            yield AgentStatusEvent(
                step=AgentStep.ANALYZING,
                message="Analyzing issue...",
            )
            logger.info("[AGENT] ANALYZING event yielded")

            # Build initial messages
            messages: list[dict[str, Any]] = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"""Analyze this GitHub issue and propose a solution:

**Issue #{request.issue_number}: {request.issue_title}**

{request.issue_body}

Repository: {request.repo_url}

Start by exploring the codebase structure, then find relevant files, analyze the issue, and propose a detailed solution.""",
                },
            ]

            # Agent loop
            logger.info(f"[AGENT] Starting agent loop (max_turns={self.max_turns})")
            for turn in range(self.max_turns):
                logger.info(f"[AGENT] === Turn {turn + 1}/{self.max_turns} ===")

                # Check if we're on the last turn - force LLM to conclude
                is_final_turn = turn == self.max_turns - 1
                current_messages = messages.copy()

                if is_final_turn:
                    # Add instruction to force conclusion
                    current_messages.append(
                        {
                            "role": "user",
                            "content": """IMPORTANT: You have reached the maximum number of exploration turns.
You MUST now provide your final analysis based on all the information you have gathered so far.

Do NOT request any more tool calls. Instead, provide your complete analysis in the JSON format specified earlier.

Even if your analysis is incomplete, provide the best analysis you can with the information you have collected.
Include what you've learned and what areas still need investigation.""",
                        }
                    )
                    logger.info("[AGENT] Final turn - forcing LLM to conclude")

                try:
                    logger.info(
                        f"[AGENT] Calling LLM with {len(current_messages)} messages..."
                    )
                    response = await self.openrouter.generate_with_tools(
                        messages=current_messages,
                        tools=AGENT_TOOLS
                        if not is_final_turn
                        else [],  # No tools on final turn
                        temperature=0.7,
                        max_tokens=4096,
                    )
                    logger.info("[AGENT] LLM call completed successfully")
                except Exception as e:
                    logger.error(f"[AGENT] LLM call failed: {type(e).__name__}: {e}")
                    import traceback

                    logger.error(f"[AGENT] Traceback: {traceback.format_exc()}")
                    raise LLMError(f"LLM API call failed: {e}")

                # Get text content if any
                text_content = self.openrouter.get_text_content(response)
                logger.debug(
                    f"[AGENT] Text content length: {len(text_content) if text_content else 0}"
                )
                if text_content:
                    logger.info("[AGENT] Yielding thinking event...")
                    yield AgentThinkingEvent(content=text_content)
                    logger.info("[AGENT] Thinking event yielded")

                # Check finish reason
                finish_reason = self.openrouter.get_finish_reason(response)
                logger.info(f"[AGENT] Finish reason: {finish_reason}")

                if finish_reason == "stop" or is_final_turn:
                    # Agent finished - extract solution
                    logger.info("[AGENT] Agent finished - extracting solution...")
                    yield AgentStatusEvent(
                        step=AgentStep.PROPOSING,
                        message="Preparing solution...",
                    )

                    solution = self._parse_solution(text_content or "")
                    logger.info(
                        f"[AGENT] Solution parsed. Keys: {list(solution.keys())}"
                    )
                    logger.info("[AGENT] Yielding solution event...")
                    yield AgentSolutionEvent(data=solution)
                    logger.info("[AGENT] Solution event yielded")
                    yield AgentStatusEvent(
                        step=AgentStep.DONE,
                        message="Analysis complete",
                    )
                    logger.info("[AGENT] Analysis complete - returning from generator")
                    return

                # Process tool calls
                tool_calls = self.openrouter.parse_tool_calls(response)
                logger.info(f"[AGENT] Parsed {len(tool_calls)} tool calls")

                if not tool_calls:
                    # No tool calls and not stopped - might be an issue
                    logger.warning("[AGENT] No tool calls and not stopped - continuing")
                    continue

                # Add assistant message to conversation
                assistant_message = response["choices"][0]["message"]
                messages.append(assistant_message)

                # Execute each tool and add results
                tool_results = []
                for i, tc in enumerate(tool_calls):
                    logger.info(
                        f"[AGENT] Executing tool {i + 1}/{len(tool_calls)}: {tc['name']}"
                    )
                    yield AgentToolEvent(
                        tool_name=tc["name"],
                        tool_input=tc["arguments"],
                    )

                    try:
                        result = self.execute_tool(tc["name"], tc["arguments"])
                        logger.debug(
                            f"[AGENT] Tool {tc['name']} returned {len(result)} chars"
                        )
                    except ToolExecutionError as e:
                        logger.error(f"[AGENT] Tool {tc['name']} failed: {e.message}")
                        result = f"Error: {e.message}"

                    yield AgentToolEvent(
                        tool_name=tc["name"],
                        tool_input=tc["arguments"],
                        tool_result=result[:500] + "..."
                        if len(result) > 500
                        else result,
                    )

                    tool_results.append(
                        {
                            "role": "tool",
                            "tool_call_id": tc["id"],
                            "content": result,
                        }
                    )

                # Add tool results to messages
                messages.extend(tool_results)
                logger.info(
                    f"[AGENT] Added {len(tool_results)} tool results to messages"
                )

            # This should not be reached due to is_final_turn logic above
            logger.warning("[AGENT] Reached end of loop unexpectedly")

        except Exception as e:
            import traceback

            logger.error(f"[AGENT] Analysis failed: {type(e).__name__}: {e}")
            logger.error(f"[AGENT] Traceback: {traceback.format_exc()}")
            yield AgentErrorEvent(message=str(e))
            raise

        finally:
            # Always cleanup - session data is persisted to Supabase
            logger.info("[AGENT] Cleaning up sandbox...")
            self.cleanup()
            logger.info("[AGENT] Cleanup complete")

    def _parse_solution(self, text: str) -> dict[str, Any]:
        """Parse solution from agent's final response"""
        import contextlib
        import json
        import re

        solution = None

        # Try to extract JSON from the response
        json_match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)

        if json_match:
            with contextlib.suppress(json.JSONDecodeError):
                solution = json.loads(json_match.group(1))

        # Try to find JSON object directly
        if not solution:
            json_match = re.search(r"\{.*\}", text, re.DOTALL)
            if json_match:
                with contextlib.suppress(json.JSONDecodeError):
                    solution = json.loads(json_match.group(0))

        # Return raw text as solution if JSON parsing fails
        if not solution:
            return {
                "summary": "See raw analysis below",
                "root_cause_analysis": text,
                "affected_files": [],
                "key_insights": [],
                "suggested_fix": "",
                "comments_to_add": [],
                "commit_message": "docs: add issue analysis",
            }

        # Validate and clean code_changes
        code_changes = solution.get("code_changes", [])
        valid_changes = []
        invalid_patterns = ["unknown_file", "placeholder", "example", "path/to/"]

        for change in code_changes:
            file_path = change.get("file", "")

            # Skip invalid/placeholder file paths
            if not file_path:
                logger.warning("Skipping code change with empty file path")
                continue

            is_invalid = any(
                pattern in file_path.lower() for pattern in invalid_patterns
            )
            if is_invalid:
                logger.warning(f"Skipping invalid file path: {file_path}")
                continue

            valid_changes.append(change)

        if len(valid_changes) < len(code_changes):
            logger.warning(
                f"Filtered out {len(code_changes) - len(valid_changes)} invalid code changes"
            )

        solution["code_changes"] = valid_changes

        return solution

    def _generate_analysis_md(
        self, solution: dict[str, Any], issue_number: str | int, issue_title: str
    ) -> str:
        """Generate ANALYSIS.md content from solution data."""
        summary = solution.get("summary", "No summary provided")
        root_cause = solution.get("root_cause_analysis", solution.get("solution", ""))
        affected_files = solution.get("affected_files", [])
        key_insights = solution.get("key_insights", [])
        suggested_fix = solution.get("suggested_fix", "")

        # Build the markdown content
        lines = [
            f"# Issue Analysis: {issue_title}",
            "",
            "## Summary",
            "",
            summary,
            "",
            "## Root Cause Analysis",
            "",
            root_cause if root_cause else "Analysis in progress.",
            "",
            "## Affected Files",
            "",
        ]

        if affected_files:
            for f in affected_files:
                lines.append(f"- `{f}`")
        else:
            lines.append("- No specific files identified")

        lines.extend(["", "## Key Code Insights", ""])

        if key_insights:
            for insight in key_insights:
                file_path = insight.get("file", "Unknown file")
                line_range = insight.get("line_range", "")
                explanation = insight.get("explanation", "")
                code_snippet = insight.get("code_snippet", "")

                lines.append(f"### `{file_path}`")
                if line_range:
                    lines.append(f"**Lines:** {line_range}")
                lines.append("")
                if explanation:
                    lines.append(explanation)
                    lines.append("")
                if code_snippet:
                    lines.append("```")
                    lines.append(code_snippet)
                    lines.append("```")
                    lines.append("")
        else:
            lines.append("No specific insights documented.")

        lines.extend(["", "## Suggested Fix", ""])
        lines.append(
            suggested_fix if suggested_fix else "See root cause analysis above."
        )

        lines.extend(
            [
                "",
                "---",
                "",
                "## References",
                "",
                f"- Issue: #{issue_number}",
                "- Generated by OpenQuest Agent",
                "",
            ]
        )

        return "\n".join(lines)

    def cleanup(self) -> None:
        """Clean up sandbox resources"""
        if self.sandbox:
            try:
                logger.info(
                    "Killing sandbox",
                    extra={"sandbox_id": self.sandbox.sandbox_id},
                )
                self.sandbox.kill()
            except Exception as e:
                logger.warning(
                    "Failed to kill sandbox",
                    extra={"error": str(e)},
                )
            finally:
                self.sandbox = None

    async def implement_solution_stream(
        self,
        solution: dict[str, Any],
        repo_url: str,
        branch_name: str,
        github_token: str,
        commit_message: str | None = None,
    ) -> AsyncGenerator[AgentEvent, None]:
        """
        Implement the solution by writing code changes and pushing to GitHub.

        This method creates a fresh sandbox, clones the user's fork, syncs with
        upstream, applies changes, and pushes to the user's fork.

        Args:
            solution: The solution dict from analyze_issue_stream
            repo_url: The original repository URL
            branch_name: Name of the branch to create
            github_token: GitHub OAuth token for pushing
            commit_message: Custom commit message (uses solution's if not provided)

        Yields:
            AgentEvent objects for each step
        """
        try:
            # Get GitHub username first - we need it to clone their fork
            github_username = await self._get_github_username(github_token)
            if not github_username:
                yield AgentErrorEvent(
                    message="Failed to get GitHub username from token"
                )
                return

            # Extract owner/repo from URL
            # Note: Use removesuffix() not rstrip() - rstrip(".git") would strip any char in ".git"
            repo_path_parts = repo_url.rstrip("/").removesuffix(".git").split("/")
            original_owner = repo_path_parts[-2]
            repo_name = repo_path_parts[-1]

            # Check if fork exists before trying to clone
            fork_exists = await self._check_repo_exists(
                github_token, github_username, repo_name
            )
            if not fork_exists:
                yield AgentErrorEvent(
                    message=f"Fork not found: {github_username}/{repo_name}. "
                    f"Please fork {original_owner}/{repo_name} first at "
                    f"https://github.com/{original_owner}/{repo_name}/fork"
                )
                return

            # Build fork URL with auth token
            fork_url = (
                f"https://{github_token}@github.com/{github_username}/{repo_name}.git"
            )
            upstream_url = repo_url

            yield AgentStatusEvent(
                step=AgentStep.CLONING,
                message=f"Creating sandbox and cloning {github_username}/{repo_name}...",
            )

            # Clone user's fork instead of original repo
            await self._start_sandbox_with_fork(fork_url, upstream_url)

            yield AgentStatusEvent(
                step=AgentStep.CLONING,
                message="Repository cloned and synced with upstream",
            )

            # Create branch based on upstream/main
            yield AgentStatusEvent(
                step=AgentStep.IMPLEMENTING,
                message=f"Creating branch {branch_name}...",
            )

            try:
                result = self.sandbox.commands.run(
                    f"cd {self.repo_path} && git checkout -b {branch_name}",
                    timeout=30,
                )
                if result.exit_code != 0:
                    yield AgentErrorEvent(
                        message=f"Failed to create branch: {result.stderr}"
                    )
                    return
            except Exception as branch_exc:
                yield AgentErrorEvent(message=f"Failed to create branch: {branch_exc}")
                return

            # Generate ANALYSIS.md content
            yield AgentStatusEvent(
                step=AgentStep.IMPLEMENTING,
                message="Generating ANALYSIS.md...",
            )

            issue_number = solution.get("issue_number", "N/A")
            issue_title = commit_message or solution.get(
                "commit_message", "Issue Analysis"
            )

            # Build ANALYSIS.md content
            analysis_content = self._generate_analysis_md(
                solution, issue_number, issue_title
            )

            # Write ANALYSIS.md to repo root
            analysis_path = f"{self.repo_path}/ANALYSIS.md"
            self.sandbox.files.write(analysis_path, analysis_content)
            logger.info("Created ANALYSIS.md")

            # Add comments to files
            comments_to_add = solution.get("comments_to_add", [])
            files_modified = []

            for i, comment_info in enumerate(comments_to_add):
                file_path = comment_info.get("file", "")
                line_number = comment_info.get("line_number", 0)
                comment_text = comment_info.get("comment", "")

                if not file_path or not comment_text or not line_number:
                    continue

                yield AgentStatusEvent(
                    step=AgentStep.IMPLEMENTING,
                    message=f"Adding comment to {file_path} ({i + 1}/{len(comments_to_add)})...",
                )

                try:
                    full_path = f"{self.repo_path}/{file_path}"
                    existing_content = self.sandbox.files.read(full_path)
                    lines = existing_content.splitlines(keepends=True)

                    # Insert comment before the specified line (1-indexed)
                    insert_idx = max(0, line_number - 1)
                    if insert_idx < len(lines):
                        # Detect indentation from the target line
                        target_line = (
                            lines[insert_idx] if insert_idx < len(lines) else ""
                        )
                        indent = len(target_line) - len(target_line.lstrip())
                        indent_str = " " * indent

                        # Format comment with proper indentation
                        comment_lines = comment_text.splitlines()
                        formatted_comment = (
                            "\n".join(f"{indent_str}{line}" for line in comment_lines)
                            + "\n"
                        )

                        lines.insert(insert_idx, formatted_comment)
                        new_content = "".join(lines)
                        self.sandbox.files.write(full_path, new_content)
                        files_modified.append(file_path)
                        logger.info(
                            f"Added comment to {file_path} at line {line_number}"
                        )
                    else:
                        logger.warning(
                            f"Line {line_number} out of range for {file_path} "
                            f"(file has {len(lines)} lines)"
                        )

                except Exception as e:
                    logger.warning(f"Failed to add comment to {file_path}: {e}")
                    # Continue with other comments

            logger.info(
                f"Documentation complete: ANALYSIS.md created, "
                f"{len(files_modified)} files modified"
            )

            # Configure git user (required before commit)
            try:
                self.sandbox.commands.run(
                    f"cd {self.repo_path} && git config user.email 'agent@openquest.dev'",
                    timeout=10,
                )
                self.sandbox.commands.run(
                    f"cd {self.repo_path} && git config user.name 'OpenQuest Agent'",
                    timeout=10,
                )
            except Exception as config_exc:
                logger.warning(f"Git config failed: {config_exc}")

            # Stage changes
            yield AgentStatusEvent(
                step=AgentStep.IMPLEMENTING,
                message="Staging changes...",
            )
            try:
                self.sandbox.commands.run(
                    f"cd {self.repo_path} && git add .", timeout=30
                )
            except Exception as add_exc:
                yield AgentErrorEvent(message=f"Failed to stage changes: {add_exc}")
                return

            # Check if there are staged changes
            try:
                status_result = self.sandbox.commands.run(
                    f"cd {self.repo_path} && git diff --cached --stat",
                    timeout=30,
                )
                if not status_result.stdout.strip():
                    yield AgentErrorEvent(
                        message="No changes to commit. The patches may not have modified any files."
                    )
                    return
                logger.info(f"Staged changes:\n{status_result.stdout}")
            except Exception as status_exc:
                logger.warning(f"Could not check staged changes: {status_exc}")

            # Commit
            final_commit_message = commit_message or solution.get(
                "commit_message", "Fix issue"
            )
            yield AgentStatusEvent(
                step=AgentStep.IMPLEMENTING,
                message="Committing changes...",
            )

            # Escape single quotes in commit message
            escaped_message = final_commit_message.replace("'", "'\\''")
            try:
                result = self.sandbox.commands.run(
                    f"cd {self.repo_path} && git commit -m '{escaped_message}'",
                    timeout=30,
                )
                if result.exit_code != 0:
                    yield AgentErrorEvent(
                        message=f"Failed to commit: {result.stderr or result.stdout or 'Unknown error'}"
                    )
                    return
            except Exception as commit_exc:
                yield AgentErrorEvent(message=f"Failed to commit: {commit_exc}")
                return

            # Get diff
            diff_content = ""
            try:
                diff_result = self.sandbox.commands.run(
                    f"cd {self.repo_path} && git diff HEAD~1",
                    timeout=30,
                )
                diff_content = diff_result.stdout or ""
            except Exception as diff_exc:
                logger.warning(f"Could not get diff: {diff_exc}")

            yield AgentDiffEvent(data=diff_content)

            # Push to origin (user's fork - already cloned with auth)
            yield AgentStatusEvent(
                step=AgentStep.PUSHING,
                message=f"Pushing to {github_username}/{repo_name}:{branch_name}...",
            )

            try:
                result = self.sandbox.commands.run(
                    f"cd {self.repo_path} && git push -u origin {branch_name}",
                    timeout=60,
                )
                if result.exit_code != 0:
                    yield AgentErrorEvent(
                        message=f"Failed to push. Make sure you have forked {original_owner}/{repo_name} first. Error: {result.stderr}"
                    )
                    return
            except Exception as push_exc:
                yield AgentErrorEvent(message=f"Failed to push: {push_exc}")
                return

            # Success - link to fork branch and PR creation URL
            branch_url = (
                f"https://github.com/{github_username}/{repo_name}/tree/{branch_name}"
            )
            pr_url = f"https://github.com/{original_owner}/{repo_name}/compare/main...{github_username}:{repo_name}:{branch_name}?expand=1"

            yield AgentImplementResultEvent(
                branch=branch_name,
                branch_url=branch_url,
                pr_url=pr_url,
                diff=diff_content[:5000] if len(diff_content) > 5000 else diff_content,
            )

            yield AgentStatusEvent(
                step=AgentStep.DONE,
                message=f"Successfully pushed to {github_username}/{repo_name}:{branch_name}",
            )

        except Exception as e:
            logger.error("Implementation failed", extra={"error": str(e)})
            yield AgentErrorEvent(message=str(e))

        finally:
            # Always cleanup the sandbox
            self.cleanup()

    async def _get_github_username(self, token: str) -> str | None:
        """Get GitHub username from OAuth token."""
        import httpx

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.github.com/user",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/vnd.github.v3+json",
                    },
                    timeout=10,
                )
                if response.status_code == 200:
                    return response.json().get("login")
                else:
                    logger.error(
                        "Failed to get GitHub user",
                        extra={"status": response.status_code},
                    )
                    return None
        except Exception as e:
            logger.error("GitHub API error", extra={"error": str(e)})
            return None

    async def _check_repo_exists(self, token: str, owner: str, repo: str) -> bool:
        """Check if a GitHub repository exists and is accessible."""
        import httpx

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://api.github.com/repos/{owner}/{repo}",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/vnd.github.v3+json",
                    },
                    timeout=10,
                )
                if response.status_code == 200:
                    return True
                elif response.status_code == 404:
                    logger.info(
                        f"Repository not found: {owner}/{repo}",
                    )
                    return False
                else:
                    logger.warning(
                        f"Unexpected status checking repo: {response.status_code}",
                    )
                    # Return True to attempt clone anyway
                    return True
        except Exception as e:
            logger.error("GitHub API error checking repo", extra={"error": str(e)})
            # Return True to attempt clone anyway
            return True
