// Escáner de cuaderno (Escaner-de-cuaderno.md): captura → recorte → lectura confirmada → diagnóstico.
// Privacidad: la foto se borra en cuanto se confirma la lectura. Solo se guarda el texto.
import { useEffect, useRef, useState } from 'react';
import I from '../componentes/IconosUI.jsx';
import { useJuego } from '../estado/store.jsx';
import { DiceAjolote } from '../componentes/Comunes.jsx';
import SendaPasos from '../componentes/SendaPasos.jsx';
import Ajolote from '../componentes/Ajolote.jsx';
import { leerArchivo, recortarYComprimir } from '../logica/imagen.js';
import { leerOperacion, pistasEscaner, responderFoto } from '../logica/lector.js';
import { diagnosticar } from '../logica/diagnostico.js';
import { ejemploParecido } from '../logica/pistas.js';
import { hoy } from '../logica/juego.js';

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
function Lectura({ lectura, onConfirmar }) {
  const sinLectura = lectura === null;
  const [editando, setEditando] = useState(sinLectura);
  const [op, setOp] = useState(lectura || { a: '', op: '×', b: '', c: '' });
  const completo = ['a', 'b', 'c'].every((k) => /^\d+$/.test(String(op[k]).trim()));

  return (
    <section className="sm-card">
      <span className={`sm-chip${editando ? ' sm-chip-pista' : ''}`} style={{ marginBottom: 'var(--espacio-2)' }}>
        {editando ? 'Corregir' : 'Confirmar'}
      </span>
      <DiceAjolote estado={sinLectura && editando ? 'curioso' : 'feliz'} tamano={90}>
        {sinLectura && editando
          ? 'Todavía estoy aprendiendo a leer letra a mano. Escríbelo como está en tu cuaderno.'
          : editando
            ? 'Cámbialo como está en tu cuaderno.'
            : 'Leí esto en tu cuaderno. ¿Está bien?'}
      </DiceAjolote>

      <div className="hoja">
        {editando ? (
          <div className="num">
            <input className="campo" inputMode="numeric" value={op.a} onChange={(e) => setOp({ ...op, a: e.target.value })} aria-label="Primer número" />
            <select className="campo campo-op" value={op.op} onChange={(e) => setOp({ ...op, op: e.target.value })} aria-label="Operación">
              <option value="×">×</option><option value="+">+</option><option value="−">−</option>
            </select>
            <input className="campo" inputMode="numeric" value={op.b} onChange={(e) => setOp({ ...op, b: e.target.value })} aria-label="Segundo número" />
            <span>=</span>
            <input className="campo" inputMode="numeric" value={op.c} onChange={(e) => setOp({ ...op, c: e.target.value })} aria-label="Tu resultado" />
          </div>
        ) : (
          <div className="num"><span>{op.a}</span><span>{op.op}</span><span>{op.b}</span><span>=</span><span>{op.c}</span></div>
        )}
      </div>

      <div className="acciones">
        {editando ? (
          <button className="sm-btn" disabled={!completo} onClick={() => setEditando(false)}>Listo</button>
        ) : (
          <>
            <button className="sm-btn" onClick={() => onConfirmar({ a: +op.a, op: op.op, b: +op.b, c: +op.c })}>¡Así es!</button>
            <button className="sm-btn sm-btn-suave" onClick={() => setEditando(true)}>Corregir</button>
          </>
        )}
      </div>
      <p className="nota">Después de leerla, borro la foto. Solo guardo lo que escribiste.</p>
    </section>
  );
}

// ---------- 4. Diagnóstico ----------
function Diagnostico({ operacion, pista, onOtra }) {
  const diag = diagnosticar(operacion);
  if (diag.correcto) {
    return (
      <div className="pila">
        <div className="centro"><Ajolote estado="celebrando" tamano={110} /></div>
        <SendaPasos pasos={diag.pasos} numeroPista={0} />
        <div className="sm-acierto">
          <h2 className="titulo" style={{ margin: '0 0 var(--espacio-2)' }}>✓ ¡Tu sendero va derecho!</h2>
          <p className="cuerpo" style={{ margin: '0 0 var(--espacio-3)' }}>Cada paso está bien, explorador.</p>
          <button className="sm-btn" onClick={onOtra}>Escanear otro ejercicio</button>
        </div>
      </div>
    );
  }
  const pistas = pistasEscaner(operacion, diag);
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

function resultadoDe({ a, op, b }) {
  if (op === '×') return a * b;
  if (op === '+') return a + b;
  return a - b;
}

function ChatTutor({ mensajes, onEnviar, onFoto, onPista, onEjemplo, hayOperacion, onReiniciar }) {
  const [texto, setTexto] = useState('');
  const fin = useRef(null);
  const camara = useRef(null);
  const galeria = useRef(null);
  const elegirFoto = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) onFoto(f);
  };
  useEffect(() => { fin.current?.scrollIntoView({ block: 'nearest' }); }, [mensajes.length]);
  const enviar = (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
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
        <button className="boton-redondo translucido" onClick={onReiniciar} aria-label="Reiniciar conversación"><I n="recargar" /></button>
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
        <button className="chip-sug" onClick={onPista} disabled={!hayOperacion}>💡 Dame otra pista</button>
        <button className="chip-sug" onClick={onEjemplo} disabled={!hayOperacion}>🧩 Dibújalo con bloques</button>
      </div>
      <form className="chat-entrada" onSubmit={enviar}>
        <button type="button" className="boton-redondo" onClick={() => camara.current.click()} aria-label="Tomar foto para Kiko"><I n="camara" /></button>
        <button type="button" className="boton-redondo" onClick={() => galeria.current.click()} aria-label="Subir imagen para Kiko"><I n="galeria" /></button>
        <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={elegirFoto} />
        <input ref={galeria} type="file" accept="image/*" hidden onChange={elegirFoto} />
        <input className="entrada" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe tu deducción a Kiko…" aria-label="Mensaje para Kiko" maxLength={200} />
        <button className="btn btn-naranja btn-cuadrado" aria-label="Enviar"><I n="enviar" /></button>
      </form>
    </section>
  );
}

export default function Escaner() {
  const { estado, actualizar } = useJuego();
  const enLinea = useEnLinea();
  const [paso, setPaso] = useState('captura');
  const [foto, setFoto] = useState(null);
  const [lectura, setLectura] = useState(undefined);
  const [operacion, setOperacion] = useState(null);
  const [pista, setPista] = useState(1);
  const [mensajes, setMensajes] = useState([SALUDO]);
  const pendientes = estado.escaner.pendientes;
  const decir = (...ms) => setMensajes((xs) => [...xs, ...ms]);

  const reiniciar = () => {
    setFoto(null);
    setLectura(undefined);
    setOperacion(null);
    setPista(1);
    setPaso('captura');
  };

  const leer = async (fotoComprimida) => {
    setFoto(fotoComprimida);
    setLectura(await leerOperacion(fotoComprimida));
    setPaso('lectura');
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
    setOperacion(op);
    setPista(1);
    const d = diagnosticar(op);
    actualizar((s) => ({
      ...s,
      escaner: {
        ...s.escaner,
        historial: [...s.escaner.historial, { fecha: hoy(), ...op, correcto: d.correcto, pasoTorcido: d.pasoTorcido }].slice(-50),
      },
    }));
    const opTexto = `${op.a} ${op.op} ${op.b} = ${op.c}`;
    if (d.correcto) {
      decir({ de: 'kiko', op: opTexto, texto: '¡Tu sendero va derecho! Revisé cada paso y todos están bien. ¿Escaneamos otro?', premio: '¡Bien pensado!' });
    } else {
      decir({ de: 'kiko', op: opTexto, texto: `He mirado con mi lupa la operación que escaneaste. El sendero se torció en el paso ${d.pasoTorcido}. No te voy a dar la respuesta: ${pistasEscaner(op, d)[0]}` });
    }
    setPaso('diagnostico');
  };

  const otraPista = () => {
    if (!operacion) return;
    const d = diagnosticar(operacion);
    if (d.correcto) { decir({ de: 'kiko', texto: '¡Ya lo tienes bien! Si quieres, escanea otro ejercicio.' }); return; }
    const pistas = pistasEscaner(operacion, d);
    if (pista >= pistas.length) {
      decir({ de: 'kiko', texto: 'Ya te di mis 3 pistas. Prueba “Dibújalo con bloques” para ver un ejemplo parecido.' });
      return;
    }
    decir({ de: 'kiko', texto: `Pista ${pista + 1} de 3: ${pistas[pista]}` });
    setPista(pista + 1);
  };

  const ejemplo = () => {
    if (!operacion) return;
    if (operacion.op !== '×') {
      decir({ de: 'kiko', texto: `Dibuja ${operacion.a} bloques y luego ${operacion.op === '+' ? 'agrega' : 'quita'} ${operacion.b}. Cuenta los que quedan, uno por uno.` });
      return;
    }
    const e = ejemploParecido({ a: operacion.a, b: operacion.b, moneda: false });
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
    decir({ de: 'kiko', texto: await responderFoto(comprimida) });
  };

  const alEscribir = (texto) => {
    decir({ de: 'yo', texto });
    if (!operacion) {
      decir({ de: 'kiko', texto: 'Primero escanea o escribe tu operación, así sé de qué estamos platicando. 📸' });
      return;
    }
    const d = diagnosticar(operacion);
    const numeros = (texto.match(/\d+/g) || []).map(Number);
    if (numeros.includes(resultadoDe(operacion)) && !d.correcto) {
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

      <div className="escaner-layout">
        <div className="escaner-col">
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
          {paso === 'lectura' && <Lectura lectura={lectura} onConfirmar={confirmar} />}
          {paso === 'diagnostico' && operacion && <Diagnostico operacion={operacion} pista={pista} onOtra={reiniciar} />}
        </div>
        <div className="escaner-col">
          <ChatTutor
            mensajes={mensajes}
            onEnviar={alEscribir}
            onFoto={alFoto}
            onPista={otraPista}
            onEjemplo={ejemplo}
            hayOperacion={!!operacion}
            onReiniciar={() => { setMensajes([SALUDO]); reiniciar(); }}
          />
        </div>
      </div>

    </div>
  );
}
