"""Aulas tipo Classroom: el profesor crea el aula (nombre, nivel y módulos del año) y comparte un código.

El alumno se une con el código. Si el aula pide aprobación, queda "pendiente" hasta que el profesor
lo acepte (evita que un código filtrado meta a desconocidos); si no, entra directo.
Autorización por recurso: un profesor solo ve SUS aulas; un alumno solo las aulas donde está ACTIVO.
Panel del profesor sin rankings: lista alfabética y errores más comunes del grupo.
"""
from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import diagnostico, esquemas, servicio
from ..db import get_db
from ..modelos import Asignacion, Aula, AulaAlumno, AulaModulo, Diagnostico, Ejercicio, Intento, Leccion, Progreso, Unidad, Usuario
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


def _aula_de_alumno(db: Session, aula_id: int, alumno: Usuario) -> Aula:
    aula = db.get(Aula, aula_id)
    rel = db.get(AulaAlumno, (aula_id, alumno.id))
    if not aula or not rel or rel.estado != "activo":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No encontramos esa aula.")
    return aula


def _codigo_unico(db: Session) -> str:
    for _ in range(20):
        c = codigo_aula()
        if not db.scalar(select(Aula.id).where(Aula.codigo == c)):
            return c
    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "No se pudo generar un código. Intenta de nuevo.")


def activos(aula: Aula) -> list[Usuario]:
    return sorted((r.alumno for r in aula.alumnos if r.estado == "activo"), key=lambda a: a.apodo.lower())


def _modulos(db: Session, aula: Aula) -> list[dict]:
    salida = []
    for m in aula.modulos:
        u = db.get(Unidad, m.unidad_id)
        if u:
            salida.append({"id": u.id, "nombre": u.nombre, "proximamente": u.proximamente or not u.lecciones})
    return salida


def _salida(db: Session, aula: Aula, para_profesor: bool, estado: str | None = None) -> dict:
    datos = {
        "id": aula.id, "nombre": aula.nombre, "nivel": aula.nivel,
        "profesor": db.get(Usuario, aula.profesor_id).apodo,
        "modulos": _modulos(db, aula),
        "asignaciones": [
            {"id": a.id, "leccion_id": a.leccion_id, "leccion": db.get(Leccion, a.leccion_id).nombre,
             "fecha_limite": a.fecha_limite.isoformat() if a.fecha_limite else None}
            for a in aula.asignaciones
        ],
    }
    if para_profesor:
        datos["codigo"] = aula.codigo
        datos["requiere_aprobacion"] = aula.requiere_aprobacion
        datos["alumnos"] = [{"id": a.id, "apodo": a.apodo, "usuario": a.usuario} for a in activos(aula)]
        datos["pendientes"] = sorted(
            ({"id": r.alumno.id, "apodo": r.alumno.apodo, "usuario": r.alumno.usuario, "solicitado": r.unido.isoformat()}
             for r in aula.alumnos if r.estado == "pendiente"),
            key=lambda x: x["solicitado"],
        )
    else:
        datos["estado"] = estado or "activo"
    return datos


def _poner_modulos(db: Session, aula: Aula, ids: list[str]) -> None:
    vistos: list[str] = []
    for i in ids:
        if i not in vistos:
            if not db.get(Unidad, i):
                raise HTTPException(422, f"El módulo {i} no existe.")
            vistos.append(i)
    aula.modulos = [AulaModulo(unidad_id=i, orden=n) for n, i in enumerate(vistos)]


def _porcentaje_modulo(db: Session, alumno_ids: list[int], unidad_id: str) -> tuple[int, dict[int, int]]:
    """Total de retos del módulo y cuántos completó cada alumno."""
    ejercicios = db.scalars(select(Ejercicio.id).join(Leccion).where(Leccion.unidad_id == unidad_id)).all()
    if not ejercicios or not alumno_ids:
        return len(ejercicios), {}
    filas = db.execute(
        select(Progreso.alumno_id, func.count()).where(Progreso.alumno_id.in_(alumno_ids), Progreso.ejercicio_id.in_(ejercicios))
        .group_by(Progreso.alumno_id)
    ).all()
    return len(ejercicios), dict(filas)


# ---------------- Profesor ----------------

@router.post("", status_code=status.HTTP_201_CREATED)
def crear(datos: esquemas.AulaEntrada, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> dict:
    aula = Aula(nombre=datos.nombre.strip(), codigo=_codigo_unico(db), profesor_id=profe.id,
                nivel=(datos.nivel or "").strip() or None, requiere_aprobacion=datos.requiere_aprobacion)
    _poner_modulos(db, aula, datos.modulos)
    db.add(aula)
    db.commit()
    return _salida(db, aula, True)


@router.get("")
def listar(u: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)) -> dict:
    if u.rol in ("profesor", "admin"):
        aulas = db.scalars(select(Aula).where(Aula.profesor_id == u.id).order_by(Aula.creado)).all()
        return {"aulas": [_salida(db, a, True) for a in aulas]}
    filas = db.execute(select(Aula, AulaAlumno.estado).join(AulaAlumno).where(AulaAlumno.alumno_id == u.id).order_by(Aula.creado)).all()
    # Si está pendiente solo ve el nombre: nada del contenido del aula hasta que lo acepten.
    return {"aulas": [_salida(db, a, False, e) if e == "activo"
                      else {"id": a.id, "nombre": a.nombre, "profesor": db.get(Usuario, a.profesor_id).apodo, "estado": e}
                      for a, e in filas]}


@router.get("/{aula_id}")
def ver(aula_id: int, u: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)) -> dict:
    if u.rol in ("profesor", "admin"):
        return _salida(db, _aula_de_profesor(db, aula_id, u), True)
    return _salida(db, _aula_de_alumno(db, aula_id, u), False)


@router.patch("/{aula_id}")
def editar(aula_id: int, datos: esquemas.AulaEditar, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> dict:
    aula = _aula_de_profesor(db, aula_id, profe)
    if datos.nombre is not None:
        aula.nombre = datos.nombre.strip()
    if datos.nivel is not None:
        aula.nivel = datos.nivel.strip() or None
    if datos.modulos is not None:
        _poner_modulos(db, aula, datos.modulos)
    if datos.requiere_aprobacion is not None:
        aula.requiere_aprobacion = datos.requiere_aprobacion
    db.commit()
    db.refresh(aula)
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
    alumnos = activos(aula)
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
    rel = db.get(AulaAlumno, (aula_id, alumno_id))
    if not rel or rel.estado != "activo":
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


@router.post("/{aula_id}/solicitudes/{alumno_id}/aprobar")
def aprobar(aula_id: int, alumno_id: int, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> dict:
    aula = _aula_de_profesor(db, aula_id, profe)
    rel = db.get(AulaAlumno, (aula_id, alumno_id))
    if not rel or rel.estado != "pendiente":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No hay una solicitud de ese alumno.")
    rel.estado = "activo"
    db.commit()
    db.refresh(aula)
    return _salida(db, aula, True)


@router.delete("/{aula_id}/solicitudes/{alumno_id}")
def rechazar(aula_id: int, alumno_id: int, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> dict:
    aula = _aula_de_profesor(db, aula_id, profe)
    rel = db.get(AulaAlumno, (aula_id, alumno_id))
    if not rel or rel.estado != "pendiente":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No hay una solicitud de ese alumno.")
    db.delete(rel)
    db.commit()
    db.refresh(aula)
    return _salida(db, aula, True)


@router.get("/{aula_id}/diagnostico")
def diagnostico_grupo(aula_id: int, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> dict:
    """Resultados del examen diagnóstico: por habilidad (cuántos la dominan) y por alumno."""
    aula = _aula_de_profesor(db, aula_id, profe)
    alumnos = activos(aula)
    por_alumno, conteo = [], Counter()
    hechos = 0
    for a in alumnos:
        d = db.get(Diagnostico, a.id)
        if d:
            hechos += 1
            conteo.update(h for h, ok in d.resultados.items() if ok)
        por_alumno.append({"id": a.id, "apodo": a.apodo, "usuario": a.usuario, "hecho": d is not None,
                           "aciertos": d.aciertos if d else None, "total": d.total if d else None,
                           "habilidades": diagnostico.resumen(d.resultados) if d else []})
    habilidades = [{"habilidad": p["habilidad"], "nombre": p["nombre"], "logrado": conteo[p["habilidad"]], "de": hechos}
                   for p in diagnostico.PREGUNTAS]
    return {"aula": {"id": aula.id, "nombre": aula.nombre}, "hechos": hechos, "alumnos_total": len(alumnos),
            "habilidades": habilidades, "alumnos": por_alumno}


# ---------------- Alumno ----------------

@router.post("/unirse")
def unirse(datos: esquemas.UnirseAula, alumno: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    limpio = "".join(ch for ch in datos.codigo.upper() if ch.isalnum())
    codigo = f"{limpio[:3]}-{limpio[3:6]}"
    aula = db.scalar(select(Aula).where(Aula.codigo == codigo))
    if not aula:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ese código no existe. Revísalo con tu maestra o maestro.")
    rel = db.get(AulaAlumno, (aula.id, alumno.id))
    if not rel:
        rel = AulaAlumno(aula_id=aula.id, alumno_id=alumno.id, estado="pendiente" if aula.requiere_aprobacion else "activo")
        db.add(rel)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            rel = db.get(AulaAlumno, (aula.id, alumno.id))
    if rel.estado != "activo":
        return {"id": aula.id, "nombre": aula.nombre, "profesor": db.get(Usuario, aula.profesor_id).apodo, "estado": rel.estado}
    return _salida(db, aula, False)


@router.get("/{aula_id}/curso")
def curso(aula_id: int, alumno: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    """Vista tipo Classroom del alumno: módulos del aula con SU avance y el avance promedio del grupo (sin nombres)."""
    aula = _aula_de_alumno(db, aula_id, alumno)
    companeros = [a.id for a in activos(aula)]
    modulos = []
    for m in _modulos(db, aula):
        total, hechos = _porcentaje_modulo(db, companeros, m["id"])
        u = db.get(Unidad, m["id"])
        mio = hechos.get(alumno.id, 0)
        grupo = round(sum(100 * hechos.get(i, 0) / total for i in companeros) / len(companeros)) if total and companeros else 0
        lecciones = [{"id": l.id, "nombre": l.nombre, "concepto": l.concepto, "retos": len(l.ejercicios)} for l in u.lecciones]
        modulos.append({**m, "total_retos": total, "mis_retos": mio, "mi_porcentaje": round(100 * mio / total) if total else 0,
                        "grupo_porcentaje": grupo, "lecciones": lecciones})
    return {**_salida(db, aula, False), "companeros": len(companeros), "modulos": modulos}
