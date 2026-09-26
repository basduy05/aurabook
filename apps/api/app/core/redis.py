from collections.abc import AsyncGenerator
import logging
from typing import Any

import redis.asyncio as aioredis
from redis.asyncio import Redis

from app.core.config import settings

logger = logging.getLogger("redis_core")

class InMemoryRedisClient:
    """Lightweight in-memory cache mimicking async Redis for local standalone development."""

    def __init__(self):
        self._data: dict[str, str] = {}
        self._ttls: dict[str, float] = {}

    async def ping(self) -> bool:
        return True

    async def get(self, key: str) -> str | None:
        return self._data.get(key)

    async def set(
        self, key: str, value: Any, ex: int | None = None, px: int | None = None
    ) -> bool:
        self._data[key] = str(value)
        return True

    async def delete(self, *keys: str) -> int:
        count = 0
        for k in keys:
            if k in self._data:
                del self._data[k]
                count += 1
        return count

    async def exists(self, *keys: str) -> int:
        return sum(1 for k in keys if k in self._data)

    async def expire(self, key: str, seconds: int) -> bool:
        return key in self._data

    async def close(self) -> None:
        pass


redis_pool: Any | None = None


async def get_redis_client() -> Any:
    """Return a shared Redis connection client or in-memory fallback."""
    global redis_pool
    if redis_pool is None:
        try:
            client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=0.5,
            )
            # Test ping
            await client.ping()
            redis_pool = client
            logger.info("Connected to standalone Redis service.")
        except Exception:
            logger.warning("Redis server unreachable. Falling back to InMemoryRedisClient.")
            redis_pool = InMemoryRedisClient()
    return redis_pool


async def get_redis() -> AsyncGenerator[Any, None]:
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
        try:
            await redis_pool.close()
        except Exception:
            pass
        redis_pool = None
