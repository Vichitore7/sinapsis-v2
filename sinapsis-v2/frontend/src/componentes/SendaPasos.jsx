// Senda de pasos (components/SendaPasos): el procedimiento como un camino.
// Correcto en selva, "aquí se torció" en casi con una pregunta socrática, pendiente punteado.
// Nunca muestra la respuesta correcta.

export default function SendaPasos({ pasos, pregunta, numeroPista, maxPistas = 3, titulo = 'Tu sendero' }) {
  return (
    <div className="sm-card">
      <div className="fila-entre" style={{ marginBottom: 'var(--espacio-3)' }}>
        <h2 className="subtitulo" style={{ margin: 0 }}>{titulo}</h2>
        {numeroPista > 0 && <span className="sm-chip sm-chip-pista">PISTA {numeroPista} DE {maxPistas}</span>}
      </div>
      <ol className="sm-senda">
        {pasos.map((p, i) => {
          const n = i + 1;
          if (p.estado === 'ok') {
            return (
              <li key={i} className="sm-paso sm-paso-ok">
                <span className="sm-paso-marca" aria-label="correcto">✓</span><span>{p.texto}</span>
              </li>
            );
          }
          if (p.estado === 'casi') {
            return (
              <li key={i} className="sm-paso sm-paso-casi">
                <span className="sm-paso-marca">{n}</span>
                <div className="col-2">
                  <span>
                    <strong>{p.texto}</strong>{' '}
                    <span className="texto-casi">· aquí se torció el sendero</span>
                  </span>
                  {pregunta && <div className="sm-bubble">{pregunta}</div>}
                </div>
              </li>
            );
          }
          return (
            <li key={i} className="sm-paso sm-paso-pendiente">
              <span className="sm-paso-marca">{n}</span><span>{p.texto}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
