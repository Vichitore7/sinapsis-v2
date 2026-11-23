// Ajolote explorador (components/Ajolote). Estados: feliz, curioso, celebrando, dormido.
// Estilo sticker: borde blanco grueso + sombra sólida.
// Evolución: las branquias ganan un color nuevo por cada mundo superado.
// Accesorios: stickers ganados ('mochila', 'bufanda', ...).

const COLORES_BRANQUIAS = ['var(--magia)', 'var(--selva)', 'var(--pista)', 'var(--sol)'];

const BRANQUIAS = [
  { cx: 38, cy: 70, rot: -35 }, { cx: 30, cy: 92, rot: -5 }, { cx: 36, cy: 114, rot: 28, rx: 22 },
  { cx: 162, cy: 70, rot: 35 }, { cx: 170, cy: 92, rot: 5 }, { cx: 164, cy: 114, rot: -28, rx: 22 },
];

const LINEA = { fill: 'none', stroke: 'var(--tinta)', strokeWidth: 3, strokeLinecap: 'round' };
const TINTA = { fill: 'var(--tinta)' };

function Cara({ estado }) {
  if (estado === 'curioso') {
    return (
      <>
        <circle cx="78" cy="102" r="7" style={TINTA} /><circle cx="122" cy="100" r="9" style={TINTA} />
        <circle cx="81" cy="99" r="2.6" fill="var(--superficie)" /><circle cx="125" cy="97" r="3" fill="var(--superficie)" />
        <path d="M112 82 Q122 74 134 80" style={LINEA} />
        <ellipse cx="100" cy="124" rx="6" ry="7" style={TINTA} />
      </>
    );
  }
  if (estado === 'celebrando') {
    return (
      <>
        <path d="M69 102 Q78 92 87 102" style={LINEA} /><path d="M113 102 Q122 92 131 102" style={LINEA} />
        <path d="M84 116 Q100 140 116 116 Z" style={TINTA} />
      </>
    );
  }
  if (estado === 'dormido') {
    return (
      <>
        <path d="M69 102 Q78 110 87 102" style={LINEA} /><path d="M113 102 Q122 110 131 102" style={LINEA} />
        <path d="M92 122 Q100 128 108 122" style={LINEA} />
      </>
    );
  }
  return (
    <>
      <circle cx="78" cy="100" r="8" style={TINTA} /><circle cx="122" cy="100" r="8" style={TINTA} />
      <circle cx="81" cy="97" r="2.8" fill="var(--superficie)" /><circle cx="125" cy="97" r="2.8" fill="var(--superficie)" />
      <path d="M86 118 Q100 132 114 118" style={LINEA} />
    </>
  );
}

function Extra({ estado }) {
  if (estado === 'curioso') {
    return (
      <g>
        <circle cx="176" cy="30" r="20" fill="var(--pista)" stroke="var(--superficie)" strokeWidth="6" />
        <text x="176" y="39" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="26" fill="var(--tinta)">?</text>
      </g>
    );
  }
  if (estado === 'celebrando') {
    return (
      <g fill="var(--sol)" stroke="var(--tinta)" strokeWidth="2.5">
        <path d="M20 30 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5z" />
        <path d="M178 60 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" />
      </g>
    );
  }
  if (estado === 'dormido') {
    return (
      <g fontFamily="var(--font-display)" fontWeight="800" fill="var(--tinta-suave)">
        <text x="160" y="46" fontSize="26">z</text><text x="178" y="26" fontSize="18">z</text>
      </g>
    );
  }
  return null;
}

export default function Ajolote({ estado = 'feliz', tamano = 140, mundosSuperados = 0, accesorios = [], etiqueta }) {
  const brilla = estado === 'celebrando';
  const colorBranquia = (i) => {
    if (brilla) return 'var(--sol)';
    // Cada mundo superado pinta un par más de branquias con un color nuevo.
    const par = i % 3;
    const nivel = Math.min(mundosSuperados, COLORES_BRANQUIAS.length - 1);
    return par < nivel ? COLORES_BRANQUIAS[par + 1] : COLORES_BRANQUIAS[0];
  };
  const etiquetaFinal = etiqueta || `Ajolote explorador ${estado}`;

  const formas = (
    <>
      {BRANQUIAS.map((b, i) => (
        <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx || 24} ry="9" transform={`rotate(${b.rot} ${b.cx} ${b.cy})`} />
      ))}
      <ellipse cx="72" cy="176" rx="14" ry="8" /><ellipse cx="128" cy="176" rx="14" ry="8" />
      <ellipse cx="100" cy="152" rx="36" ry="26" /><ellipse cx="100" cy="100" rx="62" ry="52" />
      <ellipse cx="100" cy="54" rx="60" ry="12" /><path d="M62 54 Q62 22 100 22 Q138 22 138 54 Z" />
    </>
  );

  return (
    <svg
      className={`ajolote ajolote-${estado}`}
      viewBox="0 0 200 200"
      width={tamano}
      height={tamano}
      role="img"
      aria-label={etiquetaFinal}
    >
      {/* Borde blanco de sticker */}
      <g fill="var(--superficie)" stroke="var(--superficie)" strokeWidth="16" strokeLinejoin="round">{formas}</g>

      {accesorios.includes('mochila') && (
        <g stroke="var(--tinta)" strokeWidth="2.5">
          <rect x="128" y="126" width="44" height="54" rx="14" fill="var(--magia)" />
          <rect x="136" y="148" width="28" height="20" rx="6" fill="var(--sol)" />
        </g>
      )}

      {BRANQUIAS.map((b, i) => (
        <ellipse
          key={i} cx={b.cx} cy={b.cy} rx={b.rx || 24} ry="9"
          transform={`rotate(${b.rot} ${b.cx} ${b.cy})`}
          fill={colorBranquia(i)} stroke="var(--tinta)" strokeWidth="2.5"
        />
      ))}
      <g fill="var(--ajolote-rosa)" stroke="var(--tinta)" strokeWidth="2.5">
        <ellipse cx="72" cy="176" rx="14" ry="8" /><ellipse cx="128" cy="176" rx="14" ry="8" />
        <ellipse cx="100" cy="152" rx="36" ry="26" /><ellipse cx="100" cy="100" rx="62" ry="52" />
      </g>
      <ellipse cx="62" cy="116" rx="10" ry="6" fill="var(--ajolote-rosa-profundo)" opacity=".7" />
      <ellipse cx="138" cy="116" rx="10" ry="6" fill="var(--ajolote-rosa-profundo)" opacity=".7" />
      <Cara estado={estado} />

      {accesorios.includes('bufanda') && (
        <g stroke="var(--tinta)" strokeWidth="2.5">
          <path d="M62 138 Q100 156 138 138 L138 150 Q100 168 62 150 Z" fill="var(--casi)" />
          <rect x="112" y="148" width="14" height="26" rx="4" fill="var(--casi)" />
        </g>
      )}

      <g stroke="var(--tinta)" strokeWidth="2.5">
        <ellipse cx="100" cy="54" rx="60" ry="12" fill="var(--sol)" />
        <path d="M62 54 Q62 22 100 22 Q138 22 138 54 Z" fill="var(--sol)" />
        <rect x="63" y="42" width="74" height="9" fill="var(--selva)" strokeWidth="2" />
      </g>
      {!accesorios.includes('bufanda') && (
        <g>
          <circle cx="100" cy="166" r="9" fill="var(--sol)" stroke="var(--tinta)" strokeWidth="2.5" />
          <path d="M100 160 L103 166 L100 172 L97 166 Z" fill="var(--tinta)" />
        </g>
      )}
      <Extra estado={estado} />
    </svg>
  );
}
