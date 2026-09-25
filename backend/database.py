"""
SmartCityAI - Database Engine & Session Management
SQLAlchemy engine and session factory supporting PostgreSQL with SQLite fallback.
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.config import settings

# Engine configuration depending on DB dialect
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=settings.DB_ECHO,
    )
else:
    # PostgreSQL connection pooling
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_pre_ping=True,
        echo=settings.DB_ECHO,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for providing a transactional database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Creates all database tables defined in metadata."""
    import backend.models.orm_models  # Register all ORM models with metadata
    Base.metadata.create_all(bind=engine)
