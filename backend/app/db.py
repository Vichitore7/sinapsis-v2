"""Conexión a la base de datos con SQLAlchemy. Cambiar DATABASE_URL basta para pasar a PostgreSQL."""
from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from . import config


class Base(DeclarativeBase):
    pass


def crear_engine(url: str):
    args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    engine = create_engine(url, connect_args=args)
    if url.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def _fk(conn, _):  # SQLite no revisa llaves foráneas si no se le pide
            conn.execute("PRAGMA foreign_keys=ON")
    return engine


engine = crear_engine(config.DATABASE_URL)
SesionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SesionLocal()
    try:
        yield db
    finally:
        db.close()
