# OpenQuest

OpenQuest is a gamified platform that helps developers contribute to open-source projects
based on their skill level, interests, and goals.

It's like LeetCode, but for real repositories and real pull requests.

## How It Works

1. **Profile & Skill Assessment**
   Users describe their experience, tech stack, and interests.

2. **Repo Matching**
   An AI agent recommends beginner-friendly open-source GitHub repositories.

3. **Issue Ranking**
   Selected repos are analyzed and issues are ranked by:
   - Difficulty
   - Required technologies
   - Estimated effort
   - User preferences

4. **Guided Contribution**
   - A Planner Agent creates a step-by-step contribution plan
   - A Coding Agent can assist with implementation when requested

5. **Progression & Rewards**
   - Submit a pull request → level up
   - Unlock harder repositories
   - Earn nameplates, badges, and prizes

## Tech Stack

### Frontend
- **Next.js 14** - React full-stack framework with App Router
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management and data fetching

### Backend
- **FastAPI** - High-performance Python web framework
- **SQLAlchemy** - Python ORM
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Database & Cache
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage

### Authentication
- **python-jose** - JWT token handling

## Project Structure

```
open-source/
├── frontend/          # Next.js frontend application
│   ├── app/          # App Router pages
│   ├── components/   # React components
│   ├── lib/          # Utility functions
│   └── package.json  # Frontend dependencies
├── backend/          # FastAPI backend service
│   ├── app/          # Application code
│   │   ├── api/      # API routes
│   │   ├── models/   # Data models
│   │   └── services/ # Business logic
│   └── pyproject.toml # Backend dependencies
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:3000.

### Backend Setup

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

Backend API will be available at http://localhost:8000.

## Development

### Environment Variables

Frontend (frontend/.env.local):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Backend (backend/.env):
```
DATABASE_URL=postgresql://user:password@localhost:5432/openquest
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

## License

MIT
