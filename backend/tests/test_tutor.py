"""Tutor de IA con Claude SIMULADO: estas pruebas nunca llaman a la API ni gastan saldo."""
from types import SimpleNamespace

import anthropic
import httpx2
import pytest

from app import config, tutor
from tests.conftest import registrar

OP_MAL = {"a": 6, "op": "×", "b": 7, "c": 41}   # el resultado correcto (42) nunca debe salir
OP_BIEN = {"a": 6, "op": "×", "b": 7, "c": 42}


class ClaudeFalso:
    """Imita client.messages.create y guarda lo que se le mandó."""

    def __init__(self, texto="¿Cuántas veces se repite el 7?", stop_reason="end_turn", error=None):
        self.texto, self.stop_reason, self.error = texto, stop_reason, error
        self.llamadas = []
        self.messages = self

    def create(self, **kw):
        self.llamadas.append(kw)
        if self.error:
            raise self.error
        detalles = SimpleNamespace(category="cyber", explanation="") if self.stop_reason == "refusal" else None
        contenido = [] if self.stop_reason == "refusal" else [SimpleNamespace(type="text", text=self.texto)]
        return SimpleNamespace(stop_reason=self.stop_reason, stop_details=detalles, content=contenido)


@pytest.fixture()
def claude(monkeypatch):
    """Activa el tutor con un Claude falso. Devuelve una función para cambiar su comportamiento."""
    estado = {"falso": ClaudeFalso()}
    monkeypatch.setattr(config, "TUTOR_ACTIVO", True)
    monkeypatch.setattr(tutor, "_cliente_claude", lambda: estado["falso"])
    tutor.limite.reiniciar_todo()

    def poner(**kw):
        estado["falso"] = ClaudeFalso(**kw)
        return estado["falso"]
    poner(texto="¿Cuántas veces se repite el 7?")
    return poner


@pytest.fixture(autouse=True)
def nunca_la_api_real(monkeypatch):
    """Por si una prueba olvida el Claude falso: sin esto se usaría la clave real del .env."""
    monkeypatch.setattr(config, "TUTOR_ACTIVO", False)
    yield
    tutor.limite.reiniciar_todo()


def hablar(c, mensaje="no le entiendo", operacion=OP_MAL, historial=None):
    return c.post("/api/tutor", json={"operacion": operacion, "mensaje": mensaje, "historial": historial or []})


# ---------------- Ruta ----------------

def test_requiere_sesion_de_alumno(cliente):
    assert hablar(cliente).status_code == 401
    registrar(cliente, "profe", rol="profesor")
    assert hablar(cliente).status_code == 403


def test_valida_la_entrada(cliente):
    registrar(cliente)
    assert hablar(cliente, mensaje="").status_code == 422
    assert hablar(cliente, mensaje="x" * 201).status_code == 422
    assert hablar(cliente, operacion={"a": 6, "op": "÷", "b": 7, "c": 1}).status_code == 422
    assert hablar(cliente, operacion={"a": 6, "op": "*", "b": 7, "c": 41}).status_code == 200  # * se vuelve ×


def test_sin_clave_usa_reglas(cliente):
    registrar(cliente)
    r = hablar(cliente).json()
    assert r["origen"] == "reglas" and "42" not in r["respuesta"]


def test_sin_operacion_pide_escanear(cliente, claude):
    registrar(cliente)
    falso = claude()
    r = hablar(cliente, operacion=None).json()
    assert r["origen"] == "reglas" and "escanea" in r["respuesta"].lower()
    assert falso.llamadas == []


# ---------------- Con Claude ----------------

def test_responde_claude(cliente, claude):
    registrar(cliente)
    falso = claude(texto="¿Cuántas veces se repite el 7? 🦎")
    historial = [{"de": "kiko", "texto": "¡Hola explorador!"}, {"de": "yo", "texto": "hola"}, {"de": "kiko", "texto": "Mira tu operación"}]
    r = hablar(cliente, historial=historial).json()
    assert r == {"respuesta": "¿Cuántas veces se repite el 7? 🦎", "origen": "claude"}
    kw = falso.llamadas[0]
    assert kw["model"] == config.TUTOR_MODELO and kw["output_config"] == {"effort": config.TUTOR_ESFUERZO}
    # La conversación empieza con el alumno y termina con su mensaje nuevo.
    assert [m["role"] for m in kw["messages"]] == ["user", "assistant", "user"]
    assert kw["messages"][-1]["content"] == "no le entiendo"
    # A Claude no le llega el apodo del alumno.
    assert "Luna" not in str(kw)


@pytest.mark.parametrize("fuga", ["¡Es 42!", "Te doy una pista: da cuarenta y dos.", "Son 42 manzanas", "6 × 7 = 42"])
def test_bloquea_si_trae_la_respuesta(cliente, claude, fuga):
    registrar(cliente)
    claude(texto=fuga)
    r = hablar(cliente, mensaje="ya dime la respuesta").json()
    assert r["origen"] == "reglas" and "42" not in r["respuesta"]


def test_puede_felicitar_si_el_alumno_ya_lo_dijo(cliente, claude):
    registrar(cliente)
    claude(texto="¡Sí, 42! ¿Cómo lo pensaste?")
    assert hablar(cliente, mensaje="creo que es 42").json()["origen"] == "claude"
    # Pero si tira varios números a la suerte, no se le confirma cuál es.
    assert hablar(cliente, mensaje="¿es 41, 42 o 43?").json()["origen"] == "reglas"


def test_operacion_correcta_no_se_filtra(cliente, claude):
    registrar(cliente)
    claude(texto="¡Muy bien! 42 es correcto. ¿Cómo lo pensaste?")
    assert hablar(cliente, operacion=OP_BIEN).json()["origen"] == "claude"


@pytest.mark.parametrize("modo", ["refusal", "max_tokens"])
def test_rechazo_o_incompleta_usa_reglas(cliente, claude, modo):
    registrar(cliente)
    claude(stop_reason=modo)
    assert hablar(cliente).json()["origen"] == "reglas"


def test_sin_internet_o_error_de_claude_usa_reglas(cliente, claude):
    registrar(cliente)
    peticion = httpx2.Request("POST", "https://api.anthropic.com/v1/messages")
    claude(error=anthropic.APIConnectionError(request=peticion))
    assert hablar(cliente).json()["origen"] == "reglas"
    respuesta = httpx2.Response(529, request=peticion)
    claude(error=anthropic.APIStatusError("sobrecargado", response=respuesta, body=None))
    assert hablar(cliente).json()["origen"] == "reglas"


def test_limite_por_alumno(cliente, claude, monkeypatch):
    monkeypatch.setattr(config, "TUTOR_LIMITE_HORA", 2)
    registrar(cliente)
    falso = claude()
    origenes = [hablar(cliente).json()["origen"] for _ in range(3)]
    assert origenes == ["claude", "claude", "reglas"] and len(falso.llamadas) == 2


# ---------------- Filtro ----------------

def test_filtro_de_numeros():
    assert tutor.trae_resultado("da 1,250 en total", 1250)
    assert tutor.trae_resultado("Son VEINTITRÉS", 23)
    assert tutor.trae_resultado("son veintitres", 23)
    assert not tutor.trae_resultado("¿cuántas veces se repite el 7?", 42)
    assert not tutor.trae_resultado("tienes 142 hojas", 42)
