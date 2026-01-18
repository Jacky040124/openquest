"""OpenQuest Backend - FastAPI Application Entry Point"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .controllers.agent_controller import router as agent_router
from .controllers.auth_controller import router as auth_router
from .controllers.github_oauth_controller import router as oauth_router
from .controllers.issue_controller import router as issue_router
from .controllers.repo_controller import router as repo_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    settings = get_settings()
    print(f"Starting {settings.app_name}...")
    print(f"Debug mode: {settings.debug}")
    yield
    # Shutdown
    print("Shutting down...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="OpenQuest Backend API - Find and contribute to open source projects",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(issue_router, prefix="/api/v1")
    app.include_router(repo_router, prefix="/api/v1")
    app.include_router(agent_router, prefix="/api/v1")
    app.include_router(oauth_router, prefix="/api/v1")

    @app.get("/", tags=["Health"])
    async def root():
        """Root endpoint - health check"""
        return {
            "status": "healthy",
            "app": settings.app_name,
            "version": "0.1.0",
        }

    @app.get("/health", tags=["Health"])
    async def health_check():
        """Health check endpoint"""
        return {"status": "ok"}

    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
