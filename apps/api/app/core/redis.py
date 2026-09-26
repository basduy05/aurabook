from collections.abc import AsyncGenerator
import redis.asyncio as aioredis
from redis.asyncio import Redis

from app.core.config import settings

redis_pool: Redis | None = None


async def get_redis_client() -> Redis:
    """Return a shared Redis connection pool client."""
    global redis_pool
    if redis_pool is None:
        redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return redis_pool


async def get_redis() -> AsyncGenerator[Redis, None]:
    """Dependency for obtaining a Redis client."""
    client = await get_redis_client()
    try:
        yield client
    finally:
        pass


async def close_redis_pool() -> None:
    """Close Redis connection pool on app shutdown."""
    global redis_pool
    if redis_pool is not None:
        await redis_pool.close()
        redis_pool = None
