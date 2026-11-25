from concurrent.futures import ThreadPoolExecutor
from app import servicio
from app.db import get_db
from app.main import app
from app.modelos import Mascota
from app.contenido_canal import ejercicios
from .conftest import registrar


def reloj(monkeypatch):
    ahora = [1_800_000_000.0]
    monkeypatch.setattr(servicio, 'time', lambda: ahora[0])
    return ahora


def cuidar(c, accion):
    return c.post('/api/mascota/cuidar', json={'accion': accion})


def modificar_medidores(c, **valores):
    uid = c.get('/api/auth/yo').json()['usuario']['id']
    gen = app.dependency_overrides[get_db]()
    db = next(gen)
    try:
        m = db.get(Mascota, uid)
        for k, v in valores.items():
            setattr(m, k, v)
        db.commit()
    finally:
        gen.close()


def test_incremento_y_cooldown_persistente(cliente, nuevo_cliente, monkeypatch):
    t = reloj(monkeypatch)
    registrar(cliente)
    modificar_medidores(cliente, comida=1, pecera=3)
    r=cuidar(cliente,'alimentar').json()
    assert r['mascota']['comida']==3 and r['estrellas']==r['xp']==0
    assert r['mascota']['cuidados_restantes']=={'alimentar':180,'limpiar':0,'descansar':0}
    otro=nuevo_cliente();otro.cookies.update(cliente.cookies)
    assert cuidar(otro,'alimentar').status_code==409
    r=cuidar(otro,'limpiar').json()
    assert r['mascota']['pecera']==5 and r['estrellas']==1 and r['xp']==0
    t[0]+=179
    assert cliente.get('/api/juego/estado').json()['mascota']['cuidados_restantes']['alimentar']==1
    assert cuidar(cliente,'alimentar').status_code==409
    t[0]+=1
    r=cuidar(otro,'alimentar').json()
    assert r['mascota']['comida']==5 and r['estrellas']==2 and r['xp']==0
    t[0]+=180
    r=cuidar(cliente,'alimentar').json()
    assert r['estrellas']==2 and r['mascota']['comida']==5
    assert cuidar(cliente,'alimentar').status_code==409


def test_cuidado_concurrente_no_duplica_premio(cliente,nuevo_cliente,monkeypatch):
    reloj(monkeypatch); registrar(cliente)
    a,b=nuevo_cliente(),nuevo_cliente()
    a.cookies.update(cliente.cookies); b.cookies.update(cliente.cookies)
    with ThreadPoolExecutor(2) as ex:
        assert sorted(ex.map(lambda c:cuidar(c,'limpiar').status_code,[a,b]))==[200,409]
    r=cliente.get('/api/juego/estado').json()
    assert r['estrellas']==1 and r['xp']==0 and r['mascota']['pecera']==5


def test_dormir_cama_despertar_y_cooldown(cliente,monkeypatch):
    t=reloj(monkeypatch);registrar(cliente)
    inicial=cliente.get('/api/habitacion').json()
    assert cliente.put('/api/habitacion',json={'revision':0,'objetos':[]}).status_code==200
    assert cuidar(cliente,'descansar').status_code==409
    assert cliente.get('/api/juego/estado').json()['mascota']['cuidados_restantes']['descansar']==0
    cama={'stickerId':'cama','x':480,'y':470}
    assert cliente.put('/api/habitacion',json={'revision':1,'objetos':[cama]}).status_code==200
    r=cuidar(cliente,'descansar').json()
    assert r['mascota']['dormido'] and r['mascota']['cuidados_restantes']['descansar']==180
    assert r['estrellas']==r['xp']==0
    assert cuidar(cliente,'alimentar').status_code==409
    assert cliente.get('/api/habitacion').json()['estado']['mascota']['dormido']
    r=cliente.post('/api/mascota/despertar').json()
    assert not r['mascota']['dormido'] and r['mascota']['cuidados_restantes']['descansar']==180
    assert cuidar(cliente,'descansar').status_code==409
    assert cuidar(cliente,'alimentar').status_code==200
    t[0]+=180
    assert cuidar(cliente,'descansar').json()['mascota']['dormido']
    assert not cliente.put('/api/habitacion',json={'revision':2,'objetos':[]}).json()['estado']['mascota']['dormido']


def test_alegria_por_retos_desgaste_y_sin_xp_extra(cliente):
    registrar(cliente)
    def responder(e):
        return cliente.post(f"/api/ejercicios/{e['id']}/intentos",json={'respuesta':e['respuesta']}).json()
    retos=ejercicios()
    r=responder(retos[0]); assert r['estado']['mascota']['alegria']==5
    assert r['estado']['estrellas']==9 and r['estado']['xp']==8
    assert responder(retos[0])['estado']['estrellas']==9
    for e in retos[1:9]: r=responder(e)
    assert r['estado']['mascota']['alegria']==4  # desgaste rotatorio original
    assert responder(retos[8])['estado']['mascota']['alegria']==4
    r=responder(retos[9]); assert r['estado']['mascota']['alegria']==5
    assert r['recompensa']['estrella_cuidado']==1
    assert r['estado']['estrellas']==r['estado']['xp']+2
