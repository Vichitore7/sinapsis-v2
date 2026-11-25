import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { recurso } from './Escenario.jsx';

export const segundosRestantes = (plazo, ahora) => Math.max(0, Math.ceil(((plazo || 0)-ahora)/1000));
export function dentroMascota(x,y,rect) {
  return !!rect && x>=rect.left && x<=rect.right && y>=rect.top && y<=rect.bottom;
}
const formato = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

export default function Cuidados({objetivo, ocupado, dormido, plazos={}, hayCama, cuidar, sucio}) {
  const [ahora,setAhora]=useState(()=>performance.now());
  const [fantasma,setFantasma]=useState(null);
  const arrastre=useRef(null);
  useEffect(()=>{const t=setInterval(()=>setAhora(performance.now()),250);return()=>clearInterval(t);},[]);
  const restante=id=>segundosRestantes(plazos[id],ahora);
  function iniciar(e,id){
    if(ocupado||dormido||restante(id)||arrastre.current||(e.pointerType==='mouse'&&e.button!==0))return;
    e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current={id,pointer:e.pointerId};setFantasma({id,x:e.clientX,y:e.clientY});
  }
  function mover(e){const a=arrastre.current;if(a?.pointer===e.pointerId)setFantasma({id:a.id,x:e.clientX,y:e.clientY});}
  function terminar(e,cancelar=false){
    const a=arrastre.current;if(a?.pointer!==e.pointerId)return;
    arrastre.current=null;setFantasma(null);
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
    if(!cancelar&&dentroMascota(e.clientX,e.clientY,objetivo.current?.getBoundingClientRect()))cuidar(a.id);
  }
  function objeto(id,t){const s=restante(id);return <button type="button" className="hab-btn secundario hab-objeto-cuidado" disabled={ocupado||dormido||s>0} onPointerDown={e=>iniciar(e,id)} onPointerMove={mover} onPointerUp={terminar} onPointerCancel={e=>terminar(e,true)} onLostPointerCapture={e=>terminar(e,true)} onClick={e=>{if(e.detail===0)cuidar(id);}} aria-label={`${t}: arrastra al ajolote o activa con el teclado`}><img src={recurso(`iconos/${id}.svg`)} alt="" draggable="false"/>{t}<small>{s?`Disponible en ${formato(s)}`:'Arrastra al ajolote'}</small></button>;}
  const s=restante('descansar');
  return <div className="hab-cuidados hab-cuidados-escena">
    {objeto('alimentar','Alimentar')}{objeto('limpiar','Limpiar')}
    <a className="hab-btn secundario hab-jugar" href="#/mapa"><img src={recurso('iconos/jugar.svg')} alt=""/>Jugar<small>Ir al mapa</small></a>
    <button type="button" className="hab-btn secundario" disabled={ocupado||dormido||s>0||!hayCama} onClick={()=>cuidar('descansar')}><img src={recurso('iconos/dormir.svg')} alt=""/>Dormir<small>{!hayCama?'Coloca la cama':s?`Disponible en ${formato(s)}`:sucio?'Guardar y dormir':'Gratis'}</small></button>
    {fantasma&&createPortal(<img aria-hidden="true" className="hab-fantasma" src={recurso(`iconos/${fantasma.id}.svg`)} style={{left:fantasma.x,top:fantasma.y}} alt=""/>,document.body)}
  </div>;
}
