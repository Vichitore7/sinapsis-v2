from app import contenido_canal as canal
from app import contenido_cdmx as cdmx
from app import contenido_fes as fes
from app import contenido_nevado as nevado
from app import juego
from app.contenido import TRAJES_SUBCULTURAS
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
    assert [m["id"] for m in mundos[:5]] == ["x1", "c2", "f3", "n4", "m2"] and "m1" not in [m["id"] for m in mundos]
    canal_ = mundos[0]
    assert canal_["nombre"] == "El Canal de los Números" and canal_["tema"] == "xochimilco"
    assert len(canal_["retos"]) == 36 and {r["nivel"] for r in canal_["retos"]} == set(range(1, 13))
    assert canal_["retos"][0]["id"] == "x1-n01-1" and canal_["retos"][0]["visual"]["tipo"] == "objetos"
    centro = mundos[1]
    assert centro["nombre"] == "El Centro de los Números" and centro["tema"] == "cdmx" and len(centro["retos"]) == 36
    fases = {r["nivel"]: r["fase_cpa"] for r in centro["retos"]}
    assert [fases[n] for n in (1, 4, 5, 8, 9, 12)] == ["concreto", "concreto", "pictórico", "pictórico", "abstracto", "abstracto"]
    fes_ = mundos[2]
    assert fes_["nombre"] == "La FES de los Números" and fes_["tema"] == "fes" and len(fes_["retos"]) == 36
    nev = mundos[3]
    assert nev["nombre"] == "El Nevado de los Números" and nev["tema"] == "nevado" and len(nev["retos"]) == 36
    assert mundos[4]["retos"][0]["id"] == "m2-r1" and len(mundos[4]["retos"][0]["pistas"]) == 3


def _niveles(c, mundo):
    """Resuelve los 36 ejercicios de los 12 niveles de un mundo temático."""
    for e in mundo.ejercicios():
        assert c.post(f"/api/ejercicios/{e['id']}/intentos", json={"respuesta": e["respuesta"]}).json()["correcto"], e["id"]


def _examen(c, mundo):
    """Contesta bien todo el examen general de un mundo y lo termina. Devuelve los trajes de premio."""
    lid = mundo.LECCION_ID
    assert c.get(f"/api/examenes/{lid}").status_code == 200
    for p in mundo.examen():
        r = c.post(f"/api/examenes/{lid}/preguntas/{p['id']}", json={"respuesta": p["respuesta"]}).json()
        assert r["correcto"], p["id"]
    return [t["id"] for t in c.post(f"/api/examenes/{lid}/terminar").json()["examen"]["premio"]]


def _terminar(c, mundo, siguiente):
    """Niveles + examen general + vestir a Mix con un traje del premio (así se abre el mundo siguiente)."""
    _niveles(c, mundo)
    premio = _examen(c, mundo)
    assert c.put("/api/mascota/traje", json={"traje": premio[0]}).json()["mapa"][siguiente]["abierta"] is True


def _niveles_canal(c):
    _niveles(c, canal)


def _terminar_canal(c):
    """El canal abre el Mundo 2 (El Centro de los Números)."""
    _terminar(c, canal, "c2")


def _hasta_el_mercado(c):
    """Canal + Centro + FES + Nevado: deja abierto El mercado (Mundo 5, multiplicación)."""
    _terminar(c, canal, "c2")
    _terminar(c, cdmx, "f3")
    _terminar(c, fes, "n4")
    _terminar(c, nevado, "m2")


def test_fes_tercero_y_premio_para_el_frio(cliente):
    registrar(cliente)
    _terminar(cliente, canal, "c2")
    _terminar(cliente, cdmx, "f3")
    est = cliente.get("/api/juego/estado").json()
    assert est["mapa"]["f3"]["nodos"]["f3-n01-1"] == "actual" and est["mapa"]["n4"]["abierta"] is False
    # Resta de 3 cifras con ceros (500 − 347): el diagnóstico no da la respuesta.
    for e in fes.ejercicios()[:7]:
        assert cliente.post(f"/api/ejercicios/{e['id']}/intentos", json={"respuesta": e["respuesta"]}).json()["correcto"], e["id"]
    r = cliente.post("/api/ejercicios/f3-n03-2/intentos", json={"respuesta": "253"}).json()
    assert r["correcto"] is False and "153" not in r["diagnostico"]["pregunta"]
    assert cliente.post("/api/ejercicios/f3-n03-2/intentos", json={"respuesta": "153"}).json()["correcto"]
    # Fracciones como opción
    for e in fes.ejercicios()[8:]:
        assert cliente.post(f"/api/ejercicios/{e['id']}/intentos", json={"respuesta": e["respuesta"]}).json()["correcto"], e["id"]
    premio = _examen(cliente, fes)
    est = cliente.get("/api/juego/estado").json()
    assert "peluche" in est["stickers"] and premio == ["nevado-gorro", "nevado-orejeras"]
    assert est["mapa"]["n4"]["abierta"] is False
    assert cliente.put("/api/mascota/traje", json={"traje": premio[0]}).json()["mapa"]["n4"]["abierta"] is True


def test_centro_division_y_examen_abren_la_fes(cliente):
    registrar(cliente)
    _terminar_canal(cliente)
    est = cliente.get("/api/juego/estado").json()
    assert est["mapa"]["c2"]["nodos"]["c2-n01-1"] == "actual" and est["mapa"]["m2"]["abierta"] is False
    for e in cdmx.ejercicios()[:24]:  # niveles 1 a 8
        assert cliente.post(f"/api/ejercicios/{e['id']}/intentos", json={"respuesta": e["respuesta"]}).json()["correcto"], e["id"]
    # División (nivel 9): diagnóstico con la comprobación al revés, sin dar la respuesta.
    r = cliente.post("/api/ejercicios/c2-n09-1/intentos", json={"respuesta": "9"}).json()  # 12 ÷ 3
    assert r["correcto"] is False and "× 3 da 12" in r["diagnostico"]["pregunta"] and "4" not in r["diagnostico"]["pregunta"]
    assert cliente.post("/api/ejercicios/c2-n09-1/intentos", json={"respuesta": "4"}).json()["correcto"]
    for e in cdmx.ejercicios()[25:]:
        assert cliente.post(f"/api/ejercicios/{e['id']}/intentos", json={"respuesta": e["respuesta"]}).json()["correcto"], e["id"]
    assert cliente.post("/api/lecciones/c2/cofre").status_code == 409  # termina con examen
    premio = _examen(cliente, cdmx)
    est = cliente.get("/api/juego/estado").json()
    assert est["examenes"]["c2"]["estado"] == "terminado" and "tarjeta" in est["stickers"]
    assert premio == ["fes-gorra", "fes-cabello"]  # premio fijo: los 2 atuendos de la FES Aragón (no subculturas al azar)
    assert set(premio) <= set(est["mascota"]["trajes"]) and est["mapa"]["f3"]["abierta"] is False
    assert cliente.put("/api/mascota/traje", json={"traje": premio[1]}).json()["mapa"]["f3"]["abierta"] is True


def test_cargar_contenido_quita_mundos_retirados(tmp_path):
    """Quien ya tenía La tiendita (m1) en su base la pierde al arrancar, con sus retos y su avance."""
    from datetime import date

    from sqlalchemy.orm import sessionmaker

    from app.db import Base, crear_engine
    from app.modelos import Ejercicio, Leccion, Progreso, Usuario
    from app.semilla import cargar_contenido
    engine = crear_engine(f"sqlite:///{tmp_path / 'vieja.db'}")
    Base.metadata.create_all(engine)
    Sesion = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with Sesion() as db:
        cargar_contenido(db)
        db.add(Leccion(id="m1", unidad_id="multiplicacion", orden=1, nombre="La tiendita", entrada="", concepto="", sticker="mochila"))
        db.add(Ejercicio(id="m1-r1", leccion_id="m1", orden=1, titulo="t", enunciado="e", datos={"a": 3, "b": 6}, respuesta="18", pistas=[]))
        u = Usuario(usuario="viejo", apodo="Viejo", rol="alumno", password_hash="x", recuperacion_hash="x")
        db.add(u)
        db.flush()
        db.add(Progreso(alumno_id=u.id, ejercicio_id="m1-r1", estrellas=3, con_ayuda=False, fecha=date.today()))
        db.commit()
        cargar_contenido(db)
        assert db.get(Leccion, "m1") is None and db.get(Ejercicio, "m1-r1") is None
        assert db.get(Leccion, "c2") is not None and db.query(Progreso).count() == 0


def test_examen_canal_certificado_trajes_y_mundo_2(cliente):
    registrar(cliente)
    assert cliente.get("/api/examenes/x1").status_code == 409  # primero los 12 niveles
    _niveles_canal(cliente)
    assert cliente.post("/api/lecciones/x1/cofre").status_code == 409  # el canal termina con examen, no con cofre
    ex = cliente.get("/api/examenes/x1").json()
    assert ex["total"] == 12 and len(ex["preguntas"]) == 12 and '"respuesta"' not in str(ex).replace("'", '"')
    ids = [p["id"] for p in canal.examen()]

    # Pregunta 1: falla 3 veces -> queda por reforzar y ya no se puede contestar.
    for n in range(3):
        r = cliente.post(f"/api/examenes/x1/preguntas/{ids[0]}", json={"respuesta": "1", "pistas_usadas": n}).json()
        assert r["correcto"] is False and "diagnostico" in r
    assert r["estado"] == "por_reforzar" and r["intentos_restantes"] == 0
    assert cliente.post(f"/api/examenes/x1/preguntas/{ids[0]}", json={"respuesta": "9"}).status_code == 409
    # Pregunta 2: con una pista y a la primera -> con ayuda.
    r = cliente.post(f"/api/examenes/x1/preguntas/{ids[1]}", json={"respuesta": "15", "pistas_usadas": 1}).json()
    assert r["correcto"] and r["estado"] == "con_ayuda"
    # Pregunta 3: "No sé todavía".
    assert cliente.post(f"/api/examenes/x1/preguntas/{ids[2]}", json={"respuesta": None}).json()["estado"] == "por_reforzar"
    assert cliente.post("/api/examenes/x1/terminar").status_code == 409  # faltan preguntas
    for p in canal.examen()[3:]:
        assert cliente.post(f"/api/examenes/x1/preguntas/{p['id']}", json={"respuesta": p["respuesta"]}).json()["estado"] == "a_la_primera"

    r = cliente.post("/api/examenes/x1/terminar").json()
    assert r["examen"]["terminado"] and r["examen"]["aciertos"] == 10 and r["examen"]["mundo_abierto"] is False
    premio = [t["id"] for t in r["examen"]["premio"]]
    assert len(premio) == 2 and {TRAJES_SUBCULTURAS[p][2] for p in premio} == {"a", "b"}  # uno de cada estilo
    est = r["estado"]
    assert "flor" in est["stickers"] and set(premio) <= set(est["mascota"]["trajes"])
    assert est["examenes"]["x1"]["estado"] == "terminado" and est["mapa"]["c2"]["abierta"] is False
    # Terminar otra vez no vuelve a premiar.
    assert cliente.post("/api/examenes/x1/terminar").json()["examen"]["premio"] == r["examen"]["premio"]
    # Un traje de bienvenida no abre el Mundo 2; uno del premio sí.
    assert cliente.put("/api/mascota/traje", json={"traje": "trajinero"}).json()["mapa"]["c2"]["abierta"] is False
    est = cliente.put("/api/mascota/traje", json={"traje": premio[1]}).json()
    assert est["mapa"]["c2"]["abierta"] is True and "x1" in est["lecciones_terminadas"]
    # Quitarse el traje no vuelve a cerrar el mundo.
    assert cliente.put("/api/mascota/traje", json={"traje": None}).json()["mapa"]["c2"]["abierta"] is True


def test_sorteo_de_trajes_mezcla_subculturas():
    """Siempre 2 trajes de estilos distintos y de subculturas distintas; con muchos sorteos salen combinaciones variadas."""
    import random
    from app.contenido import sortear_trajes_subcultura
    combinaciones = set()
    for semilla in range(500):
        a, b = sortear_trajes_subcultura([], random.Random(semilla))
        assert {TRAJES_SUBCULTURAS[a][2], TRAJES_SUBCULTURAS[b][2]} == {"a", "b"}
        assert TRAJES_SUBCULTURAS[a][0] != TRAJES_SUBCULTURAS[b][0]  # nunca los dos de la misma subcultura
        combinaciones.add(frozenset((a, b)))
    assert len(combinaciones) > 50  # es aleatorio de verdad, no parejas fijas
    # Si ya tiene casi todos, solo regala los que le faltan.
    todos = list(TRAJES_SUBCULTURAS)
    assert sortear_trajes_subcultura([t for t in todos if t != "emo-rayas"], random.Random(1)) == ["emo-rayas"]


def test_profesor_ve_reporte_del_examen(cliente, nuevo_cliente):
    registrar(cliente, "profe", rol="profesor")
    aula = cliente.post("/api/aulas", json={"nombre": "1.º A"}).json()
    alumno = nuevo_cliente()
    alumno_id = registrar(alumno, "teo")["usuario"]["id"]
    alumno.post("/api/aulas/unirse", json={"codigo": aula["codigo"]})
    _niveles_canal(alumno)
    alumno.get("/api/examenes/x1")
    preguntas = canal.examen()
    alumno.post(f"/api/examenes/x1/preguntas/{preguntas[0]['id']}", json={"respuesta": "7", "pistas_usadas": 2, "tiempo_ms": 4000})
    for p in preguntas:
        alumno.post(f"/api/examenes/x1/preguntas/{p['id']}", json={"respuesta": p["respuesta"], "tiempo_ms": 1000})
    alumno.post("/api/examenes/x1/terminar")

    d = cliente.get(f"/api/aulas/{aula['id']}/alumnos/{alumno_id}").json()
    rep = d["examenes"][0]
    assert rep["mundo"] == "El Canal de los Números" and rep["terminado"] and rep["aciertos"] == 12
    assert rep["con_ayuda"] == 1 and rep["a_la_primera"] == 11 and rep["fallas_total"] == 1 and rep["pistas_total"] == 2
    p1 = rep["preguntas"][0]
    assert p1["respuestas_incorrectas"] == ["7"] and p1["intentos"] == 2 and p1["tiempo_ms"] == 5000
    assert p1["respuesta_correcta"] == "9" and p1["tema"] == "Conteo hasta 10"
    assert d["progreso"]["examenes"]["x1"]["estado"] == "terminado"
    # Otro profesor no puede ver el reporte de un alumno que no está en su aula.
    otro = nuevo_cliente()
    registrar(otro, "profe2", rol="profesor")
    otra_aula = otro.post("/api/aulas", json={"nombre": "2.º B"}).json()
    assert otro.get(f"/api/aulas/{otra_aula['id']}/alumnos/{alumno_id}").status_code == 404


def _estrellas(c):
    return c.get("/api/juego/estado").json()["estrellas"]


def test_canal_conteo_y_opcion(cliente):
    registrar(cliente)
    r = cliente.post("/api/ejercicios/x1-n01-1/intentos", json={"respuesta": "5"}).json()
    assert r["correcto"] is False and r["diagnostico"]["tipo_error"] == "conteo" and r["diagnostico"]["paso_torcido"] == 2
    assert "respuesta" not in r and "6" not in str(r["diagnostico"])
    assert cliente.post("/api/ejercicios/x1-n01-1/intentos", json={"respuesta": "seis"}).status_code == 422
    r = cliente.post("/api/ejercicios/x1-n01-1/intentos", json={"respuesta": "6"}).json()
    assert r["correcto"] is True and r["recompensa"] == {"ganadas": 2, "bono": 5, "repaso": False, "estrella_cuidado": 1}
    assert r["estado"]["mapa"]["x1"]["nodos"]["x1-n01-2"] == "actual"
    for e in canal.ejercicios()[1:6]:  # hasta la primera pregunta de opción (nivel 3)
        cliente.post(f"/api/ejercicios/{e['id']}/intentos", json={"respuesta": e["respuesta"]})
    r = cliente.post("/api/ejercicios/x1-n03-1/intentos", json={"respuesta": "La azul"}).json()
    assert r["correcto"] is False and r["diagnostico"]["tipo_error"] == "opcion"
    assert cliente.post("/api/ejercicios/x1-n03-1/intentos", json={"respuesta": "  "}).status_code == 422
    assert cliente.post("/api/ejercicios/x1-n03-1/intentos", json={"respuesta": "la ROJA"}).json()["correcto"] is True


def test_canal_suma_y_resta_con_senda(cliente):
    registrar(cliente)
    for e in canal.ejercicios()[:12]:  # niveles 1 a 4
        cliente.post(f"/api/ejercicios/{e['id']}/intentos", json={"respuesta": e["respuesta"]})
    r = cliente.post("/api/ejercicios/x1-n05-1/intentos", json={"respuesta": "8"}).json()  # 4 + 3
    assert r["correcto"] is False and r["diagnostico"]["tipo_error"] == "calculo"
    assert "Cuenta desde 4" in r["diagnostico"]["pregunta"]
    assert cliente.post("/api/ejercicios/x1-n05-1/intentos", json={"respuesta": "7"}).json()["correcto"] is True


def test_reto_validado_en_servidor_con_senda(cliente):
    registrar(cliente)
    _hasta_el_mercado(cliente)
    antes = _estrellas(cliente)
    r = cliente.post("/api/ejercicios/m2-r1/intentos", json={"respuesta": "15"}).json()  # 3 × 12: sumó 3 + 12
    assert r["correcto"] is False
    assert r["diagnostico"]["tipo_error"] == "sumo" and r["diagnostico"]["paso_torcido"] == 2
    assert "respuesta" not in r and "36" not in str(r["diagnostico"])
    r = cliente.post("/api/ejercicios/m2-r1/intentos", json={"respuesta": "$36"}).json()
    assert r["correcto"] is True and r["respuesta"] == "36"
    # Se equivocó antes: 2 estrellas (el bono del día ya se ganó en el canal).
    assert {k:r["recompensa"][k] for k in ("ganadas", "bono", "repaso")} == {"ganadas": 2, "bono": 0, "repaso": False}
    assert r["estado"]["estrellas"] == antes + 2 + r["recompensa"]["estrella_cuidado"]


def test_a_la_primera_da_3_y_repaso_no_da_nada(cliente):
    registrar(cliente)
    _hasta_el_mercado(cliente)
    antes = _estrellas(cliente)
    r = cliente.post("/api/ejercicios/m2-r1/intentos", json={"respuesta": "36"}).json()
    assert r["recompensa"]["ganadas"] == 3
    extra = r["recompensa"]["estrella_cuidado"]
    r = cliente.post("/api/ejercicios/m2-r2/intentos", json={"respuesta": "60", "pistas_usadas": 1}).json()
    assert {k:r["recompensa"][k] for k in ("ganadas", "bono", "repaso")} == {"ganadas": 2, "bono": 0, "repaso": False}
    extra += r["recompensa"]["estrella_cuidado"]
    r = cliente.post("/api/ejercicios/m2-r1/intentos", json={"respuesta": "36"}).json()
    assert r["recompensa"]["repaso"] is True and r["estado"]["estrellas"] == antes + 3 + 2 + extra


def test_no_se_puede_saltar_retos(cliente):
    registrar(cliente)
    assert cliente.post("/api/ejercicios/x1-n01-2/intentos", json={"respuesta": "8"}).status_code == 403
    assert cliente.post("/api/lecciones/x1/cofre").status_code == 409
    assert cliente.post("/api/ejercicios/c2-n01-1/intentos", json={"respuesta": "60"}).status_code == 403  # Mundo 2 cerrado
    _terminar_canal(cliente)
    assert cliente.post("/api/ejercicios/c2-n01-2/intentos", json={"respuesta": "500"}).status_code == 403  # no se salta
    assert cliente.post("/api/ejercicios/m2-r1/intentos", json={"respuesta": "36"}).status_code == 403  # Mundo 3 cerrado
    assert cliente.post("/api/ejercicios/m2-r1/intentos", json={"respuesta": "36"}).status_code == 403
    assert cliente.post("/api/lecciones/m2/cofre").status_code == 409


def _terminar_m2(c):
    for rid, resp in (("m2-r1", "36"), ("m2-r2", "60"), ("m2-r3", "54"), ("m2-r4", "66")):
        assert c.post(f"/api/ejercicios/{rid}/intentos", json={"respuesta": resp}).json()["correcto"]


def test_cofre_del_mercado_da_sticker(cliente):
    registrar(cliente)
    _hasta_el_mercado(cliente)
    assert cliente.post("/api/lecciones/m2/cofre").status_code == 409  # primero sus 4 retos
    _terminar_m2(cliente)
    assert cliente.get("/api/juego/estado").json()["mapa"]["m2"]["cofre"] == "actual"
    r = cliente.post("/api/lecciones/m2/cofre").json()
    assert r["sticker"] == "bufanda" and "m2" in r["estado"]["lecciones_terminadas"]
    assert cliente.post("/api/lecciones/m2/cofre").status_code == 409  # no se abre dos veces


def test_etapa_sube_y_medidores_bajan_al_jugar(cliente):
    registrar(cliente)
    for e in canal.ejercicios()[:4]:
        assert cliente.post(f"/api/ejercicios/{e['id']}/intentos", json={"respuesta": e["respuesta"]}).json()["correcto"]
    est = cliente.get("/api/juego/estado").json()
    assert est["etapa_apoyo"] == 2  # 3 seguidos sin pistas
    assert est["mascota"]["comida"] == 3  # 4 retos -> bajó una marca (cada 3)
    assert est["racha_dias"] == 1 and est["xp"] + 1 == est["estrellas"]


def test_bienvenida_regala_trajes_y_se_puede_vestir(cliente):
    r = registrar(cliente)
    assert r["bienvenida"]["logro"] == "Inicio de la aventura"
    assert [t["id"] for t in r["bienvenida"]["trajes"]] == ["trajinero", "trajinera"]
    est = cliente.get("/api/juego/estado").json()
    assert est["logros"][0] == {"id": "cuenta", "nombre": "Inicio de la aventura", "detalle": "Crea tu cuenta de explorador.", "hecho": True}
    assert est["mascota"]["trajes"] == ["trajinero", "trajinera"] and est["mascota"]["traje"] is None
    assert cliente.put("/api/mascota/traje", json={"traje": "trajinera"}).json()["mascota"]["traje"] == "trajinera"
    assert cliente.put("/api/mascota/traje", json={"traje": "astronauta"}).status_code == 409
    assert cliente.put("/api/mascota/traje", json={"traje": None}).json()["mascota"]["traje"] is None


def test_profesor_no_recibe_trajes(cliente):
    r = registrar(cliente, usuario="profe", rol="profesor")
    assert "bienvenida" not in r
    assert cliente.put("/api/mascota/traje", json={"traje": "trajinero"}).status_code == 403


def test_cuidados_y_estrellas(cliente):
    registrar(cliente)
    assert cliente.post("/api/mascota/cuidar", json={"accion": "jugar"}).status_code == 422
    limpieza = cliente.post("/api/mascota/cuidar", json={"accion": "limpiar"}).json()
    assert limpieza["mascota"]["pecera"] == 5 and limpieza["estrellas"] == 1 and limpieza["xp"] == 0
    cliente.post("/api/ejercicios/x1-n01-1/intentos", json={"respuesta": "6"})
    est = cliente.post("/api/mascota/cuidar", json={"accion": "alimentar"}).json()
    assert est["estrellas"] == 11 and est["xp"] == 8 and est["mascota"]["comida"] == 5
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
    for nombre, respuesta in (("teo", "15"), ("luna", "36")):
        c = nuevo_cliente()
        registrar(c, nombre)
        r = c.post("/api/aulas/unirse", json={"codigo": aula["codigo"].lower().replace("-", "")})
        assert r.status_code == 200 and "codigo" not in r.json()  # el alumno no ve el código ni la lista
        _hasta_el_mercado(c)
        c.post("/api/ejercicios/m2-r1/intentos", json={"respuesta": respuesta})
        alumnos.append(c)
    # Sol se atora al inicio del canal: falla más de la mitad de sus intentos.
    sol = nuevo_cliente()
    registrar(sol, "sol")
    sol.post("/api/aulas/unirse", json={"codigo": aula["codigo"]})
    sol.post("/api/ejercicios/x1-n01-1/intentos", json={"respuesta": "5"})

    panel = cliente.get(f"/api/aulas/{aula['id']}/panel").json()
    assert [a["apodo"] for a in panel["alumnos"]] == ["Luna", "Sol", "Teo"]  # alfabético, nunca por resultado
    assert panel["errores_comunes"][0]["id"] == "sumo"
    assert [a["apodo"] for a in panel["necesitan_apoyo"]] == ["Sol"]
    assert "3 × 12" in panel["que_reforzar"]


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

    r = cliente.post(f"/api/aulas/{aula['id']}/asignaciones", json={"leccion_id": "m2", "fecha_limite": "2026-11-28"})
    assert r.json()["asignaciones"][0]["leccion"] == "El mercado"
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


# ---------------- Módulos, aprobación, curso y diagnóstico ----------------

def test_aula_con_modulos_y_nivel(cliente):
    registrar(cliente, "profe", rol="profesor")
    aula = cliente.post("/api/aulas", json={"nombre": "5.º B", "nivel": "Primaria • 5°", "modulos": ["multiplicacion", "geometria"]}).json()
    assert [m["id"] for m in aula["modulos"]] == ["multiplicacion", "geometria"]
    assert aula["modulos"][1]["proximamente"] is True and aula["nivel"] == "Primaria • 5°"
    r = cliente.patch(f"/api/aulas/{aula['id']}", json={"modulos": ["division", "multiplicacion", "division"]})
    assert [m["id"] for m in r.json()["modulos"]] == ["division", "multiplicacion"]  # sin repetidos, en orden
    assert r.json()["nombre"] == "5.º B"  # editar solo lo que se manda
    assert cliente.patch(f"/api/aulas/{aula['id']}", json={"modulos": ["no-existe"]}).status_code == 422


def test_aprobacion_de_alumnos(cliente, nuevo_cliente):
    registrar(cliente, "profe", rol="profesor")
    aula = cliente.post("/api/aulas", json={"nombre": "5.º B", "requiere_aprobacion": True, "modulos": ["multiplicacion"]}).json()
    teo, sol = nuevo_cliente(), nuevo_cliente()
    teo_id = registrar(teo, "teo")["usuario"]["id"]
    sol_id = registrar(sol, "sol")["usuario"]["id"]
    for c in (teo, sol):
        r = c.post("/api/aulas/unirse", json={"codigo": aula["codigo"]}).json()
        assert r["estado"] == "pendiente" and "modulos" not in r  # aún no ve el contenido del aula
    assert teo.get(f"/api/aulas/{aula['id']}/curso").status_code == 404

    datos = cliente.get(f"/api/aulas/{aula['id']}").json()
    assert [p["apodo"] for p in datos["pendientes"]] == ["Teo", "Sol"] and datos["alumnos"] == []
    assert cliente.get(f"/api/aulas/{aula['id']}/panel").json()["alumnos"] == []  # pendientes no cuentan

    r = cliente.post(f"/api/aulas/{aula['id']}/solicitudes/{teo_id}/aprobar").json()
    assert [a["apodo"] for a in r["alumnos"]] == ["Teo"]
    r = cliente.delete(f"/api/aulas/{aula['id']}/solicitudes/{sol_id}").json()
    assert r["pendientes"] == []
    assert sol.get("/api/aulas").json()["aulas"] == []
    assert teo.get("/api/aulas").json()["aulas"][0]["estado"] == "activo"

    # Sin aprobación: entra directo
    cliente.patch(f"/api/aulas/{aula['id']}", json={"requiere_aprobacion": False})
    assert sol.post("/api/aulas/unirse", json={"codigo": aula["codigo"]}).json()["estado"] == "activo"


def test_curso_del_alumno_con_progreso_del_grupo(cliente, nuevo_cliente):
    registrar(cliente, "profe", rol="profesor")
    aula = cliente.post("/api/aulas", json={"nombre": "5.º B", "modulos": ["multiplicacion", "division"]}).json()
    teo, sol = nuevo_cliente(), nuevo_cliente()
    for c, n in ((teo, "teo"), (sol, "sol")):
        registrar(c, n)
        c.post("/api/aulas/unirse", json={"codigo": aula["codigo"]})
    _hasta_el_mercado(teo)
    teo.post("/api/ejercicios/m2-r1/intentos", json={"respuesta": "36"})
    curso = teo.get(f"/api/aulas/{aula['id']}/curso").json()
    mult = curso["modulos"][0]
    assert curso["companeros"] == 2 and mult["total_retos"] == 4
    assert mult["mis_retos"] == 1 and mult["mi_porcentaje"] == 25
    assert mult["grupo_porcentaje"] == 12  # promedio de 25% y 0%
    assert [l["id"] for l in mult["lecciones"]] == ["m2"]
    assert curso["modulos"][1]["proximamente"] is True
    assert "alumnos" not in curso and "codigo" not in curso  # sin nombres de compañeros


def test_diagnostico_de_entrada(cliente, nuevo_cliente):
    registrar(cliente, "profe", rol="profesor")
    aula = cliente.post("/api/aulas", json={"nombre": "5.º B"}).json()
    alumno = nuevo_cliente()
    registrar(alumno, "teo")
    alumno.post("/api/aulas/unirse", json={"codigo": aula["codigo"]})
    assert alumno.get("/api/juego/estado").json()["diagnostico_hecho"] is False
    preguntas = alumno.get("/api/diagnostico").json()["preguntas"]
    assert len(preguntas) == 8 and all("respuesta" not in p for p in preguntas)

    r = alumno.post("/api/diagnostico", json={"respuestas": {"d1": "85", "d2": " 35 ", "d4": "41", "d8": "1/2", "d7": None}}).json()
    assert r["hecho"] and r["aciertos"] == 3 and r["total"] == 8
    logradas = {h["habilidad"] for h in r["habilidades"] if h["logrado"]}
    assert logradas == {"suma", "resta", "fracciones"}
    assert alumno.get("/api/juego/estado").json()["diagnostico_hecho"] is True

    grupo = cliente.get(f"/api/aulas/{aula['id']}/diagnostico").json()
    assert grupo["hechos"] == 1 and grupo["alumnos"][0]["aciertos"] == 3
    suma = next(h for h in grupo["habilidades"] if h["habilidad"] == "suma")
    assert suma["logrado"] == 1 and suma["de"] == 1
    assert cliente.post("/api/diagnostico", json={"respuestas": {}}).status_code == 403  # solo alumnos


def test_crear_el_estado_dos_veces_a_la_vez_no_choca(cliente, monkeypatch):
    """25 nov: con una cuenta nueva, dos GET /api/juego/estado simultáneos intentaban crear el mismo estado y uno
    respondía 500 (UNIQUE constraint failed: estado_juego.alumno_id). En SQLite, el candado de la ruta
    (bloquear_escritura) los forma en fila; en Postgres no hay candado y lo evita estado_de(). Aquí se fuerza la
    carrera en estado_de(): la segunda sesión "vio" que faltaba la fila antes de que la primera la guardara."""
    from sqlalchemy import func, select
    from app import servicio
    from app.db import get_db
    from app.main import app
    from app.modelos import EstadoJuego, Mascota, Usuario

    registrar(cliente, "gemelo")
    nueva = app.dependency_overrides[get_db]
    s1, s2 = next(nueva()), next(nueva())
    alumno = s1.scalar(select(Usuario).where(Usuario.usuario == "gemelo"))
    assert s1.get(EstadoJuego, alumno.id) is None  # la cuenta todavía no tiene estado

    servicio.estado_de(s1, alumno)
    s1.commit()  # la primera petición ya la creó…
    monkeypatch.setattr(servicio, "_fila_existente", lambda db, modelo, alumno_id: None)  # …la segunda no lo sabía
    est, m = servicio.estado_de(s2, s2.get(Usuario, alumno.id))
    s2.commit()
    assert est is not None and m is not None and est.alumno_id == alumno.id
    for modelo in (EstadoJuego, Mascota):
        assert s1.scalar(select(func.count()).select_from(modelo)) == 1


def test_dos_peticiones_a_la_vez_de_una_cuenta_nueva_responden_bien(cliente):
    import threading
    registrar(cliente, "gemela")
    respuestas = []

    def pedir():
        try:
            respuestas.append(cliente.get("/api/juego/estado").status_code)
        except Exception as e:  # noqa: BLE001  (TestClient propaga el error del servidor)
            respuestas.append(repr(e)[:120])
    hilos = [threading.Thread(target=pedir) for _ in range(2)]
    for h in hilos:
        h.start()
    for h in hilos:
        h.join(timeout=30)
    assert respuestas == [200, 200]


def test_opciones_caben_en_la_respuesta():
    """Reto.jsx manda la respuesta recortada a 60 caracteres (y el servidor acepta 60): ninguna opción puede ser más larga."""
    for mundo in (canal, cdmx, fes, nevado):
        for e in mundo.ejercicios() + mundo.examen():
            for o in e.get("opciones") or []:
                assert len(o) <= 60, (e["id"], o)


def test_fes_respeta_el_programa_de_tercero():
    """3.º: sumas y restas hasta 3 cifras y productos de hasta 3 cifras (las de 4 cifras son de 4.º)."""
    for e in fes.ejercicios() + fes.examen():
        if e["tipo"] == "numerica":
            assert len(str(e["a"])) <= 3 and len(str(e["b"])) <= 3 and len(e["respuesta"]) <= 3, e["id"]
        assert (e.get("visual") or {}).get("tipo") not in ("barras", "rectangulo"), e["id"]  # gráficas de barras y perímetro: 4.º


def test_nevado_cuarto_y_premio_para_tolantongo(cliente):
    registrar(cliente)
    _terminar(cliente, canal, "c2")
    _terminar(cliente, cdmx, "f3")
    _terminar(cliente, fes, "n4")
    est = cliente.get("/api/juego/estado").json()
    assert est["mapa"]["n4"]["nodos"]["n4-n01-1"] == "actual" and est["mapa"]["m2"]["abierta"] is False
    for e in nevado.ejercicios()[:15]:
        assert cliente.post(f"/api/ejercicios/{e['id']}/intentos", json={"respuesta": e["respuesta"]}).json()["correcto"], e["id"]
    # 234 × 12 por productos parciales: si solo hizo 234 × 10 no se le da el resultado.
    r = cliente.post("/api/ejercicios/n4-n06-1/intentos", json={"respuesta": "2340"}).json()
    assert r["correcto"] is False and "2808" not in r["diagnostico"]["pregunta"]
    for e in nevado.ejercicios()[15:]:
        assert cliente.post(f"/api/ejercicios/{e['id']}/intentos", json={"respuesta": e["respuesta"]}).json()["correcto"], e["id"]
    premio = _examen(cliente, nevado)
    est = cliente.get("/api/juego/estado").json()
    assert "esfera" in est["stickers"] and premio == ["tolantongo-short", "tolantongo-completo"]
    assert cliente.put("/api/mascota/traje", json={"traje": premio[1]}).json()["mapa"]["m2"]["abierta"] is True


def test_nevado_respeta_el_programa_de_cuarto():
    """4.º: hasta 5 cifras, multiplicación de 3 × 2 cifras y divisiones exactas en las cuentas."""
    for e in nevado.ejercicios() + nevado.examen():
        if e["tipo"] == "numerica":
            assert len(str(e["a"])) <= 3 and len(str(e["b"])) <= 2 and len(e["respuesta"]) <= 5, e["id"]
        if e["tipo"] == "conteo":
            assert len(e["respuesta"]) <= 5, e["id"]
