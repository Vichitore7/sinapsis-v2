"""Examen diagnóstico del alumno (se hace solo, al entrar por primera vez). Las preguntas dependen de su grado."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import diagnostico, esquemas
from ..db import get_db
from ..modelos import Diagnostico, Usuario
from ..seguridad import solo_alumno

router = APIRouter(prefix="/diagnostico", tags=["Diagnóstico"])


def _salida(alumno: Usuario, d: Diagnostico | None) -> dict:
    if not d:
        return {"hecho": False, "grado": alumno.grado, "grado_nombre": diagnostico.nombre_grado(alumno.grado),
                "preguntas": diagnostico.publicas(alumno.grado)}
    return {"hecho": True, "grado": d.grado, "grado_nombre": diagnostico.nombre_grado(d.grado),
            "aciertos": d.aciertos, "total": d.total, "habilidades": diagnostico.resumen(d.resultados)}


@router.get("")
def ver(alumno: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    return _salida(alumno, db.get(Diagnostico, alumno.id))


@router.post("")
def responder(datos: esquemas.DiagnosticoEntrada, alumno: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    """Guarda el resultado. Se puede repetir: el último reemplaza al anterior."""
    resultados = diagnostico.calificar(datos.respuestas, alumno.grado)
    d = db.get(Diagnostico, alumno.id) or Diagnostico(alumno_id=alumno.id)
    d.resultados, d.aciertos, d.total = resultados, sum(resultados.values()), len(resultados)
    d.grado = alumno.grado if alumno.grado in diagnostico.POR_GRADO else None
    db.merge(d)
    db.commit()
    return _salida(alumno, db.get(Diagnostico, alumno.id))
