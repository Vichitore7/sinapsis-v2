"""Operaciones del juego sobre la base de datos (las rutas solo llaman a estas funciones)."""
from __future__ import annotations

from datetime import date, datetime, timezone
from math import ceil
from time import time

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from . import aprendizaje, juego
from .contenido import MUNDOS_TEMATICOS, STICKERS, TRAJES, UNIDADES, sortear_trajes_subcultura
from .modelos import Diagnostico, Ejercicio, EstadoJuego, ExamenMundo, Intento, Leccion, Mascota, Progreso, Unidad, Usuario


def hoy() -> date:
    return date.today()


# ---------------- Contenido ----------------

def lecciones_en_orden(db: Session) -> list[tuple[Unidad, Leccion | None]]:
    """Todas las lecciones (mundos) en orden. Las unidades 'próximamente' aparecen con leccion=None."""
    unidades = db.scalars(select(Unidad).options(selectinload(Unidad.lecciones).selectinload(Leccion.ejercicios)).order_by(Unidad.orden)).all()
    salida = []
    for u in unidades:
        if not u.lecciones:
            salida.append((u, None))
        for l in u.lecciones:
            salida.append((u, l))
    return salida


def ejercicio_publico(e: Ejercicio) -> dict:
    """Lo que puede ver el alumno. Nunca incluye la respuesta ni la explicación."""
    d = e.datos
    return {
        "id": e.id, "orden": e.orden, "tipo": e.tipo, "titulo": e.titulo, "enunciado": e.enunciado,
        "a": d.get("a"), "b": d.get("b"), "op": d.get("op", "×"), "moneda": d.get("moneda", False),
        "objeto": d.get("objeto"), "etapa_min": d.get("etapa_min", 1), "ejemplo": d.get("ejemplo"),
        "opciones": d.get("opciones"), "pistas": e.pistas, "dificultad": e.dificultad,
        # Mundos por niveles (El Canal de los Números): a qué chinampa pertenece y qué dibujar.
        "nivel": d.get("nivel"), "nivel_tema": d.get("nivel_tema"), "nivel_titulo": d.get("nivel_titulo"),
        "visual": d.get("visual"), "fase_cpa": d.get("fase_cpa"),  # fase del método CPA: concreto, pictórico o abstracto
    }


def mundos_publicos(db: Session) -> list[dict]:
    mundos = []
    numero = 0
    for u, l in lecciones_en_orden(db):
        numero += 1
        if l is None:
            mundos.append({
                "id": f"u-{u.id}", "numero": numero, "nombre": u.nombre, "entrada": "Próximamente: el equipo está preparando este mundo.",
                "concepto": f"{u.nombre} (pendiente)", "sticker": "sombrero", "unidad": {"id": u.id, "nombre": u.nombre},
                "proximamente": True, "retos": [],
            })
            continue
        mundos.append({
            "id": l.id, "numero": numero, "nombre": l.nombre, "entrada": l.entrada, "concepto": l.concepto,
            "sticker": l.sticker, "unidad": {"id": u.id, "nombre": u.nombre}, "proximamente": u.proximamente,
            "tema": MUNDOS_TEMATICOS[l.id].TEMA if l.id in MUNDOS_TEMATICOS else None,
            "estado_revision": l.estado_revision, "retos": [ejercicio_publico(e) for e in l.ejercicios],
        })
    return mundos


# ---------------- Estado del alumno ----------------

def _fila_existente(db: Session, modelo, alumno_id: int):
    return db.get(modelo, alumno_id)


def _crear_si_falta(db: Session, modelo, alumno_id: int, **valores):
    """Crea la fila del alumno si falta, segura ante peticiones simultáneas: INSERT … ON CONFLICT DO NOTHING
    (SQLite y Postgres) y luego se lee la fila que quedó, la nuestra o la de la otra petición. No captura errores
    ni hace rollback: estado_de() también se usa dentro de acciones del juego que siguen en la misma sesión."""
    fila = _fila_existente(db, modelo, alumno_id)
    if fila is not None:
        return fila
    if db.get_bind().dialect.name == "postgresql":
        from sqlalchemy.dialects.postgresql import insert
    else:
        from sqlalchemy.dialects.sqlite import insert
    db.execute(insert(modelo).values(alumno_id=alumno_id, **valores).on_conflict_do_nothing(index_elements=["alumno_id"]))
    return db.get(modelo, alumno_id)


def estado_de(db: Session, alumno: Usuario) -> tuple[EstadoJuego, Mascota]:
    # Antes: db.add + flush. Dos GET /api/juego/estado simultáneos de una cuenta nueva chocaban (500, 25 nov).
    est = _crear_si_falta(db, EstadoJuego, alumno.id, lecciones_terminadas=[], stickers=[], ejemplos_vistos=[],
                          stats={"cuidados": 0, "pistas_pedidas": 0, "retos_sin_ayuda": 0})
    m = _crear_si_falta(db, Mascota, alumno.id)
    return est, m


def completados_de(db: Session, alumno_id: int) -> dict[str, Progreso]:
    return {p.ejercicio_id: p for p in db.scalars(select(Progreso).where(Progreso.alumno_id == alumno_id))}


def estado_mapa(db: Session, est: EstadoJuego, completados: dict) -> dict:
    """Para cada lección: abierta, retos con estado (completado/actual/bloqueado) y cofre."""
    salida = {}
    anterior_terminada = True
    for u, l in lecciones_en_orden(db):
        if l is None:
            continue
        abierta = anterior_terminada and not u.proximamente
        actual_asignado = False
        nodos = {}
        for e in l.ejercicios:
            if e.id in completados:
                nodos[e.id] = "completado"
            elif abierta and not actual_asignado:
                nodos[e.id] = "actual"
                actual_asignado = True
            else:
                nodos[e.id] = "bloqueado"
        if l.id in est.lecciones_terminadas:
            cofre = "abierto"
        elif abierta and l.ejercicios and not actual_asignado:
            cofre = "actual"
        else:
            cofre = "bloqueado"
        salida[l.id] = {"abierta": abierta, "nodos": nodos, "cofre": cofre}
        anterior_terminada = l.id in est.lecciones_terminadas
    return salida


def resumen(db: Session, alumno: Usuario) -> dict:
    est, m = estado_de(db, alumno)
    completados = completados_de(db, alumno.id)
    medidores = {"comida": m.comida, "pecera": m.pecera, "alegria": m.alegria}
    db.commit()
    return {
        "apodo": alumno.apodo,
        "estrellas": est.estrellas,
        "xp": est.xp,
        "nivel": juego.nivel(est.xp),
        "racha_dias": est.racha_dias if est.ultima_actividad and (hoy() - est.ultima_actividad).days <= 1 else 0,
        "etapa_apoyo": est.etapa_apoyo,
        "ultimo_bono_dia": est.ultimo_bono_dia.isoformat() if est.ultimo_bono_dia else None,
        "ultima_actividad": est.ultima_actividad.isoformat() if est.ultima_actividad else None,
        "completados": {k: {"estrellas": p.estrellas, "con_ayuda": p.con_ayuda, "fecha": p.fecha.isoformat()} for k, p in completados.items()},
        "lecciones_terminadas": list(est.lecciones_terminadas),
        "stickers": list(est.stickers),
        "ejemplos_vistos": list(est.ejemplos_vistos),
        "stats": dict(est.stats),
        "mascota": {"nombre": m.nombre, **medidores, "dormido": m.dormido, "pide": juego.lo_que_pide(medidores),
                    "trajes": list(m.trajes or []), "traje": m.traje,
                    "cuidados_restantes": {a: max(0, ceil((m.cuidados_hasta or {}).get(a, 0) - time())) for a in juego.CUIDADOS}},
        "logros": juego.logros(len(completados), est.stats, len(est.lecciones_terminadas)),
        "mapa": estado_mapa(db, est, completados),
        "diagnostico_hecho": db.get(Diagnostico, alumno.id) is not None,
        # Examen general de cada mundo que lo tiene: sin_empezar | en_curso | terminado (+ trajes ganados).
        "examenes": {lid: _resumen_examen(_examen(db, alumno.id, lid)) for lid in EXAMENES},
    }


def _resumen_examen(ex: ExamenMundo | None) -> dict:
    if not ex:
        return {"estado": "sin_empezar"}
    return {"estado": "terminado" if ex.terminado else "en_curso", "aciertos": ex.aciertos, "total": ex.total,
            "premio": list(ex.premio or []), "fecha_fin": ex.fin.isoformat() if ex.fin else None}


# ---------------- Acciones ----------------

def _ejercicio_jugable(db: Session, est: EstadoJuego, completados: dict, ejercicio: Ejercicio) -> bool:
    mapa = estado_mapa(db, est, completados)
    return mapa.get(ejercicio.leccion_id, {}).get("nodos", {}).get(ejercicio.id, "bloqueado") != "bloqueado"


def registrar_intento(db: Session, alumno: Usuario, ejercicio_id: str, respuesta: str, pistas_usadas: int,
                      tiempo_ms: int | None) -> dict:
    e = db.get(Ejercicio, ejercicio_id)
    if not e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ese reto no existe.")
    est, m = estado_de(db, alumno)
    completados = completados_de(db, alumno.id)
    if not _ejercicio_jugable(db, est, completados, e):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Este sendero todavía está cerrado.")

    try:
        diag = juego.evaluar(e.tipo, e.datos, e.respuesta, respuesta)
    except ValueError as err:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(err)) from err
    pistas_usadas = max(0, min(pistas_usadas, juego.VALORES["max_pistas"] + 1))
    # Errores previos en este reto: los cuenta el servidor, no el navegador.
    errores_previos = db.scalar(select(func.count()).select_from(Intento).where(
        Intento.alumno_id == alumno.id, Intento.ejercicio_id == e.id, Intento.correcto.is_(False))) or 0
    db.add(Intento(alumno_id=alumno.id, ejercicio_id=e.id, respuesta=respuesta[:100], correcto=diag["correcto"],
                   tipo_error=diag["tipo_error"], pistas_usadas=pistas_usadas, tiempo_ms=tiempo_ms))
    # Memoria de aprendizaje (la usa el tutor): sin ayuda, con ayuda (pistas o errores antes) o error.
    concepto, nombre = aprendizaje.concepto_de_ejercicio(e)
    resultado = "error" if not diag["correcto"] else ("solo" if pistas_usadas == 0 and errores_previos == 0 else "ayuda")
    aprendizaje.registrar_resultado(db, alumno.id, concepto, nombre, resultado, diag["tipo_error"], e.id)

    recompensa = None
    if diag["correcto"]:
        recompensa = _premiar(db, alumno, est, m, e, completados, pistas_usadas, errores_previos)
    db.commit()

    salida = {"correcto": diag["correcto"], "recompensa": recompensa, "estado": resumen(db, alumno)}
    if diag["correcto"]:
        salida.update(respuesta=e.respuesta, explicacion=e.explicacion, diagnostico=None)
    else:
        salida["diagnostico"] = {k: diag[k] for k in ("pasos", "paso_torcido", "tipo_error", "pregunta")}
    return salida


def _premiar(db: Session, alumno: Usuario, est: EstadoJuego, m: Mascota, e: Ejercicio,
             completados: dict, pistas: int, errores_previos: int) -> dict:
    if e.id in completados:
        return {"ganadas": 0, "bono": 0, "repaso": True}
    dia = hoy()
    con_ayuda = pistas > 0 or errores_previos > 0
    ganadas = juego.estrellas_por_acierto(con_ayuda)
    bono = 0 if est.ultimo_bono_dia == dia else juego.VALORES["bono_reto_del_dia"]

    db.add(Progreso(alumno_id=alumno.id, ejercicio_id=e.id, estrellas=ganadas, con_ayuda=con_ayuda, fecha=dia))
    est.estrellas += ganadas + bono
    est.xp += ganadas + bono
    est.ultimo_bono_dia = dia
    est.racha_dias = juego.nueva_racha(est.racha_dias, est.ultima_actividad, dia)
    est.ultima_actividad = dia
    est.etapa_apoyo, est.racha_sin_pistas = juego.avanzar_etapa(est.etapa_apoyo, est.racha_sin_pistas, pistas > 0)
    stats = dict(est.stats)
    stats["pistas_pedidas"] = stats.get("pistas_pedidas", 0) + min(pistas, juego.VALORES["max_pistas"])
    stats["retos_sin_ayuda"] = stats.get("retos_sin_ayuda", 0) + (0 if con_ayuda else 1)
    est.stats = stats

    alegria_anterior = m.alegria
    des = juego.desgaste_al_jugar(m.retos_desde_bajada, m.turno_medidor)
    m.retos_desde_bajada, m.turno_medidor = des.retos_desde_bajada, des.turno
    if des.medidor:
        setattr(m, des.medidor, max(juego.VALORES["min_marcas"], getattr(m, des.medidor) - 1))
    # En el turno de desgaste de alegría prevalece la bajada original.
    # Los demás retos nuevos correctos recuperan dos marcas, sin premiar repasos.
    if des.medidor != "alegria":
        m.alegria = min(juego.VALORES["max_marcas"], m.alegria + juego.VALORES["subida_cuidado"])
    estrella_cuidado = int(alegria_anterior < juego.VALORES["max_marcas"] == m.alegria)
    est.estrellas += estrella_cuidado
    m.dormido = False
    return {"ganadas": ganadas, "bono": bono, "repaso": False, "estrella_cuidado": estrella_cuidado}


def abrir_cofre(db: Session, alumno: Usuario, leccion_id: str) -> dict:
    l = db.get(Leccion, leccion_id)
    if not l:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ese mundo no existe.")
    if l.id in EXAMENES:
        raise HTTPException(status.HTTP_409_CONFLICT, "Este mundo termina con el examen general.")
    est, _ = estado_de(db, alumno)
    mapa = estado_mapa(db, est, completados_de(db, alumno.id))
    if mapa.get(l.id, {}).get("cofre") != "actual":
        raise HTTPException(status.HTTP_409_CONFLICT, "Termina todos los retos del mundo para abrir el cofre.")
    est.estrellas += juego.VALORES["estrellas_cofre"]
    est.xp += juego.VALORES["estrellas_cofre"]
    est.lecciones_terminadas = [*est.lecciones_terminadas, l.id]
    if l.sticker not in est.stickers:
        est.stickers = [*est.stickers, l.sticker]
    db.commit()
    return {"estrellas": juego.VALORES["estrellas_cofre"], "sticker": l.sticker,
            "sticker_nombre": STICKERS.get(l.sticker, l.sticker), "estado": resumen(db, alumno)}


def marcar_ejemplo_visto(db: Session, alumno: Usuario, leccion_id: str) -> dict:
    if not db.get(Leccion, leccion_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ese mundo no existe.")
    est, m = estado_de(db, alumno)
    if leccion_id not in est.ejemplos_vistos:
        est.ejemplos_vistos = [*est.ejemplos_vistos, leccion_id]
    m.dormido = False
    db.commit()
    return resumen(db, alumno)


def cuidar(db: Session, alumno: Usuario, accion: str) -> dict:
    c = juego.CUIDADOS.get(accion)
    if not c:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Cuidado desconocido.")
    est, m = estado_de(db, alumno)
    if m.dormido:
        raise HTTPException(409, "Despierta primero a tu ajolote.")
    ahora = time()
    plazos = dict(m.cuidados_hasta or {})
    restante = ceil(plazos.get(accion, 0) - ahora)
    if restante > 0:
        raise HTTPException(409, f"Espera {restante} segundos para repetir este cuidado.")
    if accion == "descansar":
        # La cama debe estar colocada en la habitación persistida.
        from .rutas.habitacion import inicializar
        h = inicializar(db, alumno)
        if not any(o["stickerId"] == "cama" for o in h.objetos):
            raise HTTPException(409, "Coloca y guarda la cama antes de dormir.")
        m.dormido = True
    else:
        medidor = c["medidor"]
        anterior = getattr(m, medidor)
        nuevo = min(juego.VALORES["max_marcas"], anterior + c["sube"])
        setattr(m, medidor, nuevo)
        if anterior < juego.VALORES["max_marcas"] == nuevo:
            est.estrellas += 1  # saldo, nunca XP
        stats = dict(est.stats)
        stats["cuidados"] = stats.get("cuidados", 0) + 1
        est.stats = stats
    plazos[accion] = ahora + juego.VALORES["espera_cuidado"]
    m.cuidados_hasta = plazos
    db.commit()
    return resumen(db, alumno)


def vestir(db: Session, alumno: Usuario, traje: str | None) -> dict:
    """Le pone al ajolote un traje que el alumno ya tiene (o se lo quita con None).

    Si es un traje que ganó en el examen general de un mundo, ponérselo abre el mundo siguiente.
    """
    est, m = estado_de(db, alumno)
    if traje is not None and traje not in (m.trajes or []):
        raise HTTPException(status.HTTP_409_CONFLICT, "Todavía no tienes ese traje.")
    m.traje = traje
    if traje:
        for ex in db.scalars(select(ExamenMundo).where(ExamenMundo.alumno_id == alumno.id, ExamenMundo.terminado.is_(True))):
            if traje in (ex.premio or []) and ex.leccion_id not in est.lecciones_terminadas:
                est.lecciones_terminadas = [*est.lecciones_terminadas, ex.leccion_id]
    db.commit()
    return resumen(db, alumno)


# ---------------- Examen general al final de un mundo ----------------

EXAMENES = {lid: mundo.examen for lid, mundo in MUNDOS_TEMATICOS.items()}  # mundos que terminan con examen (en lugar de cofre)
MAX_INTENTOS_EXAMEN = 3
LOGRADAS = ("a_la_primera", "con_ayuda")


def _preguntas_examen(leccion_id: str) -> list[dict]:
    if leccion_id not in EXAMENES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ese mundo no tiene examen general.")
    return EXAMENES[leccion_id]()


def _pregunta_publica(p: dict) -> dict:
    """Lo que ve el alumno de una pregunta del examen. Nunca incluye la respuesta."""
    claves = ("id", "tipo", "titulo", "enunciado", "a", "b", "op", "moneda", "opciones", "visual", "pistas", "nivel", "nivel_tema", "fase_cpa")
    return {k: p.get(k) for k in claves}


def _examen(db: Session, alumno_id: int, leccion_id: str) -> ExamenMundo | None:
    return db.scalar(select(ExamenMundo).where(ExamenMundo.alumno_id == alumno_id, ExamenMundo.leccion_id == leccion_id))


def _sticker_de(leccion_id: str) -> dict | None:
    """El sticker que da un mundo al terminarlo, según el contenido."""
    sid = next((l["sticker"] for u in UNIDADES for l in u["lecciones"] if l["id"] == leccion_id), None)
    return {"id": sid, "nombre": STICKERS.get(sid, sid)} if sid else None


def _salida_examen(ex: ExamenMundo, preguntas: list[dict], est: EstadoJuego) -> dict:
    return {
        "leccion_id": ex.leccion_id, "terminado": ex.terminado, "aciertos": ex.aciertos, "total": ex.total,
        "preguntas": [{**_pregunta_publica(p), "estado": ex.detalle[p["id"]]["estado"],
                       "intentos": len(ex.detalle[p["id"]]["intentos"])} for p in preguntas],
        "premio": [{"id": t, "nombre": TRAJES.get(t, t)} for t in (ex.premio or [])],
        "fecha_fin": ex.fin.isoformat() if ex.fin else None,
        "mundo_abierto": ex.leccion_id in est.lecciones_terminadas,
        # Sticker del mundo que se gana al terminar (en el Centro, la Tarjeta del Metro).
        "sticker": _sticker_de(ex.leccion_id) if ex.terminado else None,
    }


def examen_mundo(db: Session, alumno: Usuario, leccion_id: str) -> dict:
    """Empieza (o retoma) el examen general. Se abre cuando el alumno termina todos los niveles del mundo."""
    preguntas = _preguntas_examen(leccion_id)
    est, _ = estado_de(db, alumno)
    ex = _examen(db, alumno.id, leccion_id)
    if not ex:
        mapa = estado_mapa(db, est, completados_de(db, alumno.id))
        if mapa.get(leccion_id, {}).get("cofre") != "actual":
            raise HTTPException(status.HTTP_409_CONFLICT, "Termina todos los niveles del mundo para presentar el examen.")
        ex = ExamenMundo(alumno_id=alumno.id, leccion_id=leccion_id, total=len(preguntas), premio=[],
                         detalle={p["id"]: {"intentos": [], "pistas": 0, "estado": "pendiente", "tiempo_ms": 0} for p in preguntas})
        db.add(ex)
        db.commit()
    return _salida_examen(ex, preguntas, est)


def responder_examen(db: Session, alumno: Usuario, leccion_id: str, pregunta_id: str, respuesta: str | None,
                     pistas_usadas: int, tiempo_ms: int | None) -> dict:
    """Califica una pregunta del examen. Hasta 3 intentos; respuesta=None es "No sé todavía" (queda por reforzar)."""
    preguntas = _preguntas_examen(leccion_id)
    p = next((x for x in preguntas if x["id"] == pregunta_id), None)
    est, _ = estado_de(db, alumno)
    ex = _examen(db, alumno.id, leccion_id)
    if not ex or not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Esa pregunta no existe.")
    if ex.terminado:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya terminaste este examen.")
    d = dict(ex.detalle[pregunta_id])
    if d["estado"] != "pendiente":
        raise HTTPException(status.HTTP_409_CONFLICT, "Esa pregunta ya está contestada.")

    diag = None
    if respuesta is None:
        intento = {"respuesta": None, "correcto": False, "tiempo_ms": tiempo_ms}
        d["estado"] = "por_reforzar"
    else:
        try:
            diag = juego.evaluar(p["tipo"], p, p["respuesta"], respuesta)
        except ValueError as err:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(err)) from err
        intento = {"respuesta": respuesta.strip()[:40], "correcto": diag["correcto"], "tiempo_ms": tiempo_ms}
    d["intentos"] = [*d["intentos"], intento]
    d["pistas"] = max(d["pistas"], max(0, min(pistas_usadas, juego.VALORES["max_pistas"])))
    d["tiempo_ms"] = d["tiempo_ms"] + max(0, tiempo_ms or 0)
    if diag and diag["correcto"]:
        d["estado"] = "a_la_primera" if len(d["intentos"]) == 1 and d["pistas"] == 0 else "con_ayuda"
    elif diag and len(d["intentos"]) >= MAX_INTENTOS_EXAMEN:
        d["estado"] = "por_reforzar"
    ex.detalle = {**ex.detalle, pregunta_id: d}  # se reasigna para que SQLAlchemy guarde el JSON
    db.commit()

    salida = {"correcto": bool(diag and diag["correcto"]), "estado": d["estado"],
              "intentos_restantes": max(0, MAX_INTENTOS_EXAMEN - len(d["intentos"])), "examen": _salida_examen(ex, preguntas, est)}
    if diag and not diag["correcto"]:
        salida["diagnostico"] = {k: diag[k] for k in ("pasos", "paso_torcido", "tipo_error", "pregunta")}
    return salida


def terminar_examen(db: Session, alumno: Usuario, leccion_id: str) -> dict:
    """Cierra el examen: certificado, estrellas, sticker del mundo y 2 trajes de subculturas (uno de cada estilo).

    No hay calificación mínima: equivocarse no se castiga. El mundo siguiente se abre cuando Kiko se pone uno de los trajes.
    """
    preguntas = _preguntas_examen(leccion_id)
    est, m = estado_de(db, alumno)
    ex = _examen(db, alumno.id, leccion_id)
    if not ex:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Todavía no empiezas este examen.")
    if not ex.terminado:
        if any(v["estado"] == "pendiente" for v in ex.detalle.values()):
            raise HTTPException(status.HTTP_409_CONFLICT, "Te faltan preguntas por contestar.")
        ex.terminado = True
        ex.fin = datetime.now(timezone.utc)
        ex.aciertos = sum(1 for v in ex.detalle.values() if v["estado"] in LOGRADAS)
        # Premio fijo del mundo (p. ej. los atuendos de la FES Aragón) o, si no tiene, 2 trajes de subculturas al azar.
        fijo = getattr(MUNDOS_TEMATICOS.get(leccion_id), "PREMIO_TRAJES", None)
        ex.premio = [t for t in fijo if t not in (m.trajes or [])] if fijo else sortear_trajes_subcultura(list(m.trajes or []))
        m.trajes = [*(m.trajes or []), *ex.premio]
        est.estrellas += juego.VALORES["estrellas_cofre"]
        est.xp += juego.VALORES["estrellas_cofre"]
        sticker = db.get(Leccion, leccion_id).sticker
        if sticker not in est.stickers:
            est.stickers = [*est.stickers, sticker]
        db.commit()
    return {"examen": _salida_examen(ex, preguntas, est), "estrellas": juego.VALORES["estrellas_cofre"], "estado": resumen(db, alumno)}


def reporte_examen(db: Session, ex: ExamenMundo) -> dict:
    """Todo lo que pasó en el examen, para el profesor del aula: resultado, fallas, pistas y tiempos por pregunta."""
    preguntas = _preguntas_examen(ex.leccion_id)
    leccion = db.get(Leccion, ex.leccion_id)
    filas = []
    for p in preguntas:
        d = ex.detalle[p["id"]]
        filas.append({
            "id": p["id"], "nivel": p["nivel"], "tema": p["nivel_tema"], "titulo": p["titulo"], "enunciado": p["enunciado"],
            "respuesta_correcta": p["respuesta"], "estado": d["estado"], "intentos": len(d["intentos"]),
            "respuestas_incorrectas": [i["respuesta"] if i["respuesta"] is not None else "No sé todavía"
                                       for i in d["intentos"] if not i["correcto"]],
            "pistas": d["pistas"], "tiempo_ms": d["tiempo_ms"],
        })
    return {
        "leccion_id": ex.leccion_id, "mundo": leccion.nombre if leccion else ex.leccion_id,
        "terminado": ex.terminado, "inicio": ex.inicio.isoformat() if ex.inicio else None,
        "fin": ex.fin.isoformat() if ex.fin else None, "aciertos": ex.aciertos, "total": ex.total,
        "a_la_primera": sum(1 for f in filas if f["estado"] == "a_la_primera"),
        "con_ayuda": sum(1 for f in filas if f["estado"] == "con_ayuda"),
        "por_reforzar": [f["tema"] for f in filas if f["estado"] == "por_reforzar"],
        "pistas_total": sum(f["pistas"] for f in filas), "fallas_total": sum(len(f["respuestas_incorrectas"]) for f in filas),
        "tiempo_total_ms": sum(f["tiempo_ms"] for f in filas), "preguntas": filas,
    }


def despertar(db: Session, alumno: Usuario) -> dict:
    _, m = estado_de(db, alumno)
    m.dormido = False
    db.commit()
    return resumen(db, alumno)


# ---------------- Para el panel del profesor ----------------

def progreso_alumno(db: Session, alumno: Usuario, total_retos: int) -> dict:
    est, _ = estado_de(db, alumno)
    hechos = db.scalar(select(func.count()).select_from(Progreso).where(Progreso.alumno_id == alumno.id)) or 0
    pistas = db.scalar(select(func.coalesce(func.sum(Intento.pistas_usadas), 0)).where(Intento.alumno_id == alumno.id)) or 0
    intentos = db.scalar(select(func.count()).select_from(Intento).where(Intento.alumno_id == alumno.id)) or 0
    fallos = db.scalar(select(func.count()).select_from(Intento).where(Intento.alumno_id == alumno.id, Intento.correcto.is_(False))) or 0
    return {
        "id": alumno.id, "apodo": alumno.apodo, "usuario": alumno.usuario,
        "retos_completados": hechos, "total_retos": total_retos,
        "porcentaje": round(100 * hechos / total_retos) if total_retos else 0,
        "estrellas_ganadas": est.xp, "racha_dias": est.racha_dias,
        "intentos": intentos, "fallos": fallos, "pistas_usadas": int(pistas),
        "ultimo_acceso": alumno.ultimo_acceso.isoformat() if alumno.ultimo_acceso else None,
        "examenes": {lid: _resumen_examen(_examen(db, alumno.id, lid)) for lid in EXAMENES},
    }
