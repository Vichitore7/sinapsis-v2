"""Tutor de IA con Claude SIMULADO: estas pruebas nunca llaman a la API ni gastan saldo."""
import json
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

    def __init__(self, texto="¿Cuántas veces se repite el 7?", stop_reason="end_turn", error=None, dibujo=None, crudo=None):
        self.texto, self.stop_reason, self.error = texto, stop_reason, error
        # Con output_config.format, Claude contesta un JSON {respuesta, dibujo}.
        self.crudo = crudo if crudo is not None else json.dumps({"respuesta": texto, "dibujo": dibujo})
        self.llamadas = []
        self.messages = self

    def create(self, **kw):
        self.llamadas.append(kw)
        if self.error:
            raise self.error
        detalles = SimpleNamespace(category="cyber", explanation="") if self.stop_reason == "refusal" else None
        contenido = [] if self.stop_reason == "refusal" else [SimpleNamespace(type="text", text=self.crudo)]
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
    assert hablar(cliente, operacion={"a": 6, "op": "^", "b": 7, "c": 1}).status_code == 422
    assert hablar(cliente, operacion={"a": "3/0", "op": "+", "b": "1/2", "c": "1"}).status_code == 422
    assert hablar(cliente, operacion={"a": 3, "op": "−", "b": 7, "c": 4}).status_code == 422  # negativos: secundaria
    assert hablar(cliente, operacion={"a": 17, "op": "÷", "b": 5, "c": 3, "residuo": 2}).status_code == 200
    assert hablar(cliente, operacion={"a": "3/4", "op": "+", "b": "1/2", "c": "4/6"}).status_code == 200
    assert hablar(cliente, operacion={"a": 6, "op": "*", "b": 7, "c": 41}).status_code == 200  # * se vuelve ×


def test_sin_clave_usa_reglas(cliente):
    registrar(cliente)
    r = hablar(cliente).json()
    assert r["origen"] == "reglas" and "42" not in r["respuesta"]


def test_sin_operacion_y_sin_clave_pide_escanear(cliente):
    registrar(cliente)
    r = hablar(cliente, operacion=None).json()
    assert r["origen"] == "reglas" and "escanea" in r["respuesta"].lower()


def test_dudas_de_un_tema_sin_operacion(cliente, claude):
    registrar(cliente)
    falso = claude(texto="Una fracción es una parte de un entero. ¿En cuántas partes iguales partirías una pizza?")
    r = hablar(cliente, mensaje="¿qué es una fracción?", operacion=None).json()
    assert r["origen"] == "claude"
    assert "No hay operación escaneada" in falso.llamadas[0]["system"][1]["text"]


def test_cuenta_escrita_en_el_chat_tampoco_se_resuelve(cliente, claude):
    registrar(cliente)
    claude(texto="¡Fácil! 345 × 12 = 4,140")
    r = hablar(cliente, mensaje="cuanto es 345 x 12", operacion=None).json()
    # Se toma como su ejercicio: pasitos verificados; del modelo solo una frase sin números.
    assert "345 × 10" in r["respuesta"] and "4,140" not in r["respuesta"] and "4140" not in r["respuesta"]
    claude(texto="Da 12 😉")
    historial = [{"de": "yo", "texto": "ayudame con 84 ÷ 7"}, {"de": "kiko", "texto": "¿Cuántas veces cabe el 7 en 84?"}]
    r = hablar(cliente, mensaje="ya dime", operacion=None, historial=historial).json()
    assert "12" not in r["respuesta"]


# ---------------- Manual (agente.md) y material de estudio ----------------

def test_manda_el_manual_y_el_material_del_grado(cliente, claude):
    registrar(cliente)
    falso = claude()
    cliente.post("/api/tutor", json={"operacion": OP_MAL, "mensaje": "ayuda", "grado": "Primaria • 2°"})
    estable, datos = falso.llamadas[0]["system"]
    assert "Manual de Mix" in estable["text"] and estable["cache_control"] == {"type": "ephemeral"}
    assert "primaria-1-2.md" in estable["text"] and "progresion-por-tema.md" in estable["text"]
    assert "Ideas de mundo" not in estable["text"]  # notas del equipo, no para el alumno
    assert "2.º de primaria" in datos["text"] and "SECRETO" in datos["text"]


def test_grados():
    assert tutor.grado_corto("Primaria • 1°") == "P1"
    assert tutor.grado_corto("Secundaria • 3° Año") == "S3"
    assert tutor.grado_corto("Primaria • 9°") is None
    assert tutor.grado_corto(None) is None
    # Sin grado va solo la progresión de todos los grados.
    assert "progresion-por-tema.md" in tutor.sistema(None) and "primaria-1-2.md" not in tutor.sistema(None)


# ---------------- Con Claude ----------------

def test_responde_claude(cliente, claude):
    registrar(cliente)
    falso = claude(texto="¿Cuántas veces se repite el 7? 🦎")
    historial = [{"de": "kiko", "texto": "¡Hola explorador!"}, {"de": "yo", "texto": "hola"}, {"de": "kiko", "texto": "Mira tu operación"}]
    r = hablar(cliente, historial=historial).json()
    assert r == {"respuesta": "¿Cuántas veces se repite el 7?", "origen": "claude", "dibujo": None, "resuelta": False, "cierre": False}  # sin 🦎
    kw = falso.llamadas[0]
    assert kw["model"] == config.TUTOR_MODELO and kw["output_config"]["effort"] == config.TUTOR_ESFUERZO
    assert kw["output_config"]["format"]["type"] == "json_schema"
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
    # Sin operación no le pide una foto: le dice que ya platicaron mucho.
    r = hablar(cliente, operacion=None, mensaje="¿qué es sumar?").json()
    assert r["origen"] == "reglas" and r["respuesta"] == tutor.LIMITE_ALCANZADO


# ---------------- Filtro ----------------

def test_filtro_de_numeros():
    assert tutor.trae_resultado("da 1,250 en total", 1250)
    assert tutor.trae_resultado("Son VEINTITRÉS", 23)
    assert tutor.trae_resultado("son veintitres", 23)
    assert not tutor.trae_resultado("¿cuántas veces se repite el 7?", 42)
    assert not tutor.trae_resultado("tienes 142 hojas", 42)


# ---------------- Dibujos ----------------

def test_dibujo_valido_llega_al_alumno(cliente, claude):
    registrar(cliente)
    claude(texto="Mira estas 2 bolsitas de 7: ¿cuántos dulces hay?", dibujo={"tipo": "grupos", "objeto": "flor", "grupos": [7, 7]})
    r = hablar(cliente, operacion=None, mensaje="¿qué es multiplicar?").json()  # sin operación, Mix dibuja libre
    assert r["origen"] == "claude" and r["dibujo"] == {"tipo": "grupos", "objeto": "flor", "grupos": [7, 7]}
    # Con una operación escaneada, los dibujos los pone solo la app (el del modelo se ignora).
    r = hablar(cliente).json()
    assert r["origen"] == "claude" and r["dibujo"] is None


def test_dibujo_que_revela_el_resultado_se_quita(cliente, claude):
    registrar(cliente)
    claude(texto="Cuenta todas las flores", dibujo={"tipo": "grupos", "objeto": "flor", "grupos": [7] * 6})  # 6 × 7 = 42
    r = cliente.post("/api/tutor", json={"mensaje": "ayuda", "ejercicio": "6 x 7"}).json()
    assert r["origen"] == "reglas" and r["dibujo"] is None  # sin el dibujo el texto quedaría incoherente


@pytest.mark.parametrize("malo", [
    {"tipo": "objetos", "objeto": "flor", "cantidad": 500},
    {"tipo": "grupos", "grupos": [3] * 9},
    {"tipo": "quitar", "total": 5, "quitar": 8},
    {"tipo": "recta", "hasta": 10, "inicio": 15},
    {"tipo": "monedas", "monedas": [3, 7]},
    {"tipo": "grafica", "barras": [{"etiqueta": "A", "color": "rojo", "valor": 99}, {"etiqueta": "B", "color": "azul", "valor": 1}]},
    {"tipo": "figura", "figura": "estrella"},
    {"tipo": "otro"},
])
def test_dibujo_fuera_de_limites_se_descarta(cliente, claude, malo):
    registrar(cliente)
    claude(texto="Mira", dibujo=malo)
    r = hablar(cliente, operacion=None, mensaje="¿qué es sumar?").json()
    assert r["origen"] == "claude" and r["dibujo"] is None


def test_json_invalido_usa_reglas(cliente, claude):
    registrar(cliente)
    claude(crudo="esto no es json")
    assert hablar(cliente).json() == {"respuesta": tutor.por_reglas(OP_MAL, "no le entiendo"), "origen": "reglas", "dibujo": None, "resuelta": False, "cierre": False}


def test_conversacion_larga_no_se_rechaza(cliente, claude):
    """El chat puede mandar una plática larga: se acepta y a Claude solo le llegan los últimos mensajes."""
    registrar(cliente)
    falso = claude()
    historial = [{"de": "yo" if i % 2 else "kiko", "texto": f"mensaje {i}"} for i in range(60)]
    r = hablar(cliente, operacion=None, mensaje="¿y ahora?", historial=historial)
    assert r.status_code == 200 and r.json()["origen"] == "claude"
    assert len(falso.llamadas[0]["messages"]) <= tutor.MAX_HISTORIAL + 1


# ---------------- Fracciones, divisiones y ejercicios confirmados en el chat ----------------

FRAC_MAL = {"a": "3/4", "op": "+", "b": "1/2", "c": "4/6"}  # correcto: 5/4


@pytest.mark.parametrize("fuga", ["Da 5/4", "Te queda 10/8", "es 5 / 4 😉"])
def test_fraccion_no_se_revela_ni_equivalente(cliente, claude, fuga):
    registrar(cliente)
    claude(texto=fuga)
    assert hablar(cliente, operacion=FRAC_MAL).json()["origen"] == "reglas"


def test_fraccion_guia_sin_revelar(cliente, claude):
    registrar(cliente)
    falso = claude(texto="¿Un pedazo de 1/4 y uno de 1/2 son del mismo tamaño?")
    r = hablar(cliente, operacion=FRAC_MAL).json()
    assert r["origen"] == "claude"
    datos = falso.llamadas[0]["system"][1]["text"]
    assert "5/4" in datos and "SECRETO" in datos and "numeradores y denominadores" in datos


def test_division_con_residuo(cliente, claude):
    registrar(cliente)
    claude(texto="Te salió 4 grupos, ¿seguro?")  # el cociente correcto es 3: no se bloquea un 4
    assert hablar(cliente, operacion={"a": 17, "op": "÷", "b": 5, "c": 4, "residuo": 0}).json()["origen"] == "claude"
    claude(texto="¡Es 3 y sobran 2!")
    r = hablar(cliente, operacion={"a": 17, "op": "÷", "b": 5, "c": 4, "residuo": 0}).json()
    # Desde el segundo mensaje, del modelo solo se usa una frase de ánimo sin números: el 3 no aparece.
    assert "3" not in r["respuesta"]


def test_reglas_con_fracciones():
    op = tutor.operaciones.validar(FRAC_MAL)
    assert "mismo tamaño" in tutor.por_reglas(op, "no entiendo")
    assert tutor.por_reglas(op, "me dio 10/8").startswith("¡Exacto")  # equivalente a 5/4, afirmado
    assert tutor.por_reglas(op, "¿es 10/8?") == tutor.CON_DUDA  # preguntado: ni se confirma ni se niega
    sin_resultado = tutor.operaciones.validar({**FRAC_MAL, "c": ""})
    assert "resultado" in tutor.por_reglas(sin_resultado, "ayuda")


def test_ejercicio_confirmado_en_el_chat(cliente, claude):
    registrar(cliente)
    falso = claude(texto="¿Qué te pregunta el problema?")
    r = cliente.post("/api/tutor", json={"mensaje": "ayúdame", "ejercicio": "Ana tiene 3/4 de pizza y come 1/2. ¿Cuánto le queda?"}).json()
    assert r["origen"] == "claude"
    assert "Ana tiene 3/4" in falso.llamadas[0]["system"][1]["text"]
    claude(texto="Le queda 1/4")  # 3/4 − 1/2 escrito en el ejercicio: no se puede revelar
    r = cliente.post("/api/tutor", json={"mensaje": "ya dime", "ejercicio": "3/4 - 1/2"}).json()
    assert r["origen"] == "reglas"


def test_texto_con_cero_no_truena(cliente, claude):
    registrar(cliente)
    claude(texto="Piensa en monedas.")
    r = cliente.post("/api/tutor", json={"mensaje": "no entiendo", "ejercicio": "0.5 + 0.25 ="})
    assert r.status_code == 200


def test_valor_posicional_verificado(cliente, claude):
    """Haiku dijo que el 7 de 877 valía 77 (24 nov): ahora recibe los valores calculados por el código."""
    registrar(cliente)
    falso = claude(texto="¿Qué lugar ocupa?")
    cliente.post("/api/tutor", json={"mensaje": "¿qué vale el 7 en 877?"})
    datos = falso.llamadas[-1]["system"][1]["text"]
    assert "el 8 vale 800 (centenas), el 7 vale 70 (decenas), el 7 vale 7 (unidades)" in datos


def test_el_manual_pide_no_suponer_genero():
    assert "No supongas si es niño o niña" in tutor.sistema(None)
