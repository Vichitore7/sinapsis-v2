"""Cuentas demo de la app publicada (app/demo.py)."""
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import sessionmaker

from app import demo
from app.db import Base, crear_engine, get_db
from app.main import app
from app.modelos import Usuario
from app.seguridad import freno_login
from app.semilla import cargar_contenido

CLAVE = "clave-demo-de-prueba"


def test_demo_crea_grupo_alumnos_y_mapa_terminado(tmp_path):
    engine = crear_engine(f"sqlite:///{tmp_path / 'demo.db'}")
    Base.metadata.create_all(engine)
    Sesion = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with Sesion() as db:
        cargar_contenido(db)
        assert demo.crear(db, CLAVE) is True
        assert demo.crear(db, CLAVE) is False  # la segunda vez no toca nada
        assert db.scalar(select(func.count()).select_from(Usuario)) == 1 + len(demo.ALUMNOS)

    def _db():
        with Sesion() as db:
            yield db

    app.dependency_overrides[get_db] = _db
    freno_login.reiniciar_todo()
    try:
        def entrar(usuario):
            c = TestClient(app)
            assert c.post("/api/auth/login", json={"usuario": usuario, "password": CLAVE}).status_code == 200
            return c

        profe = entrar(demo.PROFE)
        aula = profe.get("/api/aulas").json()["aulas"][0]
        comp = profe.get(f"/api/aulas/{aula['id']}/comprension").json()
        assert len(comp["alumnos"]) >= 5
        categorias = {t["categoria"] for a in comp["alumnos"] for t in a["temas"].values()}
        assert categorias == {"dificultad", "comprende", "domina"}  # la gráfica tiene de las tres

        experto = entrar(demo.EXPERTO).get("/api/juego/estado").json()
        assert all(m["cofre"] == "abierto" for m in experto["mapa"].values())

        nuevo = entrar(demo.NUEVO)
        assert nuevo.get("/api/diagnostico").json()["hecho"] is False
        assert nuevo.get("/api/juego/estado").json()["completados"] == {}
    finally:
        app.dependency_overrides.clear()
