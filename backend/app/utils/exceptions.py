"""Custom Exceptions for OpenQuest"""


class AgentError(Exception):
    """Base exception for agent-related errors"""

    def __init__(self, message: str = "An agent error occurred"):
        self.message = message
        super().__init__(self.message)


class SandboxError(AgentError):
    """E2B sandbox operation failed"""

    def __init__(self, message: str = "Sandbox operation failed"):
        super().__init__(message)


class SandboxTimeoutError(SandboxError):
    """Sandbox operation timed out"""

    def __init__(self, message: str = "Sandbox operation timed out"):
        super().__init__(message)


class ToolExecutionError(AgentError):
    """Tool execution failed"""

    def __init__(self, tool_name: str, message: str = "Tool execution failed"):
        self.tool_name = tool_name
        super().__init__(f"Tool '{tool_name}' failed: {message}")


class MaxTurnsExceededError(AgentError):
    """Agent exceeded maximum turns"""

    def __init__(self, max_turns: int):
        self.max_turns = max_turns
        super().__init__(f"Agent exceeded maximum turns ({max_turns})")


class LLMError(AgentError):
    """LLM API call failed"""

    def __init__(self, message: str = "LLM API call failed"):
        super().__init__(message)


class CloneError(SandboxError):
    """Git clone operation failed"""

    def __init__(self, repo_url: str, message: str = "Clone failed"):
        self.repo_url = repo_url
        super().__init__(f"Failed to clone {repo_url}: {message}")


class GitHubOAuthError(Exception):
    """GitHub OAuth operation failed"""

    def __init__(self, message: str = "GitHub OAuth failed"):
        self.message = message
        super().__init__(self.message)
