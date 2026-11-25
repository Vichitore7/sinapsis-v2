// Examen general al final de un mundo temático (Canal, Centro…). Ruta: #/examen/<leccion_id>
// - Una pregunta por nivel, con pistas y hasta 3 intentos. Si falla los 3, queda "para practicar" y sigue: no se castiga.
// - Al terminar: certificado del mundo + 2 trajes de subculturas (uno de cada estilo).
// - El mundo siguiente se abre cuando Kiko se pone uno de esos trajes.
// Todo lo que pasa (respuestas, fallas, pistas y tiempos) lo guarda el servidor para el reporte del profesor.
import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useJuego } from '../estado/store.jsx';
import { ir } from '../ruta.js';
import Ajolote from '../componentes/Ajolote.jsx';
import I from '../componentes/IconosUI.jsx';
import SendaPasos from '../componentes/SendaPasos.jsx';
import { DiceAjolote } from '../componentes/Comunes.jsx';
import { ChipFase, temaDe } from '../componentes/Temas.jsx';
import { TarjetaMetro } from '../componentes/CDMX.jsx';
import { Flor } from '../componentes/Canal.jsx';
import { TRAJES } from '../contenido/mundos.js';
import { MAX_PISTAS } from '../logica/pistas.js';

const MAX_INTENTOS = 3;

function fechaLarga(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Progreso({ preguntas, actual }) {
  return (
    <ol className="examen-puntos" aria-label="Avance del examen">
      {preguntas.map((p, i) => (
        <li key={p.id} className={`examen-punto ${p.estado}${i === actual ? ' actual' : ''}`}
          title={`Pregunta ${i + 1}: ${p.estado === 'pendiente' ? 'pendiente' : p.estado === 'por_reforzar' ? 'para practicar' : 'lograda'}`} />
      ))}
    </ol>
  );
}

function Pregunta({ leccionId, pregunta, numero, total, preguntas, onCerrada, Visual }) {
  const [respuesta, setRespuesta] = useState('');
  const [pistas, setPistas] = useState(0);
  const [diag, setDiag] = useState(null);
  const [restantes, setRestantes] = useState(MAX_INTENTOS - pregunta.intentos);
  const [cierre, setCierre] = useState(null); // { estado, examen }
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const inicio = useRef(Date.now());

  const opcion = pregunta.tipo === 'opcion';
  const hay = opcion ? respuesta.trim() !== '' : /[0-9]/.test(respuesta);
  const pistaActual = pistas > 0 ? pregunta.pistas[pistas - 1] : null;

  const enviar = async (valor) => {
    setEnviando(true);
    setError(null);
    try {
      const r = await api.responderExamen(leccionId, pregunta.id, {
        respuesta: valor, pistas_usadas: pistas, tiempo_ms: Date.now() - inicio.current,
      });
      inicio.current = Date.now();
      setRestantes(r.intentos_restantes);
      if (r.estado !== 'pendiente') setCierre({ estado: r.estado, examen: r.examen });
      else { setDiag(r.diagnostico); setRespuesta(''); }
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  if (cierre) {
    const logrado = cierre.estado !== 'por_reforzar';
    return (
      <section className="sm-card examen-cierre" role="status">
        <span className={`examen-sello ${logrado ? 'ok' : 'practicar'}`}><I n={logrado ? 'check' : 'foco'} tamano={30} grosor={3} /></span>
        <h2 className="subtitulo" style={{ margin: 0 }}>{logrado ? '¡Muy bien!' : 'Esta la practicamos después'}</h2>
        <p className="cuerpo" style={{ margin: 0 }}>
          {logrado
            ? cierre.estado === 'a_la_primera' ? 'La resolviste a la primera.' : 'La resolviste. Pedir ayuda también es de exploradores.'
            : 'No pasa nada: equivocarse también es aprender. Sigue con la siguiente.'}
        </p>
        <button className="sm-btn ancho" onClick={() => onCerrada(cierre.examen)} autoFocus>
          {numero === total ? 'Ver mi resultado' : 'Siguiente pregunta'}
        </button>
      </section>
    );
  }

  return (
    <div className="reto-layout">
      <div className="pila col-principal">
        <DiceAjolote estado={diag ? 'curioso' : 'feliz'} tamano={80}>
          {diag ? diag.pregunta : pistaActual || 'Lee con calma. Si lo necesitas, pide una pista.'}
        </DiceAjolote>
        <form className="sm-card" onSubmit={(e) => { e.preventDefault(); if (hay && !enviando) enviar(respuesta.trim()); }}>
          <div className="fila-entre" style={{ marginBottom: 'var(--espacio-3)' }}>
            <span className="sm-chip">Pregunta {numero} de {total} · {pregunta.nivel_tema}</span>
            <span className="sm-chip sm-chip-sol">{restantes} {restantes === 1 ? 'intento' : 'intentos'}</span>
          </div>
          <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>{pregunta.titulo}</h2>
          <p className="cuerpo" style={{ margin: '0 0 var(--espacio-3)' }}>{pregunta.enunciado}</p>
          <ChipFase fase={pregunta.fase_cpa} />
          <Visual visual={pregunta.visual} />
          {opcion ? (
            <div className="canal-opciones" role="radiogroup" aria-label="Elige tu respuesta">
              {pregunta.opciones.map((o) => (
                <button key={o} type="button" role="radio" aria-checked={respuesta === o}
                  className={`canal-opcion${respuesta === o ? ' elegida' : ''}`} onClick={() => setRespuesta(o)}>{o}</button>
              ))}
            </div>
          ) : (
            <div className="operacion">
              <label className="numero-reto" htmlFor="respuesta-examen">
                {pregunta.tipo === 'numerica' ? `${pregunta.a} ${pregunta.op} ${pregunta.b} =` : `Tu respuesta${pregunta.moneda ? ' $' : ''}`}
              </label>
              <input id="respuesta-examen" className="sm-input" inputMode="numeric" autoComplete="off" placeholder="?"
                value={respuesta} onChange={(e) => setRespuesta(e.target.value)} aria-label="Tu respuesta" />
            </div>
          )}
          <div className="acciones">
            <button className="sm-btn" type="submit" disabled={!hay || enviando}>{enviando ? 'Revisando…' : 'Comprobar'}</button>
            {pistas < MAX_PISTAS && (
              <button className="sm-btn sm-btn-pista" type="button" onClick={() => setPistas((n) => n + 1)}>? Pista</button>
            )}
            <button className="sm-btn sm-btn-suave" type="button" disabled={enviando} onClick={() => enviar(null)}>No sé todavía</button>
          </div>
          {error && <p className="etiqueta texto-casi" role="alert" style={{ margin: 'var(--espacio-3) 0 0' }}>{error}</p>}
        </form>
      </div>
      <div className="pila col-lateral">
        <div className="sm-card examen-lateral">
          <h3 className="subtitulo" style={{ margin: 0 }}>Tu examen</h3>
          <Progreso preguntas={preguntas} actual={numero - 1} />
          <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>
            Tienes {MAX_INTENTOS} intentos por pregunta y puedes pedir pistas. Si una no sale, la practicamos después.
          </p>
        </div>
        {pistaActual && (
          <div className="pista-caja">
            <span className="sm-chip sm-chip-pista">PISTA {pistas} DE {MAX_PISTAS}</span>
            <div className="sm-bubble">{pistaActual}</div>
          </div>
        )}
        {diag && <SendaPasos pasos={diag.pasos} pregunta={diag.pregunta} numeroPista={0} />}
      </div>
    </div>
  );
}

/** Dibujo del sticker que da el mundo (si no hay dibujo propio, una chispa). */
function ArteSticker({ id }) {
  if (id === 'tarjeta') return <TarjetaMetro tamano={92} />;
  if (id === 'flor') return <Flor tamano={64} />;
  return <I n="chispa" tamano={48} />;
}

function Resultado({ examen, mundo, siguiente }) {
  const { estado, aplicarServidor } = useJuego();
  const [vistiendo, setVistiendo] = useState(null);
  const [error, setError] = useState(null);
  const abierto = siguiente ? Boolean(estado.mapa?.[siguiente.id]?.abierta) : examen.mundo_abierto;
  const practicar = examen.preguntas.filter((p) => p.estado === 'por_reforzar').map((p) => p.nivel_tema);
  const kiko = estado.nombreAjolote;
  const palabras = temaDe(mundo)?.palabras || {};
  const diploma = palabras.diploma || 'Certificado de explorador';

  const ponerse = async (traje) => {
    setVistiendo(traje);
    setError(null);
    try { aplicarServidor(await api.vestir(traje)); } catch (e) { setError(e.message); } finally { setVistiendo(null); }
  };

  return (
    <div className="pila-lg">
      <div className="diploma certificado" id="diploma-imprimible">
        <span className="diploma-deco" aria-hidden="true" />
        <div className="fila-entre">
          <span className="diploma-marca"><span className="diploma-sm">SM</span> Selva Matemática</span>
          <span className="chip chip-oro">Mundo {mundo.numero} terminado</span>
        </div>
        <p className="diploma-titulo">{diploma}</p>
        <p className="diploma-nombre">{estado.apodo}</p>
        <p className="cuerpo-md">
          Terminó el <b>examen general de {mundo.nombre}</b> y logró {examen.aciertos} de {examen.total} preguntas.
        </p>
        <div className="diploma-pie">
          <div><small>Fecha</small><b>{fechaLarga(examen.fecha_fin)}</b></div>
          <div className="diploma-firma">
            <Ajolote estado="feliz" tamano={44} cabeza traje={estado.traje} />
            <div><b>{kiko} el Ajolote</b><small><i>Tutor mentor</i></small></div>
          </div>
        </div>
      </div>
      <div className="chips">
        <button className="btn btn-crema btn-chico" onClick={() => window.print()}><I n="imprimir" tamano={16} /> Imprimir {diploma.split(" ")[0].toLowerCase()}</button>
        {practicar.length > 0 && <span className="chip chip-ambar"><I n="foco" tamano={14} /> Para practicar: {practicar.join(', ')}</span>}
      </div>

      {examen.sticker && (
        <section className="tarjeta examen-sticker">
          <span className="sticker examen-sticker-arte"><ArteSticker id={examen.sticker.id} /></span>
          <div>
            <span className="sobre"><I n="libro" tamano={14} /> Sticker nuevo para tu álbum</span>
            <b className="t-md">{examen.sticker.nombre}</b>
            <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>Lo encuentras en tu Perfil → Stickers.</p>
          </div>
        </section>
      )}

      <section className="tarjeta pila-md examen-premio">
        <div>
          <span className="sobre"><I n="chispa" tamano={14} /> ¡Ganaste {examen.premio.length} trajes nuevos!</span>
          <h2 className="t-lg" style={{ margin: '4px 0 0' }}>{palabras.premioTitulo || 'Trajes nuevos'}</h2>
          <p className="cuerpo-md texto-suave" style={{ margin: '2px 0 0' }}>
            {abierto
              ? `¡Listo! ${siguiente ? `El Mundo ${siguiente.numero}: ${siguiente.nombre} ya está abierto.` : 'Ya abriste el siguiente mundo.'}`
              : `Ponle uno a ${kiko} para abrir ${siguiente ? `el Mundo ${siguiente.numero}: ${siguiente.nombre}` : 'el siguiente mundo'}.`}
          </p>
        </div>
        <div className="trajes">
          {examen.premio.map((t) => {
            const info = TRAJES[t.id] || { nombre: t.nombre };
            const puesto = estado.traje === t.id;
            return (
              <div key={t.id} className={`traje-carta${puesto ? ' activo' : ''}`}>
                <span className="traje-arte grande"><Ajolote estado="celebrando" tamano={120} traje={t.id} etiqueta={info.nombre} /></span>
                <b className="t-sm">{info.nombre}</b>
                {info.detalle && <small className="cuerpo-sm texto-suave">{info.detalle}</small>}
                <button className={`btn btn-chico ${puesto ? 'btn-verde' : 'btn-naranja'}`} disabled={vistiendo !== null || puesto} onClick={() => ponerse(t.id)}>
                  {vistiendo === t.id ? 'Vistiendo…' : puesto ? <><I n="check" tamano={14} grosor={3} /> Puesto</> : `Ponérselo a ${kiko}`}
                </button>
              </div>
            );
          })}
        </div>
        {error && <p className="etq texto-casi" role="alert" style={{ margin: 0 }}>{error}</p>}
        {abierto && (
          <button className="btn btn-naranja btn-grande" onClick={() => ir('/mapa')}>
            Ir al Mundo {siguiente?.numero ?? ''} <I n="flecha" />
          </button>
        )}
        <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>También los encuentras en tu Perfil → Stickers.</p>
      </section>
    </div>
  );
}

export default function ExamenMundo({ retoId: leccionId }) {
  const { mundos, aplicarServidor } = useJuego();
  const [examen, setExamen] = useState(null);
  const [error, setError] = useState(null);
  const mundo = mundos.find((m) => m.id === leccionId);
  const siguiente = mundo ? mundos.find((m) => m.numero === mundo.numero + 1 && m.retos.length) : null;

  useEffect(() => {
    api.examen(leccionId).then(setExamen).catch((e) => setError(e.message));
  }, [leccionId]);

  // Al cerrar la última pregunta se termina el examen: certificado y premio.
  const siguientePregunta = async (ex) => {
    if (ex.preguntas.some((p) => p.estado === 'pendiente')) { setExamen(ex); return; }
    try {
      const r = await api.terminarExamen(leccionId);
      aplicarServidor(r.estado);
      setExamen(r.examen);
      window.scrollTo(0, 0);
    } catch (e) { setError(e.message); }
  };

  if (error) {
    return (
      <div className="pila">
        <DiceAjolote estado="curioso">{error}</DiceAjolote>
        <button className="sm-btn" onClick={() => ir('/mapa')}>Ir al mapa</button>
      </div>
    );
  }
  if (!examen || !mundo) return <p className="cuerpo-md texto-suave">Preparando el examen…</p>;

  const indice = examen.preguntas.findIndex((p) => p.estado === 'pendiente');
  return (
    <div className={`pila-lg tema-canal reto-canal ${temaDe(mundo)?.clase || ''}`}>
      <header className="canal-portada examen-portada">
        <span className="canal-portada-arco">
          <span className="sobre">{examen.terminado ? '¡Examen terminado!' : 'Examen general'} · Mundo {mundo.numero}</span>
          <b className="t-lg">{mundo.nombre}</b>
        </span>
        <span className="canal-portada-peces">
          <span className="examen-cuenta">{examen.terminado ? `${examen.aciertos} / ${examen.total}` : `${indice + 1} / ${examen.total}`}</span>
          <small className="etq">{examen.terminado ? 'logradas' : 'pregunta'}</small>
        </span>
      </header>
      {examen.terminado || indice === -1 ? (
        examen.terminado
          ? <Resultado examen={examen} mundo={mundo} siguiente={siguiente} />
          : <button className="sm-btn" onClick={() => siguientePregunta(examen)}>Ver mi resultado</button>
      ) : (
        <Pregunta key={examen.preguntas[indice].id} leccionId={leccionId} pregunta={examen.preguntas[indice]}
          numero={indice + 1} total={examen.total} preguntas={examen.preguntas} onCerrada={siguientePregunta}
          Visual={temaDe(mundo)?.Visual || (() => null)} />
      )}
    </div>
  );
}
