"""Agent Tools - Tool definitions for LLM function calling"""

from typing import Any

# Tool definitions for OpenRouter/Claude function calling
AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read the contents of a file in the repository. Use this to understand code structure and implementation details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "File path relative to repository root (e.g., 'src/main.py', 'README.md')",
                    }
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "List files and directories in a given path. Use this to explore the project structure.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Directory path relative to repository root. Use '.' for root directory.",
                        "default": ".",
                    }
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_code",
            "description": "Search for a pattern in the codebase using grep. Use this to find relevant code sections.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {
                        "type": "string",
                        "description": "Search pattern (supports regex)",
                    },
                    "file_pattern": {
                        "type": "string",
                        "description": "Optional file glob pattern to limit search (e.g., '*.py', '*.ts')",
                    },
                },
                "required": ["pattern"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_command",
            "description": "Run a shell command in the repository. Use this to run tests, check dependencies, or execute other commands.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "Shell command to execute (e.g., 'npm test', 'python -m pytest')",
                    }
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_file_tree",
            "description": "Get the directory structure of the repository as a tree. Use this to understand overall project layout.",
            "parameters": {
                "type": "object",
                "properties": {
                    "max_depth": {
                        "type": "integer",
                        "description": "Maximum depth of the tree (default: 3)",
                        "default": 3,
                    }
                },
            },
        },
    },
]


def get_tool_names() -> list[str]:
    """Get list of all available tool names"""
    return [tool["function"]["name"] for tool in AGENT_TOOLS]


def get_tool_by_name(name: str) -> dict[str, Any] | None:
    """Get tool definition by name"""
    for tool in AGENT_TOOLS:
        if tool["function"]["name"] == name:
            return tool
    return None
