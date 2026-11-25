// Apoyo visual (components/ModeloVisual): monedas, bolsitas, barras o solo números.
// Regla: el total SOLO se muestra en el ejemplo del ajolote (mostrarTotal), nunca en el reto.

function Moneda({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="7" fill="var(--sol)" stroke="var(--tinta)" strokeWidth="1.5" />
      <circle r="3.4" fill="none" stroke="var(--sol-profundo)" strokeWidth="1.5" />
    </g>
  );
}

function Monedas({ a, b, mostrarTotal, moneda }) {
  // Un montón: hasta 12 monedas en 2 filas de 6, con su cantidad debajo.
  const anchoMonton = 6 * 15 + 20;
  const ancho = a * anchoMonton;
  const filas = b > 6 ? 2 : 1;
  const alto = filas * 15 + 26 + (mostrarTotal ? 34 : 0);
  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      width="100%"
      style={{ maxWidth: ancho }}
      role="img"
      aria-label={`${a} montones de ${b} monedas cada uno${mostrarTotal ? `, en total ${a * b}` : ''}`}
    >
      {Array.from({ length: a }, (_, m) => {
        const x0 = m * anchoMonton + 8;
        return (
          <g key={m}>
            {Array.from({ length: b }, (_, i) => (
              <Moneda key={i} x={x0 + (i % 6) * 15} y={8 + Math.floor(i / 6) * 15} />
            ))}
            <text x={x0 + 37} y={filas * 15 + 20} textAnchor="middle" className="svg-num">{b}</text>
          </g>
        );
      })}
      {mostrarTotal && (
        <text x={ancho / 2} y={alto - 6} textAnchor="middle" className="svg-total">
          Total: {moneda ? '$' : ''}{a * b}
        </text>
      )}
    </svg>
  );
}

function Bolsitas({ a, b, moneda }) {
  const ancho = a * 110;
  return (
    <svg viewBox={`0 0 ${ancho} 74`} width="100%" style={{ maxWidth: ancho }} role="img"
      aria-label={`${a} bolsitas de ${b}${moneda ? ' pesos' : ''} cada una`}>
      {Array.from({ length: a }, (_, i) => {
        const x = i * 110;
        return (
          <g key={i}>
            <rect x={x + 35} y="2" width="40" height="12" rx="4" fill="var(--magia)" stroke="var(--tinta)" strokeWidth="1.6" />
            <rect x={x + 15} y="12" width="80" height="58" rx="22" fill="var(--sol)" stroke="var(--tinta)" strokeWidth="1.6" />
            <text x={x + 55} y="49" textAnchor="middle" className="svg-grande">{moneda ? '$' : ''}{b}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Barras({ a, b, moneda }) {
  const w = 100;
  const ancho = a * (w + 4);
  return (
    <svg viewBox={`0 0 ${ancho} 86`} width="100%" style={{ maxWidth: ancho }} role="img"
      aria-label={`${a} barras iguales de ${b}${moneda ? ' pesos' : ''} con un total desconocido`}>
      {Array.from({ length: a }, (_, i) => (
        <g key={i}>
          <rect x={i * (w + 4)} y="2" width={w} height="40" rx="8" fill="var(--magia-suave)" stroke="var(--magia)" strokeWidth="2" />
          <text x={i * (w + 4) + w / 2} y="29" textAnchor="middle" className="svg-grande" fill="var(--magia-profundo)">
            {moneda ? '$' : ''}{b}
          </text>
        </g>
      ))}
      <path d={`M1 50 L1 58 L${ancho - 5} 58 L${ancho - 5} 50`} fill="none" stroke="var(--tinta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ancho / 2} cy="72" r="11" fill="var(--sol)" stroke="var(--tinta)" strokeWidth="1.6" />
      <text x={ancho / 2} y="78" textAnchor="middle" className="svg-grande">?</text>
    </svg>
  );
}

export default function ModeloVisual({ etapa, a, b, moneda, mostrarTotal = false }) {
  if (etapa === 1 && b <= 12) return <div className="modelo"><Monedas a={a} b={b} moneda={moneda} mostrarTotal={mostrarTotal} /></div>;
  if (etapa <= 2) return <div className="modelo"><Bolsitas a={a} b={b} moneda={moneda} /></div>;
  if (etapa === 3) return <div className="modelo"><Barras a={a} b={b} moneda={moneda} /></div>;
  return null;
}
