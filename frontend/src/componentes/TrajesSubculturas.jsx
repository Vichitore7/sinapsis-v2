// Trajes de subculturas de la CDMX para Kiko: premio del examen general del Mundo 1.
// Cada subcultura tiene dos estilos (el nombre dice cómo se ve, sin etiquetas de género). Ajolote.jsx los dibuja con estas piezas:
//   silueta(cabeza): formas extra que llevan el borde blanco de sticker
//   herramienta():   lo que carga en la mano (va detrás de las branquias)
//   ropa(recorte):   la ropa del cuerpo, recortada a la silueta del cuerpo
//   detalles():      lo que sale del cuerpo (botas, paliacate, cinturón)
//   tocado():        cabello, gorros y lentes (van encima de la cara)
// Coordenadas del ajolote (viewBox 200×200): cabeza en (100,100) radio 62×52, cuerpo en (100,152) 36×26, ojos en y=100.
// Colores fijos: es la ropa de Kiko, igual de día y de noche.

const C = { stroke: 'var(--tinta)', strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' };
const R = {
  negro: '#1f1b2e', negroLuz: '#3a3550', rosa: '#ff5fa2', rosaClaro: '#ffb3d1', rojo: '#d62839', verde: '#36c26b',
  morado: '#7b5cd6', azul: '#3a86ff', amarillo: '#ffc83d', mostaza: '#e0a526', cafe: '#8b5a2b', cafeClaro: '#b07a45',
  gris: '#8d8aa3', grisClaro: '#c9c6d8', blanco: '#ffffff', manta: '#fbf8f0', piel: '#f6c9a0',
};

// ---------- Piezas compartidas ----------

function Lentes({ tinte = 'rgba(255,170,60,.55)' }) {
  return (
    <g {...C}>
      <circle cx="78" cy="100" r="14" fill={tinte} />
      <circle cx="122" cy="100" r="14" fill={tinte} />
      <path d="M92 98 Q100 92 108 98 M64 96 L42 90 M136 96 L158 90" fill="none" />
    </g>
  );
}

function Fleco({ color, mechon }) {
  return (
    <g>
      <path d="M40 84 Q44 44 100 40 Q156 42 160 82 Q150 78 142 84 Q136 104 128 116 Q120 96 114 80 Q88 72 58 80 Q48 80 40 84 Z" fill={color} {...C} />
      {mechon && <path d="M110 46 Q126 60 126 104" fill="none" stroke={mechon} strokeWidth="6" strokeLinecap="round" />}
      <path d="M70 50 Q96 46 124 54" fill="none" stroke={R.negroLuz} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function CabelloLargo({ color }) {
  return (
    <g fill={color} {...C}>
      <path d="M40 70 Q28 100 34 150 Q42 156 50 150 Q46 110 56 76 Z" />
      <path d="M160 70 Q172 100 166 150 Q158 156 150 150 Q154 110 144 76 Z" />
      <path d="M40 76 Q46 42 100 40 Q154 42 160 76 Q130 58 100 58 Q70 58 40 76 Z" />
    </g>
  );
}

function Cresta({ color, alto = 36, picos = 5 }) {
  const ancho = 52;
  const x0 = 100 - ancho / 2;
  const paso = ancho / picos;
  let d = `M${x0} 56`;
  for (let i = 0; i < picos; i++) d += ` L${x0 + paso * i + paso / 2} ${56 - alto + (i % 2) * 6} L${x0 + paso * (i + 1)} 52`;
  return <path d={`${d} Z`} fill={color} {...C} />;
}

function Patineta({ color }) {
  return (
    <g {...C}>
      <rect x="168" y="96" width="20" height="96" rx="10" fill={color} />
      <path d="M172 116 H184 M172 172 H184" stroke={R.blanco} strokeWidth="3" />
      {[108, 180].map((y) => <g key={y}><circle cx="166" cy={y} r="5" fill={R.amarillo} /><circle cx="190" cy={y} r="5" fill={R.amarillo} /></g>)}
    </g>
  );
}

function Pancarta({ lineas, color }) {
  return (
    <g {...C}>
      <rect x="181" y="40" width="6" height="152" rx="3" fill={R.cafeClaro} />
      <rect x="132" y="8" width="66" height="50" rx="6" fill={R.manta} />
      <rect x="136" y="12" width="58" height="42" rx="4" fill="none" stroke={color} strokeWidth="3" />
      {lineas.map((t, i) => (
        <text key={t} x="165" y={26 + i * 13} textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="10"
          fill={color} stroke="none" textLength={t.length > 7 ? 50 : undefined} lengthAdjust="spacingAndGlyphs">{t}</text>
      ))}
    </g>
  );
}

function Paliacate({ y = 140 }) {
  return (
    <g {...C} strokeWidth="2">
      <path d={`M72 ${y} Q100 ${y + 14} 128 ${y} L100 ${y + 24} Z`} fill={R.rojo} />
      {[[92, y + 8], [104, y + 9], [99, y + 16]].map(([x, yy]) => <circle key={x} cx={x} cy={yy} r="1.6" fill={R.blanco} stroke="none" />)}
    </g>
  );
}

function Botas() {
  return (
    <g fill={R.negro} {...C}>
      <ellipse cx="72" cy="177" rx="16" ry="9" /><ellipse cx="128" cy="177" rx="16" ry="9" />
      <path d="M62 176 H82 M118 176 H138" stroke={R.gris} strokeWidth="2" />
    </g>
  );
}

function Estoperoles({ y, x0 = 66, x1 = 134 }) {
  const n = Math.floor((x1 - x0) / 9);
  return <>{Array.from({ length: n }, (_, i) => <circle key={i} cx={x0 + 4 + i * 9} cy={y} r="2" fill={R.grisClaro} stroke="none" />)}</>;
}

function Cuadros({ y, alto, fondo, linea }) {
  return (
    <g>
      <rect x="60" y={y} width="80" height={alto} fill={fondo} />
      {[66, 78, 90, 102, 114, 126, 138].map((x) => <path key={x} d={`M${x} ${y} V${y + alto}`} stroke={linea} strokeWidth="3" opacity=".7" />)}
      {[y + 5, y + 13, y + 21].map((yy) => <path key={yy} d={`M60 ${yy} H140`} stroke={linea} strokeWidth="2.5" opacity=".7" />)}
    </g>
  );
}

function TieDye() {
  return (
    <g>
      <rect x="60" y="124" width="80" height="58" fill={R.amarillo} />
      {[[30, R.rosa], [22, R.morado], [14, R.azul], [7, R.verde]].map(([r, c]) => <circle key={r} cx="100" cy="162" r={r} fill={c} />)}
    </g>
  );
}

function Paz() {
  return (
    <g {...C} strokeWidth="2">
      <circle cx="100" cy="164" r="8" fill={R.blanco} />
      <path d="M100 156 V172 M100 164 L94 170 M100 164 L106 170" fill="none" />
    </g>
  );
}

function Ajedrez({ y, filas = 2 }) {
  const lado = 7;
  return (
    <g>
      {Array.from({ length: filas }, (_, f) => Array.from({ length: 12 }, (_, c) => (
        <rect key={`${f}-${c}`} x={58 + c * lado} y={y + f * lado} width={lado} height={lado} fill={(f + c) % 2 ? R.blanco : R.negro} />
      )))}
    </g>
  );
}

function Cadena() {
  return (
    <g>
      <path d="M74 140 Q100 160 126 140" fill="none" stroke={R.amarillo} strokeWidth="4" strokeDasharray="5 2" />
      <circle cx="100" cy="153" r="7" fill={R.amarillo} {...C} strokeWidth="2" />
    </g>
  );
}

function Grabadora() {
  return (
    <g {...C}>
      <path d="M10 120 Q24 106 38 120" fill="none" strokeWidth="3" />
      <rect x="2" y="120" width="44" height="30" rx="5" fill={R.negroLuz} />
      <circle cx="14" cy="135" r="8" fill={R.gris} /><circle cx="34" cy="135" r="8" fill={R.gris} />
      <circle cx="14" cy="135" r="3" fill={R.negro} /><circle cx="34" cy="135" r="3" fill={R.negro} />
    </g>
  );
}

function Microfono() {
  return (
    <g {...C}>
      <rect x="170" y="96" width="9" height="40" rx="4" fill={R.negroLuz} transform="rotate(14 174 116)" />
      <circle cx="180" cy="92" r="10" fill={R.grisClaro} />
      <path d="M173 88 H187 M172 94 H188" stroke={R.gris} strokeWidth="1.5" />
    </g>
  );
}

function GuitarraElectrica({ color }) {
  return (
    <g {...C}>
      <rect x="10" y="40" width="8" height="90" rx="3" fill={R.cafe} transform="rotate(-14 14 85)" />
      <rect x="0" y="30" width="18" height="14" rx="3" fill={R.negroLuz} transform="rotate(-14 9 37)" />
      <path d="M12 128 Q2 132 6 150 Q10 170 30 168 Q44 170 46 156 Q48 146 40 142 Q46 132 36 126 Q26 122 12 128 Z" fill={color} />
      <rect x="18" y="146" width="18" height="5" rx="2" fill={R.blanco} strokeWidth="1.5" />
    </g>
  );
}

function Estrella({ cx, cy = 100 }) {
  const puntas = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 6 : 15;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
  return <polygon points={puntas} fill="rgba(255,95,162,.55)" {...C} strokeWidth="2" />;
}

/** Capa que cuelga de los hombros (va detrás del cuerpo, como la herramienta). */
function Capa({ color, forro }) {
  return (
    <g {...C}>
      <path d="M58 132 Q40 160 22 196 L178 196 Q160 160 142 132 Q100 146 58 132 Z" fill={color} />
      <path d="M40 186 L58 140 M160 186 L142 140" stroke={forro} strokeWidth="5" />
    </g>
  );
}

/** Máscara de luchador: cubre la cabeza y deja ver los ojos y la boca (huecos con fill-rule evenodd). */
function Mascara({ color, adorno, flamas }) {
  return (
    <g>
      <path fillRule="evenodd" fill={color} {...C}
        d="M38 104 Q36 46 100 42 Q164 46 162 104 Q160 114 148 114 L52 114 Q40 114 38 104 Z M64 100 A14 13 0 1 0 92 100 A14 13 0 1 0 64 100 Z M108 100 A14 13 0 1 0 136 100 A14 13 0 1 0 108 100 Z" />
      <path d="M62 100 A16 15 0 0 1 94 98 M106 98 A16 15 0 0 1 138 100" fill="none" stroke={adorno} strokeWidth="3.5" strokeLinecap="round" />
      {flamas ? (
        <path d="M80 70 Q86 52 92 62 Q96 44 100 56 Q104 44 108 62 Q114 52 120 70 Z" fill={adorno} {...C} strokeWidth="1.5" />
      ) : (
        <path d="M100 44 L94 62 L102 62 L96 80" fill="none" stroke={adorno} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </g>
  );
}

// ---------- Piezas de los atuendos de la FES Aragón (premio del Mundo 2) ----------

const AZUL_FES = '#1d3f8f';
const ORO = '#f5b700';

function Audifonos() {
  return (
    <g>
      <path d="M40 104 Q38 36 100 32 Q162 36 160 104" fill="none" stroke={R.negro} strokeWidth="7" strokeLinecap="round" />
      <path d="M40 104 Q38 36 100 32 Q162 36 160 104" fill="none" stroke={ORO} strokeWidth="2" strokeLinecap="round" strokeDasharray="1 7" />
      <rect x="28" y="88" width="16" height="30" rx="7" fill={R.negro} {...C} />
      <rect x="156" y="88" width="16" height="30" rx="7" fill={R.negro} {...C} />
      <circle cx="36" cy="103" r="3" fill={ORO} /><circle cx="164" cy="103" r="3" fill={ORO} />
    </g>
  );
}

/** Patita dorada al centro de la sudadera. Va en la franja que se ve entre la cabeza (llega a y≈152) y los tenis
 * (desde y≈170), grande y con borde oscuro para que se lea bien sobre el azul. */
function Patita() {
  return (
    <g fill={ORO} stroke="#7a5600" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M100 160.5 C106 160.5 109.5 165 108.5 168 C107.5 170.5 104 169.5 100 169.5 C96 169.5 92.5 170.5 91.5 168 C90.5 165 94 160.5 100 160.5 Z" />
      {[[90, 159.5, -22], [95.5, 156, -8], [104.5, 156, 8], [110, 159.5, 22]].map(([x, y, r]) => (
        <ellipse key={x} cx={x} cy={y} rx="2.6" ry="3.3" transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </g>
  );
}

function Sudadera({ abajo }) {
  return (
    <g>
      <rect x="60" y="124" width="80" height="58" fill={AZUL_FES} />
            <Patita />
      {abajo}
    </g>
  );
}

function Tenis() {
  return (
    <g {...C} strokeWidth="2">
      <ellipse cx="72" cy="178" rx="16" ry="8" fill={R.blanco} />
      <ellipse cx="128" cy="178" rx="16" ry="8" fill={R.blanco} />
      <path d="M62 180 H82 M118 180 H138" stroke={AZUL_FES} strokeWidth="3" />
      <path d="M66 172 L72 176 M124 172 L130 176" stroke={ORO} strokeWidth="2" />
    </g>
  );
}

// ---------- Piezas de la ropa para el frío (premio del Mundo 3, rumbo al Nevado de Toluca) ----------

function Bufanda({ color, raya }) {
  return (
    <g {...C} strokeWidth="2">
      <path d="M62 128 Q100 142 138 128 L136 140 Q100 152 64 140 Z" fill={color} />
      <path d="M118 138 L124 170 L112 172 L108 141 Z" fill={color} />
      {[148, 156, 164].map((y) => <path key={y} d={`M110 ${y} L123 ${y - 1}`} stroke={raya} strokeWidth="3" />)}
      <path d="M112 172 V178 M117 171 V177 M122 170 V176" stroke={color} strokeWidth="2.5" />
    </g>
  );
}

function Guantes({ color }) {
  return (
    <g fill={color} {...C} strokeWidth="2">
      <ellipse cx="62" cy="158" rx="8" ry="9" /><ellipse cx="138" cy="158" rx="8" ry="9" />
      <path d="M56 152 L52 146 M144 152 L148 146" strokeWidth="4" stroke={color} />
    </g>
  );
}

function BotasNieve({ color }) {
  return (
    <g {...C} strokeWidth="2">
      <ellipse cx="72" cy="177" rx="17" ry="9" fill={color} /><ellipse cx="128" cy="177" rx="17" ry="9" fill={color} />
      <path d="M58 172 Q72 166 86 172 M114 172 Q128 166 142 172" stroke={R.blanco} strokeWidth="5" />
    </g>
  );
}

// ---------- Los 20 trajes de subculturas + los 2 atuendos de la FES + los 2 del Nevado ----------

export const SUBCULTURAS = {
  'emo-rayas': {
    tocado: () => <Fleco color={R.negro} />,
    silueta: () => <path d="M40 84 Q44 44 100 40 Q156 42 160 82 Z" />,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill={R.negro} />
        {[150, 160].map((y) => <rect key={y} x="60" y={y} width="80" height="4" fill={R.rojo} />)}
        <rect x="60" y="168" width="80" height="6" fill={R.gris} /><Estoperoles y={171} />
      </g>
    ),
    detalles: () => <rect x="58" y="146" width="10" height="12" rx="2" fill={R.rosa} {...C} strokeWidth="2" />,
  },
  'emo-mono': {
    tocado: () => (
      <g>
        <Fleco color={R.negro} mechon={R.rosa} />
        <g {...C} fill={R.rosa}><path d="M50 56 L36 44 L38 66 Z" /><path d="M50 56 L64 42 L66 64 Z" /><circle cx="50" cy="56" r="5" /></g>
      </g>
    ),
    silueta: () => <><path d="M40 84 Q44 44 100 40 Q156 42 160 82 Z" /><path d="M36 44 L66 42 L66 66 L36 66 Z" /></>,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="34" fill={R.negro} />
        <Cuadros y={158} alto={24} fondo={R.rosa} linea={R.negro} />
      </g>
    ),
  },
  'hippie-guitarra': {
    tocado: () => (
      <g>
        <CabelloLargo color={R.cafe} />
        <path d="M42 66 Q100 50 158 66 L158 74 Q100 58 42 74 Z" fill={R.morado} {...C} strokeWidth="2" />
        <circle cx="150" cy="68" r="5" fill={R.amarillo} {...C} strokeWidth="1.5" />
        <Lentes />
      </g>
    ),
    silueta: () => <path d="M28 150 Q24 60 100 40 Q176 60 172 150 Z" />,
    herramienta: () => (
      <g {...C}>
        <rect x="16" y="60" width="8" height="70" rx="3" fill={R.cafe} transform="rotate(-12 20 95)" />
        <ellipse cx="28" cy="150" rx="18" ry="24" fill={R.cafeClaro} />
        <circle cx="28" cy="146" r="6" fill={R.negro} />
      </g>
    ),
    ropa: () => <TieDye />,
    detalles: () => <Paz />,
  },
  'hippie-flores': {
    tocado: () => (
      <g>
        <CabelloLargo color={R.mostaza} />
        {[[52, 60, R.rosa], [70, 50, R.amarillo], [90, 45, R.blanco], [110, 45, R.rosa], [130, 50, R.amarillo], [148, 60, R.blanco]].map(([x, y, c]) => (
          <g key={x}>
            {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={x} cy={y - 5} rx="3.5" ry="5.5" transform={`rotate(${a} ${x} ${y})`} fill={c} {...C} strokeWidth="1.2" />)}
            <circle cx={x} cy={y} r="3" fill={R.amarillo} {...C} strokeWidth="1" />
          </g>
        ))}
        <Lentes tinte="rgba(255,95,162,.45)" />
      </g>
    ),
    silueta: () => <path d="M28 150 Q24 50 100 34 Q176 50 172 150 Z" />,
    ropa: () => <TieDye />,
    detalles: () => <Paz />,
  },
  'punk-verde': {
    tocado: () => <Cresta color={R.verde} alto={40} picos={5} />,
    silueta: () => <path d="M72 58 L80 12 L100 10 L120 12 L128 58 Z" />,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill={R.negro} />
        <path d="M100 124 L88 152 L100 182 L112 152 Z" fill={R.manta} />
        <Estoperoles y={150} x0={62} x1={88} /><Estoperoles y={150} x0={112} x1={138} />
      </g>
    ),
    detalles: () => <Botas />,
  },
  'punk-rosa': {
    tocado: () => (
      <g>
        <Cresta color={R.rosa} alto={30} picos={4} />
        <g fill={R.rosa} {...C}><path d="M44 70 L22 60 L30 74 L18 80 L42 82 Z" /><path d="M156 70 L178 60 L170 74 L182 80 L158 82 Z" /></g>
      </g>
    ),
    silueta: () => <><path d="M74 58 L84 20 L116 20 L126 58 Z" /><path d="M44 70 L18 60 L18 82 L44 84 Z M156 70 L182 60 L182 82 L156 84 Z" /></>,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="34" fill={R.negro} />
        <Estoperoles y={150} x0={62} x1={138} />
        <Cuadros y={158} alto={24} fondo={R.rojo} linea={R.negro} />
      </g>
    ),
    detalles: () => <Botas />,
  },
  'skate-gorra': {
    tocado: () => (
      <g {...C}>
        <path d="M46 70 Q48 34 100 32 Q152 34 154 70 Q100 56 46 70 Z" fill={R.azul} />
        <path d="M46 66 Q24 64 16 74 Q30 80 50 74 Z" fill={R.azul} />
        <circle cx="100" cy="34" r="4" fill={R.amarillo} />
      </g>
    ),
    silueta: () => <path d="M14 76 Q20 30 100 28 Q156 32 156 72 Z" />,
    herramienta: () => <Patineta color={R.rojo} />,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill={R.gris} />
        <rect x="80" y="160" width="40" height="14" rx="4" fill={R.negroLuz} />
        <path d="M92 140 V154 M108 140 V154" stroke={R.blanco} strokeWidth="2.5" />
      </g>
    ),
  },
  'skate-gorro': {
    tocado: () => (
      <g {...C}>
        <path d="M44 72 Q46 26 100 24 Q154 26 156 72 Z" fill={R.mostaza} />
        <rect x="42" y="62" width="116" height="14" rx="6" fill={R.amarillo} />
        {[54, 66, 78, 90, 102, 114, 126, 138, 150].map((x) => <path key={x} d={`M${x} 64 V74`} stroke={R.mostaza} strokeWidth="2" />)}
        <circle cx="100" cy="22" r="9" fill={R.rosa} />
      </g>
    ),
    silueta: () => <path d="M42 78 Q44 10 100 12 Q156 10 158 78 Z" />,
    herramienta: () => <Patineta color={R.morado} />,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill={R.morado} />
        <rect x="80" y="160" width="40" height="14" rx="4" fill="#5a3fb0" />
        <path d="M92 140 V154 M108 140 V154" stroke={R.blanco} strokeWidth="2.5" />
      </g>
    ),
  },
  'manif-xochimilco': {
    tocado: () => (
      <g {...C}>
        <path d="M48 66 Q50 34 100 32 Q150 34 152 66 Z" fill={R.verde} />
        <path d="M60 64 Q100 74 150 62 Q156 72 146 76 Q100 84 62 72 Z" fill={R.verde} />
        <path d="M84 40 Q100 36 116 40" fill="none" stroke={R.blanco} strokeWidth="2" />
      </g>
    ),
    silueta: (cabeza) => <><path d="M48 70 Q50 30 100 28 Q150 30 152 70 Z" />{!cabeza && <rect x="132" y="8" width="66" height="50" rx="6" />}</>,
    herramienta: () => <Pancarta lineas={['¡CUIDEMOS', 'XOCHIMILCO!']} color={R.verde} />,
    ropa: () => <rect x="60" y="124" width="80" height="58" fill={R.manta} />,
    detalles: () => <Paliacate />,
  },
  'manif-ajolote': {
    tocado: () => (
      <g {...C}>
        <path d="M42 80 Q46 38 100 36 Q154 38 158 80 Q130 64 100 64 Q70 64 42 80 Z" fill={R.rojo} />
        {[[66, 54], [84, 46], [104, 44], [124, 48], [142, 58], [76, 64], [122, 62]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill={R.blanco} stroke="none" />)}
        <path d="M152 70 L170 60 L166 78 Z M152 72 L172 82 L158 86 Z" fill={R.rojo} />
      </g>
    ),
    silueta: (cabeza) => <><path d="M42 84 Q46 34 100 32 Q154 34 172 60 L174 86 Z" />{!cabeza && <rect x="132" y="8" width="66" height="50" rx="6" />}</>,
    herramienta: () => <Pancarta lineas={['¡SALVEMOS', 'AL AJOLOTE!']} color={R.rosa} />,
    ropa: () => <rect x="60" y="124" width="80" height="58" fill={R.amarillo} />,
    detalles: () => <Paliacate />,
  },

  // ---------- Ska ----------
  'ska-sombrero': {
    tocado: () => (
      <g {...C}>
        <ellipse cx="100" cy="52" rx="52" ry="9" fill={R.negro} />
        <path d="M68 52 L72 24 Q100 18 128 24 L132 52 Z" fill={R.negro} />
        <rect x="70" y="40" width="60" height="7" fill={R.blanco} strokeWidth="2" />
      </g>
    ),
    silueta: () => <><ellipse cx="100" cy="52" rx="52" ry="9" /><path d="M68 52 L72 24 Q100 18 128 24 L132 52 Z" /></>,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill={R.blanco} />
        <Ajedrez y={168} />
        <path d="M84 124 V168 M116 124 V168" stroke={R.negro} strokeWidth="5" />
      </g>
    ),
    detalles: () => <path d="M96 140 L104 140 L102 156 L100 160 L98 156 Z" fill={R.negro} {...C} strokeWidth="1.5" />,
  },
  'ska-cuadros': {
    tocado: () => (
      <g>
        <path d="M40 92 Q40 40 100 38 Q160 40 160 92 L152 92 Q150 66 100 64 Q50 66 48 92 Z" fill={R.negro} {...C} />
        <path d="M46 70 Q100 42 154 70" fill="none" stroke={R.negro} strokeWidth="9" strokeLinecap="round" />
        <path d="M46 70 Q100 42 154 70" fill="none" stroke={R.blanco} strokeWidth="5" strokeDasharray="6 6" />
      </g>
    ),
    silueta: () => <path d="M38 94 Q38 34 100 32 Q162 34 162 94 Z" />,
    ropa: () => (
      <g>
        <Ajedrez y={124} filas={8} />
        <path d="M84 124 V182 M116 124 V182" stroke={R.rosa} strokeWidth="5" />
      </g>
    ),
  },

  // ---------- Rap ----------
  'rap-gorra': {
    tocado: () => (
      <g {...C}>
        <path d="M46 66 Q48 30 100 28 Q152 30 154 66 Q100 54 46 66 Z" fill={R.rojo} />
        <path d="M118 58 L178 54 L178 64 L120 68 Z" fill={R.rojo} />
        <circle cx="100" cy="30" r="4" fill={R.blanco} />
        <path d="M70 46 Q100 38 130 46" fill="none" stroke={R.blanco} strokeWidth="2" />
      </g>
    ),
    silueta: () => <><path d="M46 68 Q48 26 100 24 Q152 26 154 68 Z" /><path d="M116 56 L180 52 L180 66 L118 70 Z" /></>,
    herramienta: () => <Grabadora />,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill={R.amarillo} />
        <path d="M60 164 H140" stroke={R.morado} strokeWidth="4" />
        <text x="100" y="178" textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight="900" fontSize="12" fill={R.morado}>10</text>
      </g>
    ),
    detalles: () => <Cadena />,
  },
  'rap-chongo': {
    tocado: () => (
      <g>
        <path d="M40 84 Q42 40 100 38 Q158 40 160 84 Q150 64 100 60 Q50 64 40 84 Z" fill={R.cafe} {...C} />
        <circle cx="100" cy="30" r="15" fill={R.cafe} {...C} />
        <path d="M90 28 Q100 20 110 28" fill="none" stroke={R.cafeClaro} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="42" cy="118" r="10" fill="none" stroke={R.amarillo} strokeWidth="4" />
        <circle cx="158" cy="118" r="10" fill="none" stroke={R.amarillo} strokeWidth="4" />
      </g>
    ),
    silueta: () => <><path d="M40 86 Q42 36 100 34 Q158 36 160 86 Z" /><circle cx="100" cy="30" r="15" /></>,
    herramienta: () => <Microfono />,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill={R.morado} />
        <rect x="80" y="160" width="40" height="14" rx="4" fill="#5a3fb0" />
        <path d="M92 140 V154 M108 140 V154" stroke={R.amarillo} strokeWidth="2.5" />
      </g>
    ),
  },

  // ---------- Rock ----------
  'rock-chopo': {
    tocado: () => <CabelloLargo color={R.negro} />,
    silueta: () => <path d="M28 150 Q24 60 100 40 Q176 60 172 150 Z" />,
    herramienta: () => <GuitarraElectrica color={R.rojo} />,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill={R.negro} />
        <path d="M104 136 L92 156 L102 156 L96 176 L112 150 L102 150 L110 136 Z" fill={R.amarillo} />
        <path d="M60 124 H78 V182 H60 Z M122 124 H140 V182 H122 Z" fill={R.negroLuz} />
      </g>
    ),
    detalles: () => <Botas />,
  },
  'rock-mezclilla': {
    tocado: () => (
      <g>
        <path d="M40 84 Q36 60 50 50 Q56 36 72 40 Q82 28 100 34 Q118 28 128 40 Q144 36 150 50 Q164 60 160 84 Q130 62 100 62 Q70 62 40 84 Z" fill={R.cafeClaro} {...C} />
        <Estrella cx={78} />
        <Estrella cx={122} />
        <path d="M92 98 Q100 94 108 98" fill="none" {...C} />
      </g>
    ),
    silueta: () => <path d="M36 86 Q32 50 70 34 Q100 24 130 34 Q168 50 164 86 Z" />,
    herramienta: () => <GuitarraElectrica color={R.azul} />,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill="#4a6fb5" />
        <rect x="90" y="124" width="20" height="58" fill={R.blanco} />
        <circle cx="74" cy="160" r="6" fill={R.rosa} />
        <rect x="120" y="150" width="11" height="11" fill={R.amarillo} transform="rotate(12 125 155)" />
        <path d="M66 172 H86 M114 172 H134" stroke="#2f4f8f" strokeWidth="2" strokeDasharray="3 3" />
      </g>
    ),
  },

  // ---------- Dark ----------
  'dark-capa': {
    tocado: () => (
      <g>
        <path fillRule="evenodd" d="M30 150 Q22 40 100 24 Q178 40 170 150 Z M100 58 Q48 60 46 104 Q48 146 100 148 Q152 146 154 104 Q152 60 100 58 Z"
          fill={R.negro} {...C} />
        <path d="M100 58 Q48 60 46 104 Q48 146 100 148 Q152 146 154 104 Q152 60 100 58 Z" fill="none" stroke={R.morado} strokeWidth="3" />
      </g>
    ),
    silueta: () => <path d="M30 150 Q22 36 100 20 Q178 36 170 150 Z" />,
    herramienta: () => <Capa color={R.negro} forro={R.morado} />,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill={R.negroLuz} />
        <path d="M106 150 A10 10 0 1 1 106 170 A7 7 0 1 0 106 150 Z" fill={R.grisClaro} />
      </g>
    ),
  },
  'dark-encaje': {
    tocado: () => (
      <g>
        <CabelloLargo color={R.negro} />
        <path d="M44 74 Q100 50 156 74" fill="none" stroke={R.negro} strokeWidth="8" strokeLinecap="round" />
        <path d="M46 78 Q100 58 154 78" fill="none" stroke={R.negroLuz} strokeWidth="4" strokeDasharray="2 5" strokeLinecap="round" />
        {[62, 138].map((x) => (
          <g key={x} {...C} strokeWidth="1.5">
            <circle cx={x} cy={x < 100 ? 66 : 66} r="8" fill={R.morado} />
            <path d={`M${x - 4} 64 Q${x} 58 ${x + 4} 64 Q${x} 70 ${x - 4} 64 Z`} fill="#5a3fb0" />
          </g>
        ))}
      </g>
    ),
    silueta: () => <path d="M28 150 Q24 60 100 40 Q176 60 172 150 Z" />,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill={R.negro} />
        {[66, 78, 90, 102, 114, 126, 138].map((x) => <circle key={x} cx={x} cy="166" r="5" fill="none" stroke={R.morado} strokeWidth="2" />)}
        <path d="M60 154 H140" stroke={R.morado} strokeWidth="4" />
      </g>
    ),
  },

  // ---------- Lucha libre ----------
  'lucha-azul': {
    tocado: () => <Mascara color={R.azul} adorno={R.blanco} flamas={false} />,
    herramienta: () => <Capa color={R.rojo} forro={R.amarillo} />,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill={R.azul} />
        <rect x="60" y="158" width="80" height="10" fill={R.amarillo} />
        <circle cx="100" cy="163" r="7" fill={R.amarillo} stroke="var(--tinta)" strokeWidth="2" />
      </g>
    ),
  },
  'lucha-rosa': {
    tocado: () => <Mascara color={R.rosa} adorno={R.amarillo} flamas />,
    herramienta: () => <Capa color={R.morado} forro={R.rosa} />,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill={R.rosa} />
        <rect x="60" y="158" width="80" height="10" fill={R.amarillo} />
        <circle cx="100" cy="163" r="7" fill={R.amarillo} stroke="var(--tinta)" strokeWidth="2" />
      </g>
    ),
  },

  // ---------- Rumbo a la FES Aragón (premio del Mundo 2): sudadera azul con patita dorada, tenis y audífonos ----------
  'fes-gorra': {
    tocado: () => (
      <g>
        <g {...C}>
          <path d="M48 68 Q50 32 100 30 Q150 32 152 68 Q100 56 48 68 Z" fill={AZUL_FES} />
          <path d="M60 66 Q100 76 150 64 Q156 74 146 78 Q100 86 62 74 Z" fill={AZUL_FES} />
        </g>
        <circle cx="100" cy="46" r="5" fill={ORO} />
        <Audifonos />
      </g>
    ),
    silueta: () => <><path d="M46 70 Q48 28 100 26 Q152 28 154 70 Z" /><rect x="26" y="86" width="20" height="34" rx="8" /><rect x="154" y="86" width="20" height="34" rx="8" /></>,
    ropa: () => <Sudadera abajo={<rect x="60" y="171" width="80" height="11" fill="#3a4a6b" />} />,
    detalles: () => <Tenis />,
  },
  'fes-cabello': {
    tocado: () => (
      <g>
        <CabelloLargo color={R.cafe} />
        <circle cx="140" cy="62" r="5" fill={ORO} {...C} strokeWidth="1.5" />
        <Audifonos />
      </g>
    ),
    silueta: () => <><path d="M28 150 Q24 60 100 40 Q176 60 172 150 Z" /><rect x="26" y="86" width="20" height="34" rx="8" /><rect x="154" y="86" width="20" height="34" rx="8" /></>,
    ropa: () => (
      <Sudadera abajo={(
        <g>
          <rect x="60" y="171" width="80" height="11" fill="#c9c6d8" />
          {[68, 80, 92, 104, 116, 128].map((x) => <path key={x} d={`M${x} 171 L${x + 3} 182`} stroke="#9a96b0" strokeWidth="2" />)}
        </g>
      )} />
    ),
    detalles: () => <Tenis />,
  },

  // ---------- Rumbo al Nevado de Toluca (premio del Mundo 3): ropa para el frío ----------
  'nevado-gorro': {
    tocado: () => (
      <g {...C}>
        <path d="M44 74 Q44 22 100 20 Q156 22 156 74 Z" fill="#d62839" />
        {[52, 76, 100, 124, 148].map((x) => <path key={x} d={`M${x} 30 L${x - 8} 42 L${x} 54 L${x + 8} 42 Z`} fill={R.blanco} strokeWidth="1.5" />)}
        <rect x="40" y="62" width="120" height="16" rx="7" fill={R.blanco} />
        {[52, 64, 76, 88, 100, 112, 124, 136, 148].map((x) => <path key={x} d={`M${x} 65 V75`} stroke={R.grisClaro} strokeWidth="2" />)}
        <circle cx="100" cy="16" r="11" fill={R.blanco} />
      </g>
    ),
    silueta: () => <path d="M38 80 Q40 0 100 4 Q160 0 162 80 Z" />,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill="#f37021" />
        {[138, 152, 166].map((y) => <path key={y} d={`M60 ${y} Q100 ${y + 6} 140 ${y}`} stroke="#b84d0c" strokeWidth="2.5" fill="none" />)}
        <path d="M100 124 V182" stroke="#1f1b2e" strokeWidth="2.5" />
        <rect x="97" y="134" width="6" height="8" rx="1" fill="#c9c6d8" />
      </g>
    ),
    detalles: () => <g><Bufanda color="#2e9e44" raya={R.blanco} /><Guantes color="#d62839" /><BotasNieve color="#6b4226" /></g>,
  },
  'nevado-orejeras': {
    tocado: () => (
      <g>
        <path d="M44 92 Q42 30 100 28 Q158 30 156 92" fill="none" stroke={R.morado} strokeWidth="6" strokeLinecap="round" />
        <g fill="#f3e7ff" {...C}>
          {[[40, 98], [160, 98]].map(([x, y]) => (
            <g key={x}>
              <circle cx={x} cy={y} r="15" />
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <circle key={a} cx={x + 12 * Math.cos((a * Math.PI) / 180)} cy={y + 12 * Math.sin((a * Math.PI) / 180)} r="5" strokeWidth="1.5" />
              ))}
              <circle cx={x} cy={y} r="8" fill="#c7a6ff" strokeWidth="1.5" />
            </g>
          ))}
        </g>
      </g>
    ),
    silueta: () => <><path d="M40 96 Q38 24 100 22 Q162 24 160 96 Z" /><circle cx="40" cy="98" r="20" /><circle cx="160" cy="98" r="20" /></>,
    ropa: () => (
      <g>
        <rect x="60" y="124" width="80" height="58" fill="#1f9aa8" />
        <path d="M100 124 V182" stroke="#13707b" strokeWidth="2.5" />
        {[138, 152, 166].map((y) => <circle key={y} cx="108" cy={y} r="3" fill={R.amarillo} stroke="var(--tinta)" strokeWidth="1.5" />)}
        <rect x="60" y="174" width="80" height="8" fill="#f3e7ff" />
      </g>
    ),
    detalles: () => <g><Bufanda color={R.morado} raya={R.rosaClaro} /><Guantes color="#f3e7ff" /><BotasNieve color="#7b5cd6" /></g>,
  },
};
