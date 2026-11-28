"""API de Mix.

    uv run uvicorn app.main:app --reload       # http://localhost:8000/docs (Swagger)
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import update

from . import config, demo
from .db import Base, SesionLocal, engine, migrar_columnas
from .modelos import Mascota
from .rutas import actividades, ajustes, auth, aulas, diagnostico, juego, tutor, habitacion, escaner
from .semilla import cargar_contenido


# Los avisos de la app (logger "selva", p. ej. por qué el tutor usó reglas) salen en la terminal junto a los de uvicorn.
_log_app = logging.getLogger("selva")
if not _log_app.handlers:
    _manejador = logging.StreamHandler()
    _manejador.setFormatter(logging.Formatter("%(levelname)s:  %(name)s: %(message)s"))
    _log_app.addHandler(_manejador)
    _log_app.setLevel(logging.INFO)


@asynccontextmanager
async def ciclo(_: FastAPI):
    Base.metadata.create_all(engine)
    migrar_columnas(engine)
    with SesionLocal() as db:
        cargar_contenido(db)  # idempotente: así aparecen los módulos nuevos sin volver a sembrar
        # 25 nov: el ajolote se llamaba Kiko por defecto (y un rato Mih); ahora es Mix. El que le puso otro nombre lo conserva.
        db.execute(update(Mascota).where(Mascota.nombre.in_(["Kiko", "Mih"])).values(nombre="Mix"))
        db.commit()
        if len(config.DEMO_PASSWORD) >= 6:  # app publicada: cuentas demo con una contraseña que solo sabe el equipo
            demo.crear(db, config.DEMO_PASSWORD)
    yield


app = FastAPI(
    title="Mix API",
    version="0.1.0",
    description="Backend de Mix: cuentas sin correo, retos validados en el servidor, progreso, ajolote y aulas.",
    lifespan=ciclo,
    # En producción no se publica la documentación de la API (Swagger, ReDoc ni el esquema).
    docs_url=None if config.ENTORNO == "produccion" else "/docs",
    redoc_url=None if config.ENTORNO == "produccion" else "/redoc",
    openapi_url=None if config.ENTORNO == "produccion" else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGENES,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


# Errores con la misma forma siempre: {"error": "mensaje para mostrar", "detalles": [...]}
@app.exception_handler(HTTPException)
async def _http(_: Request, exc: HTTPException):
    return JSONResponse({"error": exc.detail}, status_code=exc.status_code, headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def _validacion(_: Request, exc: RequestValidationError):
    detalles = [{"campo": ".".join(str(x) for x in e["loc"][1:]), "mensaje": e["msg"].removeprefix("Value error, ")} for e in exc.errors()]
    mensaje = detalles[0]["mensaje"] if detalles else "Revisa los datos."
    return JSONResponse({"error": mensaje, "detalles": detalles}, status_code=422)


@app.middleware("http")
async def no_cache_api(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/salud", tags=["Sistema"])
def salud() -> dict:
    return {"ok": True}


for r in (auth.router, juego.router, aulas.router, diagnostico.router, ajustes.router, tutor.router, habitacion.router, escaner.router, actividades.router):
    app.include_router(r, prefix="/api")

# Deploy en un solo servicio: el frontend construido se sirve en "/" (el router es por hash, basta index.html).
# Va al final para que /api y /salud tengan prioridad.
if config.SERVIR_FRONTEND and config.FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=config.FRONTEND_DIR, html=True), name="frontend")
