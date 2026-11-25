// Mi Aula (alumno), tipo Classroom: el Aula es para ESTUDIAR (el Mapa es para divertirse aprendiendo).
// #/aula       → mis clases + unirme con código
// #/aula/:id   → una clase: módulos del año con mi avance y el avance promedio del grupo (sin nombres ni rankings)
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useJuego } from '../estado/store.jsx';
import { ir } from '../ruta.js';
import I from '../componentes/IconosUI.jsx';
import { nodosDeMundo } from '../logica/juego.js';

const PORTADAS = ['portada-a', 'portada-b', 'portada-c', 'portada-d'];
const portada = (id) => PORTADAS[id % PORTADAS.length];

function Unirme({ onUnido }) {
  const [codigo, setCodigo] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const unirse = async (e) => {
    e.preventDefault();
    setMensaje(null);
    try {
      const a = await api.unirse(codigo);
      setMensaje(a.estado === 'pendiente'
        ? { ok: true, texto: `Listo: tu maestra o maestro de ${a.nombre} tiene que aprobarte.` }
        : { ok: true, texto: `¡Ya estás en ${a.nombre}!` });
      setCodigo('');
      onUnido();
    } catch (err) {
      setMensaje({ ok: false, texto: err.message });
    }
  };
  return (
    <section className="tarjeta unirme">
      <div>
        <h2 className="t-md" style={{ margin: 0 }}><I n="llave" tamano={20} className="texto-naranja" /> Unirme a una clase</h2>
        <p className="cuerpo-sm texto-suave" style={{ margin: '2px 0 0' }}>Escribe el código que te dio tu maestra o maestro, por ejemplo <b className="texto-tinta">X7K-92B</b>.</p>
      </div>
      <form className="unirse" onSubmit={unirse}>
        <input className="entrada entrada-chica entrada-codigo-chica" value={codigo} onChange={(e) => setCodigo(e.target.value)}
          placeholder="ABC-123" maxLength={10} aria-label="Código de la clase" autoCapitalize="characters" />
        <button className="btn btn-naranja btn-chico" disabled={codigo.replace(/[^a-z0-9]/gi, '').length < 6}>Unirme</button>
      </form>
      {mensaje && <p className={`etq ${mensaje.ok ? 'texto-selva' : 'texto-casi'}`} role="status" style={{ margin: 0 }}>{mensaje.texto}</p>}
    </section>
  );
}

function ListaClases() {
  const [aulas, setAulas] = useState(null);
  const cargar = () => api.aulas().then((r) => setAulas(r.aulas)).catch(() => setAulas([]));
  useEffect(() => { cargar(); }, []);

  return (
    <div className="pila-lg">
      <div className="fila-entre">
        <div>
          <span className="sobre"><I n="libro" tamano={14} /> Aula · tiempo de estudiar</span>
          <h1 className="t-xl" style={{ margin: '4px 0 0' }}>Mis clases</h1>
        </div>
        <a className="btn btn-crema btn-chico" href="#/mapa"><I n="mapa" tamano={16} /> Ir al Mapa a jugar</a>
      </div>

      <Unirme onUnido={cargar} />

      {aulas === null && <p className="cuerpo-md texto-suave">Cargando tus clases…</p>}
      {aulas?.length === 0 && (
        <section className="tarjeta-suave centro-col" style={{ textAlign: 'center', padding: 32 }}>
          <span className="icono-caja ic-crema grande"><I n="aula" tamano={28} /></span>
          <p className="t-md" style={{ margin: 0 }}>Todavía no estás en ninguna clase</p>
          <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>Pídele el código a tu maestra o maestro y escríbelo arriba.</p>
        </section>
      )}

      <div className="clases">
        {aulas?.map((a) => {
          const pendiente = a.estado === 'pendiente';
          const contenido = (
            <>
              <div className={`clase-portada ${portada(a.id)}`}>
                <b className="t-lg">{a.nombre}</b>
                <span className="cuerpo-sm">{a.profesor}{a.nivel ? ` · ${a.nivel}` : ''}</span>
              </div>
              <div className="clase-cuerpo">
                {pendiente ? (
                  <span className="chip chip-ambar"><I n="info" tamano={14} /> Esperando aprobación</span>
                ) : (
                  <>
                    <span className="etq texto-suave">{a.modulos.length} módulo{a.modulos.length === 1 ? '' : 's'}</span>
                    <div className="chips" style={{ margin: 0 }}>
                      {a.modulos.slice(0, 3).map((m) => <span key={m.id} className="chip chip-gris">{m.nombre}</span>)}
                      {a.modulos.length > 3 && <span className="chip chip-gris">+{a.modulos.length - 3}</span>}
                    </div>
                  </>
                )}
              </div>
            </>
          );
          return pendiente
            ? <div key={a.id} className="clase clase-pendiente">{contenido}</div>
            : <a key={a.id} className="clase" href={`#/aula/${a.id}`}>{contenido}</a>;
        })}
      </div>
    </div>
  );
}

/** A dónde lleva "Estudiar" en una lección: el reto actual o, si ya terminó, el primero para repasar. */
function destinoLeccion(estado, mundos, leccionId) {
  const mundo = mundos.find((m) => m.id === leccionId);
  if (!mundo) return null;
  const { nodos } = nodosDeMundo(estado, mundo);
  const actual = nodos.find((n) => n.estado === 'actual') || nodos.find((n) => n.estado === 'completado');
  return actual ? { reto: actual.reto, repaso: actual.estado === 'completado' } : null;
}

function Clase({ aulaId }) {
  const { estado, mundos } = useJuego();
  const [c, setC] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { api.curso(aulaId).then(setC).catch((e) => setError(e.message)); }, [aulaId]);

  if (error) return <div className="pila-lg"><div className="aviso-casi">{error}</div><a className="enlace" href="#/aula">Volver a mis clases</a></div>;
  if (!c) return <p className="cuerpo-md texto-suave">Abriendo la clase…</p>;

  const conContenido = c.modulos.filter((m) => m.total_retos > 0);
  const total = conContenido.reduce((n, m) => n + m.total_retos, 0);
  const mios = conContenido.reduce((n, m) => n + m.mis_retos, 0);
  const pct = total ? Math.round((100 * mios) / total) : 0;
  const grupo = conContenido.length ? Math.round(conContenido.reduce((n, m) => n + m.grupo_porcentaje * m.total_retos, 0) / total) : 0;

  return (
    <div className="pila-lg">
      <a className="enlace" href="#/aula"><I n="atras" tamano={14} /> Mis clases</a>
      <section className={`clase-banner ${portada(c.id)}`}>
        <div>
          <h1 className="t-xl" style={{ margin: 0, color: 'inherit' }}>{c.nombre}</h1>
          <p className="cuerpo-md" style={{ margin: '4px 0 0' }}>{c.profesor}{c.nivel ? ` · ${c.nivel}` : ''} · {c.companeros} compañero{c.companeros === 1 ? '' : 's'}</p>
        </div>
        <div className="banner-avance">
          <div className="fila-entre etq"><span>Mi avance</span><span>{pct}%</span></div>
          <div className="barra-prog blanca"><span style={{ width: `${pct}%` }} /></div>
          <div className="fila-entre etq" style={{ marginTop: 8 }}><span>Avance de la clase</span><span>{grupo}%</span></div>
          <div className="barra-prog blanca"><span style={{ width: `${grupo}%` }} /></div>
        </div>
      </section>

      <div className="pila-md">
        {c.modulos.length === 0 && <p className="cuerpo-md texto-suave">Tu maestra o maestro todavía no agrega módulos a esta clase.</p>}
        {c.modulos.map((m, n) => (
          <section key={m.id} className="tarjeta modulo">
            <div className="modulo-cabeza">
              <span className="modulo-num">{n + 1}</span>
              <div style={{ flex: 1 }}>
                <h2 className="t-md" style={{ margin: 0 }}>{m.nombre}</h2>
                <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>
                  {m.proximamente ? 'Programado por tu maestra o maestro · el contenido llega pronto' : `${m.mis_retos} de ${m.total_retos} retos`}
                </p>
              </div>
              {m.proximamente ? <span className="chip chip-gris">Próximamente</span>
                : m.mi_porcentaje >= 100 ? <span className="chip chip-verde"><I n="check" tamano={12} /> Terminado</span>
                : <span className="chip">{m.mi_porcentaje}%</span>}
            </div>

            {!m.proximamente && (
              <>
                <div className="modulo-barras">
                  <div><span className="etq texto-suave">Mi avance</span><div className="barra-prog naranja"><span style={{ width: `${m.mi_porcentaje}%` }} /></div></div>
                  <div><span className="etq texto-suave">Promedio de la clase</span><div className="barra-prog"><span style={{ width: `${m.grupo_porcentaje}%` }} /></div></div>
                </div>
                <ul className="lecciones">
                  {m.lecciones.map((l) => {
                    const d = destinoLeccion(estado, mundos, l.id);
                    return (
                      <li key={l.id} className="leccion">
                        <span className="icono-caja ic-crema chica"><I n="libro" tamano={16} /></span>
                        <div style={{ flex: 1 }}>
                          <b className="t-sm">{l.nombre}</b>
                          <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>{l.concepto} · {l.retos} retos</p>
                        </div>
                        {d ? (
                          <button className={`btn btn-chico ${d.repaso ? 'btn-crema' : 'btn-naranja'}`} onClick={() => ir(`/reto/${d.reto.id}`)}>
                            {d.repaso ? 'Repasar' : 'Estudiar'}
                          </button>
                        ) : <span className="chip chip-gris"><I n="candado" tamano={12} /> Termina la anterior</span>}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

export default function MiAula({ retoId }) {
  return retoId ? <Clase aulaId={Number(retoId)} /> : <ListaClases />;
}
