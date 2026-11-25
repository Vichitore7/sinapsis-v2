// Ilustraciones del Mundo 3, "La FES de los Números" (FES Aragón): lugares del campus (los niveles), tlacuaches
// (los 3 premios de cada nivel), la decoración del campus, el título del mundo, el peluche de la mascota
// y los dibujos de los ejercicios de 3.º. Colores fijos (no cambian con el tema): son dibujos tipo sticker.
import { useId } from 'react';
import { TINTA, VisualCDMX } from './CDMX.jsx';

const L = { stroke: TINTA, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' };
const GRIS = '#b9b5c9';
export const AZUL = '#1d3f8f';
export const ORO = '#f5b700';
const AZUL_CLARO = '#3d6fd1';
const MORADO = '#7b3fb8';
const PIEL = ['#f6c9a0', '#d9a27a', '#a8714f', '#f1d1b5'];

// ---------- Tlacuache (el "pez" de este mundo) ----------

/** Tlacuache: el marsupial de México, gris con cara blanca, orejas negras y cola larga sin pelo. Apagado: solo contorno. */
export function Tlacuache({ tamano = 34, encendido = true }) {
  const trazo = encendido ? TINTA : 'currentColor';
  const t = { stroke: trazo, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round', strokeDasharray: encendido ? undefined : '3 3' };
  const f = (c) => (encendido ? c : 'none');
  return (
    <svg width={tamano} height={tamano * 0.72} viewBox="0 0 60 43" aria-hidden="true" className={encendido ? 'tlacuache sticker' : 'tlacuache tlacuache-apagado'}>
      <path d="M14 30 Q2 30 4 20 Q6 12 12 16" fill="none" stroke={encendido ? '#f2a7b8' : trazo} strokeWidth="3.2" strokeLinecap="round" strokeDasharray={t.strokeDasharray} />
      <ellipse cx="27" cy="29" rx="15" ry="9.5" fill={f('#9a96a8')} {...t} />
      <path d="M18 37 V41 M34 37 V41" {...t} />
      <circle cx="40" cy="11" r="4.2" fill={f('#2b2738')} {...t} />
      <circle cx="51" cy="11" r="4.2" fill={f('#2b2738')} {...t} />
      <path d="M36 16 Q38 8 46 9 Q54 8 55 16 Q56 24 59 26 Q52 30 44 28 Q36 26 36 16 Z" fill={f('#f7f3ec')} {...t} />
      <circle cx="58.4" cy="26" r="1.9" fill={encendido ? '#ff8fb0' : 'none'} stroke={encendido ? 'none' : trazo} />
      <circle cx="43" cy="17" r="1.7" fill={encendido ? TINTA : 'none'} stroke={encendido ? 'none' : trazo} />
      <circle cx="51" cy="17" r="1.7" fill={encendido ? TINTA : 'none'} stroke={encendido ? 'none' : trazo} />
    </svg>
  );
}

/** Los 3 tlacuaches de un nivel: uno por ejercicio resuelto. */
export function TlacuachesNivel({ llenos, tamano = 30 }) {
  return (
    <span className="peces-nivel cacomixtles-nivel" role="img" aria-label={`${llenos} de 3 tlacuaches`}>
      {[0, 1, 2].map((i) => <Tlacuache key={i} tamano={tamano} encendido={i < llenos} />)}
    </span>
  );
}

// ---------- Lugares del campus (los niveles del mapa) ----------

export const LUGARES = {
  biblioteca: { nombre: 'Biblioteca', color: AZUL },
  laboratorio: { nombre: 'Laboratorio', color: '#2f9e8f' },
  canchas: { nombre: 'Canchas', color: '#2e9e44' },
  cafeteria: { nombre: 'Cafetería', color: '#e4572e' },
  auditorio: { nombre: 'Auditorio', color: MORADO },
  torre: { nombre: 'Torres', color: AZUL_CLARO },
  explanada: { nombre: 'Explanada', color: '#c98a1a' },
  salon: { nombre: 'Edificio de aulas', color: '#d6336c' },
  entrada: { nombre: 'Entrada principal', color: AZUL },
};
// Lugar de cada nivel (1 a 12), según el tema del nivel.
const LUGAR_DE_NIVEL = ['biblioteca', 'laboratorio', 'canchas', 'cafeteria', 'auditorio', 'cafeteria',
  'torre', 'explanada', 'laboratorio', 'salon', 'biblioteca', 'entrada'];
export const lugarDe = (nivel) => LUGAR_DE_NIVEL[(nivel - 1) % LUGAR_DE_NIVEL.length];

function Ventanitas({ x0, y0, cols, filas, w = 10, h = 9, dx = 14, dy = 13, color = '#dff4ff' }) {
  const v = [];
  for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) v.push(<rect key={`${f}-${c}`} x={x0 + c * dx} y={y0 + f * dy} width={w} height={h} rx="1.5" fill={color} {...L} strokeWidth="1.3" />);
  return <>{v}</>;
}

/** Dibujo de cada lugar (viewBox 140×104). `c` es el color principal. */
function Lugar({ tipo, c }) {
  switch (tipo) {
    case 'biblioteca':
      return (
        <g>
          <rect x="14" y="40" width="112" height="50" rx="3" fill="#f1ece2" {...L} />
          <path d="M8 40 L70 18 L132 40 Z" fill={c} {...L} />
          {[26, 46, 66, 86, 106].map((x) => <rect key={x} x={x} y="48" width="8" height="34" fill="#e0d8c8" {...L} strokeWidth="1.3" />)}
          <rect x="58" y="62" width="24" height="28" rx="2" fill="#7a5230" {...L} />
          {[[26, '#d62839'], [32, '#3a86ff'], [38, ORO]].map(([x, col]) => <rect key={x} x={x + 72} y="28" width="5" height="10" fill={col} stroke={TINTA} strokeWidth="1" />)}
        </g>
      );
    case 'laboratorio':
      // Laboratorio de electrónica y electricidad: foco encendido, rayo y una tablilla de circuito en la pared.
      return (
        <g>
          <rect x="12" y="34" width="116" height="56" rx="4" fill="#e9f4f2" {...L} />
          <rect x="12" y="34" width="116" height="10" fill={c} {...L} />
          <Ventanitas x0={22} y0={52} cols={3} filas={2} />
          <rect x="66" y="50" width="54" height="32" rx="3" fill="#2e9e44" {...L} strokeWidth="1.5" />
          <path d="M72 58 H84 V70 H96 M84 64 H112 M100 58 V76 H112" fill="none" stroke={ORO} strokeWidth="2" />
          {[[84, 58], [96, 70], [112, 64], [100, 76]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.2" fill={ORO} />)}
          <rect x="88" y="60" width="8" height="6" rx="1" fill={TINTA} />
          <path d="M24 4 L14 22 H22 L16 36 L32 16 H24 L30 4 Z" fill={ORO} {...L} strokeWidth="1.8" />
          <circle cx="104" cy="16" r="11" fill="#fff59d" {...L} />
          <path d="M100 18 Q104 12 108 18" fill="none" stroke="#c97c1a" strokeWidth="1.5" />
          <rect x="99" y="26" width="10" height="8" rx="1.5" fill="#c9c6d8" {...L} strokeWidth="1.5" />
          <path d="M88 8 L84 5 M120 8 L124 5 M104 1 V-2" stroke={ORO} strokeWidth="2.2" />
        </g>
      );
    case 'canchas':
      return (
        <g>
          <rect x="8" y="40" width="124" height="52" rx="4" fill={c} {...L} />
          <path d="M70 40 V92 M14 46 H126 V86 H14 Z" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cx="70" cy="66" r="11" fill="none" stroke="#fff" strokeWidth="2" />
          <path d="M14 56 H26 V76 H14 M126 56 H114 V76 H126" fill="none" stroke="#fff" strokeWidth="2" />
          <path d="M20 40 V18 H50 V40 M20 24 H50" fill="none" stroke={TINTA} strokeWidth="2.5" />
          <circle cx="98" cy="30" r="9" fill="#fff" {...L} />
          <path d="M98 24 L103 28 L101 34 H95 L93 28 Z" fill={TINTA} />
        </g>
      );
    case 'cafeteria':
      return (
        <g>
          <rect x="16" y="44" width="108" height="46" rx="3" fill="#fff3e6" {...L} />
          <path d="M10 30 H130 L124 46 H16 Z" fill={c} {...L} />
          {[16, 40, 64, 88, 112].map((x) => <path key={x} d={`M${x} 46 Q${x + 6} 54 ${x + 12} 46`} fill="#fff" {...L} strokeWidth="1.5" />)}
          <rect x="26" y="58" width="40" height="22" rx="2" fill="#dff4ff" {...L} strokeWidth="1.5" />
          <rect x="82" y="56" width="22" height="34" rx="2" fill="#8b5a2b" {...L} />
          <path d="M60 14 H80 L77 28 H63 Z" fill="#fff" {...L} />
          <path d="M80 17 Q86 20 79 25" fill="none" {...L} />
          <path d="M66 10 Q64 6 67 2 M72 10 Q70 6 73 2" fill="none" stroke={TINTA} strokeWidth="1.5" />
        </g>
      );
    case 'auditorio':
      return (
        <g>
          <path d="M8 90 V54 Q70 8 132 54 V90 Z" fill={c} {...L} />
          <path d="M22 90 V60 Q70 26 118 60 V90" fill="none" stroke="#fff" strokeWidth="2" opacity=".6" />
          <rect x="50" y="62" width="40" height="28" rx="3" fill="#2b2738" {...L} />
          <path d="M50 62 Q56 74 50 90 M90 62 Q84 74 90 90" fill="#d62839" {...L} strokeWidth="1.5" />
          <path d="M60 46 L64 54 L72 54 L66 59 L68 67 L60 62 L52 67 L54 59 L48 54 L56 54 Z" transform="translate(10 -12)" fill={ORO} {...L} strokeWidth="1.3" />
        </g>
      );
    case 'torre':
      return (
        <g>
          <rect x="30" y="16" width="30" height="76" rx="2" fill={c} {...L} />
          <rect x="80" y="26" width="30" height="66" rx="2" fill={AZUL} {...L} />
          <Ventanitas x0={35} y0={24} cols={2} filas={5} w={8} h={8} dx={12} dy={13} color={ORO} />
          <Ventanitas x0={85} y0={34} cols={2} filas={4} w={8} h={8} dx={12} dy={13} color={ORO} />
          <path d="M60 62 H80" stroke={TINTA} strokeWidth="5" />
          <path d="M45 16 V4 L56 8 L45 12" fill={ORO} {...L} strokeWidth="1.5" />
        </g>
      );
    case 'explanada':
      return (
        <g>
          <ellipse cx="70" cy="86" rx="62" ry="10" fill="#e6dccb" {...L} />
          <rect x="58" y="30" width="24" height="56" fill="#f1ece2" {...L} />
          <path d="M54 30 L70 12 L86 30 Z" fill={c} {...L} />
          <circle cx="70" cy="46" r="10" fill="#fff" {...L} />
          <path d="M70 46 V39 M70 46 L75 48" stroke={TINTA} strokeWidth="2" />
          <rect x="20" y="70" width="22" height="6" rx="2" fill="#2e9e44" {...L} strokeWidth="1.5" />
          <rect x="98" y="70" width="22" height="6" rx="2" fill="#2e9e44" {...L} strokeWidth="1.5" />
        </g>
      );
    case 'salon':
      return (
        <g>
          <rect x="10" y="22" width="120" height="68" rx="3" fill="#f6eef2" {...L} />
          <rect x="10" y="22" width="120" height="9" fill={c} {...L} />
          <Ventanitas x0={18} y0={38} cols={8} filas={3} w={10} h={9} dx={14} dy={15} />
          <rect x="62" y="74" width="16" height="16" fill="#8b5a2b" {...L} strokeWidth="1.5" />
          <rect x="40" y="12" width="60" height="12" rx="3" fill="#fff" {...L} strokeWidth="1.5" />
          <text x="70" y="21" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="8" fill={TINTA}>AULAS</text>
        </g>
      );
    case 'entrada':
      return (
        <g>
          <rect x="10" y="36" width="20" height="56" fill={c} {...L} />
          <rect x="110" y="36" width="20" height="56" fill={c} {...L} />
          <rect x="4" y="22" width="132" height="18" rx="3" fill={c} {...L} />
          <text x="70" y="35.5" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="12" fill={ORO}>FES ARAGÓN</text>
          <path d="M30 92 V60 H110 V92" fill="none" stroke={TINTA} strokeWidth="2" strokeDasharray="4 4" />
          <path d="M66 70 Q70 64 74 70 L70 80 Z" fill={ORO} {...L} strokeWidth="1.3" />
        </g>
      );
    default:
      return null;
  }
}

/** Lugar del campus de un nivel en el mapa, con letrero arriba (ahí va el número del nivel). */
export function LugarNivel({ tipo = 'biblioteca', estado = 'bloq', tamano = 124, children }) {
  const info = LUGARES[tipo] || LUGARES.biblioteca;
  const bloq = estado === 'bloq';
  return (
    <span className={`trajinera-nivel transporte-nivel lugar-nivel trajinera-${estado}`} style={{ width: tamano, height: tamano * 0.74 }}>
      <svg width={tamano} height={tamano * 0.74} viewBox="0 0 140 104" aria-hidden="true" className={bloq ? 'transporte-gris sticker' : 'sticker'}>
        <ellipse cx="70" cy="96" rx="62" ry="6" fill="#000" opacity=".15" />
        <Lugar tipo={tipo} c={bloq ? GRIS : info.color} />
      </svg>
      <span className="trajinera-placa transporte-placa" style={{ background: bloq ? '#a29db6' : info.color }}>{children}</span>
    </span>
  );
}

// ---------- Personas del campus ----------

/** Alumno caminando con mochila (viewBox 40×60). */
function Alumno({ x = 0, y = 0, ropa = AZUL, piel = PIEL[0], mochila = ORO, pelo = '#3a2a1e', escala = 1, libro = false }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`} {...L} strokeWidth="1.6">
      <path d="M14 58 L16 44 M26 58 L24 44" strokeWidth="4" stroke="#3a4a6b" />
      <rect x="6" y="28" width="12" height="16" rx="3" fill={mochila} />
      <path d="M10 44 Q10 24 20 24 Q30 24 30 44 Z" fill={ropa} />
      <circle cx="20" cy="15" r="8" fill={piel} />
      <path d="M12 13 Q14 5 20 6 Q27 5 28 13 Q24 9 20 10 Q15 9 12 13 Z" fill={pelo} />
      {libro && <rect x="27" y="30" width="9" height="11" rx="1" fill="#d62839" />}
    </g>
  );
}

// ---------- Decoración del campus ----------

const CAMPUS = {
  // Las torres de la FES: dos torres altas unidas por un puente.
  torres: (
    <g {...L}>
      <rect x="22" y="14" width="30" height="102" fill={AZUL} />
      <rect x="68" y="30" width="30" height="86" fill={AZUL_CLARO} />
      <Ventanitas x0={27} y0={22} cols={2} filas={7} w={8} h={8} dx={12} dy={13} color={ORO} />
      <Ventanitas x0={73} y0={38} cols={2} filas={6} w={8} h={8} dx={12} dy={13} color="#dff4ff" />
      <rect x="52" y="64" width="16" height="8" fill="#c9c6d8" />
      <path d="M37 14 V2 L48 6 L37 10" fill={ORO} strokeWidth="1.5" />
    </g>
  ),
  auditorio: (
    <g {...L}>
      <path d="M4 114 V70 Q60 22 116 70 V114 Z" fill={MORADO} />
      <path d="M18 114 V76 Q60 40 102 76 V114" fill="none" stroke="#fff" strokeWidth="2" opacity=".5" />
      <rect x="42" y="82" width="36" height="32" rx="3" fill="#2b2738" />
      <path d="M42 82 Q48 96 42 114 M78 82 Q72 96 78 114" fill="#d62839" strokeWidth="1.5" />
      <rect x="30" y="58" width="60" height="14" rx="3" fill="#fff" />
      <text x="60" y="68.5" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="9" fill={TINTA} stroke="none">AUDITORIO</text>
    </g>
  ),
  // La mascota de la FES: un puma azul y dorado sobre su pedestal.
  mascota: (
    <g {...L}>
      <rect x="30" y="96" width="60" height="18" rx="3" fill="#d8d2c4" />
      <path d="M38 96 Q34 70 46 56 L42 40 L52 48 Q60 44 68 48 L78 40 L74 56 Q86 70 82 96 Z" fill={ORO} />
      <path d="M46 56 L42 40 L52 48 M78 40 L74 56 L68 48" fill={AZUL} strokeWidth="1.5" />
      <ellipse cx="60" cy="72" rx="12" ry="9" fill="#fff4d6" />
      <circle cx="53" cy="62" r="2.6" fill={TINTA} /><circle cx="67" cy="62" r="2.6" fill={TINTA} />
      <path d="M56 70 H64 L60 74 Z" fill={TINTA} />
      <path d="M60 74 Q56 79 52 76 M60 74 Q64 79 68 76" fill="none" strokeWidth="1.5" />
      <path d="M82 92 Q100 88 98 70" fill="none" stroke={ORO} strokeWidth="5" />
      <path d="M44 102 H76" stroke={AZUL} strokeWidth="3" />
      <text x="60" y="111" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="7" fill={AZUL} stroke="none">¡GOYA!</text>
    </g>
  ),
  // El hombre de morado, que saluda a todos los que entran al campus.
  morado: (
    <g {...L}>
      <path d="M46 114 L50 82 M74 114 L70 82" strokeWidth="6" stroke="#4a2a7a" />
      <path d="M40 86 Q40 50 60 50 Q80 50 80 86 Z" fill={MORADO} />
      <path d="M80 60 L96 38" strokeWidth="6" stroke={MORADO} />
      <circle cx="97" cy="35" r="5" fill={PIEL[1]} />
      <path d="M40 62 L30 82" strokeWidth="6" stroke={MORADO} />
      <circle cx="60" cy="36" r="13" fill={PIEL[1]} />
      <path d="M46 32 Q46 16 60 16 Q74 16 74 32 Q68 24 60 25 Q52 24 46 32 Z" fill="#2b2738" />
      <path d="M54 40 Q60 45 66 40" fill="none" strokeWidth="1.8" />
      <circle cx="55" cy="34" r="1.6" fill={TINTA} /><circle cx="65" cy="34" r="1.6" fill={TINTA} />
      <path d="M56 50 L60 60 L64 50" fill="#f3e7ff" strokeWidth="1.5" />
      <path d="M44 114 H54 M66 114 H76" strokeWidth="4" />
    </g>
  ),
  edificio: (
    <g {...L}>
      <rect x="14" y="30" width="92" height="84" rx="3" fill="#f1ece2" />
      <rect x="14" y="30" width="92" height="10" fill="#d6336c" />
      <Ventanitas x0={22} y0={48} cols={6} filas={4} w={9} h={10} dx={13.5} dy={15} />
      <rect x="50" y="98" width="20" height="16" fill="#8b5a2b" />
      <rect x="40" y="18" width="40" height="14" rx="3" fill="#fff" />
      <text x="60" y="28.5" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="9" fill={TINTA} stroke="none">A-3</text>
    </g>
  ),
  // Laboratorio de electrónica y electricidad: torre de luz, foco, rayo y tablilla de circuito.
  laboratorio: (
    <g {...L}>
      <path d="M92 52 L100 8 L108 52 M95 36 H105 M97 22 H103 M94 44 L106 30 M96 30 L104 44" fill="none" stroke="#6b6e7a" strokeWidth="2" />
      <path d="M86 14 H114 M88 22 H112" stroke="#6b6e7a" strokeWidth="2" />
      <rect x="10" y="52" width="100" height="62" rx="3" fill="#e9f4f2" />
      <rect x="10" y="52" width="100" height="10" fill="#2f9e8f" />
      <Ventanitas x0={18} y0={70} cols={2} filas={2} w={10} h={10} dx={15} dy={16} />
      <rect x="52" y="68" width="50" height="34" rx="3" fill="#2e9e44" strokeWidth="1.5" />
      <path d="M58 76 H70 V88 H82 M70 82 H96 M86 76 V96 H96" fill="none" stroke={ORO} strokeWidth="2" />
      {[[70, 76], [82, 88], [96, 82], [86, 96]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.2" fill={ORO} stroke="none" />)}
      <rect x="22" y="100" width="20" height="14" fill="#8b5a2b" />
      <circle cx="40" cy="28" r="14" fill="#fff59d" />
      <path d="M35 30 Q40 22 45 30" fill="none" stroke="#c97c1a" strokeWidth="1.5" />
      <rect x="34" y="41" width="12" height="9" rx="2" fill="#c9c6d8" strokeWidth="1.5" />
      <path d="M20 22 L14 18 M60 22 L66 18 M40 8 V2" stroke={ORO} strokeWidth="2.5" />
      <path d="M16 52 L10 64 H16 L12 74 L24 60 H18 L22 52 Z" fill={ORO} strokeWidth="1.5" transform="translate(64 -50)" />
    </g>
  ),
  cancha: (
    <g {...L}>
      <path d="M4 114 L20 64 H100 L116 114 Z" fill="#2e9e44" />
      <path d="M60 64 V114 M12 89 H108" stroke="#fff" strokeWidth="2" fill="none" />
      <ellipse cx="60" cy="89" rx="14" ry="7" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="M44 64 V40 H76 V64" fill="none" strokeWidth="3" />
      <path d="M44 46 H76 M50 40 V64 M56 40 V64 M64 40 V64 M70 40 V64" stroke={TINTA} strokeWidth="1" opacity=".5" />
      <Alumno x={84} y={56} ropa="#d62839" piel={PIEL[2]} mochila="none" escala={0.8} />
      <circle cx="80" cy="104" r="5" fill="#fff" />
    </g>
  ),
  cafeteria: (
    <g {...L}>
      <rect x="12" y="52" width="96" height="62" rx="3" fill="#fff3e6" />
      <path d="M6 38 H114 L108 54 H12 Z" fill="#e4572e" />
      {[12, 34, 56, 78, 100].map((x) => <path key={x} d={`M${x} 54 Q${x + 5} 62 ${x + 10} 54`} fill="#fff" strokeWidth="1.5" />)}
      <rect x="20" y="70" width="40" height="26" rx="2" fill="#dff4ff" strokeWidth="1.5" />
      <rect x="72" y="68" width="22" height="46" rx="2" fill="#8b5a2b" />
      <rect x="30" y="22" width="60" height="14" rx="3" fill="#fff" />
      <text x="60" y="32.5" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="9" fill={TINTA} stroke="none">CAFETERÍA</text>
    </g>
  ),
  // Puesto de comida para llevar (tortas, jugos, chilaquiles).
  puesto: (
    <g {...L}>
      <path d="M8 42 H112 L104 58 H16 Z" fill={ORO} />
      {[22, 46, 70, 94].map((x) => <path key={x} d={`M${x} 42 L${x + 8} 58 H${x - 4} Z`} fill="#fff" strokeWidth="1" />)}
      <path d="M20 58 V104 M100 58 V104" strokeWidth="3" />
      <rect x="14" y="78" width="92" height="28" rx="3" fill={AZUL} />
      <text x="60" y="97" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="13" fill="#fff" stroke="none">TORTAS</text>
      <rect x="30" y="64" width="12" height="14" rx="2" fill="#ff9f1c" strokeWidth="1.5" />
      <rect x="46" y="64" width="12" height="14" rx="2" fill="#7ee0a8" strokeWidth="1.5" />
      <ellipse cx="80" cy="72" rx="12" ry="5" fill="#e8b36b" strokeWidth="1.5" />
    </g>
  ),
  alumnos: (
    <g>
      <Alumno x={6} y={58} ropa={AZUL} piel={PIEL[0]} mochila={ORO} libro />
      <Alumno x={42} y={50} ropa="#d6336c" piel={PIEL[2]} mochila="#2e9e44" pelo="#1f1b2e" />
      <Alumno x={78} y={60} ropa="#2f9e8f" piel={PIEL[1]} mochila="#e4572e" pelo="#6b4226" />
    </g>
  ),
  arbol: (
    <g {...L}>
      <path d="M58 116 V70" stroke="#7a5230" strokeWidth="6" />
      {[[42, 58, 20], [62, 44, 24], [82, 60, 19], [60, 66, 18]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? '#3fae5a' : '#2e9e44'} strokeWidth="1.5" />)}
    </g>
  ),
  bici: (
    <g {...L} fill="none" strokeWidth="3">
      <circle cx="32" cy="88" r="18" /><circle cx="90" cy="88" r="18" />
      <path d="M32 88 L52 60 L80 60 L90 88 M52 60 L62 88 L32 88 M80 60 L76 50 M46 54 H58" stroke={AZUL} strokeWidth="5" />
      <path d="M70 46 H82" stroke={TINTA} strokeWidth="4" />
    </g>
  ),
  banca: (
    <g {...L}>
      <rect x="14" y="60" width="92" height="9" rx="3" fill={AZUL} />
      <rect x="10" y="76" width="100" height="10" rx="3" fill={AZUL} />
      <path d="M22 86 V108 M98 86 V108 M22 64 V86 M98 64 V86" strokeWidth="4" />
    </g>
  ),
};

/** Un lugar o una cosa del campus como decoración del mapa. */
export function CampusDeco({ tipo }) {
  return <svg viewBox="0 0 120 120" aria-hidden="true" className="monumento sticker">{CAMPUS[tipo]}</svg>;
}

/** Banderines azul y oro de lado a lado. */
export function BanderinesFES() {
  const colores = [AZUL, ORO];
  return (
    <svg viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true" className="papel-picado">
      <path d="M0 6 Q200 22 400 6" fill="none" stroke={TINTA} strokeWidth="1.5" />
      {Array.from({ length: 16 }, (_, i) => {
        const x = 6 + i * 24.5;
        const y = 6 + Math.sin((x / 400) * Math.PI) * 15;
        return <path key={i} d={`M${x} ${y} H${x + 18} L${x + 9} ${y + 20} Z`} fill={colores[i % 2]} stroke={TINTA} strokeWidth="1" />;
      })}
    </svg>
  );
}

/** Huellita dorada (la usan el título y el peluche). */
function Huella({ x, y, s = 1, color = ORO }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color} stroke="#8a6200" strokeWidth="1">
      <path d="M0 -2 C7 -2 11 5 9.5 9 C8 12 4 10.5 0 10.5 C-4 10.5 -8 12 -9.5 9 C-11 5 -7 -2 0 -2 Z" />
      {[[-10, -6, -18], [-4, -12, -6], [4, -12, 6], [10, -6, 18]].map(([a, b, r]) => <ellipse key={a} cx={a} cy={b} rx="3" ry="4" transform={`rotate(${r} ${a} ${b})`} />)}
    </g>
  );
}

/** Título llamativo del mundo, arriba del mapa: letrero azul y oro con huellitas y destellos. */
export function TituloFES() {
  return (
    <div className="fes-titulo" role="img" aria-label="¡Bienvenido a la FES Aragón!">
      <svg viewBox="0 0 360 128" aria-hidden="true" className="sticker">
        <defs>
          <linearGradient id="fes-titulo-fondo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2c55b3" /><stop offset="1" stopColor={AZUL} />
          </linearGradient>
        </defs>
        <path d="M24 30 L6 44 L24 58 Z M336 30 L354 44 L336 58 Z" fill={ORO} stroke={TINTA} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="18" y="14" width="324" height="78" rx="20" fill="url(#fes-titulo-fondo)" stroke={TINTA} strokeWidth="3" />
        <rect x="26" y="22" width="308" height="62" rx="14" fill="none" stroke={ORO} strokeWidth="2.5" strokeDasharray="2 6" strokeLinecap="round" />
        <text x="180" y="44" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="15" letterSpacing="3" fill="#fff">¡BIENVENIDO A LA</text>
        <text x="180" y="78" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="34" letterSpacing="1" fill={ORO} stroke={TINTA} strokeWidth="1.5" paintOrder="stroke">FES ARAGÓN!</text>
        <Huella x={50} y={56} s={1.1} /><Huella x={310} y={56} s={1.1} />
        <rect x="78" y="96" width="204" height="24" rx="12" fill={ORO} stroke={TINTA} strokeWidth="2.5" />
        <text x="180" y="112.5" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="11.5" letterSpacing=".5" fill={AZUL}>MUNDO 3 · 3.º DE PRIMARIA</text>
        {[[14, 8], [346, 10], [8, 92], [352, 96]].map(([x, y]) => <path key={x} d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z`} fill={ORO} stroke={TINTA} strokeWidth="1.2" />)}
      </svg>
    </div>
  );
}

/** Sticker del peluche de la mascota de la FES: premio al terminar el Mundo 3. */
export function PelucheMascota({ tamano = 72 }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 100 100" aria-hidden="true" className="peluche-mascota sticker">
      <g {...L} strokeWidth="2.5">
        <ellipse cx="50" cy="74" rx="26" ry="20" fill={ORO} />
        <ellipse cx="50" cy="78" rx="14" ry="12" fill="#fff4d6" strokeWidth="1.5" />
        <path d="M76 76 Q94 72 90 56" fill="none" stroke={ORO} strokeWidth="6" />
        <ellipse cx="30" cy="92" rx="9" ry="6" fill={ORO} /><ellipse cx="70" cy="92" rx="9" ry="6" fill={ORO} />
        <circle cx="26" cy="22" r="10" fill={ORO} /><circle cx="74" cy="22" r="10" fill={ORO} />
        <circle cx="26" cy="22" r="5" fill={AZUL} strokeWidth="1.5" /><circle cx="74" cy="22" r="5" fill={AZUL} strokeWidth="1.5" />
        <circle cx="50" cy="40" r="26" fill={ORO} />
        <ellipse cx="50" cy="50" rx="13" ry="10" fill="#fff4d6" strokeWidth="1.5" />
      </g>
      <circle cx="40" cy="38" r="3.4" fill={TINTA} /><circle cx="60" cy="38" r="3.4" fill={TINTA} />
      <circle cx="41" cy="37" r="1.1" fill="#fff" /><circle cx="61" cy="37" r="1.1" fill="#fff" />
      <path d="M46 46 H54 L50 50 Z" fill={TINTA} />
      <path d="M50 50 Q46 55 42 52 M50 50 Q54 55 58 52" fill="none" stroke={TINTA} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="32" cy="48" r="3.5" fill="#ff8fb0" opacity=".7" /><circle cx="68" cy="48" r="3.5" fill="#ff8fb0" opacity=".7" />
      <Huella x={50} y={78} s={0.75} color={AZUL} />
      <path d="M44 66 Q50 70 56 66" fill="none" stroke="#c48d00" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  );
}

// ---------- Dibujos de los ejercicios de 3.º ----------

const fmt = (n) => (n === null || n === undefined ? '?' : n.toLocaleString('en-US'));

/** Lomos de libros con su número (ordenar y leer números de 4 cifras). */
function Libros({ numeros }) {
  const colores = ['#d62839', AZUL, '#2e9e44', ORO, MORADO];
  return (
    <div className="fes-libros">
      {numeros.map((n, i) => (
        <span key={i} className="fes-libro" style={{ background: colores[i % colores.length], height: 96 + (i % 2) * 16 }}>
          <b>{fmt(n)}</b>
        </span>
      ))}
    </div>
  );
}

/** Casilleros del pasillo numerados (series). */
function Casilleros({ numeros }) {
  return (
    <div className="fes-casilleros" role="img" aria-label={`Casilleros: ${numeros.map((n) => (n === null ? 'falta' : n)).join(', ')}`}>
      {numeros.map((n, i) => (
        <span key={i} className={`fes-casillero${n === null ? ' falta' : ''}`}>
          <i aria-hidden="true" /><i aria-hidden="true" />
          <b>{fmt(n)}</b>
        </span>
      ))}
    </div>
  );
}

/** Bloques base 10 con millares: cubos de 1,000, placas de 100, barras de 10 y cubitos de 1. */
function BloquesMil({ millares, centenas, decenas, unidades }) {
  const grupo = (n, clase, k) => n > 0 && <div className={`cdmx-grupo${k === 'u' ? ' cubitos' : ''}`}>{Array.from({ length: n }, (_, i) => <span key={i} className={clase} />)}</div>;
  return (
    <div className="cdmx-bloques">
      {grupo(millares, 'bloque-mil', 'm')}
      {grupo(centenas, 'bloque-placa', 'c')}
      {grupo(decenas, 'bloque-barra', 'd')}
      {grupo(unidades, 'bloque-cubo', 'u')}
    </div>
  );
}

/** Pizzas del mismo tamaño partidas en `den` pedazos, con `num` pintados. */
function Pizzas({ fracciones }) {
  return (
    <div className="fes-pizzas">
      {fracciones.map((f, k) => {
        const r = 44;
        const rebanadas = Array.from({ length: f.den }, (_, i) => {
          const a0 = (2 * Math.PI * i) / f.den - Math.PI / 2;
          const a1 = (2 * Math.PI * (i + 1)) / f.den - Math.PI / 2;
          const p = (a) => `${50 + r * Math.cos(a)} ${50 + r * Math.sin(a)}`;
          const d = f.den === 1 ? null : `M50 50 L${p(a0)} A${r} ${r} 0 0 1 ${p(a1)} Z`;
          return d && <path key={i} d={d} fill={i < f.num ? '#ffb347' : '#fff6df'} stroke={TINTA} strokeWidth="2" strokeLinejoin="round" />;
        });
        return (
          <figure key={k} className="fes-pizza">
            <svg viewBox="0 0 100 100" width="104" height="104" aria-hidden="true" className="sticker">
              <circle cx="50" cy="50" r="48" fill="#e8b36b" stroke={TINTA} strokeWidth="2.5" />
              {rebanadas}
              {Array.from({ length: f.den }, (_, i) => {
                if (i >= f.num) return null;
                const a = (2 * Math.PI * (i + 0.5)) / f.den - Math.PI / 2;
                return <circle key={i} cx={50 + 26 * Math.cos(a)} cy={50 + 26 * Math.sin(a)} r="4" fill="#d62839" />;
              })}
            </svg>
            <figcaption className="etq">{f.etiqueta}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

/** Grupos con un número dentro (multiplicar por 10 y por 100). */
function Secciones({ grupos, cada, etiqueta }) {
  return (
    <div className="fes-secciones">
      {Array.from({ length: grupos }, (_, i) => (
        <span key={i} className="fes-seccion"><b>{fmt(cada)}</b><small>{etiqueta}</small></span>
      ))}
    </div>
  );
}

/** Arreglo rectangular: filas × columnas de focos LED sobre una tablilla (protoboard). */
function Arreglo({ filas, columnas }) {
  return (
    <div className="fes-arreglo" style={{ gridTemplateColumns: `repeat(${columnas}, 18px)` }} role="img" aria-label={`${filas} filas de ${columnas}`}>
      {Array.from({ length: filas * columnas }, (_, i) => <i key={i} />)}
    </div>
  );
}

/** Reparto: los objetos juntos arriba y los platos (o equipos) vacíos abajo. */
function Reparto({ total, entre }) {
  return (
    <div className="fes-reparto">
      <div className="fes-montoncito">{Array.from({ length: total }, (_, i) => <i key={i} />)}</div>
      <div className="fes-platos">{Array.from({ length: entre }, (_, i) => <span key={i} className="fes-plato" />)}</div>
    </div>
  );
}

/** Agrupar: objetos sueltos y una bolsa de muestra con su tamaño. */
function Agrupar({ total, cada }) {
  return (
    <div className="fes-reparto">
      <div className="fes-montoncito plumones">{Array.from({ length: total }, (_, i) => <i key={i} />)}</div>
      <p className="cdmx-leyenda">Cada paquete lleva {cada}</p>
    </div>
  );
}

/** Triángulo con la medida de sus lados (o sin medidas). */
function Triangulo({ lados, unidad, mostrar = true }) {
  const [a, b, c] = lados;
  // Coloca los vértices: base c, lados a y b.
  const esc = 150 / Math.max(a, b, c);
  const base = c * esc;
  const x = (base * base + (a * esc) ** 2 - (b * esc) ** 2) / (2 * base);
  const y = Math.sqrt(Math.max((a * esc) ** 2 - x * x, 1));
  const ox = 100 - base / 2;
  const oy = 20 + (130 - y) / 2 + y;
  const P = [[ox, oy], [ox + base, oy], [ox + x, oy - y]];
  const medio = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const G = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3];
  // Cada medida va afuera de su lado: se aleja del centro del triángulo.
  const afuera = ([mx, my]) => {
    const dx = mx - G[0];
    const dy = my - G[1];
    const n = Math.hypot(dx, dy) || 1;
    return [mx + (dx / n) * 26, my + (dy / n) * 22 + 5];
  };
  const etiquetas = [[afuera(medio(P[0], P[2])), a], [afuera(medio(P[1], P[2])), b], [afuera(medio(P[0], P[1])), c]];
  return (
    <svg className="canal-figura sticker" viewBox="-20 0 240 180" role="img" aria-label={mostrar ? `Triángulo de lados ${a}, ${b} y ${c} ${unidad}` : 'Triángulo'}>
      <polygon points={P.map((p) => p.join(',')).join(' ')} fill="#ffe08a" stroke={TINTA} strokeWidth="3" strokeLinejoin="round" />
      {P.map(([px, py], i) => <circle key={i} cx={px} cy={py} r="4.5" fill={TINTA} />)}
      {mostrar && etiquetas.map(([[mx, my], v], i) => (
        <text key={i} x={mx} y={my} textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="14" fill="var(--st-tinta)">{v} {unidad}</text>
      ))}
    </svg>
  );
}

/** Fachada de un edificio con figuras escondidas: 3 triángulos (techo, ventana de arriba y bandera). */
function Fachada() {
  return (
    <svg className="canal-figura sticker" viewBox="0 0 220 180" role="img" aria-label="Fachada de un edificio hecha con figuras geométricas">
      <rect x="4" y="4" width="212" height="172" rx="16" fill="#dff1ff" />
      <g stroke={TINTA} strokeWidth="2.5" strokeLinejoin="round">
        <path d="M160 14 V58" fill="none" />
        <path d="M160 14 L188 24 L160 34 Z" fill="#d62839" />
        <rect x="40" y="76" width="140" height="92" fill="#f1ece2" />
        <path d="M30 76 L110 26 L190 76 Z" fill={AZUL} />
        <path d="M94 68 L110 44 L126 68 Z" fill={ORO} />
        <rect x="56" y="92" width="28" height="28" fill="#dff4ff" />
        <rect x="136" y="92" width="28" height="28" fill="#dff4ff" />
        <rect x="96" y="112" width="28" height="56" fill="#8b5a2b" />
        <circle cx="118" cy="140" r="2.5" fill={ORO} />
      </g>
    </svg>
  );
}

/** Gráfica de barras sencilla. */
function Barras({ titulo, barras }) {
  const max = Math.max(...barras.map((b) => b.valor));
  const colores = ['#2e9e44', '#e4572e', AZUL_CLARO, ORO];
  return (
    <figure className="fes-barras">
      <figcaption className="etq">{titulo}</figcaption>
      <div className="fes-barras-area">
        {barras.map((b, i) => (
          <div key={b.etiqueta} className="fes-barra">
            <b>{b.valor}</b>
            <span style={{ height: `${(b.valor / max) * 120}px`, background: b.color || colores[i % colores.length] }} />
            <small>{b.etiqueta}</small>
          </div>
        ))}
      </div>
    </figure>
  );
}

/** Rectángulo con su largo y su ancho (perímetro). */
function Rectangulo({ largo, ancho, unidad }) {
  const esc = 150 / Math.max(largo, ancho);
  const w = largo * esc;
  const h = Math.max(ancho * esc, 40);
  const x0 = 110 - w / 2;
  const y0 = 20 + (110 - h) / 2;
  return (
    <svg className="canal-figura sticker" viewBox="0 0 220 160" role="img" aria-label={`Rectángulo de ${largo} por ${ancho} ${unidad}`}>
      <rect x={x0} y={y0} width={w} height={h} rx="4" fill="#9fdc8a" stroke={TINTA} strokeWidth="3" />
      {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={x0 + 16 + i * ((w - 32) / 5)} cy={y0 + h / 2} r="5" fill={['#ff5fa2', ORO, '#fff'][i % 3]} stroke={TINTA} strokeWidth="1.5" />)}
      <text x="110" y={y0 - 6} textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="14" fill="var(--st-tinta)">{largo} {unidad}</text>
      <text x={x0 + w + 8} y={y0 + h / 2 + 5} fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="14" fill="var(--st-tinta)">{ancho} {unidad}</text>
    </svg>
  );
}

/** Reloj de manecillas, con partes coloreadas si el ejercicio habla de cuartos y medias horas. */
function RelojFES({ hora, minutos, sectores = [], sinManecillas = false }) {
  const id = `rf-${useId().replace(/:/g, '')}`;
  const punta = (ang, largo) => [100 + largo * Math.cos((ang * Math.PI) / 180), 80 + largo * Math.sin((ang * Math.PI) / 180)];
  const [hx, hy] = punta(((hora % 12) + minutos / 60) * 30 - 90, 34);
  const [mx, my] = punta(minutos * 6 - 90, 52);
  const sector = ([m0, m1, color], i) => {
    const [x0, y0] = punta(m0 * 6 - 90, 66);
    const [x1, y1] = punta(m1 * 6 - 90, 66);
    return <path key={i} d={`M100 80 L${x0} ${y0} A66 66 0 ${m1 - m0 > 30 ? 1 : 0} 1 ${x1} ${y1} Z`} fill={color} opacity=".55" />;
  };
  return (
    <svg className="canal-figura sticker" viewBox="0 0 200 160" role="img" aria-label="Reloj de manecillas">
      <defs><radialGradient id={id}><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#eef2fb" /></radialGradient></defs>
      <circle cx="100" cy="80" r="70" fill={`url(#${id})`} stroke={AZUL} strokeWidth="5" />
      {sectores.map(sector)}
      {Array.from({ length: 12 }, (_, i) => {
        const [tx, ty] = punta(i * 30 - 60, 56);
        return <text key={i} x={tx} y={ty + 5} textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="800" fontSize="14" fill={TINTA}>{i + 1}</text>;
      })}
      {!sinManecillas && <path d={`M100 80 L${hx} ${hy}`} stroke={TINTA} strokeWidth="7" strokeLinecap="round" />}
      {!sinManecillas && <path d={`M100 80 L${mx} ${my}`} stroke={ORO} strokeWidth="4" strokeLinecap="round" />}
      <circle cx="100" cy="80" r="5" fill={TINTA} />
    </svg>
  );
}

/** Dibuja el apoyo visual de un ejercicio de la FES (o nada en los niveles abstractos sin dibujo). */
export function VisualFES({ visual }) {
  if (!visual) return null;
  let dibujo = null;
  switch (visual.tipo) {
    case 'libros': dibujo = <Libros {...visual} />; break;
    case 'casilleros': dibujo = <Casilleros {...visual} />; break;
    case 'bloques_mil': dibujo = <BloquesMil {...visual} />; break;
    case 'pizzas': dibujo = <Pizzas {...visual} />; break;
    case 'secciones': dibujo = <Secciones {...visual} />; break;
    case 'arreglo': dibujo = <Arreglo {...visual} />; break;
    case 'reparto': dibujo = <Reparto {...visual} />; break;
    case 'agrupar': dibujo = <Agrupar {...visual} />; break;
    case 'triangulo': dibujo = <Triangulo {...visual} />; break;
    case 'fachada': dibujo = <Fachada />; break;
    case 'barras': dibujo = <Barras {...visual} />; break;
    case 'rectangulo': dibujo = <Rectangulo {...visual} />; break;
    case 'reloj': dibujo = <RelojFES {...visual} />; break;
    default: return <VisualCDMX visual={visual} />; // pictograma, tabla y algoritmo en columnas se comparten con el Centro
  }
  return <div className="visual-canal visual-cdmx visual-fes">{dibujo}</div>;
}
