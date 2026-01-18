# Agent 集成方案

## 技术决策

| 决策点 | 选择 |
|--------|------|
| 架构风格 | Lovable 风格 (Agent 在后端，沙箱只执行) |
| Sandbox | E2B (用于 Git 操作和代码执行) |
| 实时通信 | WebSocket |
| Git 认证 | GitHub OAuth |

---

## 核心架构：Agent 在后端，E2B 只做执行

```
┌─────────────────────────────────────────────────────────────┐
│                      你的后端服务器                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                   Agent Service                        │ │
│  │                                                        │ │
│  │   ┌─────────────┐                                     │ │
│  │   │ Agent Loop  │  1. 调用 LLM 分析问题               │ │
│  │   │             │  2. LLM 返回 tool_use               │ │
│  │   │  Claude API │  3. 执行 tool (在 E2B 沙箱)         │ │
│  │   │             │  4. 返回结果给 LLM                   │ │
│  │   │             │  5. 循环直到完成                     │ │
│  │   └──────┬──────┘                                     │ │
│  │          │                                             │ │
│  │          │ tool 调用                                   │ │
│  │          ▼                                             │ │
│  │   ┌─────────────┐     ┌───────────────────────────┐  │ │
│  │   │ E2B Client  │────►│     E2B Sandbox           │  │ │
│  │   │             │     │                           │  │ │
│  │   │ sandbox.    │◄────│  - git clone/push         │  │ │
│  │   │ commands.   │     │  - read/write files       │  │ │
│  │   │ run()       │     │  - run tests              │  │ │
│  │   └─────────────┘     └───────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
│          │                                                  │
│          │ WebSocket                                        │
│          ▼                                                  │
└─────────────────────────────────────────────────────────────┘
           │
           │ 实时状态推送
           ▼
┌─────────────────────────────────────────────────────────────┐
│                         前端                                 │
│   - 显示 Agent 思考过程                                      │
│   - 显示 tool 执行结果                                       │
│   - 显示代码变更 (diff)                                      │
│   - 用户确认/取消                                            │
└─────────────────────────────────────────────────────────────┘
```

**优点：**
- Agent 逻辑完全可控
- 状态实时推送给前端
- E2B 只在需要时启动，成本更低
- API key 不暴露在沙箱里

---

## E2B 沙箱详解

### E2B 是什么

**本质上就是一个远程 Linux VM**，启动极快（~150ms），专为 AI Agent 设计。

```
┌─────────────────────────────────────────────────────────┐
│                    E2B Cloud                            │
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │         Firecracker microVM                      │  │
│   │                                                  │  │
│   │   ┌──────────────────────────────────────────┐  │  │
│   │   │            Debian Linux                   │  │  │
│   │   │                                           │  │  │
│   │   │   - Python, Node.js, Git 预装             │  │  │
│   │   │   - 完整文件系统                           │  │  │
│   │   │   - 网络访问                               │  │  │
│   │   │   - 可以 pip install, npm install        │  │  │
│   │   └──────────────────────────────────────────┘  │  │
│   └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
           ▲
           │ HTTPS API
           │
┌──────────┴──────────┐
│    你的后端代码       │
│                     │
│  from e2b import    │
│    Sandbox          │
└─────────────────────┘
```

### E2B SDK 使用方式

```python
from e2b_code_interpreter import Sandbox

# 1. 创建沙箱 (启动一个 VM, ~150ms)
sandbox = Sandbox(timeout=300)  # 5分钟后自动销毁

# 2. 运行命令 (就像 SSH 进去执行)
result = sandbox.commands.run("ls -la")
print(result.stdout)     # 标准输出
print(result.stderr)     # 错误输出
print(result.exit_code)  # 0 = 成功

# 3. 读写文件
sandbox.files.write("/home/user/test.py", "print('hello')")
content = sandbox.files.read("/home/user/test.py")

# 4. Git 操作
sandbox.commands.run("git clone https://github.com/user/repo.git")
sandbox.commands.run("cd repo && git checkout -b fix-branch")
sandbox.commands.run("cd repo && git add . && git commit -m 'fix'")

# 5. 安装依赖
sandbox.commands.run("pip install requests")
sandbox.commands.run("npm install lodash")

# 6. 销毁沙箱
sandbox.kill()
```

### E2B vs 其他方案

| | E2B | 本地 Docker | SSH 远程服务器 |
|---|-----|-------------|---------------|
| 启动速度 | ~150ms | ~2s | 已运行 |
| 隔离性 | 完全隔离 | 容器隔离 | 无隔离 |
| 成本 | 按使用计费 | 服务器成本 | 服务器成本 |
| 管理 | 无需管理 | 需要维护 | 需要维护 |

### E2B 定价

```
免费额度: $100 (够测试很久)
之后: ~$0.10/小时 (sandbox 运行时间)
```

---

## 整体流程

```
Frontend                              Backend                         E2B
   │                                     │                              │
   │ WS /ws/agent (WebSocket 连接)        │                              │
   │────────────────────────────────────►│                              │
   │                                     │                              │
   │ ──► {type: "start", repo, issue}    │                              │
   │                                     │  创建 sandbox                │
   │                                     │─────────────────────────────►│
   │                                     │                              │
   │ ◄── {type: "status", step: "cloning"}   git clone                  │
   │ ◄── {type: "status", step: "analyzing"} 分析代码                    │
   │ ◄── {type: "solution", data: {...}}                                │
   │                                     │                              │
   │ ──► {type: "confirm", branch: "..."}│                              │
   │                                     │  创建分支, 写代码             │
   │                                     │─────────────────────────────►│
   │ ◄── {type: "status", step: "implementing"}                         │
   │ ◄── {type: "diff", data: "..."}     │                              │
   │ ◄── {type: "done", pr_url: "..."}   │                              │
```

---

## 后端设计

### 新增文件

```
backend/app/
├── controllers/
│   └── agent_controller.py    # WebSocket 端点
├── services/
│   └── agent_service.py       # E2B 集成 + LLM 调用
└── dtos/
    └── agent_dto.py           # 消息类型定义
```

### Agent 状态机

```
IDLE → CLONING → ANALYZING → PROPOSING → WAITING_CONFIRM
                                              ↓
                              IMPLEMENTING → DONE
                                    ↓
                                  ERROR (任何阶段可能)
```

### Agent Service 工作原理

Agent Service 的核心是一个 **tool-use 循环**，模拟人类开发者的思考过程：

```
┌─────────────────────────────────────────────────────────────────┐
│                        Agent Loop 详解                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 第 1 轮                                                   │  │
│  │                                                           │  │
│  │ 你 → Claude: "分析这个 issue，仓库在 /repo"               │  │
│  │                                                           │  │
│  │ Claude → 你: "我需要先看看项目结构"                        │  │
│  │              tool_use: list_files(path=".")              │  │
│  │                                                           │  │
│  │ 你 → E2B: sandbox.commands.run("find . -type f")         │  │
│  │ E2B → 你: "src/main.py, src/utils.py, tests/..."         │  │
│  │                                                           │  │
│  │ 你 → Claude: tool_result: "src/main.py, src/utils.py..." │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 第 2 轮                                                   │  │
│  │                                                           │  │
│  │ Claude → 你: "让我看看 main.py 的内容"                    │  │
│  │              tool_use: read_file(path="src/main.py")     │  │
│  │                                                           │  │
│  │ 你 → E2B: sandbox.files.read("/repo/src/main.py")        │  │
│  │ E2B → 你: "def main(): ..."                              │  │
│  │                                                           │  │
│  │ 你 → Claude: tool_result: "def main(): ..."              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 第 3 轮                                                   │  │
│  │                                                           │  │
│  │ Claude → 你: "我找到了问题所在，让我搜索相关代码"          │  │
│  │              tool_use: search_code(pattern="error")      │  │
│  │                                                           │  │
│  │ 你 → E2B: sandbox.commands.run("grep -r 'error' ...")    │  │
│  │ E2B → 你: "src/main.py:42: handle_error..."              │  │
│  │                                                           │  │
│  │ 你 → Claude: tool_result: "src/main.py:42: ..."          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 第 N 轮 (stop_reason == "end_turn")                      │  │
│  │                                                           │  │
│  │ Claude → 你: "分析完成，这是我的解决方案：                 │  │
│  │              1. 在 src/main.py 第 42 行修改...            │  │
│  │              2. 添加新文件 src/fix.py...                  │  │
│  │              建议的 commit message: 'Fix error handling'" │  │
│  │                                                           │  │
│  │ (没有 tool_use，循环结束)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**关键点：**

1. **Claude 决定做什么** - 你不需要预设分析步骤，Claude 自己决定读哪些文件
2. **E2B 执行操作** - 所有文件操作都在远程沙箱里，安全隔离
3. **循环直到完成** - `stop_reason == "end_turn"` 表示 Claude 分析完毕
4. **实时推送状态** - 每次 tool 调用都通过 WebSocket 告诉前端

**伪代码流程：**

```python
messages = [{"role": "user", "content": "分析这个 issue..."}]

while True:
    # 1. 调用 Claude
    response = claude.messages.create(messages=messages, tools=TOOLS)

    # 2. 推送思考过程给前端
    for block in response.content:
        if block.type == "text":
            websocket.send({"type": "thinking", "content": block.text})

    # 3. 检查是否完成
    if response.stop_reason == "end_turn":
        return parse_solution(response)  # 提取方案，结束循环

    # 4. 执行 tool calls
    for tool in response.tool_calls:
        websocket.send({"type": "status", "message": f"执行 {tool.name}..."})
        result = execute_in_e2b(tool.name, tool.input)  # 在沙箱执行
        messages.append(tool_result(result))

    # 5. 继续下一轮
    messages.append(response)
```

### Agent Service 核心实现

```python
# backend/app/services/agent_service.py
from e2b_code_interpreter import Sandbox
import anthropic
from typing import Callable

TOOLS = [
    {
        "name": "read_file",
        "description": "Read contents of a file in the repository",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "File path relative to repo root"}
            },
            "required": ["path"]
        }
    },
    {
        "name": "write_file",
        "description": "Write content to a file",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"}
            },
            "required": ["path", "content"]
        }
    },
    {
        "name": "run_command",
        "description": "Run a shell command in the repository",
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string"}
            },
            "required": ["command"]
        }
    },
    {
        "name": "list_files",
        "description": "List files in a directory",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "default": "."}
            }
        }
    },
    {
        "name": "search_code",
        "description": "Search for a pattern in the codebase",
        "input_schema": {
            "type": "object",
            "properties": {
                "pattern": {"type": "string"}
            },
            "required": ["pattern"]
        }
    }
]

class AgentService:
    def __init__(self):
        self.sandbox: Sandbox = None
        self.client = anthropic.Anthropic()
        self.repo_path = "/home/user/repo"

    async def start_sandbox(self, repo_url: str, on_status: Callable):
        """启动 E2B 沙箱并 clone 仓库"""
        on_status({"step": "cloning", "message": "启动沙箱..."})
        self.sandbox = Sandbox(timeout=600)  # 10 分钟超时

        on_status({"step": "cloning", "message": f"克隆 {repo_url}..."})
        result = self.sandbox.commands.run(f"git clone {repo_url} {self.repo_path}")

        if result.exit_code != 0:
            raise Exception(f"Clone failed: {result.stderr}")

    def execute_tool(self, name: str, input: dict) -> str:
        """在 E2B 沙箱中执行 tool"""
        if name == "read_file":
            content = self.sandbox.files.read(f"{self.repo_path}/{input['path']}")
            return content

        elif name == "write_file":
            self.sandbox.files.write(f"{self.repo_path}/{input['path']}", input['content'])
            return f"Written to {input['path']}"

        elif name == "run_command":
            result = self.sandbox.commands.run(f"cd {self.repo_path} && {input['command']}")
            return f"Exit code: {result.exit_code}\nStdout: {result.stdout}\nStderr: {result.stderr}"

        elif name == "list_files":
            path = input.get('path', '.')
            result = self.sandbox.commands.run(f"cd {self.repo_path} && find {path} -type f | head -100")
            return result.stdout

        elif name == "search_code":
            result = self.sandbox.commands.run(f"cd {self.repo_path} && grep -r '{input['pattern']}' --include='*.py' --include='*.js' --include='*.ts' | head -50")
            return result.stdout

    async def analyze_issue(self, issue: dict, on_status: Callable, on_thinking: Callable):
        """Agent 循环：分析 issue 并生成解决方案"""
        on_status({"step": "analyzing", "message": "AI 正在分析问题..."})

        messages = [
            {
                "role": "user",
                "content": f"""You are a senior software engineer. Analyze this GitHub issue and propose a solution.

Issue Title: {issue['title']}
Issue Body: {issue['body']}
Repository: {issue['repo_url']}

First, explore the codebase to understand the structure and find relevant files.
Then, propose a detailed solution with specific code changes.

Use the tools available to read files, search code, and understand the codebase."""
            }
        ]

        while True:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                tools=TOOLS,
                messages=messages
            )

            # 推送思考过程给前端
            for block in response.content:
                if block.type == "text":
                    on_thinking({"type": "thinking", "content": block.text})

            if response.stop_reason == "end_turn":
                # Agent 完成分析，提取最终方案
                final_text = next((b.text for b in response.content if b.type == "text"), "")
                return self._parse_solution(final_text)

            # 执行 tool calls
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    on_status({"step": "analyzing", "message": f"执行: {block.name}..."})
                    result = self.execute_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result
                    })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

    async def implement_solution(self, solution: dict, branch: str, github_token: str, on_status: Callable):
        """执行解决方案，创建分支并提交"""
        on_status({"step": "implementing", "message": f"创建分支 {branch}..."})

        # 创建分支
        self.sandbox.commands.run(f"cd {self.repo_path} && git checkout -b {branch}")

        # 写入代码变更
        for change in solution.get("changes", []):
            on_status({"step": "implementing", "message": f"修改 {change['path']}..."})
            self.sandbox.files.write(f"{self.repo_path}/{change['path']}", change['content'])

        # 提交
        on_status({"step": "implementing", "message": "提交变更..."})
        self.sandbox.commands.run(f"cd {self.repo_path} && git add .")
        self.sandbox.commands.run(f"cd {self.repo_path} && git commit -m '{solution.get('commit_message', 'Fix issue')}'")

        # 获取 diff
        diff_result = self.sandbox.commands.run(f"cd {self.repo_path} && git diff HEAD~1")

        # Push (使用用户的 GitHub token)
        on_status({"step": "pushing", "message": "推送到 GitHub..."})
        # 设置 git credentials
        self.sandbox.commands.run(f"cd {self.repo_path} && git config credential.helper store")
        self.sandbox.commands.run(f"echo 'https://{github_token}@github.com' > ~/.git-credentials")
        self.sandbox.commands.run(f"cd {self.repo_path} && git push -u origin {branch}")

        return diff_result.stdout

    def cleanup(self):
        if self.sandbox:
            self.sandbox.kill()
            self.sandbox = None
```

---

## Context 管理

### 问题：Context 会越来越大

```
第 1 轮: messages = [user_prompt]                          ~500 tokens
第 2 轮: messages = [user_prompt, assistant, tool_result]  ~2,000 tokens
第 3 轮: messages = [... + 读了一个大文件]                   ~10,000 tokens
第 10 轮: messages = [...]                                  ~50,000 tokens
   ...
第 N 轮: 💥 超出 context window (200k)
```

### 解决方案

#### 1. 限制 Tool 输出大小

```python
def execute_tool(self, name: str, input: dict) -> str:
    if name == "read_file":
        content = self.sandbox.files.read(f"{self.repo_path}/{input['path']}")

        # 限制文件大小
        if len(content) > 10000:
            return content[:10000] + f"\n\n... [截断，原始 {len(content)} 字符]"
        return content

    elif name == "search_code":
        # 用 head 限制行数
        result = self.sandbox.commands.run(f"grep -r '{input['pattern']}' ... | head -50")
        return result.stdout
```

#### 2. 设置最大轮数

```python
MAX_TURNS = 25

for turn in range(MAX_TURNS):
    response = claude.messages.create(...)

    if response.stop_reason == "end_turn":
        break

    execute_tools(...)
else:
    raise Exception("Agent exceeded max turns")
```

#### 3. 滑动窗口 (可选)

```python
MAX_CONTEXT_MESSAGES = 20

def manage_context(messages: list) -> list:
    if len(messages) <= MAX_CONTEXT_MESSAGES:
        return messages

    # 保留: 第一条 (原始 prompt) + 最近的消息
    return [messages[0]] + messages[-(MAX_CONTEXT_MESSAGES-1):]
```

#### 4. 完整的 Context 管理

```python
class AgentService:
    MAX_TURNS = 25
    MAX_TOKENS_PER_TOOL = 8000

    async def analyze_issue(self, issue: dict, on_status, on_thinking):
        messages = [{"role": "user", "content": self.build_prompt(issue)}]

        for turn in range(self.MAX_TURNS):
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                tools=TOOLS,
                messages=messages
            )

            if response.stop_reason == "end_turn":
                return self.parse_solution(response)

            # 执行 tools，限制输出大小
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = self.execute_tool(block.name, block.input)
                    result = self.truncate(result, self.MAX_TOKENS_PER_TOOL)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result
                    })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

        raise Exception("Agent 超过最大轮数")

    def truncate(self, text: str, max_chars: int) -> str:
        if len(text) <= max_chars:
            return text
        return text[:max_chars] + f"\n\n... [截断，原始长度: {len(text)}]"
```

### Context 管理策略对比

| 策略 | 优点 | 缺点 |
|------|------|------|
| **截断 tool 输出** | 简单有效 | 可能丢失重要信息 |
| **限制轮数** | 防止无限循环 | 复杂任务可能不够 |
| **滑动窗口** | 实现简单 | 丢失早期上下文 |

**MVP 建议：** 截断 + 限制轮数，足够用了。

---

## GitHub OAuth 流程

```
用户点击 "连接 GitHub"
        │
        ▼
重定向到 GitHub 授权页面
GET https://github.com/login/oauth/authorize
  ?client_id=xxx
  &scope=repo,user
  &redirect_uri=http://localhost:3000/callback
        │
        ▼
用户授权后，GitHub 回调
GET /callback?code=xxx
        │
        ▼
后端用 code 换 access_token
POST https://github.com/login/oauth/access_token
        │
        ▼
存储 token（加密存到 DB 或 session）
        │
        ▼
Agent 用这个 token push 代码
```

### 需要新增

```
backend/app/
├── controllers/
│   └── github_oauth_controller.py   # OAuth 回调处理
├── services/
│   └── github_oauth_service.py      # Token 交换逻辑
```

### 环境变量

```env
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback
E2B_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
```

---

## WebSocket 设计

### 连接流程

```
Frontend                              Backend
   │                                     │
   │ WS /ws/agent/{session_id}           │
   │────────────────────────────────────►│
   │                                     │
   │ ◄──── {"type": "connected"}         │
   │                                     │
   │ ──── {"type": "start", ...}  ──────►│
   │                                     │
   │ ◄──── {"type": "status", step: "cloning"}
   │ ◄──── {"type": "status", step: "analyzing"}
   │ ◄──── {"type": "thinking", content: "..."}
   │ ◄──── {"type": "solution", data: {...}}
   │                                     │
   │ ──── {"type": "confirm", branch: "fix-123"} ──►│
   │                                     │
   │ ◄──── {"type": "status", step: "implementing"}
   │ ◄──── {"type": "diff", data: "..."}
   │ ◄──── {"type": "done", pr_url: "..."}
```

### 消息类型

```typescript
// 前端发送
type ClientMessage =
  | { type: "start", repo_url: string, issue: Issue }
  | { type: "confirm", branch_name: string }
  | { type: "cancel" }

// 后端推送
type ServerMessage =
  | { type: "connected" }
  | { type: "status", step: AgentStep, message: string }
  | { type: "thinking", content: string }
  | { type: "solution", data: Solution }
  | { type: "diff", data: string }
  | { type: "done", branch: string, pr_url?: string }
  | { type: "error", message: string }

type AgentStep =
  | "cloning"
  | "analyzing"
  | "proposing"
  | "waiting_confirm"
  | "implementing"
  | "pushing"
  | "done"
```

### FastAPI WebSocket 端点

```python
# backend/app/controllers/agent_controller.py
from fastapi import WebSocket, WebSocketDisconnect

@router.websocket("/ws/agent/{session_id}")
async def agent_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    agent_service = AgentService()

    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "start":
                # 启动沙箱
                await agent_service.start_sandbox(
                    repo_url=data["repo_url"],
                    on_status=lambda s: websocket.send_json({"type": "status", **s}),
                )

                # 分析 issue
                solution = await agent_service.analyze_issue(
                    issue=data["issue"],
                    on_status=lambda s: websocket.send_json({"type": "status", **s}),
                    on_thinking=lambda t: websocket.send_json(t),
                )

                await websocket.send_json({"type": "solution", "data": solution})

            elif data["type"] == "confirm":
                diff = await agent_service.implement_solution(
                    solution=current_solution,
                    branch=data["branch_name"],
                    github_token=user_github_token,
                    on_status=lambda s: websocket.send_json({"type": "status", **s}),
                )
                await websocket.send_json({"type": "diff", "data": diff})
                await websocket.send_json({"type": "done", "branch": data["branch_name"]})

            elif data["type"] == "cancel":
                agent_service.cleanup()
                break

    except WebSocketDisconnect:
        agent_service.cleanup()
```

---

## 新增文件清单

### 后端

```
backend/app/
├── controllers/
│   ├── agent_controller.py          # WebSocket 端点
│   └── github_oauth_controller.py   # OAuth 回调
├── services/
│   ├── agent_service.py             # E2B + LLM 核心逻辑
│   └── github_oauth_service.py      # OAuth token 管理
└── dtos/
    └── agent_dto.py                 # 消息类型定义
```

### 前端

```
frontend/src/
├── components/dashboard/
│   ├── AgentPanel.tsx               # Agent 主面板
│   ├── AgentStatus.tsx              # 状态显示
│   ├── SolutionView.tsx             # 方案展示
│   └── DiffViewer.tsx               # Diff 展示
├── hooks/
│   └── useAgentWebSocket.ts         # WebSocket 连接管理
└── lib/
    └── agent-types.ts               # TypeScript 类型
```

---

## 实现顺序

1. **GitHub OAuth** - 先搞定授权，后面才能 push
2. **E2B 集成** - Agent 核心逻辑
3. **WebSocket 后端** - 状态推送
4. **WebSocket 前端** - 连接 + 状态展示
5. **UI 组件** - Agent 面板 + Diff 展示

---

## 验证方式

1. 用户能成功连接 GitHub OAuth
2. 选择一个 issue 后，Agent 能分析并返回方案
3. 确认方案后，Agent 创建分支并 push
4. 前端实时显示每个步骤的状态（包括 Agent 的思考过程）
