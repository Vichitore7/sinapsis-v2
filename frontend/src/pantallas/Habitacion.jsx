import { useEffect, useMemo, useRef, useState } from 'react';
import { useJuego } from '../estado/store.jsx';
import { api } from '../api.js';
import { SeccionStickers } from './Logros.jsx';
import { createPortal } from 'react-dom';
import I from '../componentes/IconosUI.jsx';
import Cuidados from '../habitacion/Cuidados.jsx';
import Tienda from '../habitacion/Tienda.jsx';
import Escenario, { recurso } from '../habitacion/Escenario.jsx';
import { useNocheHabitacion } from '../habitacion/tema.js';
import { centro, moverCapa, valido } from '../habitacion/geometria.js';
import '../habitacion/habitacion.css';

const tabs = [['cuidados','Cuidados'],['decorar','Decorar'],['tienda','Tienda'],['trajes','Trajes']];
const Estrella = () => <I n="estrella" tamano={20} className="texto-selva hab-estrella"/>;
const medidores = [
  ['comida','Comida','Completa la barra alimentando al ajolote.'],
  ['pecera','Pecera','Mantén limpia su pecera para que esté feliz.'],
  ['alegria','Alegría','Mejora resolviendo retos en las trajineras.'],
];

export default function Habitacion() {
  const { estado, mundos, aplicarServidor, actualizar, tema } = useJuego();
  const noche = useNocheHabitacion(tema);
  const [datos,setDatos]=useState(null), [objetos,setObjetos]=useState([]), [tab,setTab]=useState('cuidados');
  const [seleccionado,seleccionar]=useState(null), [ocupado,setOcupado]=useState(false), [error,setError]=useState('');
  const [mensaje,setMensaje]=useState(''), [reaccion,setReaccion]=useState(null), [nombre,setNombre]=useState('');
  const [brillos,setBrillos]=useState(0);
  const objetivo=useRef(null);
  const bloqueo=useRef(false), temporizador=useRef(null), montado=useRef(false);
  const sucio=!!datos && JSON.stringify(objetos)!==JSON.stringify(datos.objetos);
  const mapa=useMemo(()=>Object.fromEntries((datos?.catalogo.stickers||[]).map(s=>[s.id,s])),[datos?.catalogo]);
  const aviso=(m,r='emocionado')=>{setMensaje(m);setReaccion(r);clearTimeout(temporizador.current);temporizador.current=setTimeout(()=>setReaccion(null),2200);};
  async function operar(fn){
    if(bloqueo.current)return; bloqueo.current=true;setOcupado(true);setError('');
    try{await fn();}catch(e){if(montado.current)setError(e.message);}finally{bloqueo.current=false;if(montado.current)setOcupado(false);}
  }
  async function cargar(){ await operar(async()=>{const d=await api.habitacion();if(!montado.current)return;setDatos(d);setObjetos(d.objetos);setNombre(d.estado.mascota.nombre);seleccionar(null);aplicarServidor(d.estado);}); }
  useEffect(()=>{montado.current=true;cargar();return()=>{montado.current=false;clearTimeout(temporizador.current);};},[]);
  useEffect(()=>{
    if(!sucio)return;
    const salir=e=>{e.preventDefault();e.returnValue='';};
    const enlace=e=>{const a=e.target.closest?.('a[href^="#/"]');if(a && a.getAttribute('href')!== '#/habitacion' && !window.confirm('Hay cambios de decoración sin guardar. ¿Salir?')){e.preventDefault();e.stopPropagation();}};
    window.addEventListener('beforeunload',salir);document.addEventListener('click',enlace,true);
    return()=>{window.removeEventListener('beforeunload',salir);document.removeEventListener('click',enlace,true);};
  },[sucio]);
  const cambiar=o=>setObjetos(prev=>prev.map(x=>x.stickerId===o.stickerId?o:x));
  function agregar(s){
    if(objetos.some(o=>o.stickerId===s.id)){seleccionar(s.id);return;}
    const p=centro(datos.catalogo.escenario[s.superficie]);
    setObjetos(prev=>[...prev,{stickerId:s.id,...p}]);seleccionar(s.id);aviso('¡Una decoración nueva!');
  }
  function desplazar(dx,dy){const o=objetos.find(x=>x.stickerId===seleccionado);if(!o)return;const nuevo={...o,x:o.x+dx,y:o.y+dy};if(valido(nuevo,mapa[o.stickerId],datos.catalogo.escenario))cambiar(nuevo);}
  function guardar(){return operar(async()=>{const d=await api.guardarHabitacion({objetos,revision:datos.revision});if(!montado.current)return;setDatos(p=>({...p,...d}));setObjetos(d.objetos);aplicarServidor(d.estado);aviso('Habitación guardada.');});}
  function comprar(s){return operar(async()=>{const d=await api.comprarSticker(s.id);if(!montado.current)return;setDatos(p=>({...p,inventario:d.inventario,trajineras:d.trajineras}));aplicarServidor(d.estado);aviso('¡Nuevo sticker en tu inventario!');});}
  function cuidar(id){return operar(async()=>{
    if(id==='descansar' && sucio){
      const h=await api.guardarHabitacion({objetos,revision:datos.revision});
      if(!montado.current)return;
      setDatos(p=>({...p,...h}));setObjetos(h.objetos);aplicarServidor(h.estado);
    }
    let d;
    try { d=await (id==='despertar'?api.despertar():api.cuidar(id)); }
    catch(e){ if(e.estado===409){const actual=await api.estado();if(montado.current)aplicarServidor(actual);}throw e; }
    if(!montado.current)return;
    aplicarServidor(d);actualizar(s=>({...s,celebrando:false}));
    if(id==='alimentar'||id==='limpiar'){
      setBrillos(n=>n+1);setReaccion(null);
      setMensaje((id==='alimentar'?'¡Ñam!':'¡Agua limpia!')+(d.estrellas>estado.estrellas?' ¡Ganaste una estrella!':''));
    }else{if(id==='descansar')objetivo.current?.ownerSVGElement?.scrollIntoView({block:'center',behavior:'instant'});setReaccion(null);setMensaje(id==='descansar'?'Buenas noches…':'¡Buenos días!');}
  });}
  if(!datos)return <section className="hab-room hab-panel"><h1>Mi habitación</h1>{error?<><p role="alert">{error}</p><button className="hab-btn" onClick={cargar} disabled={ocupado}>Reintentar</button></>:<p role="status">Cargando la habitación…</p>}</section>;
  const bienestar=estado.bienestar||{};
  const superadas = datos.trajineras.filter(t=>t.superada).length;
  const animo=estado.dormido?'dormido':bienestar.comida<=2?'hambriento':bienestar.pecera<=2?'cansado':bienestar.alegria<=2?'cansado':'feliz';
  const activo=objetos.find(o=>o.stickerId===seleccionado);
  return <div className="hab-room">
    <header className="hab-cabecera hab-panel">
      <div className="hab-cabecera-texto">
        <p className="hab-eyebrow">HABITACIÓN · ACUARIO</p>
        <h1>Habitación de {estado.nombreAjolote}</h1>
        <p>Un refugio acuático para cuidar a tu ajolote y decorarlo con las estrellas que ganas en las trajineras.</p>
        <div className="hab-cabecera-chips">
          <span className="hab-chip"><I n="mapa" tamano={16}/> {superadas}/{datos.trajineras.length} trajineras</span>
          <span className="hab-chip"><I n="estrella" tamano={16} className="texto-selva"/> Tienda por mapas</span>
        </div>
      </div>
      <div className="hab-saldo" aria-label="Tu saldo de estrellas"><span><Estrella/> {estado.estrellas}</span><small>Estrellas disponibles para decorar</small></div>
    </header>

    <div className="hab-medidores">{medidores.map(([id,t,ayuda])=><article className="hab-medidor-card" key={id}><span className="hab-medidor-titulo">{t}</span><strong className="hab-medidor-numero">{bienestar[id]??0}/5</strong><progress value={bienestar[id]??0} max="5" aria-label={t}/><small>{ayuda}</small></article>)}</div>

    <div className="hab-layout">
      <section className="hab-escena-panel hab-panel">
        <div className="hab-escena-cromo">
          <span className="hab-chip hab-chip-suave">{noche ? 'Acuario nocturno' : 'Acuario de día'}</span>
          {tab==='decorar' && <span className="hab-chip hab-chip-activo">Modo decoración</span>}
        </div>
        <Escenario noche={noche} catalogo={datos.catalogo} objetos={objetos} seleccionado={seleccionado} seleccionar={seleccionar} cambiar={cambiar} editar={tab==='decorar'} bloqueado={ocupado} objetivo={objetivo} dormido={estado.dormido} brillos={brillos} animo={animo} reaccion={estado.dormido?'dormido':reaccion} avisar={aviso} traje={estado.traje} accesorios={estado.stickers} mundosSuperados={estado.mundosTerminados.length}/>
        {tab==='cuidados'&&<Cuidados objetivo={objetivo} ocupado={ocupado} dormido={estado.dormido} plazos={estado.cuidadosHasta} hayCama={objetos.some(o=>o.stickerId==='cama')} cuidar={cuidar} sucio={sucio}/>}
        {error&&<p className="hab-error" role="alert">{error}</p>}
        <p className="hab-bocadillo" role="status">{mensaje||'¡Hola! Este es nuestro pequeño refugio.'}</p>
        <div className="hab-guardado"><span role="status">{sucio?'Cambios sin guardar':'Habitación guardada'}</span><div className="hab-guardado-botones"><button className="hab-btn" onClick={guardar} disabled={!sucio||ocupado}>Guardar</button><button className="hab-btn secundario" disabled={ocupado} onClick={()=>{if(!sucio||window.confirm('¿Descartar los cambios locales?'))cargar();}}>Recargar</button></div></div>
      </section>

      <section className="hab-panel hab-controles">
        <nav aria-label="Opciones de habitación" className="hab-tabs">{tabs.map(([id,t])=><button key={id} aria-pressed={tab===id} disabled={ocupado} onClick={()=>setTab(id)}>{t}</button>)}</nav>

        {tab==='cuidados'&&<div className="hab-seccion"><div className="hab-seccion-head"><h2>Cuida a tu ajolote</h2><span className="hab-seccion-badge">Cuidados gratis</span></div><form className="hab-nombre" onSubmit={e=>{e.preventDefault();operar(async()=>{const d=await api.renombrarMascota(nombre.trim());if(montado.current){aplicarServidor(d);aviso('¡Me gusta mi nombre!');}});}}><label>Nombre <input value={nombre} onChange={e=>setNombre(e.target.value)} maxLength={20} required/></label><button className="hab-btn secundario" disabled={ocupado||!nombre.trim()||nombre.trim()===estado.nombreAjolote}>Cambiar</button></form><p>Arrastra el alimento o la esponja hasta el ajolote. Cada cuidado es gratis y se recarga en 3 minutos. Al llenar una barra ganas una estrella verde.</p><p>Los medidores solo bajan al resolver retos. Jugar te lleva al mapa de trajineras.</p><p>Los accesorios y trajes de cofres se conservan. Puedes vestir a tu ajolote en Trajes o Perfil.</p></div>}

        {tab==='decorar'&&<div className="hab-seccion"><div className="hab-seccion-head"><h2>Tu colección</h2><span className="hab-seccion-badge">{datos.inventario.length} stickers</span></div><p>Selecciona un sticker para colocarlo. Arrástralo dentro de su superficie o utiliza las flechas. También puedes cambiar su capa para ordenar la escena.</p><div className="hab-catalogo">{datos.catalogo.stickers.filter(s=>datos.inventario.includes(s.id)).map(s=><button className="hab-item" key={s.id} disabled={ocupado} aria-pressed={seleccionado===s.id} onClick={()=>agregar(s)}><img src={recurso(s.imagen, noche)} alt=""/><strong>{s.nombre}</strong><small>{objetos.some(o=>o.stickerId===s.id)?'Colocado':'Colocar'}</small></button>)}</div>{activo&&<div className="hab-edicion"><div className="hab-seccion-head"><h3>{mapa[activo.stickerId].nombre}</h3><span className="hab-seccion-badge">Editar capa</span></div><div className="hab-flechas">{[[0,-12,'↑','Arriba'],[-12,0,'←','Izquierda'],[12,0,'→','Derecha'],[0,12,'↓','Abajo']].map(([x,y,t,l])=><button key={l} aria-label={l} disabled={ocupado} onClick={()=>desplazar(x,y)}>{t}</button>)}</div><div className="hab-acciones"><button className="hab-btn secundario" disabled={ocupado} onClick={()=>setObjetos(p=>moverCapa(p,seleccionado,1,mapa))}>Traer delante</button><button className="hab-btn secundario" disabled={ocupado} onClick={()=>setObjetos(p=>moverCapa(p,seleccionado,-1,mapa))}>Enviar detrás</button><button className="hab-btn secundario" disabled={ocupado} onClick={()=>{setObjetos(p=>p.filter(o=>o.stickerId!==seleccionado));seleccionar(null);}}>Retirar</button></div></div>}</div>}

        {tab==='tienda'&&<div className="hab-seccion"><Tienda noche={noche} catalogo={datos.catalogo} inventario={datos.inventario} trajineras={datos.trajineras} saldo={estado.estrellas} ocupado={ocupado} comprar={comprar}/></div>}
        {tab==='trajes'&&<div className="hab-seccion"><div className="hab-seccion-head"><h2>Trajes y accesorios</h2><span className="hab-seccion-badge">Sin cambios</span></div><p>Equipa los trajes que ganas en los exámenes para abrir nuevos mundos.</p><a href="#/perfil/stickers" className="hab-enlace">Abrir el armario completo en Perfil</a><SeccionStickers estado={estado} mundos={mundos}/></div>}
      </section>
    </div>
    {estado.dormido&&createPortal(<button type="button" className="hab-noche" aria-label="Despertar al ajolote" onClick={()=>cuidar('despertar')} disabled={ocupado}><span>{ocupado?'Despertando…':error?error+' · Toca para reintentar':'Toca cualquier parte para despertar al ajolote'}</span></button>,document.body)}
    <details className="hab-panel hab-ayuda"><summary>¿Cómo gano estrellas?</summary><p>Resuelve un reto a la primera: 3 estrellas. Con ayuda: 2. Bono diario: 5. Cofre de mapa: 10. Al llenar una barra de cuidado ganas una estrella adicional, sin experiencia.</p></details>
  </div>;
}
