from concurrent.futures import ThreadPoolExecutor
from .conftest import registrar
from app.contenido_canal import ejercicios

def ganar_estrellas(cliente):
    e = ejercicios()[0]
    r = cliente.post(f"/api/ejercicios/{e['id']}/intentos", json={"respuesta": e["respuesta"]})
    assert r.status_code == 200 and r.json()["correcto"], r.text
    return r


def test_habitacion_autenticacion_y_aislamiento(cliente, nuevo_cliente):
    assert cliente.get('/api/habitacion').status_code == 401
    registrar(cliente)
    d = cliente.get('/api/habitacion').json()
    assert len(d['catalogo']['stickers']) == 18
    assert set(d['inventario']) == {'cama', 'tapete', 'alga'}
    assert len(d['objetos']) == 3 and d['revision'] == 0
    assert cliente.get('/api/habitacion').headers['cache-control'] == 'no-store'
    otro = nuevo_cliente(); registrar(otro, 'otro')
    assert cliente.put('/api/habitacion', json={'revision':0,'objetos':[]}).json()['revision'] == 1
    assert len(otro.get('/api/habitacion').json()['objetos']) == 3
    profe = nuevo_cliente(); registrar(profe, 'profe', rol='profesor')
    assert profe.get('/api/habitacion').status_code == 403


def test_guardado_y_validacion(cliente):
    registrar(cliente)
    cliente.get('/api/habitacion')
    o = {'stickerId':'cama','x':480,'y':470}
    for objetos in [[{**o,'x':0}], [{**o,'stickerId':'tesoro'}], [o,o], [{**o,'x':480.2}], [{**o,'capa':9}]]:
        assert cliente.put('/api/habitacion', json={'revision':0,'objetos':objetos}).status_code == 422
    r=cliente.put('/api/habitacion', json={'revision':0,'objetos':[o]})
    assert r.status_code == 200, r.text
    assert cliente.get('/api/habitacion').json()['objetos']==[o]
    assert cliente.put('/api/habitacion', json={'revision':0,'objetos':[]}).status_code==409


def test_compra_con_estrellas_reales(cliente):
    registrar(cliente)
    assert cliente.post('/api/habitacion/compras',json={'stickerId':'concha'}).status_code==409
    assert cliente.post('/api/habitacion/compras',json={'stickerId':'tesoro'}).status_code==409
    assert cliente.post('/api/habitacion/compras',json={'stickerId':'falso'}).status_code==404
    r=ganar_estrellas(cliente)
    assert r.status_code == 200
    assert cliente.get('/api/juego/estado').json()['estrellas']==9
    r=cliente.post('/api/habitacion/compras',json={'stickerId':'concha'})
    assert r.status_code==200,r.text
    assert r.json()['estado']['estrellas']==5 and 'concha' in r.json()['inventario']
    assert r.json()['estado']['xp']==8
    assert cliente.post('/api/habitacion/compras',json={'stickerId':'concha'}).json()['estado']['estrellas']==5
    assert cliente.post('/api/habitacion/compras',json={'stickerId':'mesa'}).status_code==409
    assert cliente.get('/api/juego/estado').json()['estrellas']==5


def test_compras_concurrentes(cliente, nuevo_cliente):
    registrar(cliente)
    ganar_estrellas(cliente)
    cliente.get('/api/habitacion')
    a,b=nuevo_cliente(),nuevo_cliente()
    a.cookies.update(cliente.cookies); b.cookies.update(cliente.cookies)
    def compra(args):
        c,s=args;return c.post('/api/habitacion/compras',json={'stickerId':s}).status_code
    with ThreadPoolExecutor(2) as ex:
        assert sorted(ex.map(compra,[(a,'mesa'),(b,'lampara')]))==[200,409]
    assert cliente.get('/api/juego/estado').json()['estrellas'] in (1,2)


def test_minijuego_eliminado(cliente):
    registrar(cliente)
    assert cliente.post('/api/habitacion/burbujas').status_code==404
    assert cliente.post('/api/habitacion/burbujas/golpe',json={}).status_code==404


def test_capas_y_pared(cliente):
    registrar(cliente)
    ganar_estrellas(cliente)
    assert cliente.post('/api/habitacion/compras',json={'stickerId':'cuadro'}).status_code==200
    a={'stickerId':'cama','x':480,'y':470}
    b={'stickerId':'alga','x':500,'y':490}
    c={'stickerId':'cuadro','x':260,'y':208}
    assert cliente.put('/api/habitacion',json={'revision':0,'objetos':[a,b,{**c,'y':600}]}).status_code==422
    assert cliente.put('/api/habitacion',json={'revision':0,'objetos':[b,c,a]}).status_code==200
    assert cliente.get('/api/habitacion').json()['objetos']==[b,c,a]


def test_habitacion_conserva_trajes_y_desbloqueo_de_mundos(cliente):
    from .test_api import _niveles, _examen
    from app import contenido_canal as canal
    registrar(cliente)
    inicial = cliente.get('/api/habitacion').json()
    assert set(inicial['estado']['mascota']['trajes']) >= {'trajinero', 'trajinera'}
    assert cliente.put('/api/mascota/traje', json={'traje':'trajinero'}).status_code == 200
    assert cliente.get('/api/habitacion').json()['estado']['mascota']['traje'] == 'trajinero'
    _niveles(cliente, canal)
    premio = _examen(cliente, canal)
    estado = cliente.put('/api/mascota/traje', json={'traje':premio[0]}).json()
    assert estado['mapa']['c2']['abierta'] is True
    compra = cliente.post('/api/habitacion/compras', json={'stickerId':'concha'}).json()
    assert compra['estado']['mascota']['traje'] == premio[0]
    assert compra['estado']['mapa']['c2']['abierta'] is True
    assert 'concha' in compra['inventario']
    guardado = cliente.put('/api/habitacion', json={'revision':0,'objetos':inicial['objetos']}).json()
    assert guardado['estado']['mascota']['traje'] == premio[0]
    assert guardado['estado']['mapa']['c2']['abierta'] is True


def test_tienda_trajineras_reales(cliente, nuevo_cliente):
    from app.db import get_db
    from app.main import app
    from app.modelos import EstadoJuego
    registrar(cliente)
    inicial = cliente.get('/api/habitacion').json()
    assert len(inicial['trajineras']) == 12
    assert all(t['total'] == 3 and not t['superada'] for t in inicial['trajineras'])
    uid = cliente.get('/api/auth/yo').json()['usuario']['id']
    # Simular saldo y XP elevados sin modificar el progreso real de retos.
    gen = app.dependency_overrides[get_db]()
    db = next(gen)
    try:
        est = db.get(EstadoJuego, uid)
        est.estrellas = 100
        est.xp = 1000
        db.commit()
    finally:
        gen.close()
    def comprar(id):
        return cliente.post('/api/habitacion/compras', json={'stickerId':id})
    r = comprar('anemona')
    assert r.status_code == 409 and 'trajinera 3' in r.json()['error']
    assert cliente.get('/api/juego/estado').json()['estrellas'] == 100
    retos = ejercicios()
    for e in retos[:8]:
        assert cliente.post(f"/api/ejercicios/{e['id']}/intentos",json={'respuesta':e['respuesta']}).json()['correcto']
    parcial = cliente.get('/api/habitacion').json()
    assert parcial['trajineras'][2]['resueltos'] == 2 and not parcial['trajineras'][2]['superada']
    assert comprar('anemona').status_code == 409
    e = retos[8]
    assert cliente.post(f"/api/ejercicios/{e['id']}/intentos",json={'respuesta':e['respuesta']}).json()['correcto']
    antes = cliente.get('/api/habitacion').json()
    assert antes['trajineras'][2]['superada'] and not antes['trajineras'][5]['superada']
    r = comprar('anemona')
    assert r.status_code == 200, r.text
    assert r.json()['estado']['estrellas'] == antes['estado']['estrellas'] - 10
    assert r.json()['estado']['xp'] == antes['estado']['xp']
    assert comprar('anemona').json()['estado']['estrellas'] == r.json()['estado']['estrellas']
    assert comprar('sillon').status_code == 409
    otro = nuevo_cliente(); registrar(otro, 'otro_mapa')
    assert not otro.get('/api/habitacion').json()['trajineras'][2]['superada']


def test_tienda_conserva_inventario_previo(cliente):
    from app.db import get_db
    from app.main import app
    from app.modelos import StickerAdquirido
    registrar(cliente)
    d = cliente.get('/api/habitacion').json()
    uid = cliente.get('/api/auth/yo').json()['usuario']['id']
    gen = app.dependency_overrides[get_db]()
    db = next(gen)
    try:
        db.add(StickerAdquirido(alumno_id=uid,sticker_id='tesoro',precio=25))
        db.commit()
    finally:
        gen.close()
    r = cliente.post('/api/habitacion/compras',json={'stickerId':'tesoro'})
    assert r.status_code == 200 and r.json()['estado']['estrellas'] == 0
    assert not r.json()['trajineras'][11]['superada']
    assert 'tesoro' in r.json()['inventario']
    objetos = d['objetos'] + [{'stickerId':'tesoro','x':480,'y':470}]
    assert cliente.put('/api/habitacion',json={'revision':0,'objetos':objetos}).status_code==200
