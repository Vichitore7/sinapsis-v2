"""Módulo de Álgebra (1.º a 3.º de secundaria).

Basado en docs/material-de-estudio/secundaria-1-3.md (SEP 2024, Fase 6, eje "Álgebra"):
- 1.º: ecuaciones Ax = B, Ax + B = C y Ax + B = Cx + D; regla de sucesiones aritméticas;
       pasar del lenguaje común al algebraico; perímetros con letras.
- 2.º: sistemas de 2 ecuaciones con 2 incógnitas; desigualdades.
- 3.º: ecuaciones cuadráticas por factorización y con la fórmula general.

Todo el texto es propio del equipo (no se copia ni adapta texto de la SEP ni de libros).
Todo está en BORRADOR: falta la revisión pedagógica de la maestra o el maestro.

Tipos de ejercicio (los mismos que ya califica juego.evaluar):
- conteo: la respuesta es un número (el valor de la incógnita, un término de la sucesión...).
- opcion: elegir una de las opciones (una regla, una expresión, una factorización).

Campos para el frontend (pantallas/Reto.jsx):
- expresion: la ecuación o sucesión que se muestra grande. Puede tener varias líneas (sistemas).
- etiqueta:  lo que va antes de la caja de respuesta ("x =", "Lugar 10 =").
Nunca traen la respuesta.
"""
from __future__ import annotations

TEMA = "algebra"
PASO_INICIAL = "Lee la ecuación"


def _numero(id_, titulo, enunciado, expresion, etiqueta, respuesta, pistas, error, explicacion, moneda=False):
    return {"id": id_, "tipo": "conteo", "titulo": titulo, "enunciado": enunciado, "expresion": expresion,
            "etiqueta": etiqueta, "respuesta": str(respuesta), "pistas": pistas, "pregunta_error": error,
            "explicacion": explicacion, "moneda": moneda}


def _opcion(id_, titulo, enunciado, expresion, opciones, respuesta, pistas, error, explicacion):
    assert respuesta in opciones, f"{id_}: la respuesta no está en las opciones"
    return {"id": id_, "tipo": "opcion", "titulo": titulo, "enunciado": enunciado, "expresion": expresion,
            "opciones": opciones, "respuesta": respuesta, "pistas": pistas, "pregunta_error": error,
            "explicacion": explicacion}


LECCIONES = [
    {
        "id": "al1", "nombre": "La balanza encantada", "concepto": "Ecuaciones de primer grado (1.º de secundaria)",
        "sticker": "sombrero", "dificultad": 1,
        "entrada": "¡Llegaste a la balanza encantada! Lo que hagas de un lado, hazlo también del otro para que no se ladee.",
        "ejercicios": [
            _numero("al1-r1", "Costales iguales",
                    "En un platillo hay 4 costales de cacao iguales y en el otro, pesas que suman 20 kg. "
                    "La balanza está pareja. ¿Cuánto pesa cada costal?",
                    "4x = 20", "x =", 5,
                    ["¿Qué representa la x en la balanza?",
                     "Si 4 costales juntos pesan 20 kg, ¿qué operación reparte el peso entre los 4?",
                     "Divide los dos lados de la balanza entre el mismo número."],
                    "Comprueba: si multiplicas tu número por 4, ¿te da 20?",
                    "4x = 20. Se dividen los dos lados entre 4: x = 5. Cada costal pesa 5 kg."),
            _numero("al1-r2", "Las piñas y la pesa",
                    "Kiko pone 3 piñas iguales y una pesa de 5 kg en un platillo. En el otro hay 26 kg. "
                    "La balanza está pareja. ¿Cuánto pesa cada piña?",
                    "3x + 5 = 26", "x =", 7,
                    ["¿Qué estorba para dejar solas a las piñas?",
                     "Quita 5 kg de los dos platillos. ¿Qué queda de cada lado?",
                     "Cuando queden solo las 3 piñas, reparte el peso entre 3."],
                    "Pon tu número en lugar de la x en 3x + 5. ¿Te da 26?",
                    "3x + 5 = 26. Se restan 5 de los dos lados: 3x = 21. Se divide entre 3: x = 7."),
            _numero("al1-r3", "Las bolsas de semillas",
                    "Kiko junta 5 bolsas con la misma cantidad de semillas. Regala 4 semillas y le quedan 31. "
                    "¿Cuántas semillas traía cada bolsa?",
                    "5x − 4 = 31", "x =", 7,
                    ["Al regalar 4 semillas, ¿el total subió o bajó?",
                     "Para deshacer una resta, ¿qué operación haces en los dos lados?",
                     "Después de eso, reparte entre las 5 bolsas."],
                    "Pon tu número en lugar de la x en 5x − 4. ¿Te da 31?",
                    "5x − 4 = 31. Se suman 4 a los dos lados: 5x = 35. Se divide entre 5: x = 7."),
            _numero("al1-r4", "Cajas en los dos platillos",
                    "En un platillo hay 5 cajas iguales y 3 kg sueltos. En el otro hay 2 cajas iguales y 18 kg. "
                    "La balanza está pareja. ¿Cuánto pesa cada caja?",
                    "5x + 3 = 2x + 18", "x =", 5,
                    ["Hay cajas en los dos platillos. ¿Puedes quitar las mismas cajas de cada lado?",
                     "Quita 2 cajas de cada platillo. ¿Qué ecuación te queda?",
                     "Ahora quita los kilos sueltos del lado de las cajas y reparte entre las cajas que quedan."],
                    "Pon tu número en los dos lados de la ecuación. ¿Dan lo mismo?",
                    "5x + 3 = 2x + 18. Se restan 2x: 3x + 3 = 18. Se restan 3: 3x = 15. Se divide entre 3: x = 5."),
        ],
    },
    {
        "id": "al2", "nombre": "El sendero de los patrones", "concepto": "Sucesiones y lenguaje algebraico (1.º de secundaria)",
        "sticker": "flor", "dificultad": 1,
        "entrada": "En este sendero las piedras siguen una regla. Descúbrela y podrás saber qué piedra viene, aunque esté muy lejos.",
        "ejercicios": [
            _numero("al2-r1", "Las piedras del sendero",
                    "Las piedras del sendero tienen estos números. Si el patrón sigue igual, ¿qué número tiene la piedra del lugar 10?",
                    "3, 7, 11, 15, …", "Lugar 10 =", 39,
                    ["¿Cuánto aumenta de un número al siguiente?",
                     "Del lugar 1 al lugar 10, ¿cuántos saltos hay?",
                     "Empieza en el primer número y suma el salto esas veces."],
                    "Revisa cuántos saltos hay del lugar 1 al lugar 10: no son 10.",
                    "La sucesión aumenta de 4 en 4. Del lugar 1 al 10 hay 9 saltos: 3 + 9 × 4 = 39. Su regla es 4n − 1."),
            _opcion("al2-r2", "La regla escondida",
                    "¿Qué regla da esta sucesión? La n es el lugar de cada número (1, 2, 3…).",
                    "5, 8, 11, 14, …",
                    ["3n + 2", "n + 3", "5n", "3n + 5"], "3n + 2",
                    ["¿Cuánto crece la sucesión en cada paso? Ese número acompaña a la n.",
                     "Prueba cada regla con n = 1. ¿Cuál da 5?",
                     "Comprueba también con n = 2: debe dar 8."],
                    "Pon n = 1 y n = 2 en la regla que elegiste. ¿Salen 5 y 8?",
                    "Crece de 3 en 3, así que la regla empieza con 3n. Con n = 1: 3 + 2 = 5. La regla es 3n + 2."),
            _opcion("al2-r3", "De palabras a letras",
                    "Kiko piensa un número, lo multiplica por 2 y al resultado le suma 7. ¿Cómo se escribe con álgebra?",
                    "El doble de un número, aumentado en 7",
                    ["2x + 7", "2(x + 7)", "x² + 7", "7x + 2"], "2x + 7",
                    ["¿Qué significa «el doble de un número»?",
                     "Primero se hace el doble y después se suma. ¿En qué orden van?",
                     "Los paréntesis cambian el orden: ¿la frase los necesita?"],
                    "Lee la frase por partes: primero el doble y después sumarle 7.",
                    "El doble de x es 2x; aumentado en 7 queda 2x + 7."),
            _numero("al2-r4", "La chinampa rectangular",
                    "Una chinampa rectangular mide x metros de largo y 3 metros de ancho. Su perímetro es P = 2x + 6. "
                    "Si el largo es de 9 metros, ¿cuánto mide el perímetro?",
                    "P = 2x + 6", "P =", 24,
                    ["¿Cuántos lados tiene un rectángulo y cuáles miden lo mismo?",
                     "Cambia la x por 9 en la expresión.",
                     "Primero multiplica y al final suma."],
                    "Recuerda que 2x significa 2 por x.",
                    "P = 2(9) + 6 = 18 + 6 = 24 metros."),
        ],
    },
    {
        "id": "al3", "nombre": "Dos caminos, un cruce", "concepto": "Sistemas de ecuaciones y desigualdades (2.º de secundaria)",
        "sticker": "mochila", "dificultad": 2,
        "entrada": "Aquí dos senderos se cruzan. Cada uno es una ecuación: encuentra el punto donde los dos dicen lo mismo.",
        "ejercicios": [
            _numero("al3-r1", "Dos números misteriosos",
                    "Dos números suman 12 y el mayor le gana al menor por 4. ¿Cuál es el número mayor?",
                    "x + y = 12\nx − y = 4", "x =", 8,
                    ["Si sumas las dos ecuaciones, ¿qué le pasa a la y?",
                     "Después de sumarlas te queda una ecuación solo con x.",
                     "Resuélvela como en la balanza encantada."],
                    "Comprueba: con tu x, ¿qué y sale en la primera ecuación? ¿Cumple también la segunda?",
                    "Al sumar las ecuaciones: 2x = 16, así que x = 8 y y = 4."),
            _numero("al3-r2", "La papelería",
                    "En la papelería, 2 cuadernos y 1 pluma cuestan $41. Un cuaderno y una pluma cuestan $25. ¿Cuánto cuesta un cuaderno?",
                    "2c + p = 41\nc + p = 25", "c = $", 16,
                    ["Compara las dos compras: ¿qué trae de más la primera?",
                     "Si a la primera compra le quitas la segunda, ¿qué queda?",
                     "Lo que sobra al restar es justo lo que cuesta lo que trae de más."],
                    "Prueba tu precio: ¿cuánto costaría la pluma? ¿Se cumplen las dos compras?",
                    "Al restar las ecuaciones: c = 41 − 25 = 16. El cuaderno cuesta $16 y la pluma $9.",
                    moneda=True),
            _numero("al3-r3", "El cruce de los senderos",
                    "Un sendero sigue la regla y = 2x + 1 y el otro, y = x + 5. ¿En qué valor de x se cruzan?",
                    "y = 2x + 1\ny = x + 5", "x =", 4,
                    ["En el cruce, los dos senderos tienen la misma y.",
                     "Iguala las dos expresiones: 2x + 1 = x + 5.",
                     "Resuelve esa ecuación como en la balanza encantada."],
                    "Pon tu x en los dos senderos. ¿Dan la misma y?",
                    "2x + 1 = x + 5, así que x = 4. En el cruce, y = 9."),
            _opcion("al3-r4", "¿Qué números pasan?",
                    "Solo cruzan el puente los números que cumplen esta desigualdad. ¿Cuáles son?",
                    "3x + 2 > 14",
                    ["x > 4", "x < 4", "x > 12", "x = 4"], "x > 4",
                    ["Resuélvela como una ecuación, pero cuidando el signo >.",
                     "Primero quita el 2 de los dos lados.",
                     "Luego reparte entre 3. Como 3 es positivo, el signo no cambia."],
                    "Prueba con un número de la opción que elegiste. ¿Cumple 3x + 2 > 14?",
                    "3x + 2 > 14, así que 3x > 12 y x > 4."),
        ],
    },
    {
        "id": "al4", "nombre": "El salto de la rana", "concepto": "Ecuaciones cuadráticas (3.º de secundaria)",
        "sticker": "bufanda", "dificultad": 3,
        "entrada": "La rana del estanque salta formando una curva. Las ecuaciones cuadráticas dicen dónde despega y dónde cae.",
        "ejercicios": [
            _numero("al4-r1", "El estanque cuadrado",
                    "El estanque de la rana es un cuadrado de 49 m² de área. ¿Cuánto mide cada lado?",
                    "x² = 49", "x =", 7,
                    ["El área de un cuadrado es lado por lado.",
                     "¿Qué número multiplicado por sí mismo da 49?",
                     "Repasa las tablas: busca el número que se multiplica por sí mismo."],
                    "Multiplica tu número por sí mismo. ¿Da 49?",
                    "x² = 49, así que x = 7 (la medida de un lado no puede ser negativa)."),
            _numero("al4-r2", "Dos lugares para caer",
                    "Resuelve la ecuación. Tiene dos soluciones: escribe la mayor.",
                    "x² − 5x + 6 = 0", "x =", 3,
                    ["Busca dos números que multiplicados den 6 y sumados den −5.",
                     "Escribe la ecuación como (x − ▢)(x − ▢) = 0.",
                     "Si un producto da 0, uno de los factores vale 0."],
                    "Pon tu número en lugar de la x en x² − 5x + 6. ¿Da 0?",
                    "x² − 5x + 6 = (x − 2)(x − 3) = 0. Las soluciones son 2 y 3; la mayor es 3."),
            _opcion("al4-r3", "Factoriza el salto",
                    "¿Cuál es la factorización de esta expresión?",
                    "x² + 7x + 12",
                    ["(x + 3)(x + 4)", "(x + 2)(x + 6)", "(x + 1)(x + 12)", "(x − 3)(x − 4)"], "(x + 3)(x + 4)",
                    ["Necesitas dos números que multiplicados den 12.",
                     "De esos, ¿cuáles sumados dan 7?",
                     "Comprueba multiplicando los paréntesis."],
                    "Multiplica los paréntesis que elegiste. ¿Te da x² + 7x + 12?",
                    "3 × 4 = 12 y 3 + 4 = 7, así que x² + 7x + 12 = (x + 3)(x + 4)."),
            _numero("al4-r4", "La fórmula general",
                    "Usa la fórmula general para resolver la ecuación. Escribe la solución positiva.",
                    "2x² − 3x − 9 = 0", "x =", 3,
                    ["Identifica a, b y c: el número de x², el de x y el que va solo.",
                     "Calcula primero lo que va dentro de la raíz: b² − 4ac.",
                     "Con esa raíz, usa el signo + para encontrar la solución positiva."],
                    "Pon tu número en lugar de la x en 2x² − 3x − 9. ¿Da 0?",
                    "a = 2, b = −3, c = −9. b² − 4ac = 9 + 72 = 81 y su raíz es 9. x = (3 + 9) / 4 = 3."),
        ],
    },
]


def ejercicio_tabla(e: dict, orden: int, dificultad: int) -> dict:
    """Un ejercicio de álgebra en el formato de la tabla `ejercicios`."""
    claves_datos = ("expresion", "etiqueta", "opciones", "pregunta_error", "moneda")
    return {
        "id": e["id"], "orden": orden, "tipo": e["tipo"], "titulo": e["titulo"], "enunciado": e["enunciado"],
        "datos": {**{k: e[k] for k in claves_datos if k in e}, "paso_inicial": PASO_INICIAL},
        "respuesta": e["respuesta"], "pistas": e["pistas"], "dificultad": dificultad, "explicacion": e["explicacion"],
    }
