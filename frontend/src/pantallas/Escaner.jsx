// Escáner de cuaderno (Escaner-de-cuaderno.md): captura → recorte → lectura confirmada → diagnóstico.
// Privacidad: la foto se borra en cuanto se confirma la lectura. Solo se guarda el texto.
import { useEffect, useRef, useState } from 'react';
import I from '../componentes/IconosUI.jsx';
import { useJuego } from '../estado/store.jsx';
import { DiceAjolote } from '../componentes/Comunes.jsx';
import SendaPasos from '../componentes/SendaPasos.jsx';
import Ajolote from '../componentes/Ajolote.jsx';
import { leerArchivo, recortarYComprimir } from '../logica/imagen.js';
import { leerFoto, pistasEscaner } from '../logica/lector.js';
import { BannerActividad } from '../componentes/Actividades.jsx';
import { conDuda, diagnosticarOperacion, explicacionResuelta, senderoResuelto, quitarNegados, resolvioEnChat, esFraccion, pistasGenerales, tipoDe, validar, yaLoDijo } from '../logica/operaciones.js';
import { ejemploParecido } from '../logica/pistas.js';
import { hoy } from '../logica/juego.js';
import { api } from '../api.js';
import DibujoTutor from '../componentes/DibujoTutor.jsx';

const MAX_PENDIENTES = 5;

function useEnLinea() {
  const [enLinea, setEnLinea] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setEnLinea(true);
    const off = () => setEnLinea(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return enLinea;
}

// ---------- 1. Captura ----------
function Captura({ onFoto, pendientes, enLinea, onLeerPendiente, historial }) {
  const camara = useRef(null);
  const galeria = useRef(null);
  const elegir = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) onFoto(await leerArchivo(f));
  };
  const recientes = historial.slice(-3).reverse();
  return (
    <section className="tarjeta escaner-tarjeta">
      <div className="fila-entre" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2 className="t-lg" style={{ margin: 0 }}><I n="escaner" tamano={26} className="texto-naranja" /> Escáner de Cuaderno</h2>
          <p className="cuerpo-sm texto-suave" style={{ margin: '2px 0 0' }}>Una sola operación por captura, con luz natural sin sombras.</p>
        </div>
        <span className="pastilla"><span className={`punto ${enLinea ? 'punto-verde' : 'punto-casi'}`} /> {enLinea ? 'Lente lista' : 'Sin internet'}</span>
      </div>
      <div className="visor-stitch" role="img" aria-label="Visor de la cámara">
        <i className="esq a" /><i className="esq b" /><i className="esq c" /><i className="esq d" />
        <span className="visor-chip"><I n="diana" tamano={14} /> Alinea tu cuaderno dentro del marco</span>
        <div className="visor-centro">
          <span className="sobre verde"><I n="chispa" tamano={14} /> Una operación</span>
          <span className="visor-op">3 × 6 = <b>?</b></span>
          <span className="cuerpo-sm texto-suave">Así se ve una buena captura</span>
        </div>
        <span className="visor-listo"><I n="checkCirculo" tamano={16} className="texto-selva" /> Listo para resolver con Kiko</span>
      </div>
      <div className="rejilla-2 apretada">
        <button className="btn btn-verde btn-grande" onClick={() => camara.current.click()}><I n="camara" tamano={24} /> Tomar foto ahora</button>
        <button className="btn btn-crema btn-grande" onClick={() => galeria.current.click()}><I n="galeria" tamano={24} /> Elegir de galería</button>
      </div>
      <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={elegir} />
      <input ref={galeria} type="file" accept="image/*" hidden onChange={elegir} />

      {pendientes.length > 0 && (
        <div className="tarjeta-suave fila-entre" style={{ marginTop: 12 }}>
          <span className="chip chip-pista">En espera · {pendientes.length} foto{pendientes.length > 1 ? 's' : ''}</span>
          {enLinea
            ? <button className="btn btn-naranja btn-chico" onClick={() => onLeerPendiente(pendientes[0])}>Leer la siguiente foto</button>
            : <span className="cuerpo-sm texto-suave">Cuando haya internet, leeré tus fotos.</span>}
        </div>
      )}

      <div className="tarjeta-suave recientes">
        <div className="fila-entre"><b className="t-sm">Últimos ejercicios escaneados</b><span className="etq texto-naranja">{historial.length} en total</span></div>
        {recientes.length ? (
          <div className="recientes-lista">
            {recientes.map((h, i) => (
              <div key={i} className={`reciente${i === 0 && !h.correcto ? ' activo' : ''}`}>
                <span className="reciente-op">{h.a}{h.op}{h.b}</span>
                <span>
                  <b className="cuerpo-sm">{h.fecha}</b>
                  <small className={h.correcto ? 'texto-selva' : 'texto-naranja'}>{h.correcto ? 'Resuelto 🎉' : 'En curso 💬'}</small>
                </span>
              </div>
            ))}
          </div>
        ) : <p className="cuerpo-sm texto-suave" style={{ margin: '6px 0 0' }}>Aún no escaneas nada. ¡Prueba con tu tarea de hoy!</p>}
      </div>
    </section>
  );
}

// ---------- 2. Recorte ----------
function Recorte({ foto, onEnviar, onOtra }) {
  const caja = useRef(null);
  const [marco, setMarco] = useState({ x: 0.08, y: 0.2, w: 0.84, h: 0.6 });
  const arrastre = useRef(null);
  const [enviando, setEnviando] = useState(false);

  const inicio = (modo) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    arrastre.current = { modo, x0: e.clientX, y0: e.clientY, marco0: marco };
  };

  const mover = (e) => {
    const a = arrastre.current;
    if (!a || !caja.current) return;
    const r = caja.current.getBoundingClientRect();
    const dx = (e.clientX - a.x0) / r.width;
    const dy = (e.clientY - a.y0) / r.height;
    const m = { ...a.marco0 };
    const min = 0.1;
    if (a.modo === 'mover') {
      m.x = Math.min(1 - m.w, Math.max(0, m.x + dx));
      m.y = Math.min(1 - m.h, Math.max(0, m.y + dy));
    } else {
      if (a.modo.includes('izq')) {
        const x = Math.min(m.x + m.w - min, Math.max(0, m.x + dx));
        m.w = m.w + (m.x - x); m.x = x;
      }
      if (a.modo.includes('der')) m.w = Math.min(1 - m.x, Math.max(min, m.w + dx));
      if (a.modo.includes('arr')) {
        const y = Math.min(m.y + m.h - min, Math.max(0, m.y + dy));
        m.h = m.h + (m.y - y); m.y = y;
      }
      if (a.modo.includes('aba')) m.h = Math.min(1 - m.y, Math.max(min, m.h + dy));
    }
    setMarco(m);
  };

  const fin = () => { arrastre.current = null; };

  const enviar = async () => {
    setEnviando(true);
    try {
      onEnviar(await recortarYComprimir(foto, marco));
    } finally {
      setEnviando(false);
    }
  };

  const pct = (v) => `${v * 100}%`;
  return (
    <section className="sm-card">
      <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-1)' }}>Recorta el ejercicio</h2>
      <p className="consejo">Deja dentro del marco solo la operación.</p>
      <div className="recorte" ref={caja} onPointerMove={mover} onPointerUp={fin} onPointerCancel={fin}>
        <img src={foto} alt="Foto de tu cuaderno" draggable={false} />
        <div
          className="marco"
          style={{ left: pct(marco.x), top: pct(marco.y), width: pct(marco.w), height: pct(marco.h) }}
          onPointerDown={inicio('mover')}
        >
          {[['a', 'arr-izq'], ['b', 'arr-der'], ['c', 'aba-izq'], ['d', 'aba-der']].map(([c, modo]) => (
            <i key={c} className={`ag ${c}`} onPointerDown={inicio(modo)} aria-hidden="true" />
          ))}
        </div>
      </div>
      <p className="consejo" style={{ marginTop: 'var(--espacio-2)' }}>Solo se envía lo que está dentro del marco.</p>
      <div className="col-3">
        <button className="sm-btn ancho" onClick={enviar} disabled={enviando}>{enviando ? 'Preparando…' : 'Enviar al ajolote'}</button>
        <button className="sm-btn sm-btn-suave ancho" onClick={onOtra}>Volver a tomar</button>
      </div>
    </section>
  );
}

// ---------- 2b. Sin conexión ----------
function SinConexion({ cuantas, onListo }) {
  return (
    <section className="sm-card">
      <span className="sm-chip sm-chip-pista" style={{ marginBottom: 'var(--espacio-3)' }}>En espera · {cuantas} foto{cuantas > 1 ? 's' : ''}</span>
      <DiceAjolote estado="feliz" tamano={100}>Tu foto está en mi mochila.</DiceAjolote>
      <h3 className="cuerpo-fuerte" style={{ margin: 'var(--espacio-3) 0 var(--espacio-2)' }}>Mientras llega, pensemos</h3>
      <ol className="preguntas">
        <li><span className="n">1</span><span>¿Qué te pide el problema?</span></li>
        <li><span className="n">2</span><span>¿Qué datos tienes?</span></li>
        <li><span className="n">3</span><span>¿Qué operación usaste y por qué?</span></li>
      </ol>
      <p className="cierre">Cuando haya internet, leeré tu foto.</p>
      <button className="sm-btn sm-btn-suave" onClick={onListo}>Entendido</button>
    </section>
  );
}

// ---------- 3. Lectura confirmada ----------
/** Un número del cuaderno: entero o fracción (3/4 se dibuja uno sobre otro). */
function Num({ valor }) {
  const t = String(valor ?? '');
  if (!t.includes('/')) return <span>{t}</span>;
  const [n, d] = t.split('/');
  return <span className="frac" role="img" aria-label={`${n} sobre ${d}`}><span>{n}</span><span>{d}</span></span>;
}

/** "17 ÷ 5 = 3 residuo 2", "3/4 + 1/2 = 4/6" (para el chat y el historial). */
export function textoOperacion(op) {
  return `${op.a} ${op.op} ${op.b} = ${op.c}${op.residuo ? ` residuo ${op.residuo}` : ''}`;
}

function Lectura({ lectura, onConfirmar }) {
  const sinLectura = lectura === null;
  const sinResultado = !sinLectura && lectura.c === '';
  const [editando, setEditando] = useState(sinLectura || sinResultado);
  const [op, setOp] = useState(lectura ? { residuo: '', ...lectura } : { a: '', op: '×', b: '', c: '', residuo: '' });
  const valida = validar(op);
  const completo = !!valida && valida.c !== '';
  const lleno = [op.a, op.b, op.c].every((v) => String(v).trim() !== '');
  const conResiduo = op.op === '÷' && ![op.a, op.b, op.c].some(esFraccion);
  const campo = (k, etiqueta) => (
    <input className="campo" inputMode="text" autoComplete="off" value={op[k]} placeholder={k === 'residuo' ? '0' : ''}
      onChange={(e) => setOp({ ...op, [k]: e.target.value })} aria-label={etiqueta} />
  );

  return (
    <section className="sm-card">
      <span className={`sm-chip${editando ? ' sm-chip-pista' : ''}`} style={{ marginBottom: 'var(--espacio-2)' }}>
        {editando ? 'Corregir' : 'Confirmar'}
      </span>
      <DiceAjolote estado={sinLectura && editando ? 'curioso' : 'feliz'} tamano={90}>
        {sinLectura && editando
          ? 'No pude leer una operación en la foto. Escríbela como está en tu cuaderno.'
          : sinResultado && editando
            ? 'Leí tu operación, pero no veo tu resultado. Escribe el que pusiste en tu cuaderno.'
            : editando
              ? 'Cámbialo como está en tu cuaderno.'
              : lectura?.dudoso
                ? 'Leí esto, pero algunos números no se veían bien. ¿Está igual que en tu cuaderno?'
                : 'Leí esto en tu cuaderno. ¿Está bien?'}
      </DiceAjolote>

      <div className="hoja">
        {editando ? (
          <div className="num">
            {campo('a', 'Primer número')}
            <select className="campo campo-op" value={op.op} onChange={(e) => setOp({ ...op, op: e.target.value })} aria-label="Operación">
              <option value="×">×</option><option value="+">+</option><option value="−">−</option><option value="÷">÷</option>
            </select>
            {campo('b', 'Segundo número')}
            <span>=</span>
            {campo('c', 'Tu resultado')}
            {conResiduo && <><span className="residuo-etq">residuo</span>{campo('residuo', 'Residuo (lo que sobra)')}</>}
          </div>
        ) : (
          <div className="num">
            <Num valor={op.a} /><span>{op.op}</span><Num valor={op.b} /><span>=</span><Num valor={op.c} />
            {op.residuo && <span className="residuo-etq">residuo {op.residuo}</span>}
          </div>
        )}
      </div>
      {editando && (
        <p className="nota" style={{ marginTop: 0 }}>
          {lleno && !valida ? 'Revisa los números: usa números como 17 o fracciones como 3/4.' : 'Para una fracción escribe 3/4.'}
        </p>
      )}

      <div className="acciones">
        {editando ? (
          <button className="sm-btn" disabled={!completo} onClick={() => setEditando(false)}>Listo</button>
        ) : (
          <>
            <button className="sm-btn" onClick={() => onConfirmar(validar(op))}>¡Así es!</button>
            <button className="sm-btn sm-btn-suave" onClick={() => setEditando(true)}>Corregir</button>
          </>
        )}
      </div>
      <p className="nota">Después de leerla, borro la foto. Solo guardo lo que escribiste.</p>
    </section>
  );
}

/** Pistas del escáner: la del diagnóstico y dos generales según el tipo de operación. */
function pistasDe(op, d) {
  if (tipoDe(op) === 'enteros') return pistasEscaner({ a: Number(op.a), op: op.op, b: Number(op.b) }, d);
  return [d.pregunta, ...pistasGenerales(op)].slice(0, 3);
}

// ---------- 4. Diagnóstico ----------
function Diagnostico({ operacion, pista, onOtra, resuelta = false }) {
  const diag = diagnosticarOperacion(operacion);
  if (!diag.correcto && resuelta) {
    // La resolvió platicando con Kiko: el sendero se endereza y queda como terminado.
    return (
      <div className="pila">
        <div className="centro"><Ajolote estado="celebrando" tamano={110} /></div>
        <SendaPasos pasos={senderoResuelto(operacion)} numeroPista={0} />
        <div className="sm-acierto" role="status">
          <h2 className="titulo" style={{ margin: '0 0 var(--espacio-2)' }}>✓ ¡Lo resolviste!</h2>
          <p className="cuerpo" style={{ margin: '0 0 var(--espacio-3)' }}>Encontraste el resultado pensando con Kiko. Corrígelo en tu cuaderno cuando quieras.</p>
          <button className="sm-btn" onClick={onOtra}>Escanear otro ejercicio</button>
        </div>
      </div>
    );
  }
  if (diag.correcto) {
    return (
      <div className="pila">
        <div className="centro"><Ajolote estado="celebrando" tamano={110} /></div>
        <SendaPasos pasos={diag.pasos} numeroPista={0} />
        <div className="sm-acierto">
          <h2 className="titulo" style={{ margin: '0 0 var(--espacio-2)' }}>✓ ¡Tu sendero va derecho!</h2>
          <p className="cuerpo" style={{ margin: '0 0 var(--espacio-3)' }}>{diag.pregunta || 'Cada paso está bien, explorador.'}</p>
          <button className="sm-btn" onClick={onOtra}>Escanear otro ejercicio</button>
        </div>
      </div>
    );
  }
  const pistas = pistasDe(operacion, diag);
  return (
    <div className="pila">
      <SendaPasos pasos={diag.pasos} pregunta={pistas[Math.min(pista, 3) - 1]} numeroPista={Math.min(pista, 3)} />
      <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>Platica con Kiko en el chat para pedir más pistas.</p>
      <button className="sm-btn sm-btn-suave" onClick={onOtra}>Corregí mi cuaderno: escanear otra vez</button>
    </div>
  );
}

// ---------- Chat del tutor (pistas socráticas, nunca la respuesta) ----------
const SALUDO = {
  de: 'kiko',
  texto: '¡Hola explorador! 🔍 Toma una foto de UNA operación de tu cuaderno y la revisamos juntos. No te voy a dar la respuesta directa: tú eres el genio aquí.',
};

/** El grado que eligió el alumno al crear su cuenta (Cuenta.jsx lo guarda en este dispositivo). */
function gradoDe(usuario) {
  try { return (usuario && localStorage.getItem(`selva:grado:${usuario.id}`)) || undefined; } catch { return undefined; }
}

// Turnos del tutor: "visita:n". El número sube con cada mensaje; así el servidor sabe cuál es más nuevo y una copia
// vieja que llegue tarde no altera los turnos posteriores (backend/app/estrategia.py, TurnoTutor).
const VISITA = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random().toString(36).slice(2)}`).replace(/[^\w-]/g, '').slice(0, 36);
let contadorTurnos = 0;

function ChatTutor({ mensajes, onEnviar, onFoto, onPista, onEjemplo, hayOperacion, pistasActivas = hayOperacion, onReiniciar, onConfirmarOtro }) {
  const [texto, setTexto] = useState('');
  const fin = useRef(null);
  const camara = useRef(null);
  const galeria = useRef(null);
  const elegirFoto = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) onFoto(f);
  };
  // El chat tiene altura fija: al llegar un mensaje, se baja dentro del chat (sin mover la página).
  // Depende de `mensajes` y no de su largo: "Kiko está pensando" se reemplaza por la respuesta sin cambiar el largo.
  useEffect(() => {
    const lista = fin.current?.parentElement;
    if (lista) lista.scrollTo({ top: lista.scrollHeight, behavior: 'smooth' });
  }, [mensajes]);
  // Un mensaje a la vez: mientras Kiko piensa (o lee una foto) no se manda otro. Así las respuestas no llegan
  // desordenadas y la escalera de pistas del servidor no avanza dos veces.
  const ocupado = mensajes.some((m) => m.pensando);
  const enviar = (e) => {
    e.preventDefault();
    if (ocupado || !texto.trim()) return;
    onEnviar(texto.trim());
    setTexto('');
  };
  return (
    <section className="chat-tutor" aria-label="Chat con Kiko">
      <header className="chat-cabecera">
        <span className="chat-avatar"><Ajolote estado="feliz" tamano={46} /><span className="punto punto-verde" /></span>
        <div style={{ flex: 1 }}>
          <b className="t-md">Kiko el Ajolote <span className="chip chip-verde-fuerte">Tutor</span></b>
          <small>¡Te ayudo a pensar por ti mismo!</small>
        </div>
        <button className="boton-redondo translucido" onClick={onReiniciar} disabled={ocupado} aria-label="Reiniciar conversación"><I n="recargar" /></button>
      </header>
      <div className="chat-mensajes" aria-live="polite">
        {mensajes.map((m, i) => (
          m.de === 'kiko' ? (
            <div key={i} className="msg msg-kiko">
              <span className="msg-icono"><I n="cerebro" tamano={18} /></span>
              <div>
                <span className="msg-autor">Kiko Pensador{m.premio && <span className="texto-selva"> ★ {m.premio}</span>}</span>
                <div className="msg-globo">
                  {m.op && <div className="msg-op">{m.op}</div>}
                  {m.texto}
                  {m.dibujo && <div className="msg-dibujo"><DibujoTutor dibujo={m.dibujo} /></div>}
                  {m.confirmar && !m.respondido && (
                    <div className="msg-botones">
                      <button type="button" className="chip-sug" onClick={() => onConfirmarOtro(i, true)}>✅ Sí, eso dice</button>
                      <button type="button" className="chip-sug" onClick={() => onConfirmarOtro(i, false)}>✏️ No</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div key={i} className="msg msg-yo">
              <span className="msg-autor">Tú</span>
              <div className={`msg-globo${m.foto ? ' msg-foto' : ''}`}>
                {m.foto ? <img src={m.foto} alt="Foto que enviaste a Kiko" /> : m.texto}
              </div>
            </div>
          )
        ))}
        <span ref={fin} />
      </div>
      <div className="chat-sugerencias">
        <button className="chip-sug" onClick={onPista} disabled={!pistasActivas || ocupado}>💡 Dame otra pista</button>
        <button className="chip-sug" onClick={onEjemplo} disabled={!hayOperacion}>🧩 Dibújalo con bloques</button>
      </div>
      <form className="chat-entrada" onSubmit={enviar}>
        <button type="button" className="boton-redondo" onClick={() => camara.current.click()} disabled={ocupado} aria-label="Tomar foto para Kiko"><I n="camara" /></button>
        <button type="button" className="boton-redondo" onClick={() => galeria.current.click()} disabled={ocupado} aria-label="Subir imagen para Kiko"><I n="galeria" /></button>
        <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={elegirFoto} />
        <input ref={galeria} type="file" accept="image/*" hidden onChange={elegirFoto} />
        <input className="entrada" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe tu deducción a Kiko…" aria-label="Mensaje para Kiko" maxLength={200} />
        <button className="btn btn-naranja btn-cuadrado" aria-label="Enviar" disabled={ocupado}><I n="enviar" /></button>
      </form>
    </section>
  );
}

/** #/escaner/:aula.:actividad.:problema → el escáner revisa un problema de una actividad del aula. */
function contextoActividad(param) {
  const [aula, actividad, problema] = String(param || '').split('.');
  return aula && actividad && problema ? { aula: Number(aula), actividad: Number(actividad), problema } : null;
}

export default function Escaner({ retoId }) {
  const { estado, actualizar, usuario } = useJuego();
  const ctxAct = contextoActividad(retoId);
  const [actividad, setActividad] = useState(null);
  const refrescarActividad = () => { if (ctxAct) api.actividad(ctxAct.aula, ctxAct.actividad).then(setActividad).catch(() => {}); };
  useEffect(refrescarActividad, [retoId]); // eslint-disable-line react-hooks/exhaustive-deps
  const enLinea = useEnLinea();
  const [paso, setPaso] = useState('captura');
  const [foto, setFoto] = useState(null);
  const [lectura, setLectura] = useState(undefined);
  const [operacion, setOperacion] = useState(null);
  // Ya resolvió en el chat la operación escaneada: no se le ofrecen más pistas de ella (con o sin conexión).
  const [resuelta, setResuelta] = useState(false);
  // Turnos del tutor: el último turno cuya respuesta SÍ se mostró. El servidor solo cuenta un avance de la escalera
  // cuando el siguiente mensaje lo confirma; si una respuesta se descarta, ese pasito se repite en vez de perderse.
  const ultimoRecibido = useRef(null);
  useEffect(() => {
    if (resuelta && ctxAct && navigator.onLine) {
      api.resueltoEnChat(ctxAct.actividad, ctxAct.problema).then(refrescarActividad).catch(() => {});
    }
  }, [resuelta]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pista, setPista] = useState(1);
  const [mensajes, setMensajes] = useState([SALUDO]);
  // Cambia al reiniciar la plática y al confirmar otro ejercicio: una respuesta que llegue tarde de lo anterior
  // se descarta (no aparece bajo la cuenta nueva).
  const conversacion = useRef(0);
  // El registro del escaneo en el servidor (prepara la escalera de pistas): { op, ok: Promise<boolean> }.
  // El tutor lo espera antes de contestar, para que las dos peticiones no lleguen en desorden.
  const registro = useRef(null);
  // Cada petición marca su propio "pensando" con un número: al terminar quita SOLO el suyo, no el de otra.
  const peticion = useRef(0);
  // Ejercicio nuevo (otra cuenta confirmada): lo pendiente del anterior se descarta y su "pensando" se quita ya,
  // para que el chat de la cuenta nueva no se quede bloqueado esperando una respuesta vieja.
  const nuevoEjercicio = () => {
    conversacion.current += 1;
    setMensajes((xs) => xs.filter((m) => !m.pensando));
  };
  const registrar = (op) => api.registrarEscaneo(op).then(() => true, () => false);
  // Modo actividad: el escaneo cuenta para el problema (y el servidor también lo registra para Kiko).
  const escanearParaActividad = (op) => api.escaneoActividad(ctxAct.actividad, ctxAct.problema, op).then((r) => {
    if (!r.coincide) {
      decir({ de: 'kiko', texto: `Ojo: esta no es la operación del problema (${r.problema}). Revisa tu foto o tu cuaderno y escanéalo otra vez. 🔍` });
    }
    refrescarActividad();
    return true;
  }, () => false);
  // Ejercicio que el escáner no sabe revisar (problema de texto…) y que el alumno confirmó en el chat.
  const [ejercicio, setEjercicio] = useState(null);
  const pendientes = estado.escaner.pendientes;
  const columnaEscaner = useRef(null);
  const columnaChat = useRef(null);
  const decir = (...ms) => setMensajes((xs) => [...xs, ...ms]);

  const reiniciar = () => {
    setFoto(null);
    setLectura(undefined);
    setOperacion(null);
    setPista(1);
    setResuelta(false);
    setPaso('captura');
  };

  const leer = async (fotoComprimida) => {
    setFoto(fotoComprimida);
    setPaso('leyendo');
    const { lectura: leida, otro } = await leerFoto(fotoComprimida);
    if (!leida && otro) {
      // No es una operación que el escáner revise: se confirma y se platica en el chat.
      setFoto(null);
      setPaso('captura');
      pedirConfirmacionOtro(otro);
      return;
    }
    setLectura(leida);
    setPaso('lectura');
  };

  const pedirConfirmacionOtro = (otro) => {
    decir({ de: 'kiko', texto: `Esto no lo reviso en el escáner, pero lo vemos aquí. Leí en tu foto:\n«${otro}»\n¿Es lo que dice tu cuaderno?`, confirmar: otro });
    columnaChat.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const confirmarOtro = (indice, si) => {
    const texto = mensajes[indice]?.confirmar;
    setMensajes((xs) => xs.map((m, i) => (i === indice ? { ...m, respondido: true } : m)));
    if (!si) {
      decir({ de: 'yo', texto: 'No' }, { de: 'kiko', texto: 'Va. Escríbeme tu ejercicio aquí, tal como está en tu cuaderno, y lo vemos juntos. ✏️' });
      return;
    }
    setEjercicio(texto);
    setOperacion(null);
    nuevoEjercicio();
    alEscribir('Sí, eso dice. ¿Me ayudas?', { operacion: null, ejercicio: texto });
  };

  const enviar = async (fotoComprimida) => {
    if (!enLinea) {
      actualizar((s) => ({
        ...s,
        escaner: {
          ...s.escaner,
          pendientes: [...s.escaner.pendientes, { id: Date.now(), foto: fotoComprimida, fecha: hoy() }].slice(-MAX_PENDIENTES),
        },
      }));
      setFoto(null);
      setPaso('sinConexion');
      return;
    }
    await leer(fotoComprimida);
  };

  const leerPendiente = async (p) => {
    // La foto sale de la mochila en cuanto se envía.
    actualizar((s) => ({ ...s, escaner: { ...s.escaner, pendientes: s.escaner.pendientes.filter((x) => x.id !== p.id) } }));
    await leer(p.foto);
  };

  const confirmar = (op) => {
    setFoto(null); // La foto se borra apenas se confirma la lectura.
    setEjercicio(null);
    setOperacion(op);
    nuevoEjercicio(); // una respuesta pendiente de la cuenta anterior se descarta
    // Memoria de aprendizaje en el servidor (así Kiko recuerda entre sesiones). Si falla, la app sigue igual.
    registro.current = enLinea ? { op, ok: ctxAct ? escanearParaActividad(op) : registrar(op) } : null;
    setPista(1);
    setResuelta(false); // intento nuevo, aunque sea la misma cuenta
    const d = diagnosticarOperacion(op);
    actualizar((s) => ({
      ...s,
      escaner: {
        ...s.escaner,
        historial: [...s.escaner.historial, { fecha: hoy(), ...op, correcto: d.correcto, pasoTorcido: d.pasoTorcido }].slice(-50),
      },
    }));
    const opTexto = textoOperacion(op);
    if (d.correcto) {
      decir({ de: 'kiko', op: opTexto, texto: '¡Tu sendero va derecho! Revisé cada paso y todos están bien. ¿Escaneamos otro?', premio: '¡Bien pensado!' });
    } else {
      decir({ de: 'kiko', op: opTexto, texto: `He mirado con mi lupa la operación que escaneaste. El sendero se torció en el paso ${d.pasoTorcido}. No te voy a dar la respuesta: ${pistasDe(op, d)[0]}` });
    }
    setPaso('diagnostico');
  };

  const YA_RESUELTA = '¡Ese ejercicio ya lo resolviste! 🌟 Cuéntame cómo lo pensaste, o escanea otro para seguir practicando.';

  const otraPista = () => {
    if (!operacion) return;
    if (resuelta) { decir({ de: 'kiko', texto: YA_RESUELTA }); return; }
    // Con internet, la pide al tutor: el backend sube un escalón en su escalera de ayuda (fase 2).
    if (enLinea) { alEscribir('Dame otra pista'); return; }
    pistaLocal();
  };

  // Las 3 pistas por reglas del navegador (sin internet, o si el servidor no supo del escaneo).
  const pistaLocal = () => {
    if (resuelta) { decir({ de: 'kiko', texto: YA_RESUELTA }); return; }
    const d = diagnosticarOperacion(operacion);
    if (d.correcto) { decir({ de: 'kiko', texto: '¡Ya lo tienes bien! Si quieres, escanea otro ejercicio.' }); return; }
    const pistas = pistasDe(operacion, d);
    if (pista >= pistas.length) {
      decir({ de: 'kiko', texto: 'Ya te di mis 3 pistas. Prueba “Dibújalo con bloques” para ver un ejemplo parecido.' });
      return;
    }
    decir({ de: 'kiko', texto: `Pista ${pista + 1} de 3: ${pistas[pista]}` });
    setPista(pista + 1);
  };

  const ejemplo = () => {
    if (!operacion) return;
    const t = tipoDe(operacion);
    if (t === 'fracciones') {
      decir({ de: 'kiko', texto: `Dibuja dos pizzas del mismo tamaño: parte una para ${operacion.a} y otra para ${operacion.b}. ¿Los pedazos son del mismo tamaño? Si no, pártelos más chiquitos hasta que lo sean.` });
      return;
    }
    if (t === 'division') {
      decir({ de: 'kiko', texto: `Dibuja ${operacion.a} bolitas y enciérralas en grupos de ${operacion.b}. Cuenta cuántos grupos completos te salen y cuántas bolitas sobran.` });
      return;
    }
    if (operacion.op !== '×') {
      decir({ de: 'kiko', texto: `Dibuja ${operacion.a} bloques y luego ${operacion.op === '+' ? 'agrega' : 'quita'} ${operacion.b}. Cuenta los que quedan, uno por uno.` });
      return;
    }
    const e = ejemploParecido({ a: Number(operacion.a), b: Number(operacion.b), moneda: false });
    decir({ de: 'kiko', op: `${e.suma} = ${e.total}`, texto: `Mira este ejemplo parecido: ${e.a} bloques de ${e.b} son ${e.total}. Usa la misma idea con tu operación en el cuaderno.` });
  };

  // Foto enviada desde el chat: se comprime, se muestra como mensaje y Kiko responde.
  // La foto vive solo en la conversación abierta: no se guarda en el dispositivo ni en el servidor.
  const alFoto = async (archivo) => {
    let comprimida;
    try {
      comprimida = await recortarYComprimir(await leerArchivo(archivo), { x: 0, y: 0, w: 1, h: 1 });
    } catch {
      decir({ de: 'kiko', texto: 'No pude abrir esa imagen. Prueba con otra foto.' });
      return;
    }
    decir({ de: 'yo', foto: comprimida });
    if (!enLinea) {
      decir({ de: 'kiko', texto: 'Sin internet no puedo leer fotos. Escríbeme tu operación y la revisamos juntos.' });
      return;
    }
    const id = ++peticion.current;
    decir({ de: 'kiko', texto: 'Estoy leyendo tu foto con mi lupa… 🔍', pensando: id });
    const mia = conversacion.current;
    const { lectura: leida, otro } = await leerFoto(comprimida);
    setMensajes((xs) => xs.filter((m) => m.pensando !== id));
    if (mia !== conversacion.current) return; // reiniciaron la plática o cambió el ejercicio mientras leía
    if (!leida && otro) {
      pedirConfirmacionOtro(otro);
      return;
    }
    if (!leida) {
      decir({ de: 'kiko', texto: 'No encontré un ejercicio en esa foto. Prueba con UNO solo y buena luz, o escríbemelo aquí. 📸' });
      return;
    }
    // Nunca se diagnostica sin que el alumno confirme: la lectura va a la pantalla de confirmación del escáner.
    setFoto(comprimida);
    setLectura(leida);
    setPaso('lectura');
    decir({ de: 'kiko', texto: 'Ya leí tu foto. Revisa en el escáner que esté igual que en tu cuaderno y confírmalo. 🌟' });
    columnaEscaner.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Kiko contesta con el tutor de IA del backend (Claude). Si no hay internet o el servidor falla,
  // contesta aquí mismo con las pistas por reglas de siempre.
  // `contexto` sirve cuando el estado todavía no se actualiza (p. ej. justo al confirmar un ejercicio en el chat).
  const alEscribir = async (texto, contexto = { operacion, ejercicio }) => {
    // Solo los últimos mensajes: Kiko no necesita toda la plática y la petición queda chica.
    const historial = mensajes.filter((m) => m.texto && !m.pensando).slice(-12).map((m) => ({ de: m.de, texto: m.texto }));
    decir({ de: 'yo', texto });
    if (contexto.operacion && contexto.operacion === operacion && resolvioEnChat(operacion, texto)) setResuelta(true);
    // Kiko también contesta dudas sin operación escaneada ("¿qué es una fracción?").
    if (enLinea) {
      const id = ++peticion.current;
      const turno = `${VISITA}:${++contadorTurnos}`;
      decir({ de: 'kiko', texto: 'Kiko está pensando… 🤔', pensando: id });
      const sinPensando = (xs) => xs.filter((m) => m.pensando !== id);
      const mia = conversacion.current;
      // Reiniciaron la plática o confirmaron otro ejercicio mientras Kiko pensaba: esta respuesta ya no va.
      const vieja = () => {
        if (mia === conversacion.current) return false;
        setMensajes(sinPensando);
        return true;
      };
      try {
        const reg = registro.current;
        if (reg && contexto.operacion === reg.op) {
          // El servidor tiene que saber del escaneo (y de la pista que ya mostró la pantalla) antes de seguir.
          // Si el registro falló, se reintenta una vez; si vuelve a fallar, sigue con las pistas del navegador.
          if (!(await reg.ok)) reg.ok = registrar(reg.op);
          if (!(await reg.ok)) {
            if (vieja()) return;
            setMensajes(sinPensando);
            if (texto === 'Dame otra pista') pistaLocal(); else respuestaLocal(texto);
            return;
          }
        }
        const r = await api.tutor({
          operacion: contexto.operacion, ejercicio: contexto.ejercicio || undefined,
          mensaje: texto, historial, grado: gradoDe(usuario), turno, recibido: ultimoRecibido.current || undefined,
        });
        if (vieja()) return;
        ultimoRecibido.current = turno; // esta respuesta sí se muestra: el próximo mensaje lo confirma al servidor
        // El servidor dice que su ejercicio quedó resuelto: "Tu sendero" se marca como terminado y se apagan las pistas.
        if (r.resuelta && contexto.operacion && contexto.operacion === operacion) setResuelta(true);
        setMensajes((xs) => [...sinPensando(xs), { de: 'kiko', texto: r.respuesta, dibujo: r.dibujo }]);
        return;
      } catch {
        if (vieja()) return;
        setMensajes(sinPensando);
        if (!contexto.operacion) {
          decir({ de: 'kiko', texto: 'Uy, no pude escucharte bien. ¿Me lo vuelves a escribir en un momento? 🌱' });
          return;
        }
      }
    }
    respuestaLocal(texto);
  };

  const respuestaLocal = (texto) => {
    if (!operacion) {
      decir({ de: 'kiko', texto: 'Primero escanea o escribe tu operación, así sé de qué estamos platicando. 📸' });
      return;
    }
    if (resuelta) {
      // Ya la resolvió: no más pistas, pero si pide que le expliquen, se le explica (aunque no haya conexión).
      const pideExplicacion = /por ?qu[eé]|c[oó]mo|expl[ií]ca|no entiend|no le entiend/i.test(texto);
      decir({ de: 'kiko', texto: pideExplicacion ? `Claro, te explico: ${explicacionResuelta(operacion)} ¿Qué parte quieres que veamos otra vez?` : YA_RESUELTA });
      return;
    }
    const d = diagnosticarOperacion(operacion);
    if (!d.correcto && yaLoDijo(operacion, quitarNegados(texto)) && conDuda(texto)) {
      decir({ de: 'kiko', texto: '¿Cómo llegaste a ese número? Cuéntame tus pasos y lo comprobamos juntos. 🔍' });
    } else if (resolvioEnChat(operacion, texto)) {
      decir({ de: 'kiko', texto: '¡Exacto, explorador! 🌟 Ahora corrígelo en tu cuaderno y escanéalo otra vez para ver tu sendero derecho.', premio: '+ Puntos de lógica' });
    } else if (d.correcto) {
      decir({ de: 'kiko', texto: '¡Tu operación ya estaba bien! Explícame cómo lo pensaste: eso también es aprender.' });
    } else {
      decir({ de: 'kiko', texto: 'Mmm, casi. No pasa nada: equivocarse también es avanzar. ¿Quieres otra pista?' });
    }
  };

  return (
    <div className="pila-lg">
      <section className="tarjeta banda-pedagogia">
        <span className="icono-caja ic-crema chica"><I n="cerebro" tamano={18} /></span>
        <p className="cuerpo-md" style={{ margin: 0, flex: 1 }}><b>Pedagogía Guiada:</b> Kiko nunca te da la solución servida, ¡te entrena paso a paso como un verdadero explorador!</p>
        <span className="chip chip-verde"><I n="escudo" tamano={14} /> Modo Seguro Escolar</span>
      </section>
      {!enLinea && <div className="aviso-red etiqueta">Sin internet: la app sigue funcionando.</div>}
      {ctxAct && <BannerActividad aulaId={ctxAct.aula} actividad={actividad} problemaId={ctxAct.problema} />}

      <div className="escaner-layout">
        <div className="escaner-col" ref={columnaEscaner}>
          {paso === 'captura' && (
            <Captura
              onFoto={(f) => { setFoto(f); setPaso('recorte'); }}
              pendientes={pendientes}
              enLinea={enLinea}
              onLeerPendiente={leerPendiente}
              historial={estado.escaner.historial}
            />
          )}
          {paso === 'recorte' && foto && <Recorte foto={foto} onEnviar={enviar} onOtra={reiniciar} />}
          {paso === 'sinConexion' && <SinConexion cuantas={pendientes.length} onListo={reiniciar} />}
          {paso === 'leyendo' && (
            <section className="sm-card centro-col" style={{ textAlign: 'center' }} aria-live="polite">
              <DiceAjolote estado="curioso" tamano={90}>Estoy leyendo tu cuaderno con mi lupa… 🔍</DiceAjolote>
              {foto && <img className="foto-leyendo" src={foto} alt="La foto que estoy leyendo" />}
            </section>
          )}
          {paso === 'lectura' && <Lectura lectura={lectura} onConfirmar={confirmar} />}
          {paso === 'diagnostico' && operacion && <Diagnostico operacion={operacion} pista={pista} onOtra={reiniciar} resuelta={resuelta} />}
        </div>
        <div className="escaner-col" ref={columnaChat}>
          <ChatTutor
            mensajes={mensajes}
            onEnviar={alEscribir}
            onFoto={alFoto}
            onPista={otraPista}
            onEjemplo={ejemplo}
            hayOperacion={!!operacion}
            pistasActivas={!!operacion && !resuelta}
            onReiniciar={() => { conversacion.current += 1; setMensajes([SALUDO]); setEjercicio(null); reiniciar(); }}
            onConfirmarOtro={confirmarOtro}
          />
        </div>
      </div>

    </div>
  );
}
