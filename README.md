# OpenQuest

一个现代化的全栈开源项目，提供问答和知识探索平台。

## 技术栈

### 前端
- **Next.js 14** - React 全栈框架，支持 App Router
- **React 18** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Zustand** - 轻量级状态管理
- **TanStack Query** - 服务端状态管理和数据获取

### 后端
- **FastAPI** - 高性能 Python Web 框架
- **SQLAlchemy** - Python ORM
- **Pydantic** - 数据验证
- **Uvicorn** - ASGI 服务器

### 数据库 & 缓存
- **PostgreSQL** - 主数据库
- **Redis** - 缓存和会话存储

### 认证
- **python-jose** - JWT 令牌处理

## 项目结构

```
open-source/
├── frontend/          # Next.js 前端应用
│   ├── app/          # App Router 页面
│   ├── components/   # React 组件
│   ├── lib/          # 工具函数
│   └── package.json  # 前端依赖
├── backend/          # FastAPI 后端服务
│   ├── app/          # 应用代码
│   │   ├── api/      # API 路由
│   │   ├── models/   # 数据模型
│   │   └── services/ # 业务逻辑
│   └── pyproject.toml # 后端依赖
└── README.md
```

## 快速启动

### 前提条件
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:3000 启动。

### 后端启动

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

后端 API 将在 http://localhost:8000 启动。

## 开发

### 环境变量

前端 (frontend/.env.local):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

后端 (backend/.env):
```
DATABASE_URL=postgresql://user:password@localhost:5432/openquest
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

## License

MIT
