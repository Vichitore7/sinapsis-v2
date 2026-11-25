import { useState, useRef, useEffect } from 'react';
import { api } from '../api.js';
export default function Burbujas({ aplicarServidor, avisar }) {
  const [partida,setPartida] = useState(null);
  const [ocupado,setOcupado] = useState(false);
  const [mensaje,setMensaje] = useState('');
  const bloqueo = useRef(false);
  const activo = useRef(true);
  useEffect(()=>{activo.current=true;return()=>{activo.current=false;};},[]);
  async function operar(fn) {
    if (bloqueo.current) return;
    bloqueo.current=true; setOcupado(true); setMensaje('');
    try {
      const r=await fn(); if(!activo.current)return; setPartida(r);
      if(r.estado) aplicarServidor(r.estado);
      if(r.finalizada) { setMensaje('¡Lo lograste! Tu ajolote ganó una marca de alegría (máximo 5).'); avisar('¡Burbujas! ¡Qué divertido!','emocionado'); }
    } catch(e) { if(!activo.current)return; setMensaje(e.message); if(e.estado===409) setPartida(null); }
    finally { bloqueo.current=false; if(activo.current)setOcupado(false); }
  }
  return <section className="hab-panel"><h2>Burbujas</h2><p>Toca la burbuja marcada seis veces. No hay tiempo límite de reacción, errores castigados ni estrellas en juego. La sesión se conserva durante cinco minutos.</p>
    {(!partida || partida.finalizada) ? <button className="hab-btn" disabled={ocupado} onClick={()=>operar(api.iniciarBurbujas)}>{partida?'Volver a jugar':'Empezar'}</button> : <>
      <p role="status">Burbujas: {partida.aciertos} / {partida.total}</p>
      <div className="hab-burbujas">{Array.from({length:9},(_,i)=><button key={i} className={partida.objetivo===i?'objetivo':''} disabled={ocupado} aria-label={`Burbuja ${i+1}${partida.objetivo===i?', objetivo':''}`} onClick={()=>operar(()=>api.golpearBurbuja({partidaId:partida.partidaId,paso:partida.aciertos,celda:i}))}>{partida.objetivo===i?'★':'○'}</button>)}</div>
    </>}
    <p role="status">{mensaje}</p>
  </section>;
}
