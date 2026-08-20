import json
import time
from typing import Any, Dict, Optional, Tuple
from app.core.config import settings
from app.core.logging import logger

try:
    import redis.asyncio as aioredis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False


class CacheManager:
    """Production Redis Cache Manager with fallback in-memory TTL store for horizontal scaling & high-throughput endpoints"""

    def __init__(self):
        self.redis_client = None
        self._memory_cache: Dict[str, Tuple[float, Any]] = {}
        self.enabled = True

        if HAS_REDIS:
            try:
                redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
                self.redis_client = aioredis.from_url(
                    redis_url, encoding="utf-8", decode_responses=True, socket_connect_timeout=2.0
                )
            except Exception as e:
                logger.warning(f"Redis initialization warning (using in-memory fallback): {e}")

    async def get(self, key: str) -> Optional[Any]:
        if not self.enabled:
            return None

        # 1. Try Redis
        if self.redis_client:
            try:
                data = await self.redis_client.get(key)
                if data:
                    return json.loads(data)
            except Exception:
                pass  # Fallback to in-memory

        # 2. Try In-Memory Fallback
        if key in self._memory_cache:
            expires_at, val = self._memory_cache[key]
            if time.time() < expires_at:
                return val
            else:
                del self._memory_cache[key]

        return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 60) -> bool:
        if not self.enabled:
            return False

        serialized = json.dumps(value, default=str)

        # 1. Set in Redis
        if self.redis_client:
            try:
                await self.redis_client.set(key, serialized, ex=ttl_seconds)
            except Exception:
                pass

        # 2. Set in Memory Fallback
        expires_at = time.time() + ttl_seconds
        self._memory_cache[key] = (expires_at, value)
        return True

    async def delete(self, key: str) -> bool:
        if self.redis_client:
            try:
                await self.redis_client.delete(key)
            except Exception:
                pass
        self._memory_cache.pop(key, None)
        return True

    async def clear_prefix(self, prefix: str) -> int:
        count = 0
        if self.redis_client:
            try:
                keys = await self.redis_client.keys(f"{prefix}*")
                if keys:
                    await self.redis_client.delete(*keys)
                    count += len(keys)
            except Exception:
                pass

        keys_to_del = [k for k in self._memory_cache.keys() if k.startswith(prefix)]
        for k in keys_to_del:
            self._memory_cache.pop(k, None)
            count += 1
        return count


cache_manager = CacheManager()
