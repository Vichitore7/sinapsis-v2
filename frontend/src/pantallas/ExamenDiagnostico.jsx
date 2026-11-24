// Examen diagnóstico de entrada: arranca SOLO la primera vez que entra un alumno (sin tarjeta que lo sugiera).
// Una pregunta por habilidad. "No sé todavía" es válido y no se castiga. Las respuestas se califican en el servidor.
import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useJuego } from '../estado/store.jsx';
import Ajolote from '../componentes/Ajolote.jsx';
import I from '../componentes/IconosUI.jsx';
import LogroBienvenida, { borrarBienvenida, leerBienvenida } from '../componentes/LogroBienvenida.jsx';
import { ir } from '../ruta.js';

export default function ExamenDiagnostico() {
  const { usuario, estado, aplicarServidor } = useJuego();
  const [bienvenida, setBienvenida] = useState(null);
  const [preguntas, setPreguntas] = useState(null);
  const [grado, setGrado] = useState(null);
  const [i, setI] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const entrada = useRef(null);

  useEffect(() => {
    api.diagnostico()
      .then((r) => { setGrado(r.grado || null); if (r.hecho) setResultado(r); else setPreguntas(r.preguntas); })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => { entrada.current?.focus(); }, [i, preguntas]);

  const avanzar = async (valor) => {
    const p = preguntas[i];
    const todas = { ...respuestas, [p.id]: valor };
    setRespuestas(todas);
    setTexto('');
    if (i + 1 < preguntas.length) {
      setI(i + 1);
      return;
    }
    try {
      setResultado(await api.responderDiagnostico(todas));
    } catch (e) {
      setError(e.message);
    }
  };

  const cargarSelva = async () => {
    try { aplicarServidor(await api.estado()); } catch (e) { setError(e.message); }
  };

  // Al terminar: si la cuenta es nueva, primero la notificación del logro de bienvenida.
  const entrar = () => {
    const pendiente = leerBienvenida(usuario.id);
    if (pendiente) setBienvenida(pendiente);
    else cargarSelva();
  };

  const salirDeBienvenida = (ruta) => {
    borrarBienvenida(usuario.id);
    ir(ruta);
    cargarSelva();
  };

  if (error) {
    return (
      <div className="examen"><div className="tarjeta tarjeta-entrada"><div className="aviso-casi">{error}</div></div></div>
    );
  }

  if (bienvenida) {
    return (
      <div className="examen">
        <div className="tarjeta-entrada">
          <LogroBienvenida bienvenida={bienvenida}
            onInicio={() => salirDeBienvenida('/')} onStickers={() => salirDeBienvenida('/perfil/stickers')} />
        </div>
      </div>
    );
  }

  if (resultado) {
    const logradas = resultado.habilidades.filter((h) => h.logrado);
    const reforzar = resultado.habilidades.filter((h) => !h.logrado);
    return (
      <div className="examen">
        <section className="tarjeta tarjeta-entrada pila-md">
          <div className="examen-kiko">
            <span className="kiko-cabeza chica"><Ajolote estado="celebrando" tamano={96} cabeza /></span>
            <div className="hero-globo">
              <p className="t-md" style={{ margin: 0 }}>¡Listo, {estado.apodo}! Ya sé por dónde empezar contigo.</p>
              <p className="cuerpo-md texto-suave" style={{ margin: '4px 0 0' }}>Esto no es una calificación: solo me ayuda a acompañarte mejor.</p>
            </div>
          </div>
          {logradas.length > 0 && (
            <div>
              <span className="sobre verde"><I n="checkCirculo" tamano={14} /> Ya lo dominas</span>
              <div className="chips" style={{ marginTop: 8 }}>{logradas.map((h) => <span key={h.habilidad} className="chip chip-verde">{h.nombre}</span>)}</div>
            </div>
          )}
          {reforzar.length > 0 && (
            <div>
              <span className="sobre"><I n="foco" tamano={14} /> Lo vamos a practicar juntos</span>
              <div className="chips" style={{ marginTop: 8 }}>{reforzar.map((h) => <span key={h.habilidad} className="chip">{h.nombre}</span>)}</div>
            </div>
          )}
          <button className="btn btn-naranja btn-grande" onClick={entrar}>Entrar a la selva <I n="flecha" /></button>
        </section>
      </div>
    );
  }

  if (!preguntas) return <div className="examen"><p className="cuerpo-md texto-suave">Preparando tu diagnóstico…</p></div>;

  const p = preguntas[i];
  return (
    <div className="examen">
      <section className="tarjeta tarjeta-entrada pila-md">
        <div className="fila-entre">
          <span className="sobre"><I n="diana" tamano={14} /> Diagnóstico de entrada{grado ? ` · ${grado}` : ''}</span>
          <span className="etq texto-suave">Pregunta {i + 1} de {preguntas.length}</span>
        </div>
        <div className="barra-prog naranja"><span style={{ width: `${(i / preguntas.length) * 100}%` }} /></div>
        <div className="examen-kiko">
          <span className="kiko-cabeza chica"><Ajolote estado="curioso" tamano={96} cabeza /></span>
          <div className="hero-globo">
            {i === 0 && <p className="cuerpo-md texto-suave" style={{ margin: '0 0 6px' }}>¡Hola, {estado.apodo}! Antes de explorar, quiero conocerte. Si no sabes una, no pasa nada.</p>}
            <span className="chip">{p.nombre}</span>
            <p className="t-lg" style={{ margin: '8px 0 0' }}>{p.enunciado}</p>
          </div>
        </div>
        <form className="examen-respuesta" onSubmit={(e) => { e.preventDefault(); if (texto.trim()) avanzar(texto.trim()); }}>
          <input ref={entrada} className="entrada entrada-respuesta" value={texto} onChange={(e) => setTexto(e.target.value)}
            maxLength={20} aria-label="Tu respuesta" placeholder="Tu respuesta" autoComplete="off" />
          <button className="btn btn-naranja btn-grande" disabled={!texto.trim()}>Siguiente <I n="flecha" /></button>
        </form>
        <button className="btn btn-crema" onClick={() => avanzar(null)}>No sé todavía</button>
      </section>
    </div>
  );
}
