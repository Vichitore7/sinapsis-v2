"""Contenido semilla (unidades → lecciones/mundos → ejercicios/retos) y generador de ejercicios.

Todo el contenido está en BORRADOR: falta la revisión pedagógica de la maestra o el maestro.
Para agregar retos: edita UNIDADES aquí y corre `uv run python -m app.semilla`.
"""
from __future__ import annotations

import random

from .juego import pistas_multiplicacion

# Cada reto de multiplicación: (id, título, enunciado, a, b, objeto, etapa_min)
UNIDADES = [
    {
        "id": "multiplicacion", "nombre": "Multiplicación", "orden": 1, "prerrequisito": None,
        "lecciones": [
            {
                "id": "m1", "nombre": "La tiendita", "concepto": "Multiplicación con monedas", "sticker": "mochila",
                "entrada": "¡Bienvenido a la tiendita, explorador! Aquí las monedas cuentan historias.",
                "ejemplo": {"a": 2, "b": 5},
                "retos": [
                    ("m1-r1", "Primera compra", "Teo compra 3 paletas. Cada una cuesta $6. ¿Cuánto paga en total?", 3, 6, "paletas", 1),
                    ("m1-r2", "Los chicles del recreo", "Luna compra 4 chicles de $3 cada uno. ¿Cuánto gasta?", 4, 3, "chicles", 1),
                    ("m1-r3", "Tortas para todos", "Mía lleva 2 tortas a la escuela. Cada torta cuesta $12. ¿Cuánto pagó?", 2, 12, "tortas", 1),
                    ("m1-r4", "Aguas frescas", "Beto invita 5 aguas frescas de $8. ¿Cuánto paga en la tiendita?", 5, 8, "aguas", 1),
                ],
            },
            {
                "id": "m2", "nombre": "El mercado", "concepto": "Multiplicación con bolsitas y barras", "sticker": "bufanda",
                "entrada": "¡El mercado abre sus puestos! Aquí las cuentas crecen, explorador.",
                "retos": [
                    ("m2-r1", "Misión en el mercado", "Kiko quiere comprar 3 mangos. Cada uno cuesta $12. ¿Cuánto paga en total?", 3, 12, "mangos", 1),
                    ("m2-r2", "El puesto de aguacates", "Sol compra 4 kilos de aguacate. El kilo cuesta $15. ¿Cuánto paga?", 4, 15, "kilos", 2),
                    ("m2-r3", "Pasajes de regreso", "Una familia de 6 toma el camión. Cada pasaje cuesta $9. ¿Cuánto pagan?", 6, 9, "pasajes", 2),
                    ("m2-r4", "La receta de la abuela", "La abuela compra 3 paquetes de tortillas de $22. ¿Cuánto gasta?", 3, 22, "paquetes", 3),
                ],
            },
        ],
    },
    {"id": "division", "nombre": "División", "orden": 2, "prerrequisito": "multiplicacion", "proximamente": True, "lecciones": []},
    {"id": "fracciones", "nombre": "Fracciones", "orden": 3, "prerrequisito": "division", "proximamente": True, "lecciones": []},
    # Módulos del año escolar que el profesor ya puede agregar a su aula; el contenido llega después.
    {"id": "suma-resta", "nombre": "Suma y resta", "orden": 4, "prerrequisito": None, "proximamente": True, "lecciones": []},
    {"id": "valor-posicional", "nombre": "Valor posicional", "orden": 5, "prerrequisito": None, "proximamente": True, "lecciones": []},
    {"id": "decimales", "nombre": "Decimales", "orden": 6, "prerrequisito": "fracciones", "proximamente": True, "lecciones": []},
    {"id": "geometria", "nombre": "Geometría", "orden": 7, "prerrequisito": None, "proximamente": True, "lecciones": []},
    {"id": "medicion", "nombre": "Medición", "orden": 8, "prerrequisito": None, "proximamente": True, "lecciones": []},
]

STICKERS = {
    "mochila": "Mochila de la selva",
    "bufanda": "Bufanda del mercado",
    "sombrero": "Sombrero del río",
}

# Trajes típicos para vestir al ajolote (no son del álbum de los mundos).
TRAJES = {
    "trajinero": "Traje de trajinero",
    "trajinera": "Traje de trajinera",
}


def ejercicio_multiplicacion(id_: str, orden: int, titulo: str, enunciado: str, a: int, b: int,
                             objeto: str, etapa_min: int, ejemplo: dict | None = None) -> dict:
    return {
        "id": id_,
        "orden": orden,
        "tipo": "numerica",
        "titulo": titulo,
        "enunciado": enunciado,
        "datos": {"a": a, "b": b, "op": "×", "moneda": True, "objeto": objeto, "etapa_min": etapa_min, **({"ejemplo": ejemplo} if ejemplo else {})},
        "respuesta": str(a * b),
        "pistas": pistas_multiplicacion(a, b, True, objeto),
        "dificultad": etapa_min,
        "explicacion": f"Son {a} montones de ${b}: {' + '.join([str(b)] * a)} = ${a * b}.",
    }


# ---------------- Generador (para no escribir todo a mano) ----------------

_CONTEXTOS = [
    ("paletas", "Compras {a} paletas de ${b} cada una. ¿Cuánto pagas?"),
    ("tamales", "Tu tía lleva {a} tamales de ${b}. ¿Cuánto paga?"),
    ("cuadernos", "Necesitas {a} cuadernos de ${b}. ¿Cuánto cuestan?"),
    ("boletos", "Tu familia compra {a} boletos del metro de ${b}. ¿Cuánto pagan?"),
]

_RANGOS = {1: (2, 4, 2, 10), 2: (3, 6, 8, 15), 3: (3, 9, 12, 25)}  # nivel: (a_min, a_max, b_min, b_max)


def generar_multiplicacion(nivel: int, id_: str, orden: int, semilla: int | None = None) -> dict:
    """Crea un reto de multiplicación con números al azar según el nivel (1 fácil a 3 difícil)."""
    rnd = random.Random(semilla)
    a_min, a_max, b_min, b_max = _RANGOS[max(1, min(3, nivel))]
    a, b = rnd.randint(a_min, a_max), rnd.randint(b_min, b_max)
    objeto, plantilla = rnd.choice(_CONTEXTOS)
    return ejercicio_multiplicacion(id_, orden, "Práctica libre", plantilla.format(a=a, b=b), a, b, objeto, nivel)
