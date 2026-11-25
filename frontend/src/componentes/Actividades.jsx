// Actividades del aula (alumno). El profesor deja problemas y material; el alumno los resuelve en su CUADERNO y los
// escanea: Kiko revisa cada uno (filtro obligatorio) y le ayuda si algo está mal. Luego entrega.
// #/aula/:aula.:actividad → la actividad.  #/escaner/:aula.:actividad.:problema → escanear ese problema.
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ir } from '../ruta.js';
import I from './IconosUI.jsx';
import { agrupar } from './ActividadesProfe.jsx';

const ESTADOS = {
  pendiente: { texto: 'Por escanear', clase: 'chip-gris' },
  revisar: { texto: 'Kiko encontró algo', clase: 'chip-casi' },
  resuelto: { texto: 'Resuelto', clase: 'chip-verde' },
};

/** Texto del material con los enlaces http(s) como links (todo lo demás es texto: nunca HTML). */
export function Material({ texto }) {
  if (!texto) return null;
  const partes = texto.split(/(https?:\/\/[^\s<>"']+)/g);
  return (
    <p className="cuerpo-md material-texto">
      {partes.map((p, i) => (/^https?:\/\//.test(p)
        ? <a key={i} className="enlace" href={p} target="_blank" rel="noopener noreferrer">{p}</a>
        : <span key={i}>{p}</span>))}
    </p>
  );
}

const fecha = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : null);

/** Lista de actividades dentro de la clase. */
export function ListaActividades({ aulaId }) {
  const [lista, setLista] = useState(null);
  useEffect(() => { api.actividades(aulaId).then((r) => setLista(r.actividades)).catch(() => setLista([])); }, [aulaId]);
  if (!lista) return null;
  return (
    <section className="pila-md">
      <h2 className="t-md" style={{ margin: 0 }}><I n="libro" tamano={20} className="texto-naranja" /> Tareas</h2>
      {lista.length === 0 && <p className="cuerpo-sm texto-suave">Tu maestra o maestro todavía no deja tareas.</p>}
      {agrupar(lista).map(([nombre, del]) => (
        <div key={nombre} className="pila-sm">
          <h3 className="t-sm modulo-titulo">{nombre}</h3>
          {del.map((a) => (
        <button key={a.id} className="tarjeta actividad-tarjeta" onClick={() => ir(`/aula/${aulaId}.${a.id}`)}>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <b className="t-sm">{a.titulo}</b>
            <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>
              {a.resueltos} de {a.problemas.length} problemas resueltos{a.fecha_limite ? ` · entrega: ${fecha(a.fecha_limite)}` : ''}
            </p>
          </div>
          {a.entregada ? <span className="chip chip-verde"><I n="check" tamano={12} /> Entregada</span> : <span className="chip">Pendiente</span>}
        </button>
          ))}
        </div>
      ))}
    </section>
  );
}

/** Una actividad: material, problemas (cada uno se escanea) y entregar. */
export function ActividadAlumno({ aulaId, actividadId }) {
  const [a, setA] = useState(null);
  const [error, setError] = useState(null);
  const [entregando, setEntregando] = useState(false);
  const cargar = () => api.actividad(aulaId, actividadId).then(setA).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, [aulaId, actividadId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="pila-lg"><div className="aviso-casi">{error}</div><a className="enlace" href={`#/aula/${aulaId}`}>Volver a la clase</a></div>;
  if (!a) return <p className="cuerpo-md texto-suave">Abriendo la actividad…</p>;

  const entregar = async () => {
    setEntregando(true);
    try { setA(await api.entregarActividad(a.id)); } catch (e) { setError(e.message); } finally { setEntregando(false); }
  };

  return (
    <div className="pila-lg">
      <a className="enlace" href={`#/aula/${aulaId}`}><I n="atras" tamano={14} /> Volver a la clase</a>
      <section className="tarjeta pila-md">
        <div className="fila-entre">
          <h1 className="t-xl" style={{ margin: 0 }}>{a.titulo}</h1>
          {a.entregada && <span className="chip chip-verde"><I n="check" tamano={12} /> Entregada</span>}
        </div>
        {a.fecha_limite && <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>Entrega: {fecha(a.fecha_limite)}</p>}
        {a.instrucciones && <p className="cuerpo-md" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{a.instrucciones}</p>}
        {a.material && (
          <div className="material-caja">
            <span className="etq texto-suave"><I n="libro" tamano={14} /> Material para estudiar</span>
            <Material texto={a.material} />
          </div>
        )}
      </section>

      <section className="tarjeta pila-md">
        <h2 className="t-md" style={{ margin: 0 }}>Problemas</h2>
        <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>
          Resuélvelos en tu cuaderno y escanea cada uno: Kiko lo revisa y, si algo no cuadra, te ayuda a encontrarlo.
        </p>
        <ol className="problemas-lista">
          {a.problemas.map((p, n) => (
            <li key={p.id} className={`problema problema-${p.estado}`}>
              <span className="problema-num">{n + 1}</span>
              <div style={{ flex: 1 }}>
                {p.enunciado && <p className="cuerpo-sm" style={{ margin: 0 }}>{p.enunciado}</p>}
                <b className="t-md problema-op">{p.texto}</b>
              </div>
              <span className={`chip ${ESTADOS[p.estado].clase}`}>{ESTADOS[p.estado].texto}</span>
              {p.estado !== 'resuelto' && (
                <button className="btn btn-naranja btn-chico" onClick={() => ir(`/escaner/${aulaId}.${a.id}.${p.id}`)}>
                  <I n="camara" tamano={14} /> {p.estado === 'pendiente' ? 'Escanear' : 'Revisar con Kiko'}
                </button>
              )}
            </li>
          ))}
        </ol>
        {!a.entregada && (
          <div className="fila-entre">
            <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>
              {a.puede_entregar ? '¡Listo! Ya pasaste todos los problemas por Kiko.' : 'Para entregar, escanea todos los problemas.'}
            </p>
            <button className="btn btn-verde" disabled={!a.puede_entregar || entregando} onClick={entregar}>
              <I n="check" tamano={16} /> Entregar actividad
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

/** En el escáner: qué problema de qué actividad está escaneando, y volver cuando lo resuelva. */
export function BannerActividad({ aulaId, actividad, problemaId }) {
  if (!actividad) return null;
  const n = actividad.problemas.findIndex((p) => p.id === problemaId);
  const p = actividad.problemas[n];
  if (!p) return null;
  const listo = p.estado === 'resuelto';
  return (
    <section className={`tarjeta actividad-banner${listo ? ' listo' : ''}`} aria-live="polite">
      <div style={{ flex: 1 }}>
        <span className="etq texto-suave">{actividad.titulo} · Problema {n + 1} de {actividad.problemas.length}</span>
        {p.enunciado && <p className="cuerpo-sm" style={{ margin: '2px 0 0' }}>{p.enunciado}</p>}
        <b className="t-lg">{p.texto}</b>
        <p className="cuerpo-sm" style={{ margin: '2px 0 0' }}>
          {listo ? '✓ ¡Problema resuelto! Kiko ya lo revisó.' : 'Resuélvelo en tu cuaderno y escanéalo: Kiko lo revisa contigo.'}
        </p>
      </div>
      <button className={`btn btn-chico ${listo ? 'btn-verde' : 'btn-crema'}`} onClick={() => ir(`/aula/${aulaId}.${actividad.id}`)}>
        <I n="atras" tamano={14} /> Volver a la actividad
      </button>
    </section>
  );
}
