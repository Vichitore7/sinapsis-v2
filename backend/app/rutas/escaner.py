"""Escáner de cuaderno: Mix lee la foto de una operación."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from .. import aprendizaje, lector, operaciones
from ..db import get_db
from ..modelos import Usuario
from ..seguridad import solo_alumno

router = APIRouter(tags=["Escáner"])


class FotoEntrada(BaseModel):
    # dataURL de la app (JPEG de menos de 300 KB). Nunca se guarda: se lee y se descarta.
    foto: str = Field(min_length=30, max_length=900_000)


@router.post("/escaner/leer")
def leer_foto(datos: FotoEntrada, u: Usuario = Depends(solo_alumno)) -> dict:
    """Lee la operación de la foto. Regresa {lectura: {a, op, b, c, dudoso} | null, origen}.

    El alumno siempre confirma o corrige la lectura antes del diagnóstico. Si `lectura` es null, la escribe a mano.
    """
    try:
        return lector.leer(u.id, datos.foto)
    except lector.FotoInvalida as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(e)) from e


class ResultadoEntrada(BaseModel):
    """La operación que el alumno confirmó en el escáner (números como texto: "17", "3/4")."""
    a: int | str
    op: str
    b: int | str
    c: int | str | None = None
    residuo: int | str | None = None


@router.post("/escaner/resultado")
def registrar_resultado(datos: ResultadoEntrada, u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    """Guarda en la memoria de aprendizaje una operación confirmada. Regresa {concepto, estado}.

    El servidor la vuelve a revisar (no confía en el diagnóstico del navegador). Solo guarda conteos, no la foto.
    """
    op = operaciones.validar(datos.model_dump())
    if op is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "No puedo revisar esa operación.")
    estado = aprendizaje.resultado_escaneo(db, u.id, op)
    db.commit()
    return {"concepto": aprendizaje.concepto_de_operacion(op)[0], "estado": estado}


@router.get("/aprendizaje")
def mi_aprendizaje(u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    """La memoria de aprendizaje del alumno: por concepto, su estado y lo que la app ha observado."""
    from sqlalchemy import select
    filas = db.scalars(select(aprendizaje.Aprendizaje).where(aprendizaje.Aprendizaje.alumno_id == u.id)
                       .order_by(aprendizaje.Aprendizaje.actualizado.desc())).all()
    return {"conceptos": [{
        "concepto": f.concepto, "nombre": f.nombre, "estado": aprendizaje.estado(f), "intentos": f.intentos,
        "sin_ayuda": len(f.resueltos_solo or []), "con_ayuda": f.aciertos_ayuda, "errores": f.errores,
        "tipos_error": f.tipos_error, "representaciones": f.representaciones, "ayudas_tutor": f.ayudas_tutor,
    } for f in filas]}
