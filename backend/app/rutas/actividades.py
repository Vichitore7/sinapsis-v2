"""Actividades del aula (app/actividades.py): el profesor deja problemas y material; el alumno los resuelve en su
cuaderno, los escanea (Kiko los revisa) y entrega. El profesor ve qué domina, comprende o se le dificulta a cada quien."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .. import actividades as act
from ..db import get_db
from ..modelos import ahora, Usuario
from ..seguridad import solo_alumno, solo_profesor, usuario_actual
from .aulas import _aula_de_alumno, _aula_de_profesor, activos
from .tutor import Operacion

router = APIRouter(tags=["Actividades"])


class ProblemaEntrada(BaseModel):
    a: int | str
    op: str = Field(max_length=3)
    b: int | str
    enunciado: str = Field(default="", max_length=300)


class ActividadEntrada(BaseModel):
    titulo: str = Field(min_length=1, max_length=80)
    modulo: str | None = Field(default=None, max_length=40)  # la tarea se organiza por módulo del aula
    instrucciones: str = Field(default="", max_length=2000)
    material: str = Field(default="", max_length=6000)
    fecha_limite: date | None = None
    problemas: list[ProblemaEntrada] = Field(min_length=1, max_length=30)


def _actividad(db: Session, actividad_id: int, aula_id: int | None = None) -> act.Actividad:
    a = db.get(act.Actividad, actividad_id)
    if a is None or (aula_id is not None and a.aula_id != aula_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No encontramos esa actividad.")
    return a


def _actividad_del_alumno(db: Session, actividad_id: int, alumno: Usuario) -> act.Actividad:
    a = _actividad(db, actividad_id)
    _aula_de_alumno(db, a.aula_id, alumno)  # 404 si no es de su clase
    return a


# ---------------- Profesor ----------------

@router.get("/actividades/banco")
def banco(_: Usuario = Depends(solo_profesor)) -> dict:
    """Problemas de prueba por grado (sin resultados), cada uno con su módulo."""
    return {"grados": act.banco(), "modulos": [{"id": k, "nombre": v} for k, v in act.MODULOS.items()]}


@router.post("/aulas/{aula_id}/actividades", status_code=status.HTTP_201_CREATED)
def crear(aula_id: int, datos: ActividadEntrada, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> dict:
    aula = _aula_de_profesor(db, aula_id, profe)
    if datos.modulo and datos.modulo not in act.MODULOS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Ese módulo no existe.")
    try:
        problemas = act.normalizar_problemas([p.model_dump() for p in datos.problemas], datos.modulo)
    except ValueError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(e)) from e
    a = act.Actividad(aula_id=aula.id, titulo=datos.titulo.strip(), modulo=datos.modulo, instrucciones=datos.instrucciones.strip(),
                      material=datos.material.strip(), fecha_limite=datos.fecha_limite, problemas=problemas)
    db.add(a)
    db.commit()
    return {"id": a.id}


@router.delete("/aulas/{aula_id}/actividades/{actividad_id}", status_code=status.HTTP_204_NO_CONTENT)
def borrar(aula_id: int, actividad_id: int, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> None:
    _aula_de_profesor(db, aula_id, profe)
    db.delete(_actividad(db, actividad_id, aula_id))
    db.commit()


@router.get("/aulas/{aula_id}/actividades")
def listar(aula_id: int, u: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)) -> dict:
    """Profesor: sus actividades con cuántos entregaron. Alumno: las de su clase con su avance."""
    if u.rol == "alumno":
        _aula_de_alumno(db, aula_id, u)
        return {"actividades": [act.para_alumno(a, db.get(act.AvanceActividad, (u.id, a.id)))
                                for a in act.actividades_de_aula(db, aula_id)]}
    aula = _aula_de_profesor(db, aula_id, u)
    alumnos = activos(aula)
    salida = []
    for a in act.actividades_de_aula(db, aula_id):
        avances = [db.get(act.AvanceActividad, (al.id, a.id)) for al in alumnos]
        salida.append({"id": a.id, "titulo": a.titulo, "problemas": len(a.problemas), "modulo": a.modulo,
                       "modulo_nombre": act.MODULOS.get(a.modulo or "", "Otras actividades"),
                       "fecha_limite": a.fecha_limite.isoformat() if a.fecha_limite else None,
                       "entregaron": sum(1 for av in avances if av and av.entregada), "alumnos": len(alumnos)})
    return {"actividades": salida}


@router.get("/aulas/{aula_id}/actividades/{actividad_id}")
def ver(aula_id: int, actividad_id: int, u: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)) -> dict:
    """Alumno: la actividad con su avance (sin resultados). Profesor: la actividad y lo que contestó cada alumno."""
    if u.rol == "alumno":
        _aula_de_alumno(db, aula_id, u)
        a = _actividad(db, actividad_id, aula_id)
        return act.para_alumno(a, db.get(act.AvanceActividad, (u.id, a.id)))
    aula = _aula_de_profesor(db, aula_id, u)
    a = _actividad(db, actividad_id, aula_id)
    entregas = []
    for al in activos(aula):
        av = db.get(act.AvanceActividad, (al.id, a.id))
        entregas.append({"alumno": {"id": al.id, "apodo": al.apodo, "usuario": al.usuario},
                         "entregada": bool(av and av.entregada), "respuestas": act.respuestas_de(a, av)})
    return {**act.para_alumno(a, None), "entregas": entregas}


@router.get("/aulas/{aula_id}/comprension")
def comprension_grupo(aula_id: int, profe: Usuario = Depends(solo_profesor), db: Session = Depends(get_db)) -> dict:
    """Para la gráfica: por alumno y por tema, si se le dificulta, lo comprende o lo domina (con lo que resolvió
    en las actividades)."""
    aula = _aula_de_profesor(db, aula_id, profe)
    actividades = act.actividades_de_aula(db, aula_id)
    alumnos, temas = [], {}
    for al in activos(aula):
        mios = act.comprension(db, actividades, al.id)
        for t in mios:
            temas[t["concepto"]] = t["nombre"]
        alumnos.append({"id": al.id, "apodo": al.apodo, "usuario": al.usuario,
                        "temas": {t["concepto"]: {"categoria": t["categoria"], "frase": t["frase"]} for t in mios},
                        "resumen": act.resumen_alumno(db, actividades, al.id)})
    orden = list(act.MODULOS)  # en el orden de los módulos: suma y resta, multiplicación, división, fracciones
    errores: dict[str, dict] = {}
    for al in alumnos:  # errores más comunes del grupo (cuántos alumnos y cuántas veces)
        for e in al["resumen"]["errores"]:
            g = errores.setdefault(e["id"], {"texto": e["texto"], "alumnos": 0, "veces": 0})
            g["alumnos"] += 1
            g["veces"] += e["veces"]
    comunes = sorted(errores.values(), key=lambda g: (-g["alumnos"], -g["veces"]))[:3]
    return {"errores_comunes": comunes, "temas": [{"concepto": c, "nombre": n} for c, n in
                      sorted(temas.items(), key=lambda x: (orden.index(x[0]) if x[0] in orden else len(orden), x[1]))],
            "alumnos": alumnos}


@router.get("/aulas/{aula_id}/alumnos/{alumno_id}/comprension")
def comprension_alumno(aula_id: int, alumno_id: int, profe: Usuario = Depends(solo_profesor),
                       db: Session = Depends(get_db)) -> dict:
    """"Tutor sugiere": qué domina, comprende o se le dificulta, qué le ha funcionado y sus respuestas por problema."""
    aula = _aula_de_profesor(db, aula_id, profe)
    if alumno_id not in {al.id for al in activos(aula)}:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ese alumno no está en esta clase.")
    actividades = act.actividades_de_aula(db, aula_id)
    return {
        "temas": act.comprension(db, actividades, alumno_id),
        "actividades": [{"id": a.id, "titulo": a.titulo,
                         "entregada": bool((av := db.get(act.AvanceActividad, (alumno_id, a.id))) and av.entregada),
                         "respuestas": act.respuestas_de(a, av)} for a in actividades],
    }


# ---------------- Alumno ----------------

@router.post("/actividades/{actividad_id}/problemas/{problema_id}/escaneo")
def escaneo(actividad_id: int, problema_id: str, datos: Operacion, alumno: Usuario = Depends(solo_alumno),
            db: Session = Depends(get_db)) -> dict:
    """Lo que escaneó de su cuaderno para este problema: Kiko lo revisa (sin decirle el resultado)."""
    a = _actividad_del_alumno(db, actividad_id, alumno)
    try:
        salida = act.registrar_escaneo(db, alumno.id, a, problema_id, datos.normalizada())
    except LookupError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e)) from e
    db.commit()
    return salida


@router.post("/actividades/{actividad_id}/problemas/{problema_id}/resuelto-en-chat")
def resuelto_en_chat(actividad_id: int, problema_id: str, alumno: Usuario = Depends(solo_alumno),
                     db: Session = Depends(get_db)) -> dict:
    a = _actividad_del_alumno(db, actividad_id, alumno)
    try:
        salida = act.resuelto_en_chat(db, alumno.id, a, problema_id)
    except LookupError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e)) from e
    db.commit()
    return salida


@router.post("/actividades/{actividad_id}/entregar")
def entregar(actividad_id: int, alumno: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)) -> dict:
    a = _actividad_del_alumno(db, actividad_id, alumno)
    av = db.get(act.AvanceActividad, (alumno.id, a.id))
    if not act.puede_entregar(a, av):
        raise HTTPException(status.HTTP_409_CONFLICT, "Antes de entregar, escanea cada problema para que Kiko lo revise.")
    av.entregada = av.entregada or ahora()
    db.commit()
    return act.para_alumno(a, av)
