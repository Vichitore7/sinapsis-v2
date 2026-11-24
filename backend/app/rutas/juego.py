"""Contenido, retos, progreso y cuidados del ajolote (alumno)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import esquemas, servicio
from ..db import get_db
from ..modelos import Ejercicio, Usuario
from ..seguridad import solo_alumno, usuario_actual

router = APIRouter(tags=["Juego"])


@router.get("/contenido")
def contenido(_: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)) -> dict:
    """Mundos y retos SIN respuestas."""
    return {"mundos": servicio.mundos_publicos(db)}


@router.get("/ejercicios/{ejercicio_id}")
def ejercicio(ejercicio_id: str, _: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)) -> dict:
    e = db.get(Ejercicio, ejercicio_id)
    if not e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ese reto no existe.")
    return servicio.ejercicio_publico(e)


@router.get("/juego/estado")
def estado(u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    return servicio.resumen(db, u)


@router.post("/ejercicios/{ejercicio_id}/intentos")
def intentar(ejercicio_id: str, datos: esquemas.IntentoEntrada, u: Usuario = Depends(solo_alumno),
             db: Session = Depends(get_db)) -> dict:
    """Valida la respuesta en el servidor. Si falla, devuelve la senda de pasos (nunca la respuesta)."""
    return servicio.registrar_intento(db, u, ejercicio_id, datos.respuesta, datos.pistas_usadas, datos.tiempo_ms)


@router.post("/lecciones/{leccion_id}/cofre")
def cofre(leccion_id: str, u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    return servicio.abrir_cofre(db, u, leccion_id)


@router.post("/lecciones/{leccion_id}/ejemplo-visto")
def ejemplo_visto(leccion_id: str, u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    return servicio.marcar_ejemplo_visto(db, u, leccion_id)


@router.post("/mascota/cuidar")
def cuidar(datos: esquemas.CuidadoEntrada, u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    return servicio.cuidar(db, u, datos.accion)


@router.post("/mascota/despertar")
def despertar(u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    return servicio.despertar(db, u)


@router.put("/mascota/traje")
def vestir(datos: esquemas.TrajeEntrada, u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    """Viste al ajolote con uno de sus trajes (traje = null se lo quita)."""
    return servicio.vestir(db, u, datos.traje)


@router.patch("/mascota")
def renombrar(datos: esquemas.MascotaCambio, u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    _, m = servicio.estado_de(db, u)
    m.nombre = datos.nombre.strip()
    db.commit()
    return servicio.resumen(db, u)
