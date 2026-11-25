"""Ajustes del usuario. El backend solo guarda la preferencia; el frontend resuelve 'sistema'."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import esquemas
from ..db import get_db
from ..modelos import AjustesUsuario, Usuario
from ..seguridad import usuario_actual

router = APIRouter(prefix="/ajustes", tags=["Ajustes"])


def _de(db: Session, u: Usuario) -> AjustesUsuario:
    a = db.get(AjustesUsuario, u.id)
    if not a:
        a = AjustesUsuario(usuario_id=u.id, tema="sistema", idioma="es-MX", sonido=True, notificaciones=False, meta_diaria=3)
        db.add(a)
        db.commit()
    return a


def _salida(a: AjustesUsuario) -> dict:
    return {"tema": a.tema, "idioma": a.idioma, "sonido": a.sonido, "notificaciones": a.notificaciones, "meta_diaria": a.meta_diaria}


@router.get("")
def ver(u: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)) -> dict:
    return _salida(_de(db, u))


@router.put("")
def guardar(datos: esquemas.AjustesEntrada, u: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)) -> dict:
    a = _de(db, u)
    for k, v in datos.model_dump(exclude_none=True).items():
        setattr(a, k, v)
    db.commit()
    return _salida(a)
