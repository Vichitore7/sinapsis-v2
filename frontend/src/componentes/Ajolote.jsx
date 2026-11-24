// Ajolote explorador (components/Ajolote). Estados: feliz, curioso, celebrando, dormido.
// Estilo sticker: borde blanco grueso + sombra sólida.
// Evolución: las branquias ganan un color nuevo por cada mundo superado.
// Accesorios: stickers ganados ('mochila', 'bufanda', ...).
import { useId } from 'react';

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

// ---------- Trajes típicos de las trajineras de Xochimilco ----------
// Colores fijos (no dependen del tema): son la ropa de Kiko, igual de día y de noche.
const ROPA = {
  manta: '#fbf8f0', palma: '#f1dfa8', palmaHilo: '#cfae62', liston: '#2b2738',
  faja: '#5b6fa8', rojo: '#d62839', rosa: '#ff6fa5', amarillo: '#ffc83d', verde: '#1fa971',
  madera: '#c98a4a', maderaHilo: '#8f5a2b', bambu: '#d9b46a', bambuNudo: '#a8843f',
  cabello: '#2a2238', falda: '#2f3f86', faldaRaya: '#7fb2e5',
};
const C = { stroke: 'var(--tinta)', strokeWidth: 2.5, strokeLinejoin: 'round' };

/** Siluetas extra que también llevan borde blanco de sticker. */
function SiluetaTraje({ traje, cabeza }) {
  if (traje === 'trajinero') {
    return (
      <>
        <ellipse cx="100" cy="52" rx="78" ry="13" /><path d="M68 52 Q68 16 100 16 Q132 16 132 52 Z" />
        {!cabeza && <rect x="174" y="18" width="10" height="180" rx="5" />}
      </>
    );
  }
  if (traje === 'trajinera') {
    return (
      <>
        <path d="M42 86 Q48 40 100 38 Q152 40 158 86 Z" />
        <ellipse cx="44" cy="124" rx="9" ry="34" /><ellipse cx="156" cy="124" rx="9" ry="34" />
        {!cabeza && <><rect x="17" y="34" width="9" height="130" rx="4" /><ellipse cx="21.5" cy="176" rx="11" ry="20" /></>}
      </>
    );
  }
  return null;
}

/** Herramienta en la mano: garrocha de bambú (trajinero) o remo de madera (trajinera). Va detrás de las branquias. */
function Herramienta({ traje }) {
  if (traje === 'trajinero') {
    return (
      <g>
        <rect x="174" y="18" width="10" height="180" rx="5" fill={ROPA.bambu} {...C} />
        {[56, 96, 136, 176].map((y) => <path key={y} d={`M175 ${y} h8`} stroke={ROPA.bambuNudo} strokeWidth="3" strokeLinecap="round" />)}
      </g>
    );
  }
  if (traje === 'trajinera') {
    return (
      <g>
        <rect x="17" y="34" width="9" height="136" rx="4" fill={ROPA.madera} {...C} />
        <ellipse cx="21.5" cy="176" rx="11" ry="20" fill={ROPA.madera} {...C} />
        <path d="M21.5 162 v26" stroke={ROPA.maderaHilo} strokeWidth="2" strokeLinecap="round" />
      </g>
    );
  }
  return null;
}

/** Ropa del cuerpo, recortada a la silueta del cuerpo (la cabeza va encima). */
function RopaCuerpo({ traje, recorte }) {
  if (traje === 'trajinero') {
    return (
      <g clipPath={`url(#${recorte})`}>
        <rect x="60" y="124" width="80" height="58" fill={ROPA.manta} />
        {/* faja tejida con raya roja y su nudo de lado */}
        <rect x="60" y="153" width="80" height="9" fill={ROPA.faja} />
        <rect x="60" y="156.5" width="80" height="2.5" fill={ROPA.rojo} />
        <path d="M100 162 v16" stroke={ROPA.palmaHilo} strokeWidth="1.5" strokeDasharray="3 3" />
      </g>
    );
  }
  if (traje === 'trajinera') {
    return (
      <g clipPath={`url(#${recorte})`}>
        <rect x="60" y="124" width="80" height="34" fill={ROPA.manta} />
        {/* bordado de flores en la blusa */}
        {[[78, 150, ROPA.rojo], [92, 152, ROPA.rosa], [108, 152, ROPA.verde], [122, 150, ROPA.rojo]].map(([x, y, c]) => (
          <circle key={x} cx={x} cy={y} r="2.6" fill={c} />
        ))}
        {/* falda de rayas */}
        <rect x="60" y="158" width="80" height="24" fill={ROPA.falda} />
        {[163, 169, 175].map((y) => <rect key={y} x="60" y={y} width="80" height="2.5" fill={ROPA.faldaRaya} />)}
        {/* faja rosa */}
        <rect x="60" y="155" width="80" height="5" fill={ROPA.rosa} />
      </g>
    );
  }
  return null;
}

/** Detalles sobre el cuerpo que salen de la silueta (nudo de la faja, morral, listones). */
function DetallesCuerpo({ traje }) {
  if (traje === 'trajinero') {
    return (
      <g {...C} strokeWidth="2">
        <path d="M128 157 l8 14 l-6 1 z" fill={ROPA.faja} />
        {/* morral amarillo bordado */}
        <rect x="62" y="158" width="18" height="16" rx="4" fill={ROPA.amarillo} />
        <circle cx="71" cy="166" r="3" fill={ROPA.verde} strokeWidth="1.5" />
      </g>
    );
  }
  if (traje === 'trajinera') {
    return <path d="M82 158 l-6 14 l7 -2 l3 -11 z" fill={ROPA.rosa} {...C} strokeWidth="2" />;
  }
  return null;
}

/** Sombrero de palma o pañoleta con trenzas y flor. */
function Tocado({ traje }) {
  if (traje === 'trajinero') {
    return (
      <g>
        <ellipse cx="100" cy="52" rx="78" ry="13" fill={ROPA.palma} {...C} />
        <path d="M68 52 Q68 16 100 16 Q132 16 132 52 Z" fill={ROPA.palma} {...C} />
        <path d="M76 30 Q100 24 124 30 M72 40 Q100 34 128 40" fill="none" stroke={ROPA.palmaHilo} strokeWidth="2" />
        <rect x="68" y="42" width="64" height="8" fill={ROPA.liston} {...C} strokeWidth="2" />
        <path d="M40 56 Q100 66 160 56" fill="none" stroke={ROPA.palmaHilo} strokeWidth="2" />
      </g>
    );
  }
  if (traje === 'trajinera') {
    return (
      <g>
        {/* trenzas */}
        {[44, 156].map((x) => (
          <g key={x}>
            {[96, 108, 120, 132, 144].map((y) => <ellipse key={y} cx={x} cy={y} rx="8" ry="7" fill={ROPA.cabello} {...C} strokeWidth="2" />)}
            <path d={`M${x - 7} 154 l7 -4 l7 4 l-7 5 z`} fill={ROPA.rosa} {...C} strokeWidth="1.5" />
          </g>
        ))}
        {/* pañoleta roja bordada */}
        <path d="M42 86 Q48 40 100 38 Q152 40 158 86 Q130 70 100 70 Q70 70 42 86 Z" fill={ROPA.rojo} {...C} />
        <path d="M50 79 Q100 60 150 79" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="4 4" strokeLinecap="round" />
        {[[80, 52], [100, 48], [120, 52]].map(([x, y]) => <path key={x} d={`M${x} ${y - 4} l4 4 l-4 4 l-4 -4 z`} fill="#fff" />)}
        {/* flor */}
        <g transform="translate(146 54)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-7" rx="5" ry="7" transform={`rotate(${a})`} fill={ROPA.rosa} {...C} strokeWidth="1.5" />
          ))}
          <circle r="4" fill={ROPA.amarillo} {...C} strokeWidth="1.5" />
        </g>
      </g>
    );
  }
  return null;
}

// cabeza: solo la cabecita (logo del inicio de sesión y saludos de Kiko).
// traje: 'trajinero' | 'trajinera' | null (regalo de bienvenida, se elige en Perfil > Vestir a Kiko).
export default function Ajolote({ estado = 'feliz', tamano = 140, mundosSuperados = 0, accesorios = [], etiqueta, cabeza = false, traje = null }) {
  const recorte = `cuerpo-${useId().replace(/:/g, '')}`;
  const brilla = estado === 'celebrando';
  const colorBranquia = (i) => {
    if (brilla) return 'var(--sol)';
    // Cada mundo superado pinta un par más de branquias con un color nuevo.
    const par = i % 3;
    const nivel = Math.min(mundosSuperados, COLORES_BRANQUIAS.length - 1);
    return par < nivel ? COLORES_BRANQUIAS[par + 1] : COLORES_BRANQUIAS[0];
  };
  const etiquetaFinal = etiqueta || `Ajolote explorador ${estado}${traje ? ` con traje de ${traje}` : ''}`;

  const formas = (
    <>
      {BRANQUIAS.map((b, i) => (
        <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx || 24} ry="9" transform={`rotate(${b.rot} ${b.cx} ${b.cy})`} />
      ))}
      {!cabeza && <><ellipse cx="72" cy="176" rx="14" ry="8" /><ellipse cx="128" cy="176" rx="14" ry="8" />
      <ellipse cx="100" cy="152" rx="36" ry="26" /></>}<ellipse cx="100" cy="100" rx="62" ry="52" />
      {traje ? <SiluetaTraje traje={traje} cabeza={cabeza} />
        : <><ellipse cx="100" cy="54" rx="60" ry="12" /><path d="M62 54 Q62 22 100 22 Q138 22 138 54 Z" /></>}
    </>
  );

  return (
    <svg
      className={`ajolote ajolote-${estado}`}
      viewBox={cabeza ? '4 10 192 154' : '0 0 200 200'}
      width={tamano}
      height={tamano}
      role="img"
      aria-label={etiquetaFinal}
    >
      {/* Borde blanco de sticker */}
      <g fill="var(--superficie)" stroke="var(--superficie)" strokeWidth="16" strokeLinejoin="round">{formas}</g>

      {!cabeza && accesorios.includes('mochila') && (
        <g stroke="var(--tinta)" strokeWidth="2.5">
          <rect x="128" y="126" width="44" height="54" rx="14" fill="var(--magia)" />
          <rect x="136" y="148" width="28" height="20" rx="6" fill="var(--sol)" />
        </g>
      )}

      {!cabeza && <Herramienta traje={traje} />}

      {BRANQUIAS.map((b, i) => (
        <ellipse
          key={i} cx={b.cx} cy={b.cy} rx={b.rx || 24} ry="9"
          transform={`rotate(${b.rot} ${b.cx} ${b.cy})`}
          fill={colorBranquia(i)} stroke="var(--tinta)" strokeWidth="2.5"
        />
      ))}
      {!cabeza && (
        <>
          <defs><clipPath id={recorte}><ellipse cx="100" cy="152" rx="36" ry="26" /></clipPath></defs>
          <g fill="var(--ajolote-rosa)" stroke="var(--tinta)" strokeWidth="2.5">
            <ellipse cx="72" cy="176" rx="14" ry="8" /><ellipse cx="128" cy="176" rx="14" ry="8" />
            <ellipse cx="100" cy="152" rx="36" ry="26" />
          </g>
          {traje && (
            <>
              <RopaCuerpo traje={traje} recorte={recorte} />
              <ellipse cx="100" cy="152" rx="36" ry="26" fill="none" stroke="var(--tinta)" strokeWidth="2.5" />
              <DetallesCuerpo traje={traje} />
            </>
          )}
        </>
      )}
      <ellipse cx="100" cy="100" rx="62" ry="52" fill="var(--ajolote-rosa)" stroke="var(--tinta)" strokeWidth="2.5" />
      <ellipse cx="62" cy="116" rx="10" ry="6" fill="var(--ajolote-rosa-profundo)" opacity=".7" />
      <ellipse cx="138" cy="116" rx="10" ry="6" fill="var(--ajolote-rosa-profundo)" opacity=".7" />
      <Cara estado={estado} />

      {!cabeza && accesorios.includes('bufanda') && (
        <g stroke="var(--tinta)" strokeWidth="2.5">
          <path d="M62 138 Q100 156 138 138 L138 150 Q100 168 62 150 Z" fill="var(--casi)" />
          <rect x="112" y="148" width="14" height="26" rx="4" fill="var(--casi)" />
        </g>
      )}

      {traje ? <Tocado traje={traje} /> : (
        <g stroke="var(--tinta)" strokeWidth="2.5">
          <ellipse cx="100" cy="54" rx="60" ry="12" fill="var(--sol)" />
          <path d="M62 54 Q62 22 100 22 Q138 22 138 54 Z" fill="var(--sol)" />
          <rect x="63" y="42" width="74" height="9" fill="var(--selva)" strokeWidth="2" />
        </g>
      )}
      {!cabeza && !traje && !accesorios.includes('bufanda') && (
        <g>
          <circle cx="100" cy="166" r="9" fill="var(--sol)" stroke="var(--tinta)" strokeWidth="2.5" />
          <path d="M100 160 L103 166 L100 172 L97 166 Z" fill="var(--tinta)" />
        </g>
      )}
      <Extra estado={estado} />
    </svg>
  );
}
