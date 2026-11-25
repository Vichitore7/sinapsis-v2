"""Operaciones del escáner: enteros (× + − ÷ con residuo) y fracciones (× + − ÷).

Una operación es {"a": str, "op": str, "b": str, "c": str | "", "residuo": str | ""}, con números como texto:
"17", "3/4". Así el mismo formato sirve para enteros y fracciones. El diagnóstico NUNCA regresa el resultado
al alumno: solo dice en qué paso se torció y una pregunta socrática.
"""
from __future__ import annotations

import re
from fractions import Fraction

from . import juego

OPS = ("×", "+", "−", "÷")
_NUMERO = re.compile(r"^\s*(\d{1,7})\s*(?:/\s*(\d{1,7}))?\s*$")


def normalizar_op(op: str) -> str:
    op = (op or "").strip()
    return {"x": "×", "X": "×", "*": "×", "-": "−", "–": "−", "/": "÷", ":": "÷"}.get(op, op)


def numero(texto) -> Fraction | None:
    """'17' -> 17; '3/4' -> 3/4. None si no es un número natural o una fracción con denominador > 0."""
    m = _NUMERO.match(str(texto if texto is not None else ""))
    if not m:
        return None
    n, d = int(m.group(1)), int(m.group(2) or 1)
    return Fraction(n, d) if d else None


def es_fraccion(texto) -> bool:
    return "/" in str(texto or "")


def texto(f: Fraction) -> str:
    return str(f.numerator) if f.denominator == 1 else f"{f.numerator}/{f.denominator}"


def tipo(op: dict) -> str:
    """'enteros' (× + −, lo de siempre), 'division' (enteros con ÷) o 'fracciones'."""
    if any(es_fraccion(op.get(k)) for k in ("a", "b", "c")):
        return "fracciones"
    return "division" if op["op"] == "÷" else "enteros"


def validar(op: dict) -> dict | None:
    """Normaliza la operación (ints o textos) o regresa None si no se puede revisar."""
    o = normalizar_op(op.get("op"))
    a, b = numero(op.get("a")), numero(op.get("b"))
    if o not in OPS or a is None or b is None:
        return None
    c_txt = "" if op.get("c") in (None, "") else str(op.get("c")).replace(" ", "")
    r_txt = "" if op.get("residuo") in (None, "") else str(op.get("residuo")).strip()
    if c_txt and numero(c_txt) is None:
        return None
    salida = {"a": str(op["a"]).replace(" ", ""), "op": o, "b": str(op["b"]).replace(" ", ""), "c": c_txt, "residuo": ""}
    t = tipo(salida)
    if o == "÷" and b == 0:
        return None
    if o == "−" and a < b:
        return None  # los números negativos llegan en secundaria; aquí no se revisan
    if t == "division" and r_txt:
        if not r_txt.isdigit():
            return None
        salida["residuo"] = r_txt
    return salida


def resultado(op: dict) -> dict:
    """Lo correcto: {"valor": Fraction} y, en la división de enteros, también {"cociente", "residuo"}."""
    a, b = numero(op["a"]), numero(op["b"])
    o = op["op"]
    if tipo(op) == "division":
        return {"cociente": int(a) // int(b), "residuo": int(a) % int(b), "valor": a / b}
    # Solo la operación que toca (antes se calculaban las cuatro y la división entre 0 tronaba en "5 + 0").
    valor = {"×": lambda: a * b, "+": lambda: a + b, "−": lambda: a - b, "÷": lambda: a / b}[o]()
    return {"valor": valor}


def resultado_texto(op: dict) -> str:
    """Para el tutor (es SECRETO): '42', '5/4' o '3 residuo 2'."""
    r = resultado(op)
    if "cociente" in r:
        return f"{r['cociente']} residuo {r['residuo']}" if r["residuo"] else str(r["cociente"])
    return texto(r["valor"])


def _pasos(*textos: str) -> list[dict]:
    return [{"texto": t, "estado": "ok"} for t in textos]


def _torcer(pasos: list[dict], en: int) -> None:
    """Marca el paso `en` (1-based) como 'casi' y los siguientes como pendientes."""
    pasos[en - 1]["estado"] = "casi"
    for p in pasos[en:]:
        p["estado"] = "pendiente"


def _errores_tipicos(d: dict, a: int, o: str, b: int, c: int) -> dict:
    """Errores típicos de enteros que el diagnóstico general no distingue (los encontró la evaluación pedagógica)."""
    if d["correcto"] or d["tipo_error"] == "sumo":
        return d
    bien = {"+": a + b, "−": a - b, "×": a * b}[o]
    nuevo = None
    if o == "+" and bien - c == 10 and (a % 10) + (b % 10) >= 10:
        nuevo = ("no_llevo", f"Suma primero las unidades: {a % 10} + {b % 10}. ¿Te alcanzó para formar otra decena? ¿Dónde la pusiste?")
    elif o == "−" and c - bien == 10 and (a % 10) < (b % 10):
        nuevo = ("no_pidio", f"En las unidades, ¿te alcanza para quitar {b % 10} de {a % 10}? Si no, ¿a quién le pides prestado?")
    elif o == "×" and b and c % b == 0 and abs(c // b - a) == 1:
        grupos = c // b
        nuevo = ("un_grupo", f"Tu {c} son {grupos} grupos de {b}. ¿Cuántos grupos de {b} necesitas juntar en {a} × {b}?")
    elif o == "×" and a and c % a == 0 and abs(c // a - b) == 1:
        grupos = c // a
        nuevo = ("un_grupo", f"Tu {c} son {grupos} grupos de {a}. ¿Cuántos grupos de {a} necesitas juntar en {a} × {b}?")
    if nuevo:
        d = {**d, "tipo_error": nuevo[0], "pregunta": nuevo[1]}
    return d


def diagnosticar(op: dict) -> dict:
    """{correcto, pasos, paso_torcido, tipo_error, pregunta}. Si falta el resultado (c vacío), correcto es None."""
    t = tipo(op)
    a, o, b, c = op["a"], op["op"], op["b"], op["c"]
    if t == "enteros":
        if not c:
            return {"correcto": None, "pasos": [], "paso_torcido": None, "tipo_error": None, "pregunta": None}
        return _errores_tipicos(juego.diagnosticar(int(a), o, int(b), int(numero(c))), int(a), o, int(b), int(numero(c)))

    if not c:
        return {"correcto": None, "pasos": [], "paso_torcido": None, "tipo_error": None, "pregunta": None}
    bien = {"correcto": True, "paso_torcido": None, "tipo_error": None, "pregunta": None}

    if t == "division":
        A, B = int(numero(a)), int(numero(b))
        q, r = int(numero(c)), int(op.get("residuo") or 0)
        pasos = _pasos(f"Repartir {A} entre {B}", f"¿Cuántas veces cabe el {B}?", f"Sobran {r}", "Comprobar")
        cq, cr = A // B, A % B
        if q == cq and r == cr:
            return {**bien, "pasos": pasos}
        if r >= B:
            _torcer(pasos, 3)
            return {"correcto": False, "pasos": pasos, "paso_torcido": 3, "tipo_error": "residuo_grande",
                    "pregunta": f"Te sobraron {r}. ¿Con lo que sobra todavía alcanza para otro grupo de {B}?"}
        if q == cq:
            _torcer(pasos, 3)
            return {"correcto": False, "pasos": pasos, "paso_torcido": 3, "tipo_error": "residuo",
                    "pregunta": f"Comprueba: ¿{B} × {q} + {r} da {A}?"}
        _torcer(pasos, 2)
        return {"correcto": False, "pasos": pasos, "paso_torcido": 2, "tipo_error": "cociente",
                "pregunta": f"Comprueba al revés: ¿{B} × {q} + {r} da {A}?"}

    # Fracciones
    fa, fb, fc = numero(a), numero(b), numero(c)
    correcto = resultado(op)["valor"]
    paso2 = {"+": "Partes del mismo tamaño", "−": "Partes del mismo tamaño",
             "×": "Numeradores y denominadores", "÷": "Dar la vuelta a la segunda"}[o]
    pasos = _pasos(f"Datos: {a} {o} {b}", paso2, f"= {c}", "Resultado")
    if fc == correcto:
        extra = None
        if es_fraccion(c) and Fraction(c.replace(" ", "")).denominator != int(c.split("/")[1]):
            extra = "¡Está bien! ¿Se puede escribir con números más pequeños?"
        return {**bien, "pasos": pasos, "pregunta": extra}
    na, da = fa.numerator, fa.denominator
    nb, db = fb.numerator, fb.denominator
    if o in "+−" and da != db and fc == Fraction(na + nb if o == "+" else max(na - nb, 0), da + db if o == "+" else max(da - db, 1)):
        _torcer(pasos, 2)
        return {"correcto": False, "pasos": pasos, "paso_torcido": 2, "tipo_error": "sumo_denominadores",
                "pregunta": f"¿Un pedazo de {texto(Fraction(1, da))} y uno de {texto(Fraction(1, db))} son del mismo tamaño? "
                            "Antes de juntarlos, ¿cómo los haces iguales?"}
    if o in "+−" and da != db:
        _torcer(pasos, 2)
        return {"correcto": False, "pasos": pasos, "paso_torcido": 2, "tipo_error": "denominador",
                "pregunta": f"¿Qué denominador pueden tener {a} y {b} para que sus partes sean del mismo tamaño?"}
    if o == "÷" and fc == fa * fb:
        _torcer(pasos, 2)
        return {"correcto": False, "pasos": pasos, "paso_torcido": 2, "tipo_error": "multiplico",
                "pregunta": f"Multiplicaste. Para dividir entre {b}, ¿qué le pasa primero a la segunda fracción?"}
    _torcer(pasos, 3)
    preguntas = {"+": f"Si las partes ya son iguales, ¿cuántas partes juntas en total al sumar {a} + {b}?",
                 "−": f"Si las partes ya son iguales, ¿cuántas partes quedan al quitar {b} de {a}?",
                 "×": "¿Multiplicaste numerador por numerador y denominador por denominador?",
                 "÷": f"Comprueba al revés: ¿{c} × {b} da {a}?"}
    return {"correcto": False, "pasos": pasos, "paso_torcido": 3, "tipo_error": "calculo", "pregunta": preguntas[o]}


# ---------------- Para el filtro del tutor ----------------

_FRACCION_EN_TEXTO = re.compile(r"(\d+)\s*/\s*(\d+)")


def trae_fraccion(texto_: str, valor: Fraction) -> bool:
    """¿El texto escribe una fracción igual a `valor` (aunque sea equivalente, como 10/8 por 5/4)?"""
    for n, d in _FRACCION_EN_TEXTO.findall(texto_ or ""):
        if int(d) and Fraction(int(n), int(d)) == valor:
            return True
    return False
