// Modo Aula (profesor): código del grupo, crear/configurar grupos (nombre, nivel y VARIOS módulos del año)
// y cómo entran los alumnos: solo con el código o con aprobación del profe (por si el código se filtra).
// El avance y el diagnóstico de cada alumno viven en la página "Diagnóstico".
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useJuego } from '../estado/store.jsx';
import I from '../componentes/IconosUI.jsx';

const NIVELES = [
  ...['1°', '2°', '3°', '4°', '5°', '6°'].map((g) => `Primaria • ${g}`),
  ...['1°', '2°', '3°'].map((g) => `Secundaria • ${g}`),
];

/** Catálogo de módulos = unidades del contenido (las "próximamente" también se pueden programar). */
function useCatalogo() {
  const { mundos } = useJuego();
  return useMemo(() => {
    const vistos = new Map();
    mundos.forEach((m) => {
      const u = m.unidad;
      if (u && !vistos.has(u.id)) vistos.set(u.id, { id: u.id, nombre: u.nombre, proximamente: !!m.proximamente });
    });
    return [...vistos.values()];
  }, [mundos]);
}

function FormGrupo({ inicial, onGuardar, onCancelar, titulo, textoBoton }) {
  const catalogo = useCatalogo();
  const [f, setF] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  useEffect(() => { setF(inicial); }, [inicial]);

  const alternar = (id) => setF((x) => ({ ...x, modulos: x.modulos.includes(id) ? x.modulos.filter((m) => m !== id) : [...x.modulos, id] }));
  const enviar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try { await onGuardar(f); } finally { setGuardando(false); }
  };
  const cambio = JSON.stringify(f) !== JSON.stringify(inicial);

  return (
    <form className="tarjeta tarjeta-grande pila-md" onSubmit={enviar}>
      <div className="fila-entre">
        <h2 className="t-lg" style={{ margin: 0 }}><I n="ajustes" tamano={22} className="texto-naranja" /> {titulo}</h2>
        {onCancelar && <button type="button" className="btn btn-blanco btn-chico" onClick={onCancelar}>Cancelar</button>}
      </div>

      <div className="rejilla-2 apretada">
        <label className="campo-st"><span className="etq">Nombre del aula</span>
          <input className="entrada entrada-chica" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} maxLength={60} placeholder="Ej. 5.º B" required /></label>
        <label className="campo-st"><span className="etq">Nivel</span>
          <select className="entrada entrada-chica" value={f.nivel} onChange={(e) => setF({ ...f, nivel: e.target.value })}>
            <option value="">Elige el grado…</option>
            {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select></label>
      </div>

      <div className="campo-st">
        <div className="fila-entre"><span className="etq">Módulos del año escolar</span><span className="etq texto-suave">{f.modulos.length} elegido{f.modulos.length === 1 ? '' : 's'}</span></div>
        <div className="modulos-elegir">
          {catalogo.map((m) => {
            const on = f.modulos.includes(m.id);
            return (
              <button type="button" key={m.id} className={`modulo-chip${on ? ' activo' : ''}`} aria-pressed={on} onClick={() => alternar(m.id)}>
                <I n={on ? 'check' : 'libro'} tamano={16} /> {m.nombre}
                {m.proximamente && <small>pronto</small>}
              </button>
            );
          })}
        </div>
        {f.modulos.length > 0 && (
          <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>
            Orden en que los verán: {f.modulos.map((id) => catalogo.find((c) => c.id === id)?.nombre || id).join(' → ')}
          </p>
        )}
      </div>

      <div className="campo-st">
        <span className="etq">¿Cómo entran los alumnos?</span>
        <div className="rejilla-2 apretada">
          <button type="button" className={`opcion${!f.requiere_aprobacion ? ' activa' : ''}`} aria-pressed={!f.requiere_aprobacion} onClick={() => setF({ ...f, requiere_aprobacion: false })}>
            <span className="icono-caja"><I n="llave" /></span>
            <span><b>Solo con el código</b><small>Entran directo. Menos trabajo para ti.</small></span>
          </button>
          <button type="button" className={`opcion${f.requiere_aprobacion ? ' activa' : ''}`} aria-pressed={f.requiere_aprobacion} onClick={() => setF({ ...f, requiere_aprobacion: true })}>
            <span className="icono-caja"><I n="escudo" /></span>
            <span><b>Yo apruebo a cada alumno</b><small>Si el código se filtra, nadie entra sin tu permiso.</small></span>
          </button>
        </div>
      </div>

      <div className="fila-fin">
        <button className="btn btn-naranja" disabled={guardando || !f.nombre.trim() || !cambio}>{guardando ? 'Guardando…' : textoBoton}</button>
      </div>
    </form>
  );
}

const VACIO = { nombre: '', nivel: '', modulos: [], requiere_aprobacion: false };

export default function Aulas() {
  const [aulas, setAulas] = useState(null);
  const [selId, setSelId] = useState(null);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const cargar = useCallback(async () => {
    const r = await api.aulas();
    setAulas(r.aulas);
    setSelId((id) => id ?? r.aulas[0]?.id ?? null);
    if (!r.aulas.length) setCreando(true);
  }, []);
  useEffect(() => { cargar().catch((e) => setError(e.message)); }, [cargar]);

  const sel = aulas?.find((a) => a.id === selId);
  const inicialSel = useMemo(() => (sel ? {
    nombre: sel.nombre, nivel: sel.nivel || '', modulos: sel.modulos.map((m) => m.id), requiere_aprobacion: !!sel.requiere_aprobacion,
  } : VACIO), [sel]);

  const reemplazar = (a) => setAulas((xs) => xs.map((x) => (x.id === a.id ? a : x)));
  const intentar = (fn) => async (...args) => {
    setError(null);
    try { await fn(...args); } catch (e) { setError(e.message); }
  };

  const crear = intentar(async (f) => {
    const a = await api.crearAula({ ...f, nombre: f.nombre.trim(), nivel: f.nivel || null });
    setAulas((xs) => [...xs, a]);
    setSelId(a.id);
    setCreando(false);
  });
  const guardar = intentar(async (f) => reemplazar(await api.editarAula(sel.id, { ...f, nombre: f.nombre.trim() })));
  const regenerar = intentar(async () => {
    if (!window.confirm('El código anterior dejará de servir. ¿Generar uno nuevo?')) return;
    reemplazar(await api.regenerarCodigo(sel.id));
  });
  const borrar = intentar(async () => {
    if (!window.confirm(`¿Borrar el aula ${sel.nombre}? Los alumnos no pierden su progreso.`)) return;
    await api.borrarAula(sel.id);
    const resto = aulas.filter((x) => x.id !== sel.id);
    setAulas(resto);
    setSelId(resto[0]?.id ?? null);
    if (!resto.length) setCreando(true);
  });
  const aprobar = intentar(async (al) => reemplazar(await api.aprobarAlumno(sel.id, al.id)));
  const rechazar = intentar(async (al) => reemplazar(await api.rechazarAlumno(sel.id, al.id)));
  const quitar = intentar(async (al) => {
    if (!window.confirm(`¿Quitar a ${al.apodo} del aula?`)) return;
    await api.expulsar(sel.id, al.id);
    await cargar();
  });
  const copiar = async () => {
    try { await navigator.clipboard.writeText(sel.codigo); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } catch { /* sin portapapeles */ }
  };

  if (!aulas) return <p className="cuerpo-md texto-suave">Cargando aulas…</p>;

  return (
    <div className="pila-lg">
      {sel && !creando && (
        <section className="tarjeta-codigo codigo-arriba">
          <div>
            <span className="sobre claro">Código de grupo · {sel.nombre}</span>
            <p className="codigo-grande">{sel.codigo}</p>
            <span className="cuerpo-sm" style={{ opacity: 0.8 }}>
              {sel.requiere_aprobacion ? 'Con el código piden entrar y tú los apruebas.' : 'Con este código entran directo a tu aula.'}
            </span>
          </div>
          <div className="pila-sm" style={{ alignItems: 'flex-end' }}>
            <button className="btn btn-blanco btn-chico" onClick={copiar}><I n="copiar" tamano={16} /> {copiado ? '¡Copiado!' : 'Copiar'}</button>
            <button className="enlace-claro" onClick={regenerar}>Regenerar código</button>
          </div>
        </section>
      )}

      {error && <div className="aviso-casi" role="alert">{error}</div>}

      <div className="chips">
        {aulas.map((a) => (
          <button key={a.id} className={`chip-tab${a.id === selId && !creando ? ' activo' : ''}`} onClick={() => { setSelId(a.id); setCreando(false); }}>
            {a.nombre} · {a.alumnos.length}{a.pendientes?.length ? ` · ${a.pendientes.length} en espera` : ''}
          </button>
        ))}
        <button className={`chip-tab${creando ? ' activo' : ''}`} onClick={() => setCreando(true)}>+ Crear grupo</button>
      </div>

      {creando ? (
        <FormGrupo inicial={VACIO} titulo="Crear grupo" textoBoton="Crear grupo" onGuardar={crear} onCancelar={aulas.length ? () => setCreando(false) : null} />
      ) : sel && (
        <div className="grid-12">
          <div className="col-7 pila-lg">
            <FormGrupo inicial={inicialSel} titulo="Configuración del salón" textoBoton="Guardar cambios" onGuardar={guardar} />
            <button className="btn btn-blanco btn-chico" style={{ alignSelf: 'flex-start' }} onClick={borrar}>Borrar aula</button>
          </div>
          <div className="col-5 pila-lg">
            <section className="tarjeta">
              <div className="fila-entre" style={{ marginBottom: 10 }}>
                <h2 className="t-md" style={{ margin: 0 }}><I n="escudo" tamano={20} className="texto-naranja" /> Solicitudes de ingreso</h2>
                <span className="chip">{sel.pendientes.length}</span>
              </div>
              {sel.pendientes.length === 0 ? (
                <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>
                  {sel.requiere_aprobacion ? 'Nadie está esperando. Cuando alguien use el código aparecerá aquí.' : 'Tu grupo entra solo con el código. Activa “Yo apruebo a cada alumno” si quieres revisar quién entra.'}
                </p>
              ) : (
                <ul className="lista-alumnos">
                  {sel.pendientes.map((al) => (
                    <li key={al.id}>
                      <span style={{ flex: 1 }}><b className="t-sm">{al.apodo}</b> <small className="texto-suave">@{al.usuario}</small></span>
                      <button className="btn btn-verde btn-chico" onClick={() => aprobar(al)}><I n="check" tamano={14} /> Aceptar</button>
                      <button className="btn btn-blanco btn-chico" onClick={() => rechazar(al)}>Rechazar</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="tarjeta">
              <div className="fila-entre" style={{ marginBottom: 10 }}>
                <h2 className="t-md" style={{ margin: 0 }}><I n="aula" tamano={20} className="texto-naranja" /> Alumnos del grupo</h2>
                <a className="enlace" href="#/diagnostico">Ver diagnóstico</a>
              </div>
              {sel.alumnos.length === 0 ? <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>Comparte el código para que se unan.</p> : (
                <ul className="lista-alumnos">
                  {sel.alumnos.map((al) => (
                    <li key={al.id}>
                      <span style={{ flex: 1 }}><b className="t-sm">{al.apodo}</b> <small className="texto-suave">@{al.usuario}</small></span>
                      <button className="btn btn-blanco btn-chico" onClick={() => quitar(al)}>Quitar</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
