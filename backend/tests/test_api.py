from app import juego
from tests.conftest import registrar


# ---------------- Autenticación ----------------

def test_registro_da_codigo_y_sesion(cliente):
    r = registrar(cliente)
    assert len(r["codigo_recuperacion"]) == 14  # XXXX-XXXX-XXXX
    assert cliente.get("/api/auth/yo").json()["usuario"]["usuario"] == "luna"


def test_usuario_repetido_y_validaciones(cliente):
    registrar(cliente)
    assert cliente.post("/api/auth/registro", json={"usuario": "LUNA", "apodo": "x", "password": "selva123"}).status_code == 409
    r = cliente.post("/api/auth/registro", json={"usuario": "a", "apodo": "x", "password": "selva123"})
    assert r.status_code == 422 and "usuario" in r.json()["error"].lower()
    r = cliente.post("/api/auth/registro", json={"usuario": "teo", "apodo": "Teo", "password": "teo"})
    assert r.status_code == 422


def test_login_logout_y_password_incorrecta(cliente):
    registrar(cliente)
    cliente.post("/api/auth/logout")
    assert cliente.get("/api/auth/yo").status_code == 401
    assert cliente.post("/api/auth/login", json={"usuario": "luna", "password": "mala"}).status_code == 401
    assert cliente.post("/api/auth/login", json={"usuario": "Luna ", "password": "selva123"}).status_code == 200
    assert cliente.get("/api/auth/yo").status_code == 200


def test_freno_de_intentos(cliente):
    registrar(cliente)
    for _ in range(5):
        cliente.post("/api/auth/login", json={"usuario": "luna", "password": "mala"})
    assert cliente.post("/api/auth/login", json={"usuario": "luna", "password": "selva123"}).status_code == 429


def test_recuperar_con_codigo(cliente, nuevo_cliente):
    codigo = registrar(cliente)["codigo_recuperacion"]
    otro = nuevo_cliente()
    assert otro.post("/api/auth/recuperar", json={"usuario": "luna", "codigo": "AAAA-BBBB-CCCC", "nueva_password": "nueva123"}).status_code == 401
    r = otro.post("/api/auth/recuperar", json={"usuario": "luna", "codigo": codigo.lower().replace("-", " "), "nueva_password": "nueva123"})
    assert r.status_code == 200
    nuevo = r.json()["codigo_recuperacion"]
    assert nuevo != codigo
    # El código viejo ya no sirve y la sesión del primer navegador se cerró.
    assert otro.post("/api/auth/recuperar", json={"usuario": "luna", "codigo": codigo, "nueva_password": "otra1234"}).status_code == 401
    assert cliente.get("/api/auth/yo").status_code == 401
    assert cliente.post("/api/auth/login", json={"usuario": "luna", "password": "nueva123"}).status_code == 200


def test_cookie_es_httponly(cliente):
    r = cliente.post("/api/auth/registro", json={"usuario": "luna", "apodo": "Luna", "password": "selva123"})
    assert "httponly" in r.headers["set-cookie"].lower()


# ---------------- Contenido y retos ----------------

def test_contenido_no_trae_respuestas(cliente):
    registrar(cliente)
    texto = cliente.get("/api/contenido").text
    assert '"respuesta"' not in texto and "explicacion" not in texto
    mundos = cliente.get("/api/contenido").json()["mundos"]
    assert mundos[0]["retos"][0]["id"] == "m1-r1" and len(mundos[0]["retos"][0]["pistas"]) == 3


def test_reto_validado_en_servidor_con_senda(cliente):
    registrar(cliente)
    r = cliente.post("/api/ejercicios/m1-r1/intentos", json={"respuesta": "9"}).json()  # 3 × 6: sumó 3 + 6
    assert r["correcto"] is False
    assert r["diagnostico"]["tipo_error"] == "sumo" and r["diagnostico"]["paso_torcido"] == 2
    assert "respuesta" not in r and "18" not in str(r["diagnostico"])
    r = cliente.post("/api/ejercicios/m1-r1/intentos", json={"respuesta": "$18"}).json()
    assert r["correcto"] is True and r["respuesta"] == "18"
    # Se equivocó antes: 2 estrellas + 5 del reto del día.
    assert r["recompensa"] == {"ganadas": 2, "bono": 5, "repaso": False}
    assert r["estado"]["estrellas"] == 7


def test_a_la_primera_da_3_y_repaso_no_da_nada(cliente):
    registrar(cliente)
    r = cliente.post("/api/ejercicios/m1-r1/intentos", json={"respuesta": "18"}).json()
    assert r["recompensa"]["ganadas"] == 3
    r = cliente.post("/api/ejercicios/m1-r2/intentos", json={"respuesta": "12", "pistas_usadas": 1}).json()
    assert r["recompensa"] == {"ganadas": 2, "bono": 0, "repaso": False}
    r = cliente.post("/api/ejercicios/m1-r1/intentos", json={"respuesta": "18"}).json()
    assert r["recompensa"]["repaso"] is True and r["estado"]["estrellas"] == 3 + 5 + 2


def test_no_se_puede_saltar_retos(cliente):
    registrar(cliente)
    assert cliente.post("/api/ejercicios/m1-r3/intentos", json={"respuesta": "24"}).status_code == 403
    assert cliente.post("/api/ejercicios/m2-r1/intentos", json={"respuesta": "36"}).status_code == 403
    assert cliente.post("/api/lecciones/m1/cofre").status_code == 409


def _terminar_m1(c):
    for rid, resp in (("m1-r1", "18"), ("m1-r2", "12"), ("m1-r3", "24"), ("m1-r4", "40")):
        assert c.post(f"/api/ejercicios/{rid}/intentos", json={"respuesta": resp}).json()["correcto"]


def test_cofre_da_sticker_y_abre_mundo_2(cliente):
    registrar(cliente)
    _terminar_m1(cliente)
    est = cliente.get("/api/juego/estado").json()
    assert est["mapa"]["m1"]["cofre"] == "actual"
    assert est["mapa"]["m2"]["abierta"] is False
    r = cliente.post("/api/lecciones/m1/cofre").json()
    assert r["sticker"] == "mochila"
    assert r["estado"]["mapa"]["m2"]["nodos"]["m2-r1"] == "actual"
    assert cliente.post("/api/lecciones/m1/cofre").status_code == 409  # no se abre dos veces


def test_etapa_sube_y_medidores_bajan_al_jugar(cliente):
    registrar(cliente)
    _terminar_m1(cliente)
    est = cliente.get("/api/juego/estado").json()
    assert est["etapa_apoyo"] == 2  # 3 seguidos sin pistas
    assert est["mascota"]["comida"] == 3  # 4 retos -> bajó una marca (cada 3)
    assert est["racha_dias"] == 1 and est["xp"] == est["estrellas"]


def test_cuidados_y_estrellas(cliente):
    registrar(cliente)
    assert cliente.post("/api/mascota/cuidar", json={"accion": "jugar"}).status_code == 409  # sin estrellas
    assert cliente.post("/api/mascota/cuidar", json={"accion": "limpiar"}).json()["mascota"]["pecera"] == 5
    cliente.post("/api/ejercicios/m1-r1/intentos", json={"respuesta": "18"})
    est = cliente.post("/api/mascota/cuidar", json={"accion": "alimentar"}).json()
    assert est["estrellas"] == 3 + 5 - 1 and est["mascota"]["comida"] == 5
    assert cliente.post("/api/mascota/cuidar", json={"accion": "descansar"}).json()["mascota"]["dormido"] is True
    assert cliente.post("/api/mascota/cuidar", json={"accion": "volar"}).status_code == 422


# ---------------- Roles y aulas ----------------

def test_roles(cliente, nuevo_cliente):
    registrar(cliente, "profe", rol="profesor")
    assert cliente.get("/api/juego/estado").status_code == 403
    alumno = nuevo_cliente()
    registrar(alumno, "teo")
    assert alumno.post("/api/aulas", json={"nombre": "Mi aula"}).status_code == 403


def test_aula_codigo_unirse_y_panel(cliente, nuevo_cliente):
    registrar(cliente, "profe", rol="profesor")
    aula = cliente.post("/api/aulas", json={"nombre": "5.º B"}).json()
    assert len(aula["codigo"]) == 7 and aula["codigo"][3] == "-"

    alumnos = []
    for nombre, respuesta in (("teo", "9"), ("luna", "18")):
        c = nuevo_cliente()
        registrar(c, nombre)
        r = c.post("/api/aulas/unirse", json={"codigo": aula["codigo"].lower().replace("-", "")})
        assert r.status_code == 200 and "codigo" not in r.json()  # el alumno no ve el código ni la lista
        c.post("/api/ejercicios/m1-r1/intentos", json={"respuesta": respuesta})
        alumnos.append(c)

    panel = cliente.get(f"/api/aulas/{aula['id']}/panel").json()
    assert [a["apodo"] for a in panel["alumnos"]] == ["Luna", "Teo"]  # alfabético, nunca por resultado
    assert panel["errores_comunes"][0]["id"] == "sumo"
    assert [a["apodo"] for a in panel["necesitan_apoyo"]] == ["Teo"]
    assert "3 × 6" in panel["que_reforzar"]


def test_regenerar_codigo_expulsar_y_asignar(cliente, nuevo_cliente):
    registrar(cliente, "profe", rol="profesor")
    aula = cliente.post("/api/aulas", json={"nombre": "5.º B"}).json()
    alumno = nuevo_cliente()
    alumno_id = registrar(alumno, "teo")["usuario"]["id"]
    alumno.post("/api/aulas/unirse", json={"codigo": aula["codigo"]})

    nuevo = cliente.post(f"/api/aulas/{aula['id']}/regenerar-codigo").json()["codigo"]
    assert nuevo != aula["codigo"]
    otro = nuevo_cliente()
    registrar(otro, "sol")
    assert otro.post("/api/aulas/unirse", json={"codigo": aula["codigo"]}).status_code == 404

    r = cliente.post(f"/api/aulas/{aula['id']}/asignaciones", json={"leccion_id": "m1", "fecha_limite": "2026-11-28"})
    assert r.json()["asignaciones"][0]["leccion"] == "La tiendita"
    assert alumno.get("/api/aulas").json()["aulas"][0]["asignaciones"][0]["fecha_limite"] == "2026-11-28"

    assert cliente.delete(f"/api/aulas/{aula['id']}/alumnos/{alumno_id}").status_code == 204
    assert alumno.get("/api/aulas").json()["aulas"] == []


def test_un_profesor_no_ve_aulas_ajenas(cliente, nuevo_cliente):
    """IDOR: probar con el id de otra aula devuelve 404."""
    registrar(cliente, "profe", rol="profesor")
    aula = cliente.post("/api/aulas", json={"nombre": "5.º B"}).json()
    intruso = nuevo_cliente()
    registrar(intruso, "otro_profe", rol="profesor")
    for metodo, ruta in (("get", ""), ("get", "/panel"), ("post", "/regenerar-codigo"), ("delete", "")):
        assert getattr(intruso, metodo)(f"/api/aulas/{aula['id']}{ruta}").status_code == 404
    alumno = nuevo_cliente()
    registrar(alumno, "teo")
    assert alumno.get(f"/api/aulas/{aula['id']}").status_code == 404  # no está unido


def test_ajustes(cliente):
    registrar(cliente)
    assert cliente.get("/api/ajustes").json()["tema"] == "sistema"
    assert cliente.put("/api/ajustes", json={"tema": "oscuro"}).json()["tema"] == "oscuro"
    assert cliente.put("/api/ajustes", json={"tema": "morado"}).status_code == 422


# ---------------- Reglas puras ----------------

def test_diagnostico_igual_que_el_frontend():
    d = juego.diagnosticar(3, "×", 12, 26)
    assert d["pregunta"] == "¿12 + 12 + 12 da 26?" and d["paso_torcido"] == 3
    assert juego.diagnosticar(9, "-", 4, 6)["pregunta"] == "Comprueba al revés: ¿6 + 4 da 9?"


def test_racha():
    from datetime import date
    assert juego.nueva_racha(3, date(2026, 11, 22), date(2026, 11, 23)) == 4
    assert juego.nueva_racha(3, date(2026, 11, 20), date(2026, 11, 23)) == 1
    assert juego.nueva_racha(3, date(2026, 11, 23), date(2026, 11, 23)) == 3


def test_generador_no_repite_formato_y_respeta_nivel():
    from app.contenido import generar_multiplicacion
    e = generar_multiplicacion(1, "p-1", 1, semilla=7)
    assert 2 <= e["datos"]["a"] <= 4 and e["respuesta"] == str(e["datos"]["a"] * e["datos"]["b"])
    assert all(e["respuesta"] not in p for p in e["pistas"])
