from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import os

from app.core.security import settings

# Default to SQLite only if DATABASE_URL is not set
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# If it's SQLite, we might need check_same_thread: False
is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} if is_sqlite else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
