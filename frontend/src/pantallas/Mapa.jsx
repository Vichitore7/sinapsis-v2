import { useEffect, useState } from 'react';
import { useJuego } from '../estado/store.jsx';
import { ir } from '../ruta.js';
import Ajolote from '../componentes/Ajolote.jsx';
import I from '../componentes/IconosUI.jsx';
import { MisionCumplida, Proximamente } from '../componentes/Comunes.jsx';
import { api } from '../api.js';
import { hoy, nodosDeMundo, retosCompletadosDe, siguientePaso } from '../logica/juego.js';
import { STICKERS } from '../contenido/mundos.js';

// Posición horizontal de cada nodo para dibujar el sendero en zigzag.
const ZIGZAG = [12, 52, 22, 58, 30, 64];

const CONSEJOS = [
  'Multiplicar es juntar montones iguales: 3 × 6 son 3 montones de 6.',
  'Si te equivocas, mira la senda de pasos: ahí se ve dónde se torció el camino.',
  'Pedir una pista no te quita nada. ¡Los exploradores valientes preguntan!',
  'Cuenta de 5 en 5 o de 10 en 10 para llegar más rápido al total.',
];

function Estrellas({ llenas }) {
  return (
    <span className="estrellas-nodo" aria-hidden="true">
      {[0, 1, 2].map((i) => <I key={i} n="estrella" tamano={13} relleno={i < llenas} className={i < llenas ? 'texto-selva' : 'texto-tenue'} />)}
    </span>
  );
}

function Sendero({ mundo, estado, onCofre }) {
  const { nodos, cofre } = nodosDeMundo(estado, mundo);
  const items = [...nodos.map((n, i) => ({ tipo: 'reto', ...n, i })), { tipo: 'cofre', estado: cofre, i: nodos.length }];
  return (
    <ol className="sendero" aria-label={`Retos de ${mundo.nombre}`}>
      {items.map((it) => {
        const izquierda = `${ZIGZAG[it.i % ZIGZAG.length]}%`;
        if (it.tipo === 'cofre') {
          return (
            <li key="cofre" className="paso-sendero" style={{ marginLeft: izquierda }}>
              {it.estado === 'actual' ? (
                <button className="nodo-s nodo-actual nodo-cofre" onClick={onCofre} aria-label="Cofre del mundo: ¡ábrelo!">
                  <I n="cofre" tamano={28} />
                </button>
              ) : (
                <span className={`nodo-s ${it.estado === 'abierto' ? 'nodo-hecho' : 'nodo-bloq'}`} aria-label={it.estado === 'abierto' ? 'Cofre abierto' : 'Cofre bloqueado'}>
                  <I n={it.estado === 'abierto' ? 'check' : 'cofre'} tamano={24} />
                </span>
              )}
              <span className="etq-nodo">Cofre del mundo</span>
            </li>
          );
        }
        const { reto, estado: e, i } = it;
        const etiqueta = `${i + 1}. ${reto.titulo}`;
        return (
          <li key={reto.id} className="paso-sendero" style={{ marginLeft: izquierda }}>
            {e === 'actual' && (
              <span className="kiko-aqui"><I n="huella" tamano={14} /> ¡{estado.nombreAjolote} está aquí!</span>
            )}
            {e === 'bloqueado' ? (
              <span className="nodo-s nodo-bloq" aria-label={`${etiqueta}, bloqueado`}><I n="candado" tamano={22} /></span>
            ) : (
              <a href={`#/reto/${reto.id}`} className={`nodo-s ${e === 'actual' ? 'nodo-actual' : 'nodo-hecho'}`}
                aria-label={e === 'actual' ? `${etiqueta}, actual` : `${etiqueta}, completado. Repasar`}>
                {e === 'completado' ? <I n="check" tamano={26} grosor={3} /> : i + 1}
              </a>
            )}
            <Estrellas llenas={e === 'completado' ? 3 : 0} />
            <span className={`etq-nodo${e === 'bloqueado' ? ' texto-suave' : ''}`}>{etiqueta}</span>
          </li>
        );
      })}
    </ol>
  );
}

function TareaMaestra() {
  const [tareas, setTareas] = useState(null);
  useEffect(() => {
    api.aulas()
      .then((r) => setTareas(r.aulas.flatMap((a) => a.asignaciones.map((t) => ({ ...t, profesor: a.profesor })))))
      .catch(() => setTareas([]));
  }, []);
  if (!tareas) return null;
  return (
    <section className="tarjeta">
      <h2 className="t-sm" style={{ margin: '0 0 6px' }}><I n="tarea" tamano={18} className="texto-naranja" /> {tareas.length ? `Tarea de ${tareas[0].profesor}` : 'Tareas del aula'}</h2>
      {tareas.length ? tareas.map((t) => (
        <p key={t.id} className="cuerpo-sm texto-suave" style={{ margin: '0 0 4px' }}>
          Completar <b className="texto-tinta">{t.leccion}</b>{t.fecha_limite ? ` antes del ${t.fecha_limite}` : ''}.
        </p>
      )) : (
        <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>Aún no tienes misiones de tu maestra o maestro. <a className="enlace" href="#/aula">Únete a tu aula</a></p>
      )}
    </section>
  );
}

export default function Mapa() {
  const { estado, mundos, actualizar, aplicarServidor } = useJuego();
  const [premio, setPremio] = useState(null);
  const [error, setError] = useState(null);
  const [etapa, setEtapa] = useState('primaria');

  const abrir = async (mundo) => {
    setError(null);
    try {
      const r = await api.abrirCofre(mundo.id);
      aplicarServidor(r.estado);
      actualizar((s) => ({ ...s, celebrando: true }));
      setPremio({ mundo, estrellas: r.estrellas, sticker: r.sticker_nombre });
    } catch (e) {
      setError(e.message);
    }
  };

  if (premio) {
    return (
      <div className="pila-lg centro-col">
        <Ajolote estado="celebrando" tamano={160} mundosSuperados={estado.mundosTerminados.length} accesorios={estado.stickers} traje={estado.traje} />
        <MisionCumplida
          texto={`¡Superaste ${premio.mundo.nombre}! Ganaste ★ ${premio.estrellas} y un sticker nuevo: ${premio.sticker}. Las branquias de ${estado.nombreAjolote} ganaron un color.`}
          textoBoton="Seguir explorando"
          onPremio={() => {
            actualizar((s) => ({ ...s, celebrando: false }));
            setPremio(null);
          }}
        />
      </div>
    );
  }

  const jugables = mundos.filter((m) => !m.proximamente && m.retos.length);
  const proximos = mundos.filter((m) => m.proximamente || !m.retos.length);
  const total = jugables.reduce((n, m) => n + m.retos.length, 0);
  const hechos = jugables.reduce((n, m) => n + retosCompletadosDe(estado, m), 0);
  const pct = total ? Math.round((hechos / total) * 100) : 0;
  const paso = siguientePaso(estado, mundos);
  const bonoPendiente = estado.ultimoBonoDia !== hoy();
  const consejo = CONSEJOS[hechos % CONSEJOS.length];

  return (
    <div className="pila-lg">
      <section className="tarjeta barra-mapa">
        <div className="pila-sm">
          <div className="segmentado" role="tablist" aria-label="Etapa escolar">
            <button role="tab" aria-selected={etapa === 'primaria'} className={`seg-btn${etapa === 'primaria' ? ' activo' : ''}`} onClick={() => setEtapa('primaria')}>
              <I n="mochila" tamano={18} /> Primaria (Mundos 1–{jugables.length})
            </button>
            <button role="tab" aria-selected={etapa === 'secundaria'} className={`seg-btn${etapa === 'secundaria' ? ' activo' : ''}`} onClick={() => setEtapa('secundaria')}>
              <I n="cubo" tamano={18} /> Secundaria
            </button>
          </div>
          <div className="progreso-linea compacta">
            <span className="etq texto-suave">Progreso de la Selva:</span>
            <div className="barra-prog naranja"><span style={{ width: `${pct}%` }} /></div>
            <span className="etq">{pct}%</span>
          </div>
        </div>
        <div className="chips">
          <span className="pastilla"><I n="estrella" tamano={16} className="texto-selva" /> {hechos} / {total}</span>
          <span className="pastilla"><I n="rayo" tamano={16} className="c-fuego" /> {estado.dormido ? 'Kiko dormido' : 'Energía al 100%'}</span>
        </div>
      </section>

      {error && <div className="aviso-casi" role="alert">{error}</div>}

      {etapa === 'secundaria' ? (
        <section className="tarjeta tarjeta-grande centro-col" style={{ textAlign: 'center' }}>
          <span className="icono-caja ic-crema grande"><I n="candado" tamano={28} /></span>
          <h2 className="t-lg">Los mundos de Secundaria vienen en camino</h2>
          <p className="cuerpo-md texto-suave">Por ahora la selva tiene los mundos de Primaria. <Proximamente /></p>
        </section>
      ) : (
        <div className="grid-12">
          <div className="col-8 pila-lg">
            {jugables.map((mundo) => {
              const { abierto, cofre } = nodosDeMundo(estado, mundo);
              const hechosM = retosCompletadosDe(estado, mundo);
              const entrar = abierto || cofre === 'abierto';
              if (!entrar) {
                return (
                  <section key={mundo.id} className="tarjeta-suave mundo-bloqueado">
                    <div className="fila-entre">
                      <div>
                        <span className="sobre gris">Mundo {mundo.numero} <span className="texto-suave">• {mundo.concepto}</span></span>
                        <h2 className="t-lg" style={{ margin: '4px 0 0' }}>{mundo.nombre}</h2>
                      </div>
                      <span className="pastilla"><I n="candado" tamano={16} /> Bloqueado</span>
                    </div>
                    <div className="tarjeta cofre-secreto">
                      <span className="icono-caja ic-gris grande"><I n="cofre" tamano={26} /></span>
                      <div style={{ flex: 1 }}>
                        <b className="t-sm">Cofre de los Secretos</b>
                        <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>Abre el cofre del mundo anterior para abrir el portal a este mundo.</p>
                      </div>
                      <span className="pastilla"><I n="llave" tamano={16} /> 0 / 1 Llave</span>
                    </div>
                  </section>
                );
              }
              return (
                <section key={mundo.id} className="tarjeta tarjeta-grande mundo">
                  <span className="burbuja-deco b1" aria-hidden="true" />
                  <div className="fila-entre" style={{ alignItems: 'flex-start', position: 'relative' }}>
                    <div>
                      <span className="sobre"><span className="chip-mundo">Mundo {mundo.numero}</span> <span className="texto-suave">• {mundo.concepto}</span></span>
                      <h2 className="t-lg" style={{ margin: '4px 0 0' }}>{mundo.nombre}</h2>
                    </div>
                    <span className="pastilla">
                      <I n={cofre === 'abierto' ? 'checkCirculo' : 'logros'} tamano={16} className="texto-selva" />
                      {cofre === 'abierto' ? 'Mundo superado' : `Capítulo activo · ${hechosM}/${mundo.retos.length}`}
                    </span>
                  </div>
                  <Sendero mundo={mundo} estado={estado} onCofre={() => abrir(mundo)} />
                  {paso && paso.mundo.id === mundo.id && (
                    <div className="siguiente-desafio">
                      <span className="icono-caja ic-blanco"><I n="triangulo" /></span>
                      <div style={{ flex: 1 }}>
                        <b className="t-md">Siguiente Desafío: {paso.tipo === 'reto' ? paso.reto.titulo : 'Cofre del mundo'}</b>
                        <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>{paso.tipo === 'reto' ? paso.reto.enunciado : '¡Ábrelo para ganar un sticker!'}</p>
                      </div>
                      <button className="btn btn-naranja" onClick={() => (paso.tipo === 'reto' ? ir(`/reto/${paso.reto.id}`) : abrir(mundo))}>
                        {paso.tipo === 'reto' ? 'Jugar Ahora' : 'Abrir cofre'} <I n="jugar" tamano={16} />
                      </button>
                    </div>
                  )}
                </section>
              );
            })}

            {proximos.length > 0 && (
              <div className="rejilla-2">
                {proximos.map((m) => (
                  <section key={m.id} className="tarjeta-suave mundo-pronto">
                    <div className="fila-entre">
                      <span className="sobre gris">Mundo {m.numero}{m === proximos[proximos.length - 1] ? ' • Final' : ''}</span>
                      <I n="candado" tamano={20} className="texto-suave" />
                    </div>
                    <h3 className="t-md" style={{ margin: '4px 0' }}>{m.nombre}</h3>
                    <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>{m.entrada || m.concepto || 'Muy pronto abrirá este mundo.'}</p>
                    <div className="barra-prog gris" style={{ marginTop: 12 }}><span style={{ width: 0 }} /></div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <aside className="col-4 pila-lg">
            <section className="tarjeta">
              <div className="fila-entre">
                <h2 className="t-md" style={{ margin: 0 }}><I n="diana" tamano={20} className="texto-naranja" /> Misión Diaria</h2>
                <span className="chip">{bonoPendiente ? 'Termina hoy' : '¡Cumplida!'}</span>
              </div>
              <p className="cuerpo-md texto-suave">Resuelve 1 reto hoy para ganar el bono del día.</p>
              <div className="fila-entre etq"><span>Progreso de hoy</span><span>{bonoPendiente ? 0 : 1} de 1 retos</span></div>
              <div className="barra-prog naranja" style={{ margin: '6px 0 10px' }}><span style={{ width: bonoPendiente ? '0%' : '100%' }} /></div>
              <div className="chips">
                <span className="chip chip-gris"><I n="estrella" tamano={14} className="texto-selva" /> +5 Estrellas</span>
                <span className="chip chip-gris"><I n="gema" tamano={14} className="texto-naranja" /> +XP</span>
              </div>
            </section>

            <section className="tarjeta-suave consejo-kiko">
              <span className="kiko-icono grande"><I n="huella" tamano={22} /></span>
              <div>
                <b className="t-sm">Consejo de {estado.nombreAjolote}</b>
                <p className="cuerpo-sm texto-suave" style={{ margin: '2px 0 0' }}>“{consejo}”</p>
              </div>
            </section>

            <section className="tarjeta">
              <span className="sobre gris">Tu colección de stickers</span>
              <div className="coleccion">
                {Object.entries(STICKERS).map(([id, s]) => {
                  const tiene = estado.stickers.includes(id);
                  return (
                    <div key={id} className={`coleccion-item${tiene ? '' : ' falta'}`}>
                      <I n={id === 'mochila' ? 'mochila' : id === 'sombrero' ? 'sombrero' : 'chispa'} tamano={24} />
                      <b>{s.nombre.split(' ')[0]}</b>
                      <small>{tiene ? 'Ganado' : 'Bloqueado'}</small>
                    </div>
                  );
                })}
              </div>
            </section>

            <TareaMaestra />
          </aside>
        </div>
      )}
    </div>
  );
}
