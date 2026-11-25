// Comprensión por tema (profesor), con lo que cada alumno resolvió en las ACTIVIDADES del aula (escaneadas y
// revisadas por Kiko). La categoría la decide el código (app/actividades.py), nunca el modelo:
//   dificultad → comprende → domina   (orden de menos a más; rampa azul de un solo tono, validada para daltonismo)
// Solo apodos, sin rankings: los alumnos van en orden alfabético.
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import I from './IconosUI.jsx';

export const CATEGORIAS = [
  { id: 'dificultad', nombre: 'Se le dificulta', corto: 'Dificultad' },
  { id: 'comprende', nombre: 'Lo comprende', corto: 'Comprende' },
  { id: 'domina', nombre: 'Lo domina', corto: 'Domina' },
];

/** Para la caja "Tutor sugiere" del panel: una frase corta con lo más importante de ese alumno. */
export function sugerenciaCorta(alumno, temas) {
  if (!alumno) return null;
  const nombre = Object.fromEntries(temas.map((t) => [t.concepto, t.nombre]));
  const de = (cat) => Object.entries(alumno.temas).filter(([, v]) => v.categoria === cat).map(([c]) => nombre[c] || c);
  const dif = de('dificultad');
  const comp = Object.entries(alumno.temas).filter(([, v]) => v.frase === 'No lo termina de comprender').map(([c]) => nombre[c] || c);
  const dom = de('domina');
  if (dif.length) return `Reforzar ${dif.join(', ')}: todavía se le dificulta.`;
  if (comp.length) return `Practicar ${comp.join(', ')}: lo está comprendiendo, pero le falta corregir algunos.`;
  if (dom.length) return `Domina ${dom.join(', ')}: dale un reto mayor o pídele que lo explique al grupo.`;
  if (Object.keys(alumno.temas).length) return 'Va comprendiendo lo que ha resuelto en las actividades.';
  return null;
}

/** Gráfica: por tema, cuántos alumnos están en cada categoría. Filtros por categoría y por alumno (apodo). */
export function GraficaComprension({ datos, onAlumno }) {
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState(null);
  const [tip, setTip] = useState(null);
  const caja = useRef(null);

  const alumnos = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (datos?.alumnos || []).filter((a) => !q || a.apodo.toLowerCase().includes(q) || a.usuario.toLowerCase().includes(q));
  }, [datos, busqueda]);

  const filas = useMemo(() => (datos?.temas || []).map((t) => {
    const por = Object.fromEntries(CATEGORIAS.map((c) => [c.id, []]));
    for (const a of alumnos) {
      const v = a.temas[t.concepto];
      if (v) por[v.categoria].push(a);
    }
    return { ...t, por, total: CATEGORIAS.reduce((n, c) => n + por[c.id].length, 0) };
  }).filter((f) => f.total > 0), [datos, alumnos]);

  const totales = Object.fromEntries(CATEGORIAS.map((c) => [c.id, filas.reduce((n, f) => n + f.por[c.id].length, 0)]));
  const maximo = Math.max(1, ...filas.map((f) => f.total));
  const enCategoria = categoria
    ? filas.flatMap((f) => f.por[categoria].map((a) => ({ a, tema: f.nombre, frase: a.temas[f.concepto].frase }))) : [];

  const mostrar = (e, texto) => {
    const r = caja.current?.getBoundingClientRect();
    const m = e.currentTarget.getBoundingClientRect();
    if (r) setTip({ texto, x: m.left - r.left + m.width / 2, y: m.top - r.top });
  };

  return (
    <section className="tarjeta tarjeta-grande pila-md comprension">
      <div>
        <h2 className="t-lg" style={{ margin: 0 }}><I n="diana" tamano={24} className="texto-naranja" /> Comprensión del grupo por tema</h2>
        <p className="cuerpo-md texto-suave" style={{ margin: '2px 0 0' }}>
          Con lo que resolvieron en las actividades (en su cuaderno, revisado por Kiko). Cada barra cuenta alumnos.
        </p>
      </div>

      {/* Filtros: una sola fila, arriba de la gráfica */}
      <div className="comp-filtros">
        <label className="comp-buscar">
          <I n="lupa" tamano={16} />
          <input className="entrada entrada-chica" type="search" placeholder="Buscar alumno por apodo" value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar alumno por apodo o usuario" />
        </label>
        <div className="chips" role="group" aria-label="Filtrar por categoría" style={{ margin: 0 }}>
          <button className={`chip-tab${!categoria ? ' activo' : ''}`} onClick={() => setCategoria(null)}>Todas</button>
          {CATEGORIAS.map((c) => (
            <button key={c.id} className={`chip-tab${categoria === c.id ? ' activo' : ''}`} aria-pressed={categoria === c.id}
              onClick={() => setCategoria(categoria === c.id ? null : c.id)}>
              <span className={`comp-muestra comp-${c.id}`} aria-hidden="true" /> {c.corto} · {totales[c.id]}
            </button>
          ))}
        </div>
      </div>

      {filas.length === 0 ? (
        <p className="cuerpo-md texto-suave">
          {datos?.alumnos?.length ? (busqueda ? 'Nadie coincide con esa búsqueda.' : <>Todavía no hay problemas resueltos en las actividades. <a className="enlace" href="#/actividades">Deja una actividad</a> para ver cómo van.</>)
            : 'Comparte el código para que tus alumnos se unan.'}
        </p>
      ) : (
        <div className="comp-grafica" ref={caja} onMouseLeave={() => setTip(null)}>
          {filas.map((f) => (
            <div key={f.concepto} className="comp-fila">
              <span className="comp-tema">{f.nombre}</span>
              <div className="comp-barra" style={{ width: `${(100 * f.total) / maximo}%` }}>
                {CATEGORIAS.map((c) => f.por[c.id].length > 0 && (
                  <button key={c.id} type="button"
                    className={`comp-seg comp-${c.id}${categoria && categoria !== c.id ? ' atenuado' : ''}`}
                    style={{ flexGrow: f.por[c.id].length }}
                    aria-label={`${f.nombre}: ${c.nombre}, ${f.por[c.id].length} alumno(s)`}
                    onMouseEnter={(e) => mostrar(e, `${f.nombre} · ${c.nombre}: ${f.por[c.id].map((a) => a.apodo).join(', ')}`)}
                    onFocus={(e) => mostrar(e, `${f.nombre} · ${c.nombre}: ${f.por[c.id].map((a) => a.apodo).join(', ')}`)}
                    onBlur={() => setTip(null)}
                    onClick={() => setCategoria(c.id)}>
                    {f.por[c.id].length}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {tip && <div className="comp-tip" role="status" style={{ left: tip.x, top: tip.y }}>{tip.texto}</div>}
          <div className="comp-leyenda" aria-hidden="true">
            {CATEGORIAS.map((c) => <span key={c.id}><span className={`comp-muestra comp-${c.id}`} /> {c.nombre}</span>)}
          </div>
        </div>
      )}

      {categoria && (
        <div className="tarjeta-suave">
          <span className="sobre gris">{CATEGORIAS.find((c) => c.id === categoria).nombre} ({enCategoria.length})</span>
          {enCategoria.length === 0 ? <p className="cuerpo-sm texto-suave">Nadie en esta categoría.</p> : (
            <ul className="comp-lista">
              {enCategoria.map(({ a, tema, frase }, i) => (
                <li key={i}>
                  <button className="enlace" onClick={() => onAlumno(a)}>{a.apodo}</button>
                  <span className="texto-suave"> · {tema} · {frase}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {filas.length > 0 && (
        <details>
          <summary className="cuerpo-sm">Ver como tabla</summary>
          <div className="tabla-scroll">
            <table className="tabla-respuestas">
              <thead><tr><th scope="col">Tema</th>{CATEGORIAS.map((c) => <th key={c.id} scope="col">{c.nombre}</th>)}</tr></thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.concepto}><th scope="row">{f.nombre}</th>
                    {CATEGORIAS.map((c) => <td key={c.id}>{f.por[c.id].length} {f.por[c.id].length ? `(${f.por[c.id].map((a) => a.apodo).join(', ')})` : ''}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}

const ICONO_CAT = { dificultad: 'info', comprende: 'pulso', domina: 'checkCirculo' };
const ICONO_RESP = { bien: '✓', con_ayuda: '✓', mal: '✗', pendiente: '–' };

/** Detalle de un alumno: "Tutor sugiere" por tema y sus respuestas en cada actividad, en palabras. */
export function TutorSugiere({ aulaId, alumnoId }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.comprensionAlumno(aulaId, alumnoId).then(setD).catch(() => setD(false)); }, [aulaId, alumnoId]);
  if (d === null) return <p className="cuerpo-sm texto-suave">Cargando lo que observó Kiko…</p>;
  if (!d) return null;
  return (
    <div className="pila-md">
      <section className="caja-diag caja-sugiere pila-sm" style={{ alignItems: 'stretch' }}>
        <span className="diag-titulo texto-naranja"><I n="foco" tamano={16} /> Tutor sugiere</span>
        {d.temas.length === 0 ? (
          <p className="cuerpo-sm" style={{ margin: 0 }}>Todavía no resuelve problemas de las actividades. Cuando los escanee, aquí verás qué domina y qué le cuesta.</p>
        ) : (
          <div className="sugiere-grid">
            {d.temas.map((t) => (
              <article key={t.concepto} className={`sugiere-tema sug-${t.categoria}`}>
                <div className="fila-entre">
                  <b className="t-sm">{t.nombre}</b>
                  <span className="chip chip-blanco"><span className={`comp-muestra comp-${t.categoria}`} aria-hidden="true" /> <I n={ICONO_CAT[t.categoria]} tamano={12} /> {t.frase}</span>
                </div>
                <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>
                  {t.problemas} problema{t.problemas === 1 ? '' : 's'}: {t.a_la_primera} a la primera, {t.con_ayuda} con ayuda de Kiko
                  {t.sin_resolver ? `, ${t.sin_resolver} sin corregir` : ''}.
                </p>
                {t.error_frecuente && <p className="cuerpo-sm" style={{ margin: 0 }}><b>Se le complica:</b> {t.error_frecuente}.</p>}
                {t.le_ha_funcionado.length > 0 && <p className="cuerpo-sm" style={{ margin: 0 }}><b>Le ha funcionado:</b> {t.le_ha_funcionado.join(', ')}.</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      {d.actividades.length > 0 && (
        <section className="pila-sm">
          <h3 className="t-sm" style={{ margin: 0 }}>Sus respuestas en las actividades</h3>
          {d.actividades.map((a) => (
            <div key={a.id} className="tarjeta-suave">
              <div className="fila-entre">
                <b className="t-sm">{a.titulo}</b>
                {a.entregada ? <span className="chip chip-verde">Entregada</span> : <span className="chip chip-gris">Sin entregar</span>}
              </div>
              <ul className="lista-intentos-stitch">
                {a.respuestas.map((r) => (
                  <li key={r.numero} className={r.estado === 'bien' || r.estado === 'con_ayuda' ? 'ok' : r.estado === 'mal' ? 'casi' : ''}>
                    <b>{ICONO_RESP[r.estado]} Pregunta {r.numero}: {r.texto}</b>
                    <span>{r.nota}</span>
                    <span className="texto-suave">{r.tema}{r.enunciado ? ` · ${r.enunciado}` : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
