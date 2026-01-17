# OpenQuest Backend

OpenQuest Backend API Service - Find and contribute to open source projects.

## Tech Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Supabase** - Authentication and database
- **PostgreSQL** - Primary database
- **Redis** - Caching (optional)

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Settings (Supabase, GitHub token)
│   ├── controllers/         # API Routes (thin layer)
│   ├── services/            # Business Logic
│   ├── dto/                 # Data Transfer Objects
│   ├── dao/                 # Data Access Objects
│   ├── models/              # SQLAlchemy Models
│   └── utils/               # Dependencies & utilities
├── pyproject.toml
└── .env.example
```

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login and get token
- `POST /logout` - Logout user
- `GET /me` - Get current user info
- `GET /me/preferences` - Get user preferences
- `PUT /me/preferences` - Update user preferences

### Issues (`/api/v1/issues`)
- `POST /search` - Search issues by repo URL and filters

### Repositories (`/api/v1/repos`)
- `GET /recommend` - Get personalized repo recommendations
- `GET /{owner}/{repo}` - Get repo information

## Development

```bash
# Install dependencies
uv sync

# Copy environment file and configure
cp .env.example .env

# Run development server
uv run uvicorn app.main:app --reload

# Or run directly
uv run python -m app.main
```

## Environment Variables

See `.env.example` for required configuration:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon key
- `GITHUB_TOKEN` - GitHub personal access token (optional, increases rate limits)

## Testing

```bash
uv run pytest
```
