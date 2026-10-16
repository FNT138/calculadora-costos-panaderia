import os
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")
DATABASE_URL = os.getenv("DATABASE_URL")

if TURSO_DATABASE_URL:
    # Soporte para Turso / libSQL Cloud
    url = TURSO_DATABASE_URL
    if url.startswith("libsql://"):
        url = url.replace("libsql://", "sqlite+libsql://", 1)
    elif not url.startswith("sqlite+libsql://"):
        url = f"sqlite+libsql://{url}"
    if "?" not in url:
        url = f"{url}?secure=true"
    
    connect_args = {}
    if TURSO_AUTH_TOKEN:
        connect_args["auth_token"] = TURSO_AUTH_TOKEN
    
    engine = create_engine(url, connect_args=connect_args)
elif DATABASE_URL:
    # Render y plataformas cloud usan postgres://, SQLAlchemy 2.0 requiere postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)
else:
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    DB_PATH = BASE_DIR / "panaderia.db"
    DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
