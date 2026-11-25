"""Conexión a la base de datos con SQLAlchemy. Cambiar DATABASE_URL basta para pasar a PostgreSQL."""
from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine, event, inspect, text
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


# Columnas que se agregaron después de crear la base. create_all() no altera tablas que ya existen,
# así que las agregamos aquí para que nadie tenga que borrar su selva.db.
COLUMNAS_NUEVAS = {
    "aulas": {"nivel": "VARCHAR(40)", "requiere_aprobacion": "BOOLEAN NOT NULL DEFAULT 0"},
    "aula_alumnos": {"estado": "VARCHAR(10) NOT NULL DEFAULT 'activo'"},
    # Las cuentas que ya existían también reciben los trajes de bienvenida (su logro "Inicio de la aventura" ya está hecho).
    "mascotas": {"trajes": "JSON NOT NULL DEFAULT '[\"trajinero\", \"trajinera\"]'", "traje": "VARCHAR(20)", "cuidados_hasta": "JSON NOT NULL DEFAULT '{}'"},
    # Diagnóstico según el grado: el grado que elige el alumno al crear su cuenta.
    "usuarios": {"grado": "VARCHAR(3)"},
    "diagnosticos": {"grado": "VARCHAR(3)"},
    # Escalera de pistas: avance que el navegador todavía no confirma (turnos del tutor).
    "escaleras": {"pendiente": "JSON"},
    # Tareas del aula organizadas por módulo.
    "actividades": {"modulo": "VARCHAR(40)"},
}


def migrar_columnas(eng) -> None:
    insp = inspect(eng)
    with eng.begin() as conn:
        for tabla, columnas in COLUMNAS_NUEVAS.items():
            if not insp.has_table(tabla):
                continue
            existentes = {c["name"] for c in insp.get_columns(tabla)}
            for nombre, tipo in columnas.items():
                if nombre not in existentes:
                    conn.execute(text(f"ALTER TABLE {tabla} ADD COLUMN {nombre} {tipo}"))


def bloquear_escritura(db: Session) -> None:
    """Serializa operaciones de economía antes de leer saldo (SQLite)."""
    if db.get_bind().dialect.name == "sqlite":
        conn = db.connection()
        if not conn.connection.driver_connection.in_transaction:
            conn.exec_driver_sql("BEGIN IMMEDIATE")
