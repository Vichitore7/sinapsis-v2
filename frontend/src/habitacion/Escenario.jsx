import { useRef } from 'react';
import { rutaIlustracion } from './tema.js';
import Ajolote from '../componentes/Ajolote.jsx';
import { caja, valido, posicionMascota } from './geometria.js';

export const recurso = (ruta, noche = false) => `${import.meta.env.BASE_URL}habitacion/${rutaIlustracion(ruta, noche)}`;
export default function Escenario({ catalogo, objetos, seleccionado, seleccionar, cambiar, editar, bloqueado, animo, reaccion, avisar, traje, accesorios = [], mundosSuperados = 0, objetivo, dormido = false, brillos = 0, noche = false }) {
  const svg = useRef(null);
  const arrastre = useRef(null);
  const mapa = Object.fromEntries(catalogo.stickers.map(s => [s.id, s]));
  const e = catalogo.escenario;
  const cama = objetos.find(o=>o.stickerId==='cama');
  const pos = posicionMascota(e,cama,mapa.cama,dormido);
  const anchoPet=pos.ancho;
  const punto = ev => {
    const matriz = svg.current?.getScreenCTM();
    if (!matriz) return null;
    const p = svg.current.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    return p.matrixTransform(matriz.inverse());
  };
  function empezar(ev, o) {
    if (!editar || bloqueado || (ev.pointerType === 'mouse' && ev.button !== 0) || arrastre.current) return;
    const p = punto(ev); if (!p) return;
    ev.preventDefault(); ev.stopPropagation(); seleccionar(o.stickerId);
    arrastre.current = { id: ev.pointerId, original: o, dx: p.x - o.x, dy: p.y - o.y, actual: o };
    svg.current.setPointerCapture(ev.pointerId);
  }
  function mover(ev) {
    const a = arrastre.current;
    if (!a || a.id !== ev.pointerId) return;
    const p = punto(ev); if (!p) return;
    const siguiente = { ...a.original, x: Math.round(p.x - a.dx), y: Math.round(p.y - a.dy) };
    if (!valido(siguiente, mapa[siguiente.stickerId], e)) return;
    a.actual = siguiente; cambiar(siguiente);
  }
  function terminar(ev, cancelar = false) {
    const a = arrastre.current; if (!a || a.id !== ev.pointerId) return;
    arrastre.current = null;
    if (cancelar) cambiar(a.original);
    else if (a.actual.x !== a.original.x || a.actual.y !== a.original.y) avisar('¡Me gusta cómo queda!');
    if (svg.current.hasPointerCapture(ev.pointerId)) svg.current.releasePointerCapture(ev.pointerId);
  }
  function dibujar(o) {
    const s = mapa[o.stickerId]; if (!s) return null;
    const b = caja(o, s);
    return <g key={o.stickerId} onPointerDown={ev => empezar(ev, o)} className={editar && !bloqueado ? 'hab-arrastrable' : ''}>
      <image href={recurso(s.imagen, noche)} {...b} draggable="false" />
      {editar && seleccionado === o.stickerId && <g pointerEvents="none"><rect {...b} rx="12" fill="none" stroke="var(--st-tinta)" strokeWidth="3" strokeDasharray="9 6"/><circle cx={o.x} cy={o.y} r="7" fill="var(--st-naranja)" stroke="white" strokeWidth="2"/></g>}
    </g>;
  }
  return <svg ref={svg} className={`hab-escenario ${editar ? 'hab-editar' : ''} ${noche ? 'hab-acuario-noche' : 'hab-acuario-dia'}`} viewBox={`0 0 ${e.ancho} ${e.alto}`} role="img" aria-label="Habitación isométrica del ajolote; usa también los controles de posición del editor" onPointerMove={mover} onPointerUp={ev=>terminar(ev)} onPointerCancel={ev=>terminar(ev,true)} onLostPointerCapture={ev=>terminar(ev,true)}>
    <image href={recurso(e.imagen, noche)} width={e.ancho} height={e.alto} pointerEvents="none"/>
    {editar && seleccionado && mapa[seleccionado] && <polygon points={e[mapa[seleccionado].superficie].map(p=>p.join(',')).join(' ')} fill={noche ? "#80DEC2" : "#FDAB78"} fillOpacity=".18" stroke="var(--st-tinta)" strokeDasharray="10 7" strokeWidth="2" pointerEvents="none"/>}
    {objetos.filter(o=>mapa[o.stickerId]?.superficie !== 'suelo').map(dibujar)}
    {objetos.filter(o=>mapa[o.stickerId]?.superficie === 'suelo').map(dibujar)}
    <g ref={objetivo} pointerEvents="none" aria-label="Ajolote, destino de los cuidados">
        <g transform={`translate(${pos.x-anchoPet/2} ${pos.y-anchoPet*.80})`}>
          <Ajolote estado={(reaccion || animo) === 'dormido' ? 'dormido' : ['hambriento','cansado'].includes(reaccion || animo) ? 'curioso' : 'feliz'} tamano={anchoPet} traje={traje} accesorios={accesorios} mundosSuperados={mundosSuperados} />
        </g>
    </g>
    {brillos>0&&!dormido&&<g key={brillos} pointerEvents="none" className="hab-brillos" transform={`translate(${pos.x} ${pos.y-75})`}>
      {Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return <g key={i} className="hab-destello" style={{'--dx':`${Math.cos(a)*100}px`,'--dy':`${Math.sin(a)*85}px`,animationDelay:`${i%3*60}ms`}}><path d="M0 -13 L4 -4 L13 0 L4 4 L0 13 L-4 4 L-13 0 L-4 -4 Z" fill="#ffffff" stroke="var(--st-naranja)" strokeWidth="2"/></g>;})}
    </g>}
  </svg>;
}
