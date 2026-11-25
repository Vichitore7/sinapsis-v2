"""Examen diagnóstico de entrada: una pregunta por habilidad, sin castigo.

Las respuestas viven solo aquí (nunca se mandan al navegador). "No sé" cuenta como "por reforzar",
igual que una respuesta equivocada: sirve para saber por dónde empezar, no para calificar.
"""
from __future__ import annotations

import unicodedata

PREGUNTAS = [
    {"id": "d1", "habilidad": "suma", "nombre": "Suma", "enunciado": "¿Cuánto es 47 + 38?", "respuesta": "85"},
    {"id": "d2", "habilidad": "resta", "nombre": "Resta", "enunciado": "¿Cuánto es 92 − 57?", "respuesta": "35"},
    {"id": "d3", "habilidad": "valor-posicional", "nombre": "Valor posicional", "enunciado": "En el número 3 482, ¿cuánto vale el 4?", "respuesta": "400"},
    {"id": "d4", "habilidad": "tablas", "nombre": "Tablas de multiplicar", "enunciado": "¿Cuánto es 6 × 7?", "respuesta": "42"},
    {"id": "d5", "habilidad": "multiplicacion", "nombre": "Multiplicación", "enunciado": "Una caja tiene 4 filas con 9 galletas cada una. ¿Cuántas galletas hay?", "respuesta": "36"},
    {"id": "d6", "habilidad": "multiplicacion-llevadas", "nombre": "Multiplicación con llevadas", "enunciado": "¿Cuánto es 24 × 3?", "respuesta": "72"},
    {"id": "d7", "habilidad": "division", "nombre": "División", "enunciado": "Reparte 56 canicas entre 8 amigos en partes iguales. ¿Cuántas le tocan a cada uno?", "respuesta": "7"},
    {"id": "d8", "habilidad": "fracciones", "nombre": "Fracciones", "enunciado": "¿Qué es más grande: 1/2 o 1/4 de una pizza? Escribe la fracción.", "respuesta": "1/2"},
]

NOMBRES = {p["habilidad"]: p["nombre"] for p in PREGUNTAS}


def publicas() -> list[dict]:
    return [{k: p[k] for k in ("id", "habilidad", "nombre", "enunciado")} for p in PREGUNTAS]


def _limpiar(t: str) -> str:
    t = unicodedata.normalize("NFKC", t).strip().lower().replace(" ", "")
    return t.replace(",", "")


def calificar(respuestas: dict[str, str | None]) -> dict[str, bool]:
    """{habilidad: True si la respondió bien}. Las que faltan o dicen "no sé" quedan en False."""
    return {p["habilidad"]: bool(respuestas.get(p["id"])) and _limpiar(respuestas[p["id"]]) == _limpiar(p["respuesta"])
            for p in PREGUNTAS}


def resumen(resultados: dict[str, bool]) -> list[dict]:
    return [{"habilidad": h, "nombre": NOMBRES.get(h, h), "logrado": ok} for h, ok in resultados.items()]
