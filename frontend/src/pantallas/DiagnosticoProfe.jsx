// Diagnóstico (profesor): resultados del examen de entrada por habilidad y avance de cada alumno.
// Reglas: solo apodos, sin rankings (orden alfabético) y privado (no se proyecta).
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import I from '../componentes/IconosUI.jsx';

const iniciales = (t) => t.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
const precision = (a) => (a.intentos ? Math.round(((a.intentos - a.fallos) / a.intentos) * 100) : null);

/** Lectura rápida de cada alumno a partir de sus números (reglas simples, sin IA). */
function lectura(a, apoyo, queReforzar) {
  const prec = precision(a);
  const necesita = apoyo.has(a.id);
  let fortaleza = 'Está empezando su exploración de la selva.';
  if (a.porcentaje >= 100) fortaleza = 'Terminó todos los retos disponibles de la selva.';
  else if (prec !== null && prec >= 80) fortaleza = `Excelente precisión: acierta el ${prec}% de sus intentos.`;
  else if (a.racha_dias >= 3) fortaleza = `Constancia: lleva una racha de ${a.racha_dias} días.`;
  else if (a.retos_completados > 0 && a.pistas_usadas <= a.retos_completados) fortaleza = 'Resuelve con autonomía: usa pocas pistas.';

  let oportunidad = { texto: 'Listo para retos con más profundidad.', icono: 'pulso', tono: '' };
  if (a.retos_completados === 0) oportunidad = { texto: 'Aún no inicia sus retos.', icono: 'info', tono: 'casi' };
  else if (necesita) oportunidad = { texto: `Se le dificulta: ${a.fallos} tropiezos en ${a.intentos} intentos.`, icono: 'info', tono: 'casi' };
  else if (a.pistas_usadas > a.retos_completados * 2) oportunidad = { texto: 'Depende bastante de las pistas.', icono: 'foco', tono: 'casi' };

  let sugiere = 'Asignar el siguiente mundo como misión.';
  if (a.porcentaje >= 100) sugiere = 'Ya terminó la selva disponible: invítalo a explicar su método al grupo.';
  else if (necesita || a.retos_completados === 0) sugiere = queReforzar || 'Repasar con material concreto (monedas o bolsitas) antes del siguiente reto.';
  return { fortaleza, oportunidad, sugiere, necesita };
}

const ESTADO_PREGUNTA = {
  a_la_primera: { texto: 'A la primera', clase: 'ok' },
  con_ayuda: { texto: 'Con ayuda', clase: 'ayuda' },
  por_reforzar: { texto: 'Por reforzar', clase: 'casi' },
  pendiente: { texto: 'Sin contestar', clase: 'pendiente' },
};

const minutos = (ms) => (ms >= 60000 ? `${Math.round(ms / 60000)} min` : `${Math.max(1, Math.round(ms / 1000))} s`);

/** Estado del examen general del Mundo 1 en la tarjeta de cada alumno. */
function ChipExamen({ examen }) {
  if (!examen || examen.estado === 'sin_empezar') return null;
  return examen.estado === 'terminado'
    ? <span className="chip chip-verde"><I n="birrete" tamano={12} /> Examen Mundo 1: {examen.aciertos}/{examen.total}</span>
    : <span className="chip chip-ambar"><I n="birrete" tamano={12} /> Examen Mundo 1 en curso</span>;
}

/** Reporte completo del examen general: resultado, fallas, pistas, intentos y tiempo de cada pregunta. */
function ReporteExamen({ r }) {
  return (
    <section className="reporte-examen">
      <div className="fila-entre" style={{ alignItems: 'flex-start' }}>
        <div>
          <span className="sobre"><I n="birrete" tamano={14} /> Examen general</span>
          <h3 className="t-md" style={{ margin: '2px 0 0' }}>{r.mundo}</h3>
          <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>
            {r.terminado ? `Terminado el ${new Date(r.fin).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}` : 'Todavía no lo termina'}
            {' · '}tiempo total {minutos(r.tiempo_total_ms)}
          </p>
        </div>
        <span className="pastilla"><b>{r.aciertos}/{r.total}</b>&nbsp;logradas</span>
      </div>
      <div className="chips" style={{ margin: '10px 0' }}>
        <span className="chip chip-verde">✓ {r.a_la_primera} a la primera</span>
        <span className="chip">{r.con_ayuda} con ayuda</span>
        <span className="chip chip-ambar">{r.por_reforzar.length} por reforzar</span>
        <span className="chip chip-blanco">{r.fallas_total} fallas</span>
        <span className="chip chip-blanco">{r.pistas_total} pistas</span>
      </div>
      {r.por_reforzar.length > 0 && (
        <p className="cuerpo-sm" style={{ margin: '0 0 10px' }}><b className="texto-casi">Reforzar:</b> {r.por_reforzar.join(', ')}.</p>
      )}
      <div className="tabla-scroll">
        <table className="tabla-examen">
          <thead>
            <tr><th>#</th><th>Tema</th><th>Resultado</th><th>Respuestas incorrectas</th><th>Correcta</th><th>Intentos</th><th>Pistas</th><th>Tiempo</th></tr>
          </thead>
          <tbody>
            {r.preguntas.map((p) => {
              const e = ESTADO_PREGUNTA[p.estado] || ESTADO_PREGUNTA.pendiente;
              return (
                <tr key={p.id}>
                  <td>{p.nivel}</td>
                  <td><b>{p.tema}</b><small className="texto-suave">{p.titulo}</small></td>
                  <td><span className={`estado-pregunta ${e.clase}`}>{e.texto}</span></td>
                  <td>{p.respuestas_incorrectas.length ? p.respuestas_incorrectas.join(', ') : <span className="texto-suave">—</span>}</td>
                  <td>{p.respuesta_correcta}</td>
                  <td>{p.intentos}</td>
                  <td>{p.pistas}</td>
                  <td>{p.tiempo_ms ? minutos(p.tiempo_ms) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function descargarCsv(panel) {
  const filas = [['Apodo', 'Usuario', 'Retos completados', 'Total', '%', 'Estrellas', 'Racha', 'Intentos', 'Fallos', 'Pistas', 'Examen Mundo 1']];
  panel.alumnos.forEach((a) => {
    const ex = a.examenes?.x1;
    const examen = !ex || ex.estado === 'sin_empezar' ? 'Sin empezar' : ex.estado === 'terminado' ? `${ex.aciertos}/${ex.total}` : 'En curso';
    filas.push([a.apodo, a.usuario, a.retos_completados, a.total_retos, a.porcentaje, a.estrellas_ganadas, a.racha_dias, a.intentos, a.fallos, a.pistas_usadas, examen]);
  });
  const csv = filas.map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `informe-${panel.aula.nombre.replace(/\W+/g, '-')}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}

function Panel({ aulaId, onAlumno }) {
  const [p, setP] = useState(null);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState(false);
  useEffect(() => {
    api.panel(aulaId).then(setP).catch((e) => setError(e.message));
  }, [aulaId]);
  if (error) return <div className="aviso-casi">{error}</div>;
  if (!p) return <section className="tarjeta"><p className="cuerpo-md texto-suave">Cargando panel…</p></section>;
  const apoyo = new Set(p.necesitan_apoyo.map((a) => a.id));
  const lista = filtro ? p.alumnos.filter((a) => apoyo.has(a.id)) : p.alumnos;

  return (
    <section className="tarjeta tarjeta-grande">
      <div className="fila-entre" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2 className="t-lg" style={{ margin: 0 }}><I n="cerebro" tamano={24} className="texto-naranja" /> Avance Académico & Diagnóstico por Alumno</h2>
          <p className="cuerpo-md texto-suave" style={{ margin: '2px 0 0' }}>Análisis generado con las respuestas de los retos. <b className="texto-naranja">Privado: no lo proyectes.</b></p>
        </div>
        <div className="pila-sm" style={{ alignItems: 'flex-end' }}>
          <button className={`chip-tab${filtro ? ' activo' : ''}`} onClick={() => setFiltro(!filtro)}><I n="filtro" tamano={14} /> {filtro ? 'Ver a todos' : 'Solo quienes necesitan apoyo'}</button>
          <button className="btn btn-naranja btn-chico" onClick={() => descargarCsv(p)} disabled={!p.alumnos.length}><I n="descargar" tamano={18} /> Descargar informe (Excel / CSV)</button>
        </div>
      </div>

      {(p.errores_comunes.length > 0 || p.que_reforzar) && (
        <div className="resumen-grupo">
          {p.errores_comunes.length > 0 && (
            <div className="tarjeta-suave">
              <span className="sobre gris">Errores más comunes</span>
              {p.errores_comunes.map((e) => (
                <div key={e.id} className="fila-entre cuerpo-sm" style={{ marginTop: 6 }}>
                  <span>{e.texto} <span className="texto-suave">({e.alumnos} alumno{e.alumnos === 1 ? '' : 's'})</span></span>
                  <b>{e.veces}×</b>
                </div>
              ))}
            </div>
          )}
          {p.que_reforzar && (
            <div className="tarjeta-suave sugerencia-stitch">
              <span className="sobre"><I n="foco" tamano={14} /> Qué reforzar mañana</span>
              <p className="cuerpo-sm" style={{ margin: '6px 0 0' }}>{p.que_reforzar}</p>
            </div>
          )}
        </div>
      )}

      <div className="pila-md" style={{ marginTop: 16 }}>
        {lista.length === 0 && <p className="cuerpo-md texto-suave">{filtro ? 'Nadie necesita apoyo por ahora. 🎉' : 'Comparte el código para que tus alumnos se unan.'}</p>}
        {lista.map((a, n) => {
          const l = lectura(a, apoyo, p.que_reforzar);
          const prec = precision(a);
          return (
            <article key={a.id} className="alumno-carta">
              <div className="alumno-info">
                <div className="alumno-cabeza">
                  <span className={`alumno-avatar a${n % 3}`}>{iniciales(a.apodo)}<span className={`punto ${l.necesita ? 'punto-casi' : 'punto-verde'}`} /></span>
                  <div>
                    <b className="t-md">{a.apodo}</b>
                    <small className="cuerpo-sm texto-suave">@{a.usuario}</small>
                    <div className="chips" style={{ marginTop: 4, marginBottom: 0 }}>
                      <span className="chip chip-blanco"><I n="estrella" tamano={12} className="texto-selva" /> {a.estrellas_ganadas} pts</span>
                      <span className="chip chip-blanco"><I n="fuego" tamano={12} className="c-fuego" /> Racha {a.racha_dias}d</span>
                      <ChipExamen examen={a.examenes?.x1} />
                    </div>
                  </div>
                </div>
                <div className="tarjeta alumno-progreso">
                  <div className="fila-entre etq"><span>Progreso de la selva</span><span className="texto-naranja">{a.porcentaje}%</span></div>
                  <div className="barra-prog naranja" style={{ margin: '6px 0' }}><span style={{ width: `${a.porcentaje}%` }} /></div>
                  <div className="fila-entre cuerpo-sm texto-suave"><span>{a.retos_completados}/{a.total_retos} retos</span><span>{prec === null ? 'Sin intentos' : `${prec}% precisión`}</span></div>
                </div>
              </div>
              <div className="caja-diag">
                <span className="diag-titulo texto-selva"><I n="checkCirculo" tamano={16} /> Fortaleza</span>
                <p className="cuerpo-sm" style={{ margin: 0, flex: 1 }}>{l.fortaleza}</p>
                <small className="texto-suave"><I n="pulso" tamano={12} /> {a.intentos} intentos</small>
              </div>
              <div className={`caja-diag${l.oportunidad.tono === 'casi' ? ' caja-casi' : ''}`}>
                <span className={`diag-titulo ${l.oportunidad.tono === 'casi' ? 'texto-casi' : 'texto-suave'}`}><I n={l.oportunidad.icono} tamano={16} /> Oportunidad</span>
                <p className="cuerpo-sm" style={{ margin: 0, flex: 1 }}>{l.oportunidad.texto}</p>
                <small className="texto-suave"><I n="foco" tamano={12} /> {a.pistas_usadas} pistas usadas</small>
              </div>
              <div className="caja-diag caja-sugiere">
                <span className="diag-titulo texto-naranja"><I n="foco" tamano={16} /> Tutor sugiere</span>
                <p className="cuerpo-sm" style={{ margin: 0, flex: 1 }}><b>{l.sugiere}</b></p>
                <button className="btn btn-naranja btn-chico" onClick={() => onAlumno(a)}>Ver detalle</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DetalleAlumno({ aulaId, alumno, onCerrar, onExpulsar }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.detalleAlumno(aulaId, alumno.id).then(setD); }, [aulaId, alumno.id]);
  return (
    <section className="tarjeta tarjeta-grande">
      <div className="fila-entre">
        <div className="alumno-cabeza">
          <span className="alumno-avatar a0">{iniciales(alumno.apodo)}</span>
          <div><b className="t-lg">{alumno.apodo}</b><small className="cuerpo-sm texto-suave">@{alumno.usuario}</small></div>
        </div>
        <button className="btn btn-crema btn-chico" onClick={onCerrar}><I n="atras" tamano={16} /> Volver al panel</button>
      </div>
      {!d ? <p className="cuerpo-md texto-suave">Cargando…</p> : (
        <>
          <div className="chips" style={{ margin: '16px 0' }}>
            <span className="pastilla">{d.progreso.retos_completados} de {d.progreso.total_retos} retos</span>
            <span className="pastilla">{d.progreso.intentos} intentos</span>
            <span className="pastilla">{d.progreso.pistas_usadas} pistas</span>
            <span className="pastilla"><I n="fuego" tamano={14} className="c-fuego" /> Racha de {d.progreso.racha_dias} día(s)</span>
          </div>
          {(d.examenes || []).map((r) => <ReporteExamen key={r.leccion_id} r={r} />)}
          <h3 className="t-sm">Intentos recientes</h3>
          <ul className="lista-intentos-stitch">
            {d.intentos_recientes.map((i, n) => (
              <li key={n} className={i.correcto ? 'ok' : 'casi'}>
                <b>{i.correcto ? '✓ Acierto' : '¡Casi!'}</b>
                <span>{i.ejercicio_id} · respondió {i.respuesta}</span>
                <span className="texto-suave">
                  {i.tipo_error === 'sumo' ? 'Sumó en vez de multiplicar · ' : i.tipo_error === 'calculo' ? 'Error de cálculo · '
                    : i.tipo_error === 'conteo' ? 'Error al contar · ' : i.tipo_error === 'opcion' ? 'Eligió otra opción · ' : ''}
                  {i.pistas_usadas} pista(s)
                </span>
              </li>
            ))}
            {d.intentos_recientes.length === 0 && <li className="texto-suave">Aún no hay intentos.</li>}
          </ul>
        </>
      )}
      <button className="btn btn-blanco btn-chico" style={{ marginTop: 16 }} onClick={onExpulsar}>Quitar del aula</button>
    </section>
  );
}

function ResumenDiagnostico({ aulaId }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.diagnosticoGrupo(aulaId).then(setD).catch(() => setD(false)); }, [aulaId]);
  if (!d) return null;
  return (
    <section className="tarjeta tarjeta-grande">
      <div className="fila-entre" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2 className="t-lg" style={{ margin: 0 }}><I n="diana" tamano={24} className="texto-naranja" /> Examen diagnóstico de entrada</h2>
          <p className="cuerpo-md texto-suave" style={{ margin: '2px 0 0' }}>Cada alumno lo hace solo al entrar por primera vez. Una pregunta por habilidad.</p>
        </div>
        <span className="pastilla">{d.hechos} de {d.alumnos_total} lo han hecho</span>
      </div>
      {d.hechos === 0 ? <p className="cuerpo-md texto-suave">Todavía nadie del grupo hace su diagnóstico.</p> : (
        <div className="habilidades">
          {d.habilidades.map((h) => {
            const pct = h.de ? Math.round((100 * h.logrado) / h.de) : 0;
            return (
              <div key={h.habilidad} className="habilidad">
                <div className="fila-entre"><b className="t-sm">{h.nombre}</b><span className={`etq ${pct < 50 ? 'texto-casi' : 'texto-selva'}`}>{h.logrado}/{h.de} la dominan</span></div>
                <div className={`barra-prog ${pct < 50 ? 'casi' : ''}`}><span style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      )}
      {d.alumnos.length > 0 && (
        <div className="diag-alumnos">
          {d.alumnos.map((a) => (
            <div key={a.id} className="diag-alumno">
              <b className="t-sm">{a.apodo}</b>
              {a.hecho ? (
                <div className="chips" style={{ margin: 0 }}>
                  {a.habilidades.map((h) => (
                    <span key={h.habilidad} className={`chip ${h.logrado ? 'chip-verde' : 'chip-ambar'}`} title={h.logrado ? 'La domina' : 'Por reforzar'}>{h.logrado ? '✓' : '·'} {h.nombre}</span>
                  ))}
                </div>
              ) : <span className="chip chip-gris">Pendiente</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function DiagnosticoProfe() {
  const [aulas, setAulas] = useState(null);
  const [selId, setSelId] = useState(null);
  const [alumno, setAlumno] = useState(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    const r = await api.aulas();
    setAulas(r.aulas);
    setSelId((id) => id ?? r.aulas[0]?.id ?? null);
  }, []);
  useEffect(() => { cargar().catch((e) => setError(e.message)); }, [cargar]);

  const expulsar = async () => {
    if (!window.confirm(`¿Quitar a ${alumno.apodo} del aula?`)) return;
    try {
      await api.expulsar(selId, alumno.id);
      setAlumno(null);
      setVersion((v) => v + 1);
    } catch (e) { setError(e.message); }
  };

  if (!aulas) return <p className="cuerpo-md texto-suave">Cargando…</p>;

  return (
    <div className="pila-lg">
      <div className="fila-entre">
        <div>
          <span className="sobre"><I n="cerebro" tamano={14} /> Privado: no lo proyectes</span>
          <h1 className="t-xl" style={{ margin: '4px 0 0' }}>Diagnóstico del grupo</h1>
        </div>
        <div className="chips" style={{ margin: 0 }}>
          {aulas.map((a) => (
            <button key={a.id} className={`chip-tab${a.id === selId ? ' activo' : ''}`} onClick={() => { setSelId(a.id); setAlumno(null); }}>{a.nombre}</button>
          ))}
        </div>
      </div>
      {error && <div className="aviso-casi" role="alert">{error}</div>}
      {!selId ? (
        <section className="tarjeta centro-col" style={{ textAlign: 'center' }}>
          <p className="cuerpo-md">Crea un grupo en <a className="enlace" href="#/">Modo Aula</a> para ver su diagnóstico.</p>
        </section>
      ) : alumno ? (
        <DetalleAlumno aulaId={selId} alumno={alumno} onCerrar={() => setAlumno(null)} onExpulsar={expulsar} />
      ) : (
        <>
          <ResumenDiagnostico key={`d-${selId}-${version}`} aulaId={selId} />
          <Panel key={`p-${selId}-${version}`} aulaId={selId} onAlumno={setAlumno} />
        </>
      )}
    </div>
  );
}
