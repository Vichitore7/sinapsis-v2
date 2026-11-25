"""Actividades del aula: el profesor deja problemas, el alumno los resuelve en su cuaderno y los escanea."""
from tests.conftest import registrar

PROBLEMAS = [
    {"a": 6, "op": "×", "b": 7, "enunciado": "Hay 6 bolsitas con 7 dulces. ¿Cuántos dulces hay?"},
    {"a": "3/4", "op": "+", "b": "1/2"},
    {"a": 17, "op": "÷", "b": 5},
]


def _clase(cliente, nuevo_cliente, alumnos=("teo",)):
    registrar(cliente, "profe", rol="profesor")
    aula = cliente.post("/api/aulas", json={"nombre": "3.º A"}).json()
    clientes = []
    for nombre in alumnos:
        c = nuevo_cliente()
        registrar(c, nombre)
        assert c.post("/api/aulas/unirse", json={"codigo": aula["codigo"]}).status_code == 200
        clientes.append(c)
    act = cliente.post(f"/api/aulas/{aula['id']}/actividades",
                       json={"titulo": "Repaso", "material": "Lee https://ejemplo.mx", "problemas": PROBLEMAS})
    assert act.status_code == 201, act.text
    return aula, act.json()["id"], clientes


def _escanear(c, act_id, pid, a, op, b, cc, residuo=None):
    cuerpo = {"a": a, "op": op, "b": b, "c": cc}
    if residuo is not None:
        cuerpo["residuo"] = residuo
    return c.post(f"/api/actividades/{act_id}/problemas/{pid}/escaneo", json=cuerpo).json()


def test_el_alumno_ve_su_actividad_sin_respuestas(cliente, nuevo_cliente):
    aula, act_id, (teo,) = _clase(cliente, nuevo_cliente)
    lista = teo.get(f"/api/aulas/{aula['id']}/actividades").json()["actividades"]
    assert [a["titulo"] for a in lista] == ["Repaso"]
    a = teo.get(f"/api/aulas/{aula['id']}/actividades/{act_id}").json()
    assert [p["texto"] for p in a["problemas"]] == ["6 × 7", "3/4 + 1/2", "17 ÷ 5"]
    assert all(p["estado"] == "pendiente" for p in a["problemas"]) and not a["puede_entregar"]
    texto = str(a)
    assert "42" not in texto and "5/4" not in texto  # los resultados nunca salen al navegador


def test_escanear_revisa_y_resolver_con_ayuda(cliente, nuevo_cliente):
    aula, act_id, (teo,) = _clase(cliente, nuevo_cliente)
    r = _escanear(teo, act_id, "p1", 6, "×", 7, 13)  # sumó en vez de multiplicar
    assert r["coincide"] and not r["correcto"] and not r["resuelto"]
    r = _escanear(teo, act_id, "p1", 7, "×", 6, 42)  # lo corrigió (en × el orden no importa)
    assert r["correcto"] and r["resuelto"]
    assert _escanear(teo, act_id, "p2", "3/4", "+", "1/2", "5/4")["resuelto"]
    # Una operación distinta no cuenta para el problema.
    assert _escanear(teo, act_id, "p3", 17, "÷", 4, 4) == {"coincide": False, "problema": "17 ÷ 5"}


def test_resolverlo_en_el_chat_cuenta_solo_despues_de_escanearlo(cliente, nuevo_cliente):
    aula, act_id, (teo,) = _clase(cliente, nuevo_cliente)
    url = f"/api/actividades/{act_id}/problemas/p1/resuelto-en-chat"
    assert teo.post(url).json() == {"resuelto": False}  # sin escanear, no (el filtro de Mix es obligatorio)
    _escanear(teo, act_id, "p1", 6, "×", 7, 13)
    assert teo.post(url).json() == {"resuelto": False}  # todavía no lo resuelve en el chat
    teo.post("/api/tutor", json={"operacion": {"a": 6, "op": "×", "b": 7, "c": 13}, "mensaje": "ya me salió 42"})
    assert teo.post(url).json() == {"resuelto": True}


def test_entregar_pide_que_todo_pase_por_el_escaner(cliente, nuevo_cliente):
    aula, act_id, (teo,) = _clase(cliente, nuevo_cliente)
    url = f"/api/actividades/{act_id}/entregar"
    _escanear(teo, act_id, "p1", 6, "×", 7, 42)
    assert teo.post(url).status_code == 409
    _escanear(teo, act_id, "p2", "3/4", "+", "1/2", "4/6")  # mal, pero ya pasó por Mix
    _escanear(teo, act_id, "p3", 17, "÷", 5, 3, 2)
    r = teo.post(url)
    assert r.status_code == 200 and r.json()["entregada"]
    lista = cliente.get(f"/api/aulas/{aula['id']}/actividades").json()["actividades"]
    assert lista[0]["entregaron"] == 1 and lista[0]["alumnos"] == 1


def test_el_profesor_ve_las_respuestas_en_palabras(cliente, nuevo_cliente):
    aula, act_id, (teo,) = _clase(cliente, nuevo_cliente)
    _escanear(teo, act_id, "p1", 6, "×", 7, 42)
    _escanear(teo, act_id, "p2", "3/4", "+", "1/2", "4/6")
    d = cliente.get(f"/api/aulas/{aula['id']}/actividades/{act_id}").json()
    r = d["entregas"][0]["respuestas"]
    assert r[0]["estado"] == "bien" and r[0]["texto"] == "6 × 7" and "42" in r[0]["nota"]
    assert r[1]["estado"] == "mal" and "sumó numeradores y denominadores" in r[1]["nota"]
    assert r[2]["estado"] == "pendiente"


def test_comprension_por_tema_para_el_profesor(cliente, nuevo_cliente):
    registrar(cliente, "profe", rol="profesor")
    aula = cliente.post("/api/aulas", json={"nombre": "4.º B"}).json()
    teo = nuevo_cliente()
    registrar(teo, "teo")
    teo.post("/api/aulas/unirse", json={"codigo": aula["codigo"]})
    problemas = [{"a": 6, "op": "×", "b": 7}, {"a": 8, "op": "×", "b": 4}, {"a": 9, "op": "×", "b": 3},
                 {"a": "3/4", "op": "+", "b": "1/2"}, {"a": "1/3", "op": "+", "b": "1/6"}]
    act_id = cliente.post(f"/api/aulas/{aula['id']}/actividades", json={"titulo": "Mix", "problemas": problemas}).json()["id"]
    for pid, (a, b, c) in zip(("p1", "p2", "p3"), ((6, 7, 42), (8, 4, 32), (9, 3, 27))):
        _escanear(teo, act_id, pid, a, "×", b, c)  # multiplicación: todo a la primera
    _escanear(teo, act_id, "p4", "3/4", "+", "1/2", "4/6")  # fracciones: mal y sin corregir
    _escanear(teo, act_id, "p5", "1/3", "+", "1/6", "2/9")
    grupo = cliente.get(f"/api/aulas/{aula['id']}/comprension").json()
    temas = grupo["alumnos"][0]["temas"]
    assert temas["multiplicacion"]["categoria"] == "domina"
    assert temas["fracciones"] == {"categoria": "dificultad", "frase": "No lo entendió todavía"}  # por módulo
    detalle = cliente.get(f"/api/aulas/{aula['id']}/alumnos/{grupo['alumnos'][0]['id']}/comprension").json()
    frac = next(t for t in detalle["temas"] if t["concepto"] == "fracciones")
    assert frac["nombre"] == "Fracciones"
    assert frac["error_frecuente"] == "sumó numeradores y denominadores por separado"
    assert detalle["actividades"][0]["respuestas"][0]["estado"] == "bien"


def test_nadie_ve_actividades_de_otra_clase(cliente, nuevo_cliente):
    aula, act_id, (teo,) = _clase(cliente, nuevo_cliente)
    intruso = nuevo_cliente()
    registrar(intruso, "intruso")
    assert intruso.get(f"/api/aulas/{aula['id']}/actividades").status_code == 404
    assert intruso.post(f"/api/actividades/{act_id}/problemas/p1/escaneo",
                        json={"a": 6, "op": "×", "b": 7, "c": 42}).status_code == 404
    otro_profe = nuevo_cliente()
    registrar(otro_profe, "otraprofe", rol="profesor")
    assert otro_profe.get(f"/api/aulas/{aula['id']}/comprension").status_code == 404
    assert otro_profe.get(f"/api/aulas/{aula['id']}/actividades/{act_id}").status_code == 404
    assert teo.post(f"/api/aulas/{aula['id']}/actividades", json={"titulo": "x", "problemas": PROBLEMAS}).status_code == 403


def test_problemas_que_el_escaner_no_revisa_se_rechazan(cliente, nuevo_cliente):
    registrar(cliente, "profe", rol="profesor")
    aula = cliente.post("/api/aulas", json={"nombre": "S1"}).json()
    r = cliente.post(f"/api/aulas/{aula['id']}/actividades", json={"titulo": "x", "problemas": [{"a": 3, "op": "−", "b": 8}]})
    assert r.status_code == 422 and "escáner" in r.json()["error"]


def test_banco_de_problemas_por_grado(cliente):
    registrar(cliente, "profe", rol="profesor")
    grados = cliente.get("/api/actividades/banco").json()["grados"]
    assert [g["clave"] for g in grados] == ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3"]
    for g in grados:
        assert g["problemas"] and all("respuesta" not in p and p["tema"] for p in g["problemas"])


def test_un_solo_problema_bien_a_la_primera_cuenta_como_dominio(cliente, nuevo_cliente):
    aula, act_id, (teo,) = _clase(cliente, nuevo_cliente)
    _escanear(teo, act_id, "p1", 6, "×", 7, 42)
    temas = cliente.get(f"/api/aulas/{aula['id']}/comprension").json()["alumnos"][0]["temas"]
    assert temas["multiplicacion"] == {"categoria": "domina", "frase": "Lo resolvió bien a la primera"}


def test_la_tarea_se_organiza_por_modulo(cliente, nuevo_cliente):
    registrar(cliente, "profe", rol="profesor")
    aula = cliente.post("/api/aulas", json={"nombre": "3.º C"}).json()
    teo = nuevo_cliente()
    registrar(teo, "teo")
    teo.post("/api/aulas/unirse", json={"codigo": aula["codigo"]})
    url = f"/api/aulas/{aula['id']}/actividades"
    ok = cliente.post(url, json={"titulo": "Fracciones 1", "modulo": "fracciones",
                                 "problemas": [{"a": "1/4", "op": "+", "b": "2/4"}, {"a": "3/4", "op": "−", "b": "1/4"}]})
    assert ok.status_code == 201
    # Un ejercicio de otro módulo no entra en esta tarea.
    r = cliente.post(url, json={"titulo": "x", "modulo": "fracciones", "problemas": [{"a": 6, "op": "×", "b": 7}]})
    assert r.status_code == 422 and "Multiplicación" in r.json()["error"]
    assert cliente.post(url, json={"titulo": "x", "modulo": "geometria", "problemas": [{"a": 6, "op": "×", "b": 7}]}).status_code == 422
    lista = teo.get(url).json()["actividades"]
    assert lista[0]["modulo"] == "fracciones" and lista[0]["modulo_nombre"] == "Fracciones"
    banco = cliente.get("/api/actividades/banco").json()
    assert {m["id"] for m in banco["modulos"]} == {"suma-resta", "multiplicacion", "division", "fracciones"}
    assert all(p["modulo"] in {"suma-resta", "multiplicacion", "division", "fracciones"} for g in banco["grados"] for p in g["problemas"])


def test_el_panel_del_profe_resume_solo_las_tareas(cliente, nuevo_cliente):
    aula, act_id, (teo,) = _clase(cliente, nuevo_cliente)
    _escanear(teo, act_id, "p1", 6, "×", 7, 13)   # error: sumó
    _escanear(teo, act_id, "p1", 6, "×", 7, 42)   # lo corrigió
    _escanear(teo, act_id, "p2", "3/4", "+", "1/2", "5/4")
    g = cliente.get(f"/api/aulas/{aula['id']}/comprension").json()
    r = g["alumnos"][0]["resumen"]
    assert (r["tareas"], r["entregadas"], r["ejercicios"], r["escaneados"]) == (1, 0, 3, 2)
    assert (r["a_la_primera"], r["con_ayuda"], r["sin_corregir"]) == (1, 1, 0)
    assert r["errores"] == [{"id": "sumo", "texto": "sumó en lugar de multiplicar", "veces": 1}]
    assert g["errores_comunes"] == [{"texto": "sumó en lugar de multiplicar", "alumnos": 1, "veces": 1}]


# ---------------- Foto de la página completa (25 nov) ----------------

def _pagina_con(monkeypatch, operaciones_leidas):
    """Claude SIMULADO: lee estas operaciones de la página (no gasta saldo)."""
    import json
    from types import SimpleNamespace
    from app import config, lector

    class Falso:
        messages = None

        def create(self, **kw):
            return SimpleNamespace(stop_reason="end_turn", content=[
                SimpleNamespace(type="text", text=json.dumps({"operaciones": operaciones_leidas}))])
    f = Falso()
    f.messages = f
    monkeypatch.setattr(config, "TUTOR_ACTIVO", True)
    monkeypatch.setattr(lector, "_cliente_claude", lambda: f)
    lector.limite.reiniciar_todo()


import base64  # noqa: E402

FOTO = "data:image/jpeg;base64," + base64.b64encode(b"\xff\xd8\xff\xe0 pagina de prueba \xff\xd9").decode()


def _op(a, op, b, c, residuo=None, dudoso=False):
    return {"a": a, "op": op, "b": b, "c": c, "residuo": residuo, "dudoso": dudoso}


def test_leer_pagina_acomoda_cada_operacion_en_su_problema(cliente, nuevo_cliente, monkeypatch):
    aula, act_id, (teo,) = _clase(cliente, nuevo_cliente)
    # En la página: el 17 ÷ 5 primero, el 6 × 7 escrito al revés, una cuenta que no es de la tarea y una sin resultado.
    _pagina_con(monkeypatch, [_op("17", "÷", "5", "3", "2"), _op("7", "×", "6", "13"), _op("9", "+", "9", "18"),
                              _op("3/4", "+", "1/2", None, dudoso=True)])
    r = teo.post(f"/api/actividades/{act_id}/leer-pagina", json={"foto": FOTO})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["origen"] == "claude" and d["otras"] == ["9 + 9"]
    assert [(e["numero"], e["problema_id"], e["lectura"]["c"]) for e in d["encontrados"]] == [(1, "p1", "13"), (2, "p2", ""), (3, "p3", "3")]
    assert d["encontrados"][1]["lectura"]["dudoso"] is True
    # No registra nada hasta que el alumno confirma y se escanea cada una.
    a = teo.get(f"/api/aulas/{aula['id']}/actividades/{act_id}").json()
    assert all(p["estado"] == "pendiente" for p in a["problemas"])


def test_leer_pagina_sin_ia_regresa_vacio(cliente, nuevo_cliente, monkeypatch):
    from app import config
    monkeypatch.setattr(config, "TUTOR_ACTIVO", False)
    aula, act_id, (teo,) = _clase(cliente, nuevo_cliente)
    d = teo.post(f"/api/actividades/{act_id}/leer-pagina", json={"foto": FOTO}).json()
    assert d == {"encontrados": [], "otras": [], "origen": "sin_ia"}


def test_leer_pagina_solo_de_su_clase(cliente, nuevo_cliente, monkeypatch):
    aula, act_id, _ = _clase(cliente, nuevo_cliente)
    otro = nuevo_cliente()
    registrar(otro, "ajeno")
    assert otro.post(f"/api/actividades/{act_id}/leer-pagina", json={"foto": FOTO}).status_code in (403, 404)
