"""API de Selva Matemática.

    uv run uvicorn app.main:app --reload       # http://localhost:8000/docs (Swagger)
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import config
from .db import Base, SesionLocal, engine, migrar_columnas
from .rutas import ajustes, auth, aulas, diagnostico, escaner, juego, tutor
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
    yield


app = FastAPI(
    title="Selva Matemática API",
    version="0.1.0",
    description="Backend de Selva Matemática: cuentas sin correo, retos validados en el servidor, progreso, ajolote y aulas.",
    lifespan=ciclo,
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


@app.get("/salud", tags=["Sistema"])
def salud() -> dict:
    return {"ok": True}


for r in (auth.router, juego.router, aulas.router, diagnostico.router, ajustes.router, tutor.router, escaner.router):
    app.include_router(r, prefix="/api")
