"""Examen diagnóstico de entrada: una pregunta por habilidad, sin castigo.

Cada grado (P1 a S3) tiene su propio examen con lo que el alumno ya debería dominar al empezar ese grado,
es decir, lo de los grados anteriores (ver docs/material-de-estudio/progresion-por-tema.md). P1 pregunta
lo básico de preescolar. Las cuentas sin grado (las que ya existían) siguen con el examen general.

Las respuestas viven solo aquí (nunca se mandan al navegador). "No sé" cuenta como "por reforzar",
igual que una respuesta equivocada: sirve para saber por dónde empezar, no para calificar.

Texto propio. Es borrador hasta que lo revise una maestra o un maestro.
"""
from __future__ import annotations

import re
import unicodedata
from fractions import Fraction

GRADOS = {
    "P1": "1.º de primaria", "P2": "2.º de primaria", "P3": "3.º de primaria",
    "P4": "4.º de primaria", "P5": "5.º de primaria", "P6": "6.º de primaria",
    "S1": "1.º de secundaria", "S2": "2.º de secundaria", "S3": "3.º de secundaria",
}

# Catálogo de habilidades (el orden es el que ve el profesor en su resumen).
HABILIDADES = {
    "conteo": "Contar", "antes-despues": "Antes y después", "comparar": "Comparar números",
    "juntar": "Juntar y agregar", "quitar": "Quitar", "series": "Contar de 10 en 10",
    "suma": "Suma", "resta": "Resta", "problemas-suma": "Problemas de suma", "valor-posicional": "Valor posicional",
    "tablas": "Tablas de multiplicar", "multiplicacion": "Multiplicación",
    "multiplicacion-llevadas": "Multiplicación con llevadas", "division": "División",
    "division-residuo": "División con residuo", "fracciones": "Fracciones",
    "fracciones-equivalentes": "Fracciones equivalentes", "fraccion-decimal": "Fracción a decimal",
    "fraccion-entre-natural": "Fracción entre un número", "decimales": "Decimales",
    "suma-decimales": "Suma de decimales", "decimal-por-natural": "Decimal por un número",
    "division-decimal": "División con decimales", "proporcionalidad": "Proporcionalidad",
    "porcentajes": "Porcentajes", "romanos": "Números romanos",
    "enteros-suma": "Suma con signo", "enteros-producto": "Multiplicación con signo",
    "jerarquia": "Jerarquía de operaciones", "sucesiones": "Sucesiones", "ecuaciones": "Ecuaciones lineales",
    "potencias": "Potencias", "raiz": "Raíz cuadrada", "leyes-exponentes": "Leyes de los exponentes",
    "mcm": "Mínimo común múltiplo", "mcd": "Máximo común divisor", "sistemas": "Sistemas de ecuaciones",
    "proporcionalidad-inversa": "Proporcionalidad inversa",
    "figuras": "Figuras", "poligonos": "Polígonos", "triangulos": "Tipos de triángulos", "circulo": "Círculo",
    "circulo-pi": "Perímetro del círculo", "area-circulo": "Área del círculo", "angulos": "Ángulos del triángulo",
    "plano-cartesiano": "Plano cartesiano", "area": "Área", "perimetro": "Perímetro",
    "area-triangulo": "Área del triángulo", "volumen": "Volumen",
    "tiempo": "El tiempo", "reloj": "El reloj", "moda": "Moda", "media": "Media (promedio)",
    "mediana": "Mediana", "probabilidad": "Probabilidad",
}


def _p(id_: str, habilidad: str, enunciado: str, *respuestas: str) -> dict:
    return {"id": id_, "habilidad": habilidad, "nombre": HABILIDADES[habilidad], "enunciado": enunciado,
            "respuestas": list(respuestas)}


# Examen general: para las cuentas que se crearon antes de guardar el grado (nivel 3.º–4.º).
PREGUNTAS = [
    _p("d1", "suma", "¿Cuánto es 47 + 38?", "85"),
    _p("d2", "resta", "¿Cuánto es 92 − 57?", "35"),
    _p("d3", "valor-posicional", "En el número 3 482, ¿cuánto vale el 4?", "400"),
    _p("d4", "tablas", "¿Cuánto es 6 × 7?", "42"),
    _p("d5", "multiplicacion", "Una caja tiene 4 filas con 9 galletas cada una. ¿Cuántas galletas hay?", "36"),
    _p("d6", "multiplicacion-llevadas", "¿Cuánto es 24 × 3?", "72"),
    _p("d7", "division", "Reparte 56 canicas entre 8 amigos en partes iguales. ¿Cuántas le tocan a cada uno?", "7"),
    _p("d8", "fracciones", "¿Qué es más grande: 1/2 o 1/4 de una pizza? Escribe la fracción.", "1/2"),
]

POR_GRADO = {
    # Entra a 1.º: lo de preescolar.
    "P1": [
        _p("p1-1", "conteo", "Cuenta las estrellas: ⭐⭐⭐⭐⭐⭐. ¿Cuántas hay?", "6"),
        _p("p1-2", "antes-despues", "¿Qué número sigue después del 9?", "10"),
        _p("p1-3", "comparar", "¿Cuál es más grande: 7 o 4?", "7"),
        _p("p1-4", "juntar", "Tienes 3 globos y te regalan 2 más. ¿Cuántos globos tienes?", "5"),
        _p("p1-5", "quitar", "Hay 6 patos en el canal y se van nadando 2. ¿Cuántos patos quedan?", "4"),
        _p("p1-6", "series", "Cuenta: 1, 2, 3, 4… ¿Qué número va justo antes del 15?", "14"),
        _p("p1-7", "figuras", "¿Cuántos lados tiene un triángulo?", "3"),
        _p("p1-8", "tiempo", "¿Cuántos días tiene una semana?", "7"),
    ],
    # Entra a 2.º: números hasta 100, juntar y quitar, figuras y la semana.
    "P2": [
        _p("p2-1", "suma", "¿Cuánto es 8 + 7?", "15"),
        _p("p2-2", "resta", "¿Cuánto es 15 − 6?", "9"),
        _p("p2-3", "valor-posicional", "¿Cuántas decenas hay en el número 40?", "4"),
        _p("p2-4", "series", "Cuenta de 10 en 10: 30, 40, 50… ¿Qué número sigue?", "60"),
        _p("p2-5", "comparar", "¿Cuál es mayor: 68 u 86?", "86"),
        _p("p2-6", "problemas-suma", "En la trajinera van 23 personas y se suben 5 más. ¿Cuántas van ahora?", "28"),
        _p("p2-7", "figuras", "¿Cuántas esquinas (vértices) tiene un cuadrado?", "4"),
        _p("p2-8", "tiempo", "Si hoy es lunes, ¿qué día será mañana?", "martes"),
    ],
    # Entra a 3.º: hasta 1000, suma y resta con algoritmo, sumas repetidas y repartos.
    "P3": [
        _p("p3-1", "suma", "¿Cuánto es 47 + 38?", "85"),
        _p("p3-2", "resta", "¿Cuánto es 72 − 45?", "27"),
        _p("p3-3", "valor-posicional", "En el número 356, ¿cuánto vale el 5?", "50"),
        _p("p3-4", "comparar", "¿Qué signo va en medio: 409 __ 490? Escribe <, > o =.", "<"),
        _p("p3-5", "multiplicacion", "Hay 4 bolsas con 5 dulces cada una. ¿Cuántos dulces hay en total?", "20"),
        _p("p3-6", "division", "Reparte 12 galletas entre 3 niños en partes iguales. ¿Cuántas le tocan a cada uno?", "4"),
        _p("p3-7", "poligonos", "¿Cuántos lados tiene un hexágono?", "6"),
        _p("p3-8", "tiempo", "¿Cuántos meses tiene un año?", "12"),
    ],
    # Entra a 4.º: 4 cifras, restas pidiendo prestado, tablas, división, medios y cuartos, reloj, triángulos.
    "P4": [
        _p("p4-1", "suma", "¿Cuánto es 358 + 467?", "825"),
        _p("p4-2", "resta", "¿Cuánto es 503 − 268?", "235"),
        _p("p4-3", "valor-posicional", "En el número 3 482, ¿cuánto vale el 4?", "400"),
        _p("p4-4", "tablas", "¿Cuánto es 7 × 8?", "56"),
        _p("p4-5", "division", "¿Cuánto es 36 ÷ 4?", "9"),
        _p("p4-6", "fracciones", "¿Qué es más grande: 1/2 o 1/4 de una pizza? Escribe la fracción.", "1/2"),
        _p("p4-7", "reloj", "Son las 3 y media. ¿Cuántos minutos han pasado desde las 3 en punto?", "30"),
        _p("p4-8", "triangulos", "Un triángulo tiene sus 3 lados iguales. ¿Cómo se llama: equilátero, isósceles o escaleno?", "equilatero"),
    ],
    # Entra a 5.º: 5 cifras, 3 × 2 cifras, cociente y residuo, fracciones, décimos y centésimos, superficie, moda.
    "P5": [
        _p("p5-1", "multiplicacion-llevadas", "¿Cuánto es 124 × 23?", "2852"),
        _p("p5-2", "division-residuo", "Reparte 47 canicas entre 5 amigos en partes iguales. ¿Cuántas canicas sobran?", "2"),
        _p("p5-3", "valor-posicional", "En el número 58 307, ¿cuánto vale el 8?", "8000"),
        _p("p5-4", "fracciones", "Una barra de amaranto se parte en 5 partes iguales y te comes 2. ¿Qué fracción de la barra te comiste?", "2/5"),
        _p("p5-5", "decimales", "¿Qué número es mayor: 0.7 o 0.25?", "0.7"),
        _p("p5-6", "suma-decimales", "¿Cuánto es 2.5 + 1.25?", "3.75"),
        _p("p5-7", "area", "Un rectángulo mide 6 cuadritos de largo y 4 de ancho. ¿Cuántos cuadritos cubren su superficie?", "24"),
        _p("p5-8", "moda", "Los colores favoritos del grupo son: rojo, azul, rojo, verde, rojo y azul. ¿Cuál es la moda?", "rojo"),
    ],
    # Entra a 6.º: equivalentes, fracción ↔ decimal, decimal × natural, porcentajes, fórmulas de área y perímetro.
    "P6": [
        _p("p6-1", "fracciones-equivalentes", "Completa para que sean equivalentes: 1/2 = ?/8. ¿Qué número va en lugar del signo de pregunta?", "4", "4/8"),
        _p("p6-2", "fraccion-decimal", "Escribe 3/4 como número decimal.", "0.75"),
        _p("p6-3", "decimal-por-natural", "Un cuaderno cuesta $12.50. ¿Cuánto cuestan 4 cuadernos?", "50"),
        _p("p6-4", "porcentajes", "¿Cuánto es el 25 % de 80?", "20"),
        _p("p6-5", "area-triangulo", "Un triángulo tiene 10 cm de base y 6 cm de altura. ¿Cuál es su área en cm²?", "30"),
        _p("p6-6", "perimetro", "Un rectángulo mide 8 cm de largo y 5 cm de ancho. ¿Cuál es su perímetro en cm?", "26"),
        _p("p6-7", "circulo", "El radio de un círculo mide 7 cm. ¿Cuánto mide su diámetro en cm?", "14"),
        _p("p6-8", "proporcionalidad", "Si 3 tamales cuestan $36, ¿cuánto cuestan 5 tamales?", "60"),
    ],
    # Entra a 1.º de secundaria: porcentajes, media, volumen, decimales, romanos, plano cartesiano y π.
    "S1": [
        _p("s1-1", "porcentajes", "En un grupo de 40 alumnos, 10 llegan en bicicleta. ¿Qué porcentaje del grupo es?", "25"),
        _p("s1-2", "media", "¿Cuál es la media (el promedio) de 6, 8 y 10?", "8"),
        _p("s1-3", "volumen", "Una caja se llena con cubitos: 3 de largo, 2 de ancho y 4 de alto. ¿Cuántos cubitos caben?", "24"),
        _p("s1-4", "division-decimal", "¿Cuánto es 7.5 ÷ 3?", "2.5"),
        _p("s1-5", "fraccion-entre-natural", "Repartes 1/2 litro de agua en 2 vasos iguales. ¿Qué fracción de litro le toca a cada vaso?", "1/4"),
        _p("s1-6", "romanos", "¿Qué número es XIV en números romanos?", "14"),
        _p("s1-7", "plano-cartesiano", "En el plano cartesiano, ¿cuántas unidades hacia arriba del eje x está el punto (4, 2)?", "2"),
        _p("s1-8", "circulo-pi", "Usa π = 3.14. ¿Cuánto mide el perímetro de un círculo de 10 cm de diámetro, en cm?", "31.4"),
    ],
    # Entra a 2.º de secundaria: números con signo, jerarquía, ecuaciones, sucesiones, mediana y probabilidad.
    "S2": [
        _p("s2-1", "enteros-suma", "¿Cuánto es −5 + 8?", "3"),
        _p("s2-2", "enteros-producto", "¿Cuánto es (−4) × 3?", "-12"),
        _p("s2-3", "jerarquia", "¿Cuánto es 3 + 4 × 2?", "11"),
        _p("s2-4", "ecuaciones", "Resuelve 2x + 3 = 11. ¿Cuánto vale x?", "4"),
        _p("s2-5", "sucesiones", "¿Qué número sigue en la sucesión 3, 7, 11, 15…?", "19"),
        _p("s2-6", "mediana", "¿Cuál es la mediana de 2, 9, 4, 7 y 5?", "5"),
        _p("s2-7", "area-circulo", "Usa π = 3.14. ¿Cuál es el área de un círculo de 10 cm de radio, en cm²?", "314"),
        _p("s2-8", "probabilidad", "En una bolsa hay 3 canicas rojas y 1 azul. Si sacas una sin ver, ¿cuál es la probabilidad de que sea roja? Escríbela como fracción.", "3/4", "75%"),
    ],
    # Entra a 3.º de secundaria: potencias y raíces, mcm y mcd, sistemas 2×2, proporcionalidad inversa, ángulos.
    "S3": [
        _p("s3-1", "potencias", "¿Cuánto es 2 elevado a la 5 (2⁵)?", "32"),
        _p("s3-2", "raiz", "¿Cuál es la raíz cuadrada de 81?", "9"),
        _p("s3-3", "leyes-exponentes", "3⁴ × 3² se puede escribir como una sola potencia de 3. ¿Cuál es su exponente?", "6"),
        _p("s3-4", "mcm", "¿Cuál es el mínimo común múltiplo de 4 y 6?", "12"),
        _p("s3-5", "mcd", "¿Cuál es el máximo común divisor de 18 y 24?", "6"),
        _p("s3-6", "sistemas", "Resuelve el sistema x + y = 10 y x − y = 4. ¿Cuánto vale x?", "7"),
        _p("s3-7", "proporcionalidad-inversa", "4 pintores tardan 6 días en pintar una casa. Si todos trabajan igual, ¿cuántos días tardarían 8 pintores?", "3"),
        _p("s3-8", "angulos", "Dos ángulos de un triángulo miden 50° y 70°. ¿Cuánto mide el tercero, en grados?", "60"),
    ],
}

NOMBRES = HABILIDADES  # compatibilidad: antes se armaba solo con las 8 preguntas generales


def preguntas(grado: str | None) -> list[dict]:
    """El examen del grado; sin grado (o con uno desconocido), el general."""
    return POR_GRADO.get(grado or "", PREGUNTAS)


def nombre_grado(grado: str | None) -> str | None:
    return GRADOS.get(grado or "")


def publicas(grado: str | None = None) -> list[dict]:
    return [{k: p[k] for k in ("id", "habilidad", "nombre", "enunciado")} for p in preguntas(grado)]


# ---------- Calificar ----------

_NUMERO = re.compile(r"^[+-]?(\d[\d.,]*|[.,]\d+)(/\d+)?$")
_MILES = re.compile(r"^[+-]?\d{1,3}(,\d{3})+$")


def _texto(t: str) -> str:
    """Minúsculas, sin acentos ni espacios, con el menos normal y sin "x =", "$", "%", "°" ni unidades."""
    t = unicodedata.normalize("NFKC", t).strip().lower()
    t = t.replace("−", "-").replace("–", "-")
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")
    t = re.sub(r"\s+", "", t)
    t = re.sub(r"^[a-z]=", "", t)  # "x = 5"
    t = t.strip("$%°")
    t = re.sub(r"(?<=\d)(cm2|cm²|m2|m²|cm|km|kg|mm|m|l|g|grados|dias|minutos)$", "", t).rstrip("%°")
    return t


def _numero(t: str) -> Fraction | None:
    if not _NUMERO.match(t):
        return None
    try:
        if "/" in t:
            n, d = t.split("/")
            return Fraction(_numero(n)) / int(d) if int(d) and _numero(n) is not None else None
        if "," in t and ("." in t or _MILES.match(t)):
            t = t.replace(",", "")  # 3,482 o 1,234.5
        else:
            t = t.replace(",", ".")  # 0,75
        return Fraction(t)
    except (ValueError, ZeroDivisionError):
        return None


def es_correcta(dada: str | None, aceptadas: list[str]) -> bool:
    if not dada or not dada.strip():
        return False
    t = _texto(dada)
    v = _numero(t)
    for a in aceptadas:
        ta = _texto(a)
        va = _numero(ta)
        if (v is not None and va is not None and v == va) or t == ta:
            return True
    return False


def calificar(respuestas: dict[str, str | None], grado: str | None = None) -> dict[str, bool]:
    """{habilidad: True si la respondió bien}. Las que faltan o dicen "no sé" quedan en False."""
    return {p["habilidad"]: es_correcta(respuestas.get(p["id"]), p["respuestas"]) for p in preguntas(grado)}


def resumen(resultados: dict[str, bool]) -> list[dict]:
    return [{"habilidad": h, "nombre": HABILIDADES.get(h, h), "logrado": ok} for h, ok in resultados.items()]
