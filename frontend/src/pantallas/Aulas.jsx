// Aulas en línea del maestro (tipo Classroom): código para unirse, alumnos, misiones y panel.
// Sin rankings: la lista va en orden alfabético.
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useJuego } from '../estado/store.jsx';
import { Barra } from '../componentes/Comunes.jsx';
import Ajolote from '../componentes/Ajolote.jsx';

function Panel({ aulaId, onAlumno }) {
  const [p, setP] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api.panel(aulaId).then(setP).catch((e) => setError(e.message));
  }, [aulaId]);
  if (error) return <div className="sm-casi">{error}</div>;
  if (!p) return <p className="cuerpo texto-suave">Cargando panel…</p>;
  const maxErr = Math.max(1, ...p.errores_comunes.map((e) => e.veces));

  return (
    <section className="sm-card">
      <div className="fila-entre" style={{ marginBottom: 'var(--espacio-2)' }}>
        <h2 className="subtitulo" style={{ margin: 0 }}>Panel del grupo</h2>
        <span className="sm-chip">{p.aula.alumnos} alumnos</span>
      </div>
      <p className="etiqueta texto-magia" style={{ marginTop: 0 }}>Privado: no lo proyectes.</p>

      <div className="sec">
        <h3 className="cuerpo-fuerte">Alumnos que necesitan apoyo</h3>
        {p.necesitan_apoyo.length
          ? <div className="chips">{p.necesitan_apoyo.map((a) => <span key={a.id} className="sm-chip">{a.apodo}</span>)}</div>
          : <p className="etiqueta texto-suave">Nadie por ahora.</p>}
      </div>

      <div className="sec">
        <h3 className="cuerpo-fuerte">Errores más comunes</h3>
        {p.errores_comunes.length === 0 && <p className="etiqueta texto-suave">Todavía no hay errores registrados.</p>}
        {p.errores_comunes.map((e) => (
          <div key={e.id} className="fila-error">
            <span>{e.texto} <span className="etiqueta texto-suave">({e.alumnos} alumno{e.alumnos === 1 ? '' : 's'})</span></span>
            <Barra valor={e.veces} max={maxErr} color="magia" etiqueta={`${e.veces} veces`} />
            <b>{e.veces}</b>
          </div>
        ))}
        {p.mundos_con_mas_errores.length > 0 && (
          <p className="etiqueta texto-suave">Mundos con más tropiezos: {p.mundos_con_mas_errores.map((m) => `${m.mundo} (${m.fallos})`).join(', ')}</p>
        )}
      </div>

      {p.que_reforzar && (
        <div className="sec">
          <h3 className="cuerpo-fuerte">Qué reforzar mañana</h3>
          <div className="sugerencia">{p.que_reforzar}</div>
        </div>
      )}

      <div className="sec">
        <h3 className="cuerpo-fuerte">Progreso de cada alumno</h3>
        <div className="tabla-alumnos">
          {p.alumnos.map((a) => (
            <button key={a.id} className="fila-alumno" onClick={() => onAlumno(a)}>
              <b>{a.apodo} <span className="etiqueta texto-suave">@{a.usuario}</span></b>
              <Barra valor={a.retos_completados} max={a.total_retos} color="magia" etiqueta={`${a.porcentaje}% completado`} />
              <span className="etiqueta texto-suave">{a.porcentaje}% · ★ {a.estrellas_ganadas} · racha {a.racha_dias}</span>
            </button>
          ))}
          {p.alumnos.length === 0 && <p className="etiqueta texto-suave">Comparte el código para que tus alumnos se unan.</p>}
        </div>
      </div>
    </section>
  );
}

function DetalleAlumno({ aulaId, alumno, onCerrar, onExpulsar }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.detalleAlumno(aulaId, alumno.id).then(setD); }, [aulaId, alumno.id]);
  return (
    <section className="sm-card">
      <div className="fila-entre">
        <h2 className="subtitulo" style={{ margin: 0 }}>{alumno.apodo}</h2>
        <button className="sm-btn sm-btn-suave" onClick={onCerrar}>Volver</button>
      </div>
      {!d ? <p className="cuerpo texto-suave">Cargando…</p> : (
        <>
          <p className="cuerpo">
            {d.progreso.retos_completados} de {d.progreso.total_retos} retos · {d.progreso.intentos} intentos ·{' '}
            {d.progreso.pistas_usadas} pistas · racha de {d.progreso.racha_dias} día(s)
          </p>
          <h3 className="cuerpo-fuerte">Intentos recientes</h3>
          <ul className="lista-intentos">
            {d.intentos_recientes.map((i, n) => (
              <li key={n} className={i.correcto ? 'ok' : 'casi'}>
                <span>{i.correcto ? '✓' : '¡Casi!'}</span>
                <span>{i.ejercicio_id} · respondió {i.respuesta}</span>
                <span className="etiqueta texto-suave">
                  {i.tipo_error === 'sumo' ? 'Sumó en vez de multiplicar · ' : i.tipo_error === 'calculo' ? 'Error de cálculo · ' : ''}
                  {i.pistas_usadas} pista(s)
                </span>
              </li>
            ))}
            {d.intentos_recientes.length === 0 && <li className="etiqueta texto-suave">Aún no hay intentos.</li>}
          </ul>
        </>
      )}
      <button className="sm-btn sm-btn-suave" style={{ marginTop: 'var(--espacio-3)' }} onClick={onExpulsar}>Quitar del aula</button>
    </section>
  );
}

export default function Aulas() {
  const { mundos } = useJuego();
  const [aulas, setAulas] = useState(null);
  const [selId, setSelId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [alumno, setAlumno] = useState(null);
  const [tarea, setTarea] = useState({ leccion_id: '', fecha_limite: '' });
  const [version, setVersion] = useState(0); // para recargar el panel
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    const r = await api.aulas();
    setAulas(r.aulas);
    setSelId((id) => id ?? r.aulas[0]?.id ?? null);
  }, []);
  useEffect(() => { cargar().catch((e) => setError(e.message)); }, [cargar]);

  const sel = aulas?.find((a) => a.id === selId);
  const reemplazar = (a) => setAulas((xs) => xs.map((x) => (x.id === a.id ? a : x)));
  const intentar = (fn) => async (...args) => {
    setError(null);
    try { await fn(...args); } catch (e) { setError(e.message); }
  };

  const crear = intentar(async (e) => {
    e.preventDefault();
    const a = await api.crearAula(nombre);
    setAulas((xs) => [...xs, a]);
    setSelId(a.id);
    setNombre('');
  });

  const regenerar = intentar(async () => {
    if (!window.confirm('El código anterior dejará de servir. ¿Generar uno nuevo?')) return;
    reemplazar(await api.regenerarCodigo(sel.id));
  });

  const borrar = intentar(async () => {
    if (!window.confirm(`¿Borrar el aula ${sel.nombre}? Los alumnos no pierden su progreso.`)) return;
    await api.borrarAula(sel.id);
    setAulas((xs) => xs.filter((x) => x.id !== sel.id));
    setSelId(null);
  });

  const asignar = intentar(async (e) => {
    e.preventDefault();
    reemplazar(await api.asignar(sel.id, { leccion_id: tarea.leccion_id, fecha_limite: tarea.fecha_limite || null }));
    setTarea({ leccion_id: '', fecha_limite: '' });
  });

  const quitarTarea = intentar(async (id) => {
    await api.quitarAsignacion(sel.id, id);
    await cargar();
  });

  const expulsar = intentar(async () => {
    if (!window.confirm(`¿Quitar a ${alumno.apodo} del aula?`)) return;
    await api.expulsar(sel.id, alumno.id);
    setAlumno(null);
    await cargar();
    setVersion((v) => v + 1);
  });

  if (!aulas) return <p className="cuerpo texto-suave">Cargando aulas…</p>;

  const mundosDisponibles = mundos.filter((m) => !m.proximamente && m.retos.length);

  return (
    <div className="pila">
      {error && <div className="sm-casi" role="alert">{error}</div>}

      <div className="dos-columnas pila">
        <section className="sm-card">
          <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-3)' }}>Mis aulas</h2>
          {aulas.length > 0 && (
            <div className="chips" style={{ marginBottom: 'var(--espacio-3)' }}>
              {aulas.map((a) => (
                <button key={a.id} className={`tip${a.id === selId ? ' sel-magia' : ''}`} onClick={() => { setSelId(a.id); setAlumno(null); }}>
                  {a.nombre} · {a.alumnos.length}
                </button>
              ))}
            </div>
          )}
          <form className="acciones" onSubmit={crear}>
            <input className="sm-input sm-input-texto input-codigo" value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. 5.º B" maxLength={60} aria-label="Nombre del aula nueva" />
            <button className="sm-btn" disabled={!nombre.trim()}>Crear aula</button>
          </form>
        </section>

        {sel ? (
          <section className="sm-card">
            <div className="fila-ajolote">
              <Ajolote estado="feliz" tamano={80} etiqueta={`Ajolote del ${sel.nombre}`} />
              <div style={{ flex: 1 }}>
                <h2 className="subtitulo" style={{ margin: 0 }}>{sel.nombre}</h2>
                <p className="etiqueta texto-suave" style={{ margin: 'var(--espacio-1) 0' }}>Código para unirse:</p>
                <p className="codigo-aula">{sel.codigo}</p>
              </div>
            </div>
            <div className="acciones">
              <button className="sm-btn sm-btn-suave" onClick={regenerar}>Nuevo código</button>
              <button className="sm-btn sm-btn-suave" onClick={borrar}>Borrar aula</button>
            </div>
          </section>
        ) : (
          <section className="sm-card aviso-plano"><span className="cuerpo">Crea tu primera aula y comparte el código con tu grupo.</span></section>
        )}
      </div>

      {sel && (
        <>
          <section className="sm-card">
            <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>Misiones del aula</h2>
            {sel.asignaciones.length === 0 && <p className="etiqueta texto-suave">Sin misiones asignadas.</p>}
            <div className="chips">
              {sel.asignaciones.map((t) => (
                <span key={t.id} className="sm-chip">
                  {t.leccion}{t.fecha_limite ? ` · ${t.fecha_limite}` : ''}
                  <button className="quitar" aria-label={`Quitar ${t.leccion}`} onClick={() => quitarTarea(t.id)}>×</button>
                </span>
              ))}
            </div>
            <form className="acciones" onSubmit={asignar} style={{ marginTop: 'var(--espacio-3)' }}>
              <select className="sm-select select-corto" value={tarea.leccion_id} onChange={(e) => setTarea({ ...tarea, leccion_id: e.target.value })} aria-label="Mundo">
                <option value="">Elige un mundo…</option>
                {mundosDisponibles.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
              <input className="sm-select select-corto" type="date" value={tarea.fecha_limite}
                onChange={(e) => setTarea({ ...tarea, fecha_limite: e.target.value })} aria-label="Fecha límite (opcional)" />
              <button className="sm-btn" disabled={!tarea.leccion_id}>Asignar</button>
            </form>
          </section>

          {alumno
            ? <DetalleAlumno aulaId={sel.id} alumno={alumno} onCerrar={() => setAlumno(null)} onExpulsar={expulsar} />
            : <Panel key={`${sel.id}-${version}`} aulaId={sel.id} onAlumno={setAlumno} />}
        </>
      )}
    </div>
  );
}
