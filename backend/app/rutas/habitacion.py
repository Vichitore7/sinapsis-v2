"""Habitación: catálogo de servidor, inventario, guardado por alumno."""
import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import servicio
from ..db import get_db, bloquear_escritura
from ..modelos import Ejercicio, Habitacion, StickerAdquirido, Usuario
from ..seguridad import solo_alumno

router = APIRouter(prefix="/habitacion", tags=["Habitación"])
CATALOGO = json.loads(Path(__file__).resolve().parents[1].joinpath("catalogo_habitacion.json").read_text(encoding="utf-8"))
STICKERS = {s["id"]: s for s in CATALOGO["stickers"]}
INICIALES = [
    {"stickerId": "cama", "x": 295, "y": 454},
    {"stickerId": "tapete", "x": 496, "y": 570},
    {"stickerId": "alga", "x": 735, "y": 492},
]


class Entrada(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Objeto(Entrada):
    stickerId: str = Field(max_length=30)
    x: int = Field(ge=0, le=960, strict=True)
    y: int = Field(ge=0, le=760, strict=True)


class Guardado(Entrada):
    revision: int = Field(ge=0, strict=True)
    objetos: list[Objeto] = Field(max_length=len(STICKERS))


class Compra(Entrada):
    stickerId: str = Field(max_length=30)


def dentro(x, y, poligono):
    # Todos los polígonos del escenario son convexos; permite el borde.
    signos = []
    for a, b in zip(poligono, poligono[1:] + poligono[:1]):
        signos.append((b[0]-a[0])*(y-a[1]) - (b[1]-a[1])*(x-a[0]))
    return all(s >= 0 for s in signos) or all(s <= 0 for s in signos)


def inicializar(db, u):
    h = db.get(Habitacion, u.id)
    if h is None:
        h = Habitacion(alumno_id=u.id, objetos=INICIALES, revision=0)
        db.add(h)
        for s in STICKERS.values():
            if s["precio"] == 0:
                db.add(StickerAdquirido(alumno_id=u.id, sticker_id=s["id"], precio=0))
        db.flush()
    return h


def inventario(db, u):
    return list(db.scalars(select(StickerAdquirido.sticker_id).where(StickerAdquirido.alumno_id == u.id).order_by(StickerAdquirido.sticker_id)))


def progreso_trajineras(db, u):
    """Una trajinera se supera al resolver todos sus retos, no al abrirla ni al ganar XP."""
    completados = servicio.completados_de(db, u.id)
    grupos = {}
    retos = db.scalars(select(Ejercicio).where(Ejercicio.leccion_id == CATALOGO["mapaTienda"]["id"]).order_by(Ejercicio.orden))
    for reto in retos:
        numero = reto.datos.get("nivel")
        if not isinstance(numero, int) or numero < 1:
            continue
        grupo = grupos.setdefault(numero, {"numero": numero, "titulo": reto.datos.get("nivel_titulo", ""), "resueltos": 0, "total": 0})
        grupo["total"] += 1
        grupo["resueltos"] += int(reto.id in completados)
    return [{**g, "superada": g["resueltos"] == g["total"]} for g in sorted(grupos.values(), key=lambda g: g["numero"])]


def respuesta(db, u, h):
    salida = {"objetos": h.objetos, "revision": h.revision, "inventario": inventario(db, u), "trajineras": progreso_trajineras(db, u)}
    _, m = servicio.estado_de(db, u)
    if m.dormido and not any(o["stickerId"] == "cama" for o in h.objetos):
        m.dormido = False
    salida["estado"] = servicio.resumen(db, u)
    return salida


@router.get("")
def obtener(u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)):
    bloquear_escritura(db)
    h = inicializar(db, u)
    return {**respuesta(db, u, h), "catalogo": CATALOGO}


@router.put("")
def guardar(datos: Guardado, u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)):
    bloquear_escritura(db)
    h = inicializar(db, u)
    if h.revision != datos.revision:
        raise HTTPException(409, "La habitación cambió en otro dispositivo. Recarga antes de editar.")
    propios = set(inventario(db, u))
    vistos = set()
    for obj in datos.objetos:
        s = STICKERS.get(obj.stickerId)
        if not s or obj.stickerId not in propios or obj.stickerId in vistos:
            raise HTTPException(422, "Solo puedes colocar una copia de cada sticker de tu inventario.")
        if not dentro(obj.x, obj.y, CATALOGO["escenario"][s["superficie"]]):
            raise HTTPException(422, "Coloca el sticker en su superficie permitida.")
        vistos.add(obj.stickerId)
    h.objetos = [obj.model_dump() for obj in datos.objetos]
    h.revision += 1
    return respuesta(db, u, h)


@router.post("/compras")
def comprar(datos: Compra, u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)):
    bloquear_escritura(db)
    h = inicializar(db, u)
    s = STICKERS.get(datos.stickerId)
    if not s:
        raise HTTPException(404, "Ese sticker no existe.")
    est, _ = servicio.estado_de(db, u)
    if db.get(StickerAdquirido, (u.id, s["id"])):
        return respuesta(db, u, h)  # reintento idempotente, nunca cobrar dos veces
    requerida = s["trajineraRequerida"]
    if requerida and not any(t["numero"] == requerida and t["superada"] for t in progreso_trajineras(db, u)):
        raise HTTPException(409, f"Supera la trajinera {requerida} de {CATALOGO['mapaTienda']['nombre']} para comprar este sticker.")
    if est.estrellas < s["precio"]:
        raise HTTPException(409, "No tienes suficientes estrellas.")
    est.estrellas -= s["precio"]
    db.add(StickerAdquirido(alumno_id=u.id, sticker_id=s["id"], precio=s["precio"]))
    db.flush()
    return respuesta(db, u, h)


