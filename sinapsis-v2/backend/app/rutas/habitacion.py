"""Habitación: catálogo de servidor, inventario, guardado por alumno y minijuego."""
from datetime import datetime, timezone
import json
from pathlib import Path
import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import juego, servicio
from ..db import get_db, bloquear_escritura
from ..modelos import Habitacion, StickerAdquirido, PartidaBurbujas, Usuario
from ..seguridad import solo_alumno

router = APIRouter(prefix="/habitacion", tags=["Habitación"])
CATALOGO = json.loads(Path(__file__).resolve().parents[1].joinpath("catalogo_habitacion.json").read_text(encoding="utf-8"))
STICKERS = {s["id"]: s for s in CATALOGO["stickers"]}
INICIALES = [
    {"stickerId": "cama", "x": 295, "y": 454},
    {"stickerId": "tapete", "x": 496, "y": 570},
    {"stickerId": "alga", "x": 735, "y": 492},
]
TOTAL_BURBUJAS = 6


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


class Golpe(Entrada):
    partidaId: str = Field(max_length=40)
    paso: int = Field(ge=0, lt=TOTAL_BURBUJAS, strict=True)
    celda: int = Field(ge=0, le=8, strict=True)


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


def respuesta(db, u, h):
    salida = {"objetos": h.objetos, "revision": h.revision, "inventario": inventario(db, u)}
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
    if juego.nivel(est.xp) < s["nivel"]:
        raise HTTPException(409, "Sigue resolviendo retos para desbloquear este sticker.")
    if est.estrellas < s["precio"]:
        raise HTTPException(409, "No tienes suficientes estrellas.")
    est.estrellas -= s["precio"]
    db.add(StickerAdquirido(alumno_id=u.id, sticker_id=s["id"], precio=s["precio"]))
    db.flush()
    return respuesta(db, u, h)


def segundos(p):
    t = p.iniciada if p.iniciada.tzinfo else p.iniciada.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - t).total_seconds()


def partida_publica(p):
    return {"partidaId": p.partida_id, "objetivo": None if p.finalizada else p.objetivo,
            "aciertos": p.aciertos, "total": TOTAL_BURBUJAS, "finalizada": p.finalizada}


@router.post("/burbujas")
def iniciar(u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)):
    bloquear_escritura(db)
    p = db.get(PartidaBurbujas, u.id)
    if p and not p.finalizada and segundos(p) < 300:
        return partida_publica(p)
    if p is None:
        p = PartidaBurbujas(alumno_id=u.id)
        db.add(p)
    p.partida_id = secrets.token_urlsafe(24)
    p.objetivo = secrets.randbelow(9)
    p.aciertos = 0
    p.finalizada = False
    p.iniciada = datetime.now(timezone.utc)
    db.commit()
    return partida_publica(p)


@router.post("/burbujas/golpe")
def golpe(datos: Golpe, u: Usuario = Depends(solo_alumno), db: Session = Depends(get_db)):
    bloquear_escritura(db)
    p = db.get(PartidaBurbujas, u.id)
    if not p or p.partida_id != datos.partidaId or segundos(p) >= 300:
        raise HTTPException(409, "Esta partida terminó. Inicia otra.")
    if p.finalizada:
        return {**partida_publica(p), "estado": servicio.resumen(db, u)}
    if datos.paso == p.aciertos and datos.celda == p.objetivo:
        p.aciertos += 1
        if p.aciertos == TOTAL_BURBUJAS:
            p.finalizada = True
            _, m = servicio.estado_de(db, u)
            m.alegria = min(juego.VALORES["max_marcas"], m.alegria + 1)
            m.dormido = False
        else:
            p.objetivo = (p.objetivo + 1 + secrets.randbelow(8)) % 9
    salida = partida_publica(p)
    if p.finalizada:
        salida["estado"] = servicio.resumen(db, u)
    else:
        db.commit()
    return salida
