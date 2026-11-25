"""Chat con Kiko, el tutor de IA del escáner."""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, model_validator

from .. import operaciones, tutor
from ..db import get_db
from ..modelos import Usuario
from ..seguridad import solo_alumno

router = APIRouter(tags=["Tutor"])


class Operacion(BaseModel):
    """Números como entero o texto: 17, "17" o "3/4". `c` vacío si el alumno todavía no escribe su resultado."""
    a: int | str
    op: str
    b: int | str
    c: int | str | None = None  # lo que escribió el alumno
    residuo: int | str | None = None  # solo en divisiones de enteros

    def normalizada(self) -> dict:
        op = operaciones.validar(self.model_dump())
        if op is None:
            raise ValueError("No puedo revisar esa operación: usa números naturales o fracciones con ×, +, − o ÷.")
        return op


class MensajeHistorial(BaseModel):
    de: Literal["yo", "kiko"]
    texto: str = Field(default="", max_length=1000)


class TutorEntrada(BaseModel):
    operacion: Operacion | None = None
    mensaje: str = Field(min_length=1, max_length=200)
    historial: list[MensajeHistorial] = Field(default_factory=list, max_length=500)  # el tutor solo usa los últimos 10
    grado: str | None = Field(default=None, max_length=40)  # el que eligió al registrarse, p. ej. "Primaria • 4°"
    # Ejercicio que el escáner no sabe revisar (problema de texto, ecuación…) y que el alumno confirmó en el chat.
    ejercicio: str | None = Field(default=None, max_length=500)
    # Turnos (opcionales): `turno` identifica este mensaje; `recibido`, el último cuya respuesta mostró el navegador.
    turno: str | None = Field(default=None, max_length=64)
    recibido: str | None = Field(default=None, max_length=64)

    @model_validator(mode="after")
    def _operacion_valida(self):
        if self.operacion is not None:
            self.operacion.normalizada()  # lanza un error de validación (422) si no se puede revisar
        return self


@router.post("/tutor")
def hablar_con_kiko(datos: TutorEntrada, u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    """Kiko contesta con una pista socrática. Regresa {respuesta, origen: "claude" | "reglas", dibujo}; nunca da el resultado.

    `dibujo` (o null) lo pinta el frontend con VisualCanal (los stickers del Mundo 1).
    """
    return tutor.responder(
        u.id,
        datos.operacion.normalizada() if datos.operacion else None,
        datos.mensaje.strip(),
        [m.model_dump() for m in datos.historial],
        datos.grado,
        (datos.ejercicio or "").strip() or None,
        db,
        turno=datos.turno,
        recibido=datos.recibido,
    )
