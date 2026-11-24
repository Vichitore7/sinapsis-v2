// Ilustraciones del Mundo 1, "El Canal de los Números" (Xochimilco): trajineras (niveles), chinampas, peces y
// los dibujos de cada tipo de ejercicio. Colores fijos (no cambian con el tema): son dibujos tipo sticker.
import { useId } from 'react';

export const TINTA = '#1e1b3a';
const L = { stroke: TINTA, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' };

export const COLOR_TRAJINERA = { rojo: '#e63946', azul: '#3a86ff', verde: '#2a9d8f', amarillo: '#ffbe0b', rosa: '#ff6fa5' };
const NOMBRE_COLOR = { rojo: 'roja', azul: 'azul', verde: 'verde', amarillo: 'amarilla' };

// ---------- Objetos para contar ----------

export function Flor({ tamano = 34, color = '#ff9f1c', centro = '#ffd166' }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 40 40" aria-hidden="true">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <ellipse key={a} cx="20" cy="9" rx="5.5" ry="8" transform={`rotate(${a} 20 20)`} fill={color} {...L} strokeWidth="1.5" />
      ))}
      <circle cx="20" cy="20" r="6.5" fill={centro} {...L} strokeWidth="1.5" />
    </svg>
  );
}

export function Pez({ tamano = 34, encendido = true, color = '#ff8c42', numero = null }) {
  const relleno = encendido ? color : 'none';
  // El pez apagado se dibuja con el color del texto (currentColor) para que se vea de día y de noche.
  const trazo = encendido ? TINTA : 'currentColor';
  return (
    <svg width={tamano} height={tamano * 0.7} viewBox="0 0 50 35" aria-hidden="true" className={encendido ? 'pez' : 'pez pez-apagado'}>
      <path d="M38 17.5 L49 7 L49 28 Z" fill={relleno} {...L} stroke={trazo} strokeDasharray={encendido ? undefined : '3 3'} />
      <ellipse cx="22" cy="17.5" rx="19" ry="13" fill={relleno} {...L} stroke={trazo} strokeDasharray={encendido ? undefined : '3 3'} />
      {encendido && <path d="M24 6 Q30 17.5 24 29" fill="none" stroke="#fff" strokeWidth="2" opacity=".55" />}
      <circle cx="11" cy="14" r="2.6" fill={encendido ? TINTA : 'none'} stroke={encendido ? 'none' : trazo} strokeWidth="1.5" />
      {numero !== null && (
        <text x="24" y="23" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="800" fontSize="15" fill={TINTA}>{numero}</text>
      )}
    </svg>
  );
}

function Persona({ tamano = 30, color = '#6c4bd8' }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 30 30" aria-hidden="true">
      <path d="M5 29 Q5 17 15 17 Q25 17 25 29 Z" fill={color} {...L} strokeWidth="1.5" />
      <circle cx="15" cy="10" r="6.5" fill="#f6c9a0" {...L} strokeWidth="1.5" />
    </svg>
  );
}

function Sombrerito({ tamano = 34 }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 40 40" aria-hidden="true">
      <ellipse cx="20" cy="27" rx="18" ry="6" fill="#f1dfa8" {...L} />
      <path d="M11 27 Q11 10 20 10 Q29 10 29 27 Z" fill="#f1dfa8" {...L} />
      <rect x="11" y="21" width="18" height="4" fill="#e63946" {...L} strokeWidth="1.5" />
    </svg>
  );
}

function Jarrito({ tamano = 34 }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M29 15 Q37 15 35 23 Q34 27 29 27" fill="none" {...L} strokeWidth="3" />
      <path d="M11 8 H29 Q27 12 30 18 Q33 30 20 35 Q7 30 10 18 Q13 12 11 8 Z" fill="#c8553d" {...L} />
      <path d="M12 20 H28" stroke="#ffd166" strokeWidth="2.5" />
    </svg>
  );
}

const OBJETOS = { flor: Flor, pez: Pez, persona: Persona, sombrerito: Sombrerito, jarrito: Jarrito };

function Objeto({ objeto, tamano = 34, color }) {
  const C = OBJETOS[objeto] || Flor;
  return <C tamano={tamano} {...(color ? { color } : {})} />;
}

/** Hasta 10 por fila, con una pausa a la mitad para contar de 5 en 5. */
function Filas({ objeto, cantidad, tamano = 34, color, tachados = 0 }) {
  const filas = [];
  for (let i = 0; i < cantidad; i += 10) filas.push(Array.from({ length: Math.min(10, cantidad - i) }, (_, j) => i + j));
  return (
    <div className="canal-filas">
      {filas.map((fila, f) => (
        <div key={f} className="canal-fila">
          {fila.map((i) => (
            <span key={i} className={`canal-obj${i % 10 === 5 ? ' mitad' : ''}${i >= cantidad - tachados ? ' tachado' : ''}`}>
              <Objeto objeto={objeto} tamano={tamano} color={color} />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------- Escenario: chinampas, ahuejotes y trajineras ----------

/** Trajinera vista de lado, con su portada de color y el nombre pintado. */
export function Trajinera({ color = 'rojo', nombre = '', ancho = 120 }) {
  const c = COLOR_TRAJINERA[color] || color;
  return (
    <svg width={ancho} height={ancho * 0.62} viewBox="0 0 120 74" aria-hidden="true">
      <rect x="22" y="22" width="76" height="28" rx="3" fill="#fff6e5" {...L} />
      {[34, 50, 66, 82].map((x) => <path key={x} d={`M${x} 22 V50`} stroke={TINTA} strokeWidth="1.5" />)}
      <path d="M16 22 Q60 2 104 22 Z" fill={c} {...L} />
      <rect x="30" y="8" width="60" height="13" rx="3" fill={c} {...L} />
      {nombre && (
        <text x="60" y="18.5" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="800" fontSize="9" fill="#fff"
          {...(nombre.length > 6 ? { textLength: 54, lengthAdjust: 'spacingAndGlyphs' } : {})}>{nombre.toUpperCase()}</text>
      )}
      {[22, 98].map((x, i) => <circle key={x} cx={x} cy="18" r="3.5" fill={['#ffbe0b', '#ff6fa5'][i]} {...L} strokeWidth="1" />)}
      <path d="M4 50 H116 L104 66 H16 Z" fill={c} {...L} />
      <path d="M10 58 H110" stroke="#fff" strokeWidth="2.5" strokeDasharray="6 4" />
    </svg>
  );
}

// Colores de las trajineras de los niveles (se repiten en orden).
export const COLORES_NIVEL = ['rojo', 'azul', 'verde', 'amarillo', 'rosa'];
const GRIS = { casco: '#b9b5c9', techo: '#d3d0de', placa: '#a29db6' };

/**
 * Trajinera de un nivel en el mapa: el número va en su portada (o una palomita / candado en `children`).
 * estado: 'actual' (se mece y brilla), 'hecho' o 'bloq' (gris).
 */
export function TrajineraNivel({ estado = 'bloq', color = 'rojo', tamano = 124, children }) {
  const bloq = estado === 'bloq';
  const c = bloq ? GRIS.casco : COLOR_TRAJINERA[color];
  const techo = bloq ? GRIS.techo : c;
  const flores = ['#ffbe0b', '#ff6fa5', '#ffffff', '#ff9f1c', '#2a9d8f'];
  return (
    <span className={`trajinera-nivel trajinera-${estado}`} style={{ width: tamano, height: tamano * 0.74 }}>
      <svg width={tamano} height={tamano * 0.74} viewBox="0 0 140 104" aria-hidden="true">
        <ellipse cx="70" cy="96" rx="64" ry="7" fill="#0b4f7a" opacity=".22" />
        {!bloq && <path d="M14 94 Q24 89 34 94 M104 94 Q114 89 124 94" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".8" />}
        {/* cabina con bancas */}
        <rect x="24" y="44" width="92" height="28" rx="3" fill={bloq ? '#ece9f2' : '#fff6e5'} {...L} />
        {[40, 56, 72, 88, 104].map((x) => <path key={x} d={`M${x} 44 V72`} stroke={TINTA} strokeWidth="1.5" />)}
        {/* techo en arco con guirnalda de flores */}
        <path d="M14 46 Q70 18 126 46 Z" fill={techo} {...L} />
        {!bloq && [20, 34, 48, 92, 106, 120].map((x, i) => (
          <circle key={x} cx={x} cy={46 - Math.sin(((x - 14) / 112) * Math.PI) * 17} r="3.6" fill={flores[i % flores.length]} {...L} strokeWidth="1" />
        ))}
        {/* portada: ahí va el número del nivel */}
        <rect x="44" y="6" width="52" height="30" rx="8" fill={bloq ? GRIS.placa : c} stroke="#fff" strokeWidth="3" />
        <rect x="44" y="6" width="52" height="30" rx="8" fill="none" {...L} />
        {/* casco */}
        <path d="M4 72 H136 L122 90 H18 Z" fill={c} {...L} />
        <path d="M12 81 H128" stroke="#fff" strokeWidth="3" strokeDasharray="7 5" opacity={bloq ? 0.5 : 1} />
      </svg>
      <span className="trajinera-placa">{children}</span>
    </span>
  );
}

/** Chinampa decorativa (islita de cultivo con ahuejotes). variante 0: árboles; 1: casita; 2: surcos de cempasúchil. */
export function ChinampaIsla({ variante = 0 }) {
  const id = `ci-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 160 110" aria-hidden="true" className="chinampa-isla">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fcf6a" /><stop offset="1" stopColor="#4fa84a" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="100" rx="76" ry="8" fill="#0b4f7a" opacity=".2" />
      <path d="M6 78 Q8 98 80 100 Q152 98 154 78 Z" fill="#8b5a2b" {...L} />
      <path d="M8 76 Q10 60 40 58 Q80 50 120 58 Q150 60 152 76 Q150 86 80 86 Q10 86 8 76 Z" fill={`url(#${id})`} {...L} />
      {variante === 2 && [64, 72, 80].map((y, i) => (
        <g key={y}>{Array.from({ length: 8 }, (_, k) => (
          <circle key={k} cx={30 + k * 14 + (i % 2) * 7} cy={y} r="3.6" fill={i === 1 ? '#ff6fa5' : '#ff9f1c'} {...L} strokeWidth="1" />
        ))}</g>
      ))}
      {variante !== 2 && [[32, 72], [120, 74], [58, 78]].map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r="3.5" fill={['#ff6fa5', '#ffbe0b', '#ff9f1c'][k]} {...L} strokeWidth="1" />
      ))}
      {variante === 1 && (
        <g>
          <rect x="70" y="50" width="30" height="20" fill="#f4e1c1" {...L} />
          <path d="M64 52 L85 34 L106 52 Z" fill="#c8553d" {...L} />
          <rect x="81" y="58" width="8" height="12" fill="#7a5230" {...L} strokeWidth="1.5" />
        </g>
      )}
      {/* ahuejotes: árboles altos y delgados de las chinampas */}
      {(variante === 1 ? [[22, 0.8], [140, 0.95]] : variante === 2 ? [[16, 0.9], [146, 0.75]] : [[24, 1], [52, 0.75], [132, 0.9]]).map(([x, e], k) => (
        <g key={k} transform={`translate(${x} ${66 - 60 * e}) scale(${e})`}>
          <rect x="-2" y="44" width="4" height="18" fill="#7a5230" />
          <path d="M0 0 Q12 20 9 40 Q6 50 0 52 Q-6 50 -9 40 Q-12 20 0 0 Z" fill="#3d8b5a" stroke="#2c6b44" strokeWidth="2" />
          <path d="M0 8 Q5 24 3 44" fill="none" stroke="#5fb37d" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
}

/** Lirio acuático: hoja flotante con flor rosa. */
export function Lirio() {
  return (
    <svg viewBox="0 0 48 30" aria-hidden="true" className="lirio">
      <path d="M24 16 L44 10 Q48 22 30 26 Q10 30 4 20 Q2 8 24 16 Z" fill="#4fa84a" {...L} strokeWidth="1.5" />
      <g transform="translate(22 12)">
        {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-5" rx="3" ry="5.5" transform={`rotate(${a})`} fill="#ff8fb8" {...L} strokeWidth="1" />)}
        <circle r="2.5" fill="#ffd166" />
      </g>
    </svg>
  );
}

/** Los 3 peces de una trajinera (nivel): uno por ejercicio resuelto. */
export function PecesNivel({ llenos, tamano = 26 }) {
  return (
    <span className="peces-nivel" role="img" aria-label={`${llenos} de 3 peces`}>
      {[0, 1, 2].map((i) => <Pez key={i} tamano={tamano} encendido={i < llenos} />)}
    </span>
  );
}

// ---------- Dibujo de cada tipo de ejercicio ----------

function Comparar({ grupos }) {
  return (
    <div className="canal-comparar">
      {grupos.map((g) => (
        <div key={g.etiqueta} className="canal-barco">
          <Trajinera color={g.color} nombre={g.etiqueta.replace(/^La /, '')} ancho={130} />
          <Filas objeto="persona" cantidad={g.cantidad} tamano={28} color={COLOR_TRAJINERA[g.color]} />
        </div>
      ))}
    </div>
  );
}

function Carrera({ trajineras }) {
  // trajineras[0] llegó en 1.er lugar: la más cerca de la meta (derecha).
  const n = trajineras.length;
  return (
    <div className="canal-carrera" role="img" aria-label="Carrera de trajineras: la meta está a la derecha">
      <span className="canal-meta" aria-hidden="true">META</span>
      {trajineras.map((t, i) => (
        <div key={t.color} className="canal-carril">
          <span className="canal-carril-barco" style={{ left: `${4 + ((n - 1 - i) / (n - 1)) * 58}%` }}>
            <Trajinera color={t.color} nombre={NOMBRE_COLOR[t.color] || ''} ancho={92} />
          </span>
        </div>
      ))}
    </div>
  );
}

function Recta({ hasta, inicio }) {
  const paso = 300 / hasta;
  return (
    <svg className="canal-recta" viewBox="-14 0 328 70" role="img" aria-label={`Recta numérica del 0 al ${hasta}, empiezas en el ${inicio}`}>
      <path d="M0 40 H300" stroke={TINTA} strokeWidth="3" strokeLinecap="round" />
      {Array.from({ length: hasta + 1 }, (_, i) => (
        <g key={i}>
          <path d={`M${i * paso} 33 V47`} stroke={TINTA} strokeWidth="2.5" />
          <text x={i * paso} y="66" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="800" fontSize="14" fill={TINTA}>{i}</text>
        </g>
      ))}
      <circle cx={inicio * paso} cy="40" r="9" fill="#ff8c42" stroke={TINTA} strokeWidth="2.5" />
      <text x={inicio * paso} y="20" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="800" fontSize="12" fill={TINTA}>empiezas</text>
    </svg>
  );
}

function Figura({ figura, donde }) {
  const relleno = { triangulo: '#ff6fa5', circulo: '#ffbe0b', rectangulo: '#3a86ff', cuadrado: '#2a9d8f' }[figura];
  return (
    <svg className="canal-figura" viewBox="0 0 220 150" role="img" aria-label={`Figura del ${donde}`}>
      {donde === 'banderin' && <path d="M10 18 Q110 34 210 18" fill="none" stroke={TINTA} strokeWidth="2" />}
      {figura === 'triangulo' && <path d="M70 26 H150 L110 130 Z" fill={relleno} {...L} strokeWidth="3" />}
      {figura === 'circulo' && (
        <g>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <ellipse key={a} cx="110" cy="38" rx="16" ry="26" transform={`rotate(${a} 110 75)`} fill="#ff6fa5" {...L} />
          ))}
          <circle cx="110" cy="75" r="30" fill={relleno} {...L} strokeWidth="3" />
        </g>
      )}
      {figura === 'rectangulo' && (
        <g>
          <path d="M60 120 V140 M160 120 V140" stroke={TINTA} strokeWidth="3" />
          <rect x="20" y="40" width="180" height="80" rx="4" fill={relleno} {...L} strokeWidth="3" />
          <path d="M40 80 H180" stroke="#fff" strokeWidth="5" strokeDasharray="12 8" strokeLinecap="round" />
        </g>
      )}
      {figura === 'cuadrado' && <rect x="60" y="25" width="100" height="100" fill={relleno} {...L} strokeWidth="3" />}
    </svg>
  );
}

function Medir({ objetos }) {
  const columnas = Math.max(...objetos.map((o) => o.largo)) + 2;
  return (
    <div className="canal-medir">
      {objetos.map((o, k) => (
        <div key={k} className="canal-medida">
          {o.etiqueta && <b className="etq">{o.etiqueta}</b>}
          <div className="canal-regla" style={{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }}>
            <span className={`canal-cosa ${o.objeto}`} style={{ gridColumn: `1 / span ${o.largo}` }} aria-hidden="true" />
            {Array.from({ length: columnas }, (_, i) => <span key={i} className="canal-cuadrito" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Monedas({ monedas }) {
  return (
    <div className="canal-monedas">
      {monedas.map((v, i) => (
        <span key={i} className={`canal-moneda m${v}`} aria-label={`Moneda de ${v} pesos`}>${v}</span>
      ))}
    </div>
  );
}

function Grafica({ titulo, barras }) {
  const max = Math.max(...barras.map((b) => b.valor));
  return (
    <figure className="canal-grafica">
      <figcaption className="etq">{titulo}</figcaption>
      <div className="canal-grafica-cuerpo" style={{ '--filas': max }}>
        <div className="canal-eje" aria-hidden="true">
          {Array.from({ length: max }, (_, i) => <span key={i}>{max - i}</span>)}
        </div>
        {barras.map((b) => (
          <div key={b.etiqueta} className="canal-barra-col">
            <div className="canal-barra" role="img" aria-label={`Barra ${b.etiqueta}`}>
              {Array.from({ length: b.valor }, (_, i) => <span key={i} style={{ background: COLOR_TRAJINERA[b.color] }} />)}
            </div>
            <span className="etq">{b.etiqueta}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

function Ramo() {
  return (
    <span className="canal-ramo" aria-label="Ramo de 10 flores">
      <svg width="56" height="72" viewBox="0 0 56 72" aria-hidden="true">
        {[[10, 14], [22, 8], [34, 8], [46, 14], [16, 24], [28, 18], [40, 24], [22, 32], [34, 32], [28, 6]].map(([x, y], i) => (
          <g key={i}>
            <path d={`M${x} ${y} L28 62`} stroke="#3d8b5a" strokeWidth="2" />
            <circle cx={x} cy={y} r="6" fill={['#ff9f1c', '#ff6fa5', '#ffbe0b'][i % 3]} {...L} strokeWidth="1.2" />
          </g>
        ))}
        <path d="M20 52 L28 58 L36 52 L34 60 L22 60 Z" fill="#e63946" {...L} strokeWidth="1.5" />
      </svg>
      <b>10</b>
    </span>
  );
}

/** Dibuja el apoyo visual de un ejercicio del canal. */
export function VisualCanal({ visual }) {
  if (!visual) return null;
  let dibujo = null;
  switch (visual.tipo) {
    case 'objetos':
      dibujo = <Filas objeto={visual.objeto} cantidad={visual.cantidad} tamano={visual.cantidad > 10 ? 30 : 38} />;
      break;
    case 'serie':
      dibujo = (
        <div className="canal-serie">
          {visual.numeros.map((n, i) => (
            <span key={i} className={n === null ? 'falta' : ''}><Pez tamano={64} numero={n === null ? '?' : n} color={n === null ? '#ffd166' : '#ff8c42'} /></span>
          ))}
        </div>
      );
      break;
    case 'comparar':
      dibujo = <Comparar grupos={visual.grupos} />;
      break;
    case 'carrera':
      dibujo = <Carrera trajineras={visual.trajineras} />;
      break;
    case 'grupos':
      dibujo = (
        <div className="canal-grupos">
          {visual.grupos.map((n, i) => (
            <span key={i} className="canal-grupo-caja">
              {i > 0 && <b className="canal-signo" aria-hidden="true">+</b>}
              <span className="canal-grupo"><Filas objeto={visual.objeto} cantidad={n} tamano={30} /></span>
            </span>
          ))}
        </div>
      );
      break;
    case 'quitar':
      dibujo = (
        <div className="pila-sm" style={{ alignItems: 'center' }}>
          <Filas objeto={visual.objeto} cantidad={visual.total} tamano={36} tachados={visual.quitar} />
          <span className="etq texto-suave">Los tachados ya se vendieron</span>
        </div>
      );
      break;
    case 'recta':
      dibujo = <Recta hasta={visual.hasta} inicio={visual.inicio} />;
      break;
    case 'figura':
      dibujo = <Figura figura={visual.figura} donde={visual.donde} />;
      break;
    case 'medir':
      dibujo = <Medir objetos={visual.objetos} />;
      break;
    case 'monedas':
      dibujo = <Monedas monedas={visual.monedas} />;
      break;
    case 'grafica':
      dibujo = <Grafica titulo={visual.titulo} barras={visual.barras} />;
      break;
    case 'decenas':
      dibujo = (
        <div className="canal-decenas">
          {Array.from({ length: visual.ramos }, (_, i) => <Ramo key={i} />)}
          {visual.sueltas > 0 && <span className="canal-sueltas"><Filas objeto="flor" cantidad={visual.sueltas} tamano={26} /></span>}
        </div>
      );
      break;
    default:
      return null;
  }
  return <div className="visual-canal">{dibujo}</div>;
}
