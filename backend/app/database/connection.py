import httpx
from typing import Any, Dict, List, Optional, Union
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
from app.core.logging import logger


class Base(DeclarativeBase):
    pass


# Async SQLAlchemy Engine setup
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

try:
    engine = create_async_engine(
        database_url,
        echo=False,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )
    async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
except Exception as e:
    logger.warning(f"SQLAlchemy async engine setup warning: {e}")
    engine = None
    async_session_factory = None


async def get_db():
    if async_session_factory is None:
        yield None
        return
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


class SupabaseHTTPClient:
    """Fallback / Direct HTTP Client for Supabase PostgREST & Storage REST APIs with persistent connection pooling"""

    def __init__(self):
        self.base_url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1"
        self.auth_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        self.headers = {
            "apikey": self.auth_key,
            "Authorization": f"Bearer {self.auth_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        self._client: Optional[httpx.AsyncClient] = None

    def get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30.0, limits=httpx.Limits(max_keepalive_connections=20, max_connections=50))
        return self._client

    async def select(
        self, table: str, query_params: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        client = self.get_client()
        url = f"{self.base_url}/{table}"
        try:
            resp = await client.get(url, headers=self.headers, params=query_params or {})
            if resp.is_success:
                return resp.json()
            logger.error(f"Supabase HTTP select failed [{resp.status_code}]: {resp.text}")
            return []
        except Exception as e:
            logger.error(f"Supabase HTTP select exception: {e}")
            return []

    async def insert(self, table: str, payload: Union[Dict[str, Any], List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        client = self.get_client()
        url = f"{self.base_url}/{table}"
        headers = {**self.headers, "Prefer": "return=representation"}
        try:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.is_success:
                return resp.json() if resp.text else []
            logger.error(f"Supabase HTTP insert failed [{resp.status_code}]: {resp.text}")
            raise Exception(f"Database insertion error: {resp.text}")
        except Exception as e:
            logger.error(f"Supabase HTTP insert exception: {e}")
            raise

    async def update(self, table: str, match_params: Dict[str, Any], payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        client = self.get_client()
        url = f"{self.base_url}/{table}"
        headers = {**self.headers, "Prefer": "return=representation"}
        try:
            resp = await client.patch(url, headers=headers, params=match_params, json=payload)
            if resp.is_success:
                return resp.json() if resp.text else []
            logger.error(f"Supabase HTTP update failed [{resp.status_code}]: {resp.text}")
            raise Exception(f"Database update error: {resp.text}")
        except Exception as e:
            logger.error(f"Supabase HTTP update exception: {e}")
            raise

    async def delete(self, table: str, match_params: Dict[str, Any]) -> bool:
        client = self.get_client()
        url = f"{self.base_url}/{table}"
        try:
            resp = await client.delete(url, headers=self.headers, params=match_params)
            return resp.is_success
        except Exception as e:
            logger.error(f"Supabase HTTP delete exception: {e}")
            return False


supabase_http_client = SupabaseHTTPClient()
