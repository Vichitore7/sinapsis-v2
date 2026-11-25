"""Fase 1: memoria de aprendizaje del alumno (la llena el código, no el modelo)."""
import json
from types import SimpleNamespace

import pytest

from app import aprendizaje, config, tutor
from tests.conftest import registrar


def memoria(c):
    return {m["concepto"]: m for m in c.get("/api/aprendizaje").json()["conceptos"]}


def escanear(c, a, op, b, cc, residuo=None):
    r = c.post("/api/escaner/resultado", json={"a": a, "op": op, "b": b, "c": cc, "residuo": residuo})
    assert r.status_code == 200, r.text
    return r.json()


def test_nuevo_alumno_sin_memoria(cliente):
    registrar(cliente)
    assert memoria(cliente) == {}


def test_un_acierto_no_es_dominio(cliente):
    registrar(cliente)
    assert escanear(cliente, "3/4", "+", "1/4", "1")["estado"] == "practicando"
    m = memoria(cliente)["suma_fracciones"]
    assert m["nombre"] == "Suma de fracciones" and m["sin_ayuda"] == 1


def test_dominio_con_tres_ejercicios_distintos(cliente):
    registrar(cliente)
    escanear(cliente, 6, "×", 7, 42)
    escanear(cliente, 6, "×", 7, 42)  # el mismo ejercicio otra vez no cuenta doble
    assert escanear(cliente, 3, "×", 4, 12)["estado"] == "practicando"
    assert escanear(cliente, 5, "×", 5, 25)["estado"] == "dominado"


def test_errores_y_correccion_con_ayuda(cliente):
    registrar(cliente)
    escanear(cliente, "3/4", "+", "1/2", "4/6")
    assert escanear(cliente, "2/3", "+", "1/6", "3/9")["estado"] == "necesita_refuerzo"
    m = memoria(cliente)["suma_fracciones"]
    assert m["tipos_error"] == {"sumo_denominadores": 2} and m["errores"] == 2
    # La corrige después: cuenta como resuelta CON ayuda, no sola.
    escanear(cliente, "3/4", "+", "1/2", "5/4")
    m = memoria(cliente)["suma_fracciones"]
    assert m["con_ayuda"] == 1 and m["sin_ayuda"] == 0


def test_division_y_operacion_invalida(cliente):
    registrar(cliente)
    assert escanear(cliente, 17, "÷", 5, 3, 2)["concepto"] == "division"
    assert cliente.post("/api/escaner/resultado", json={"a": 3, "op": "−", "b": 7, "c": 4}).status_code == 422


def test_retos_del_mapa_alimentan_la_memoria(cliente):
    registrar(cliente)
    assert cliente.post("/api/ejercicios/x1-n01-1/intentos", json={"respuesta": "5"}).status_code == 200
    assert cliente.post("/api/ejercicios/x1-n01-1/intentos", json={"respuesta": "6"}).status_code == 200
    m = memoria(cliente)["conteo_hasta_10"]
    assert m["errores"] == 1 and m["con_ayuda"] == 1 and m["sin_ayuda"] == 0


def test_estado_regla():
    f = SimpleNamespace(intentos=0, recientes=[], resueltos_solo=[])
    assert aprendizaje.estado(f) == "nuevo"
    f = SimpleNamespace(intentos=5, recientes=["solo", "error", "error"], resueltos_solo=["a", "b", "c"])
    assert aprendizaje.estado(f) == "necesita_refuerzo"  # dominaba, pero ahora se equivoca seguido


# ---------------- Con el tutor (Claude simulado) ----------------

class ClaudeFalso:
    def __init__(self, texto, dibujo=None):
        self.crudo = json.dumps({"respuesta": texto, "dibujo": dibujo})
        self.llamadas = []
        self.messages = self

    def create(self, **kw):
        self.llamadas.append(kw)
        return SimpleNamespace(stop_reason="end_turn", stop_details=None, usage=None,
                               content=[SimpleNamespace(type="text", text=self.crudo)])


@pytest.fixture()
def claude(monkeypatch):
    estado = {}
    monkeypatch.setattr(config, "TUTOR_ACTIVO", True)
    monkeypatch.setattr(tutor, "_cliente_claude", lambda: estado["f"])
    tutor.limite.reiniciar_todo()

    def poner(texto="¿Cuántas veces se repite el 7?", dibujo=None):
        estado["f"] = ClaudeFalso(texto, dibujo)
        return estado["f"]
    yield poner
    tutor.limite.reiniciar_todo()


def test_kiko_recibe_la_memoria_y_la_actualiza(cliente, claude):
    registrar(cliente)
    escanear(cliente, 6, "×", 4, 10)  # sumó en lugar de multiplicar
    falso = claude(texto="Vamos a verlo.")
    op = {"a": 6, "op": "×", "b": 4, "c": 10}
    assert cliente.post("/api/tutor", json={"operacion": op, "mensaje": "no entiendo"}).json()["origen"] == "claude"
    datos = falso.llamadas[0]["system"][1]["text"]
    assert "Multiplicación: practicando" in datos and "sumó en lugar de multiplicar" in datos
    # La pista del error ya la mostró el escáner: el chat empieza en el primer pasito y, como no entiende,
    # repite ese pasito con grupos (dibujo verificado).
    r = cliente.post("/api/tutor", json={"operacion": op, "mensaje": "no entiendo"}).json()
    assert r["dibujo"]["tipo"] == "grupos"
    # Luego el alumno da el resultado en el chat: la corrige con ayuda y los grupos "ayudaron".
    claude(texto="¡Eso es! ¿Cómo lo pensaste?")
    cliente.post("/api/tutor", json={"operacion": op, "mensaje": "ya se, es 24"})
    m = memoria(cliente)["multiplicacion"]
    assert m["con_ayuda"] == 1 and m["representaciones"]["grupos"] == {"usada": 1, "ayudo": 1}
    assert m["ayudas_tutor"] == 3


def test_sin_memoria_empieza_sencillo(cliente, claude):
    registrar(cliente)
    falso = claude()
    cliente.post("/api/tutor", json={"mensaje": "¿qué es una fracción?"})
    assert "empieza sencillo" in falso.llamadas[0]["system"][1]["text"]


def test_indicaciones_segun_el_estado(cliente, claude):
    """El código (no solo el prompt) le dice a Kiko qué hacer según lo que domina o le cuesta."""
    registrar(cliente)
    for a, b in [(6, 7), (8, 4), (9, 3)]:
        escanear(cliente, a, "×", b, a * b)
    escanear(cliente, "3/4", "+", "1/2", "4/6")
    escanear(cliente, "2/3", "+", "1/6", "3/9")
    falso = claude()
    cliente.post("/api/tutor", json={"mensaje": "¿qué es multiplicar?"})
    datos = falso.llamadas[0]["system"][1]["text"]
    assert "ya domina Multiplicación" in datos and "NO le expliques lo básico" in datos
    assert "le está costando Suma de fracciones" in datos
