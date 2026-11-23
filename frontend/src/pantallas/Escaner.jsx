// Escáner de cuaderno (Escaner-de-cuaderno.md): captura → recorte → lectura confirmada → diagnóstico.
// Privacidad: la foto se borra en cuanto se confirma la lectura. Solo se guarda el texto.
import { useEffect, useRef, useState } from 'react';
import { useJuego } from '../estado/store.jsx';
import { DiceAjolote } from '../componentes/Comunes.jsx';
import SendaPasos from '../componentes/SendaPasos.jsx';
import Ajolote from '../componentes/Ajolote.jsx';
import { leerArchivo, recortarYComprimir } from '../logica/imagen.js';
import { leerOperacion, pistasEscaner } from '../logica/lector.js';
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
function Captura({ onFoto, pendientes, enLinea, onLeerPendiente }) {
  const camara = useRef(null);
  const galeria = useRef(null);
  const elegir = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) onFoto(await leerArchivo(f));
  };
  return (
    <div className="pila">
      <section className="sm-card">
        <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-1)' }}>Escáner de cuaderno</h2>
        <p className="consejo">Una operación por foto, con buena luz.</p>
        <div className="visor" role="img" aria-label="Visor de la cámara">
          <i className="esq a" /><i className="esq b" /><i className="esq c" /><i className="esq d" />
          <span>Aquí va tu cuaderno</span>
        </div>
        <div className="col-3">
          <button className="sm-btn ancho" onClick={() => camara.current.click()}>Tomar foto</button>
          <button className="sm-btn sm-btn-suave ancho" onClick={() => galeria.current.click()}>Elegir de galería</button>
        </div>
        <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={elegir} />
        <input ref={galeria} type="file" accept="image/*" hidden onChange={elegir} />
      </section>

      {pendientes.length > 0 && (
        <section className="sm-card">
          <span className="sm-chip sm-chip-pista">En espera · {pendientes.length} foto{pendientes.length > 1 ? 's' : ''}</span>
          <p className="cuerpo">Tus fotos están en la mochila de Kiko.</p>
          {enLinea ? (
            <button className="sm-btn" onClick={() => onLeerPendiente(pendientes[0])}>Leer la siguiente foto</button>
          ) : (
            <p className="cierre">Cuando haya internet, leeré tus fotos.</p>
          )}
        </section>
      )}
    </div>
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
function Diagnostico({ operacion, onOtra }) {
  const diag = diagnosticar(operacion);
  const [pista, setPista] = useState(1);
  if (diag.correcto) {
    return (
      <div className="pila">
        <div className="centro"><Ajolote estado="celebrando" tamano={130} /></div>
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
  const ejemplo = pista > 3 && operacion.op === '×' ? ejemploParecido({ a: operacion.a, b: operacion.b, moneda: false }) : null;
  return (
    <div className="pila">
      <DiceAjolote estado="curioso" tamano={90}>
        ¡Casi! El sendero se torció en el paso {diag.pasoTorcido}. ¿Lo revisamos juntos?
      </DiceAjolote>
      <SendaPasos pasos={diag.pasos} pregunta={pistas[Math.min(pista, 3) - 1]} numeroPista={Math.min(pista, 3)} />
      {ejemplo && (
        <div className="sm-card borde-pista">
          <h3 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>Un ejemplo parecido</h3>
          <p className="numero-reto" style={{ margin: 0 }}>{ejemplo.suma} = {ejemplo.total}</p>
          <p className="cuerpo texto-suave">Entonces {ejemplo.a} × {ejemplo.b} = {ejemplo.total}. Usa la misma idea en tu cuaderno.</p>
        </div>
      )}
      <div className="acciones">
        {pista < 3 && <button className="sm-btn sm-btn-pista" onClick={() => setPista(pista + 1)}>? Otra pista</button>}
        {pista === 3 && operacion.op === '×' && (
          <button className="sm-btn sm-btn-pista" onClick={() => setPista(4)}>Ver ejemplo parecido</button>
        )}
        <button className="sm-btn sm-btn-suave" onClick={onOtra}>Corregí mi cuaderno: escanear otra vez</button>
      </div>
    </div>
  );
}

export default function Escaner() {
  const { estado, actualizar } = useJuego();
  const enLinea = useEnLinea();
  const [paso, setPaso] = useState('captura');
  const [foto, setFoto] = useState(null);
  const [lectura, setLectura] = useState(undefined);
  const [operacion, setOperacion] = useState(null);
  const pendientes = estado.escaner.pendientes;

  const reiniciar = () => {
    setFoto(null);
    setLectura(undefined);
    setOperacion(null);
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
    const d = diagnosticar(op);
    actualizar((s) => ({
      ...s,
      escaner: {
        ...s.escaner,
        historial: [...s.escaner.historial, { fecha: hoy(), ...op, correcto: d.correcto, pasoTorcido: d.pasoTorcido }].slice(-50),
      },
    }));
    setPaso('diagnostico');
  };

  return (
    <div className="pila">
      {!enLinea && <div className="aviso-red etiqueta">Sin internet: la app sigue funcionando.</div>}
      {paso === 'captura' && (
        <Captura
          onFoto={(f) => { setFoto(f); setPaso('recorte'); }}
          pendientes={pendientes}
          enLinea={enLinea}
          onLeerPendiente={leerPendiente}
        />
      )}
      {paso === 'recorte' && foto && <Recorte foto={foto} onEnviar={enviar} onOtra={reiniciar} />}
      {paso === 'sinConexion' && <SinConexion cuantas={pendientes.length} onListo={reiniciar} />}
      {paso === 'lectura' && <Lectura lectura={lectura} onConfirmar={confirmar} />}
      {paso === 'diagnostico' && operacion && <Diagnostico operacion={operacion} onOtra={reiniciar} />}
    </div>
  );
}
