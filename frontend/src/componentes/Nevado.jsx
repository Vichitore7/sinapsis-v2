// Ilustraciones del Mundo 4, "El Nevado de los Números" (Nevado de Toluca): paradas de la subida (los niveles),
// teporingos (los 3 premios de cada nivel), la decoración del volcán, el título del mundo, la bolita de nieve
// y los dibujos de los ejercicios de 4.º. Colores fijos (no cambian con el tema): son dibujos tipo sticker.
import { TINTA } from './CDMX.jsx';
import { VisualFES } from './FES.jsx';

const L = { stroke: TINTA, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' };
const GRIS = '#b9b5c9';
const NIEVE = '#f7fbff';
const NIEVE_SOMBRA = '#d6e6f5';
const ROCA = '#7d7489';
const ROCA_OSCURA = '#5b5368';
const OYAMEL = '#2f6b4f';
const OYAMEL_CLARO = '#3f8a63';
const MADERA = '#8b5a2b';
const LAGUNA_SOL = '#3aa6b9';
const LAGUNA_LUNA = '#2a4f8f';
const FUEGO = '#ff8a3d';

// ---------- Teporingo (el "pez" de este mundo) ----------

/** Teporingo o zacatuche: el conejo de los volcanes, chiquito, café grisáceo, de orejas cortas y redondas y sin cola visible. */
export function Teporingo({ tamano = 34, encendido = true }) {
  const trazo = encendido ? TINTA : 'currentColor';
  const t = { stroke: trazo, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round', strokeDasharray: encendido ? undefined : '3 3' };
  const f = (c) => (encendido ? c : 'none');
  return (
    <svg width={tamano} height={tamano * 0.72} viewBox="0 0 60 43" aria-hidden="true" className={encendido ? 'teporingo sticker' : 'teporingo teporingo-apagado'}>
      <ellipse cx="24" cy="29" rx="17" ry="11" fill={f('#8a6b4f')} {...t} />
      <ellipse cx="24" cy="33" rx="10" ry="5" fill={f('#c9ad8c')} stroke="none" />
      <path d="M14 39 Q12 42 18 42 M30 39 Q30 42 35 42" fill="none" {...t} />
      <ellipse cx="38" cy="10" rx="4.5" ry="6" fill={f('#8a6b4f')} {...t} />
      <ellipse cx="47" cy="10" rx="4.5" ry="6" fill={f('#8a6b4f')} {...t} />
      {encendido && <><ellipse cx="38" cy="10" rx="2" ry="3.3" fill="#e9b7a6" /><ellipse cx="47" cy="10" rx="2" ry="3.3" fill="#e9b7a6" /></>}
      <circle cx="43" cy="22" r="10" fill={f('#9a7a5c')} {...t} />
      <circle cx="46" cy="20" r="1.9" fill={encendido ? TINTA : 'none'} stroke={encendido ? 'none' : trazo} />
      <circle cx="52.5" cy="24" r="1.6" fill={encendido ? '#5a3a2a' : 'none'} stroke={encendido ? 'none' : trazo} />
      {encendido && <path d="M53 26 L58 25 M53 27 L58 28" stroke="#5a3a2a" strokeWidth="1" />}
    </svg>
  );
}

/** Los 3 teporingos de un nivel: uno por ejercicio resuelto. */
export function TeporingosNivel({ llenos, tamano = 30 }) {
  return (
    <span className="peces-nivel cacomixtles-nivel" role="img" aria-label={`${llenos} de 3 teporingos`}>
      {[0, 1, 2].map((i) => <Teporingo key={i} tamano={tamano} encendido={i < llenos} />)}
    </span>
  );
}

// ---------- Paradas de la subida (los niveles del mapa) ----------

export const PARADAS = {
  entrada: { nombre: 'Entrada del parque', color: '#2f6b4f' },
  albergue: { nombre: 'Albergue', color: '#c0392b' },
  cabana: { nombre: 'Cabaña', color: MADERA },
  puesto: { nombre: 'Puesto de chocolate', color: '#d35400' },
  fogata: { nombre: 'Campamento', color: FUEGO },
  bosque: { nombre: 'Bosque de oyameles', color: OYAMEL },
  pradera: { nombre: 'Pradera de zacatón', color: '#b58b2a' },
  'laguna-luna': { nombre: 'Laguna de la Luna', color: LAGUNA_LUNA },
  crater: { nombre: 'Entrada al cráter', color: ROCA },
  mirador: { nombre: 'Mirador', color: '#5b7fb5' },
  'laguna-sol': { nombre: 'Laguna del Sol', color: LAGUNA_SOL },
  cumbre: { nombre: 'Cumbre', color: '#6c5ce7' },
};
// Parada de cada nivel (1 a 12): se va subiendo desde la entrada hasta la cumbre.
const PARADA_DE_NIVEL = ['entrada', 'albergue', 'cabana', 'puesto', 'fogata', 'bosque',
  'pradera', 'laguna-luna', 'crater', 'mirador', 'laguna-sol', 'cumbre'];
export const paradaDe = (nivel) => PARADA_DE_NIVEL[(nivel - 1) % PARADA_DE_NIVEL.length];

function Pino({ x, y, s = 1, nieve = true, c = OYAMEL }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} {...L} strokeWidth={2 / s}>
      <rect x="-3" y="34" width="6" height="10" fill={MADERA} />
      <path d="M0 0 L16 22 H8 L20 38 H-20 L-8 22 H-16 Z" fill={c} />
      {nieve && <path d="M0 0 L7 10 Q2 13 0 9 Q-3 13 -7 10 Z M-12 27 Q-6 31 0 27 Q6 31 12 27 L9 23 H-9 Z" fill={NIEVE} strokeWidth={1.4 / s} />}
    </g>
  );
}

/** Dibujo de cada parada (viewBox 140×104). `c` es el color principal. */
function Parada({ tipo, c }) {
  switch (tipo) {
    case 'entrada':
      return (
        <g>
          <rect x="14" y="30" width="12" height="62" fill={MADERA} {...L} />
          <rect x="114" y="30" width="12" height="62" fill={MADERA} {...L} />
          <path d="M6 30 L70 8 L134 30 Z" fill={c} {...L} />
          <path d="M40 22 L70 12 L100 22" fill="none" stroke={NIEVE} strokeWidth="4" strokeLinecap="round" />
          <rect x="32" y="34" width="76" height="20" rx="4" fill="#f3e3c3" {...L} />
          <text x="70" y="48" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="11" fill={TINTA}>NEVADO</text>
          <path d="M26 74 H114" stroke={MADERA} strokeWidth="5" />
        </g>
      );
    case 'albergue':
      return (
        <g>
          <rect x="18" y="44" width="104" height="46" fill="#f1e2c8" {...L} />
          <path d="M8 46 L70 12 L132 46 Z" fill={c} {...L} />
          <path d="M8 46 L70 12 L132 46 L124 50 L70 22 L16 50 Z" fill={NIEVE} {...L} strokeWidth="1.5" />
          <rect x="30" y="56" width="18" height="16" fill="#ffe8a3" {...L} strokeWidth="1.5" />
          <rect x="92" y="56" width="18" height="16" fill="#ffe8a3" {...L} strokeWidth="1.5" />
          <rect x="60" y="60" width="20" height="30" rx="2" fill={MADERA} {...L} />
          <rect x="100" y="16" width="10" height="18" fill={ROCA} {...L} strokeWidth="1.5" />
          <path d="M104 12 Q100 6 106 2 M108 12 Q112 6 108 0" fill="none" stroke="#c9c6d8" strokeWidth="2" />
        </g>
      );
    case 'cabana':
      return (
        <g>
          <rect x="24" y="42" width="92" height="48" fill={c} {...L} />
          {[52, 62, 72, 82].map((y) => <path key={y} d={`M24 ${y} H116`} stroke="#5e3a17" strokeWidth="1.5" />)}
          <path d="M14 44 L70 14 L126 44 Z" fill="#6b4226" {...L} />
          <path d="M14 44 L70 14 L126 44 L118 47 L70 22 L22 47 Z" fill={NIEVE} {...L} strokeWidth="1.5" />
          <rect x="34" y="52" width="24" height="20" fill="#dff4ff" {...L} strokeWidth="1.5" />
          <path d="M46 52 V72 M34 62 H58" stroke={TINTA} strokeWidth="1.5" />
          <path d="M36 54 L44 54 L36 60 Z M48 64 L56 70 L56 64 Z" fill="#fff" opacity=".9" />
          <rect x="76" y="58" width="20" height="32" rx="2" fill="#5e3a17" {...L} />
        </g>
      );
    case 'puesto':
      return (
        <g>
          <path d="M10 34 H130 L122 50 H18 Z" fill={c} {...L} />
          {[22, 46, 70, 94].map((x) => <path key={x} d={`M${x} 34 L${x + 8} 50 H${x - 4} Z`} fill="#fff" strokeWidth="1" stroke={TINTA} />)}
          <path d="M22 50 V90 M118 50 V90" stroke={TINTA} strokeWidth="3" />
          <rect x="16" y="66" width="108" height="26" rx="3" fill="#f3e3c3" {...L} />
          <text x="70" y="84" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="11" fill={TINTA}>CHOCOLATE</text>
          <path d="M56 54 H76 L73 66 H59 Z" fill="#fff" {...L} />
          <path d="M60 58 H72" stroke="#7a4a2a" strokeWidth="3" />
          <path d="M62 50 Q60 46 63 42 M68 50 Q66 46 69 42" fill="none" stroke="#c9c6d8" strokeWidth="1.8" />
          <ellipse cx="96" cy="60" rx="12" ry="5" fill="#f5c542" {...L} strokeWidth="1.5" />
        </g>
      );
    case 'fogata':
      return (
        <g>
          <path d="M8 90 L40 40 L72 90 Z" fill={c} {...L} />
          <path d="M40 40 L48 90" stroke={TINTA} strokeWidth="1.5" />
          <path d="M28 90 L40 62 L52 90" fill="#2b2738" {...L} strokeWidth="1.5" />
          <path d="M82 92 L118 80 M82 80 L118 92" stroke={MADERA} strokeWidth="7" strokeLinecap="round" />
          <path d="M100 82 Q86 66 96 52 Q98 62 104 60 Q102 48 110 40 Q112 56 118 60 Q122 74 100 82 Z" fill="#ffb347" {...L} strokeWidth="1.5" />
          <path d="M101 80 Q94 70 100 62 Q104 70 108 68 Q110 76 101 80 Z" fill="#ffe08a" />
        </g>
      );
    case 'bosque':
      return (
        <g>
          <Pino x={36} y={36} s={1.25} c={c} />
          <Pino x={70} y={22} s={1.55} c={OYAMEL_CLARO} />
          <Pino x={106} y={38} s={1.2} c={c} />
          <path d="M6 92 Q70 80 134 92" fill={NIEVE} {...L} strokeWidth="1.5" />
        </g>
      );
    case 'pradera':
      return (
        <g>
          <path d="M6 92 Q70 70 134 92 Z" fill="#d9c27a" {...L} />
          {[18, 34, 50, 66, 82, 98, 114].map((x, i) => (
            <path key={x} d={`M${x} 88 Q${x - 6} ${60 + (i % 2) * 8} ${x - 10} ${50 + (i % 3) * 6} M${x} 88 Q${x + 2} ${58 + (i % 2) * 6} ${x + 4} ${46 + (i % 3) * 5} M${x} 88 Q${x + 8} ${64} ${x + 14} ${56}`}
              fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
          ))}
          <path d="M96 30 L114 14 L132 30 Z" fill={NIEVE} {...L} strokeWidth="1.5" transform="translate(-8 4)" />
        </g>
      );
    case 'laguna-luna':
    case 'laguna-sol':
      return (
        <g>
          <path d="M4 92 Q10 30 70 26 Q130 30 136 92 Z" fill={NIEVE} {...L} />
          <path d="M18 84 Q26 46 70 44 Q114 46 122 84 Q70 96 18 84 Z" fill={c} {...L} />
          <path d="M40 66 Q56 60 70 66 M78 74 Q92 68 104 74" fill="none" stroke="#fff" strokeWidth="2" opacity=".7" />
          {tipo === 'laguna-sol'
            ? <g><circle cx="112" cy="16" r="10" fill="#ffd166" {...L} />{[0, 60, 120, 180, 240, 300].map((a) => <path key={a} d={`M${112 + 14 * Math.cos(a * Math.PI / 180)} ${16 + 14 * Math.sin(a * Math.PI / 180)} L${112 + 19 * Math.cos(a * Math.PI / 180)} ${16 + 19 * Math.sin(a * Math.PI / 180)}`} stroke="#f5b700" strokeWidth="2.5" />)}</g>
            : <path d="M118 6 A11 11 0 1 0 128 24 A9 9 0 1 1 118 6 Z" fill="#f3e7a3" {...L} />}
        </g>
      );
    case 'crater':
      return (
        <g>
          <path d="M4 92 L26 30 L44 48 L58 18 L78 44 L96 24 L136 92 Z" fill={c} {...L} />
          <path d="M26 30 L33 40 L38 36 L44 48 L50 34 L58 18 L66 30 L72 26 L78 44 L86 32 L96 24 L104 36 L96 38 L86 40 L78 50 L58 30 L46 52 L26 38 Z" fill={NIEVE} {...L} strokeWidth="1.4" />
          <path d="M52 92 Q56 64 70 62 Q84 64 88 92" fill={ROCA_OSCURA} {...L} />
        </g>
      );
    case 'mirador':
      return (
        <g>
          <path d="M6 92 L42 34 L78 92 Z" fill={NIEVE_SOMBRA} {...L} />
          <path d="M42 34 L52 50 L44 48 L36 54 L32 50 Z" fill={NIEVE} {...L} strokeWidth="1.4" />
          <rect x="70" y="58" width="60" height="8" rx="2" fill={c} {...L} />
          <path d="M76 66 V92 M124 66 V92 M70 50 H130" stroke={TINTA} strokeWidth="3" />
          <rect x="90" y="30" width="20" height="12" rx="3" fill="#2b2738" {...L} />
          <path d="M100 42 V58" stroke={TINTA} strokeWidth="3" />
          <circle cx="92" cy="36" r="4" fill="#9fd3ff" stroke={TINTA} strokeWidth="1.5" />
        </g>
      );
    case 'cumbre':
      return (
        <g>
          <path d="M2 92 L52 18 L70 34 L90 10 L138 92 Z" fill={ROCA} {...L} />
          <path d="M52 18 L62 34 L56 32 L50 38 L44 30 Z M90 10 L104 34 L96 30 L90 36 L84 30 L78 30 Z" fill={NIEVE} {...L} strokeWidth="1.5" />
          <path d="M90 10 V-6" stroke={TINTA} strokeWidth="2.5" />
          <path d="M90 -6 L108 -1 L90 4 Z" fill={c} {...L} strokeWidth="1.5" />
        </g>
      );
    default:
      return null;
  }
}

/** Parada de la subida de un nivel en el mapa, con letrero arriba (ahí va el número del nivel). */
export function ParadaNivel({ tipo = 'entrada', estado = 'bloq', tamano = 124, children }) {
  const info = PARADAS[tipo] || PARADAS.entrada;
  const bloq = estado === 'bloq';
  return (
    <span className={`trajinera-nivel transporte-nivel lugar-nivel parada-nivel trajinera-${estado}`} style={{ width: tamano, height: tamano * 0.74 }}>
      <svg width={tamano} height={tamano * 0.74} viewBox="0 -8 140 112" aria-hidden="true" className={bloq ? 'transporte-gris sticker' : 'sticker'}>
        <ellipse cx="70" cy="96" rx="62" ry="6" fill="#000" opacity=".12" />
        <Parada tipo={tipo} c={bloq ? GRIS : info.color} />
      </svg>
      <span className="trajinera-placa transporte-placa" style={{ background: bloq ? '#a29db6' : info.color }}>{children}</span>
    </span>
  );
}

// ---------- Personas de la excursión ----------

function Excursionista({ x = 0, y = 0, chamarra = '#d62839', gorro = '#3a86ff', piel = '#f6c9a0', escala = 1, baston = true }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`} {...L} strokeWidth="1.6">
      <path d="M14 58 L16 44 M26 58 L24 44" strokeWidth="4" stroke="#3a4a6b" />
      <rect x="5" y="26" width="12" height="18" rx="3" fill="#5b7fb5" />
      <path d="M10 44 Q10 24 20 24 Q30 24 30 44 Z" fill={chamarra} />
      <circle cx="20" cy="15" r="8" fill={piel} />
      <path d="M12 13 Q12 3 20 3 Q28 3 28 13 Z" fill={gorro} />
      <circle cx="20" cy="2" r="3" fill="#fff" />
      <path d="M14 26 Q20 30 26 26" fill="none" stroke="#2e9e44" strokeWidth="3.5" />
      {baston && <path d="M32 30 L38 58" stroke="#5b5368" strokeWidth="2.5" />}
    </g>
  );
}

// ---------- Decoración del volcán ----------

const VOLCAN = {
  // Los picos nevados del Xinantécatl.
  volcan: (
    <g {...L}>
      <path d="M0 116 L36 40 L52 56 L72 22 L120 116 Z" fill={ROCA} />
      <path d="M36 40 L44 54 L40 56 L46 62 L52 56 L58 46 L66 52 L72 22 L82 42 L76 42 L70 50 L62 44 L54 60 L46 66 L38 58 L30 54 Z" fill={NIEVE} strokeWidth="1.5" />
      <path d="M8 116 Q60 96 112 116" fill={NIEVE} strokeWidth="1.5" />
    </g>
  ),
  // Una laguna del cráter con orilla de nieve.
  laguna: (
    <g {...L}>
      <path d="M2 112 Q4 56 60 52 Q116 56 118 112 Z" fill={NIEVE} />
      <path d="M14 104 Q20 70 60 68 Q100 70 106 104 Q60 116 14 104 Z" fill={LAGUNA_LUNA} />
      <path d="M36 88 Q50 82 62 88 M68 96 Q80 90 92 96" fill="none" stroke="#fff" strokeWidth="2" opacity=".6" />
      <path d="M30 60 L42 40 L54 58 M70 58 L86 34 L100 60" fill={ROCA} strokeWidth="1.5" />
      <path d="M42 40 L47 48 L37 48 Z M86 34 L92 44 L80 44 Z" fill={NIEVE} strokeWidth="1.2" />
    </g>
  ),
  oyameles: (
    <g>
      <Pino x={34} y={50} s={1.3} />
      <Pino x={64} y={30} s={1.75} c={OYAMEL_CLARO} />
      <Pino x={92} y={56} s={1.2} />
      <path d="M4 114 Q60 100 116 114" fill={NIEVE} {...L} strokeWidth="1.5" />
    </g>
  ),
  cabana: (
    <g {...L}>
      <rect x="20" y="62" width="80" height="48" fill={MADERA} />
      {[72, 82, 92, 102].map((y) => <path key={y} d={`M20 ${y} H100`} stroke="#5e3a17" strokeWidth="1.5" />)}
      <path d="M10 64 L60 30 L110 64 Z" fill="#6b4226" />
      <path d="M10 64 L60 30 L110 64 L102 67 L60 38 L18 67 Z" fill={NIEVE} strokeWidth="1.5" />
      <rect x="30" y="72" width="20" height="16" fill="#ffe8a3" strokeWidth="1.5" />
      <rect x="66" y="78" width="18" height="32" rx="2" fill="#5e3a17" />
      <rect x="82" y="34" width="9" height="16" fill={ROCA} strokeWidth="1.5" />
      <path d="M86 30 Q82 24 88 18 M90 30 Q94 22 90 16" fill="none" stroke="#c9c6d8" strokeWidth="2" />
    </g>
  ),
  roca: (
    <g {...L}>
      <path d="M10 108 L22 70 L44 58 L70 62 L92 50 L110 82 L112 108 Z" fill={ROCA} />
      <path d="M22 70 L44 58 L70 62 L92 50 L100 64 L72 70 L46 68 L30 78 Z" fill={NIEVE} strokeWidth="1.5" />
      <path d="M44 58 L52 84 M70 62 L76 92" stroke={ROCA_OSCURA} strokeWidth="1.5" />
    </g>
  ),
  teporingo: (
    <g transform="translate(14 32) scale(1.55)">
      <Teporingo tamano={60} />
    </g>
  ),
  excursionistas: (
    <g>
      <Excursionista x={8} y={56} />
      <Excursionista x={46} y={48} chamarra="#2e9e44" gorro="#ff5fa2" piel="#a8714f" />
      <Excursionista x={82} y={60} chamarra="#7b5cd6" gorro="#ffd166" piel="#d9a27a" baston={false} />
    </g>
  ),
  puesto: (
    <g {...L}>
      <path d="M8 40 H112 L104 56 H16 Z" fill="#d35400" />
      {[22, 46, 70, 94].map((x) => <path key={x} d={`M${x} 40 L${x + 8} 56 H${x - 4} Z`} fill="#fff" strokeWidth="1" />)}
      <path d="M20 56 V104 M100 56 V104" strokeWidth="3" />
      <rect x="14" y="78" width="92" height="28" rx="3" fill="#f3e3c3" />
      <text x="60" y="97" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="11" fill={TINTA} stroke="none">QUESADILLAS</text>
      <ellipse cx="40" cy="70" rx="14" ry="5" fill="#f5c542" strokeWidth="1.5" />
      <path d="M70 62 H88 L85 76 H73 Z" fill="#fff" strokeWidth="1.5" />
      <path d="M74 58 Q72 54 75 50 M82 58 Q80 54 83 50" fill="none" stroke="#c9c6d8" strokeWidth="1.8" />
    </g>
  ),
  munieco: (
    <g {...L}>
      <circle cx="60" cy="88" r="24" fill={NIEVE} />
      <circle cx="60" cy="50" r="17" fill={NIEVE} />
      <path d="M44 38 H76 M50 38 V20 H70 V38" fill="#2b2738" />
      <circle cx="54" cy="48" r="2" fill={TINTA} /><circle cx="66" cy="48" r="2" fill={TINTA} />
      <path d="M60 53 L72 56 L60 58 Z" fill={FUEGO} strokeWidth="1.2" />
      <path d="M44 64 Q60 72 76 64 L74 70 Q60 78 46 70 Z M70 68 L74 84 L66 84 Z" fill="#d62839" strokeWidth="1.5" />
      <path d="M36 80 L18 66 M84 80 L102 66" stroke={MADERA} strokeWidth="3" />
      {[80, 92].map((y) => <circle key={y} cx="60" cy={y} r="2.5" fill={TINTA} />)}
    </g>
  ),
  letrero: (
    <g {...L}>
      <path d="M44 116 V60 M76 116 V60" stroke={MADERA} strokeWidth="6" />
      <rect x="10" y="28" width="100" height="40" rx="6" fill="#f3e3c3" />
      <path d="M10 34 Q12 26 22 28 H98 Q108 26 110 34" fill={NIEVE} strokeWidth="1.5" />
      <text x="60" y="47" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="10" fill={TINTA} stroke="none">NEVADO DE TOLUCA</text>
      <text x="60" y="61" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="800" fontSize="9" fill={OYAMEL} stroke="none">↑ CRÁTER Y LAGUNAS</text>
    </g>
  ),
};

/** Un lugar o una cosa del Nevado como decoración del mapa. */
export function NevadoDeco({ tipo }) {
  return <svg viewBox="0 0 120 120" aria-hidden="true" className="monumento sticker">{VOLCAN[tipo]}</svg>;
}

/** Copos de nieve de lado a lado (en lugar de banderines). */
export function CoposNieve() {
  return (
    <svg viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true" className="papel-picado copos-nieve">
      {Array.from({ length: 14 }, (_, i) => {
        const x = 14 + i * 28.5;
        const y = 12 + (i % 3) * 8;
        return (
          <g key={i} transform={`translate(${x} ${y})`} stroke="#9fc9f0" strokeWidth="2" strokeLinecap="round">
            {[0, 60, 120].map((a) => <path key={a} d="M0 -7 V7 M-2.5 -4.5 L0 -7 L2.5 -4.5 M-2.5 4.5 L0 7 L2.5 4.5" transform={`rotate(${a})`} />)}
          </g>
        );
      })}
    </svg>
  );
}

/** Título llamativo del mundo: letrero de madera con nieve arriba, carámbanos y un teporingo asomándose. */
export function TituloNevado() {
  return (
    <div className="fes-titulo nevado-titulo" role="img" aria-label="¡Bienvenido al Nevado de Toluca!">
      <svg viewBox="0 0 360 140" aria-hidden="true" className="sticker">
        <defs>
          <linearGradient id="nevado-titulo-fondo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b6fb6" /><stop offset="1" stopColor="#1f4f8f" />
          </linearGradient>
        </defs>
        <rect x="18" y="22" width="324" height="78" rx="18" fill="url(#nevado-titulo-fondo)" stroke={TINTA} strokeWidth="3" />
        <path d="M18 40 Q18 18 40 20 Q60 10 80 20 Q104 8 126 20 Q150 10 172 20 Q196 8 218 20 Q242 10 262 20 Q286 8 306 20 Q342 14 342 40 Q330 34 316 38 Q300 30 284 38 Q266 30 250 38 Q232 30 216 38 Q198 30 182 38 Q164 30 148 38 Q130 30 114 38 Q96 30 80 38 Q62 30 46 38 Q30 32 18 40 Z"
          fill={NIEVE} stroke={TINTA} strokeWidth="2.5" strokeLinejoin="round" />
        {[40, 72, 110, 150, 196, 236, 278, 318].map((x, i) => <path key={x} d={`M${x} 99 L${x + 4} ${110 + (i % 3) * 5} L${x + 8} 99`} fill="#dff1ff" stroke={TINTA} strokeWidth="1.8" strokeLinejoin="round" />)}
        <text x="180" y="58" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="14" letterSpacing="3" fill="#fff">¡BIENVENIDO AL</text>
        <text x="180" y="90" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="27" letterSpacing=".5" fill={NIEVE} stroke={TINTA} strokeWidth="1.5" paintOrder="stroke">NEVADO DE TOLUCA!</text>
        <rect x="78" y="112" width="204" height="24" rx="12" fill={NIEVE} stroke={TINTA} strokeWidth="2.5" />
        <text x="180" y="128.5" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="11.5" letterSpacing=".5" fill="#1f4f8f">MUNDO 4 · 4.º DE PRIMARIA</text>
        <g transform="translate(296 -6) scale(.9)"><Teporingo tamano={56} /></g>
        {[[10, 14], [350, 60], [8, 104], [352, 118]].map(([x, y]) => (
          <g key={x + y} transform={`translate(${x} ${y})`} stroke="#9fc9f0" strokeWidth="2" strokeLinecap="round">
            {[0, 60, 120].map((a) => <path key={a} d="M0 -6 V6" transform={`rotate(${a})`} />)}
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Sticker de la bolita (esfera) de nieve con el Nevado y un teporingo adentro: premio al terminar el Mundo 4. */
export function EsferaNieve({ tamano = 72 }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 100 100" aria-hidden="true" className="esfera-nieve sticker">
      <defs>
        <radialGradient id="esfera-vidrio" cx=".35" cy=".3" r=".75">
          <stop offset="0" stopColor="#ffffff" /><stop offset=".55" stopColor="#d9efff" /><stop offset="1" stopColor="#9fc9f0" />
        </radialGradient>
        <clipPath id="esfera-dentro"><circle cx="50" cy="44" r="34" /></clipPath>
      </defs>
      <circle cx="50" cy="44" r="36" fill="url(#esfera-vidrio)" {...L} strokeWidth="2.5" />
      <g clipPath="url(#esfera-dentro)">
        <path d="M10 78 L34 40 L44 50 L56 30 L90 78 Z" fill={ROCA} {...L} strokeWidth="1.5" />
        <path d="M34 40 L39 48 L35 50 L30 47 Z M56 30 L64 42 L58 41 L54 46 L49 40 Z" fill={NIEVE} {...L} strokeWidth="1.2" />
        <path d="M6 82 Q50 66 94 82 V90 H6 Z" fill={NIEVE} {...L} strokeWidth="1.5" />
        <g transform="translate(40 56) scale(.42)"><Teporingo tamano={60} /></g>
        {[[22, 22], [70, 18], [80, 36], [26, 40], [62, 54], [16, 58], [48, 18]].map(([x, y]) => <circle key={x + y} cx={x} cy={y} r="1.8" fill="#fff" stroke="#9fc9f0" strokeWidth=".6" />)}
      </g>
      <path d="M26 24 Q32 14 44 12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".9" />
      <path d="M18 78 H82 L88 96 H12 Z" fill="#7a4a2a" {...L} strokeWidth="2.5" />
      <rect x="30" y="84" width="40" height="7" rx="2" fill="#f5c542" stroke={TINTA} strokeWidth="1.2" />
    </svg>
  );
}

// ---------- Dibujos de los ejercicios de 4.º ----------

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : n);

/** Letrero de madera con un número (o un precio) grande. */
function Letrero({ numero, texto }) {
  return (
    <figure className="nev-letrero">
      <div className="nev-letrero-tabla"><b>{fmt(numero)}</b>{texto && <small>{texto}</small>}</div>
      <span className="nev-letrero-patas" aria-hidden="true"><i /><i /></span>
    </figure>
  );
}

/** Postes del sendero numerados (series, antecesor y sucesor). */
function Postes({ numeros }) {
  return (
    <div className="nev-postes" role="img" aria-label={`Postes: ${numeros.map((n) => (n === null ? 'falta' : n)).join(', ')}`}>
      {numeros.map((n, i) => (
        <span key={i} className={`nev-poste${n === null ? ' falta' : ''}`}>
          <b>{n === null ? '?' : fmt(n)}</b>
          <i aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

/** Cuadrículas de 100 para comparar decimales hasta centésimos. */
function Decimales({ valores }) {
  return (
    <div className="nev-decimales">
      {valores.map((v, k) => {
        const n = Math.round(v * 100);
        return (
          <figure key={k} className="nev-cuadricula">
            <div className="nev-cien" aria-hidden="true">{Array.from({ length: 100 }, (_, i) => <i key={i} className={i < n ? 'si' : undefined} />)}</div>
            <figcaption className="etq">{v}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

/** Tiras partidas en partes iguales, con algunas pintadas (fracciones). */
function Tiras({ tiras }) {
  return (
    <div className="nev-tiras">
      {tiras.map((t, k) => (
        <figure key={k} className="nev-tira">
          <div className="nev-tira-barra" style={{ gridTemplateColumns: `repeat(${t.den}, 1fr)` }} aria-hidden="true">
            {Array.from({ length: t.den }, (_, i) => <i key={i} className={i < t.num ? 'si' : undefined}>{i === 0 && t.rotulo ? t.rotulo : ''}</i>)}
          </div>
          {t.etiqueta && <figcaption className="etq">{t.etiqueta}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

/** Multiplicación por descomposición: a × 10 y a × 2, y la suma de los productos parciales. */
function Parciales({ a, partes }) {
  return (
    <div className="nev-parciales" role="img" aria-label={`${a} × ${partes.join(' + ')} con productos parciales`}>
      {partes.filter((p) => p > 0).map((p) => (
        <span key={p} className="nev-parcial"><b>{a} × {p}</b> = <i>?</i></span>
      ))}
      <span className="nev-parcial suma"><b>Suma</b> = <i>?</i></span>
    </div>
  );
}

/** Cubo (cubo de hielo) en perspectiva. */
function Cubo() {
  return (
    <svg className="canal-figura sticker" viewBox="0 0 200 160" role="img" aria-label="Cubo de hielo">
      <g stroke={TINTA} strokeWidth="3" strokeLinejoin="round">
        <path d="M60 50 L100 30 L150 50 L110 70 Z" fill="#f2fbff" />
        <path d="M60 50 L110 70 V130 L60 110 Z" fill="#cfe9ff" />
        <path d="M110 70 L150 50 V110 L110 130 Z" fill="#a9d6f7" />
      </g>
      <path d="M70 60 L84 66 M120 80 L132 74" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Tres desarrollos planos (A, B y C): solo uno se dobla para formar un cubo. */
function Desarrollos() {
  const cuadros = {
    A: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1]], // 5 cuadrados: le falta una cara
    B: [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]], // la cruz: sí forma un cubo
    C: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]], // 6 en fila: se encima
  };
  const lado = 18;
  return (
    <div className="nev-desarrollos">
      {Object.entries(cuadros).map(([letra, cs]) => {
        const w = (Math.max(...cs.map((c) => c[0])) + 1) * lado;
        const h = (Math.max(...cs.map((c) => c[1])) + 1) * lado;
        return (
          <figure key={letra} className="nev-desarrollo">
            <svg viewBox={`-2 -2 ${w + 4} ${h + 4}`} width={w + 4} height={h + 4} aria-hidden="true">
              {cs.map(([x, y]) => <rect key={`${x}${y}`} x={x * lado} y={y * lado} width={lado} height={lado} fill="#cfe9ff" stroke={TINTA} strokeWidth="2" />)}
            </svg>
            <figcaption className="etq">{letra}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

/** Prisma rectangular (hielera) en perspectiva. */
function Prisma() {
  return (
    <svg className="canal-figura sticker" viewBox="0 0 220 160" role="img" aria-label="Prisma rectangular">
      <g stroke={TINTA} strokeWidth="3" strokeLinejoin="round">
        <path d="M40 60 L80 36 L190 36 L150 60 Z" fill="#9fdcef" />
        <path d="M40 60 H150 V130 H40 Z" fill="#3aa6b9" />
        <path d="M150 60 L190 36 V106 L150 130 Z" fill="#2a8596" />
      </g>
      <rect x="80" y="76" width="30" height="10" rx="4" fill="#fff" stroke={TINTA} strokeWidth="2" />
    </svg>
  );
}

/** Retícula con un rectángulo de losetas pintado (área contando cuadritos). */
function Reticula({ filas, columnas }) {
  const total = { f: filas + 2, c: columnas + 2 };
  return (
    <div className="nev-reticula" style={{ gridTemplateColumns: `repeat(${total.c}, 22px)` }} role="img" aria-label={`Retícula con un rectángulo pintado de ${filas} filas`}>
      {Array.from({ length: total.f * total.c }, (_, i) => {
        const f = Math.floor(i / total.c);
        const c = i % total.c;
        const dentro = f >= 1 && f <= filas && c >= 1 && c <= columnas;
        return <i key={i} className={dentro ? 'si' : undefined} />;
      })}
    </div>
  );
}

const FORMAS = {
  cuadrado: '50,20 150,20 150,120 50,120',
  rectangulo: '20,40 180,40 180,120 20,120',
  rombo: '100,30 178,75 100,120 22,75',
  trapecio: '60,30 140,30 180,120 20,120',
};

/** Un cuadrilátero (cristal de hielo o letrero). */
function Cuadrilatero({ forma }) {
  return (
    <svg className="canal-figura sticker" viewBox="0 0 200 150" role="img" aria-label="Cuadrilátero">
      <polygon points={FORMAS[forma] || FORMAS.cuadrado} fill="#cfe9ff" stroke={TINTA} strokeWidth="3" strokeLinejoin="round" />
      <path d="M86 50 L100 40 L114 50 M86 100 L100 110 L114 100" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
    </svg>
  );
}

/** Dibuja el apoyo visual de un ejercicio del Nevado (o nada en los niveles abstractos sin dibujo). */
export function VisualNevado({ visual }) {
  if (!visual) return null;
  let dibujo = null;
  switch (visual.tipo) {
    case 'letrero': dibujo = <Letrero {...visual} />; break;
    case 'postes': dibujo = <Postes {...visual} />; break;
    case 'decimales': dibujo = <Decimales {...visual} />; break;
    case 'tiras': dibujo = <Tiras {...visual} />; break;
    case 'parciales': dibujo = <Parciales {...visual} />; break;
    case 'cubo': dibujo = <Cubo />; break;
    case 'desarrollos': dibujo = <Desarrollos />; break;
    case 'prisma': dibujo = <Prisma />; break;
    case 'reticula': dibujo = <Reticula {...visual} />; break;
    case 'cuadrilatero': dibujo = <Cuadrilatero {...visual} />; break;
    default: return <VisualFES visual={visual} />; // grupos, repartos, barras y tablas se comparten con la FES y el Centro
  }
  return <div className="visual-canal visual-cdmx visual-fes visual-nevado">{dibujo}</div>;
}
