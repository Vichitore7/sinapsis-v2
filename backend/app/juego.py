"""Reglas del juego (docs/selva-matematica/Recompensas-y-cuidados.md y Apoyo-visual.md).

El servidor es la fuente de verdad: valida respuestas, da estrellas y mueve los medidores.
Los números marcados como VALOR INICIAL se ajustan aquí después de probar con alumnos.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

VALORES = {
    "estrellas_primera": 3,      # VALOR INICIAL: acertar a la primera
    "estrellas_con_ayuda": 2,    # VALOR INICIAL: acertar después de pistas o errores
    "bono_reto_del_dia": 5,      # VALOR INICIAL
    "estrellas_cofre": 10,       # VALOR INICIAL
    "costo_alimentar": 1,        # VALOR INICIAL
    "costo_jugar": 2,            # VALOR INICIAL
    "retos_por_bajada": 3,       # VALOR INICIAL: cada 3 retos baja una marca de un medidor
    "racha_para_subir_etapa": 3, # VALOR INICIAL: 3 retos seguidos sin pistas -> menos apoyo visual
    "xp_por_nivel": 30,          # VALOR INICIAL
    "max_marcas": 5,
    "min_marcas": 1,
    "max_pistas": 3,
}

MEDIDORES = ("comida", "pecera", "alegria")

CUIDADOS = {
    "alimentar": {"costo": VALORES["costo_alimentar"], "medidor": "comida", "sube": 2},
    "jugar": {"costo": VALORES["costo_jugar"], "medidor": "alegria", "sube": 2},
    "limpiar": {"costo": 0, "medidor": "pecera", "sube": VALORES["max_marcas"]},
    "descansar": {"costo": 0, "medidor": None, "sube": 0},
}


# ---------------- Diagnóstico de la senda de pasos (sin IA) ----------------

def _f(n: int, moneda: bool) -> str:
    return f"${n}" if moneda else str(n)


def _suma_repetida(a: int, b: int) -> str:
    return " + ".join([str(b)] * a)


OPERACIONES = {"×": lambda a, b: a * b, "+": lambda a, b: a + b, "−": lambda a, b: a - b}


def normalizar_op(op: str) -> str:
    return {"x": "×", "X": "×", "*": "×", "-": "−", "–": "−"}.get(op, op)


def diagnosticar(a: int, op: str, b: int, c: int, moneda: bool = False) -> dict:
    """Dice en qué paso se torció el procedimiento, con una pregunta socrática. Nunca da la respuesta."""
    op = normalizar_op(op)
    if op not in OPERACIONES:
        raise ValueError(f"Operación no soportada: {op}")
    esperado = OPERACIONES[op](a, b)
    datos = f"{a} montones de {_f(b, moneda)}" if op == "×" else f"{_f(a, moneda)} y {_f(b, moneda)}"
    pasos = [
        {"texto": f"Datos: {datos}", "estado": "ok"},
        {"texto": f"{a} {op} {_f(b, moneda)}", "estado": "ok"},
        {"texto": f"= {_f(c, moneda)}", "estado": "ok"},
        {"texto": "Resultado", "estado": "ok"},
    ]
    if c == esperado:
        return {"correcto": True, "pasos": pasos, "paso_torcido": None, "tipo_error": None, "pregunta": None}

    if op == "×" and c == a + b and a * b != a + b:
        pasos[1]["estado"] = "casi"
        pasos[2]["estado"] = pasos[3]["estado"] = "pendiente"
        return {
            "correcto": False, "pasos": pasos, "paso_torcido": 2, "tipo_error": "sumo",
            "pregunta": f"¿Juntaste {a} montones de {_f(b, moneda)}, o sumaste {a} + {b}?",
        }

    if op == "×":
        pregunta = f"¿{_suma_repetida(a, b)} da {c}?" if a <= 6 else f"¿{a} × {b} da {c}? Cuenta de {b} en {b}."
    elif op == "+":
        pregunta = f"¿{a} + {b} da {c}? Cuenta desde {a} y avanza {b}."
    else:
        pregunta = f"Comprueba al revés: ¿{c} + {b} da {a}?"
    pasos[2]["estado"] = "casi"
    pasos[3]["estado"] = "pendiente"
    return {"correcto": False, "pasos": pasos, "paso_torcido": 3, "tipo_error": "calculo", "pregunta": pregunta}


def _normalizar_opcion(texto: str) -> str:
    quitar = str.maketrans("áéíóúü", "aeiouu")
    return " ".join((texto or "").lower().translate(quitar).split())


def evaluar(tipo: str, datos: dict, respuesta_correcta: str, respuesta: str) -> dict:
    """Califica cualquier tipo de ejercicio y arma la senda de pasos. Nunca da la respuesta.

    - numerica: cuenta a op b (multiplicación, suma, resta) con diagnóstico paso a paso.
    - conteo:   un número (contar, medir, monedas, gráficas, decenas).
    - opcion:   una de las opciones.
    Lanza ValueError si la respuesta no se puede leer (el servidor responde 422).
    """
    if tipo == "opcion":
        if not (respuesta or "").strip():
            raise ValueError("Elige una opción.")
        correcto = _normalizar_opcion(respuesta) == _normalizar_opcion(respuesta_correcta)
        accion = "Elige la opción"
    else:
        numero = leer_numero(respuesta)
        if numero is None:
            raise ValueError("Escribe tu respuesta con números.")
        if tipo == "numerica":
            return diagnosticar(datos["a"], datos.get("op", "×"), datos["b"], numero, datos.get("moneda", False))
        correcto = numero == int(respuesta_correcta)
        accion = f"Tu respuesta: {_f(numero, datos.get('moneda', False))}"
    pasos = [
        {"texto": datos.get("paso_inicial", "Observa el dibujo"), "estado": "ok"},
        {"texto": accion, "estado": "ok" if correcto else "casi"},
        {"texto": "Resultado", "estado": "ok" if correcto else "pendiente"},
    ]
    if correcto:
        return {"correcto": True, "pasos": pasos, "paso_torcido": None, "tipo_error": None, "pregunta": None}
    return {"correcto": False, "pasos": pasos, "paso_torcido": 2, "tipo_error": tipo,
            "pregunta": datos.get("pregunta_error") or "Vuelve a mirar el dibujo con calma. ¿Qué ves?"}


def pistas_multiplicacion(a: int, b: int, moneda: bool, objeto: str) -> list[str]:
    """3 pistas escalonadas que nunca dicen la respuesta."""
    return [
        f"¿Cuántos {objeto} hay y cuánto cuesta cada uno?",
        f"Si juntas {a} montones de {_f(b, moneda)}, ¿qué operación estás haciendo?",
        f"¿Cuánto da {_suma_repetida(a, b)}?" if a <= 6 else f"Cuenta de {b} en {b}, {a} veces. ¿A qué número llegas?",
    ]


def leer_numero(texto: str) -> int | None:
    """Lee el número que escribió el alumno ("$18", "x = 7", "-3"). Respeta el signo menos antes del número."""
    texto = texto or ""
    digitos = "".join(ch for ch in texto if ch.isdigit())
    if not digitos or len(digitos) > 9:
        return None
    antes = texto[: next(i for i, ch in enumerate(texto) if ch.isdigit())].rstrip()
    negativo = antes.endswith(("-", "−"))
    return -int(digitos) if negativo else int(digitos)


# ---------------- Recompensas, escalera y bienestar ----------------

def estrellas_por_acierto(con_ayuda: bool) -> int:
    return VALORES["estrellas_con_ayuda"] if con_ayuda else VALORES["estrellas_primera"]


def avanzar_etapa(etapa: int, racha: int, uso_pistas: bool) -> tuple[int, int]:
    """Devuelve (etapa, racha_sin_pistas) nuevas."""
    if uso_pistas:
        return etapa, 0
    racha += 1
    if racha >= VALORES["racha_para_subir_etapa"] and etapa < 4:
        return etapa + 1, 0
    return etapa, racha


def etapa_para_ejercicio(datos: dict, etapa_apoyo: int) -> int:
    etapa = max(datos.get("etapa_min", 1), etapa_apoyo)
    if etapa == 1 and datos.get("b", 0) > 12:
        etapa = 2  # más de 12 monedas por montón: bolsitas
    return min(etapa, 4)


@dataclass
class Desgaste:
    medidor: str | None
    retos_desde_bajada: int
    turno: int


def desgaste_al_jugar(retos_desde_bajada: int, turno: int) -> Desgaste:
    """Cada N retos baja una marca de un medidor, por turnos. Si no se juega, no baja nada."""
    n = retos_desde_bajada + 1
    if n < VALORES["retos_por_bajada"]:
        return Desgaste(None, n, turno)
    return Desgaste(MEDIDORES[turno % len(MEDIDORES)], 0, turno + 1)


def lo_que_pide(m: dict) -> str | None:
    peor = None
    for k in MEDIDORES:
        if m[k] <= 2 and (peor is None or m[k] < m[peor]):
            peor = k
    return peor


def nueva_racha(racha: int, ultima: date | None, hoy: date) -> int:
    """Días seguidos con al menos un reto. Si se rompe, vuelve a 1 sin castigo."""
    if ultima == hoy:
        return max(racha, 1)
    if ultima is not None and (hoy - ultima).days == 1:
        return racha + 1
    return 1


def nivel(xp: int) -> int:
    return xp // VALORES["xp_por_nivel"] + 1


def logros(resueltos: int, stats: dict, lecciones_terminadas: int) -> list[dict]:
    return [
        {"id": "cuenta", "nombre": "Inicio de la aventura", "detalle": "Crea tu cuenta de explorador.", "hecho": True},
        {"id": "primera", "nombre": "Primera misión", "detalle": "Resuelve tu primer reto.", "hecho": resueltos >= 1},
        {"id": "cinco", "nombre": "Explorador constante", "detalle": "Resuelve 5 retos.", "hecho": resueltos >= 5},
        {"id": "solo", "nombre": "Lo descubrí yo", "detalle": "Resuelve 3 retos sin pistas.", "hecho": stats.get("retos_sin_ayuda", 0) >= 3},
        {"id": "pista", "nombre": "Pedir ayuda es de valientes", "detalle": "Usa una pista y termina el reto.",
         "hecho": stats.get("pistas_pedidas", 0) >= 1 and resueltos >= 1},
        {"id": "cuidador", "nombre": "Gran cuidador", "detalle": "Cuida a tu ajolote 5 veces.", "hecho": stats.get("cuidados", 0) >= 5},
        {"id": "mundo", "nombre": "Mundo superado", "detalle": "Abre el cofre de un mundo.", "hecho": lecciones_terminadas >= 1},
    ]
