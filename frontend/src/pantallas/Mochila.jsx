import { useState } from 'react';
import { useJuego } from '../estado/store.jsx';
import Ajolote from '../componentes/Ajolote.jsx';
import Icono from '../componentes/Iconos.jsx';
import { Marcas } from '../componentes/Comunes.jsx';
import { CUIDADOS, cuidar, estadoAjolote, loQuePide } from '../logica/juego.js';

const MEDIDORES = [
  { id: 'comida', nombre: 'Comida' },
  { id: 'pecera', nombre: 'Pecera' },
  { id: 'alegria', nombre: 'Alegría' },
];

const BOTONES = [
  { id: 'alimentar', texto: 'Alimentar', gracias: '¡Ñam! Una lombriz deliciosa.' },
  { id: 'jugar', texto: 'Jugar', gracias: '¡Qué divertido! Kiko nada en círculos.' },
  { id: 'limpiar', texto: 'Limpiar', gracias: '¡Pecera limpiecita!' },
  { id: 'descansar', texto: 'Descansar', gracias: 'Kiko se fue a dormir. Hasta la próxima aventura.' },
];

export default function Mochila() {
  const { estado, actualizar } = useJuego();
  const [mensaje, setMensaje] = useState(null);
  const pide = loQuePide(estado.bienestar);
  const animo = estadoAjolote(estado);

  const accion = (b) => {
    const r = cuidar(estado, b.id);
    if (!r.ok) return;
    actualizar(() => r.estado);
    setMensaje(b.gracias);
  };

  return (
    <div className="pila">
      <div className="cuidados">
        <section className="sm-card">
          <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-3)' }}>Bienestar de {estado.nombreAjolote}</h2>
          {MEDIDORES.map((m) => {
            const v = estado.bienestar[m.id];
            const pideEste = v <= 2;
            return (
              <div key={m.id} className={`fila-medidor${pideEste ? ' pide' : ''}`}>
                <Icono nombre={m.id} tamano={44} />
                <span className="nombre-medidor">
                  {m.nombre}
                  {pideEste && <span className="texto-casi"> · Pide</span>}
                </span>
                <Marcas valor={v} etiqueta={`${m.nombre}: ${v} de 5`} />
              </div>
            );
          })}

          <div className="acciones" style={{ marginTop: 'var(--espacio-3)' }}>
            {BOTONES.map((b) => {
              const costo = CUIDADOS[b.id].costo();
              const faltan = Math.max(0, costo - estado.estrellas);
              const gratis = costo === 0;
              return (
                <button
                  key={b.id}
                  className={`sm-btn${gratis ? ' sm-btn-suave' : ''}`}
                  onClick={() => accion(b)}
                  disabled={faltan > 0}
                >
                  {b.texto} · {gratis ? 'gratis' : `★ ${costo}`}
                  {faltan > 0 && <span className="etiqueta"> (faltan {faltan})</span>}
                </button>
              );
            })}
          </div>
        </section>

        <div className="escena-ajolote">
          {pide && animo !== 'dormido' && (
            <div className="flota">
              <Icono nombre={pide} tamano={64} etiqueta={`${estado.nombreAjolote} pide ${pide === 'pecera' ? 'que limpies su pecera' : pide === 'comida' ? 'comida' : 'jugar'}`} />
            </div>
          )}
          <Ajolote estado={animo} tamano={150} mundosSuperados={estado.mundosTerminados.length} accesorios={estado.stickers} />
          {mensaje && <div className="sm-bubble" role="status">{mensaje}</div>}
        </div>
      </div>

      <section className="sm-card">
        <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>Cómo se ganan estrellas</h2>
        <ul className="lista-simple cuerpo">
          <li>Acertar a la primera: ★ 3</li>
          <li>Acertar después de pistas: ★ 2. Pedir ayuda nunca se castiga.</li>
          <li>Reto del día: ★ 5 de bono</li>
          <li>Abrir el cofre de un mundo: ★ 10 y un sticker para Kiko</li>
        </ul>
      </section>
    </div>
  );
}
