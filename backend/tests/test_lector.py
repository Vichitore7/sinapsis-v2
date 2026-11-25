"""Lectura de la foto del cuaderno con Claude SIMULADO: estas pruebas nunca llaman a la API ni gastan saldo."""
import base64
import json
from types import SimpleNamespace

import anthropic
import httpx2
import pytest

from app import config, lector, tutor
from tests.conftest import registrar

FOTO = "data:image/jpeg;base64," + base64.b64encode(b"\xff\xd8\xff\xe0 foto de prueba \xff\xd9").decode()


class LectorFalso:
    def __init__(self, leido=None, stop_reason="end_turn", error=None, crudo=None):
        self.crudo = crudo if crudo is not None else json.dumps(leido or {})
        self.stop_reason, self.error = stop_reason, error
        self.llamadas = []
        self.messages = self

    def create(self, **kw):
        self.llamadas.append(kw)
        if self.error:
            raise self.error
        contenido = [] if self.stop_reason == "refusal" else [SimpleNamespace(type="text", text=self.crudo)]
        return SimpleNamespace(stop_reason=self.stop_reason, stop_details=None, content=contenido)


def leido(a="6", op="×", b="7", c="41", tipo="operacion", dudoso=False, residuo=None, texto=None):
    return {"tipo": tipo, "a": a, "op": op, "b": b, "c": c, "residuo": residuo, "texto": texto, "dudoso": dudoso}


@pytest.fixture(autouse=True)
def sin_api_real(monkeypatch):
    monkeypatch.setattr(config, "TUTOR_ACTIVO", False)
    tutor.limite.reiniciar_todo()
    yield
    tutor.limite.reiniciar_todo()


@pytest.fixture()
def claude(monkeypatch):
    estado = {}
    monkeypatch.setattr(config, "TUTOR_ACTIVO", True)
    monkeypatch.setattr(lector, "_cliente_claude", lambda: estado["falso"])

    def poner(**kw):
        estado["falso"] = LectorFalso(**kw)
        return estado["falso"]
    return poner


def leer(c, foto=FOTO):
    return c.post("/api/escaner/leer", json={"foto": foto})


def test_requiere_sesion_de_alumno(cliente):
    assert leer(cliente).status_code == 401
    registrar(cliente, "profe", rol="profesor")
    assert leer(cliente).status_code == 403


@pytest.mark.parametrize("mala", ["hola", "data:text/plain;base64,aG9sYQ==" + "A" * 30,
                                  "data:image/jpeg;base64,***no-es-base64***" + "A" * 30,
                                  "data:image/jpeg;base64," + base64.b64encode(b"x" * (700 * 1024)).decode()])
def test_foto_invalida(cliente, mala):
    registrar(cliente)
    r = leer(cliente, mala)
    assert r.status_code == 422


def test_sin_clave_se_escribe_a_mano(cliente):
    registrar(cliente)
    assert leer(cliente).json() == {"lectura": None, "otro": None, "origen": "sin_ia"}


def test_lee_la_operacion_sin_corregirla(cliente, claude):
    registrar(cliente)
    falso = claude(leido=leido())
    r = leer(cliente).json()
    assert r == {"lectura": {"a": "6", "op": "×", "b": "7", "c": "41", "residuo": "", "dudoso": False},
                 "otro": None, "origen": "claude"}
    kw = falso.llamadas[0]
    assert kw["model"] == config.LECTOR_MODELO
    assert kw["output_config"]["format"]["type"] == "json_schema"
    imagen = kw["messages"][0]["content"][0]
    assert imagen["type"] == "image" and imagen["source"]["media_type"] == "image/jpeg"
    assert "AUNQUE ESTÉ MAL" in kw["system"]


def test_sin_resultado_y_dudoso(cliente, claude):
    registrar(cliente)
    claude(leido=leido(c=None, dudoso=True))
    assert leer(cliente).json()["lectura"] == {"a": "6", "op": "×", "b": "7", "c": "", "residuo": "", "dudoso": True}


def test_fracciones_y_division(cliente, claude):
    registrar(cliente)
    claude(leido=leido(a="3/4", op="+", b="1/2", c="4/6"))
    assert leer(cliente).json()["lectura"]["a"] == "3/4"
    claude(leido=leido(a="17", op="÷", b="5", c="3", residuo="2"))
    assert leer(cliente).json()["lectura"]["residuo"] == "2"


def test_otro_ejercicio_va_al_chat(cliente, claude):
    registrar(cliente)
    claude(leido=leido(tipo="otro", a=None, op=None, b=None, c=None, texto="Ana compró 3 kg de manzanas a $25 el kilo. ¿Cuánto pagó?"))
    r = leer(cliente).json()
    assert r["lectura"] is None and r["otro"].startswith("Ana compró")
    # Una operación que el escáner no revisa (da negativo) también va al chat.
    claude(leido=leido(a="3", op="−", b="7", c="4"))
    assert leer(cliente).json()["otro"] == "3 − 7 = 4"


@pytest.mark.parametrize("malo", [leido(tipo="nada"), leido(a=None, b=None, op=None), leido(tipo="otro", texto="")])
def test_no_encontrada(cliente, claude, malo):
    registrar(cliente)
    claude(leido=malo)
    assert leer(cliente).json() == {"lectura": None, "otro": None, "origen": "claude"}


def test_fallas_de_claude(cliente, claude):
    registrar(cliente)
    for kw in [{"stop_reason": "refusal"}, {"stop_reason": "max_tokens"}, {"crudo": "no es json"},
               {"error": anthropic.APIConnectionError(request=httpx2.Request("POST", "https://api.anthropic.com"))}]:
        claude(leido=leido(), **kw)
        assert leer(cliente).json()["lectura"] is None


def test_respeta_el_limite(cliente, claude, monkeypatch):
    monkeypatch.setattr(config, "TUTOR_LIMITE_HORA", 1)
    registrar(cliente)
    falso = claude(leido=leido())
    assert leer(cliente).json()["lectura"] is not None
    assert leer(cliente).json() == {"lectura": None, "otro": None, "origen": "sin_ia"}
    assert len(falso.llamadas) == 1
