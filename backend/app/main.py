"""OpenQuest Backend - FastAPI Application Entry Point"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .controllers.agent_controller import router as agent_router
from .controllers.auth_controller import router as auth_router
from .controllers.github_oauth_controller import router as oauth_router
from .controllers.issue_controller import router as issue_router
from .controllers.repo_controller import router as repo_router


def setup_logging():
    """Configure logging for the application"""
    settings = get_settings()

    # Set log level based on debug mode
    log_level = logging.DEBUG if settings.debug else logging.INFO

    # Create formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Add console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Configure specific loggers for agent components
    agent_loggers = [
        "agent",
        "agent.dao",
        "agent.openrouter",
    ]
    for logger_name in agent_loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(log_level)
        logger.propagate = True

    logging.info(f"Logging configured with level: {logging.getLevelName(log_level)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    setup_logging()
    settings = get_settings()
    logging.info(f"Starting {settings.app_name}...")
    logging.info(f"Debug mode: {settings.debug}")
    logging.info(f"E2B configured: {bool(settings.e2b_api_key)}")
    logging.info(f"OpenRouter configured: {bool(settings.openrouter_api_key)}")
    logging.info(f"OpenRouter model: {settings.openrouter_model}")
    yield
    # Shutdown
    logging.info("Shutting down...")


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

    # Add validation error handler for better error messages
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        """Handle validation errors with detailed messages"""
        errors = []
        for error in exc.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            message = error["msg"]
            error_type = error.get("type", "")

            # Provide user-friendly error messages
            if error_type == "value_error.email" or (
                "email" in field.lower() and "value" in message.lower()
            ):
                message = "Invalid email format. Please use a valid email address (e.g., user@example.com)"
            elif "required" in message.lower():
                message = f"Field '{field}' is required"

            errors.append(
                {
                    "field": field,
                    "message": message,
                    "type": error_type,
                }
            )

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Validation error",
                "errors": errors,
                "message": "Please check your input. "
                + "; ".join([f"{e['field']}: {e['message']}" for e in errors]),
            },
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
