import { useEffect, useState } from 'react';
import { useJuego } from '../estado/store.jsx';
import { ir } from '../ruta.js';
import Ajolote from '../componentes/Ajolote.jsx';
import I from '../componentes/IconosUI.jsx';
import { CabezaKiko, MisionCumplida, Proximamente } from '../componentes/Comunes.jsx';
import { api } from '../api.js';
import { hoy, nodosDeMundo, retosCompletadosDe, siguientePaso } from '../logica/juego.js';
import { STICKERS } from '../contenido/mundos.js';
import { COLORES_NIVEL, ChinampaIsla, Lirio, PecesNivel, TrajineraNivel } from '../componentes/Canal.jsx';

// Posición horizontal de cada nodo para dibujar el sendero en zigzag.
const ZIGZAG = [12, 52, 22, 58, 30, 64];

const CONSEJOS = [
  'Multiplicar es juntar montones iguales: 3 × 6 son 3 montones de 6.',
  'Si te equivocas, mira la senda de pasos: ahí se ve dónde se torció el camino.',
  'Pedir una pista no te quita nada. ¡Los exploradores valientes preguntan!',
  'Cuenta de 5 en 5 o de 10 en 10 para llegar más rápido al total.',
];

const CONSEJOS_CANAL = [
  'Para contar sin perderte, toca cada flor con tu dedo.',
  'Cuenta de 10 en 10 los ramos y luego las flores sueltas.',
  'Sumar es juntar; restar es quitar. ¡Usa tus dedos!',
  'Cada trajinera lleva 3 peces: resuelve sus 3 ejercicios para llenarla.',
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
              <span className="kiko-aqui"><CabezaKiko tamano={22} /> ¡{estado.nombreAjolote} está aquí!</span>
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

/** El mundo donde va el alumno: el del siguiente reto o cofre; si ya terminó todo, el último que abrió. */
function mundoDondeVa(estado, mundos) {
  const paso = siguientePaso(estado, mundos);
  if (paso) return paso.mundo.id;
  const abiertos = mundos.filter((m) => !m.proximamente && m.retos.length && nodosDeMundo(estado, m).abierto);
  return abiertos.length ? abiertos[abiertos.length - 1].id : null;
}

// Las trajineras navegan por el centro del canal en una curva suave.
const CURVA_CANAL = ['center', 'flex-end', 'center', 'flex-start'];
// Chinampas y lirios esparcidos por las orillas (top en % del alto del canal).
const DECO_CANAL = [
  { tipo: 'isla', lado: 'izq', top: '1%', variante: 0 },
  { tipo: 'lirio', lado: 'der', top: '6%' },
  { tipo: 'isla', lado: 'der', top: '12%', variante: 1 },
  { tipo: 'lirio', lado: 'izq', top: '19%' },
  { tipo: 'isla', lado: 'izq', top: '24%', variante: 2 },
  { tipo: 'isla', lado: 'der', top: '35%', variante: 0 },
  { tipo: 'lirio', lado: 'izq', top: '42%' },
  { tipo: 'isla', lado: 'izq', top: '48%', variante: 1 },
  { tipo: 'lirio', lado: 'der', top: '55%' },
  { tipo: 'isla', lado: 'der', top: '60%', variante: 2 },
  { tipo: 'isla', lado: 'izq', top: '72%', variante: 0 },
  { tipo: 'lirio', lado: 'der', top: '78%' },
  { tipo: 'isla', lado: 'der', top: '84%', variante: 1 },
  { tipo: 'isla', lado: 'izq', top: '93%', variante: 2 },
];

/** Mundo del canal: cada nivel es una trajinera con 3 peces (uno por ejercicio resuelto); las chinampas adornan las orillas. */
function SenderoCanal({ mundo, estado, onCofre }) {
  const { nodos, cofre } = nodosDeMundo(estado, mundo);
  const niveles = [];
  for (const n of nodos) {
    let g = niveles.find((x) => x.nivel === n.reto.nivel);
    if (!g) niveles.push((g = { nivel: n.reto.nivel, tema: n.reto.nivelTema, titulo: n.reto.nivelTitulo, nodos: [] }));
    g.nodos.push(n);
  }
  return (
    <div className="canal-mapa">
      {DECO_CANAL.map((d, k) => (
        <span key={k} className={`canal-deco ${d.lado} ${d.tipo}`} style={{ top: d.top }} aria-hidden="true">
          {d.tipo === 'lirio' ? <Lirio /> : <ChinampaIsla variante={d.variante} />}
        </span>
      ))}
      <ol className="sendero sendero-canal" aria-label={`Niveles de ${mundo.nombre}`}>
        {niveles.map((g, i) => {
          const hechos = g.nodos.filter((n) => n.estado === 'completado').length;
          const actual = g.nodos.find((n) => n.estado === 'actual');
          const est = hechos === g.nodos.length ? 'hecho' : actual ? 'actual' : 'bloq';
          const destino = (actual || g.nodos[0]).reto;
          const nombre = `Nivel ${g.nivel}: ${g.titulo}`;
          const color = COLORES_NIVEL[(g.nivel - 1) % COLORES_NIVEL.length];
          return (
            <li key={g.nivel} className="paso-sendero paso-canal" style={{ alignSelf: CURVA_CANAL[i % CURVA_CANAL.length] }}>
              {est === 'actual' && <span className="kiko-aqui"><CabezaKiko tamano={22} /> ¡{estado.nombreAjolote} está aquí!</span>}
              {est === 'bloq' ? (
                <span className="trajinera-nodo" aria-label={`${nombre}, bloqueado`}>
                  <TrajineraNivel estado="bloq" color={color}><I n="candado" tamano={18} /></TrajineraNivel>
                </span>
              ) : (
                <a href={`#/reto/${destino.id}`} className="trajinera-nodo"
                  aria-label={est === 'hecho' ? `${nombre}, completado. Repasar` : `${nombre}, ${hechos} de 3 peces. Jugar`}>
                  <TrajineraNivel estado={est} color={color}>{est === 'hecho' ? <I n="check" tamano={20} grosor={3} /> : g.nivel}</TrajineraNivel>
                </a>
              )}
              <PecesNivel llenos={hechos} />
              <span className={`etq-nodo${est === 'bloq' ? ' texto-suave' : ''}`}>{nombre}</span>
              <small className="etq-tema">{g.tema}</small>
            </li>
          );
        })}
        <li className="paso-sendero paso-canal" style={{ alignSelf: CURVA_CANAL[niveles.length % CURVA_CANAL.length] }}>
          {cofre === 'actual' ? (
            <button className="nodo-s nodo-actual nodo-cofre" onClick={onCofre} aria-label="Cofre del embarcadero: ¡ábrelo!"><I n="cofre" tamano={28} /></button>
          ) : (
            <span className={`nodo-s ${cofre === 'abierto' ? 'nodo-hecho' : 'nodo-bloq'}`} aria-label={cofre === 'abierto' ? 'Cofre abierto' : 'Cofre bloqueado'}>
              <I n={cofre === 'abierto' ? 'check' : 'cofre'} tamano={24} />
            </span>
          )}
          <span className="etq-nodo">Cofre del embarcadero</span>
        </li>
      </ol>
    </div>
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
  // Solo el mundo donde va el alumno se despliega; los demás se ven al tocar "Ver mundo".
  const mundoActual = mundoDondeVa(estado, mundos);
  const [abiertos, setAbiertos] = useState(() => new Set(mundoActual ? [mundoActual] : []));
  // Al pasar a otro mundo, ese queda desplegado y el anterior se pliega.
  useEffect(() => {
    if (mundoActual) setAbiertos((s) => (s.size === 1 && s.has(mundoActual) ? s : new Set([mundoActual])));
  }, [mundoActual]);

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
  const listaConsejos = mundos.find((m) => m.id === mundoActual)?.tema === 'xochimilco' ? CONSEJOS_CANAL : CONSEJOS;
  const consejo = listaConsejos[hechos % listaConsejos.length];
  const alternar = (id) => setAbiertos((s) => {
    const nuevo = new Set(s);
    if (nuevo.has(id)) nuevo.delete(id); else nuevo.add(id);
    return nuevo;
  });

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
              const desplegado = abiertos.has(mundo.id);
              const aqui = mundo.id === mundoActual;
              const canal = mundo.tema === 'xochimilco';
              const cabecera = (
                <button type="button" className="mundo-cabecera" aria-expanded={desplegado} aria-controls={`mundo-${mundo.id}`}
                  onClick={() => alternar(mundo.id)}>
                  <span className="mundo-titulo">
                    <span className={`sobre${entrar ? '' : ' gris'}`}>
                      {entrar ? <span className="chip-mundo">Mundo {mundo.numero}</span> : `Mundo ${mundo.numero}`}
                      {' '}<span className="texto-suave">• {mundo.concepto}</span>
                    </span>
                    <span className="t-lg mundo-nombre">{mundo.nombre}</span>
                  </span>
                  <span className="mundo-estado">
                    {aqui && <span className="chip chip-verde"><CabezaKiko tamano={20} /> Estás aquí</span>}
                    {!entrar ? <span className="pastilla"><I n="candado" tamano={16} /> Bloqueado</span> : (
                      <span className="pastilla">
                        <I n={cofre === 'abierto' ? 'checkCirculo' : 'logros'} tamano={16} className="texto-selva" />
                        {cofre === 'abierto' ? 'Mundo superado' : `${hechosM}/${mundo.retos.length}`}
                      </span>
                    )}
                    <span className="mundo-ver">{desplegado ? 'Ocultar' : 'Ver mundo'} <I n="atras" tamano={16} className={`chevron${desplegado ? ' arriba' : ''}`} /></span>
                  </span>
                </button>
              );
              if (!entrar) {
                return (
                  <section key={mundo.id} className="tarjeta-suave mundo-bloqueado">
                    {cabecera}
                    {desplegado && (
                      <div id={`mundo-${mundo.id}`} className="tarjeta cofre-secreto" style={{ marginTop: 14 }}>
                        <span className="icono-caja ic-gris grande"><I n="cofre" tamano={26} /></span>
                        <div style={{ flex: 1 }}>
                          <b className="t-sm">Cofre de los Secretos</b>
                          <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>Abre el cofre del mundo anterior para abrir el portal a este mundo.</p>
                        </div>
                        <span className="pastilla"><I n="llave" tamano={16} /> 0 / 1 Llave</span>
                      </div>
                    )}
                  </section>
                );
              }
              return (
                <section key={mundo.id} className={`tarjeta mundo${desplegado ? ' tarjeta-grande' : ''}${canal ? ' mundo-canal' : ''}`}>
                  {!canal && <span className="burbuja-deco b1" aria-hidden="true" />}
                  {cabecera}
                  {desplegado && (
                  <div id={`mundo-${mundo.id}`}>
                  {canal
                    ? <SenderoCanal mundo={mundo} estado={estado} onCofre={() => abrir(mundo)} />
                    : <Sendero mundo={mundo} estado={estado} onCofre={() => abrir(mundo)} />}
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
              <span className="kiko-icono grande"><CabezaKiko tamano={46} /></span>
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
