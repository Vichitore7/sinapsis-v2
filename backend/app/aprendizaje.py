"""Memoria de aprendizaje del alumno (fase 1): qué conceptos domina, qué le cuesta y qué le ha ayudado.

La llena el CÓDIGO (no el modelo) desde tres lugares:
- los retos del mapa (`servicio.registrar_intento`);
- las operaciones que el alumno confirma en el escáner (`POST /api/escaner/resultado`);
- el chat con Kiko (qué dibujo usó y si después el alumno lo resolvió).

Guarda solo conteos y etiquetas por concepto, nunca el texto del chat. A Kiko le llega un resumen corto en cada
mensaje (`resumen_para_tutor`), así se adapta al alumno y lo recuerda entre sesiones sin mandarle historiales largos.

"Dominado" lo decide una regla de código (`estado`), no el modelo: nunca por un solo acierto.
"""
from __future__ import annotations

import re
import unicodedata

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, select
from sqlalchemy.orm import Mapped, Session, mapped_column

from . import operaciones
from .db import Base
from .modelos import ahora

# Regla de dominio (VALOR INICIAL: ajustar con la maestra o el maestro).
DOMINIO_EJERCICIOS_SOLO = 3   # ejercicios DISTINTOS resueltos sin ayuda
RECIENTES = 6                 # cuántos resultados recientes se recuerdan

NOMBRES_OP = {"+": ("suma", "Suma"), "−": ("resta", "Resta"), "×": ("multiplicacion", "Multiplicación"),
              "÷": ("division", "División")}
NOMBRES_REPRESENTACION = {
    "objetos": "contar objetos", "grupos": "grupos de objetos", "quitar": "tachar objetos",
    "recta": "la recta numérica", "decenas": "ramos de 10", "monedas": "monedas", "grafica": "una gráfica de barras",
    "figura": "figuras",
}
NOMBRES_ERROR = {
    "sumo": "sumó en lugar de multiplicar", "calculo": "error de cálculo",
    "sumo_denominadores": "sumó numeradores y denominadores por separado", "denominador": "no igualó denominadores",
    "multiplico": "multiplicó en lugar de dividir", "residuo_grande": "residuo más grande que el divisor",
    "residuo": "se equivocó en el residuo", "cociente": "se equivocó en el cociente",
    "no_llevo": "no llevó la decena", "no_pidio": "no pidió prestado", "un_grupo": "le faltó o le sobró un grupo",
}
NOMBRES_ESTADO = {"nuevo": "todavía no lo practica", "practicando": "practicando",
                  "necesita_refuerzo": "le está costando", "dominado": "lo domina"}


class Aprendizaje(Base):
    """Un renglón por alumno y concepto."""
    __tablename__ = "aprendizaje"

    alumno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    concepto: Mapped[str] = mapped_column(String(40), primary_key=True)  # p. ej. "suma_fracciones"
    nombre: Mapped[str] = mapped_column(String(60))                       # p. ej. "Suma de fracciones"
    intentos: Mapped[int] = mapped_column(Integer, default=0)
    aciertos_solo: Mapped[int] = mapped_column(Integer, default=0)
    aciertos_ayuda: Mapped[int] = mapped_column(Integer, default=0)
    errores: Mapped[int] = mapped_column(Integer, default=0)
    tipos_error: Mapped[dict] = mapped_column(JSON, default=dict)        # {"sumo_denominadores": 2}
    ayudas_tutor: Mapped[int] = mapped_column(Integer, default=0)       # mensajes de Kiko sobre este concepto
    representaciones: Mapped[dict] = mapped_column(JSON, default=dict)  # {"grupos": {"usada": 3, "ayudo": 2}}
    ultima_representacion: Mapped[str | None] = mapped_column(String(20), nullable=True)
    recientes: Mapped[list] = mapped_column(JSON, default=list)         # ["error", "ayuda", "solo", …]
    resueltos_solo: Mapped[list] = mapped_column(JSON, default=list)    # firmas de ejercicios distintos
    pendientes: Mapped[list] = mapped_column(JSON, default=list)        # firmas que tuvo mal y aún no corrige
    actualizado = mapped_column(DateTime(timezone=True), default=ahora, onupdate=ahora)


# ---------------- Conceptos ----------------

def _slug(texto: str) -> str:
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "_", t).strip("_")[:40] or "otro"


def concepto_de_operacion(op: dict) -> tuple[str, str]:
    """Para el escáner y el chat: ('suma_fracciones', 'Suma de fracciones'), ('division', 'División')…"""
    clave, nombre = NOMBRES_OP[op["op"]]
    if operaciones.tipo(op) == "fracciones":
        return f"{clave}_fracciones", f"{nombre} de fracciones"
    return clave, nombre


def concepto_de_ejercicio(ejercicio) -> tuple[str, str]:
    """Para los retos del mapa: por la operación si es una cuenta; si no, por el tema del nivel."""
    d = ejercicio.datos or {}
    if ejercicio.tipo == "numerica" and d.get("op") in ("×", "+", "−", "x", "-"):
        return NOMBRES_OP[operaciones.normalizar_op(d["op"])]
    if d.get("nivel_tema"):
        return _slug(d["nivel_tema"]), str(d["nivel_tema"])[:60]
    return _slug(ejercicio.leccion_id), ejercicio.leccion_id


def firma(op: dict) -> str:
    """Identifica un ejercicio del escáner sin importar el resultado que escribió el alumno: '3/4+1/2'."""
    return f"{op['a']}{op['op']}{op['b']}"[:40]


# ---------------- Registro ----------------

def _fila(db: Session, alumno_id: int, concepto: str, nombre: str) -> Aprendizaje:
    f = db.get(Aprendizaje, (alumno_id, concepto))
    if f is None:
        f = Aprendizaje(alumno_id=alumno_id, concepto=concepto, nombre=nombre, intentos=0, aciertos_solo=0,
                        aciertos_ayuda=0, errores=0, tipos_error={}, ayudas_tutor=0, representaciones={},
                        recientes=[], resueltos_solo=[], pendientes=[])
        db.add(f)
    return f


def registrar_resultado(db: Session, alumno_id: int, concepto: str, nombre: str, resultado: str,
                        tipo_error: str | None = None, firma_: str | None = None) -> Aprendizaje:
    """resultado: 'solo' (sin ayuda), 'ayuda' (con pistas o después de equivocarse) o 'error'. No hace commit."""
    f = _fila(db, alumno_id, concepto, nombre)
    f.intentos += 1
    if resultado == "error":
        f.errores += 1
        if tipo_error:
            f.tipos_error = {**f.tipos_error, tipo_error: f.tipos_error.get(tipo_error, 0) + 1}
        if firma_ and firma_ not in f.pendientes:
            f.pendientes = (f.pendientes + [firma_])[-10:]
    else:
        if resultado == "solo":
            f.aciertos_solo += 1
            if firma_ and firma_ not in f.resueltos_solo:
                f.resueltos_solo = (f.resueltos_solo + [firma_])[-20:]
        else:
            f.aciertos_ayuda += 1
        if firma_ in f.pendientes:
            f.pendientes = [p for p in f.pendientes if p != firma_]
        # La última representación que usó Kiko antes de este acierto cuenta como "le ayudó".
        if f.ultima_representacion:
            r = f.representaciones.get(f.ultima_representacion, {"usada": 0, "ayudo": 0})
            f.representaciones = {**f.representaciones, f.ultima_representacion: {**r, "ayudo": r.get("ayudo", 0) + 1}}
            f.ultima_representacion = None
    f.recientes = (f.recientes + [resultado])[-RECIENTES:]
    return f


def registrar_ayuda_tutor(db: Session, alumno_id: int, concepto: str, nombre: str, dibujo_tipo: str | None) -> None:
    """Kiko ayudó con este concepto (y quizá con un dibujo). No hace commit."""
    f = _fila(db, alumno_id, concepto, nombre)
    f.ayudas_tutor += 1
    if dibujo_tipo:
        r = f.representaciones.get(dibujo_tipo, {"usada": 0, "ayudo": 0})
        f.representaciones = {**f.representaciones, dibujo_tipo: {**r, "usada": r.get("usada", 0) + 1}}
        f.ultima_representacion = dibujo_tipo


def resultado_escaneo(db: Session, alumno_id: int, op: dict) -> str:
    """Registra una operación confirmada en el escáner. Regresa el estado del concepto."""
    d = operaciones.diagnosticar(op)
    if d["correcto"] is None:
        return estado(db.get(Aprendizaje, (alumno_id, concepto_de_operacion(op)[0])))
    concepto, nombre = concepto_de_operacion(op)
    previa = db.get(Aprendizaje, (alumno_id, concepto))
    fir = firma(op)
    from . import estrategia  # aquí para evitar una importación circular
    if not d["correcto"]:
        f = registrar_resultado(db, alumno_id, concepto, nombre, "error", d["tipo_error"], fir)
        estrategia.empezar_con_pista(db, alumno_id, op)
    else:
        # Bien a la primera: "solo". Bien después de tenerla mal (la corrigió con ayuda): "ayuda".
        corregida = previa is not None and fir in (previa.pendientes or [])
        f = registrar_resultado(db, alumno_id, concepto, nombre, "ayuda" if corregida else "solo", None, fir)
        estrategia.cerrar(db, alumno_id, op)
    return estado(f)


# ---------------- Lectura ----------------

def estado(f: Aprendizaje | None) -> str:
    """nuevo | practicando | necesita_refuerzo | dominado (regla de código, no del modelo)."""
    if f is None or not f.intentos:
        return "nuevo"
    ultimos = (f.recientes or [])[-4:]
    if len(f.resueltos_solo or []) >= DOMINIO_EJERCICIOS_SOLO and ultimos[-3:].count("error") <= 1:
        return "dominado"
    if ultimos.count("error") >= 2:
        return "necesita_refuerzo"
    return "practicando"


def _linea(f: Aprendizaje) -> str:
    partes = [f"{f.nombre}: {NOMBRES_ESTADO[estado(f)]} ({len(f.resueltos_solo or [])} ejercicios distintos sin ayuda, "
              f"{f.aciertos_ayuda} con ayuda, {f.errores} errores)"]
    if f.tipos_error:
        tipo, n = max(f.tipos_error.items(), key=lambda x: x[1])
        partes.append(f"error frecuente: {NOMBRES_ERROR.get(tipo, tipo)} ({n} veces)")
    utiles = sorted(((t, r) for t, r in (f.representaciones or {}).items() if r.get("usada")),
                    key=lambda x: (-x[1].get("ayudo", 0), -x[1].get("usada", 0)))
    if utiles:
        partes.append("representaciones probadas: " + ", ".join(
            f"{NOMBRES_REPRESENTACION.get(t, t)} (ayudó {r.get('ayudo', 0)} de {r.get('usada', 0)})" for t, r in utiles[:3]))
    return "; ".join(partes)


def resumen_para_tutor(db: Session, alumno_id: int, concepto_actual: str | None = None, maximo: int = 4) -> str:
    """Unas líneas para Kiko: el concepto de ahora primero y luego los más recientes. Vacío si no hay datos."""
    filas = db.scalars(select(Aprendizaje).where(Aprendizaje.alumno_id == alumno_id)
                       .order_by(Aprendizaje.actualizado.desc())).all()
    if not filas:
        return ""
    filas.sort(key=lambda f: f.concepto != concepto_actual)  # el actual primero (sort es estable)
    lineas = [f"- {_linea(f)}" for f in filas[:maximo]]
    # Indicaciones que decide el código según el estado (el modelo no siempre las deduce de los números).
    dominados = [f.nombre for f in filas if estado(f) == "dominado"]
    cuesta = [f.nombre for f in filas if estado(f) == "necesita_refuerzo"]
    if dominados:
        lineas.append(f"INDICACIÓN: ya domina {', '.join(dominados)}. Si pregunta por eso, NO le expliques lo básico "
                      "(nada de contar objetos ni grupos sencillos): dale una explicación más profunda o un reto mayor, "
                      "o pídele que te explique o justifique cómo lo hace.")
    if cuesta:
        lineas.append(f"INDICACIÓN: le está costando {', '.join(cuesta)}. Empieza por la base y ataca su error frecuente "
                      "con una pregunta.")
    return "\n".join(lineas)
