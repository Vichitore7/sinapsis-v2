import { useJuego } from '../estado/store.jsx';
import Icono from '../componentes/Iconos.jsx';
import { STICKERS } from '../contenido/mundos.js';

export default function Logros() {
  const { estado } = useJuego();
  const lista = estado.logros || [];
  const hechos = lista.filter((l) => l.hecho).length;

  return (
    <div className="pila dos-columnas">
      <section className="sm-card">
        <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-3)' }}>Álbum de stickers</h2>
        <div className="album">
          {Object.entries(STICKERS).map(([id, s]) => {
            const tiene = estado.stickers.includes(id);
            return (
              <div key={id} className={`album-item${tiene ? '' : ' falta'}`}>
                <Icono nombre={tiene ? (id === 'aula' ? 'logros' : id) : 'candado'} tamano={56} />
                <span className="etiqueta">{tiene ? s.nombre : '¿?'}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="sm-card">
        <div className="fila-entre" style={{ marginBottom: 'var(--espacio-3)' }}>
          <h2 className="subtitulo" style={{ margin: 0 }}>Logros</h2>
          <span className="sm-chip">{hechos} de {lista.length}</span>
        </div>
        <ul className="lista-logros">
          {lista.map((l) => (
            <li key={l.id} className={`logro${l.hecho ? ' hecho' : ''}`}>
              <span className="sm-paso-marca">{l.hecho ? '✓' : ''}</span>
              <div>
                <div className="cuerpo-fuerte">{l.nombre}</div>
                <div className="etiqueta texto-suave">{l.detalle}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="sm-card">
        <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>Reconocimientos</h2>
        <p className="cuerpo" style={{ margin: 0 }}>
          {estado.mundosTerminados.length
            ? `Constancia de explorador: ${estado.apodo} superó ${estado.mundosTerminados.length} mundo(s).`
            : 'Al superar tu primer mundo aparecerá aquí tu constancia de explorador.'}
        </p>
        <p className="etiqueta texto-suave" style={{ margin: 'var(--espacio-2) 0 0' }}>Sin valor curricular.</p>
      </section>

    </div>
  );
}
