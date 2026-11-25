"""Autenticación sin correo, pensada para menores de edad.

- Usuario + contraseña (argon2). Nada de correo ni nombre real.
- Si se olvida la contraseña: código de recuperación que se muestra UNA sola vez al registrarse
  (se guarda solo su hash). Al usarlo se genera uno nuevo.
- Sesión con JWT dentro de una cookie httpOnly (el JavaScript de la página no puede leerla).
- Freno a intentos repetidos en login y recuperación.
"""
from __future__ import annotations

import hashlib
import hmac
import re
import secrets
import threading
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from . import config
from .db import get_db
from .modelos import Usuario, ahora

COOKIE = "selva_sesion"
_ph = PasswordHasher()
_ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # sin 0/O ni 1/I para no confundir

USUARIO_RE = re.compile(r"^[a-z0-9_.-]{3,20}$")


def normalizar_usuario(u: str) -> str:
    return (u or "").strip().lower()


# ---------- Contraseñas y códigos ----------

def hash_password(p: str) -> str:
    return _ph.hash(p)


def verificar_password(p: str, guardado: str) -> bool:
    try:
        return _ph.verify(guardado, p)
    except (VerificationError, InvalidHashError):
        return False


def nuevo_codigo_recuperacion() -> str:
    crudo = "".join(secrets.choice(_ALFABETO) for _ in range(12))
    return f"{crudo[:4]}-{crudo[4:8]}-{crudo[8:]}"


def hash_recuperacion(codigo: str) -> str:
    limpio = re.sub(r"[^A-Z0-9]", "", (codigo or "").upper())
    # HMAC con la clave del servidor: aunque se filtre la base, no se puede probar códigos sin la clave.
    return hmac.new(config.SECRET_KEY.encode(), limpio.encode(), hashlib.sha256).hexdigest()


def codigo_aula() -> str:
    crudo = "".join(secrets.choice(_ALFABETO) for _ in range(6))
    return f"{crudo[:3]}-{crudo[3:]}"


# ---------- Freno a intentos ----------

class Freno:
    """Cuenta fallos por llave (en memoria: suficiente para un solo servidor)."""

    def __init__(self, maximo: int = 5, ventana_s: int = 600) -> None:
        self.maximo = maximo
        self.ventana = ventana_s
        self._fallos: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def revisar(self, llave: str) -> None:
        t = time.monotonic()
        with self._lock:
            recientes = [x for x in self._fallos[llave] if t - x < self.ventana]
            self._fallos[llave] = recientes
            if len(recientes) >= self.maximo:
                raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Demasiados intentos. Espera unos minutos.")

    def fallo(self, llave: str) -> None:
        with self._lock:
            self._fallos[llave].append(time.monotonic())

    def limpiar(self, llave: str) -> None:
        with self._lock:
            self._fallos.pop(llave, None)

    def reiniciar_todo(self) -> None:
        with self._lock:
            self._fallos.clear()


freno_login = Freno()


# ---------- Sesión (JWT en cookie httpOnly) ----------

def crear_token(u: Usuario) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=config.SESION_DIAS)
    return jwt.encode({"sub": str(u.id), "v": u.version_sesion, "rol": u.rol, "exp": exp}, config.SECRET_KEY, algorithm="HS256")


def poner_cookie(resp: Response, u: Usuario) -> None:
    resp.set_cookie(
        COOKIE,
        crear_token(u),
        max_age=config.SESION_DIAS * 86400,
        httponly=True,
        secure=config.COOKIE_SEGURA,
        samesite="lax",
        path="/",
    )


def quitar_cookie(resp: Response) -> None:
    resp.delete_cookie(COOKIE, path="/")


def usuario_actual(request: Request, db: Session = Depends(get_db)) -> Usuario:
    token = request.cookies.get(COOKIE)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Inicia sesión para continuar.")
    try:
        datos = jwt.decode(token, config.SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Tu sesión terminó. Vuelve a entrar.")
    u = db.get(Usuario, int(datos.get("sub", 0)))
    if not u or u.version_sesion != datos.get("v"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Tu sesión terminó. Vuelve a entrar.")
    # Último acceso: se actualiza como máximo una vez por minuto.
    if not u.ultimo_acceso or (ahora() - _con_zona(u.ultimo_acceso)).total_seconds() > 60:
        u.ultimo_acceso = ahora()
        db.commit()
    return u


def _con_zona(d: datetime) -> datetime:
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def requiere_rol(*roles: str):
    def dep(u: Usuario = Depends(usuario_actual)) -> Usuario:
        if u.rol not in roles and u.rol != "admin":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tienes permiso para esto.")
        return u
    return dep


solo_alumno = requiere_rol("alumno")
solo_profesor = requiere_rol("profesor")
