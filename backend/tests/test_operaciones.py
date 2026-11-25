"""Diagnóstico de fracciones y divisiones del escáner (sin IA)."""
from fractions import Fraction

import pytest

from app import operaciones as ops


def diag(a, op, b, c, residuo=""):
    o = ops.validar({"a": a, "op": op, "b": b, "c": c, "residuo": residuo})
    assert o is not None
    return ops.diagnosticar(o)


def test_numeros():
    assert ops.numero("3/4") == Fraction(3, 4) and ops.numero(" 17 ") == 17
    assert ops.numero("3/0") is None and ops.numero("-2") is None and ops.numero("x") is None


def test_validar():
    assert ops.validar({"a": 6, "op": "x", "b": 7, "c": 42})["op"] == "×"
    assert ops.validar({"a": "17", "op": ":", "b": "5", "c": "3", "residuo": 2})["residuo"] == "2"
    assert ops.validar({"a": 5, "op": "÷", "b": 0, "c": 1}) is None
    assert ops.validar({"a": "1/4", "op": "−", "b": "1/2", "c": "1/4"}) is None  # daría negativo


def test_enteros_igual_que_antes():
    assert diag(6, "×", 7, 42)["correcto"] is True
    assert diag(3, "×", 12, 15)["tipo_error"] == "sumo"


def test_division():
    assert diag(17, "÷", 5, 3, 2)["correcto"] is True
    assert diag(15, "÷", 5, 3)["correcto"] is True  # sin residuo escrito = 0
    assert diag(17, "÷", 5, 2, 7)["tipo_error"] == "residuo_grande"
    assert diag(17, "÷", 5, 3, 1)["tipo_error"] == "residuo"
    d = diag(17, "÷", 5, 4, 0)
    assert d["tipo_error"] == "cociente" and "3" not in d["pregunta"].replace("4", "")  # no revela el 3


def test_fracciones():
    assert diag("3/4", "+", "1/2", "5/4")["correcto"] is True
    equivalente = diag("3/4", "+", "1/2", "10/8")
    assert equivalente["correcto"] is True and "más pequeños" in equivalente["pregunta"]
    assert diag("3/4", "+", "1/2", "4/6")["tipo_error"] == "sumo_denominadores"
    assert diag("3/4", "+", "1/2", "4/4")["tipo_error"] == "denominador"
    assert diag("1/2", "÷", "1/4", "1/8")["tipo_error"] == "multiplico"
    assert diag("2/3", "×", "3/5", "6/15")["correcto"] is True
    assert diag("2/3", "×", "3/5", "5/8")["tipo_error"] == "calculo"
    assert diag("1/2", "+", "1/2", "1")["correcto"] is True  # una fracción y un entero


def test_sin_resultado():
    assert diag("3/4", "+", "1/2", "")["correcto"] is None


def test_ninguna_pregunta_revela_el_resultado():
    casos = [("3/4", "+", "1/2", "4/6"), ("3/4", "+", "1/2", "4/4"), ("1/2", "÷", "1/4", "1/8"),
             ("2/3", "×", "3/5", "5/8"), ("5/6", "−", "1/3", "4/3")]
    for a, o, b, c in casos:
        op = ops.validar({"a": a, "op": o, "b": b, "c": c})
        d = ops.diagnosticar(op)
        assert not ops.trae_fraccion(d["pregunta"], ops.resultado(op)["valor"]), (a, o, b, d["pregunta"])


def test_operaciones_con_cero():
    """La evaluación encontró que "5 + 0" tronaba (se calculaba también la división entre 0)."""
    assert ops.resultado(ops.validar({"a": 5, "op": "+", "b": 0, "c": ""}))["valor"] == 5
    assert ops.resultado(ops.validar({"a": 5, "op": "×", "b": 0, "c": ""}))["valor"] == 0
    assert ops.validar({"a": 5, "op": "÷", "b": 0, "c": ""}) is None


def test_errores_tipicos_de_enteros():
    """Los encontró la evaluación pedagógica: no llevar, no pedir prestado, un grupo de más o de menos."""
    assert diag(38, "+", 25, 53)["tipo_error"] == "no_llevo"
    assert diag(52, "−", 27, 35)["tipo_error"] == "no_pidio"
    d = diag(9, "×", 6, 45)
    assert d["tipo_error"] == "un_grupo" and "54" not in d["pregunta"]
    assert diag(3, "×", 12, 15)["tipo_error"] == "sumo"  # el de siempre se respeta
