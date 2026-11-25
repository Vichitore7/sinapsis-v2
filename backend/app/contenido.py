"""Contenido semilla (unidades → lecciones/mundos → ejercicios/retos) y generador de ejercicios.

Todo el contenido está en BORRADOR: falta la revisión pedagógica de la maestra o el maestro.
Para agregar retos: edita UNIDADES aquí y corre `uv run python -m app.semilla`.
"""
from __future__ import annotations

import random

from . import contenido_canal as canal
from . import contenido_cdmx as cdmx
from . import contenido_fes as fes
from . import contenido_nevado as nevado
from .juego import pistas_multiplicacion

# Cada reto de multiplicación: (id, título, enunciado, a, b, objeto, etapa_min)
UNIDADES = [
    # Mundo 1 (1.º de primaria): sus 12 niveles viven en contenido_canal.py.
    {"id": "primero", "nombre": "Números y conteo (1.º)", "orden": 0, "prerrequisito": None, "lecciones": [canal.LECCION]},
    # Mundo 2 (2.º de primaria): sus 12 niveles viven en contenido_cdmx.py.
    {"id": "segundo", "nombre": "Números y operaciones (2.º)", "orden": 1, "prerrequisito": None, "lecciones": [cdmx.LECCION]},
    # Mundo 3 (3.º de primaria): sus 12 niveles viven en contenido_fes.py (la FES Aragón).
    {"id": "tercero", "nombre": "Números, fracciones y operaciones (3.º)", "orden": 2, "prerrequisito": None, "lecciones": [fes.LECCION]},
    # Mundo 4 (4.º de primaria): sus 12 niveles viven en contenido_nevado.py (el Nevado de Toluca).
    {"id": "cuarto", "nombre": "Números, decimales, fracciones y medida (4.º)", "orden": 3, "prerrequisito": None, "lecciones": [nevado.LECCION]},
    {
        "id": "multiplicacion", "nombre": "Multiplicación", "orden": 4, "prerrequisito": None,
        "lecciones": [
            {
                "id": "m2", "nombre": "El mercado", "concepto": "Multiplicación con bolsitas y barras", "sticker": "bufanda",
                "ejemplo": {"a": 2, "b": 5},
                "entrada": "¡El mercado abre sus puestos! Aquí las cuentas crecen, explorador.",
                "retos": [
                    ("m2-r1", "Misión en el mercado", "Mix quiere comprar 3 mangos. Cada uno cuesta $12. ¿Cuánto paga en total?", 3, 12, "mangos", 1),
                    ("m2-r2", "El puesto de aguacates", "Sol compra 4 kilos de aguacate. El kilo cuesta $15. ¿Cuánto paga?", 4, 15, "kilos", 2),
                    ("m2-r3", "Pasajes de regreso", "Una familia de 6 toma el camión. Cada pasaje cuesta $9. ¿Cuánto pagan?", 6, 9, "pasajes", 2),
                    ("m2-r4", "La receta de la abuela", "La abuela compra 3 paquetes de tortillas de $22. ¿Cuánto gasta?", 3, 22, "paquetes", 3),
                ],
            },
        ],
    },
    {"id": "division", "nombre": "División", "orden": 5, "prerrequisito": "multiplicacion", "proximamente": True, "lecciones": []},
    {"id": "fracciones", "nombre": "Fracciones", "orden": 6, "prerrequisito": "division", "proximamente": True, "lecciones": []},
    # Módulos del año escolar que el profesor ya puede agregar a su aula; el contenido llega después.
    {"id": "suma-resta", "nombre": "Suma y resta", "orden": 7, "prerrequisito": None, "proximamente": True, "lecciones": []},
    {"id": "valor-posicional", "nombre": "Valor posicional", "orden": 8, "prerrequisito": None, "proximamente": True, "lecciones": []},
    {"id": "decimales", "nombre": "Decimales", "orden": 9, "prerrequisito": "fracciones", "proximamente": True, "lecciones": []},
    {"id": "geometria", "nombre": "Geometría", "orden": 10, "prerrequisito": None, "proximamente": True, "lecciones": []},
    {"id": "medicion", "nombre": "Medición", "orden": 11, "prerrequisito": None, "proximamente": True, "lecciones": []},
]

STICKERS = {
    "flor": "Flor de la chinampa",
    "tarjeta": "Tarjeta del Metro",
    "peluche": "Peluche de la mascota de la FES",
    "esfera": "Bolita de nieve del Nevado",
    "mochila": "Mochila de la selva",
    "bufanda": "Bufanda del mercado",
    "sombrero": "Sombrero del río",
}

# Trajes para vestir al ajolote (no son del álbum de los mundos).
TRAJES = {
    "trajinero": "Traje de trajinero",
    "trajinera": "Traje de trajinera",
    # Premio del examen del Mundo 2 (rumbo a la FES Aragón): sudadera azul con patita dorada, tenis y audífonos.
    "fes-gorra": "FES Aragón: sudadera y gorra",
    "fes-cabello": "FES Aragón: sudadera y cabello largo",
    # Premio del examen del Mundo 3 (rumbo al Nevado de Toluca): ropa para el frío.
    "nevado-gorro": "Nevado: chamarra y gorro",
    "nevado-orejeras": "Nevado: abrigo y orejeras",
    # Premio del examen del Mundo 4 (rumbo a las Grutas de Tolantongo): trajes de baño para el balneario.
    "tolantongo-short": "Tolantongo: short de baño y visera",
    "tolantongo-completo": "Tolantongo: traje de baño completo y goggles",
}

# Premio del examen general del Mundo 1: subculturas de la CDMX, cada una con dos estilos.
# Al terminar el examen se regalan 2 al azar, uno de cada estilo ("a" y "b"), para que siempre sean distintos entre sí.
# Los nombres describen cómo se ve el traje (nada de etiquetas de género): todos pueden usar cualquiera.
TRAJES_SUBCULTURAS = {  # id: (subcultura, nombre, estilo)
    "emo-rayas": ("Emo", "Emo de rayas", "a"), "emo-mono": ("Emo", "Emo con moño", "b"),
    "hippie-guitarra": ("Hippie", "Hippie con guitarra", "a"), "hippie-flores": ("Hippie", "Hippie con flores", "b"),
    "punk-verde": ("Punk", "Punk de cresta verde", "a"), "punk-rosa": ("Punk", "Punk de cresta rosa", "b"),
    "skate-gorra": ("Skate", "Skate de gorra", "a"), "skate-gorro": ("Skate", "Skate de gorro", "b"),
    "manif-xochimilco": ("Manifestante", "Manifestante por Xochimilco", "a"), "manif-ajolote": ("Manifestante", "Manifestante por el ajolote", "b"),
    "ska-sombrero": ("Ska", "Ska de sombrerito", "a"), "ska-cuadros": ("Ska", "Ska de cuadros", "b"),
    "rap-gorra": ("Rap", "Rap de gorra plana", "a"), "rap-chongo": ("Rap", "Rap de chongo", "b"),
    "rock-chopo": ("Rock", "Rock del Chopo", "a"), "rock-mezclilla": ("Rock", "Rock de mezclilla", "b"),
    "dark-capa": ("Dark", "Dark de capa", "a"), "dark-encaje": ("Dark", "Dark de encaje", "b"),
    "lucha-azul": ("Lucha libre", "Lucha libre: máscara azul", "a"), "lucha-rosa": ("Lucha libre", "Lucha libre: máscara rosa", "b"),
}
TRAJES.update({id_: nombre for id_, (_, nombre, _) in TRAJES_SUBCULTURAS.items()})


def sortear_trajes_subcultura(ya_tiene: list[str], rnd: random.Random | None = None) -> list[str]:
    """Dos trajes al azar que el alumno todavía no tenga: uno de cada estilo y de subculturas distintas
    (por ejemplo, emo + lucha libre; nunca los dos de dark)."""
    rnd = rnd or random.Random()
    salida, subculturas = [], set()
    for estilo in rnd.sample(["a", "b"], 2):  # el orden también al azar, para no favorecer a un estilo
        opciones = [t for t, (sub, _, e) in TRAJES_SUBCULTURAS.items()
                    if e == estilo and t not in ya_tiene and sub not in subculturas]
        if opciones:
            elegido = rnd.choice(opciones)
            salida.append(elegido)
            subculturas.add(TRAJES_SUBCULTURAS[elegido][0])
    return salida


# Mundos temáticos por niveles (cada uno con 12 niveles de 3 ejercicios y examen general al final).
MUNDOS_TEMATICOS = {canal.LECCION_ID: canal, cdmx.LECCION_ID: cdmx, fes.LECCION_ID: fes, nevado.LECCION_ID: nevado}


def ejercicio_canal(e: dict, orden: int) -> dict:
    """Un ejercicio de un mundo temático (Canal, Centro…) en el formato de la tabla `ejercicios`."""
    claves_datos = ("a", "b", "op", "moneda", "opciones", "visual", "pregunta_error", "nivel", "nivel_tema", "nivel_titulo", "fase_cpa")
    return {
        "id": e["id"], "orden": orden, "tipo": e["tipo"], "titulo": e["titulo"], "enunciado": e["enunciado"],
        "datos": {k: e[k] for k in claves_datos if k in e},
        "respuesta": e["respuesta"], "pistas": e["pistas"], "dificultad": 1, "explicacion": e["explicacion"],
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
