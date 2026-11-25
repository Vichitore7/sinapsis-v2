"""Tutor de IA: Kiko responde con preguntas socráticas usando Claude, sin dar nunca la respuesta.

Su manual es `app/agente.md` (personalidad, reglas, cómo adaptarse al alumno, fuentes). Se le manda a Claude
en cada mensaje junto con el material de estudio (`docs/material-de-estudio/`) del grado del alumno.

Cómo decide qué contestar:
1. Si no hay clave, se pasó el límite del alumno, no hay internet o Claude rechaza la petición,
   contesta con las pistas por reglas de siempre. Así a nadie se le rompe la app.
2. Si Claude contesta, un filtro revisa que la respuesta NO traiga el resultado del ejercicio (el escaneado
   o una cuenta que el alumno escribió en el chat). Si lo trae, se tira y se usan las reglas.

A Claude solo le llegan el manual, el material, la operación, el grado y lo que el alumno escribió en el chat:
ni su apodo ni su id.
"""
from __future__ import annotations

import json
import logging
import re
import threading
import time
from collections import defaultdict
from fractions import Fraction
from functools import lru_cache
from pathlib import Path

import anthropic

from . import aprendizaje, config, dibujos, estrategia, operaciones

log = logging.getLogger("selva.tutor")

MAX_HISTORIAL = 10        # mensajes anteriores que se mandan a Claude
MAX_TEXTO = 300           # caracteres por mensaje del historial
MAX_RESPUESTA = 700       # caracteres de la respuesta de Kiko (cabe un dibujo corto)

MANUAL = Path(__file__).resolve().parent / "agente.md"

# Archivo del material de estudio para cada grado (P = primaria, S = secundaria).
MATERIAL_POR_GRADO = {
    "P1": "primaria-1-2.md", "P2": "primaria-1-2.md",
    "P3": "primaria-3-4.md", "P4": "primaria-3-4.md",
    "P5": "primaria-5-6.md", "P6": "primaria-5-6.md",
    "S1": "secundaria-1-3.md", "S2": "secundaria-1-3.md", "S3": "secundaria-1-3.md",
}
NOMBRE_GRADO = {"P": "de primaria", "S": "de secundaria"}


# ---------------- Manual y material de estudio ----------------

def grado_corto(grado: str | None) -> str | None:
    """'Primaria • 4°' -> 'P4'; 'Secundaria • 2° Año' -> 'S2'. None si no se entiende."""
    m = re.search(r"(primaria|secundaria)\D*(\d)", (grado or "").lower())
    if not m:
        return None
    clave = f"{m.group(1)[0].upper()}{m.group(2)}"
    return clave if clave in MATERIAL_POR_GRADO else None


def _leer(ruta: Path) -> str:
    try:
        return ruta.read_text(encoding="utf-8")
    except OSError:
        log.warning("tutor: no encontré %s; sigo sin ese archivo", ruta)
        return ""


def _sin_ideas_de_mundo(texto: str) -> str:
    """Quita las 'Ideas de mundo' del material: son notas del equipo para diseñar niveles, no para el alumno."""
    salida, saltando = [], False
    for linea in texto.splitlines():
        if re.match(r"^Ideas? de mundo", linea):
            saltando = True
            continue
        if saltando and (linea.startswith("- ") or linea.startswith("  ") or not linea.strip()):
            if not linea.strip():
                saltando = False
            continue
        saltando = False
        salida.append(linea)
    return "\n".join(salida)


@lru_cache(maxsize=16)
def sistema(grado: str | None) -> str:
    """Manual + material del grado. No cambia entre mensajes del mismo grado, así que Claude lo puede cachear."""
    partes = [_leer(MANUAL)]
    carpeta = config.MATERIAL_DIR
    archivos = ["progresion-por-tema.md"]
    if grado in MATERIAL_POR_GRADO:
        archivos.insert(0, MATERIAL_POR_GRADO[grado])
    for nombre in archivos:
        texto = _sin_ideas_de_mundo(_leer(carpeta / nombre))
        if texto:
            partes.append(f"---\n\n# Material de estudio de referencia: {nombre}\n"
                          "(Resumen del equipo de los programas SEP 2024. Úsalo para saber qué temas y prerrequisitos "
                          "corresponden al alumno; no lo cites textual.)\n\n" + texto)
    return "\n\n".join(p for p in partes if p)


# ---------------- Límite de uso por alumno ----------------

class Limite:
    """Cuenta los mensajes a Claude por alumno (en memoria: suficiente para un solo servidor)."""

    def __init__(self) -> None:
        self._usos: dict[int, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def permitir(self, alumno_id: int) -> bool:
        t = time.monotonic()
        with self._lock:
            usos = [x for x in self._usos[alumno_id] if t - x < 86400]
            ultima_hora = sum(1 for x in usos if t - x < 3600)
            if len(usos) >= config.TUTOR_LIMITE_DIA or ultima_hora >= config.TUTOR_LIMITE_HORA:
                self._usos[alumno_id] = usos
                return False
            usos.append(t)
            self._usos[alumno_id] = usos
            return True

    def reiniciar_todo(self) -> None:
        with self._lock:
            self._usos.clear()


limite = Limite()


# ---------------- Filtro: la respuesta no puede traer el resultado ----------------

_UNIDADES = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez",
             "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
             "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis",
             "veintisiete", "veintiocho", "veintinueve"]
_DECENAS = {30: "treinta", 40: "cuarenta", 50: "cincuenta", 60: "sesenta", 70: "setenta", 80: "ochenta",
            90: "noventa", 100: "cien"}


def _en_palabras(n: int) -> list[str]:
    """Cómo se escribe n (0 a 100) con letra. Para números más grandes basta con revisar las cifras."""
    if 0 <= n < 30:
        return [_UNIDADES[n], _UNIDADES[n].replace("é", "e").replace("ó", "o")]
    if n in _DECENAS:
        return [_DECENAS[n]]
    if 30 < n < 100:
        return [f"{_DECENAS[n - n % 10]} y {_UNIDADES[n % 10]}"]
    return []


def _sin_acentos(t: str) -> str:
    return t.translate(str.maketrans("áéíóúü", "aeiouu"))


def numeros_en(texto: str) -> list[int]:
    # "1,250" o "1 250" cuentan como un solo número.
    limpio = re.sub(r"(?<=\d)[,\s.](?=\d{3}(?!\d))", "", texto or "")
    return [int(x) for x in re.findall(r"\d+", limpio)]


_FRACCION = re.compile(r"(\d+)\s*/\s*(\d+)")


def trae_resultado(texto: str, resultado: int) -> bool:
    """¿El texto dice este resultado entero? Los números dentro de una fracción ("1/2") no cuentan como sueltos,
    pero una fracción que VALE el resultado ("4/4" cuando es 1) sí lo revela."""
    for n, d in _FRACCION.findall(texto or ""):
        if int(d) and Fraction(int(n), int(d)) == resultado:
            return True
    if abs(resultado) in numeros_en(_FRACCION.sub(" ", texto or "")):
        return True
    t = _sin_acentos(texto.lower())
    return any(re.search(rf"\b{re.escape(_sin_acentos(p))}\b", t) for p in _en_palabras(abs(resultado)))


_NUM = r"\d+(?:\s*/\s*\d+)?"
_CUENTA = re.compile(rf"({_NUM})\s*([x×*+\-−–÷:])\s*({_NUM})")


def _secreto(op: dict) -> dict | None:
    """Lo que Kiko no puede decir de una operación (si el alumno no la tiene bien)."""
    d = operaciones.diagnosticar(op)
    if d["correcto"]:
        return None
    r = operaciones.resultado(op)
    visibles = {n for n in (operaciones.numero(op["a"]), operaciones.numero(op["b"]), operaciones.numero(op["c"])) if n is not None}
    if "cociente" in r:
        return {"tipo": "entero", "valor": r["cociente"], "visibles": visibles}
    v = r["valor"]
    return {"tipo": "entero" if v.denominator == 1 else "fraccion", "valor": int(v) if v.denominator == 1 else v,
            "visibles": visibles}


def cuentas_en(texto: str) -> list[dict]:
    """Cuentas que el alumno escribió en el chat ("cuánto es 345 x 12", "3/4 + 1/2"), para no darle su resultado."""
    salida = []
    for a, op, b in _CUENTA.findall(texto or ""):
        o = operaciones.validar({"a": a, "op": op, "b": b, "c": ""})
        if o:
            s = _secreto(o)
            if s:
                salida.append(s)
    return salida


def _bloqueada(texto: str, mensaje: str, secretos: list[dict]) -> bool:
    """¿La respuesta de Claude revela algún resultado que el alumno todavía no dijo?"""
    for s in secretos:
        v = s["valor"]
        if v in s["visibles"]:
            continue  # 7 × 1 = 7: no se puede filtrar por cifras sin bloquear todo
        if s["tipo"] == "fraccion":
            if operaciones.trae_fraccion(mensaje, v):
                continue  # el alumno ya lo dijo: Kiko puede repetirlo para felicitarlo
            if operaciones.trae_fraccion(texto, v):
                return True
            continue
        # Si el alumno ya lo dijo (un solo número nuevo), Kiko puede repetirlo para felicitarlo.
        nuevos = {Fraction(n) for n in numeros_en(mensaje)} - s["visibles"]
        if nuevos == {v}:
            continue
        if trae_resultado(texto, v):
            return True
    return False


def _dibujo_revela(dibujo: dict, mensaje: str, secretos: list[dict]) -> bool:
    """¿Contar o leer el dibujo da un resultado secreto? (enteros, fracciones —aunque sean equivalentes— o texto)."""
    enteros, fracciones, texto = dibujos.valores_que_muestra(dibujo)
    if _bloqueada(" ".join(map(str, enteros)) + " " + texto, mensaje, secretos):
        return True
    for s in secretos:
        if s["valor"] in s["visibles"] or operaciones.trae_fraccion(mensaje, Fraction(s["valor"])):
            continue
        if any(f == s["valor"] for f in fracciones):  # una pizza que vale el resultado (aunque sea equivalente)
            return True
    return False


# ---------------- Pistas por reglas (las de siempre, sin IA) ----------------

LIMITE_ALCANZADO = ("¡Hoy platicamos un montón! Voy a descansar un ratito para recargar energía. 🌱 "
                    "Mientras, puedes escanear una operación de tu cuaderno y te doy pistas, o vuelve en un rato.")

# Respaldo sin IA cuando el ejercicio ya está resuelto (antes decía "Primero escanea tu operación").
YA_RESUELTA = ("¡Ese ejercicio ya lo resolviste! 🌟 Cuéntame cómo lo pensaste, o escanea otro para seguir "
               "practicando.")


# Respaldo sin IA cuando el alumno quiere descansar (no es un atasco: no se le da otra pista).
PAUSA_REGLAS = "¡Claro! Descansa un rato. Tu ejercicio te espera aquí cuando regreses. 🌱"

# Respaldo sin IA cuando dice el número correcto, pero preguntando o sin estar seguro: ni se confirma ni se niega.
CON_DUDA = "¿Cómo llegaste a ese número? Cuéntame tus pasos y lo comprobamos juntos. 🔍"


def _con_duda(mensaje: str) -> bool:
    return estrategia.con_duda(mensaje)  # la misma regla que usan los pasitos (app/estrategia.py)


def _ya_lo_dijo(op: dict, mensaje: str) -> bool:
    s = _secreto(op)
    if not s:
        return False
    mensaje = estrategia.quitar_negados(mensaje)  # "no es 42" no es decir 42
    if s["tipo"] == "fraccion":
        return operaciones.trae_fraccion(mensaje, s["valor"])
    return s["valor"] in numeros_en(mensaje)


def por_reglas(operacion: dict | None, mensaje: str) -> str:
    """La misma lógica que tenía el chat del escáner en el navegador, ahora también con fracciones y divisiones."""
    if not operacion:
        return "Primero escanea o escribe tu operación, así sé de qué estamos platicando. 📸"
    d = operaciones.diagnosticar(operacion)
    if d["correcto"] is None:
        return "Primero resuélvela en tu cuaderno y cuéntame qué resultado te salió. ¡Tú puedes! 💪"
    if d["correcto"]:
        return "¡Tu operación ya estaba bien! Explícame cómo lo pensaste: eso también es aprender."
    if _ya_lo_dijo(operacion, mensaje) and _con_duda(mensaje):
        return CON_DUDA  # no se confirma un número que el alumno solo está adivinando
    if _ya_lo_dijo(operacion, mensaje):
        return "¡Exacto, explorador! 🌟 Ahora corrígelo en tu cuaderno y escanéalo otra vez para ver tu sendero derecho."
    return f"Vamos a revisarlo juntos: {d['pregunta']}"


# ---------------- Llamada a Claude ----------------

_cliente: anthropic.Anthropic | None = None


def _cliente_claude() -> anthropic.Anthropic:
    global _cliente
    if _cliente is None:
        _cliente = anthropic.Anthropic(timeout=20.0, max_retries=1)
    return _cliente


def _contexto(operacion: dict | None, grado: str | None, ejercicio: str | None = None, memoria: str = "",
              paso: dict | None = None, del_chat: bool = False, verificacion: str | None = None) -> str:
    lineas = ["# Datos de esta conversación"]
    if verificacion:
        lineas.append(verificacion)
    if grado:
        lineas.append(f"Grado del alumno: {grado[1]}.º {NOMBRE_GRADO[grado[0]]}.")
    else:
        lineas.append("Grado del alumno: no lo sabemos; dedúcelo con cuidado.")
    if memoria:
        lineas.append("Lo que la app sabe de este alumno (memoria guardada entre sesiones; la calcula el código, "
                      "no la menciones como un registro):\n" + memoria)
    else:
        lineas.append("Todavía no sabemos nada de cómo aprende este alumno: empieza sencillo y observa.")
    if ejercicio:
        lineas.append(f"Ejercicio de su cuaderno que el alumno confirmó (lo leímos de su foto): «{ejercicio}». "
                      "Guíalo para que lo resuelva él; no lo resuelvas ni des el resultado.")
    if not operacion:
        if not ejercicio:
            lineas.append("No hay operación escaneada: el alumno quiere platicar o tiene una duda de un tema. "
                          "Si escribe un ejercicio suyo, guíalo sin resolverlo.")
        return "\n".join(lineas)
    a, op, b, c = operacion["a"], operacion["op"], operacion["b"], operacion["c"]
    residuo = f" residuo {operacion['residuo']}" if operacion.get("residuo") else ""
    d = operaciones.diagnosticar(operacion)
    if del_chat:
        lineas.append(f"El alumno quiere resolver esta cuenta (la escribió en el chat): {a} {op} {b}. "
                      "Ese es SU ejercicio: no lo olvides ni cambies de tema.")
    else:
        lineas.append(f"Operación que escribió el alumno en su cuaderno: {a} {op} {b} = {c or '(todavía sin resultado)'}{residuo}.")
    tipo_op = operaciones.tipo(operacion)
    if tipo_op == "fracciones":
        lineas.append("Es una operación con fracciones. Las fracciones equivalentes cuentan como correctas.")
    if d["correcto"] is None:
        lineas.append(f"Todavía no escribe su resultado. El resultado correcto es {operaciones.resultado_texto(operacion)}: "
                      "es SECRETO, nunca lo digas ni lo insinúes. Ayúdalo a empezar.")
    elif d["correcto"]:
        lineas.append("Su resultado ES correcto.")
        if d.get("pregunta"):
            lineas.append(f"Detalle: {d['pregunta']}")
    else:
        lineas.append(f"Su resultado NO es correcto. El resultado correcto es {operaciones.resultado_texto(operacion)}: "
                      "es SECRETO, nunca lo digas ni lo insinúes.")
        explicacion = {"sumo": f"Parece que sumó {a} + {b} en lugar de multiplicar.",
                       "sumo_denominadores": "Parece que sumó (o restó) numeradores y denominadores por separado.",
                       "multiplico": "Parece que multiplicó las fracciones en lugar de dividir.",
                       "residuo_grande": "Su residuo es más grande que el divisor: todavía cabía otro grupo.",
                       "residuo": "Su cociente está bien pero el residuo no.",
                       "no_llevo": "Parece que no llevó la decena al sumar las unidades.",
                       "no_pidio": "Parece que no pidió prestado en las unidades.",
                       "un_grupo": "Parece que juntó un grupo de más o de menos."}.get(d["tipo_error"])
        if explicacion:
            lineas.append(explicacion)
        if not paso:
            lineas.append(f"Una buena primera pregunta para guiarlo: {d['pregunta']}")
    if paso:
        lineas.append("\n# Qué hacer en este mensaje (lo decide la app; síguelo)\n" + paso["instruccion"])
        if not paso.get("dibujo"):
            lineas.append("En esta operación los dibujos los pone la app: deja `dibujo` en null y no digas \"mira el dibujo\".")
    return "\n".join(lineas)


def _mensajes(historial: list[dict], mensaje: str) -> list[dict]:
    salida: list[dict] = []
    for m in historial[-MAX_HISTORIAL:]:
        texto = (m.get("texto") or "").strip()[:MAX_TEXTO]
        if not texto:
            continue
        rol = "assistant" if m.get("de") == "kiko" else "user"
        if not salida and rol == "assistant":
            continue  # la conversación debe empezar con el alumno
        salida.append({"role": rol, "content": texto})
    salida.append({"role": "user", "content": mensaje})
    return salida


def _anotar_uso(r, segundos: float) -> None:
    """Tokens y tiempo de cada respuesta, para comparar esfuerzos y modelos (solo números, nada del alumno)."""
    u = getattr(r, "usage", None)
    if u is None:
        return
    log.info("tutor: %s esfuerzo=%s · %.1f s · entrada %s (caché %s) · salida %s",
             config.TUTOR_MODELO, config.TUTOR_ESFUERZO, segundos, getattr(u, "input_tokens", "?"),
             getattr(u, "cache_read_input_tokens", 0) or 0, getattr(u, "output_tokens", "?"))


def _preguntar_a_claude(operacion: dict | None, grado: str | None, mensaje: str, historial: list[dict],
                        ejercicio: str | None = None, memoria: str = "", paso: dict | None = None,
                        del_chat: bool = False, verificacion: str | None = None) -> dict | None:
    """Regresa {"respuesta": texto, "dibujo": dibujo sin validar o None}, o None si hay que usar las reglas."""
    inicio = time.monotonic()
    try:
        r = _cliente_claude().messages.create(
            model=config.TUTOR_MODELO,
            max_tokens=1500,
            # Formato fijo: el texto de Kiko y, si ayuda, un dibujo que la app pinta con los stickers del juego.
            output_config={"effort": config.TUTOR_ESFUERZO,
                           "format": {"type": "json_schema", "schema": dibujos.ESQUEMA}},
            # El manual y el material van primero y no cambian: se cachean. Los datos de la conversación, al final.
            system=[
                {"type": "text", "text": sistema(grado), "cache_control": {"type": "ephemeral"}},
                {"type": "text", "text": _contexto(operacion, grado, ejercicio, memoria, paso, del_chat, verificacion)},
            ],
            messages=_mensajes(historial, mensaje),
        )
    except anthropic.APIConnectionError:
        log.warning("tutor: sin conexión con Claude; uso reglas")
        return None
    except anthropic.NotFoundError:
        log.error("tutor: el modelo %r no existe. Revisa TUTOR_MODELO en backend/.env (p. ej. claude-haiku-5-5)", config.TUTOR_MODELO)
        return None
    except anthropic.RateLimitError:
        log.warning("tutor: Claude limitó la cuenta (429); uso reglas")
        return None
    except anthropic.APIStatusError as e:
        log.warning("tutor: Claude respondió %s (request %s); uso reglas", e.status_code, e.request_id)
        return None
    _anotar_uso(r, time.monotonic() - inicio)
    if r.stop_reason == "refusal":
        # Haiku 5.5 no tiene respaldo del servidor cuando rechaza: usamos las reglas.
        categoria = r.stop_details.category if r.stop_details else None
        log.info("tutor: Claude rechazó la petición (%s); uso reglas", categoria)
        return None
    if r.stop_reason not in ("end_turn", "stop_sequence"):
        log.info("tutor: respuesta incompleta (%s); uso reglas", r.stop_reason)
        return None
    crudo = "".join(b.text for b in r.content if b.type == "text")
    try:
        datos = json.loads(crudo)
    except ValueError:
        log.info("tutor: Claude no regresó JSON válido; uso reglas")
        return None
    # 🦎 es una lagartija, no un ajolote: por si acaso se le escapa.
    texto = str(datos.get("respuesta") or "").replace("🦎", "").strip()[:MAX_RESPUESTA]
    return {"respuesta": texto, "dibujo": datos.get("dibujo")} if texto else None


_GENERO = [(re.compile(r"\bsolit[oa]s?\b", re.I), "por tu cuenta"),
           (re.compile(r"\b(llegaste|lo hiciste|lo lograste|lo resolviste)( ah[ií])? sol[oa]\b", re.I), r"\1\2 por tu cuenta")]


def _sin_genero(texto: str) -> str:
    """Solo conocemos el apodo: quita lo más común que supone si es niño o niña (el manual ya lo pide, pero Haiku a
    veces lo olvida: "llegaste ahí solito")."""
    for patron, cambio in _GENERO:
        texto = patron.sub(cambio, texto)
    return texto


def _operacion_del_chat(mensaje: str, historial: list[dict]) -> tuple[dict | None, str]:
    """La cuenta que el alumno escribió en el chat ("cuánto es 800 + 77").

    Se toma como su ejercicio: así usa la misma escalera de pasitos verificados y Kiko no olvida qué quería resolver.
    Regresa (operación, estado): estado "nueva" (la escribió en este mensaje), "sigue" (de mensajes anteriores) o
    "resuelta" (en un mensaje posterior ya dijo el resultado).
    """
    textos = [mensaje] + [m.get("texto") or "" for m in reversed(historial[-MAX_HISTORIAL:]) if m.get("de") != "kiko"]
    for i, t in enumerate(textos):
        # "70 + 13 = 83" es una respuesta (trae su resultado), no una cuenta nueva por resolver.
        sin_respuestas = re.sub(rf"{_NUM}\s*[x×*+\-−–÷:]\s*{_NUM}\s*=\s*\d+", " ", t)
        for a, op, b in reversed(_CUENTA.findall(sin_respuestas)):
            o = operaciones.validar({"a": a, "op": op, "b": b, "c": ""})
            if o is None:
                continue
            if i == 0:
                return o, "nueva"
            if any(_ya_lo_dijo(o, posterior) for posterior in textos[:i]):
                return o, "resuelta"
            return o, "sigue"
    return None, ""


_PIDE_OTRA = re.compile(r"quiero (resolver|hacer)|cu[aá]nto es|ay[uú]dame|resuelve|otro ejercicio|otra cuenta", re.I)
_PRACTICA = re.compile(rf"(?:cu[aá]nto (?:es|da|te da|ser[ií]a)|resuelve|prueba(?:lo)? con|intenta(?:lo)? con|"
                       rf"si tuvieras|qu[eé] tal|ahora con|te reto con|practica con)\s*:?\s*"
                       rf"({_NUM})\s*([x×*+\-−–÷:])\s*({_NUM})", re.I)


def _practica_de_kiko(historial: list[dict], mensaje: str) -> dict | None:
    """Si Kiko propuso un ejercicio para practicar ("¿cuánto es 245 + 137?") y el alumno lo está contestando, ese es
    ahora su ejercicio: con su respuesta como resultado, para diagnosticarlo con el código."""
    ultimo_kiko = next((m.get("texto") or "" for m in reversed(historial) if m.get("de") == "kiko"), "")
    encontrados = _PRACTICA.findall(ultimo_kiko)
    if not encontrados:
        return None
    a, op, b = encontrados[-1]
    numeros = [n for n in numeros_en(_FRACCION.sub(" ", mensaje or "")) if str(n) not in (a, b)]
    return operaciones.validar({"a": a, "op": op, "b": b, "c": str(numeros[-1]) if numeros else ""})


_EXPRESION = re.compile(r"(\d+)\s*(\+|−|-|×|x|\*|÷|más|menos|por|entre|y)\s*(\d+)", re.I)


def _verificar_respuesta(historial: list[dict], mensaje: str) -> str | None:
    """Si Kiko preguntó una cuenta ("¿cuánto suman 70 y 7?") y el alumno contestó con un número, el CÓDIGO dice si
    está bien. Haiku llegó a decirle a un alumno que 70 + 7 no era 77."""
    ultimo_kiko = next((m.get("texto") or "" for m in reversed(historial) if m.get("de") == "kiko"), "")
    respuestas = numeros_en(_FRACCION.sub(" ", mensaje or ""))
    if not ultimo_kiko or not respuestas:
        return None
    expresiones = _EXPRESION.findall(ultimo_kiko)
    if not expresiones:
        return None
    a, palabra, b = expresiones[-1]  # la última cuenta que mencionó (normalmente la de su pregunta)
    palabra = palabra.lower()
    if palabra == "y":
        if re.search(r"suma|junt|agreg|más", ultimo_kiko, re.I):
            palabra = "+"
        elif re.search(r"rest|quit|menos", ultimo_kiko, re.I):
            palabra = "−"
        else:
            return None
    signo = {"más": "+", "menos": "−", "por": "×", "entre": "÷", "x": "×", "*": "×", "-": "−"}.get(palabra, palabra)
    o = operaciones.validar({"a": a, "op": signo, "b": b, "c": ""})
    if o is None or operaciones.tipo(o) == "division" and int(a) % int(b):
        return None
    correcto = operaciones.resultado(o)["valor"]
    cuenta = f"{a} {o['op']} {b}"
    if any(Fraction(r) == correcto for r in respuestas):
        return (f"VERIFICADO POR LA APP: el alumno contestó bien tu pregunta ({cuenta}). Reconócelo con claridad y "
                "avanza al siguiente paso; no le digas que está mal.")
    return (f"VERIFICADO POR LA APP: el alumno contestó {respuestas[-1]} a {cuenta} y no es correcto. Guíalo con una "
            "pista para ese mismo paso, sin decir el número correcto.")


_LUGARES = ["unidades", "decenas", "centenas", "unidades de millar", "decenas de millar", "centenas de millar", "millones"]


def _valor_posicional(mensaje: str, historial: list[dict]) -> str | None:
    """Datos verificados de valor posicional de los números que menciona el alumno (Haiku llegó a decir que el
    7 de 877 valía 77). Son para que Kiko revise lo que dice el alumno, no para dárselos."""
    textos = [mensaje] + [m.get("texto") or "" for m in reversed(historial[-6:]) if m.get("de") != "kiko"]
    vistos: list[str] = []
    for t in textos:
        for n in re.findall(r"\b\d{2,7}\b", _FRACCION.sub(" ", t)):
            if n not in vistos:
                vistos.append(n)
    if not vistos:
        return None
    lineas = []
    for n in vistos[:2]:
        partes_ = [f"el {c} vale {int(c) * 10 ** (len(n) - 1 - i)} ({_LUGARES[len(n) - 1 - i]})"
                   for i, c in enumerate(n) if c != "0"]
        lineas.append(f"en {n}: " + ", ".join(partes_))
    return ("Datos de valor posicional VERIFICADOS por la app (úsalos para revisar lo que dice el alumno; no se los "
            "digas directamente): " + "; ".join(lineas) + ".")


def _anotar_si_lo_resolvio(db, alumno_id: int, operacion: dict | None, mensaje: str) -> bool:
    """Si el alumno dijo en el chat el resultado de una operación que tenía mal, cuenta como resuelta con ayuda."""
    if db is None or not operacion or not _ya_lo_dijo(operacion, mensaje) or _con_duda(mensaje):
        return False
    concepto, nombre = aprendizaje.concepto_de_operacion(operacion)
    fila = db.get(aprendizaje.Aprendizaje, (alumno_id, concepto))
    if fila and aprendizaje.firma(operacion) in (fila.pendientes or []):
        aprendizaje.registrar_resultado(db, alumno_id, concepto, nombre, "ayuda", None, aprendizaje.firma(operacion))
    estrategia.cerrar(db, alumno_id, operacion)  # ya lo resolvió: se acaba su escalera de pistas
    db.commit()
    return True


def responder(alumno_id: int, operacion: dict | None, mensaje: str, historial: list[dict],
              grado: str | None = None, ejercicio: str | None = None, db=None,
              turno: str | None = None, recibido: str | None = None) -> dict:
    """Contrato: {"respuesta": str, "origen": "claude" | "reglas", "dibujo": dict | None}.

    Con `db`, lee y actualiza la memoria de aprendizaje del alumno (app/aprendizaje.py).
    Con `turno`, el avance de la escalera queda pendiente hasta que el navegador confirma con `recibido`
    (en su siguiente mensaje) que sí mostró esta respuesta; un reintento del mismo turno recibe la misma respuesta.
    """
    # 0) Turnos: ¿reintento del mismo mensaje? ¿El navegador mostró la respuesta anterior?
    if db is not None and turno:
        repetida = estrategia.sincronizar(db, alumno_id, turno, recibido)
        db.commit()
        if repetida is not None:
            return repetida
    # 1) Su operación del escáner: ¿la acaba de resolver en el chat, o ya la había resuelto antes?
    resolvio = _anotar_si_lo_resolvio(db, alumno_id, operacion, mensaje)
    resuelta_antes = None
    if operacion and db is not None and not resolvio and estrategia.resuelta(db, alumno_id, operacion):
        resuelta_antes, operacion = operacion, None  # ya no se le vuelve a preguntar
    # 2) Sin operación: una cuenta que escribió en el chat, o la de práctica que le propuso Kiko, es su ejercicio.
    resuelta_chat = False
    del_chat = operacion is None and not ejercicio
    if del_chat:
        op_alumno, estado_chat = _operacion_del_chat(mensaje, historial)
        pide_otra = bool(_PIDE_OTRA.search(mensaje or ""))
        en_curso = estrategia.activa(db, alumno_id, historial) if db is not None else None
        practica = _practica_de_kiko(historial, mensaje)
        # Prioridad: 1) pide explícitamente otra cuenta; 2) sigue con su ejercicio en curso hasta resolverlo
        # (aunque en el chat aparezcan sub-preguntas como "¿40 + 30?"); 3) la práctica que acaba de proponer Kiko;
        # 4) una cuenta que escribió. Una cuenta "nueva" dentro de su respuesta ("7 + 5 son 13… sería 373") no es otra.
        if op_alumno is not None and estado_chat == "nueva" and pide_otra:
            operacion = op_alumno
        elif en_curso is not None:
            operacion, estado_chat = en_curso, "sigue"
        elif practica is not None:
            operacion, estado_chat = practica, "practica"
        else:
            operacion = op_alumno
        if estado_chat == "resuelta" and op_alumno is not None and db is not None:
            estrategia.cerrar(db, alumno_id, op_alumno)
            db.commit()
        if db is not None and operacion is not None and estado_chat == "nueva":
            estrategia.reiniciar(db, alumno_id, operacion)  # la escribió otra vez: empieza de cero
            db.commit()
        if estado_chat == "resuelta":
            operacion, resuelta_chat = None, True
        if operacion is not None and db is not None and estrategia.resuelta(db, alumno_id, operacion):
            operacion, resuelta_chat = None, True
        if operacion is not None and not resolvio:
            resolvio = _anotar_si_lo_resolvio(db, alumno_id, operacion, mensaje)
    del_chat = del_chat and operacion is not None
    ya_resuelta = resuelta_antes is not None or (operacion is None and resuelta_chat)
    reglas = {"respuesta": YA_RESUELTA if ya_resuelta and not operacion else por_reglas(operacion, mensaje),
              "origen": "reglas", "dibujo": None}
    if not config.TUTOR_ACTIVO:
        return reglas
    if not limite.permitir(alumno_id):
        log.info("tutor: el alumno %s llegó a su límite de mensajes (%s por hora, %s por día); uso reglas",
                 alumno_id, config.TUTOR_LIMITE_HORA, config.TUTOR_LIMITE_DIA)
        if operacion:
            return reglas  # las pistas por reglas de su operación siguen sirviendo
        return {**reglas, "respuesta": LIMITE_ALCANZADO}
    grado = grado_corto(grado)
    concepto = aprendizaje.concepto_de_operacion(operacion) if operacion else None
    memoria = aprendizaje.resumen_para_tutor(db, alumno_id, concepto[0] if concepto else None) if db is not None else ""
    # Fase 2: el backend decide el escalón de ayuda (solo si la operación está mal o sin resultado).
    paso, antes = None, None
    duda = bool(operacion) and not resolvio and _ya_lo_dijo(operacion, mensaje) and _con_duda(mensaje)
    if (db is not None and operacion and not resolvio and not duda
            and operaciones.diagnosticar(operacion)["correcto"] is not True):
        # Sin commit todavía: el avance se guarda solo si el alumno recibe este pasito (ver `sin_claude`).
        antes = estrategia.foto(db, alumno_id, operacion)
        paso = estrategia.siguiente_paso(db, alumno_id, operacion, mensaje, grado)

    def entregar(respuesta: dict, dibujo_tipo: str | None = None, anota_ayuda: bool = False) -> dict:
        """Guarda y entrega. Con turno, el avance de la escalera y la ayuda en la memoria quedan pendientes de que
        el navegador confirme (en su siguiente mensaje) que mostró esta respuesta. Sin turno, se guardan ya."""
        if db is not None:
            ayuda = ({"concepto": concepto[0], "nombre": concepto[1], "dibujo": dibujo_tipo}
                     if anota_ayuda and concepto else None)
            if turno:
                if paso and paso.get("avanza", True):
                    estrategia.dejar_pendiente(db, alumno_id, operacion, antes, turno, respuesta)
                estrategia.anotar_entrega(db, alumno_id, turno, respuesta, ayuda)
            elif ayuda:
                aprendizaje.registrar_ayuda_tutor(db, alumno_id, ayuda["concepto"], ayuda["nombre"], ayuda["dibujo"])
            db.commit()
        return respuesta

    def sin_claude(motivo: str) -> dict:
        """Claude falló o su respuesta se bloqueó. El avance cuenta solo si el alumno recibe esa misma ayuda:
        la pista del error (escalón 1) la da también `por_reglas`; un pasito trae su texto escrito por el código.
        En otro caso el escalón no avanza."""
        log.info("tutor: %s", motivo)
        if paso and paso.get("modo") == "pausa":
            return {**reglas, "respuesta": PAUSA_REGLAS}
        if db is not None and paso and paso["escalon"] == 1:
            return entregar(reglas)  # el respaldo por reglas ES la pista de su error: ya la recibió
        if db is not None and paso and paso.get("texto_fijo"):
            dib = dibujos.validar(paso["dibujo"]) if paso.get("dibujo") else None
            return entregar({"respuesta": f"{estrategia.frase_de_animo('', paso['escalon'], paso.get('modo'))} {paso['texto_fijo']}",
                    "origen": "reglas", "dibujo": dib})
        if db is not None and paso:
            db.rollback()
        return reglas
    # Si en ESTE mensaje resolvió su ejercicio, no se revisa contra la última sub-pregunta de Kiko (p. ej. "¿40 + 30?"):
    # antes eso le decía a Kiko "375 no es correcto" justo cuando el alumno acababa de resolver 245 + 130.
    verificacion = None if (paso or resolvio) else _verificar_respuesta(historial, mensaje)
    op_contexto = operacion
    if resolvio and operacion:
        r = operaciones.resultado_texto(operacion)
        nota = (f"El alumno ACABA DE RESOLVER su ejercicio ({operacion['a']} {operacion['op']} {operacion['b']} = {r}): "
                "lo dijo en este mensaje. Reconócelo sin exagerar y pídele que te explique cómo lo pensó. "
                "No le hagas más preguntas de pasos ni le digas que algo está mal.")
        verificacion = f"{verificacion}\n{nota}" if verificacion else nota
        op_contexto = None  # ya no está pendiente: que el contexto no lo describa como ejercicio por resolver
    if duda:
        nota = ("El alumno dijo el resultado correcto, pero CON DUDA (lo pregunta o no está seguro). No se lo "
                "confirmes todavía ni le digas que está mal: pídele que te cuente cómo llegó a ese número o cómo "
                "podría comprobarlo. Cuando lo afirme, ya cuenta como resuelto.")
        verificacion = f"{verificacion}\n{nota}" if verificacion else nota
    if resuelta_antes:
        r = operaciones.resultado_texto(resuelta_antes)
        nota = (f"El alumno YA RESOLVIÓ su operación del cuaderno ({resuelta_antes['a']} {resuelta_antes['op']} "
                f"{resuelta_antes['b']} = {r}) aquí en el chat. No le vuelvas a preguntar sus pasos. Respóndele lo que diga; "
                "puedes sugerirle corregirla en su cuaderno y escanear otra, o proponerle UNA parecida para practicar "
                "(escríbela como «¿cuánto es a + b?»).")
        verificacion = f"{verificacion}\n{nota}" if verificacion else nota
    if not paso and (posicional := _valor_posicional(mensaje, historial)):
        verificacion = f"{verificacion}\n{posicional}" if verificacion else posicional
    salida = _preguntar_a_claude(op_contexto, grado, mensaje, historial, ejercicio, memoria, paso,
                                 del_chat=del_chat and op_contexto is not None, verificacion=verificacion)
    if not salida:
        return sin_claude("Claude no respondió")
    texto = _sin_genero(salida["respuesta"])
    if paso and paso.get("texto_fijo"):
        # Escalones 4 y 5: las cuentas (y la pregunta) las pone el código, verificadas. Del modelo solo una frase de ánimo.
        texto = f"{estrategia.frase_de_animo(texto, paso['escalon'], paso.get('modo'))} {paso['texto_fijo']}"

    # Resultados que Kiko no puede decir: el de la operación escaneada (si está mal) y los de las cuentas
    # que el alumno escribió en el chat (este mensaje y sus mensajes anteriores).
    secretos = []
    if operacion and (s := _secreto(operacion)):
        secretos.append(s)
    textos_alumno = [mensaje, ejercicio or ""] + [m.get("texto") or "" for m in historial[-MAX_HISTORIAL:] if m.get("de") != "kiko"]
    for t in textos_alumno:
        secretos.extend(cuentas_en(t))
    if _bloqueada(texto, mensaje, secretos):
        return sin_claude("la respuesta de Claude traía un resultado; la bloqueo")
    # El dibujo también cumple la regla de oro: si al contarlo sale un resultado secreto, se quita.
    # Con una operación del escáner, los dibujos los pone SOLO el código (verificados, escalón 3): el modelo tendía a
    # dibujar la operación completa, y contándola sale el resultado. Sin operación (dudas, ejercicios de texto),
    # el modelo puede dibujar libremente (con los límites y el filtro de siempre).
    if operacion:
        dibujo = dibujos.validar(paso["dibujo"]) if paso and paso.get("dibujo") else None
    else:
        dibujo = dibujos.validar(salida["dibujo"])
    if dibujo and _dibujo_revela(dibujo, mensaje, secretos):
        # Se descarta todo: el texto habla del dibujo, y sin él quedaría incoherente.
        return sin_claude("el dibujo de Claude revelaba un resultado")
    return entregar({"respuesta": texto, "origen": "claude", "dibujo": dibujo},
                    dibujo["tipo"] if dibujo else None, anota_ayuda=True)
