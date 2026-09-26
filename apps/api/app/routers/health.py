from datetime import datetime, timezone
import time
from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.redis import get_redis_client
from app.schemas.health import HealthCheckResponse, ServiceStatus

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Service Health Check",
    description="Check the operational status of the AuraBook API and dependent services.",
)
async def health_check() -> HealthCheckResponse:
    services: dict[str, ServiceStatus] = {}

    # Check Database connectivity
    db_start = time.perf_counter()
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        db_latency = (time.perf_counter() - db_start) * 1000
        services["database"] = ServiceStatus(
            status="healthy", latency_ms=round(db_latency, 2)
        )
    except Exception as e:
        services["database"] = ServiceStatus(status="unhealthy", error=str(e))

    # Check Redis connectivity
    redis_start = time.perf_counter()
    try:
        redis = await get_redis_client()
        await redis.ping()
        redis_latency = (time.perf_counter() - redis_start) * 1000
        services["redis"] = ServiceStatus(
            status="healthy", latency_ms=round(redis_latency, 2)
        )
    except Exception as e:
        services["redis"] = ServiceStatus(status="unhealthy", error=str(e))

    # Determine overall status
    overall_status = "healthy"
    if any(s.status == "unhealthy" for s in services.values()):
        overall_status = "degraded"

    return HealthCheckResponse(
        status=overall_status,
        app_name=settings.APP_NAME,
        environment=settings.ENVIRONMENT,
        version="0.1.0",
        timestamp=datetime.now(timezone.utc),
        services=services,
    )


@router.get(
    "/ping",
    summary="Simple Liveness Ping",
)
async def ping() -> dict[str, str]:
    return {"message": "pong"}
