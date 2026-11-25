from concurrent.futures import ThreadPoolExecutor
from .conftest import registrar


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
    r=cliente.post('/api/ejercicios/m1-r1/intentos',json={'respuesta':'18'})
    assert r.status_code == 200
    assert cliente.get('/api/juego/estado').json()['estrellas']==8
    r=cliente.post('/api/habitacion/compras',json={'stickerId':'concha'})
    assert r.status_code==200,r.text
    assert r.json()['estado']['estrellas']==4 and 'concha' in r.json()['inventario']
    assert r.json()['estado']['xp']==8
    assert cliente.post('/api/habitacion/compras',json={'stickerId':'concha'}).json()['estado']['estrellas']==4
    assert cliente.post('/api/habitacion/compras',json={'stickerId':'mesa'}).status_code==409
    assert cliente.get('/api/juego/estado').json()['estrellas']==4


def test_compras_concurrentes(cliente, nuevo_cliente):
    registrar(cliente)
    cliente.post('/api/ejercicios/m1-r1/intentos',json={'respuesta':'18'})
    cliente.get('/api/habitacion')
    a,b=nuevo_cliente(),nuevo_cliente()
    a.cookies.update(cliente.cookies); b.cookies.update(cliente.cookies)
    def compra(args):
        c,s=args;return c.post('/api/habitacion/compras',json={'stickerId':s}).status_code
    with ThreadPoolExecutor(2) as ex:
        assert sorted(ex.map(compra,[(a,'mesa'),(b,'lampara')]))==[200,409]
    assert cliente.get('/api/juego/estado').json()['estrellas'] in (0,1)


def test_burbujas(cliente,nuevo_cliente):
    registrar(cliente)
    p=cliente.post('/api/habitacion/burbujas').json()
    otro=nuevo_cliente();registrar(otro,'otro')
    assert otro.post('/api/habitacion/burbujas/golpe',json={'partidaId':p['partidaId'],'paso':0,'celda':p['objetivo']}).status_code==409
    err=cliente.post('/api/habitacion/burbujas/golpe',json={'partidaId':p['partidaId'],'paso':0,'celda':(p['objetivo']+1)%9}).json()
    assert err['aciertos']==0
    for i in range(6):
        payload={'partidaId':p['partidaId'],'paso':i,'celda':p['objetivo']}
        r=cliente.post('/api/habitacion/burbujas/golpe',json=payload)
        assert r.status_code==200,r.text
        p=r.json(); assert p['aciertos']==i+1
    assert p['finalizada'] and p['estado']['mascota']['alegria']==5 and p['estado']['estrellas']==0
    assert cliente.post('/api/habitacion/burbujas/golpe',json=payload).json()['estado']['mascota']['alegria']==5


def test_capas_y_pared(cliente):
    registrar(cliente)
    cliente.post('/api/ejercicios/m1-r1/intentos',json={'respuesta':'18'})
    assert cliente.post('/api/habitacion/compras',json={'stickerId':'cuadro'}).status_code==200
    a={'stickerId':'cama','x':480,'y':470}
    b={'stickerId':'alga','x':500,'y':490}
    c={'stickerId':'cuadro','x':260,'y':208}
    assert cliente.put('/api/habitacion',json={'revision':0,'objetos':[a,b,{**c,'y':600}]}).status_code==422
    assert cliente.put('/api/habitacion',json={'revision':0,'objetos':[b,c,a]}).status_code==200
    assert cliente.get('/api/habitacion').json()['objetos']==[b,c,a]
