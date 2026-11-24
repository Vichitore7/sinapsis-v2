"""Chat con Kiko, el tutor de IA del escáner."""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator

from .. import juego, tutor
from ..modelos import Usuario
from ..seguridad import solo_alumno

router = APIRouter(tags=["Tutor"])


class Operacion(BaseModel):
    a: int = Field(ge=0, le=1_000_000)
    op: str
    b: int = Field(ge=0, le=1_000_000)
    c: int = Field(ge=-1_000_000, le=1_000_000)  # lo que escribió el alumno

    @field_validator("op")
    @classmethod
    def _op(cls, v: str) -> str:
        v = juego.normalizar_op(v.strip())
        if v not in juego.OPERACIONES:
            raise ValueError("Operación no soportada: usa ×, + o −.")
        return v


class MensajeHistorial(BaseModel):
    de: Literal["yo", "kiko"]
    texto: str = Field(default="", max_length=1000)


class TutorEntrada(BaseModel):
    operacion: Operacion | None = None
    mensaje: str = Field(min_length=1, max_length=200)
    historial: list[MensajeHistorial] = Field(default_factory=list, max_length=40)


@router.post("/tutor")
def hablar_con_kiko(datos: TutorEntrada, u: Usuario = Depends(solo_alumno)) -> dict:
    """Kiko contesta con una pista socrática. Regresa {respuesta, origen: "claude" | "reglas"}; nunca da el resultado."""
    return tutor.responder(
        u.id,
        datos.operacion.model_dump() if datos.operacion else None,
        datos.mensaje.strip(),
        [m.model_dump() for m in datos.historial],
    )
