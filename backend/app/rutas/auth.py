"""Registro, inicio de sesión y recuperación con código (sin correo)."""
from __future__ import annotations

import hmac

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import esquemas
from ..contenido import TRAJES
from ..db import get_db
from ..modelos import TRAJES_BIENVENIDA, AjustesUsuario, Mascota, Usuario, ahora
from ..seguridad import (
    freno_login, hash_password, hash_recuperacion, normalizar_usuario, nuevo_codigo_recuperacion,
    poner_cookie, quitar_cookie, usuario_actual, verificar_password,
)

router = APIRouter(prefix="/auth", tags=["Autenticación"])


def perfil(u: Usuario) -> dict:
    return {
        "id": u.id, "usuario": u.usuario, "apodo": u.apodo, "rol": u.rol, "avatar": u.avatar, "grado": u.grado,
        "creado": u.creado.isoformat() if u.creado else None,
        "ultimo_acceso": u.ultimo_acceso.isoformat() if u.ultimo_acceso else None,
    }


@router.post("/registro", status_code=status.HTTP_201_CREATED)
def registro(datos: esquemas.Registro, resp: Response, db: Session = Depends(get_db)) -> dict:
    if db.scalar(select(Usuario).where(Usuario.usuario == datos.usuario)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ese usuario ya existe. Elige otro.")
    codigo = nuevo_codigo_recuperacion()
    u = Usuario(usuario=datos.usuario, apodo=datos.apodo, rol=datos.rol, password_hash=hash_password(datos.password),
                recuperacion_hash=hash_recuperacion(codigo), ultimo_acceso=ahora(),
                grado=datos.grado if datos.rol == "alumno" else None)
    db.add(u)
    db.flush()
    db.add(AjustesUsuario(usuario_id=u.id))
    salida = {"usuario": perfil(u), "codigo_recuperacion": codigo}
    if u.rol == "alumno":
        # Regalo de bienvenida: el ajolote nace con los dos trajes de trajinera.
        db.add(Mascota(alumno_id=u.id, trajes=list(TRAJES_BIENVENIDA)))
        salida["bienvenida"] = {
            "logro": "Inicio de la aventura",
            "trajes": [{"id": t, "nombre": TRAJES[t]} for t in TRAJES_BIENVENIDA],
        }
    db.commit()
    poner_cookie(resp, u)
    # El código de recuperación se muestra UNA sola vez. No se puede volver a consultar.
    return salida


@router.post("/login")
def login(datos: esquemas.Login, request: Request, resp: Response, db: Session = Depends(get_db)) -> dict:
    nombre = normalizar_usuario(datos.usuario)
    ip = request.client.host if request.client else "?"
    for llave in (f"u:{nombre}", f"ip:{ip}"):
        freno_login.revisar(llave)
    u = db.scalar(select(Usuario).where(Usuario.usuario == nombre))
    if not u or not verificar_password(datos.password, u.password_hash):
        freno_login.fallo(f"u:{nombre}")
        freno_login.fallo(f"ip:{ip}")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario o contraseña incorrectos.")
    freno_login.limpiar(f"u:{nombre}")
    u.ultimo_acceso = ahora()
    db.commit()
    poner_cookie(resp, u)
    return {"usuario": perfil(u)}


@router.post("/logout")
def logout(resp: Response) -> dict:
    quitar_cookie(resp)
    return {"ok": True}


@router.post("/logout-todo")
def logout_todo(resp: Response, u: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)) -> dict:
    """Cierra la sesión en todos los dispositivos."""
    u.version_sesion += 1
    db.commit()
    quitar_cookie(resp)
    return {"ok": True}


@router.post("/recuperar")
def recuperar(datos: esquemas.Recuperar, request: Request, resp: Response, db: Session = Depends(get_db)) -> dict:
    nombre = normalizar_usuario(datos.usuario)
    ip = request.client.host if request.client else "?"
    for llave in (f"r:{nombre}", f"ip:{ip}"):
        freno_login.revisar(llave)
    u = db.scalar(select(Usuario).where(Usuario.usuario == nombre))
    if not u or not hmac.compare_digest(u.recuperacion_hash, hash_recuperacion(datos.codigo)):
        freno_login.fallo(f"r:{nombre}")
        freno_login.fallo(f"ip:{ip}")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "El usuario o el código de recuperación no coinciden.")
    if normalizar_usuario(datos.nueva_password) == u.usuario:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "La contraseña no puede ser igual a tu usuario.")
    codigo = nuevo_codigo_recuperacion()  # el código viejo ya no sirve
    u.password_hash = hash_password(datos.nueva_password)
    u.recuperacion_hash = hash_recuperacion(codigo)
    u.version_sesion += 1  # cierra sesiones abiertas en otros dispositivos
    u.ultimo_acceso = ahora()
    db.commit()
    freno_login.limpiar(f"r:{nombre}")
    poner_cookie(resp, u)
    return {"usuario": perfil(u), "codigo_recuperacion": codigo}


@router.post("/cambiar-password")
def cambiar_password(datos: esquemas.CambiarPassword, resp: Response, u: Usuario = Depends(usuario_actual),
                     db: Session = Depends(get_db)) -> dict:
    if not verificar_password(datos.actual, u.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Tu contraseña actual no coincide.")
    u.password_hash = hash_password(datos.nueva)
    u.version_sesion += 1
    db.commit()
    poner_cookie(resp, u)
    return {"ok": True}


@router.post("/nuevo-codigo")
def nuevo_codigo(u: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)) -> dict:
    """Genera un código de recuperación nuevo (por si se perdió el anterior y aún recuerda la contraseña)."""
    codigo = nuevo_codigo_recuperacion()
    u.recuperacion_hash = hash_recuperacion(codigo)
    db.commit()
    return {"codigo_recuperacion": codigo}


@router.get("/yo")
def yo(u: Usuario = Depends(usuario_actual)) -> dict:
    return {"usuario": perfil(u)}


@router.patch("/yo")
def cambiar_perfil(datos: esquemas.PerfilCambio, u: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)) -> dict:
    if datos.apodo is not None:
        u.apodo = datos.apodo.strip()
    if datos.avatar is not None:
        u.avatar = datos.avatar
    db.commit()
    return {"usuario": perfil(u)}
