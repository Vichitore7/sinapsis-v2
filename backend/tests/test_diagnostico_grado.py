"""Diagnóstico de entrada según el grado que elige el alumno al crear su cuenta."""
import pytest

from app import diagnostico


def _registrar(c, usuario, grado=None, rol="alumno"):
    datos = {"usuario": usuario, "apodo": usuario.capitalize(), "password": "selva123", "rol": rol}
    if grado:
        datos["grado"] = grado
    r = c.post("/api/auth/registro", json=datos)
    assert r.status_code == 201, r.text
    return r.json()


# ---------------- El banco de preguntas ----------------

def test_hay_un_examen_por_cada_grado():
    assert set(diagnostico.POR_GRADO) == set(diagnostico.GRADOS)
    ids = [p["id"] for ps in [diagnostico.PREGUNTAS, *diagnostico.POR_GRADO.values()] for p in ps]
    assert len(ids) == len(set(ids))  # ids únicos en todo el banco
    for grado, preguntas in diagnostico.POR_GRADO.items():
        assert len(preguntas) == 8, grado
        habilidades = [p["habilidad"] for p in preguntas]
        assert len(habilidades) == len(set(habilidades)), grado  # una pregunta por habilidad
        assert all(h in diagnostico.HABILIDADES for h in habilidades)
        assert all(len(p["id"]) <= 10 for p in preguntas)  # el esquema recorta las llaves a 10


@pytest.mark.parametrize("grado", list(diagnostico.GRADOS))
def test_cada_examen_se_califica_con_sus_respuestas(grado):
    preguntas = diagnostico.POR_GRADO[grado]
    bien = diagnostico.calificar({p["id"]: p["respuestas"][0] for p in preguntas}, grado)
    assert all(bien.values()) and len(bien) == 8
    nada = diagnostico.calificar({}, grado)
    assert not any(nada.values())


def test_examenes_distintos_por_grado():
    p1 = {p["enunciado"] for p in diagnostico.publicas("P1")}
    s3 = {p["enunciado"] for p in diagnostico.publicas("S3")}
    assert p1.isdisjoint(s3)
    assert diagnostico.publicas(None) == diagnostico.publicas("X9")  # sin grado: el general
    assert all("respuestas" not in p for p in diagnostico.publicas("P5"))


@pytest.mark.parametrize(("dada", "aceptadas", "esperado"), [
    ("0,75", ["0.75"], True), (".75", ["0.75"], True), ("3/4", ["0.75"], True),
    ("x = 4", ["4"], True), ("$50", ["50"], True), ("$50.00", ["50"], True), ("25 %", ["25"], True),
    ("30 cm²", ["30"], True), ("60°", ["60"], True), ("8,000", ["8000"], True), ("8 000", ["8000"], True),
    ("−12", ["-12"], True), ("12", ["-12"], False), ("Equilátero", ["equilatero"], True),
    ("  Martes ", ["martes"], True), ("4/8", ["4", "4/8"], True), ("75%", ["3/4", "75%"], True),
    ("1/0", ["1"], False), ("", ["1"], False), (None, ["1"], False), ("cinco", ["5"], False),
])
def test_acepta_formas_comunes_de_escribir(dada, aceptadas, esperado):
    assert diagnostico.es_correcta(dada, aceptadas) is esperado


# ---------------- La API ----------------

def test_el_grado_se_guarda_y_elige_el_examen(cliente):
    r = _registrar(cliente, "quinto", grado="P5")
    assert r["usuario"]["grado"] == "P5"
    assert cliente.get("/api/auth/yo").json()["usuario"]["grado"] == "P5"

    d = cliente.get("/api/diagnostico").json()
    assert d["hecho"] is False and d["grado"] == "P5" and d["grado_nombre"] == "5.º de primaria"
    assert [p["id"] for p in d["preguntas"]] == [p["id"] for p in diagnostico.POR_GRADO["P5"]]
    assert all("respuestas" not in p and "respuesta" not in p for p in d["preguntas"])

    r = cliente.post("/api/diagnostico", json={"respuestas": {"p5-1": "2,852", "p5-2": "2", "p5-5": "0.25", "p5-8": "Rojo"}}).json()
    assert r["hecho"] and r["grado"] == "P5" and r["total"] == 8 and r["aciertos"] == 3
    assert {h["habilidad"] for h in r["habilidades"] if h["logrado"]} == {"multiplicacion-llevadas", "division-residuo", "moda"}


def test_sin_grado_sigue_el_examen_general(cliente):
    _registrar(cliente, "antiguo")
    d = cliente.get("/api/diagnostico").json()
    assert d["grado"] is None and [p["id"] for p in d["preguntas"]] == [f"d{i}" for i in range(1, 9)]


def test_grado_invalido_y_profesor_sin_grado(cliente, nuevo_cliente):
    assert cliente.post("/api/auth/registro", json={"usuario": "raro", "apodo": "Raro", "password": "selva123",
                                                    "grado": "P7"}).status_code == 422
    profe = nuevo_cliente()
    assert _registrar(profe, "profa", grado="S2", rol="profesor")["usuario"]["grado"] is None


def test_profesor_ve_grupo_con_grados_distintos(cliente, nuevo_cliente):
    _registrar(cliente, "profe", rol="profesor")
    aula = cliente.post("/api/aulas", json={"nombre": "Mixto"}).json()
    respuestas = {
        "uno": ("P1", {"p1-1": "6", "p1-3": "7"}),
        "tres": ("S3", {"s3-1": "32"}),
        "viejo": (None, {"d1": "85"}),
    }
    for usuario, (grado, resp) in respuestas.items():
        a = nuevo_cliente()
        _registrar(a, usuario, grado=grado)
        a.post("/api/aulas/unirse", json={"codigo": aula["codigo"]})
        assert a.post("/api/diagnostico", json={"respuestas": resp}).status_code == 200
    pendiente = nuevo_cliente()
    _registrar(pendiente, "nuevo", grado="P4")
    pendiente.post("/api/aulas/unirse", json={"codigo": aula["codigo"]})

    g = cliente.get(f"/api/aulas/{aula['id']}/diagnostico").json()
    assert g["hechos"] == 3 and g["alumnos_total"] == 4
    por_apodo = {a["usuario"]: a for a in g["alumnos"]}
    assert por_apodo["uno"]["grado_nombre"] == "1.º de primaria" and por_apodo["uno"]["aciertos"] == 2
    assert por_apodo["tres"]["grado"] == "S3" and por_apodo["viejo"]["grado"] is None
    assert por_apodo["nuevo"]["hecho"] is False and por_apodo["nuevo"]["grado"] == "P4"
    hab = {h["habilidad"]: h for h in g["habilidades"]}
    assert hab["conteo"] == {"habilidad": "conteo", "nombre": "Contar", "logrado": 1, "de": 1}
    assert hab["potencias"]["logrado"] == 1 and hab["potencias"]["de"] == 1
    assert hab["suma"]["de"] == 1  # solo "viejo" tuvo suma en su examen
    assert "angulos" in hab and hab["angulos"]["logrado"] == 0
