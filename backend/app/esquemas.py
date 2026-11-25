"""Validación de entradas con Pydantic. Todo lo que llega del navegador pasa por aquí."""
from __future__ import annotations

import re
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from .seguridad import USUARIO_RE, normalizar_usuario


def _validar_usuario(v: str) -> str:
    v = normalizar_usuario(v)
    if not USUARIO_RE.match(v):
        raise ValueError("El usuario debe tener de 3 a 20 caracteres: letras, números, punto, guion o guion bajo.")
    return v


class Registro(BaseModel):
    usuario: str
    apodo: str = Field(min_length=1, max_length=30)
    password: str = Field(min_length=6, max_length=64)
    rol: Literal["alumno", "profesor"] = "alumno"
    # Grado escolar del alumno (elige su examen diagnóstico). Al profesor no se le guarda.
    grado: Literal["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3"] | None = None

    _u = field_validator("usuario")(_validar_usuario)

    @field_validator("apodo")
    @classmethod
    def _apodo(cls, v: str) -> str:
        v = re.sub(r"\s+", " ", v).strip()
        if not v:
            raise ValueError("Escribe un apodo.")
        return v

    @field_validator("password")
    @classmethod
    def _pass(cls, v: str, info) -> str:
        if normalizar_usuario(v) == normalizar_usuario(info.data.get("usuario", "")):
            raise ValueError("La contraseña no puede ser igual a tu usuario.")
        return v


class Login(BaseModel):
    usuario: str = Field(max_length=40)
    password: str = Field(max_length=64)


class Recuperar(BaseModel):
    usuario: str = Field(max_length=40)
    codigo: str = Field(max_length=20)
    nueva_password: str = Field(min_length=6, max_length=64)


class CambiarPassword(BaseModel):
    actual: str = Field(max_length=64)
    nueva: str = Field(min_length=6, max_length=64)


class PerfilCambio(BaseModel):
    apodo: str | None = Field(default=None, min_length=1, max_length=30)
    avatar: str | None = Field(default=None, max_length=50)


class IntentoEntrada(BaseModel):
    respuesta: str = Field(min_length=1, max_length=60)
    pistas_usadas: int = Field(default=0, ge=0, le=10)
    tiempo_ms: int | None = Field(default=None, ge=0, le=86_400_000)


class RespuestaExamen(BaseModel):
    respuesta: str | None = Field(default=None, max_length=60)  # None = "No sé todavía"
    pistas_usadas: int = Field(default=0, ge=0, le=10)
    tiempo_ms: int | None = Field(default=None, ge=0, le=86_400_000)


class CuidadoEntrada(BaseModel):
    accion: Literal["alimentar", "limpiar", "descansar"]


class MascotaCambio(BaseModel):
    nombre: str = Field(min_length=1, max_length=20)


class TrajeEntrada(BaseModel):
    traje: str | None = Field(default=None, max_length=20)  # None = quitarle el traje


class AjustesEntrada(BaseModel):
    tema: Literal["claro", "oscuro", "sistema"] | None = None
    idioma: Literal["es-MX"] | None = None
    sonido: bool | None = None
    notificaciones: bool | None = None
    meta_diaria: int | None = Field(default=None, ge=1, le=20)


class AulaEntrada(BaseModel):
    nombre: str = Field(min_length=1, max_length=60)
    nivel: str | None = Field(default=None, max_length=40)
    modulos: list[str] = Field(default_factory=list, max_length=30)
    requiere_aprobacion: bool = False


class AulaEditar(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=60)
    nivel: str | None = Field(default=None, max_length=40)
    modulos: list[str] | None = Field(default=None, max_length=30)
    requiere_aprobacion: bool | None = None


class DiagnosticoEntrada(BaseModel):
    respuestas: dict[str, str | None] = Field(max_length=20)

    @field_validator("respuestas")
    @classmethod
    def _cortas(cls, v: dict) -> dict:
        return {k[:10]: (r[:20] if isinstance(r, str) else None) for k, r in v.items()}


class UnirseAula(BaseModel):
    codigo: str = Field(min_length=6, max_length=10)


class AsignacionEntrada(BaseModel):
    leccion_id: str = Field(max_length=30)
    fecha_limite: date | None = None
