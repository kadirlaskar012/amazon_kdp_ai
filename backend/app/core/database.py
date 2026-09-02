import asyncio
import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine, event
from backend.app.core.config import settings

# Determine DB URL based on config
db_url = settings.POSTGRES_URL if settings.USE_POSTGRES and settings.POSTGRES_URL else settings.DATABASE_URL
sync_db_url = settings.POSTGRES_SYNC_URL if settings.USE_POSTGRES and settings.POSTGRES_SYNC_URL else settings.SYNC_DATABASE_URL

# Engine connection parameters
engine_args = {
    "echo": False,
    "future": True,
    "pool_pre_ping": True,
}

if "sqlite" in db_url:
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL / Supabase pool configuration
    engine_args["pool_size"] = 10
    engine_args["max_overflow"] = 20

async_engine = create_async_engine(
    db_url,
    **engine_args
)

# Enable WAL mode for SQLite only
if "sqlite" in db_url:
    @event.listens_for(async_engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Sync Engine for utilities / migrations
sync_engine_args = {"pool_pre_ping": True}
if "sqlite" in sync_db_url:
    sync_engine_args["connect_args"] = {"check_same_thread": False}
else:
    sync_engine_args["pool_size"] = 5
    sync_engine_args["max_overflow"] = 10

sync_engine = create_engine(
    sync_db_url,
    **sync_engine_args
)
SyncSessionLocal = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False)

async def init_db():
    """Ensure all tables exist in target database (Supabase PostgreSQL / SQLite)"""
    if "sqlite" in db_url:
        os.makedirs(os.path.dirname(settings.DATA_DIR), exist_ok=True)
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
