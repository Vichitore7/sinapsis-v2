// Ilustraciones del Mundo 2, "El Centro de los Números" (CDMX): transportes de la tarjeta de movilidad integrada
// (los niveles), cacomixtles (los 3 premios de cada nivel), lugares representativos y los dibujos de los ejercicios.
// Colores fijos (no cambian con el tema): son dibujos tipo sticker.
import { useId } from 'react';

export const TINTA = '#1e1b3a';
const L = { stroke: TINTA, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' };
const GRIS = '#b9b5c9';

// ---------- Cacomixtle (el "pez" de este mundo) ----------

/** Cacomixtle: mamífero de la CDMX con cola de anillos y antifaz blanco. Apagado: solo contorno. */
export function Cacomixtle({ tamano = 34, encendido = true }) {
  const trazo = encendido ? TINTA : 'currentColor';
  const t = { stroke: trazo, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round', strokeDasharray: encendido ? undefined : '3 3' };
  const cuerpo = encendido ? '#c9b393' : 'none';
  return (
    <svg width={tamano} height={tamano * 0.72} viewBox="0 0 60 43" aria-hidden="true" className={encendido ? 'cacomixtle' : 'cacomixtle cacomixtle-apagado'}>
      {/* cola con anillos */}
      {[[8, 10], [6, 16], [7, 22], [10, 27], [15, 30]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="5" ry="4" fill={encendido ? (i % 2 ? '#f3ede2' : '#3a3550') : 'none'} {...t} />
      ))}
      <ellipse cx="28" cy="30" rx="15" ry="9" fill={cuerpo} {...t} />
      <path d="M18 37 V41 M36 37 V41" {...t} />
      {/* cabeza con orejas grandes y antifaz */}
      <path d="M38 14 L40 4 L46 11 M50 11 L56 4 L57 14" fill={cuerpo} {...t} />
      <ellipse cx="47" cy="19" rx="11" ry="9" fill={cuerpo} {...t} />
      {encendido && <><ellipse cx="43" cy="18" rx="3.6" ry="3" fill="#fff" /><ellipse cx="51" cy="18" rx="3.6" ry="3" fill="#fff" /></>}
      <circle cx="43" cy="18" r="1.7" fill={encendido ? TINTA : 'none'} stroke={encendido ? 'none' : trazo} />
      <circle cx="51" cy="18" r="1.7" fill={encendido ? TINTA : 'none'} stroke={encendido ? 'none' : trazo} />
      <circle cx="47" cy="23" r="1.6" fill={encendido ? TINTA : 'none'} stroke={encendido ? 'none' : trazo} />
    </svg>
  );
}

/** Los 3 cacomixtles de un nivel: uno por ejercicio resuelto. */
export function CacomixtlesNivel({ llenos, tamano = 30 }) {
  return (
    <span className="peces-nivel cacomixtles-nivel" role="img" aria-label={`${llenos} de 3 cacomixtles`}>
      {[0, 1, 2].map((i) => <Cacomixtle key={i} tamano={tamano} encendido={i < llenos} />)}
    </span>
  );
}

// ---------- Transportes de la tarjeta de movilidad integrada (los niveles del mapa) ----------

export const TRANSPORTES = [
  { id: 'metro', nombre: 'Metro', color: '#f37021' },
  { id: 'metrobus', nombre: 'Metrobús', color: '#c8102e' },
  { id: 'trolebus', nombre: 'Trolebús', color: '#0a7cc1' },
  { id: 'tren-ligero', nombre: 'Tren Ligero', color: '#2f9e8f' },
  { id: 'cablebus', nombre: 'Cablebús', color: '#7b5cd6' },
  { id: 'rtp', nombre: 'RTP', color: '#2e9e44' },
  { id: 'ecobici', nombre: 'Ecobici', color: '#d50032' },
];

function Ventanas({ x0, x1, y, alto = 12, cada = 14 }) {
  const n = Math.floor((x1 - x0) / cada);
  return <>{Array.from({ length: n }, (_, i) => <rect key={i} x={x0 + i * cada + 2} y={y} width={cada - 4} height={alto} rx="2" fill="#dff4ff" {...L} strokeWidth="1.5" />)}</>;
}

function Llantas({ xs, y = 84 }) {
  return <>{xs.map((x) => <g key={x}><circle cx={x} cy={y} r="7" fill={TINTA} /><circle cx={x} cy={y} r="2.5" fill="#c9c6d8" /></g>)}</>;
}

/** Dibujo de cada transporte (viewBox 140×104). `c` es el color principal. */
function Vehiculo({ tipo, c }) {
  switch (tipo) {
    case 'metro':
      return (
        <g>
          <rect x="10" y="40" width="120" height="42" rx="10" fill={c} {...L} />
          <rect x="10" y="66" width="120" height="6" fill="#fff" opacity=".85" />
          <Ventanas x0={20} x1={122} y={47} />
          <path d="M66 46 V80 M74 46 V80" stroke={TINTA} strokeWidth="1.5" />
          <Llantas xs={[28, 48, 92, 112]} y={86} />
        </g>
      );
    case 'metrobus':
      return (
        <g>
          <rect x="6" y="40" width="62" height="42" rx="8" fill={c} {...L} />
          <rect x="72" y="40" width="62" height="42" rx="8" fill={c} {...L} />
          <path d="M68 44 h4 v34 h-4 M68 50 h4 M68 56 h4 M68 62 h4 M68 68 h4" fill="#3a3550" stroke={TINTA} strokeWidth="1.5" />
          <Ventanas x0={12} x1={64} y={47} cada={13} /><Ventanas x0={76} x1={130} y={47} cada={13} />
          <Llantas xs={[22, 56, 88, 120]} y={86} />
        </g>
      );
    case 'trolebus':
      return (
        <g>
          <path d="M40 40 L70 8 M56 40 L86 8" stroke={TINTA} strokeWidth="3" />
          <path d="M60 6 H100" stroke={TINTA} strokeWidth="1.5" strokeDasharray="4 3" />
          <rect x="10" y="40" width="120" height="42" rx="12" fill={c} {...L} />
          <rect x="10" y="70" width="120" height="5" fill="#fff" opacity=".85" />
          <Ventanas x0={20} x1={122} y={47} />
          <Llantas xs={[34, 108]} y={86} />
        </g>
      );
    case 'tren-ligero':
      return (
        <g>
          <path d="M60 40 L70 24 L80 40 M62 24 H78" stroke={TINTA} strokeWidth="2.5" fill="none" />
          <path d="M10 82 Q10 40 40 40 H100 Q130 40 130 82 Z" fill="#f4f7fb" {...L} />
          <rect x="10" y="64" width="120" height="8" fill={c} />
          <Ventanas x0={24} x1={118} y={47} />
          <path d="M4 92 H136" stroke={TINTA} strokeWidth="2.5" />
          <Llantas xs={[34, 106]} y={86} />
        </g>
      );
    case 'cablebus':
      return (
        <g>
          <path d="M0 10 L140 22" stroke={TINTA} strokeWidth="2.5" />
          <path d="M70 16 V38" stroke={TINTA} strokeWidth="3" />
          <rect x="62" y="12" width="16" height="8" rx="2" fill="#3a3550" />
          <path d="M34 40 H106 L112 86 Q70 96 28 86 Z" fill={c} {...L} />
          <rect x="40" y="48" width="60" height="20" rx="4" fill="#dff4ff" {...L} strokeWidth="1.5" />
          <path d="M70 48 V68" stroke={TINTA} strokeWidth="1.5" />
        </g>
      );
    case 'rtp':
      return (
        <g>
          <rect x="10" y="38" width="120" height="44" rx="10" fill={c} {...L} />
          <rect x="10" y="62" width="120" height="8" fill="#ffd166" />
          <Ventanas x0={22} x1={124} y={45} />
          <rect x="112" y="44" width="14" height="22" rx="2" fill="#dff4ff" {...L} strokeWidth="1.5" />
          <Llantas xs={[34, 104]} y={86} />
        </g>
      );
    case 'ecobici':
      return (
        <g {...L} fill="none" strokeWidth="3">
          <circle cx="36" cy="72" r="18" />
          <circle cx="104" cy="72" r="18" />
          <path d="M36 72 L60 44 L90 44 L104 72 M60 44 L72 72 L36 72 M90 44 L86 34 M54 38 H68" stroke={c} strokeWidth="5" />
          <path d="M84 30 H96" stroke={TINTA} strokeWidth="4" />
          <rect x="96" y="40" width="20" height="12" rx="2" fill={c} stroke={TINTA} strokeWidth="2" />
        </g>
      );
    default:
      return null;
  }
}

/** Transporte de un nivel en el mapa, con letrero de estación arriba (ahí va el número del nivel). */
export function TransporteNivel({ tipo = 'metro', estado = 'bloq', tamano = 124, children }) {
  const info = TRANSPORTES.find((t) => t.id === tipo) || TRANSPORTES[0];
  const bloq = estado === 'bloq';
  return (
    <span className={`trajinera-nivel transporte-nivel trajinera-${estado}`} style={{ width: tamano, height: tamano * 0.74 }}>
      <svg width={tamano} height={tamano * 0.74} viewBox="0 0 140 104" aria-hidden="true" className={bloq ? 'transporte-gris' : undefined}>
        <ellipse cx="70" cy="98" rx="62" ry="5" fill="#000" opacity=".15" />
        <Vehiculo tipo={tipo} c={bloq ? GRIS : info.color} />
      </svg>
      <span className="trajinera-placa transporte-placa" style={{ background: bloq ? '#a29db6' : info.color }}>{children}</span>
    </span>
  );
}

// ---------- Lugares representativos (decoran el mapa) ----------

const MONUMENTOS = {
  angel: (
    <g {...L}>
      <rect x="44" y="104" width="32" height="12" fill="#e8e1d1" />
      <rect x="50" y="94" width="20" height="10" fill="#e8e1d1" />
      <rect x="55" y="34" width="10" height="60" fill="#f2ecdf" />
      <path d="M55 46 H65 M55 60 H65 M55 74 H65" stroke="#c9bfa8" />
      <rect x="52" y="30" width="16" height="6" fill="#e8e1d1" />
      <path d="M60 6 L64 16 L60 30 L56 16 Z" fill="#f5c542" />
      <path d="M60 14 Q46 4 42 16 Q52 14 60 20 Q68 14 78 16 Q74 4 60 14 Z" fill="#f5c542" />
      <circle cx="60" cy="8" r="3" fill="#f5c542" />
    </g>
  ),
  palacio: (
    <g {...L}>
      <rect x="4" y="54" width="112" height="56" fill="#c8553d" />
      <rect x="4" y="50" width="112" height="6" fill="#e8d6b0" />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x={12 + i * 18} y="64" width="9" height="14" fill="#f4e1c1" strokeWidth="1.5" />)}
      {Array.from({ length: 6 }, (_, i) => <rect key={`b${i}`} x={12 + i * 18} y="86" width="9" height="14" fill="#f4e1c1" strokeWidth="1.5" />)}
      <rect x="48" y="36" width="24" height="16" fill="#e8d6b0" />
      <path d="M60 36 V8" strokeWidth="2" />
      <rect x="60" y="8" width="7" height="12" fill="#2e9e44" strokeWidth="1" />
      <rect x="67" y="8" width="7" height="12" fill="#fff" strokeWidth="1" />
      <rect x="74" y="8" width="7" height="12" fill="#d62839" strokeWidth="1" />
    </g>
  ),
  castillo: (
    <g {...L}>
      <path d="M0 116 Q30 70 60 72 Q90 70 120 116 Z" fill="#5fae5a" />
      <rect x="26" y="52" width="68" height="26" fill="#efe6d4" />
      {Array.from({ length: 5 }, (_, i) => <rect key={i} x={32 + i * 12} y="58" width="6" height="12" fill="#7ab8d9" strokeWidth="1.2" />)}
      <rect x="74" y="28" width="16" height="26" fill="#efe6d4" />
      <path d="M72 28 H92 V22 H86 V26 H82 V22 H78 V26 H74 V22 H72 Z" fill="#efe6d4" />
      <path d="M82 22 V8 M82 8 H92 V14 H82" fill="#d62839" />
    </g>
  ),
  bellas: (
    <g {...L}>
      <rect x="12" y="62" width="96" height="48" fill="#f4f1ea" />
      {Array.from({ length: 7 }, (_, i) => <rect key={i} x={18 + i * 13} y="70" width="5" height="34" fill="#e2dccd" strokeWidth="1.2" />)}
      <path d="M30 62 Q30 20 60 16 Q90 20 90 62 Z" fill="#f2a93b" />
      <path d="M44 62 Q46 30 60 22 Q74 30 76 62" fill="none" stroke="#c97c1a" strokeWidth="2" />
      <circle cx="60" cy="12" r="5" fill="#f5c542" />
      <path d="M8 62 H112" strokeWidth="3" />
    </g>
  ),
  revolucion: (
    <g {...L}>
      <rect x="14" y="58" width="22" height="54" fill="#8c8576" />
      <rect x="84" y="58" width="22" height="54" fill="#8c8576" />
      <path d="M14 58 H106 V70 H14 Z" fill="#a39b89" />
      <path d="M36 112 V84 Q60 64 84 84 V112" fill="#fff" opacity=".5" />
      <path d="M30 58 Q30 18 60 14 Q90 18 90 58 Z" fill="#5fae8f" />
      <rect x="56" y="4" width="8" height="12" fill="#5fae8f" />
    </g>
  ),
  kiosco: (
    <g {...L}>
      <rect x="20" y="96" width="80" height="12" fill="#e8d6b0" />
      {[28, 46, 74, 92].map((x) => <rect key={x} x={x} y="60" width="5" height="36" fill="#f4f1ea" />)}
      <path d="M14 62 L60 26 L106 62 Z" fill="#2e9e44" />
      <path d="M60 26 V10" strokeWidth="2.5" />
      <circle cx="60" cy="8" r="4" fill="#f5c542" />
      <path d="M22 84 Q60 74 98 84" fill="none" stroke="#c8553d" strokeWidth="3" />
    </g>
  ),
  torre: (
    <g {...L}>
      <rect x="40" y="26" width="40" height="88" fill="#8fb3c7" />
      {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M40 ${34 + i * 8} H80`} stroke="#5e8aa3" strokeWidth="1.5" />)}
      <path d="M44 26 L50 14 H70 L76 26 Z" fill="#7aa2b8" />
      <path d="M60 14 V0" strokeWidth="2.5" />
    </g>
  ),
  jacaranda: (
    <g {...L}>
      <path d="M58 116 V70 M58 84 L44 70 M58 90 L72 74" stroke="#7a5230" strokeWidth="5" fill="none" />
      {[[40, 56, 20], [62, 44, 24], [84, 58, 18], [54, 66, 16], [74, 70, 15]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? '#a77bd8' : '#8e5fcf'} strokeWidth="1.5" />
      ))}
      {[[48, 50], [70, 38], [86, 60], [60, 70]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill="#e5d4ff" stroke="none" />)}
    </g>
  ),
};

// Cosas chicas de la vida en la calle (viewBox 120×120), para llenar los huecos del pasto.
const COSAS = {
  tacos: (
    <g {...L}>
      <path d="M8 40 H112 L104 56 H16 Z" fill="#ff4fa0" />
      {[22, 46, 70, 94].map((x) => <path key={x} d={`M${x} 40 L${x + 8} 56 H${x - 4} Z`} fill="#fff" strokeWidth="1" />)}
      <path d="M20 56 V104 M100 56 V104" strokeWidth="3" />
      <rect x="14" y="78" width="92" height="28" rx="3" fill="#ffd166" />
      <text x="60" y="97" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="15" fill={TINTA} stroke="none">TACOS</text>
      <path d="M44 78 L52 58 L60 78 Z" fill="#d62839" />
      <path d="M52 58 V52" strokeWidth="2.5" />
      <circle cx="80" cy="72" r="6" fill="#ffe8b3" />
    </g>
  ),
  elotes: (
    <g {...L}>
      <path d="M60 44 V18 M30 22 Q60 2 90 22 Z" fill="#2e9e44" />
      <rect x="22" y="44" width="76" height="44" rx="6" fill="#ffd166" />
      <text x="60" y="71" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="13" fill={TINTA} stroke="none">ELOTES</text>
      <path d="M34 38 L40 44 M46 36 L48 44" stroke="#f5c542" strokeWidth="5" />
      <circle cx="36" cy="96" r="9" fill={TINTA} /><circle cx="84" cy="96" r="9" fill={TINTA} />
      <path d="M98 54 L112 46" strokeWidth="3" />
    </g>
  ),
  globero: (
    <g {...L}>
      {[[38, 30, '#ff4fa0'], [60, 20, '#3a86ff'], [82, 30, '#ffd166'], [48, 48, '#2e9e44'], [72, 48, '#f37021'], [60, 36, '#a77bd8']].map(([x, y, c], i) => (
        <g key={i}><path d={`M${x} ${y + 12} L60 92`} strokeWidth="1.2" /><ellipse cx={x} cy={y} rx="11" ry="13" fill={c} /></g>
      ))}
      <path d="M60 92 V116" strokeWidth="3" />
    </g>
  ),
  organillero: (
    <g {...L}>
      <path d="M46 104 L40 116 M74 104 L80 116 M60 104 V116" strokeWidth="3" />
      <rect x="30" y="50" width="60" height="54" rx="6" fill="#8b5a2b" />
      <rect x="38" y="58" width="44" height="30" rx="3" fill="#c98a4a" />
      {[44, 52, 60, 68, 76].map((x) => <path key={x} d={`M${x} 60 V86`} stroke="#f5c542" strokeWidth="3" />)}
      <path d="M90 70 H102 V58" strokeWidth="3" />
      <path d="M30 50 Q60 34 90 50" fill="#7a5230" />
      <rect x="44" y="24" width="32" height="12" rx="3" fill="#7a5230" />
      <rect x="40" y="34" width="40" height="5" rx="2" fill={TINTA} />
    </g>
  ),
  taxi: (
    <g {...L}>
      <path d="M12 82 V66 Q14 58 26 56 L38 40 H82 L96 56 Q108 58 108 66 V82 Z" fill="#ff4fa0" />
      <path d="M42 44 H78 L88 56 H32 Z" fill="#dff4ff" />
      <path d="M60 44 V56" />
      <rect x="12" y="66" width="96" height="10" fill="#fff" />
      <rect x="50" y="30" width="20" height="10" rx="2" fill="#fff" />
      <circle cx="32" cy="86" r="10" fill={TINTA} /><circle cx="88" cy="86" r="10" fill={TINTA} />
      <circle cx="32" cy="86" r="4" fill="#c9c6d8" /><circle cx="88" cy="86" r="4" fill="#c9c6d8" />
    </g>
  ),
  farol: (
    <g {...L}>
      <path d="M52 116 H68 M56 116 V44 M64 116 V44" fill="none" stroke={TINTA} strokeWidth="2" />
      <rect x="56" y="44" width="8" height="72" fill="#2b2738" />
      <path d="M44 22 H76 L70 44 H50 Z" fill="#ffd166" />
      <path d="M40 22 L60 8 L80 22 Z" fill="#2b2738" />
      <path d="M60 22 V44" stroke="#c97c1a" strokeWidth="1.5" />
    </g>
  ),
  banca: (
    <g {...L}>
      <rect x="14" y="46" width="92" height="9" rx="3" fill="#2e9e44" />
      <rect x="14" y="60" width="92" height="9" rx="3" fill="#2e9e44" />
      <rect x="10" y="76" width="100" height="10" rx="3" fill="#2e9e44" />
      <path d="M22 86 V108 M98 86 V108 M22 50 V86 M98 50 V86" strokeWidth="4" />
    </g>
  ),
  metro: (
    <g {...L}>
      <rect x="56" y="40" width="8" height="76" fill="#4b4b55" />
      <rect x="26" y="10" width="68" height="40" rx="8" fill="#f37021" />
      <path d="M42 42 V18 L60 34 L78 18 V42" fill="none" stroke="#fff" strokeWidth="5" />
    </g>
  ),
  xolo: (
    <g {...L}>
      <path d="M30 104 V84 M42 104 V86 M76 104 V86 M88 104 V84" strokeWidth="5" stroke="#3a3550" />
      <ellipse cx="60" cy="78" rx="34" ry="16" fill="#4b4b55" />
      <path d="M26 74 Q12 62 16 50" fill="none" strokeWidth="4" stroke="#3a3550" />
      <path d="M88 70 Q98 52 96 44 L90 30 L100 40 L108 30 L106 46 Q108 60 98 74 Z" fill="#4b4b55" />
      <path d="M90 30 L96 36 M108 30 L102 36" />
      <circle cx="102" cy="52" r="2.5" fill="#fff" stroke="none" />
      <path d="M96 26 Q100 18 104 26" fill="none" stroke="#f5f0e6" strokeWidth="3" />
    </g>
  ),
  alebrije: (
    <g {...L}>
      <path d="M28 70 Q8 50 20 30 Q34 46 40 60 Z" fill="#3a86ff" />
      <path d="M92 70 Q112 50 100 30 Q86 46 80 60 Z" fill="#ffd166" />
      <ellipse cx="60" cy="74" rx="32" ry="20" fill="#ff4fa0" />
      {[[48, 70, '#ffd166'], [60, 80, '#2e9e44'], [72, 68, '#3a86ff'], [56, 64, '#fff']].map(([x, y, c]) => <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill={c} strokeWidth="1" />)}
      <path d="M86 70 Q104 66 104 50 Q100 40 92 46" fill="#a77bd8" />
      <circle cx="98" cy="48" r="2.5" fill={TINTA} />
      <path d="M28 78 Q12 92 20 104 Q26 96 34 92" fill="#2e9e44" />
      <path d="M44 92 V106 M76 92 V106" strokeWidth="4" stroke="#f37021" />
    </g>
  ),
};

/** Un lugar representativo de la CDMX (o una cosa de la vida en la calle) como decoración del mapa. */
export function Monumento({ tipo }) {
  return <svg viewBox="0 0 120 120" aria-hidden="true" className="monumento">{MONUMENTOS[tipo] || COSAS[tipo]}</svg>;
}

/** Sticker de la Tarjeta del Metro (tarjeta de movilidad integrada): premio al terminar el Mundo 2. */
export function TarjetaMetro({ tamano = 64 }) {
  return (
    <svg width={tamano} height={tamano * 0.66} viewBox="0 0 100 66" aria-hidden="true" className="tarjeta-metro">
      <rect x="3" y="3" width="94" height="60" rx="9" fill="#f37021" {...L} strokeWidth="3" />
      <path d="M3 44 Q50 30 97 44 V54 Q97 63 88 63 H12 Q3 63 3 54 Z" fill="#e4007c" />
      <rect x="12" y="12" width="16" height="12" rx="2" fill="#f5c542" {...L} strokeWidth="1.5" />
      <path d="M16 16 H24 M16 20 H24" stroke="#c97c1a" strokeWidth="1.2" />
      <path d="M58 30 V12 L68 23 L78 12 V30" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinejoin="round" />
      <text x="50" y="56" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="8.5" fill="#fff">MOVILIDAD INTEGRADA</text>
    </svg>
  );
}

/** Papel picado de colores colgado de lado a lado. */
export function PapelPicado() {
  const colores = ['#ff4fa0', '#ffd166', '#2e9e44', '#3a86ff', '#f37021', '#a77bd8'];
  return (
    <svg viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true" className="papel-picado">
      <path d="M0 6 Q200 22 400 6" fill="none" stroke={TINTA} strokeWidth="1.5" />
      {Array.from({ length: 14 }, (_, i) => {
        const x = 8 + i * 28.5;
        const y = 6 + Math.sin((x / 400) * Math.PI) * 15;
        return (
          <g key={i}>
            <path d={`M${x} ${y} H${x + 20} V${y + 20} L${x + 15} ${y + 16} L${x + 10} ${y + 20} L${x + 5} ${y + 16} L${x} ${y + 20} Z`} fill={colores[i % colores.length]} />
            <circle cx={x + 10} cy={y + 8} r="2.5" fill="#fff" opacity=".8" />
          </g>
        );
      })}
    </svg>
  );
}

// ---------- Dibujos de los ejercicios de 2.º ----------

function Persona({ t = 26 }) {
  return (
    <svg width={t} height={t} viewBox="0 0 30 30" aria-hidden="true">
      <path d="M5 29 Q5 17 15 17 Q25 17 25 29 Z" fill="#7b5cd6" {...L} strokeWidth="1.5" />
      <circle cx="15" cy="10" r="6.5" fill="#f6c9a0" {...L} strokeWidth="1.5" />
    </svg>
  );
}

function Boleto({ t = 28 }) {
  return (
    <svg width={t} height={t * 0.62} viewBox="0 0 40 25" aria-hidden="true">
      <path d="M2 3 H38 V9 Q34 12.5 38 16 V22 H2 V16 Q6 12.5 2 9 Z" fill="#f37021" {...L} strokeWidth="1.5" />
      <text x="20" y="16.5" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="9" fill="#fff">M</text>
    </svg>
  );
}

function Libro({ t = 24 }) {
  return (
    <svg width={t} height={t} viewBox="0 0 30 30" aria-hidden="true">
      <path d="M4 6 Q10 3 15 7 Q20 3 26 6 V25 Q20 22 15 26 Q10 22 4 25 Z" fill="#1d3f8f" {...L} strokeWidth="1.5" />
      <path d="M15 7 V26" stroke="#f5b700" strokeWidth="2" />
    </svg>
  );
}

const ICONOS_PICTO = { persona: Persona, boleto: Boleto, libro: Libro };

function Pictograma({ titulo, icono, valor, filas }) {
  const Icono = ICONOS_PICTO[icono] || Persona;
  return (
    <figure className="cdmx-picto">
      <figcaption className="etq">{titulo}</figcaption>
      <table>
        <tbody>
          {filas.map((f) => (
            <tr key={f.etiqueta}>
              <th scope="row">{f.etiqueta}</th>
              <td>{Array.from({ length: f.cantidad }, (_, i) => <Icono key={i} />)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="cdmx-leyenda">Cada <Icono t={22} /> = {valor}</p>
    </figure>
  );
}

/** Cajas de 100 boletos, tiras de 10 y boletos sueltos (valor posicional con objetos). */
function Paquetes({ centenas, decenas, unidades, chico = false }) {
  return (
    <div className={`cdmx-paquetes${chico ? ' chico' : ''}`}>
      {centenas > 0 && (
        <div className="cdmx-grupo">{Array.from({ length: centenas }, (_, i) => <span key={i} className="cdmx-caja"><b>100</b></span>)}</div>
      )}
      {decenas > 0 && (
        <div className="cdmx-grupo">{Array.from({ length: decenas }, (_, i) => <span key={i} className="cdmx-tira" aria-hidden="true">{Array.from({ length: 10 }, (_, k) => <i key={k} />)}</span>)}</div>
      )}
      {unidades > 0 && (
        <div className="cdmx-grupo">{Array.from({ length: unidades }, (_, i) => <Boleto key={i} t={chico ? 20 : 26} />)}</div>
      )}
    </div>
  );
}

function CompararPaquetes({ izquierda, derecha }) {
  return (
    <div className="cdmx-comparar">
      <div className="cdmx-lado"><b className="etq">{izquierda.etiqueta}</b><Paquetes {...izquierda} chico /></div>
      <span className="cdmx-signo-hueco" aria-label="Aquí va el signo">?</span>
      <div className="cdmx-lado"><b className="etq">{derecha.etiqueta}</b><Paquetes {...derecha} chico /></div>
    </div>
  );
}

function Vagones({ numeros }) {
  return (
    <div className="cdmx-tren" role="img" aria-label={`Vagones: ${numeros.map((n) => (n === null ? 'falta' : n)).join(', ')}`}>
      {numeros.map((n, i) => (
        <span key={i} className={`cdmx-vagon${n === null ? ' falta' : ''}`}>
          <span className="cdmx-vagon-num">{n === null ? '?' : n}</span>
          <span className="cdmx-vagon-ruedas" aria-hidden="true"><i /><i /></span>
        </span>
      ))}
    </div>
  );
}

function Recta({ desde, hasta, paso, etiquetas = 1, inicio }) {
  const n = Math.round((hasta - desde) / paso);
  const x = (v) => ((v - desde) / (hasta - desde)) * 300;
  return (
    <svg className="canal-recta" viewBox="-16 0 332 74" role="img" aria-label={`Recta numérica del ${desde} al ${hasta}; el Metrobús empieza en el ${inicio}`}>
      <path d="M0 44 H300" stroke={TINTA} strokeWidth="3" strokeLinecap="round" />
      {Array.from({ length: n + 1 }, (_, i) => {
        const v = desde + i * paso;
        const conEtiqueta = (i % etiquetas) === 0;
        return (
          <g key={i}>
            <path d={`M${x(v)} ${conEtiqueta ? 36 : 39} V${conEtiqueta ? 52 : 49}`} stroke={TINTA} strokeWidth={conEtiqueta ? 2.5 : 1.5} />
            {conEtiqueta && <text x={x(v)} y="68" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="800" fontSize="12" fill={TINTA}>{v}</text>}
          </g>
        );
      })}
      <g transform={`translate(${x(inicio) - 14} 12)`}>
        <rect width="28" height="16" rx="4" fill="#c8102e" stroke={TINTA} strokeWidth="2" />
        <rect x="4" y="3" width="20" height="6" rx="1" fill="#dff4ff" />
        <circle cx="7" cy="18" r="3" fill={TINTA} /><circle cx="21" cy="18" r="3" fill={TINTA} />
      </g>
      <circle cx={x(inicio)} cy="44" r="6" fill="#c8102e" stroke={TINTA} strokeWidth="2" />
    </svg>
  );
}

/** Algoritmo en columnas con tabla de valor: decenas y unidades (2.º) o hasta millares (3.º). */
function TablaValor({ filas, op }) {
  const cols = Math.max(2, ...filas.map((n) => String(n).length));
  const CAB = ['UM', 'C', 'D', 'U'].slice(4 - cols);
  const CLASE = ['m', 'c', 'd', 'u'].slice(4 - cols);
  const cifras = (n) => String(n).padStart(cols, ' ').split('');
  return (
    <div className="cdmx-algoritmo" style={{ gridTemplateColumns: `repeat(${cols + 1}, ${cols > 2 ? 44 : 52}px)` }}
      role="img" aria-label={`${filas[0]} ${op} ${filas[1]} en columnas de valor posicional`}>
      <span />{CAB.map((c, i) => <span key={c} className={`cab ${CLASE[i]}`}>{c}</span>)}
      {filas.map((n, i) => [
        <span key={`s${i}`} className="signo">{i === 1 ? op : ''}</span>,
        ...cifras(n).map((d, k) => <span key={`${i}-${k}`} className={CLASE[k]}>{d}</span>),
      ])}
      <span className="raya" />
      <span />{CLASE.map((c) => <span key={c} className={`${c} falta`}>?</span>)}
    </div>
  );
}

/** Bloques base 10: placas de 100, barras de 10 y cubitos de 1 (pictórico). */
function Bloques({ centenas, decenas, unidades }) {
  return (
    <div className="cdmx-bloques">
      {centenas > 0 && <div className="cdmx-grupo">{Array.from({ length: centenas }, (_, i) => <span key={i} className="bloque-placa" />)}</div>}
      {decenas > 0 && <div className="cdmx-grupo">{Array.from({ length: decenas }, (_, i) => <span key={i} className="bloque-barra" />)}</div>}
      {unidades > 0 && <div className="cdmx-grupo cubitos">{Array.from({ length: unidades }, (_, i) => <span key={i} className="bloque-cubo" />)}</div>}
    </div>
  );
}

const COLOR_COSA = { dulce: '#ff6fa5', elote: '#ffd166', globo: '#3a86ff' };

function GruposIguales({ grupos, cada, objeto }) {
  return (
    <div className="cdmx-grupos">
      {Array.from({ length: grupos }, (_, g) => (
        <span key={g} className="cdmx-bolsita">
          {Array.from({ length: cada }, (_, i) => <i key={i} style={{ background: COLOR_COSA[objeto] || '#ff6fa5' }} />)}
        </span>
      ))}
    </div>
  );
}

function Poligono({ lados }) {
  const pts = Array.from({ length: lados }, (_, i) => {
    const a = (2 * Math.PI * i) / lados - Math.PI / 2;
    return [100 + 62 * Math.cos(a), 78 + 62 * Math.sin(a)];
  });
  return (
    <svg className="canal-figura" viewBox="0 0 200 150" role="img" aria-label="Figura geométrica">
      <polygon points={pts.map((p) => p.join(',')).join(' ')} fill="#cfe8ff" stroke={TINTA} strokeWidth="3" strokeLinejoin="round" />
      {pts.map(([px, py], i) => <circle key={i} cx={px} cy={py} r="4" fill={TINTA} />)}
    </svg>
  );
}

function Tabla({ titulo, columnas, filas }) {
  return (
    <figure className="cdmx-tabla">
      <figcaption className="etq">{titulo}</figcaption>
      <table>
        <thead><tr>{columnas.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{filas.map((f) => <tr key={f[0]}>{f.map((v, i) => <td key={i}>{v}</td>)}</tr>)}</tbody>
      </table>
    </figure>
  );
}

function Reloj({ hora, minutos }) {
  const id = `r-${useId().replace(/:/g, '')}`;
  const aHora = ((hora % 12) + minutos / 60) * 30 - 90;
  const aMin = minutos * 6 - 90;
  const punta = (ang, largo) => [100 + largo * Math.cos((ang * Math.PI) / 180), 80 + largo * Math.sin((ang * Math.PI) / 180)];
  const [hx, hy] = punta(aHora, 34);
  const [mx, my] = punta(aMin, 52);
  return (
    <svg className="canal-figura" viewBox="0 0 200 160" role="img" aria-label="Reloj de manecillas">
      <defs><radialGradient id={id}><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#f1eee7" /></radialGradient></defs>
      <circle cx="100" cy="80" r="70" fill={`url(#${id})`} stroke={TINTA} strokeWidth="4" />
      {Array.from({ length: 12 }, (_, i) => {
        const [tx, ty] = punta(i * 30 - 60, 56);
        return <text key={i} x={tx} y={ty + 5} textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="800" fontSize="14" fill={TINTA}>{i + 1}</text>;
      })}
      <path d={`M100 80 L${hx} ${hy}`} stroke={TINTA} strokeWidth="7" strokeLinecap="round" />
      <path d={`M100 80 L${mx} ${my}`} stroke="#c8102e" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="80" r="5" fill={TINTA} />
    </svg>
  );
}

/** Dibuja el apoyo visual de un ejercicio del Centro (o nada en los niveles abstractos sin dibujo). */
export function VisualCDMX({ visual }) {
  if (!visual) return null;
  let dibujo = null;
  switch (visual.tipo) {
    case 'pictograma': dibujo = <Pictograma {...visual} />; break;
    case 'paquetes': dibujo = <Paquetes {...visual} />; break;
    case 'comparar_paquetes': dibujo = <CompararPaquetes {...visual} />; break;
    case 'vagones': dibujo = <Vagones {...visual} />; break;
    case 'recta': dibujo = <Recta {...visual} />; break;
    case 'tabla_valor': dibujo = <TablaValor {...visual} />; break;
    case 'bloques': dibujo = <Bloques {...visual} />; break;
    case 'grupos_iguales': dibujo = <GruposIguales {...visual} />; break;
    case 'poligono': dibujo = <Poligono {...visual} />; break;
    case 'tabla': dibujo = <Tabla {...visual} />; break;
    case 'reloj': dibujo = <Reloj {...visual} />; break;
    default: return null;
  }
  return <div className="visual-canal visual-cdmx">{dibujo}</div>;
}
