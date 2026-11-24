"""Examen diagnóstico de entrada: una pregunta por habilidad, sin castigo.

Cada grado tiene su propio examen, con temas de ese grado o de grados anteriores, nunca más avanzados.
Los temas salen de docs/material-de-estudio/ (progresion-por-tema.md y los archivos de cada grado),
que resumen los Programas Sintéticos SEP 2024. El texto de las preguntas es propio del equipo.

Las cuentas creadas antes de que se guardara el grado (grado = None) siguen con el examen general de 8 preguntas.

Las respuestas viven solo aquí (nunca se mandan al navegador). "No sé" cuenta como "por reforzar",
igual que una respuesta equivocada: sirve para saber por dónde empezar, no para calificar.

Todo está en BORRADOR: falta la revisión pedagógica de la maestra o el maestro.
"""
from __future__ import annotations

import re
import unicodedata

# Grados en orden. El número es su lugar: 1.º de primaria = 1 … 3.º de secundaria = 9.
GRADOS = {
    "P1": (1, "1.º de primaria"), "P2": (2, "2.º de primaria"), "P3": (3, "3.º de primaria"),
    "P4": (4, "4.º de primaria"), "P5": (5, "5.º de primaria"), "P6": (6, "6.º de primaria"),
    "S1": (7, "1.º de secundaria"), "S2": (8, "2.º de secundaria"), "S3": (9, "3.º de secundaria"),
}

# Habilidades en el orden en que se muestran (también en el panel del profesor).
NOMBRES = {
    "conteo": "Conteo",
    "valor-posicional": "Valor posicional",
    "suma": "Suma",
    "resta": "Resta",
    "tablas": "Tablas de multiplicar",
    "multiplicacion": "Multiplicación",
    "multiplicacion-llevadas": "Multiplicación con llevadas",
    "division": "División",
    "fracciones": "Fracciones",
    "decimales": "Decimales",
    "porcentajes": "Porcentajes",
    "numeros-con-signo": "Números con signo",
    "jerarquia": "Jerarquía de operaciones",
    "divisibilidad": "Múltiplos y divisores",
    "potencias": "Potencias",
    "sucesiones": "Sucesiones",
    "ecuaciones": "Ecuaciones",
    "sistemas": "Sistemas de ecuaciones",
    "cuadraticas": "Ecuaciones cuadráticas",
    "geometria": "Geometría",
    "medicion": "Medición",
    "tiempo": "Tiempo",
    "pitagoras": "Teorema de Pitágoras",
    "trigonometria": "Trigonometría",
    "datos": "Datos y gráficas",
    "probabilidad": "Probabilidad",
}


def _p(id_, tema, habilidad, enunciado, *respuestas):
    """Una pregunta. `tema` es el grado donde la SEP pone ese contenido; `respuestas`, las que se aceptan."""
    return {"id": id_, "tema": tema, "habilidad": habilidad, "nombre": NOMBRES[habilidad],
            "enunciado": enunciado, "respuestas": list(respuestas)}


# Examen general (cuentas sin grado guardado). Los ids no cambian: ya hay resultados guardados con ellos.
PREGUNTAS = [
    _p("d1", "P2", "suma", "¿Cuánto es 47 + 38?", "85"),
    _p("d2", "P2", "resta", "¿Cuánto es 92 − 57?", "35"),
    _p("d3", "P3", "valor-posicional", "En el número 3 482, ¿cuánto vale el 4?", "400"),
    _p("d4", "P3", "tablas", "¿Cuánto es 6 × 7?", "42"),
    _p("d5", "P3", "multiplicacion", "Una caja tiene 4 filas con 9 galletas cada una. ¿Cuántas galletas hay?", "36"),
    _p("d6", "P3", "multiplicacion-llevadas", "¿Cuánto es 24 × 3?", "72"),
    _p("d7", "P3", "division", "Reparte 56 canicas entre 8 amigos en partes iguales. ¿Cuántas le tocan a cada uno?", "7"),
    _p("d8", "P3", "fracciones", "¿Qué es más grande: 1/2 o 1/4 de una pizza? Escribe la fracción.", "1/2"),
]

# Un examen por grado. Cada pregunta es de ese grado o de uno anterior (lo revisa una prueba).
EXAMENES = {
    "P1": [
        _p("p1-1", "P1", "conteo", "Cuenta de 10 en 10: 10, 20, 30… ¿Qué número va después del 60?", "70"),
        _p("p1-2", "P1", "suma", "Tienes 5 canicas y te regalan 3. ¿Cuántas tienes ahora?", "8"),
        _p("p1-3", "P1", "resta", "Había 9 globos y se volaron 4. ¿Cuántos quedan?", "5"),
        _p("p1-4", "P1", "geometria", "¿Cuántos lados tiene un triángulo?", "3"),
        _p("p1-5", "P1", "tiempo", "¿Cuántos días tiene una semana?", "7"),
        _p("p1-6", "P1", "datos", "En el salón, 4 niños votaron por el mango y 3 por la fresa. ¿Cuántos votaron en total?", "7"),
    ],
    "P2": [
        _p("p2-1", "P2", "valor-posicional", "En el número 352, ¿cuánto vale el 5?", "50"),
        _p("p2-2", "P2", "suma", "¿Cuánto es 47 + 38?", "85"),
        _p("p2-3", "P2", "resta", "¿Cuánto es 64 − 29?", "35"),
        _p("p2-4", "P2", "multiplicacion", "Hay 4 bolsas con 5 dulces cada una. ¿Cuántos dulces hay?", "20"),
        _p("p2-5", "P2", "division", "Reparte 12 galletas entre 3 amigos en partes iguales. ¿Cuántas le tocan a cada uno?", "4"),
        _p("p2-6", "P2", "geometria", "¿Cuántos lados tiene un pentágono?", "5"),
        _p("p2-7", "P2", "tiempo", "¿Cuántos meses tiene un año?", "12"),
    ],
    "P3": [
        _p("p3-1", "P3", "valor-posicional", "En el número 3 482, ¿cuánto vale el 4?", "400"),
        _p("p3-2", "P3", "suma", "¿Cuánto es 256 + 178?", "434"),
        _p("p3-3", "P3", "resta", "¿Cuánto es 503 − 268?", "235"),
        _p("p3-4", "P3", "tablas", "¿Cuánto es 6 × 7?", "42"),
        _p("p3-5", "P3", "division", "Reparte 56 canicas entre 8 amigos en partes iguales. ¿Cuántas le tocan a cada uno?", "7"),
        _p("p3-6", "P3", "fracciones", "¿Qué es más grande: 1/2 o 1/4 de una pizza? Escribe la fracción.", "1/2"),
        _p("p3-7", "P3", "medicion", "¿Cuántos centímetros tiene un metro?", "100"),
        _p("p3-8", "P3", "tiempo", "Una caricatura empieza a las 4:00 y termina a las 4:30. ¿Cuántos minutos dura?", "30"),
    ],
    "P4": [
        _p("p4-1", "P4", "valor-posicional", "En el número 45 607, ¿cuánto vale el 5?", "5000"),
        _p("p4-2", "P4", "suma", "¿Cuánto es 3 250 + 1 875?", "5125"),
        _p("p4-3", "P4", "multiplicacion", "¿Cuánto es 124 × 23?", "2852"),
        _p("p4-4", "P4", "division", "Reparte 29 lápices entre 4 niños en partes iguales. ¿Cuántos lápices sobran?", "1"),
        _p("p4-5", "P4", "fracciones", "¿Cuánto es 1/5 + 2/5? Escribe la fracción.", "3/5", "0.6"),
        _p("p4-6", "P4", "decimales", "¿Qué número es mayor: 0.5 o 0.45?", "0.5"),
        _p("p4-7", "P4", "geometria", "¿Cuántos ángulos rectos tiene un rectángulo?", "4"),
        _p("p4-8", "P4", "datos", "Las tallas de zapato de un equipo son 22, 23, 23, 24, 23 y 22. ¿Cuál es la moda?", "23"),
    ],
    "P5": [
        _p("p5-1", "P5", "fracciones", "Completa para que sean equivalentes: 1/2 = ?/8. ¿Qué número va en lugar del signo?", "4"),
        _p("p5-2", "P5", "decimales", "¿Cuánto es 2.5 + 1.75?", "4.25"),
        _p("p5-3", "P5", "multiplicacion", "¿Cuánto es 3 × 0.4?", "1.2"),
        _p("p5-4", "P5", "division", "Reparten $15 entre 4 amigos en partes iguales. ¿Cuánto le toca a cada uno?", "3.75"),
        _p("p5-5", "P5", "porcentajes", "¿Cuánto es el 25 % de 80?", "20"),
        _p("p5-6", "P5", "medicion", "Un rectángulo mide 8 cm de largo y 5 cm de ancho. ¿Cuál es su área en cm²?", "40"),
        _p("p5-7", "P5", "geometria", "El radio de un círculo mide 6 cm. ¿Cuánto mide su diámetro?", "12"),
        _p("p5-8", "P5", "probabilidad", "En una rifa, 3 de los 10 boletos tienen premio. ¿Qué fracción de los boletos tiene premio?", "3/10", "0.3"),
    ],
    "P6": [
        _p("p6-1", "P6", "valor-posicional", "¿Qué número es XIV en números romanos?", "14"),
        _p("p6-2", "P6", "porcentajes", "Un balón cuesta $300 y tiene 15 % de descuento. ¿Cuántos pesos te descuentan?", "45"),
        _p("p6-3", "P6", "decimales", "¿Cuánto es 7.5 ÷ 3?", "2.5"),
        _p("p6-4", "P6", "fracciones", "¿Cuánto es 3/4 ÷ 3? Escribe la fracción.", "1/4", "0.25"),
        _p("p6-5", "P6", "geometria", "Usa π = 3.14. ¿Cuánto mide el contorno de un círculo de 10 cm de diámetro?", "31.4"),
        _p("p6-6", "P6", "medicion", "Una caja se llena con 3 capas de 4 × 5 cubitos. ¿Cuántos cubitos caben?", "60"),
        _p("p6-7", "P6", "datos", "Las calificaciones de Luna son 8, 9 y 10. ¿Cuál es su promedio?", "9"),
        _p("p6-8", "P6", "probabilidad", "En una bolsa solo hay canicas azules. Sacar una roja, ¿es seguro o imposible?", "imposible"),
    ],
    "S1": [
        _p("s1-1", "S1", "numeros-con-signo", "¿Cuánto es −8 + 5?", "-3"),
        _p("s1-2", "S1", "jerarquia", "¿Cuánto es 3 + 4 × 2?", "11"),
        _p("s1-3", "S1", "fracciones", "Escribe 3/4 como número decimal.", "0.75"),
        _p("s1-4", "S1", "ecuaciones", "Resuelve 3x + 5 = 20. ¿Cuánto vale x?", "5"),
        _p("s1-5", "S1", "sucesiones", "¿Qué número sigue? 4, 9, 14, 19, …", "24"),
        _p("s1-6", "S1", "porcentajes", "Una playera de $250 sube 20 %. ¿Cuánto cuesta ahora?", "300"),
        _p("s1-7", "S1", "datos", "¿Cuál es la mediana de 3, 8, 5, 10 y 6?", "6"),
        _p("s1-8", "S1", "medicion", "Usa π = 3.14. ¿Cuál es el área de un círculo de 10 cm de radio, en cm²?", "314"),
    ],
    "S2": [
        _p("s2-1", "S2", "potencias", "¿Cuánto es 2 elevado a la 5 (2⁵)?", "32"),
        _p("s2-2", "S2", "divisibilidad", "¿Cuál es el mínimo común múltiplo de 4 y 6?", "12"),
        _p("s2-3", "S2", "sistemas", "Si x + y = 10 y x − y = 2, ¿cuánto vale x?", "6"),
        _p("s2-4", "S1", "ecuaciones", "Resuelve 5x − 7 = 2x + 8. ¿Cuánto vale x?", "5"),
        _p("s2-5", "S1", "numeros-con-signo", "¿Cuánto es (−6) × (−4)?", "24"),
        _p("s2-6", "S2", "probabilidad", "Al lanzar un dado, ¿cuál es la probabilidad de que salga 3? Escríbela como fracción.", "1/6"),
        _p("s2-7", "S2", "medicion", "Un pie mide 12 pulgadas. ¿Cuántas pulgadas son 3 pies?", "36"),
        _p("s2-8", "S2", "geometria", "¿Cuánto suman los ángulos interiores de un cuadrilátero, en grados?", "360"),
    ],
    "S3": [
        _p("s3-1", "S3", "cuadraticas", "Resuelve x² − 7x + 12 = 0. Tiene dos soluciones: escribe la mayor.", "4"),
        _p("s3-2", "S3", "pitagoras", "Los catetos de un triángulo rectángulo miden 6 cm y 8 cm. ¿Cuánto mide la hipotenusa?", "10"),
        _p("s3-3", "S3", "medicion", "Una caja con forma de prisma mide 4 cm × 5 cm × 6 cm. ¿Cuál es su volumen en cm³?", "120"),
        _p("s3-4", "S3", "trigonometria", "En un triángulo rectángulo, el cateto opuesto a un ángulo mide 3 y la hipotenusa 5. ¿Cuánto vale el seno de ese ángulo? Escríbelo como fracción.", "3/5", "0.6"),
        _p("s3-5", "S3", "probabilidad", "La probabilidad de que llueva mañana es 0.3. ¿Cuál es la probabilidad de que no llueva?", "0.7", "7/10"),
        _p("s3-6", "S2", "sistemas", "Si 2x + y = 11 y x − y = 1, ¿cuánto vale x?", "4"),
        _p("s3-7", "S2", "potencias", "¿Cuánto es 3² × 3³? Escribe el resultado como número.", "243"),
        _p("s3-8", "S3", "geometria", "Dos triángulos son semejantes. Un lado de 4 cm corresponde a un lado de 12 cm en el otro. ¿Cuántas veces más grande es el segundo?", "3"),
    ],
}


def grado_valido(grado: str | None) -> bool:
    return grado in GRADOS


def nombre_grado(grado: str | None) -> str | None:
    return GRADOS[grado][1] if grado in GRADOS else None


def preguntas_de(grado: str | None) -> list[dict]:
    """El examen del grado del alumno; sin grado guardado, el examen general."""
    return EXAMENES.get(grado or "", PREGUNTAS)


def publicas(grado: str | None = None) -> list[dict]:
    return [{k: p[k] for k in ("id", "habilidad", "nombre", "enunciado")} for p in preguntas_de(grado)]


# ---------------- Calificación ----------------

_NUMERO = re.compile(r"-?\d+(?:\.\d+)?")
_ES_NUMERO = re.compile(r"^-?\d+(?:\.\d+)?$")


def _base(t: str) -> str:
    t = unicodedata.normalize("NFKC", t or "").strip().lower().replace("−", "-")
    t = "".join(ch for ch in unicodedata.normalize("NFD", t) if unicodedata.category(ch) != "Mn")  # sin acentos
    return t.replace(" ", "")


def _numero(texto: str, con_decimales: bool) -> float | None:
    """El primer número que escribió el alumno: "x = 5", "$45", "40 cm²", "0,75", "5,125"."""
    t = _base(texto)
    # Con decimales, la coma es punto decimal (0,75). Sin decimales, la coma separa miles (5,125).
    t = t.replace(",", ".") if con_decimales else t.replace(",", "")
    m = _NUMERO.search(t)
    return float(m.group()) if m else None


def _correcta(respuesta: str | None, p: dict) -> bool:
    if not respuesta or not respuesta.strip():
        return False
    for esperada in p["respuestas"]:
        if _ES_NUMERO.match(esperada):
            n = _numero(respuesta, "." in esperada)
            if n is not None and abs(n - float(esperada)) < 1e-9:
                return True
        elif _base(respuesta).replace(",", "") == _base(esperada):  # fracciones ("1/2") y palabras ("imposible")
            return True
    return False


def calificar(respuestas: dict[str, str | None], grado: str | None = None) -> dict[str, bool]:
    """{habilidad: True si la respondió bien}. Las que faltan o dicen "no sé" quedan en False."""
    return {p["habilidad"]: _correcta(respuestas.get(p["id"]), p) for p in preguntas_de(grado)}


def resumen(resultados: dict[str, bool]) -> list[dict]:
    return [{"habilidad": h, "nombre": NOMBRES.get(h, h), "logrado": ok} for h, ok in resultados.items()]


def habilidades_en_orden(presentes: set[str]) -> list[str]:
    """Las habilidades que aparecen en algún examen, en el orden de NOMBRES."""
    return [h for h in NOMBRES if h in presentes] + sorted(presentes - NOMBRES.keys())
