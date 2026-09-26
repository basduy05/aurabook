import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.init_db import init_database
from app.core.redis import close_redis_pool
from app.routers.api_v1 import api_v1_router
from app.routers.health import router as health_router

logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events (startup / shutdown)."""
    if settings.DEBUG:
        try:
            await init_database()
        except Exception as e:
            logger.warning(f"Database auto-init skipped: {e}")
    yield
    await close_redis_pool()


def create_application() -> FastAPI:
    """FastAPI Application Factory."""
    app = FastAPI(
        title=settings.APP_NAME,
        description="AuraBook AI-powered backend service",
        version="0.1.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

    @app.get("/", tags=["Root"])
    async def root() -> dict[str, str]:
        return {
            "message": f"Welcome to {settings.APP_NAME} API",
            "version": "0.1.0",
            "docs": "/docs" if settings.DEBUG else "Disabled in production",
        }

    return app


app = create_application()
