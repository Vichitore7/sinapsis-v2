"""Fases 2 y 3: el backend controla la escalera de pistas y arma dibujos verificados. Claude SIMULADO."""
import itertools
import json
from fractions import Fraction
from types import SimpleNamespace

import pytest

from app import config, dibujos, estrategia, operaciones, pasitos, tutor
from tests.conftest import registrar

OP = {"a": 6, "op": "×", "b": 7, "c": 41}  # correcto: 42


class ClaudeFalso:
    def __init__(self, texto="¿Qué hiciste primero?", dibujo=None):
        self.texto, self.dibujo = texto, dibujo
        self.llamadas = []
        self.messages = self

    def create(self, **kw):
        self.llamadas.append(kw)
        return SimpleNamespace(stop_reason="end_turn", stop_details=None, usage=None,
                               content=[SimpleNamespace(type="text", text=json.dumps({"respuesta": self.texto, "dibujo": self.dibujo}))])


@pytest.fixture()
def claude(monkeypatch):
    estado = {"f": ClaudeFalso()}
    monkeypatch.setattr(config, "TUTOR_ACTIVO", True)
    monkeypatch.setattr(tutor, "_cliente_claude", lambda: estado["f"])
    tutor.limite.reiniciar_todo()

    def poner(**kw):
        estado["f"] = ClaudeFalso(**kw)
        return estado["f"]
    yield poner
    tutor.limite.reiniciar_todo()


def instruccion(falso):
    return falso.llamadas[-1]["system"][1]["text"].split("# Qué hacer en este mensaje")[-1]


def hablar(c, mensaje, op=OP):
    return c.post("/api/tutor", json={"operacion": op, "mensaje": mensaje}).json()


# ---------------- Escalera v2: pasitos sobre SU ejercicio ----------------

def test_primero_la_pista_luego_pasitos_que_avanzan_con_aciertos(cliente, claude):
    registrar(cliente)
    falso = claude(texto="¡Eso es!")
    op = {"a": 7, "op": "×", "b": 8, "c": 54}  # correcto: 56
    r1 = hablar(cliente, "no entiendo", op)
    assert "PASO 1" in instruccion(falso)                          # pista del error, la escribe Kiko
    r2 = hablar(cliente, "ok", op)
    assert "5 grupos de 8" in r2["respuesta"]                       # pasito 1 (lo escribe el código)
    r3 = hablar(cliente, "40", op)                                  # contesta bien el pasito
    assert "(acierto)" in instruccion(falso) and "2 grupos de 8" in r3["respuesta"]
    r4 = hablar(cliente, "16", op)
    assert "40 + 16" in r4["respuesta"] and "56" not in r4["respuesta"]  # último pasito: el resultado lo dice él


def test_por_que_explica_el_mismo_pasito_sin_avanzar(cliente, claude):
    registrar(cliente)
    falso = claude(texto="¡Muy buena pregunta!")
    op = {"a": "5/6", "op": "+", "b": "2/3", "c": "7/9"}
    hablar(cliente, "no entiendo", op)
    hablar(cliente, "a ver", op)                                    # pasito 1: ¿2/3 en sextos?
    r = hablar(cliente, "¿porque paso a 4/6?", op)                  # la captura del 24 nov
    assert "(pregunta)" in instruccion(falso)
    assert "misma cantidad de pizza" in r["respuesta"] and r["dibujo"]["tipo"] == "fracciones"
    assert "5/6 + 4/6" not in r["respuesta"]                        # no avanzó al siguiente pasito


def test_atorado_dos_veces_le_dice_el_pasito_y_avanza(cliente, claude):
    registrar(cliente)
    falso = claude(texto="Vamos más despacio.")
    op = {"a": 38, "op": "+", "b": 25, "c": 53}
    hablar(cliente, "no entiendo", op)
    hablar(cliente, "mmm", op)                                      # pasito 1: unidades 8 + 5
    r = hablar(cliente, "es mucho texto y no entiendo", op)
    assert "(reexplicar)" in instruccion(falso) and "flores sueltas" in r["respuesta"]
    r = hablar(cliente, "no se", op)
    assert "8 + 5 = 13" in r["respuesta"] and "30 + 20" in r["respuesta"]  # resolvió ESE pasito y pasó al siguiente


def test_en_el_ultimo_pasito_nunca_da_el_resultado(cliente, claude):
    registrar(cliente)
    claude(texto="Ánimo.")
    op = {"a": 4, "op": "+", "b": 3, "c": 6}  # un solo pasito, y es el final
    respuestas = [hablar(cliente, "no entiendo", op)["respuesta"] for _ in range(6)]
    assert all("7" not in r for r in respuestas)
    assert any("parecido" in r for r in respuestas) and any("descansamos" in r for r in respuestas)


def test_los_mas_pequenos_empiezan_con_algo_concreto(cliente, claude):
    registrar(cliente)
    claude(texto="¡Vamos!")
    r = cliente.post("/api/tutor", json={"operacion": {"a": 4, "op": "+", "b": 3, "c": 6}, "mensaje": "no entiendo",
                                         "grado": "Primaria • 1°"}).json()
    assert "cuenta 3 más" in r["respuesta"] and r["dibujo"] == {"tipo": "objetos", "objeto": "flor", "cantidad": 4}


def test_si_lo_resuelve_ya_no_se_lo_vuelve_a_preguntar(cliente, claude):
    """25 nov: después de contestar bien, Kiko volvía a empezar los pasitos de la operación escaneada."""
    registrar(cliente)
    falso = claude(texto="¡Muy bien!")
    op = {"a": 7, "op": "×", "b": 8, "c": 54}
    for m in ("no entiendo", "ok", "40"):
        hablar(cliente, m, op)
    hablar(cliente, "ya se, es 56", op)
    r = hablar(cliente, "solamente sume lo que me ibas poniendo", op)  # la operación sigue "escaneada" en la pantalla
    datos = falso.llamadas[-1]["system"][1]["text"]
    assert "YA RESOLVIÓ" in datos and "PASITO" not in datos and "PASO 1" not in datos
    assert "5 grupos de 8" not in r["respuesta"]


def test_el_ejercicio_de_practica_de_kiko_se_vuelve_su_ejercicio(cliente, claude):
    registrar(cliente)
    falso = claude(texto="¡Vamos a revisarlo!")
    historial = [{"de": "kiko", "texto": "¡Excelente! Ahora pruébalo tú: ¿cuánto es 245 + 137? Empieza por las unidades."}]
    cliente.post("/api/tutor", json={"mensaje": "7 + 5 son 13 y llevo 1… sería 373", "historial": historial})
    datos = falso.llamadas[-1]["system"][1]["text"]
    assert "245 + 137" in datos and "NO es correcto" in datos  # diagnosticada con el código (correcto: 382)
    # Si contesta bien, se felicita y no se repite.
    cliente.post("/api/tutor", json={"mensaje": "es 382", "historial": historial})
    assert "PASITO" not in falso.llamadas[-1]["system"][1]["text"]


def test_si_le_cuesta_va_directo_a_los_pasitos(cliente, claude):
    registrar(cliente)
    for c in (13, 40):
        cliente.post("/api/escaner/resultado", json={"a": 6, "op": "×", "b": 7, "c": c})
    claude()
    r = hablar(cliente, "ayuda", op={"a": 8, "op": "×", "b": 3, "c": 11})
    assert "grupos de 3" in r["respuesta"]


def test_operacion_correcta_no_usa_escalera(cliente, claude):
    registrar(cliente)
    falso = claude()
    hablar(cliente, "¿está bien?", op={"a": 6, "op": "×", "b": 7, "c": 42})
    assert "PASITO" not in falso.llamadas[-1]["system"][1]["text"] and "PASO 1" not in falso.llamadas[-1]["system"][1]["text"]


def test_una_escalera_vieja_empieza_de_cero(cliente, claude):
    from datetime import timedelta
    from app.db import get_db
    from app.main import app
    registrar(cliente)
    falso = claude()
    for m in ("no entiendo", "ok", "no entiendo"):
        hablar(cliente, m)
    db = next(app.dependency_overrides[get_db]())
    e = db.query(estrategia.Escalera).one()
    e.actualizado = e.actualizado - timedelta(hours=estrategia.VENCE_HORAS + 1)
    db.commit()
    hablar(cliente, "no entiendo")
    assert "PASO 1" in instruccion(falso)


def test_clasificar():
    p = pasitos.pasitos(operaciones.validar({"a": "5/6", "op": "+", "b": "2/3", "c": "7/9"}))[0]
    assert estrategia.clasificar("4/6", p) == "acierto" and estrategia.clasificar("son 4", p) == "acierto"
    assert estrategia.clasificar("¿porque paso a 4/6?", p) == "pregunta"
    assert estrategia.clasificar("2/3", p) == "atorado" and estrategia.clasificar("no entiendo", p) == "atorado"


# ---------------- Contenido verificado: nunca revela el resultado ----------------

def _operaciones_de_prueba():
    for a, b in itertools.product(range(2, 13), range(2, 11)):
        yield {"a": a, "op": "×", "b": b, "c": 0}
        yield {"a": a + b, "op": "+", "b": b, "c": 0}
        yield {"a": a + b, "op": "−", "b": b, "c": 0}
        yield {"a": a * b + 1, "op": "÷", "b": b, "c": 0}
        yield {"a": a * 13, "op": "×", "b": b + 10, "c": 0}
        yield {"a": a * 7 + b, "op": "+", "b": b * 6, "c": 0}
        yield {"a": a * 9 + 20, "op": "−", "b": b * 4, "c": 0}
    for (n1, d1), (n2, d2) in itertools.product([(1, 2), (3, 4), (2, 3), (5, 6), (1, 5), (2, 4)], repeat=2):
        for o in "+−×÷":
            yield {"a": f"{n1}/{d1}", "op": o, "b": f"{n2}/{d2}", "c": "1/99"}


def _revela(texto, op):
    r = operaciones.resultado(op)
    if "cociente" in r:
        return estrategia.menciona(texto, Fraction(r["cociente"])) and r["cociente"] not in (int(op["a"]), int(op["b"]))
    v = r["valor"]
    visibles = {operaciones.numero(op["a"]), operaciones.numero(op["b"])}
    return v not in visibles and estrategia.menciona(texto, v)


def test_ningun_pasito_revela_el_resultado():
    revisadas = 0
    for crudo in _operaciones_de_prueba():
        op = operaciones.validar(crudo)
        if op is None:
            continue
        lista = pasitos.pasitos(op)
        assert lista and lista[-1].final, op
        for p in lista:
            textos = [p.pregunta, p.reexplicar, p.porque] + ([p.resuelto] if not p.final else [])
            for t in textos:
                assert not _revela(t, op), (op, t)
            if p.dibujo:
                d = dibujos.validar(p.dibujo)
                assert d, (op, p.dibujo)
                assert not tutor._dibujo_revela(d, "", [s for s in [tutor._secreto({**op, "c": "1/99" if operaciones.tipo(op) == "fracciones" else "0"})] if s]), (op, d)
        revisadas += 1
    assert revisadas > 400


def test_el_ejemplo_parecido_no_revela_el_resultado():
    for crudo in _operaciones_de_prueba():
        op = operaciones.validar(crudo)
        if op is None:
            continue
        ej = estrategia.ejemplo_parecido(op)
        if ej:
            assert not estrategia.menciona(ej, operaciones.resultado(op)["valor"]), (op, ej)
            assert not estrategia._menciona_cociente(ej, op), (op, ej)


# ---------------- Dibujos nuevos (fase 3) ----------------

@pytest.mark.parametrize("bueno", [
    {"tipo": "fracciones", "forma": "barra", "fracciones": ["3/4", "1/2"]},
    {"tipo": "balanza", "izquierda": "x + 3", "derecha": "7"},
    {"tipo": "porcentaje", "coloreadas": 25},
    {"tipo": "tabla", "columnas": ["x", "y"], "filas": [["1", "3"], ["2", "5"]]},
])
def test_dibujos_nuevos_validos(bueno):
    assert dibujos.validar(bueno)["tipo"] == bueno["tipo"]


@pytest.mark.parametrize("malo", [
    {"tipo": "fracciones", "fracciones": ["13/14"]}, {"tipo": "fracciones", "fracciones": ["9/2"]},
    {"tipo": "fracciones", "fracciones": []}, {"tipo": "balanza", "izquierda": "<script>", "derecha": "1"},
    {"tipo": "porcentaje", "coloreadas": 150}, {"tipo": "tabla", "columnas": ["x"], "filas": [["1"]]},
    {"tipo": "tabla", "columnas": ["x", "y"], "filas": [["1"]]},
])
def test_dibujos_nuevos_invalidos(malo):
    assert dibujos.validar(malo) is None


def test_una_pizza_con_el_resultado_se_bloquea(cliente, claude):
    registrar(cliente)
    claude(texto="Mira esta pizza.", dibujo={"tipo": "fracciones", "fracciones": ["10/8"]})  # 3/4 + 1/2 = 5/4
    # Ejercicio de texto (ahí el modelo sí dibuja): la pizza vale 5/4 (equivalente) y se usan las reglas.
    assert cliente.post("/api/tutor", json={"mensaje": "ayuda", "ejercicio": "3/4 + 1/2"}).json()["origen"] == "reglas"


def test_la_balanza_no_puede_traer_el_resultado(cliente, claude):
    registrar(cliente)
    claude(texto="Mira la balanza.", dibujo={"tipo": "balanza", "izquierda": "6 × 7", "derecha": "42"})
    assert cliente.post("/api/tutor", json={"mensaje": "ayuda", "ejercicio": "6 x 7"}).json()["origen"] == "reglas"


def test_formato_con_datos_en_texto():
    d = dibujos.validar({"tipo": "fracciones", "datos": '{"forma": "barra", "fracciones": ["3/4"]}'})
    assert d == {"tipo": "fracciones", "forma": "barra", "fracciones": ["3/4"]}
    assert dibujos.validar({"tipo": "grupos", "datos": "esto no es json"}) is None
    assert dibujos.validar({"tipo": "grupos", "datos": "[1, 2]"}) is None


def test_el_esquema_sigue_siendo_simple():
    """Con un esquema grande Claude tardaba >20 s o respondía 'Schema is too complex' (24 nov). Que no regrese."""
    dibujo = dibujos.ESQUEMA["properties"]["dibujo"]["anyOf"][1]
    assert set(dibujo["properties"]) == {"tipo", "datos"}
    assert len(json.dumps(dibujos.ESQUEMA)) < 800




def test_frase_de_animo():
    assert estrategia.frase_de_animo("¡Muy bien! ¿Cuánto es 3 + 3?", 0) == "¡Muy bien!"
    assert estrategia.frase_de_animo("Son 12 flores.", 1) in estrategia.ANIMOS
    assert estrategia.frase_de_animo("", 2) in estrategia.ANIMOS


# ---------------- Cuentas escritas en el chat y respuestas verificadas por el código ----------------

def test_una_cuenta_del_chat_usa_los_pasitos_y_no_se_olvida(cliente, claude):
    registrar(cliente)
    falso = claude(texto="¡Vamos!")
    historial = []
    r = cliente.post("/api/tutor", json={"mensaje": "cuánto es 38 + 25", "historial": historial}).json()
    assert "8 + 5" in r["respuesta"] and "63" not in r["respuesta"]
    historial += [{"de": "yo", "texto": "cuánto es 38 + 25"}, {"de": "kiko", "texto": r["respuesta"]}]
    r = cliente.post("/api/tutor", json={"mensaje": "13", "historial": historial}).json()   # contesta bien el pasito
    assert "30 + 20" in r["respuesta"]                                                       # y sigue con SU suma
    assert "la escribió en el chat" in falso.llamadas[-1]["system"][1]["text"]


def test_el_codigo_revisa_las_respuestas_del_alumno(cliente, claude):
    """Haiku le dijo a un alumno que 70 + 7 no era 77 (24 nov). Ahora el código le dice a Kiko si está bien."""
    registrar(cliente)
    falso = claude(texto="¡Eso es!")
    historial = [{"de": "yo", "texto": "¿qué vale el 7 en 877?"}, {"de": "kiko", "texto": "Vale 70. ¿Cuánto suman 70 y 7?"}]
    cliente.post("/api/tutor", json={"mensaje": "77", "historial": historial})
    assert "contestó bien tu pregunta (70 + 7)" in falso.llamadas[-1]["system"][1]["text"]
    cliente.post("/api/tutor", json={"mensaje": "78", "historial": historial})
    linea = next(l for l in falso.llamadas[-1]["system"][1]["text"].splitlines() if l.startswith("VERIFICADO"))
    assert "no es correcto" in linea and "77" not in linea  # no le pasa el número correcto


def test_una_cuenta_del_chat_resuelta_se_cierra_y_reescrita_empieza_de_cero(cliente, claude):
    """24 nov: la escalera de una cuenta ya resuelta seguía abierta y Kiko retomaba el último pasito."""
    registrar(cliente)
    claude(texto="¡Vamos!")
    historial = []
    for m in ("quiero resolver 47 + 36", "13", "70", "83"):
        r = cliente.post("/api/tutor", json={"mensaje": m, "historial": historial}).json()
        historial += [{"de": "yo", "texto": m}, {"de": "kiko", "texto": r["respuesta"]}]
    r = cliente.post("/api/tutor", json={"mensaje": "quiero resolver 47 + 36", "historial": historial}).json()
    assert "7 + 6" in r["respuesta"]  # empieza de cero, con el primer pasito


def test_sin_genero():
    assert tutor._sin_genero("¡Llegaste ahí solito!") == "¡Llegaste ahí por tu cuenta!"
    assert tutor._sin_genero("Lo lograste sola.") == "Lo lograste por tu cuenta."
    assert tutor._sin_genero("Una solución") == "Una solución"


def test_el_ultimo_pasito_nunca_repite_la_misma_ayuda(cliente, claude):
    registrar(cliente)
    claude(texto="Vamos.")
    op = {"a": 4, "op": "+", "b": 3, "c": 6}
    respuestas = [hablar(cliente, m, op)["respuesta"] for m in ("no entiendo", "¿cómo le hago?", "no sé", "no sé", "no sé")]
    for anterior, siguiente in zip(respuestas, respuestas[1:]):
        assert anterior != siguiente
    assert any("Contemos juntos" in r for r in respuestas) and any("parecido" in r for r in respuestas)


def test_una_cuenta_con_su_resultado_es_una_respuesta(cliente, claude):
    registrar(cliente)
    claude(texto="¡Vamos!")
    historial = []
    for m in ("quiero resolver 47 + 36", "13", "70"):
        r = cliente.post("/api/tutor", json={"mensaje": m, "historial": historial}).json()
        historial += [{"de": "yo", "texto": m}, {"de": "kiko", "texto": r["respuesta"]}]
    assert tutor._operacion_del_chat("70 + 13 = 83", historial)[1] == "resuelta"


def test_la_practica_sigue_hasta_resolverla_aunque_haya_subpreguntas(cliente, claude):
    """25 nov: con la práctica 245 + 130, Kiko preguntó "¿40 + 30?" y luego tomó el 375 (correcto) como error."""
    registrar(cliente)
    falso = claude(texto="¡Vamos!")
    historial = [{"de": "kiko", "texto": "¿Cómo le harías si tuvieras 245 + 130?"}]
    r = cliente.post("/api/tutor", json={"mensaje": "me salió 365", "historial": historial}).json()
    historial += [{"de": "yo", "texto": "me salió 365"}, {"de": "kiko", "texto": r["respuesta"]},
                  {"de": "yo", "texto": "ok"}, {"de": "kiko", "texto": "Ahora las decenas: ¿cuánto es 40 + 30?"}]
    cliente.post("/api/tutor", json={"mensaje": "es 375", "historial": historial})
    datos = falso.llamadas[-1]["system"][1]["text"]
    assert "PASITO" not in datos and "no es correcto" not in datos  # 375 resolvió SU práctica (245 + 130)


# ---------------- Revisión de Codex (25 nov): sincronía de la escalera y cierre ----------------

def _db():
    from app.db import get_db
    from app.main import app
    return next(app.dependency_overrides[get_db]())


def _falla(falso):
    import anthropic
    import httpx

    def create(**kw):
        raise anthropic.APIConnectionError(request=httpx.Request("POST", "https://api.anthropic.com"))
    falso.create = create


def test_si_claude_falla_en_la_primera_pista_la_da_reglas_y_no_se_repite(cliente, claude):
    registrar(cliente)
    falso = claude()
    _falla(falso)
    r = hablar(cliente, "no entiendo")
    d = operaciones.diagnosticar(operaciones.validar({"a": "6", "op": "×", "b": "7", "c": "41"}))
    assert r["origen"] == "reglas" and d["pregunta"] in r["respuesta"]  # recibió la pista de su error
    assert _db().query(estrategia.Escalera).one().escalon == 1
    falso = claude()
    hablar(cliente, "ok")
    assert "PASO 1" not in instruccion(falso)  # no se la vuelve a dar: sigue el primer pasito


def test_si_claude_falla_en_un_pasito_llega_el_texto_del_codigo_y_si_avanza(cliente, claude):
    registrar(cliente)
    claude()
    hablar(cliente, "no entiendo")  # paso 1 (pista)
    falso = claude()
    _falla(falso)
    r = hablar(cliente, "ok")  # primer pasito: su texto lo escribe el código, así que llega aunque Claude falle
    paso = pasitos.pasitos(operaciones.validar({**OP, "a": str(OP["a"]), "b": str(OP["b"]), "c": str(OP["c"])}))[0]
    assert paso.pregunta in r["respuesta"] and r["origen"] == "reglas"
    assert _db().query(estrategia.Escalera).one().escalon == 2


def test_decir_el_resultado_con_duda_no_cierra_el_ejercicio(cliente, claude):
    registrar(cliente)
    falso = claude()
    hablar(cliente, "¿será 42? no estoy seguro")
    datos = falso.llamadas[-1]["system"][1]["text"]
    assert "CON DUDA" in datos and "PASITO" not in datos
    assert not estrategia.resuelta(_db(), 1, operaciones.validar({"a": "6", "op": "×", "b": "7", "c": "41"}))
    hablar(cliente, "sí, es 42 porque son 6 grupos de 7")
    assert estrategia.resuelta(_db(), 1, operaciones.validar({"a": "6", "op": "×", "b": "7", "c": "41"}))


def test_sin_ia_despues_de_resolver_no_pide_escanear(cliente, claude, monkeypatch):
    registrar(cliente)
    monkeypatch.setattr(config, "TUTOR_ACTIVO", False)
    hablar(cliente, "es 42")
    r = hablar(cliente, "lo hice sumando grupos")
    assert r["respuesta"] == tutor.YA_RESUELTA


def test_escanear_otra_vez_mal_la_misma_cuenta_es_un_intento_nuevo_sin_repetir_la_pista(cliente, claude):
    registrar(cliente)
    cliente.post("/api/escaner/resultado", json={"a": 6, "op": "×", "b": 7, "c": 42})  # bien: queda resuelta
    cliente.post("/api/escaner/resultado", json={"a": 6, "op": "×", "b": 7, "c": 41})  # después, mal: intento nuevo
    falso = claude()
    hablar(cliente, "Dame otra pista")
    datos = falso.llamadas[-1]["system"][1]["text"]
    assert "YA RESOLVIÓ" not in datos  # no se toma como resuelta
    assert "PASO 1" not in instruccion(falso)  # la pista del error ya la mostró la pantalla: sigue el primer pasito


def test_sin_ia_una_respuesta_con_duda_no_se_confirma(cliente, claude, monkeypatch):
    registrar(cliente)
    monkeypatch.setattr(config, "TUTOR_ACTIVO", False)
    r = hablar(cliente, "¿será 42? no estoy seguro")
    assert r["respuesta"] == tutor.CON_DUDA and "Exacto" not in r["respuesta"]


def test_si_claude_falla_una_respuesta_con_duda_no_se_confirma(cliente, claude):
    registrar(cliente)
    _falla(claude())
    r = hablar(cliente, "¿será 42? no estoy seguro")
    assert r["respuesta"] == tutor.CON_DUDA
    assert not estrategia.resuelta(_db(), 1, operaciones.validar({"a": "6", "op": "×", "b": "7", "c": "41"}))


# ---------------- Revisión final de Codex (25 nov) ----------------

def _escalon():
    e = _db().query(estrategia.Escalera).one()
    return e.escalon


def test_una_pausa_no_es_atasco_ni_avanza(cliente, claude):
    registrar(cliente)
    claude()
    hablar(cliente, "no entiendo")  # pista
    hablar(cliente, "ok")           # primer pasito
    antes = _escalon()
    falso = claude()
    hablar(cliente, "Voy a descansar, seguimos mañana")
    assert "PAUSA" in instruccion(falso) and "PASITO" not in instruccion(falso)
    assert _escalon() == antes
    assert "atasco" not in str(_db().query(estrategia.Escalera).one().representaciones)


def test_un_cambio_de_tema_no_se_toma_como_pregunta_del_pasito(cliente, claude):
    registrar(cliente)
    claude()
    hablar(cliente, "no entiendo")
    hablar(cliente, "ok")
    antes = _escalon()
    falso = claude()
    hablar(cliente, "Quiero entender qué es una fracción")
    assert "CAMBIO DE TEMA" in instruccion(falso)
    assert _escalon() == antes


def test_una_pregunta_sobre_su_ejercicio_sigue_siendo_pregunta_del_pasito():
    assert estrategia.intencion("¿por qué 2/3 son 4/6?") is None
    assert estrategia.intencion("¿por qué?") is None
    assert estrategia.intencion("quiero entender por qué pasó eso") is None
    assert estrategia.intencion("no entiendo") is None
    assert estrategia.intencion("Voy a descansar, seguimos mañana") == "pausa"
    assert estrategia.intencion("Quiero entender qué es una fracción") == "otro_tema"
    p = pasitos.pasitos(operaciones.validar({"a": "5/6", "op": "+", "b": "2/3", "c": "7/9"}))[0]
    assert estrategia.clasificar("¿por qué 2/3 son 4/6?", p) == "pregunta"


def _turno(c, mensaje, turno, recibido=None):
    return c.post("/api/tutor", json={"operacion": OP, "mensaje": mensaje, "turno": turno, "recibido": recibido}).json()


def test_si_el_navegador_descarta_la_respuesta_el_pasito_no_se_pierde(cliente, claude):
    registrar(cliente)
    claude()
    _turno(cliente, "no entiendo", "t1")                   # pista (mostrada)
    r2 = _turno(cliente, "ok", "t2", recibido="t1")        # primer pasito… pero el navegador la descarta
    assert _escalon() == 1                                  # el avance queda pendiente, no confirmado
    r3 = _turno(cliente, "ok", "t3", recibido="t1")        # el siguiente mensaje no confirma t2
    assert r3["respuesta"].split()[-3:] == r2["respuesta"].split()[-3:]  # vuelve a recibir ese mismo pasito
    _turno(cliente, "no entiendo", "t4", recibido="t3")    # ahora sí confirma t3: avanza desde ahí
    assert _escalon() == 2


def test_un_reintento_del_mismo_turno_no_avanza_dos_veces(cliente, claude):
    registrar(cliente)
    claude()
    _turno(cliente, "no entiendo", "t1")
    r = _turno(cliente, "ok", "t2", recibido="t1")
    falso = claude()
    otra = _turno(cliente, "ok", "t2", recibido="t1")      # la red repitió la petición
    assert otra == r and falso.llamadas == []               # misma respuesta, sin volver a llamar a Claude
    _turno(cliente, "no entiendo", "t3", recibido="t2")
    _turno(cliente, "no entiendo", "t3", recibido="t2")    # acuse repetido: no avanza otra vez
    e = _db().query(estrategia.Escalera).one()
    assert e.escalon == 2 and e.pendiente["turno"] == "t3"


# ---------------- Cierre de estabilidad (25 nov): negaciones, turnos viejos y memoria confirmada ----------------

def test_negar_o_dudar_del_resultado_no_lo_cierra(cliente, claude):
    registrar(cliente)
    claude()
    op = operaciones.validar({"a": "6", "op": "×", "b": "7", "c": "41"})
    for mensaje in ("No es 42", "no me da 42", "42 no", "¿42 o 43?", "creo que 42"):
        hablar(cliente, mensaje)
        assert not estrategia.resuelta(_db(), 1, op), mensaje
    hablar(cliente, "no es 41, es 42")  # corrige: niega lo suyo y afirma el resultado
    assert estrategia.resuelta(_db(), 1, op)


def test_negar_o_dudar_un_pasito_no_es_acierto():
    p = pasitos.pasitos(operaciones.validar({"a": "312", "op": "+", "b": "258", "c": "560"}))[0]  # 2 + 8
    assert p.entero == 10
    assert estrategia.clasificar("es 10", p) == "acierto"
    for mensaje in ("no es 10", "10 no", "¿10?", "creo que 10"):
        assert estrategia.clasificar(mensaje, p) != "acierto", mensaje


def test_un_reintento_viejo_no_borra_el_turno_mas_reciente(cliente, claude):
    registrar(cliente)
    claude()
    _turno(cliente, "no entiendo", "v:1")
    _turno(cliente, "ok", "v:2", recibido="v:1")
    _turno(cliente, "no entiendo", "v:3", recibido="v:2")
    antes = _db().query(estrategia.Escalera).one()
    escalon, pendiente = antes.escalon, antes.pendiente
    falso = claude()
    r = _turno(cliente, "ok", "v:2", recibido="v:1")  # la red entrega tarde una copia del turno 2
    assert r == estrategia.TURNO_VIEJO and falso.llamadas == []
    e = _db().query(estrategia.Escalera).one()
    assert (e.escalon, e.pendiente) == (escalon, pendiente)  # el turno 3 sigue pendiente, intacto
    _turno(cliente, "ok", "v:4", recibido="v:3")  # y se confirma normal después
    e = _db().query(estrategia.Escalera).one()
    confirmado = {"escalon": e.escalon, "turnos": e.turnos, "representaciones": e.representaciones}
    assert confirmado == pendiente["estado"] and e.pendiente["turno"] == "v:4"


def test_la_memoria_anota_la_ayuda_solo_cuando_el_navegador_la_mostro(cliente, claude):
    registrar(cliente)
    claude()
    def ayudas():
        filas = {m["concepto"]: m for m in cliente.get("/api/aprendizaje").json()["conceptos"]}
        return filas.get("multiplicacion", {}).get("ayudas_tutor", 0)
    _turno(cliente, "no entiendo", "m:1")
    assert ayudas() == 0                                   # todavía no se sabe si la vio
    _turno(cliente, "ok", "m:2", recibido="m:1")
    assert ayudas() == 1                                   # m:1 confirmada
    _turno(cliente, "ok", "m:3", recibido="m:1")           # la respuesta de m:2 se descartó
    assert ayudas() == 1                                   # m:2 no se anota
    cliente.post("/api/tutor", json={"operacion": OP, "mensaje": "no entiendo"})  # cliente sin turnos: como antes
    assert ayudas() == 2
