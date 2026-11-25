// Dibujos que pide Kiko en el chat (backend/app/dibujos.py). Claude no genera imágenes: manda datos y aquí se dibujan
// con SVG ligero, en el estilo sticker del juego. Cada dibujo trae su descripción en texto (role="img" + aria-label)
// para lectores de pantalla y para quien no pueda verlo.
//
// Tipos nuevos (fase 3): fracciones (pizza o chocolate), balanza, porcentaje (cuadrícula de 100) y tabla.
// Los de antes (objetos, grupos, recta, decenas, monedas, gráfica, figura) los dibuja VisualCanal del Mundo 1.
import { VisualCanal } from './Canal.jsx';

const TINTA = '#1e1b3a';
const COLORES = ['#ff8c42', '#3a86ff', '#2a9d8f'];
const PARTES = { 2: 'medios', 3: 'tercios', 4: 'cuartos', 5: 'quintos', 6: 'sextos', 7: 'séptimos', 8: 'octavos', 9: 'novenos', 10: 'décimos', 12: 'doceavos' };

function leerFraccion(t) {
  const [n, d = '1'] = String(t).split('/');
  return { n: Number(n), d: Number(d) };
}

function describirFraccion({ n, d }, forma) {
  const cosa = forma === 'barra' ? 'chocolate' : 'pizza';
  if (d === 1) return `${n} ${cosa}${n === 1 ? '' : 's'} entera${n === 1 ? '' : 's'}`;
  return `${cosa} partida en ${d} partes iguales (${PARTES[d] || `${d}-avos`}) con ${n} coloreada${n === 1 ? '' : 's'}`;
}

/** Una pizza (círculo) partida en d partes con n coloreadas. Si n > d, dibuja más pizzas. */
function Pizza({ n, d, color }) {
  const enteras = Math.max(1, Math.ceil(n / d));
  return (
    <span className="dib-fila">
      {Array.from({ length: enteras }, (_, k) => {
        const llenas = Math.min(d, n - k * d);
        return (
          <svg key={k} viewBox="-52 -52 104 104" width="96" height="96" className="sticker" aria-hidden="true">
            <circle r="48" fill="#fff6e5" stroke={TINTA} strokeWidth="3" />
            {d === 1
              ? llenas > 0 && <circle r="48" fill={color} stroke={TINTA} strokeWidth="3" />
              : Array.from({ length: d }, (_, i) => {
                const a0 = (i / d) * 2 * Math.PI - Math.PI / 2;
                const a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
                const grande = 1 / d > 0.5 ? 1 : 0;
                const p = `M0 0 L${48 * Math.cos(a0)} ${48 * Math.sin(a0)} A48 48 0 ${grande} 1 ${48 * Math.cos(a1)} ${48 * Math.sin(a1)} Z`;
                return <path key={i} d={p} fill={i < llenas ? color : '#fff6e5'} stroke={TINTA} strokeWidth="2.5" strokeLinejoin="round" />;
              })}
          </svg>
        );
      })}
    </span>
  );
}

/** Una barra de chocolate partida en d partes con n coloreadas. */
function Chocolate({ n, d }) {
  const enteras = Math.max(1, Math.ceil(n / d));
  return (
    <span className="dib-columna">
      {Array.from({ length: enteras }, (_, k) => {
        const llenas = Math.min(d, n - k * d);
        return (
          <svg key={k} viewBox={`-2 -2 ${d * 24 + 4} 40`} width={Math.min(220, d * 24 + 4)} className="sticker" aria-hidden="true">
            {Array.from({ length: d }, (_, i) => (
              <rect key={i} x={i * 24} y="0" width="24" height="36" rx="3" fill={i < llenas ? '#8d5a3b' : '#f3e3d3'} stroke={TINTA} strokeWidth="2.5" />
            ))}
          </svg>
        );
      })}
    </span>
  );
}

function Fracciones({ fracciones, forma }) {
  const lista = fracciones.map(leerFraccion);
  const descripcion = lista.map((f) => describirFraccion(f, forma)).join('; ');
  return (
    <div className="dib-fracciones" role="img" aria-label={descripcion}>
      {lista.map((f, i) => (
        <figure key={i} className="dib-fraccion">
          {forma === 'barra' ? <Chocolate {...f} /> : <Pizza {...f} color={COLORES[i % COLORES.length]} />}
          <figcaption className="frac"><span>{f.n}</span><span>{f.d}</span></figcaption>
        </figure>
      ))}
    </div>
  );
}

function Balanza({ izquierda, derecha }) {
  const texto = { fontFamily: "'Plus Jakarta Sans', 'Nunito', sans-serif", fontWeight: 800, fontSize: 17, fill: TINTA, textAnchor: 'middle' };
  return (
    <figure className="dib-balanza" role="img" aria-label={`Balanza en equilibrio: de un lado ${izquierda}, del otro ${derecha}`}>
      <svg viewBox="0 0 280 170" className="sticker" aria-hidden="true">
        <path d="M140 34 V150 M105 158 H175" stroke={TINTA} strokeWidth="5" strokeLinecap="round" />
        <path d="M50 44 H230" stroke={TINTA} strokeWidth="5" strokeLinecap="round" />
        <circle cx="140" cy="38" r="8" fill="#ffbe0b" stroke={TINTA} strokeWidth="3" />
        {[[50, izquierda], [230, derecha]].map(([x, etiqueta]) => (
          <g key={x}>
            <path d={`M${x} 44 L${x - 26} 84 M${x} 44 L${x + 26} 84`} stroke={TINTA} strokeWidth="2" />
            <path d={`M${x - 44} 84 H${x + 44} Q${x} 120 ${x - 44} 84 Z`} fill="#ffe0b8" stroke={TINTA} strokeWidth="3" strokeLinejoin="round" />
            <text x={x} y="140" {...texto}>{etiqueta}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

function Porcentaje({ coloreadas }) {
  return (
    <figure className="dib-porcentaje" role="img" aria-label={`Cuadrícula de 100 cuadritos con ${coloreadas} coloreados (${coloreadas} %)`}>
      <div className="dib-cuadricula sticker">
        {Array.from({ length: 100 }, (_, i) => <span key={i} className={i < coloreadas ? 'lleno' : ''} />)}
      </div>
    </figure>
  );
}

function Tabla({ columnas, filas }) {
  return (
    <figure className="dib-tabla">
      <table>
        <thead><tr>{columnas.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr></thead>
        <tbody>{filas.map((f, i) => <tr key={i}>{f.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Dibuja cualquier `dibujo` del tutor (los nuevos aquí; los del Mundo 1 con VisualCanal). */
export default function DibujoTutor({ dibujo }) {
  if (!dibujo) return null;
  const propio = {
    fracciones: () => <Fracciones {...dibujo} />,
    balanza: () => <Balanza {...dibujo} />,
    porcentaje: () => <Porcentaje {...dibujo} />,
    tabla: () => <Tabla {...dibujo} />,
  }[dibujo.tipo];
  if (!propio) return <VisualCanal visual={dibujo} />;
  return <div className="visual-canal dib-tutor">{propio()}</div>;
}
