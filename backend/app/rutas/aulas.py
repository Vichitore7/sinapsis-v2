"""Aulas tipo Classroom: el profesor crea el aula y comparte un código; el alumno se une con él.

Autorización por recurso: un profesor solo ve SUS aulas; un alumno solo las aulas donde está.
Panel del profesor sin rankings: lista alfabética y errores más comunes del grupo.
"""
from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import esquemas, servicio
from ..db import get_db
from ..modelos import Asignacion, Aula, AulaAlumno, Ejercicio, Intento, Leccion, Usuario
from ..seguridad import codigo_aula, solo_alumno, solo_profesor, usuario_actual

router = APIRouter(prefix="/aulas", tags=["Aulas"])

ERRORES = {
    "sumo": {"texto": "Sumó en vez de multiplicar",
             "refuerzo": "Repasa con monedas por qué {a} × {b} es juntar {a} montones de {b}. Usa bolsitas con el grupo antes del siguiente reto."},
    "calculo": {"texto": "Error de cálculo",
                "refuerzo": "Practiquen contar de {b} en {b} en voz alta, con las monedas en el pizarrón."},
}


def _aula_de_profesor(db: Session, aula_id: int, profe: Usuario) -> Aula:
    aula = db.get(Aula, aula_id)
    # 404 también si es de otro profesor: no revelamos que existe.
    if not aula or (aula.profesor_id != profe.id and profe.rol != "admin"):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No encontramos esa aula.")
    return aula


def _codigo_unico(db: Session) -> str:
    for _ in range(20):
        c = codigo_aula()
        if not db.scalar(select(Aula.id).where(Aula.codigo == c)):
            return c
    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "No se pudo generar un código. Intenta de nuevo.")


def _salida(db: Session, aula: Aula, para_profesor: bool) -> dict:
    datos = {
        "id": aula.id, "nombre": aula.nombre,
        "profesor": db.get(Usuario, aula.profesor_id).apodo,
        "asignaciones": [
            {"id": a.id, "leccion_id": a.leccion_id, "leccion": db.get(Leccion, a.leccion_id).nombre,
             "fecha_limite": a.fecha_limite.isoformat() if a.fecha_limite else None}
            for a in aula.asignaciones
        ],
    }
    if para_profesor:
        datos["codigo"] = aula.codigo
        datos["alumnos"] = sorted(
            ({"id": r.alumno.id, "apodo": r.alumno.apodo, "usuario": r.alumno.usuario} for r in aula.alumnos),
            key=lambda x: x["apodo"].lower(),
        )
    return datos


# ---------------- Profesor ----------------

@router.post("", status_code=status.HTTP_201_CREATED)
def crear(datos: esquemas.AulaEntrada, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> dict:
    aula = Aula(nombre=datos.nombre.strip(), codigo=_codigo_unico(db), profesor_id=profe.id)
    db.add(aula)
    db.commit()
    return _salida(db, aula, True)


@router.get("")
def listar(u: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)) -> dict:
    if u.rol in ("profesor", "admin"):
        aulas = db.scalars(select(Aula).where(Aula.profesor_id == u.id).order_by(Aula.creado)).all()
        return {"aulas": [_salida(db, a, True) for a in aulas]}
    aulas = db.scalars(select(Aula).join(AulaAlumno).where(AulaAlumno.alumno_id == u.id).order_by(Aula.creado)).all()
    return {"aulas": [_salida(db, a, False) for a in aulas]}


@router.get("/{aula_id}")
def ver(aula_id: int, u: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)) -> dict:
    if u.rol in ("profesor", "admin"):
        return _salida(db, _aula_de_profesor(db, aula_id, u), True)
    aula = db.get(Aula, aula_id)
    if not aula or not db.get(AulaAlumno, (aula_id, u.id)):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No encontramos esa aula.")
    return _salida(db, aula, False)


@router.patch("/{aula_id}")
def editar(aula_id: int, datos: esquemas.AulaEntrada, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> dict:
    aula = _aula_de_profesor(db, aula_id, profe)
    aula.nombre = datos.nombre.strip()
    db.commit()
    return _salida(db, aula, True)


@router.delete("/{aula_id}", status_code=status.HTTP_204_NO_CONTENT)
def borrar(aula_id: int, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> None:
    db.delete(_aula_de_profesor(db, aula_id, profe))
    db.commit()


@router.post("/{aula_id}/regenerar-codigo")
def regenerar(aula_id: int, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> dict:
    aula = _aula_de_profesor(db, aula_id, profe)
    aula.codigo = _codigo_unico(db)
    db.commit()
    return _salida(db, aula, True)


@router.delete("/{aula_id}/alumnos/{alumno_id}", status_code=status.HTTP_204_NO_CONTENT)
def expulsar(aula_id: int, alumno_id: int, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> None:
    _aula_de_profesor(db, aula_id, profe)
    rel = db.get(AulaAlumno, (aula_id, alumno_id))
    if not rel:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ese alumno no está en el aula.")
    db.delete(rel)
    db.commit()


@router.post("/{aula_id}/asignaciones", status_code=status.HTTP_201_CREATED)
def asignar(aula_id: int, datos: esquemas.AsignacionEntrada, profe: Usuario = Depends(solo_profesor),
            db: Session = Depends(get_db)) -> dict:
    aula = _aula_de_profesor(db, aula_id, profe)
    if not db.get(Leccion, datos.leccion_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ese mundo no existe.")
    db.add(Asignacion(aula_id=aula.id, leccion_id=datos.leccion_id, fecha_limite=datos.fecha_limite))
    db.commit()
    db.refresh(aula)
    return _salida(db, aula, True)


@router.delete("/{aula_id}/asignaciones/{asignacion_id}", status_code=status.HTTP_204_NO_CONTENT)
def quitar_asignacion(aula_id: int, asignacion_id: int, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> None:
    _aula_de_profesor(db, aula_id, profe)
    a = db.get(Asignacion, asignacion_id)
    if not a or a.aula_id != aula_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No encontramos esa tarea.")
    db.delete(a)
    db.commit()


@router.get("/{aula_id}/panel")
def panel(aula_id: int, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> dict:
    """Lo que el profesor necesita ver en 5 segundos: quién va atrasado y qué error es el más común."""
    aula = _aula_de_profesor(db, aula_id, profe)
    alumnos = sorted((r.alumno for r in aula.alumnos), key=lambda a: a.apodo.lower())
    ids = [a.id for a in alumnos]
    total_retos = db.scalar(select(func.count()).select_from(Ejercicio)) or 0
    progreso = [servicio.progreso_alumno(db, a, total_retos) for a in alumnos]

    errores = Counter()
    por_mundo = Counter()
    alumnos_por_error: dict[str, set[int]] = {}
    if ids:
        filas = db.execute(
            select(Intento.alumno_id, Intento.tipo_error, Ejercicio.leccion_id)
            .join(Ejercicio, Ejercicio.id == Intento.ejercicio_id)
            .where(Intento.alumno_id.in_(ids), Intento.correcto.is_(False))
        ).all()
        for alumno_id, tipo, leccion_id in filas:
            if tipo:
                errores[tipo] += 1
                alumnos_por_error.setdefault(tipo, set()).add(alumno_id)
            por_mundo[leccion_id] += 1

    errores_comunes = [
        {"id": t, "texto": ERRORES.get(t, {}).get("texto", t), "veces": n, "alumnos": len(alumnos_por_error.get(t, ()))}
        for t, n in errores.most_common()
    ]
    refuerzo = None
    if errores_comunes:
        ej = db.scalars(select(Ejercicio).order_by(Ejercicio.leccion_id, Ejercicio.orden)).first()
        plantilla = ERRORES.get(errores_comunes[0]["id"], {}).get("refuerzo")
        if plantilla and ej:
            refuerzo = plantilla.format(a=ej.datos["a"], b=ej.datos["b"])

    # Necesitan apoyo: la mitad o más de sus intentos fallaron, o no han avanzado. Orden alfabético, nunca por resultado.
    apoyo = [{"id": p["id"], "apodo": p["apodo"]} for p in progreso
             if (p["intentos"] and p["fallos"] * 2 >= p["intentos"]) or p["retos_completados"] == 0]

    return {
        "aula": {"id": aula.id, "nombre": aula.nombre, "codigo": aula.codigo, "alumnos": len(alumnos)},
        "alumnos": progreso,
        "errores_comunes": errores_comunes,
        "mundos_con_mas_errores": [
            {"leccion_id": l, "mundo": db.get(Leccion, l).nombre, "fallos": n} for l, n in por_mundo.most_common(3)
        ],
        "que_reforzar": refuerzo,
        "necesitan_apoyo": apoyo,
    }


@router.get("/{aula_id}/alumnos/{alumno_id}")
def detalle_alumno(aula_id: int, alumno_id: int, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> dict:
    _aula_de_profesor(db, aula_id, profe)
    if not db.get(AulaAlumno, (aula_id, alumno_id)):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ese alumno no está en el aula.")
    alumno = db.get(Usuario, alumno_id)
    total = db.scalar(select(func.count()).select_from(Ejercicio)) or 0
    intentos = db.scalars(select(Intento).where(Intento.alumno_id == alumno_id).order_by(Intento.creado.desc()).limit(30)).all()
    return {
        "progreso": servicio.progreso_alumno(db, alumno, total),
        "intentos_recientes": [
            {"ejercicio_id": i.ejercicio_id, "respuesta": i.respuesta, "correcto": i.correcto, "tipo_error": i.tipo_error,
             "pistas_usadas": i.pistas_usadas, "tiempo_ms": i.tiempo_ms, "fecha": i.creado.isoformat()}
            for i in intentos
        ],
    }


# ---------------- Alumno ----------------

@router.post("/unirse")
def unirse(datos: esquemas.UnirseAula, alumno: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    limpio = "".join(ch for ch in datos.codigo.upper() if ch.isalnum())
    codigo = f"{limpio[:3]}-{limpio[3:6]}"
    aula = db.scalar(select(Aula).where(Aula.codigo == codigo))
    if not aula:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ese código no existe. Revísalo con tu maestra o maestro.")
    if not db.get(AulaAlumno, (aula.id, alumno.id)):
        db.add(AulaAlumno(aula_id=aula.id, alumno_id=alumno.id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
    return _salida(db, aula, False)
