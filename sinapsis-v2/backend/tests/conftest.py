import os

os.environ.setdefault("SECRET_KEY", "clave-solo-para-pruebas-con-32-caracteres-o-mas")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.db import Base, crear_engine, get_db
from app.main import app
from app.seguridad import freno_login
from app.semilla import cargar_contenido


@pytest.fixture()
def cliente(tmp_path):
    engine = crear_engine(f"sqlite:///{tmp_path / 'prueba.db'}")
    Base.metadata.create_all(engine)
    Sesion = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with Sesion() as db:
        cargar_contenido(db)

    def _db():
        db = Sesion()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _db
    freno_login.reiniciar_todo()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def registrar(c, usuario="luna", rol="alumno", password="selva123", apodo=None):
    r = c.post("/api/auth/registro", json={"usuario": usuario, "apodo": apodo or usuario.capitalize(), "password": password, "rol": rol})
    assert r.status_code == 201, r.text
    return r.json()


@pytest.fixture()
def nuevo_cliente():
    """Otro navegador (otras cookies) sobre la misma app y base."""
    def _crear():
        return TestClient(app)
    return _crear
