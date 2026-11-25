// Diagnóstico (profesor): SOLO lo de sus clases y tareas (el Mapa es aparte: es para que los niños jueguen).
// - Gráfica de comprensión por módulo (dificultad / comprende / domina).
// - Panel por alumno: cómo va con sus tareas, qué domina, qué le cuesta y qué sugiere el tutor.
// - Detalle: "Tutor sugiere" por módulo y sus respuestas en palabras.
// Todo sale de las tareas escaneadas y revisadas por Mix (app/actividades.py). Reglas: solo apodos, sin rankings
// (orden alfabético) y privado (no se proyecta).
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import I from '../componentes/IconosUI.jsx';
import { GraficaComprension, TutorSugiere, sugerenciaCorta } from '../componentes/ComprensionProfe.jsx';

const iniciales = (t) => t.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';

/** Lectura de cada alumno con lo de sus tareas (reglas simples, sin IA). */
function lectura(a, temas) {
  const r = a.resumen;
  const nombre = Object.fromEntries(temas.map((t) => [t.concepto, t.nombre]));
  const de = (fn) => Object.entries(a.temas).filter(([, v]) => fn(v)).map(([c]) => nombre[c] || c);
  const domina = de((v) => v.categoria === 'domina');
  const cuesta = de((v) => v.categoria === 'dificultad' || v.frase === 'No lo termina de comprender');
  const necesita = cuesta.length > 0;

  let fortaleza = 'Todavía no hay ejercicios revisados por Mix.';
  if (domina.length) fortaleza = `Domina ${domina.join(', ')}.`;
  else if (r.a_la_primera) fortaleza = `Resolvió ${r.a_la_primera} ejercicio${r.a_la_primera === 1 ? '' : 's'} a la primera.`;
  else if (r.con_ayuda) fortaleza = `Corrige sus errores con ayuda de Mix (${r.con_ayuda}).`;

  let oportunidad = { texto: 'Va bien con sus tareas.', tono: '' };
  if (!r.escaneados) oportunidad = { texto: r.tareas ? 'Aún no empieza sus tareas.' : 'Todavía no hay tareas en este grupo.', tono: 'casi' };
  else if (necesita) {
    oportunidad = { texto: `Le cuesta ${cuesta.join(', ')}.${r.errores[0] ? ` El error que más repite: ${r.errores[0].texto}.` : ''}`, tono: 'casi' };
  }
  else if (r.sin_corregir) oportunidad = { texto: `Tiene ${r.sin_corregir} ejercicio${r.sin_corregir === 1 ? '' : 's'} sin corregir.`, tono: 'casi' };

  const sugiere = sugerenciaCorta(a, temas)
    || (r.tareas ? 'Recuérdale escanear sus tareas para que Mix las revise.' : 'Deja una tarea en Actividades para empezar.');
  return { fortaleza, oportunidad, sugiere, necesita };
}

function descargarCsv(datos, aulaNombre) {
  const filas = [['Apodo', 'Usuario', 'Tareas entregadas', 'Tareas', 'Ejercicios revisados', 'Ejercicios', 'A la primera',
    'Con ayuda de Mix', 'Sin corregir', ...datos.temas.map((t) => t.nombre), 'Error más frecuente']];
  datos.alumnos.forEach((a) => {
    const r = a.resumen;
    filas.push([a.apodo, a.usuario, r.entregadas, r.tareas, r.escaneados, r.ejercicios, r.a_la_primera, r.con_ayuda, r.sin_corregir,
      ...datos.temas.map((t) => a.temas[t.concepto]?.frase || '—'), r.errores[0]?.texto || '—']);
  });
  const csv = filas.map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `informe-${aulaNombre.replace(/\W+/g, '-')}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}

function Panel({ datos, aulaNombre, onAlumno }) {
  const [filtro, setFiltro] = useState(false);
  const lecturas = datos.alumnos.map((a) => ({ a, l: lectura(a, datos.temas) }));
  const lista = filtro ? lecturas.filter(({ l }) => l.necesita) : lecturas;

  return (
    <section className="tarjeta tarjeta-grande">
      <div className="fila-entre" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2 className="t-lg" style={{ margin: 0 }}><I n="cerebro" tamano={24} className="texto-naranja" /> Avance y diagnóstico por alumno</h2>
          <p className="cuerpo-md texto-suave" style={{ margin: '2px 0 0' }}>Con lo que resolvieron en sus tareas. <b className="texto-naranja">Privado: no lo proyectes.</b></p>
        </div>
        <div className="pila-sm" style={{ alignItems: 'flex-end' }}>
          <button className={`chip-tab${filtro ? ' activo' : ''}`} onClick={() => setFiltro(!filtro)}><I n="filtro" tamano={14} /> {filtro ? 'Ver a todos' : 'Solo quienes necesitan apoyo'}</button>
          <button className="btn btn-naranja btn-chico" onClick={() => descargarCsv(datos, aulaNombre)} disabled={!datos.alumnos.length}><I n="descargar" tamano={18} /> Descargar informe (Excel / CSV)</button>
        </div>
      </div>

      {datos.errores_comunes?.length > 0 && (
        <div className="resumen-grupo">
          <div className="tarjeta-suave">
            <span className="sobre gris">Errores más comunes en las tareas</span>
            {datos.errores_comunes.map((e) => (
              <div key={e.texto} className="fila-entre cuerpo-sm" style={{ marginTop: 6 }}>
                <span>{e.texto} <span className="texto-suave">({e.alumnos} alumno{e.alumnos === 1 ? '' : 's'})</span></span>
                <b>{e.veces}×</b>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pila-md" style={{ marginTop: 16 }}>
        {lista.length === 0 && <p className="cuerpo-md texto-suave">{filtro ? 'Nadie necesita apoyo por ahora. 🎉' : 'Comparte el código para que tus alumnos se unan.'}</p>}
        {lista.map(({ a, l }, n) => {
          const r = a.resumen;
          const pct = r.ejercicios ? Math.round((100 * (r.a_la_primera + r.con_ayuda)) / r.ejercicios) : 0;
          return (
            <article key={a.id} className="alumno-carta">
              <div className="alumno-info">
                <div className="alumno-cabeza">
                  <span className={`alumno-avatar a${n % 3}`}>{iniciales(a.apodo)}<span className={`punto ${l.necesita ? 'punto-casi' : 'punto-verde'}`} /></span>
                  <div>
                    <b className="t-md">{a.apodo}</b>
                    <small className="cuerpo-sm texto-suave">@{a.usuario}</small>
                    <div className="chips" style={{ marginTop: 4, marginBottom: 0 }}>
                      <span className="chip chip-blanco"><I n="check" tamano={12} className="texto-selva" /> {r.entregadas}/{r.tareas} tareas entregadas</span>
                    </div>
                  </div>
                </div>
                <div className="tarjeta alumno-progreso">
                  <div className="fila-entre etq"><span>Ejercicios resueltos</span><span className="texto-naranja">{pct}%</span></div>
                  <div className="barra-prog naranja" style={{ margin: '6px 0' }}><span style={{ width: `${pct}%` }} /></div>
                  <div className="fila-entre cuerpo-sm texto-suave">
                    <span>{r.a_la_primera + r.con_ayuda}/{r.ejercicios} ejercicios</span>
                    <span>{r.a_la_primera} a la primera</span>
                  </div>
                </div>
              </div>
              <div className="caja-diag">
                <span className="diag-titulo texto-selva"><I n="checkCirculo" tamano={16} /> Fortaleza</span>
                <p className="cuerpo-sm" style={{ margin: 0, flex: 1 }}>{l.fortaleza}</p>
                <small className="texto-suave"><I n="pulso" tamano={12} /> {r.escaneados} revisados por Mix</small>
              </div>
              <div className={`caja-diag${l.oportunidad.tono === 'casi' ? ' caja-casi' : ''}`}>
                <span className={`diag-titulo ${l.oportunidad.tono === 'casi' ? 'texto-casi' : 'texto-suave'}`}><I n="info" tamano={16} /> Oportunidad</span>
                <p className="cuerpo-sm" style={{ margin: 0, flex: 1 }}>{l.oportunidad.texto}</p>
                <small className="texto-suave"><I n="foco" tamano={12} /> {r.con_ayuda} con ayuda · {r.sin_corregir} sin corregir</small>
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

function DetalleAlumno({ aulaId, alumno, resumen, onCerrar, onExpulsar }) {
  return (
    <section className="tarjeta tarjeta-grande">
      <div className="fila-entre">
        <div className="alumno-cabeza">
          <span className="alumno-avatar a0">{iniciales(alumno.apodo)}</span>
          <div><b className="t-lg">{alumno.apodo}</b><small className="cuerpo-sm texto-suave">@{alumno.usuario}</small></div>
        </div>
        <button className="btn btn-crema btn-chico" onClick={onCerrar}><I n="atras" tamano={16} /> Volver al panel</button>
      </div>
      {resumen && (
        <div className="chips" style={{ margin: '16px 0' }}>
          <span className="pastilla">{resumen.entregadas} de {resumen.tareas} tareas entregadas</span>
          <span className="pastilla">{resumen.a_la_primera} a la primera</span>
          <span className="pastilla">{resumen.con_ayuda} con ayuda de Mix</span>
          <span className="pastilla">{resumen.sin_corregir} sin corregir</span>
        </div>
      )}
      <TutorSugiere aulaId={aulaId} alumnoId={alumno.id} />
      <button className="btn btn-blanco btn-chico" style={{ marginTop: 16 }} onClick={onExpulsar}>Quitar del aula</button>
    </section>
  );
}

export default function DiagnosticoProfe() {
  const [aulas, setAulas] = useState(null);
  const [selId, setSelId] = useState(null);
  const [alumno, setAlumno] = useState(null);
  const [version, setVersion] = useState(0);
  const [comprension, setComprension] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    setComprension(null);
    if (selId) api.comprensionGrupo(selId).then(setComprension).catch(() => setComprension({ temas: [], alumnos: [], errores_comunes: [] }));
  }, [selId, version]);

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
  const sel = aulas.find((a) => a.id === selId);
  const resumenDe = (al) => comprension?.alumnos.find((x) => x.id === al.id)?.resumen;

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
          <p className="cuerpo-md">Crea un grupo en <a className="enlace" href="#/aulas">Modo Aula</a> para ver su diagnóstico.</p>
        </section>
      ) : alumno ? (
        <DetalleAlumno aulaId={selId} alumno={alumno} resumen={resumenDe(alumno)} onCerrar={() => setAlumno(null)} onExpulsar={expulsar} />
      ) : !comprension ? <p className="cuerpo-md texto-suave">Cargando…</p> : (
        <>
          <GraficaComprension key={`g-${selId}-${version}`} datos={comprension} onAlumno={setAlumno} />
          <Panel datos={comprension} aulaNombre={sel?.nombre || 'grupo'} onAlumno={setAlumno} />
        </>
      )}
    </div>
  );
}
