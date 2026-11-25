import { useEffect, useMemo, useRef, useState } from 'react';
import { useJuego } from '../estado/store.jsx';
import { api } from '../api.js';
import { VALORES } from '../logica/juego.js';
import Escenario, { recurso } from '../habitacion/Escenario.jsx';
import Burbujas from '../habitacion/Burbujas.jsx';
import { centro, moverCapa, valido } from '../habitacion/geometria.js';
import '../habitacion/habitacion.css';

const cuidados = [
  ['alimentar','Alimentar','¡Ñam!','feliz'], ['limpiar','Limpiar','¡Agua limpia!','limpiandose'],
  ['jugar','Jugar','¡Me encanta jugar contigo!','emocionado'], ['descansar','Dormir','Buenas noches.','dormido'],
];
const tabs = [['cuidados','Cuidados'],['decorar','Decorar'],['tienda','Tienda'],['burbujas','Minijuego']];

export default function Habitacion() {
  const { estado, aplicarServidor, actualizar } = useJuego();
  const [datos,setDatos]=useState(null), [objetos,setObjetos]=useState([]), [tab,setTab]=useState('cuidados');
  const [seleccionado,seleccionar]=useState(null), [ocupado,setOcupado]=useState(false), [error,setError]=useState('');
  const [mensaje,setMensaje]=useState(''), [reaccion,setReaccion]=useState(null), [nombre,setNombre]=useState('');
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
  function comprar(s){return operar(async()=>{const d=await api.comprarSticker(s.id);if(!montado.current)return;setDatos(p=>({...p,inventario:d.inventario}));aplicarServidor(d.estado);aviso('¡Nuevo sticker en tu inventario!');});}
  function cuidar(id,m,r){return operar(async()=>{const d=await (id==='despertar'?api.despertar():api.cuidar(id));if(!montado.current)return;aplicarServidor(d);actualizar(s=>({...s,celebrando:false}));aviso(m,r);});}
  if(!datos)return <section className="hab-room hab-panel"><h1>Mi habitación</h1>{error?<><p role="alert">{error}</p><button className="hab-btn" onClick={cargar} disabled={ocupado}>Reintentar</button></>:<p role="status">Cargando la habitación…</p>}</section>;
  const bienestar=estado.bienestar||{};
  const animo=estado.dormido?'dormido':bienestar.comida<=2?'hambriento':bienestar.pecera<=2?'cansado':bienestar.alegria<=2?'cansado':'feliz';
  const activo=objetos.find(o=>o.stickerId===seleccionado);
  return <div className="hab-room">
    <header className="hab-cabecera"><div><p className="hab-eyebrow">MI REFUGIO ACUÁTICO</p><h1>Habitación de {estado.nombreAjolote}</h1><p>Resuelve retos, consigue estrellas y decora tu mundo.</p></div><div className="hab-saldo">★ {estado.estrellas}<small>Nivel {estado.nivel}</small></div></header>
    <div className="hab-medidores">{[['comida','Comida'],['pecera','Pecera'],['alegria','Alegría']].map(([id,t])=><div key={id}><span>{t} · {bienestar[id]??0}/5</span><progress value={bienestar[id]??0} max="5" aria-label={t}/></div>)}</div>
    <div className="hab-layout"><section className="hab-escena-panel"><Escenario catalogo={datos.catalogo} objetos={objetos} seleccionado={seleccionado} seleccionar={seleccionar} cambiar={cambiar} editar={tab==='decorar'} bloqueado={ocupado} animo={animo} reaccion={estado.dormido?'dormido':reaccion} avisar={aviso}/><p className="hab-bocadillo" role="status">{mensaje||'¡Hola! Este es nuestro pequeño refugio.'}</p>
      <div className="hab-guardado"><span role="status">{sucio?'Cambios sin guardar':'Habitación guardada'}</span><button className="hab-btn" onClick={guardar} disabled={!sucio||ocupado}>Guardar</button><button className="hab-btn secundario" disabled={ocupado} onClick={()=>{if(!sucio||window.confirm('¿Descartar los cambios locales?'))cargar();}}>Recargar</button></div></section>
      <section className="hab-panel hab-controles"><nav aria-label="Opciones de habitación" className="hab-tabs">{tabs.map(([id,t])=><button key={id} aria-pressed={tab===id} disabled={ocupado} onClick={()=>setTab(id)}>{t}</button>)}</nav>
        {error&&<p className="hab-error" role="alert">{error}</p>}
        {tab==='cuidados'&&<><h2>Cuida a tu ajolote</h2><form className="hab-nombre" onSubmit={e=>{e.preventDefault();operar(async()=>{const d=await api.renombrarMascota(nombre.trim());if(montado.current){aplicarServidor(d);aviso('¡Me gusta mi nombre!');}});}}><label>Nombre <input value={nombre} onChange={e=>setNombre(e.target.value)} maxLength={20} required/></label><button className="hab-btn secundario" disabled={ocupado||!nombre.trim()||nombre.trim()===estado.nombreAjolote}>Cambiar</button></form><div className="hab-cuidados">{cuidados.map(([id,t,m,r])=>{const dormir=id==='descansar'&&estado.dormido;const precio=VALORES.costos[id];return <button key={id} className="hab-btn secundario" disabled={ocupado||estado.estrellas<precio} onClick={()=>cuidar(dormir?'despertar':id,dormir?'¡Buenos días!':m,dormir?'feliz':r)}><img src={recurso(`iconos/${id==='descansar'?'dormir':id}.svg`)} alt="" onError={e=>{e.currentTarget.hidden=true;}}/>{dormir?'Despertar':t}<small>{precio?`★ ${precio}`:'Gratis'}</small></button>;})}</div><p>Los medidores solo bajan al resolver retos, nunca por dejar de entrar. Jugar al minijuego es gratis.</p><p>Los accesorios de cofres se conservan en Inicio y Logros.</p></>}
        {tab==='decorar'&&<><h2>Tu colección</h2><p>Selecciona un sticker para colocarlo. Arrástralo dentro de su superficie o utiliza las flechas. Guarda al terminar.</p><div className="hab-catalogo">{datos.catalogo.stickers.filter(s=>datos.inventario.includes(s.id)).map(s=><button className="hab-item" key={s.id} disabled={ocupado} aria-pressed={seleccionado===s.id} onClick={()=>agregar(s)}><img src={recurso(s.imagen)} alt=""/><strong>{s.nombre}</strong><small>{objetos.some(o=>o.stickerId===s.id)?'Colocado':'Colocar'}</small></button>)}</div>{activo&&<div className="hab-edicion"><h3>{mapa[activo.stickerId].nombre}</h3><div className="hab-flechas">{[[0,-12,'↑','Arriba'],[-12,0,'←','Izquierda'],[12,0,'→','Derecha'],[0,12,'↓','Abajo']].map(([x,y,t,l])=><button key={l} aria-label={l} disabled={ocupado} onClick={()=>desplazar(x,y)}>{t}</button>)}</div><div className="hab-acciones"><button className="hab-btn secundario" disabled={ocupado} onClick={()=>setObjetos(p=>moverCapa(p,seleccionado,1,mapa))}>Traer delante</button><button className="hab-btn secundario" disabled={ocupado} onClick={()=>setObjetos(p=>moverCapa(p,seleccionado,-1,mapa))}>Enviar detrás</button><button className="hab-btn secundario" disabled={ocupado} onClick={()=>{setObjetos(p=>p.filter(o=>o.stickerId!==seleccionado));seleccionar(null);}}>Retirar</button></div></div>}</>}
        {tab==='tienda'&&<><h2>Tienda de stickers</h2><p>Desbloquea decoraciones con tu nivel de matemáticas. Las estrellas se comparten con los cuidados.</p><div className="hab-catalogo">{datos.catalogo.stickers.map(s=>{const propio=datos.inventario.includes(s.id),cerrado=estado.nivel<s.nivel;return <article className="hab-item" key={s.id}><img src={recurso(s.imagen)} alt=""/><strong>{s.nombre}</strong><small>Nivel {s.nivel}</small><button className="hab-btn" disabled={ocupado||propio||cerrado||estado.estrellas<s.precio} onClick={()=>comprar(s)}>{propio?'Adquirido':cerrado?'Bloqueado':`★ ${s.precio}`}</button></article>;})}</div></>}
        {tab==='burbujas'&&<Burbujas aplicarServidor={aplicarServidor} avisar={aviso}/>}
      </section></div>
    <details className="hab-panel"><summary>¿Cómo gano estrellas?</summary><p>Resuelve un reto a la primera: 3 estrellas. Con ayuda: 2. Bono diario: 5. Cofre de mundo: 10. Los minijuegos no dan estrellas.</p></details>
  </div>;
}
