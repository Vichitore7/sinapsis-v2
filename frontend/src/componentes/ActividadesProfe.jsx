// Actividades del aula (profesor): crear actividades con material y problemas (propios o del banco por grado),
// ver quién entregó y qué contestó cada alumno en cada problema. Los alumnos las resuelven en su cuaderno y las
// escanean; Mix las revisa (app/actividades.py).
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import I from './IconosUI.jsx';

const VACIA = { titulo: '', instrucciones: '', material: '', fecha_limite: '', problemas: [] };
const ICONO = { bien: '✓', con_ayuda: '✓', mal: '✗', pendiente: '–' };
// La tarea se organiza por módulo (los mismos del aula); dentro se eligen sus ejercicios.
const MODULOS = [
  { id: 'suma-resta', nombre: 'Suma y resta', ops: ['+', '−'], icono: '+' },
  { id: 'multiplicacion', nombre: 'Multiplicación', ops: ['×'], icono: '×' },
  { id: 'division', nombre: 'División', ops: ['÷'], icono: '÷' },
  { id: 'fracciones', nombre: 'Fracciones', ops: ['+', '−', '×', '÷'], icono: '½' },
];
const clave = (p) => `${p.a}${p.op}${p.b}`;

/** "Primaria • 3°" → "P3" (para abrir el banco en el grado del grupo). */
function claveDeNivel(nivel) {
  const m = /^(Primaria|Secundaria)\s*•\s*(\d)/.exec(nivel || '');
  return m ? `${m[1][0]}${m[2]}` : 'P3';
}

function NuevaActividad({ aulaId, nivel, onCreada, onCancelar }) {
  const [f, setF] = useState(VACIA);
  const [banco, setBanco] = useState(null);
  const [grado, setGrado] = useState(claveDeNivel(nivel));
  const [modulo, setModulo] = useState(null);
  const [propio, setPropio] = useState({ a: '', op: '+', b: '', enunciado: '' });
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  useEffect(() => { api.bancoProblemas().then((r) => setBanco(r.grados)).catch(() => setBanco([])); }, []);

  const mod = MODULOS.find((m) => m.id === modulo);
  const nombreGrado = banco?.find((g) => g.clave === grado)?.grado || '';
  const delModulo = (banco?.find((g) => g.clave === grado)?.problemas || []).filter((p) => p.modulo === modulo);
  const elegido = (p) => f.problemas.some((q) => clave(q) === clave(p));
  const alternar = (p) => setF((x) => ({
    ...x,
    problemas: elegido(p) ? x.problemas.filter((q) => clave(q) !== clave(p))
      : [...x.problemas, { a: String(p.a), op: p.op, b: String(p.b), enunciado: p.enunciado || '' }],
  }));
  const todos = () => setF((x) => ({
    ...x,
    problemas: [...x.problemas, ...delModulo.filter((p) => !elegido(p)).map((p) => ({ a: String(p.a), op: p.op, b: String(p.b), enunciado: p.enunciado || '' }))],
  }));
  const elegirModulo = (m) => {
    if (m.id === modulo) return;
    if (f.problemas.length && !window.confirm('Al cambiar de módulo se quitan los ejercicios que ya elegiste. ¿Cambiar?')) return;
    setModulo(m.id);
    setPropio({ a: '', op: m.ops[0], b: '', enunciado: '' });
    setF((x) => ({ ...x, problemas: [], titulo: !x.titulo || MODULOS.some((o) => x.titulo.startsWith(o.nombre)) ? `${m.nombre} · ${nombreGrado}` : x.titulo }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await api.crearActividad(aulaId, { ...f, modulo, titulo: f.titulo.trim(), fecha_limite: f.fecha_limite || null });
      onCreada();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="tarjeta pila-md" onSubmit={guardar}>
      <h3 className="t-md" style={{ margin: 0 }}>Nueva tarea</h3>
      {error && <div className="aviso-casi" role="alert">{error}</div>}

      <div className="pila-sm">
        <b className="t-sm">1. Elige el módulo</b>
        <div className="modulos-elegir">
          {MODULOS.map((m) => (
            <button key={m.id} type="button" className={`modulo-opcion${modulo === m.id ? ' activo' : ''}`} aria-pressed={modulo === m.id} onClick={() => elegirModulo(m)}>
              <span aria-hidden="true">{m.icono}</span> {m.nombre}
            </button>
          ))}
        </div>
      </div>

      {mod && (
        <>
          <div className="pila-sm">
            <div className="fila-entre">
              <b className="t-sm">2. Elige los ejercicios de {mod.nombre}</b>
              <select className="entrada entrada-chica" style={{ maxWidth: 220 }} value={grado} onChange={(e) => setGrado(e.target.value)} aria-label="Grado">
                {(banco || []).map((g) => <option key={g.clave} value={g.clave}>{g.grado}</option>)}
              </select>
            </div>
            {delModulo.length === 0 ? <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>No hay ejercicios de {mod.nombre} para {nombreGrado} en el banco; escribe los tuyos abajo.</p> : (
              <>
                <ul className="banco-lista">
                  {delModulo.map((p) => (
                    <li key={clave(p)}>
                      <label className="banco-check">
                        <input type="checkbox" checked={elegido(p)} onChange={() => alternar(p)} />
                        <span style={{ flex: 1 }}>
                          <b>{p.a} {p.op} {p.b}</b>
                          {p.enunciado && <span className="cuerpo-sm texto-suave" style={{ display: 'block' }}>{p.enunciado}</span>}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <button type="button" className="enlace" style={{ alignSelf: 'flex-start', background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={todos}>Seleccionar todos</button>
              </>
            )}
          </div>

          <fieldset className="caja-suave pila-sm">
            <legend className="t-sm">O escribe un ejercicio de {mod.nombre}</legend>
            <div className="fila-op">
              <input className="entrada entrada-chica" aria-label="Primer número" placeholder={modulo === 'fracciones' ? '3/4' : '12'} value={propio.a} onChange={(e) => setPropio({ ...propio, a: e.target.value })} />
              <select className="entrada entrada-chica" aria-label="Operación" value={propio.op} onChange={(e) => setPropio({ ...propio, op: e.target.value })}>
                {mod.ops.map((o) => <option key={o}>{o}</option>)}
              </select>
              <input className="entrada entrada-chica" aria-label="Segundo número" placeholder={modulo === 'fracciones' ? '1/2' : '5'} value={propio.b} onChange={(e) => setPropio({ ...propio, b: e.target.value })} />
            </div>
            <input className="entrada entrada-chica" maxLength={300} placeholder="Problema con texto (opcional): Hay 12 dulces…" value={propio.enunciado}
              onChange={(e) => setPropio({ ...propio, enunciado: e.target.value })} />
            <button type="button" className="btn btn-crema btn-chico" style={{ alignSelf: 'flex-start' }} disabled={!propio.a.trim() || !propio.b.trim()}
              onClick={() => { if (!elegido(propio)) alternar(propio); setPropio({ a: '', op: propio.op, b: '', enunciado: '' }); }}>
              + Agregar ejercicio
            </button>
          </fieldset>

          <div className="pila-sm">
            <b className="t-sm">3. Tu tarea: {f.problemas.length} ejercicio{f.problemas.length === 1 ? '' : 's'}</b>
            <ol className="problemas-lista">
              {f.problemas.map((p, i) => (
                <li key={clave(p)} className="problema">
                  <span className="problema-num">{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    {p.enunciado && <p className="cuerpo-sm" style={{ margin: 0 }}>{p.enunciado}</p>}
                    <b className="problema-op">{p.a} {p.op} {p.b}</b>
                  </div>
                  <button type="button" className="btn btn-blanco btn-chico" onClick={() => alternar(p)}>Quitar</button>
                </li>
              ))}
            </ol>
          </div>

          <label className="campo-etq">Título
            <input className="entrada entrada-chica" required maxLength={80} value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} />
          </label>
          <label className="campo-etq">Instrucciones
            <textarea className="entrada entrada-chica" rows={2} maxLength={2000} value={f.instrucciones} onChange={(e) => setF({ ...f, instrucciones: e.target.value })}
              placeholder="Ej. Resuelve cada ejercicio en tu cuaderno y escanéalo." />
          </label>
          <label className="campo-etq">Material para estudiar (texto y enlaces)
            <textarea className="entrada entrada-chica" rows={3} maxLength={6000} value={f.material} onChange={(e) => setF({ ...f, material: e.target.value })}
              placeholder="Explicación, ejemplos o enlaces (https://…) para que repasen antes." />
          </label>
          <label className="campo-etq" style={{ maxWidth: 220 }}>Fecha de entrega (opcional)
            <input className="entrada entrada-chica" type="date" value={f.fecha_limite} onChange={(e) => setF({ ...f, fecha_limite: e.target.value })} />
          </label>
        </>
      )}

      <div className="fila" style={{ gap: 8 }}>
        <button className="btn btn-naranja" disabled={guardando || !modulo || !f.titulo.trim() || !f.problemas.length}>{guardando ? 'Guardando…' : 'Publicar tarea'}</button>
        <button type="button" className="btn btn-blanco" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

/** Quién entregó y qué contestó cada alumno, problema por problema. */
function Respuestas({ aulaId, actividadId }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.actividad(aulaId, actividadId).then(setD).catch(() => setD(false)); }, [aulaId, actividadId]);
  if (d === null) return <p className="cuerpo-sm texto-suave">Cargando respuestas…</p>;
  if (!d) return <p className="cuerpo-sm texto-suave">No se pudieron cargar las respuestas.</p>;
  if (!d.entregas.length) return <p className="cuerpo-sm texto-suave">Todavía no hay alumnos en el grupo.</p>;
  return (
    <div className="tabla-scroll">
      <table className="tabla-respuestas">
        <thead>
          <tr>
            <th scope="col">Alumno</th>
            {d.problemas.map((p, i) => <th key={p.id} scope="col" title={p.enunciado || p.texto}>{i + 1}. {p.texto}</th>)}
            <th scope="col">Entrega</th>
          </tr>
        </thead>
        <tbody>
          {d.entregas.map((e) => (
            <tr key={e.alumno.id}>
              <th scope="row">{e.alumno.apodo}</th>
              {e.respuestas.map((r) => (
                <td key={r.numero} className={`resp-${r.estado}`} title={r.nota}>
                  <span aria-hidden="true">{ICONO[r.estado]}</span> <span className="resp-nota">{r.nota}</span>
                </td>
              ))}
              <td>{e.entregada ? <span className="chip chip-verde">Entregada</span> : <span className="chip chip-gris">Pendiente</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** [[nombre del módulo, actividades]] en el orden de los módulos ("Otras actividades" al final). */
export function agrupar(lista) {
  const orden = [...MODULOS.map((m) => m.nombre), 'Otras actividades'];
  const grupos = new Map();
  for (const a of lista) {
    const n = a.modulo_nombre || 'Otras actividades';
    grupos.set(n, [...(grupos.get(n) || []), a]);
  }
  return [...grupos.entries()].sort(([x], [y]) => orden.indexOf(x) - orden.indexOf(y));
}

export default function ActividadesProfe({ aulaId, nivel }) {
  const [lista, setLista] = useState(null);
  const [creando, setCreando] = useState(false);
  const [abierta, setAbierta] = useState(null);
  const cargar = () => api.actividades(aulaId).then((r) => setLista(r.actividades)).catch(() => setLista([]));
  useEffect(() => { setCreando(false); setAbierta(null); cargar(); }, [aulaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const borrar = async (a) => {
    if (!window.confirm(`¿Borrar la actividad «${a.titulo}»? Se pierden las respuestas de los alumnos.`)) return;
    await api.borrarActividad(aulaId, a.id);
    cargar();
  };

  return (
    <section className="tarjeta pila-md">
      <div className="fila-entre">
        <h2 className="t-md" style={{ margin: 0 }}><I n="libro" tamano={20} className="texto-naranja" /> Actividades de este grupo</h2>
        {!creando && <button className="btn btn-naranja btn-chico" onClick={() => setCreando(true)}>+ Nueva tarea</button>}
      </div>
      <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>
        Tus alumnos resuelven los problemas en su cuaderno y los escanean: Mix revisa cada uno y les ayuda si algo está mal.
        Lo que resuelven alimenta la gráfica de comprensión en Diagnóstico.
      </p>
      {creando && <NuevaActividad aulaId={aulaId} nivel={nivel} onCreada={() => { setCreando(false); cargar(); }} onCancelar={() => setCreando(false)} />}
      {lista && lista.length === 0 && !creando && <p className="cuerpo-sm texto-suave">Aún no hay tareas.</p>}
      {agrupar(lista || []).map(([nombre, del]) => (
        <div key={nombre} className="pila-sm">
          <h3 className="t-sm modulo-titulo">{nombre}</h3>
          {del.map((a) => (
        <div key={a.id} className="actividad-profe">
          <div className="fila-entre">
            <div>
              <b className="t-sm">{a.titulo}</b>
              <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>
                {a.problemas} problemas · entregaron {a.entregaron} de {a.alumnos}{a.fecha_limite ? ` · entrega ${a.fecha_limite}` : ''}
              </p>
            </div>
            <div className="fila" style={{ gap: 6 }}>
              <button className="btn btn-crema btn-chico" onClick={() => setAbierta(abierta === a.id ? null : a.id)}>
                {abierta === a.id ? 'Ocultar respuestas' : 'Ver respuestas'}
              </button>
              <button className="btn btn-blanco btn-chico" onClick={() => borrar(a)}>Borrar</button>
            </div>
          </div>
          {abierta === a.id && <Respuestas aulaId={aulaId} actividadId={a.id} />}
        </div>
          ))}
        </div>
      ))}
    </section>
  );
}
