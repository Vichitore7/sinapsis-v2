import { useRef } from 'react';
import { caja, valido } from './geometria.js';

export const recurso = ruta => `${import.meta.env.BASE_URL}habitacion/${ruta}`;
export default function Escenario({ catalogo, objetos, seleccionado, seleccionar, cambiar, editar, bloqueado, animo, reaccion, avisar }) {
  const svg = useRef(null);
  const arrastre = useRef(null);
  const mapa = Object.fromEntries(catalogo.stickers.map(s => [s.id, s]));
  const e = catalogo.escenario;
  const pet = catalogo.mascota[reaccion || animo] || catalogo.mascota.feliz;
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
      <image href={recurso(s.imagen)} {...b} draggable="false" />
      {editar && seleccionado === o.stickerId && <g pointerEvents="none"><rect {...b} rx="12" fill="none" stroke="#572F48" strokeWidth="3" strokeDasharray="9 6"/><circle cx={o.x} cy={o.y} r="7" fill="#CF4A4D" stroke="white" strokeWidth="2"/></g>}
    </g>;
  }
  return <svg ref={svg} className={`hab-escenario ${editar ? 'hab-editar' : ''}`} viewBox={`0 0 ${e.ancho} ${e.alto}`} role="img" aria-label="Habitación isométrica del ajolote; usa también los controles de posición del editor" onPointerMove={mover} onPointerUp={ev=>terminar(ev)} onPointerCancel={ev=>terminar(ev,true)} onLostPointerCapture={ev=>terminar(ev,true)}>
    <image href={recurso(e.imagen)} width={e.ancho} height={e.alto} pointerEvents="none"/>
    {editar && seleccionado && mapa[seleccionado] && <polygon points={e[mapa[seleccionado].superficie].map(p=>p.join(',')).join(' ')} fill="#FFA67A" fillOpacity=".12" stroke="#572F48" strokeDasharray="10 7" strokeWidth="2" pointerEvents="none"/>}
    {objetos.filter(o=>mapa[o.stickerId]?.superficie !== 'suelo').map(dibujar)}
    {objetos.filter(o=>mapa[o.stickerId]?.superficie === 'suelo').map(dibujar)}
    <image href={recurso(pet.imagen)} {...caja({x:470,y:610},pet,170)} pointerEvents="none"/>
  </svg>;
}
