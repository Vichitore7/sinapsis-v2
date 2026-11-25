"""Escalera de ayuda (fase 2, versión 2 del 24 nov): el BACKEND decide qué hace Kiko en cada mensaje.

Versión 2 (después de probarla con alumnos de prueba): ya no se cambia de estrategia en cada escalón; se trabaja
SIEMPRE sobre el ejercicio del alumno, partido en pasitos chiquitos (app/pasitos.py), una idea por mensaje.

    Primer mensaje: una pista sobre el error que cometió (sale del diagnóstico de operaciones.py).
    Luego, un pasito a la vez. Según lo que contesta el alumno:
      - contesta bien el pasito          → lo reconoce y pasa al siguiente;
      - pregunta "¿por qué?" / "¿cómo?"  → explica ESE pasito más concreto (con dibujo), sin avanzar;
      - "no entiendo" / "mucho texto"    → lo explica más concreto; si se vuelve a atorar, le dice cuánto da ese
                                            pasito y avanza (nunca en el último: el resultado lo dice él);
      - se equivoca en el pasito         → igual que "no entiendo".
    El último pasito es el resultado de su ejercicio: nunca se le da.

Las cuentas las pone el código (verificadas); del modelo solo se usa una frase corta de ánimo o reconocimiento.
"""
from __future__ import annotations

import math
import re
from fractions import Fraction

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, Session, mapped_column

from . import aprendizaje, operaciones, pasitos
from .db import Base
from .modelos import ahora

VENCE_HORAS = 12  # una escalera más vieja que esto empieza de cero (otro día, otro intento)
ANIMOS = ["¡Vamos juntos, tú puedes!", "Tranquilo, lo vamos a ver con calma.", "¡Buen trabajo por no rendirte!",
          "Está bien que cueste, así se aprende."]


RESERVA = {"presentar": "¡Vamos a resolverla juntos!", "acierto": "¡Eso es!", "pregunta": "¡Buena pregunta!",
           "reexplicar": "Lo vemos más despacio.", "resolver_pasito": "Este pasito lo hacemos juntos."}


def frase_de_animo(texto_modelo: str, turno: int, modo: str | None = None) -> str:
    """Con los pasitos solo se usa la primera frase del modelo, y solo si no trae números ni preguntas
    (las cuentas y la pregunta las pone el código). Si no sirve, una frase fija que encaje con el momento."""
    primera = re.split(r"(?<=[.!¡])\s", (texto_modelo or "").strip())[0].strip()
    if primera and len(primera) <= 120 and not re.search(r"\d|\?|¿", primera):
        return primera
    return RESERVA.get(modo) or ANIMOS[turno % len(ANIMOS)]


class Escalera(Base):
    """En qué escalón de ayuda va un alumno con un ejercicio (se recupera entre sesiones)."""
    __tablename__ = "escaleras"

    alumno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    firma: Mapped[str] = mapped_column(String(40), primary_key=True)
    concepto: Mapped[str] = mapped_column(String(40))
    escalon: Mapped[int] = mapped_column(Integer, default=1)
    turnos: Mapped[int] = mapped_column(Integer, default=0)
    representaciones: Mapped[list] = mapped_column(JSON, default=list)  # las que ya se probaron en esta escalera
    actualizado = mapped_column(DateTime(timezone=True), default=ahora, onupdate=ahora)
    # Avance que el navegador todavía no confirma haber mostrado: {"turno", "estado", "respuesta"} (ver `sincronizar`).
    # Las columnas de arriba guardan solo lo CONFIRMADO; escalon = -1 significa "todavía sin empezar".
    pendiente: Mapped[dict | None] = mapped_column(JSON(none_as_null=True), nullable=True)


_PARTES = {2: "medios", 3: "tercios", 4: "cuartos", 5: "quintos", 6: "sextos", 7: "séptimos", 8: "octavos",
           9: "novenos", 10: "décimos", 12: "doceavos"}


def partes(d: int) -> str:
    return _PARTES.get(d, f"{d}-avos")


def _f(x: Fraction) -> str:
    return operaciones.texto(x)


_FRACCION_TXT = re.compile(r"(\d+)\s*/\s*(\d+)")


def menciona(texto: str, valor: Fraction) -> bool:
    """¿El texto menciona este valor (como fracción, aunque sea equivalente, o como número suelto)?"""
    if operaciones.trae_fraccion(texto, valor):
        return True
    if valor.denominator == 1:
        sueltos = re.findall(r"\d+", _FRACCION_TXT.sub(" ", texto))
        return str(valor.numerator) in sueltos
    return False


def ejemplo_parecido(op: dict) -> str | None:
    """Un ejemplo con OTROS números, resuelto completo. NINGUNA parte del ejemplo menciona el resultado del alumno."""
    for intento in range(6):
        texto = _ejemplo(op, intento)
        if texto and not menciona(texto, operaciones.resultado(op)["valor"]) and not _menciona_cociente(texto, op):
            return texto
    return None


def _menciona_cociente(texto: str, op: dict) -> bool:
    r = operaciones.resultado(op)
    return "cociente" in r and menciona(texto, Fraction(r["cociente"]))


def _ejemplo(op: dict, intento: int) -> str | None:
    o, t = op["op"], operaciones.tipo(op)
    secreto = operaciones.resultado(op)["valor"]
    if t == "fracciones":
        candidatos = {
            "+": [("1/3", "1/6"), ("1/2", "1/4"), ("2/5", "1/10")],
            "−": [("1/2", "1/4"), ("2/3", "1/6"), ("3/4", "1/8")],
            "×": [("1/2", "2/3"), ("2/3", "3/4"), ("1/3", "3/5")],
            "÷": [("1/2", "1/4"), ("2/3", "1/6"), ("3/4", "1/8")],
        }[o]
        for x, y in candidatos[intento % len(candidatos):] if intento < len(candidatos) else []:
            fx, fy = Fraction(x), Fraction(y)
            r = {"+": fx + fy, "−": fx - fy, "×": fx * fy, "÷": fx / fy}[o]
            if r == secreto or {x, y} == {op["a"], op["b"]}:
                continue
            if o in "+−":
                comun = math.lcm(fx.denominator, fy.denominator)
                ex = f"{fx.numerator * comun // fx.denominator}/{comun}"
                ey = f"{fy.numerator * comun // fy.denominator}/{comun}"
                signo = 1 if o == "+" else -1
                bruto = f"{fx.numerator * comun // fx.denominator + signo * fy.numerator * comun // fy.denominator}/{comun}"
                simplificado = f", que es lo mismo que {_f(r)}" if bruto != _f(r) else ""
                return (f"{x} {o} {y}: las partes no son del mismo tamaño, así que primero las hago iguales: "
                        f"{x} = {ex} y {y} = {ey}. Ahora {ex} {o} {ey} = {bruto}{simplificado}.")
            if o == "×":
                return f"{x} × {y} = ({fx.numerator}×{fy.numerator})/({fx.denominator}×{fy.denominator}) = {fx.numerator * fy.numerator}/{fx.denominator * fy.denominator}, que es {_f(r)}."
            return f"{x} ÷ {y}: le doy la vuelta a la segunda y multiplico: {x} × {fy.denominator}/{fy.numerator} = {_f(r)}."
        return None
    a, b = int(operaciones.numero(op["a"])), int(operaciones.numero(op["b"]))
    if t == "division":
        b2 = (b if 2 <= b <= 5 else 3) + (intento % 3)
        q2, r2 = 2 + intento // 3, 1
        a2 = b2 * q2 + r2
        if (a2, b2) == (a, b):
            q2 = 3
            a2 = b2 * q2 + r2
        return f"{a2} ÷ {b2}: caben {q2} grupos de {b2} (son {b2 * q2}) y sobra {r2}. Compruebo: {b2} × {q2} + {r2} = {a2}."
    a2 = (max(2, a // 2) if a > 3 else a + 1) + intento
    b2 = (max(2, b // 2) if b > 3 else b + 1) + (intento % 3)
    if o == "−" and a2 < b2:
        a2, b2 = b2 + 3, b2
    r = {"+": a2 + b2, "−": a2 - b2, "×": a2 * b2}[o]
    if r == secreto:
        a2 += 1
        r = {"+": a2 + b2, "−": a2 - b2, "×": a2 * b2}[o]
    if o == "×":
        return f"{a2} × {b2} = {r}, porque son {a2} grupos de {b2}: {' + '.join([str(b2)] * a2)} = {r}."
    if o == "+":
        return f"{a2} + {b2} = {r}: empiezo en {a2} y cuento {b2} más hasta llegar a {r}."
    return f"{a2} − {b2} = {r}: de {a2} quito {b2} y quedan {r}. Compruebo al revés: {r} + {b2} = {a2}."


# ---------------- La escalera ----------------

_PREGUNTA = re.compile(r"por ?qu[eé]|c[oó]mo (le|lo|se|es|hago|hice)|qu[eé] (es|significa|quiere decir)|de d[oó]nde", re.I)

_RECONOCER = ("Escribe SOLO una frase corta (máximo 10 palabras), sin números ni preguntas, que {que}. "
              "Justo después la app agrega el siguiente pasito con sus cuentas ya verificadas.")


# Intención del mensaje, antes de decidir si avanza un pasito (revisión de Codex, 25 nov).
_PAUSA = re.compile(r"descans|seguimos (?:ma[ñn]ana|luego|despu[eé]s|otro d[ií]a|al rato)|"
                    r"(?:ma[ñn]ana|luego|despu[eé]s|al rato) (?:seguimos|le seguimos|continuamos)|\bme voy\b|tengo que irme|"
                    r"hasta ma[ñn]ana|\badi[oó]s\b|\bbye\b|ya no quiero|me cans[eé]|estoy cansad", re.I)
_OTRO_TEMA = re.compile(r"quiero (?:entender|saber|aprender|ver) (?:qu[eé]|c[oó]mo|sobre|de)\b|otra cosa|otro tema|"
                        r"cambiando de tema|expl[ií]came qu[eé] (?:es|son)\b", re.I)
# Señales de que la pregunta es sobre SU ejercicio: entonces no es cambio de tema.
_DEL_EJERCICIO = re.compile(r"\d|\b(?:esto|eso|este|ese|aqu[ií]|ah[ií]|paso|pasito|por ?qu[eé])\b|"
                            r"mi (?:cuenta|operaci[oó]n|ejercicio)", re.I)
_INTENCIONES = {
    "pausa": ("PAUSA: el alumno quiere descansar o irse. Despídete con calidez en una o dos frases y dile que su "
              "ejercicio lo espera para cuando regrese. No le hagas preguntas ni le des pistas."),
    "otro_tema": ("CAMBIO DE TEMA: el alumno quiere entender otra cosa. Respóndele esa duda nueva con calma, según el "
                  "manual, y al final dile en una frase que su ejercicio sigue pendiente para cuando quiera. "
                  "No le hagas la pregunta del pasito."),
}


# Dijo el número, pero no lo afirma: lo pregunta, duda o da opciones ("¿será 42?", "creo que 42", "42 o 43").
_DUDA = re.compile(r"\?|\bser[aá]\b|\bcreo\b|no (?:estoy|sé|se) segur|\btal vez\b|\bquiz[aá]s?\b|\ba lo mejor\b|"
                   r"\bpuede ser\b|\bno s[eé]\b|\d\s*(?:o|ó|u)\s*\d", re.I)
# Números que el alumno NIEGA: "no es 42", "no me da 42", "42 no". Se quitan antes de buscar su respuesta
# ("no es 41, es 42" sí cuenta como 42).
_NEGADO = re.compile(r"\bno\s+(?:es|da|sale|son|ser[ií]a|era|fue|me\s+(?:da|sale|dio|sali[oó]))\s+(?:el\s+|de\s+)?"
                     r"\d+(?:\s*/\s*\d+)?|\d+(?:\s*/\s*\d+)?\s+no\b", re.I)


def con_duda(mensaje: str) -> bool:
    return bool(_DUDA.search(mensaje or ""))


def quitar_negados(mensaje: str) -> str:
    return _NEGADO.sub(" ", mensaje or "")


def intencion(mensaje: str) -> str | None:
    """pausa | otro_tema | None (sigue con su ejercicio). Se decide ANTES de mover la escalera."""
    texto = (mensaje or "").strip()
    if _PAUSA.search(texto):
        return "pausa"
    if _OTRO_TEMA.search(texto) and not _DEL_EJERCICIO.search(texto):
        return "otro_tema"
    return None


def clasificar(mensaje: str, pasito: pasitos.Pasito) -> str:
    """acierto | pregunta | atorado (incluye respuestas equivocadas)."""
    texto = (mensaje or "").strip()
    if "?" in texto and _PREGUNTA.search(texto):
        return "pregunta"  # "¿porque pasó a 4/6?" es una duda, aunque traiga números
    if pasito.acierta(quitar_negados(texto)):
        # En un pasito intermedio, "¿70?" o "creo que 70" cuentan como acierto: Kiko se lo confirma y avanza (insistir
        # desespera al niño). Solo el resultado final necesita que lo afirme (ver tutor._anotar_si_lo_resolvio).
        return "pregunta" if (pasito.final and con_duda(texto)) else "acierto"
    if _PREGUNTA.search(texto):
        return "pregunta"
    return "atorado"


def _atascos(e: "Escalera", i: int) -> int:
    return (e.representaciones or []).count(f"atasco:{i}")


def _vencida(e: "Escalera") -> bool:
    if e.actualizado is None:
        return False
    hace = ahora() - (e.actualizado if e.actualizado.tzinfo else e.actualizado.replace(tzinfo=ahora().tzinfo))
    return hace.total_seconds() > VENCE_HORAS * 3600


def cerrar(db: Session, alumno_id: int, op: dict) -> None:
    """El alumno resolvió el ejercicio: queda marcado como resuelto (escalon = 0) para no volver a preguntárselo."""
    concepto, _ = aprendizaje.concepto_de_operacion(op)
    e = db.get(Escalera, (alumno_id, aprendizaje.firma(op)))
    if e is None:
        e = Escalera(alumno_id=alumno_id, firma=aprendizaje.firma(op), concepto=concepto, turnos=0, representaciones=[])
        db.add(e)
    e.escalon = 0
    e.pendiente = None
    e.actualizado = ahora()


def reiniciar(db: Session, alumno_id: int, op: dict) -> None:
    """El alumno escribió otra vez la cuenta: empieza de cero."""
    e = db.get(Escalera, (alumno_id, aprendizaje.firma(op)))
    if e:
        db.delete(e)
        db.flush()


def empezar_con_pista(db: Session, alumno_id: int, op: dict) -> None:
    """El alumno confirmó en el escáner una operación incorrecta: es un intento NUEVO (aunque antes haya resuelto la
    misma cuenta) y la pantalla ya le mostró la pista de su error. La escalera empieza en el escalón 1 (pista dada),
    así "Dame otra pista" pasa al primer pasito en vez de repetir la pista. No hace commit."""
    reiniciar(db, alumno_id, op)
    concepto, _ = aprendizaje.concepto_de_operacion(op)
    db.add(Escalera(alumno_id=alumno_id, firma=aprendizaje.firma(op), concepto=concepto, escalon=1, turnos=1,
                    representaciones=[], actualizado=ahora()))


_FIRMA = re.compile(r"^(\d+(?:/\d+)?)([×+−÷])(\d+(?:/\d+)?)$")
ACTIVA_MINUTOS = 60


def activa(db: Session, alumno_id: int, historial: list[dict]) -> dict | None:
    """El ejercicio que el alumno está trabajando AHORA (escalera abierta, de esta misma conversación).

    Así Kiko sigue con él hasta que lo resuelve, aunque en el chat aparezcan otras cuentas (las sub-preguntas de
    los pasitos, o lo que el alumno escribe al explicar). Solo cuenta si sus números aparecen en el historial
    (si el alumno reinició el chat, no se retoma).
    """
    from sqlalchemy import select
    e = db.scalars(select(Escalera).where(Escalera.alumno_id == alumno_id, Escalera.escalon > 0)
                   .order_by(Escalera.actualizado.desc())).first()
    if e is None or e.actualizado is None:
        return None
    hace = ahora() - (e.actualizado if e.actualizado.tzinfo else e.actualizado.replace(tzinfo=ahora().tzinfo))
    m = _FIRMA.match(e.firma)
    if hace.total_seconds() > ACTIVA_MINUTOS * 60 or not m:
        return None
    a, op, b = m.groups()
    textos = " ".join(x.get("texto") or "" for x in historial[-12:])
    if not (re.search(rf"\b{re.escape(a)}\b", textos) and re.search(rf"\b{re.escape(b)}\b", textos)):
        return None
    return operaciones.validar({"a": a, "op": op, "b": b, "c": ""})


class TurnoTutor(Base):
    """Último turno del tutor por alumno: ordena los turnos (un reintento viejo no toca nada), guarda la última
    respuesta (para reintentos) y la ayuda que falta anotar en la memoria hasta que el navegador confirme que la mostró."""
    __tablename__ = "turnos_tutor"

    alumno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    sesion: Mapped[str | None] = mapped_column(String(40), nullable=True)  # una por visita a la página
    numero: Mapped[int] = mapped_column(Integer, default=0)                 # sube con cada mensaje de esa visita
    turno: Mapped[str | None] = mapped_column(String(64), nullable=True)
    respuesta: Mapped[dict | None] = mapped_column(JSON(none_as_null=True), nullable=True)
    ayuda: Mapped[dict | None] = mapped_column(JSON(none_as_null=True), nullable=True)
    actualizado = mapped_column(DateTime(timezone=True), default=ahora, onupdate=ahora)


_ORDEN = re.compile(r"([\w-]{1,40}):(\d{1,9})")
TURNO_VIEJO = {"respuesta": "Ese mensaje ya lo había contestado. 🌱", "origen": "reglas", "dibujo": None}


def _orden(turno: str | None) -> tuple[str, int] | None:
    """"sesion:n" → (sesion, n). Otros formatos (clientes anteriores) no se ordenan."""
    m = _ORDEN.fullmatch(turno or "")
    return (m[1], int(m[2])) if m else None


def anotar_entrega(db: Session, alumno_id: int, turno: str, respuesta: dict, ayuda: dict | None) -> None:
    """Guarda la respuesta de este turno y deja la ayuda pendiente de confirmar. No hace commit."""
    t = db.get(TurnoTutor, alumno_id) or TurnoTutor(alumno_id=alumno_id)
    if t not in db:
        db.add(t)
    t.turno, t.respuesta, t.ayuda = turno, respuesta, ({**ayuda, "turno": turno} if ayuda else None)


# ---------------- Turnos: el avance cuenta solo si el navegador mostró la respuesta ----------------
# Cada mensaje del navegador trae `turno` (nuevo) y `recibido` (el último turno cuya respuesta SÍ mostró). El avance
# de la escalera queda pendiente hasta que un mensaje siguiente lo confirma con `recibido`; si no llega (respuesta
# descartada al cambiar de ejercicio, error de red), se descarta y el pasito se repite en vez de perderse.
# No hay petición de confirmación aparte: así un acuse repetido no puede avanzar dos veces.

def foto(db: Session, alumno_id: int, op: dict) -> dict | None:
    """Estado confirmado de la escalera antes de este mensaje (None si no había)."""
    e = db.get(Escalera, (alumno_id, aprendizaje.firma(op)))
    if e is None or e.escalon < 0:
        return None
    return {"escalon": e.escalon, "turnos": e.turnos, "representaciones": list(e.representaciones or [])}


def dejar_pendiente(db: Session, alumno_id: int, op: dict, antes: dict | None, turno: str, respuesta: dict) -> None:
    """El avance que acaba de calcular `siguiente_paso` queda pendiente; las columnas regresan a lo confirmado."""
    e = db.get(Escalera, (alumno_id, aprendizaje.firma(op)))
    if e is None:
        return
    nuevo = {"escalon": e.escalon, "turnos": e.turnos, "representaciones": list(e.representaciones or [])}
    base = antes or {"escalon": -1, "turnos": 0, "representaciones": []}
    e.escalon, e.turnos, e.representaciones = base["escalon"], base["turnos"], base["representaciones"]
    e.pendiente = {"turno": turno, "estado": nuevo, "respuesta": respuesta}


def sincronizar(db: Session, alumno_id: int, turno: str | None, recibido: str | None) -> dict | None:
    """Al llegar un mensaje: si es un reintento del mismo turno, regresa la respuesta ya dada (sin avanzar otra vez).
    Si no, aplica el avance pendiente que el navegador confirma con `recibido` y descarta los demás. No hace commit."""
    from sqlalchemy import select
    filas = [e for e in db.scalars(select(Escalera).where(Escalera.alumno_id == alumno_id)) if e.pendiente]
    if turno and (repetida := next((e.pendiente["respuesta"] for e in filas if e.pendiente["turno"] == turno), None)):
        return repetida
    t = db.get(TurnoTutor, alumno_id) if turno else None
    if t is not None and t.turno == turno and t.respuesta:
        return t.respuesta  # reintento del último turno: la misma respuesta
    orden = _orden(turno)
    if t is not None and orden and t.sesion == orden[0] and orden[1] < t.numero:
        return TURNO_VIEJO  # un turno anterior al último que llegó: no altera nada de lo posterior
    # (El mismo número sin respuesta guardada se vuelve a procesar: ese camino no había avanzado nada.)
    if turno:
        if t is None:
            t = TurnoTutor(alumno_id=alumno_id)
            db.add(t)
        if orden:
            t.sesion, t.numero = orden
        # La ayuda del turno anterior se anota en la memoria solo si el navegador confirma que la mostró.
        if t.ayuda:
            if recibido and t.ayuda.get("turno") == recibido:
                aprendizaje.registrar_ayuda_tutor(db, alumno_id, t.ayuda["concepto"], t.ayuda["nombre"], t.ayuda.get("dibujo"))
            t.ayuda = None
    for e in filas:
        if recibido and e.pendiente["turno"] == recibido:
            nuevo = e.pendiente["estado"]
            e.escalon, e.turnos, e.representaciones = nuevo["escalon"], nuevo["turnos"], nuevo["representaciones"]
            e.pendiente = None
        elif e.escalon < 0:
            db.delete(e)  # no se había empezado y el alumno no vio el primer pasito
        else:
            e.pendiente = None
    return None


def resuelta(db: Session, alumno_id: int, op: dict) -> bool:
    """¿Ya resolvió este ejercicio (en las últimas horas)?"""
    e = db.get(Escalera, (alumno_id, aprendizaje.firma(op)))
    return e is not None and e.escalon == 0 and not _vencida(e)


def siguiente_paso(db: Session, alumno_id: int, op: dict, mensaje: str, grado: str | None = None) -> dict:
    """Decide qué hace Kiko en este mensaje. Regresa {escalon, instruccion, dibujo, texto_fijo}. No hace commit.

    `escalon` (columna de la tabla): 1 = pista del error; 2 en adelante = pasito número escalon − 2.
    """
    concepto, _ = aprendizaje.concepto_de_operacion(op)
    fir = aprendizaje.firma(op)
    lista = pasitos.pasitos(op)
    e = db.get(Escalera, (alumno_id, fir))
    if e is not None and (_vencida(e) or e.escalon <= 0):  # vieja, resuelta o sin empezar: de cero
        db.delete(e)
        db.flush()
        e = None
    # Primero la intención: una pausa o un cambio de tema no son un atasco ni una respuesta al pasito.
    if clase := intencion(mensaje):
        return {"escalon": None, "avanza": False, "dibujo": None, "texto_fijo": None, "modo": clase,
                "instruccion": _INTENCIONES[clase]}

    d = operaciones.diagnosticar(op)
    if e is None:
        fila = db.get(aprendizaje.Aprendizaje, (alumno_id, concepto))
        # Los más pequeños, o si el tema le está costando: directo al primer pasito (concreto), sin pista abstracta.
        directo = grado in ("P1", "P2") or aprendizaje.estado(fila) == "necesita_refuerzo" or not d.get("pregunta")
        e = Escalera(alumno_id=alumno_id, firma=fir, concepto=concepto, escalon=2 if directo else 1, turnos=1,
                     representaciones=[])
        db.add(e)
        if not directo:
            return {"escalon": 1, "dibujo": None, "texto_fijo": None,
                    "instruccion": ("PASO 1: dale una pista sobre su error con UNA pregunta corta. Usa esta idea con tus "
                                    f"palabras: «{d['pregunta']}». No expliques nada más todavía.")}
        i, modo = 0, "presentar"
    else:
        e.turnos += 1
        if e.escalon == 1:
            i, modo = 0, "presentar"  # después de la pista, el primer pasito
            e.escalon = 2
        else:
            i = min(e.escalon - 2, len(lista) - 1)
            clase = clasificar(mensaje, lista[i])
            if clase == "acierto" and not lista[i].final:
                i, modo = i + 1, "acierto"
            elif clase == "pregunta" and lista[i].porque:
                modo = "pregunta"
            elif _atascos(e, i) == 0 or lista[i].final:
                modo = "reexplicar"
                e.representaciones = (e.representaciones or []) + [f"atasco:{i}"]
            else:
                modo = "resolver_pasito"  # segunda vez atorado en un pasito intermedio: se le dice cuánto da y se avanza
            e.escalon = 2 + (i + 1 if modo == "resolver_pasito" else i)

    p = lista[i]
    dibujo = None
    if modo in ("presentar", "acierto"):
        texto_fijo = p.pregunta
        if grado in ("P1", "P2") and p.dibujo:
            dibujo = p.dibujo  # a los más pequeños, siempre con algo concreto
        que = ("lo reconozca con calidez porque contestó bien el pasito anterior (por ejemplo «¡Eso es!»)"
               if modo == "acierto" else "lo anime a empezar")
    elif modo == "pregunta":
        # "¿Por qué?" merece su propia respuesta (no la misma que "no entiendo").
        texto_fijo, dibujo = (f"{p.porque} {p.pregunta}" if p.porque else p.reexplicar), p.dibujo
        que = "le diga que es muy buena pregunta"
    elif modo == "reexplicar":
        texto_fijo, dibujo = p.reexplicar, p.dibujo
        que = "le diga que lo vamos a ver más despacio"
        if p.final:
            # En el último pasito, cada vez que se atora recibe una ayuda DISTINTA (nunca la misma dos veces):
            # explicación concreta → contar juntos (si hay) → ejemplo parecido con otros números → descanso.
            ejemplo = ejemplo_parecido(op)
            ayudas = [(p.reexplicar, p.dibujo, "le diga que lo vamos a ver más despacio")]
            if p.reexplicar2:
                ayudas.append((p.reexplicar2, None, "le proponga hacerlo juntos, poquito a poco"))
            if ejemplo:
                ayudas.append((f"Mira uno parecido, con otros números: {ejemplo} Ahora intenta el tuyo.", None,
                               "le diga que vamos a ver uno parecido"))
            veces = _atascos(e, i)
            if veces <= len(ayudas):
                texto_fijo, dibujo, que = ayudas[veces - 1]
            else:
                texto_fijo = (p.reexplicar + " Si te cansaste, descansamos un ratito y seguimos después, "
                              "o lo ves con tu maestra o maestro.")
                que = "lo anime con cariño y reconozca su esfuerzo"
    else:  # resolver_pasito
        siguiente = lista[i + 1]
        texto_fijo = f"{p.resuelto} {siguiente.pregunta}"
        que = "le diga que este pasito lo hacemos juntos"
    return {"escalon": e.escalon, "dibujo": dibujo, "texto_fijo": texto_fijo, "modo": modo,
            "instruccion": f"PASITO {min(e.escalon - 1, len(lista))} de {len(lista)} ({modo}): " + _RECONOCER.format(que=que)}
