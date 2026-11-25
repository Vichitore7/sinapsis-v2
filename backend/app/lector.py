"""Lectura de la foto del cuaderno con Claude (visión).

El alumno toma o sube una foto de UNA operación. Claude transcribe lo que está escrito (sin corregirlo) y el alumno
confirma o corrige en la app antes de cualquier diagnóstico.

Privacidad: la foto solo vive en memoria durante esta petición. No se guarda en la base, en disco ni en los registros.
Si no hay clave, no hay internet, Claude rechaza la foto o no se entiende, se regresa None y el alumno escribe la
operación a mano (como antes).
"""
from __future__ import annotations

import base64
import binascii
import json
import logging
import re

import anthropic

from . import config, operaciones
from .tutor import _cliente_claude, limite

log = logging.getLogger("selva.lector")

MAX_BYTES = 600 * 1024   # la app manda menos de 300 KB; esto es margen
TIPOS = {"image/jpeg", "image/png", "image/webp"}
_DATA_URL = re.compile(r"^data:(image/[a-z]+);base64,([A-Za-z0-9+/=\s]+)$")

SISTEMA = """Lees fotos del cuaderno de alumnos de primaria y secundaria en una app para aprender matemáticas.

Tu único trabajo es TRANSCRIBIR lo que está escrito a mano, exactamente como está. Nunca resuelvas ni corrijas.

1. Si hay UNA operación de dos números con su resultado (`a op b = c`), usa `tipo: "operacion"`:
   - Los números pueden ser naturales ("17") o fracciones ("3/4"; un número sobre otro con una raya es una fracción).
   - `op`: suma (+), resta (−), multiplicación (×) o división (÷). Una "x" o un punto entre números es ×; un guion es −;
     "÷", ":" o la "casita" de la división es ÷.
   - `c`: el resultado que escribió el alumno, AUNQUE ESTÉ MAL. Si no escribió resultado (o hay un "?"), `c` en null.
   - En una división con residuo (lo que sobra, "r", "res" o el número de abajo en la casita), ponlo en `residuo`.
   - Si hay varias operaciones, toma la más clara (normalmente la primera o la que está encerrada).
2. Si hay un ejercicio de matemáticas que no es eso (un problema con texto, una ecuación, porcentajes, decimales,
   más de dos números, un número mixto…), usa `tipo: "otro"` y copia el ejercicio en `texto`, tal como está
   (máximo unas 3 líneas). No lo resuelvas.
3. Si no hay ningún ejercicio de matemáticas (un dibujo, una persona, una foto que no es de un cuaderno) o no se lee,
   usa `tipo: "nada"`.

Si algún número es difícil de leer, da tu mejor lectura y marca `dudoso` en true.
No repitas nombres ni otros datos personales que aparezcan en la foto (en `texto`, cámbialos por "…")."""

_NUMERO_O_NULL = {"anyOf": [{"type": "string"}, {"type": "null"}]}
ESQUEMA = {
    "type": "object",
    "properties": {
        "tipo": {"type": "string", "enum": ["operacion", "otro", "nada"]},
        "a": _NUMERO_O_NULL,
        "op": {"anyOf": [{"type": "string", "enum": ["×", "+", "−", "÷"]}, {"type": "null"}]},
        "b": _NUMERO_O_NULL,
        "c": _NUMERO_O_NULL,
        "residuo": _NUMERO_O_NULL,
        "texto": _NUMERO_O_NULL,
        "dudoso": {"type": "boolean"},
    },
    "required": ["tipo", "a", "op", "b", "c", "residuo", "texto", "dudoso"],
    "additionalProperties": False,
}


class FotoInvalida(ValueError):
    pass


def decodificar(foto: str) -> tuple[str, str]:
    """Valida el dataURL de la app. Regresa (tipo, base64 limpio) o lanza FotoInvalida."""
    m = _DATA_URL.match((foto or "").strip())
    if not m or m.group(1) not in TIPOS:
        raise FotoInvalida("Manda la foto como imagen JPEG, PNG o WebP.")
    datos = re.sub(r"\s", "", m.group(2))
    try:
        crudo = base64.b64decode(datos, validate=True)
    except (binascii.Error, ValueError) as e:
        raise FotoInvalida("La foto llegó dañada. Intenta de nuevo.") from e
    if len(crudo) > MAX_BYTES:
        raise FotoInvalida("La foto es muy pesada. Recórtala a una sola operación.")
    return m.group(1), datos


def _limpiar(d: dict) -> tuple[dict | None, str | None]:
    """(operación que el escáner sabe revisar, o None; texto de otro ejercicio para el chat, o None)."""
    texto = str(d.get("texto") or "").strip()[:400] or None
    if d.get("tipo") == "operacion":
        op = operaciones.validar({k: d.get(k) for k in ("a", "op", "b", "c", "residuo")})
        if op:
            return {**op, "dudoso": bool(d.get("dudoso"))}, None
        # La leyó pero el escáner no la puede revisar (p. ej. una resta que da negativo): que la vean en el chat.
        partes = [str(d.get(k) or "") for k in ("a", "op", "b")]
        if all(partes):
            texto = f"{partes[0]} {partes[1]} {partes[2]} = {d.get('c') or '?'}"
        return None, texto
    if d.get("tipo") == "otro" and texto:
        return None, texto
    return None, None


def leer(alumno_id: int, foto: str) -> dict:
    """Contrato: {"lectura": {a, op, b, c, residuo, dudoso} | null, "otro": texto | null, "origen": "claude" | "sin_ia"}.

    Números como texto ("17", "3/4"); `c` y `residuo` vacíos si no se escribieron. `otro` es un ejercicio que el
    escáner no sabe revisar: la app lo manda al chat para que el alumno lo confirme.
    """
    tipo, datos = decodificar(foto)  # valida aunque no haya IA: así la app recibe el mismo error siempre
    nada = {"lectura": None, "otro": None, "origen": "sin_ia"}
    if not config.TUTOR_ACTIVO:
        return nada
    if not limite.permitir(alumno_id):
        log.info("lector: el alumno %s llegó a su límite de mensajes; que escriba la operación a mano", alumno_id)
        return nada
    try:
        r = _cliente_claude().messages.create(
            model=config.LECTOR_MODELO,
            max_tokens=1024,
            output_config={"effort": "low", "format": {"type": "json_schema", "schema": ESQUEMA}},
            system=SISTEMA,
            messages=[{"role": "user", "content": [
                {"type": "image", "source": {"type": "base64", "media_type": tipo, "data": datos}},
                {"type": "text", "text": "Transcribe la operación de esta foto."},
            ]}],
        )
    except anthropic.APIConnectionError:
        log.warning("lector: sin conexión con Claude")
        return nada
    except anthropic.NotFoundError:
        log.error("lector: el modelo %r no existe. Revisa LECTOR_MODELO en backend/.env (p. ej. claude-haiku-5-5)", config.LECTOR_MODELO)
        return nada
    except anthropic.RateLimitError:
        log.warning("lector: Claude limitó la cuenta (429)")
        return nada
    except anthropic.APIStatusError as e:
        log.warning("lector: Claude respondió %s (request %s)", e.status_code, e.request_id)
        return nada
    if r.stop_reason != "end_turn":
        log.info("lector: Claude no terminó la lectura (%s)", r.stop_reason)
        return nada
    try:
        datos_leidos = json.loads("".join(b.text for b in r.content if b.type == "text"))
    except ValueError:
        log.info("lector: Claude no regresó JSON válido")
        return nada
    lectura, otro = _limpiar(datos_leidos)
    if lectura is None and otro is None:
        log.info("lector: no encontré un ejercicio en la foto")
    return {"lectura": lectura, "otro": otro, "origen": "claude"}
