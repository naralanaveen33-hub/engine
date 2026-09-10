"""
AquaCrop Database Session & Engine Configuration
Supports PostgreSQL with connection pooling and safe fallback to SQLite.
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


def create_db_engine():
    db_url = settings.database_url
    if db_url.startswith("sqlite"):
        path_part = db_url.split("sqlite:///")[-1] if "sqlite:///" in db_url else ""
        if path_part and ("/" in path_part or "\\" in path_part):
            dir_path = os.path.dirname(path_part)
            if dir_path:
                os.makedirs(dir_path, exist_ok=True)
        return create_engine(db_url, connect_args={"check_same_thread": False})

    # Attempt PostgreSQL connection
    try:
        pg_engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args={"connect_timeout": 3},
        )
        # Verify connection
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[DB ENGINE] Connected successfully to PostgreSQL database ({db_url.split('@')[-1]}).")
        return pg_engine
    except Exception as e:
        print(f"[DB ENGINE WARNING] PostgreSQL connection failed: {e}. Falling back to SQLite (aquacrop.db).")
        fallback_url = "sqlite:///./aquacrop.db"
        return create_engine(fallback_url, connect_args={"check_same_thread": False})


engine = create_db_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
