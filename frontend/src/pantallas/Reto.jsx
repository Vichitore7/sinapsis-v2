import { useRef, useState } from 'react';
import { useJuego } from '../estado/store.jsx';
import { api } from '../api.js';
import { ir } from '../ruta.js';
import ModeloVisual from '../componentes/ModeloVisual.jsx';
import SendaPasos from '../componentes/SendaPasos.jsx';
import { DiceAjolote, MensajeCasi, MisionCumplida } from '../componentes/Comunes.jsx';
import { buscarReto, formatoNumero } from '../contenido/mundos.js';
import { MAX_PISTAS, ejemploParecido, pistasDe } from '../logica/pistas.js';
import { etapaParaReto, retoJugable, siguientePaso } from '../logica/juego.js';

function EjemploAjolote({ reto, onListo }) {
  const { a, b } = reto.ejemplo;
  return (
    <div className="pila">
      <DiceAjolote estado="feliz">
        {reto.mundo.entrada} Primero te muestro cómo se hace, con otros números.
      </DiceAjolote>
      <div className="sm-card borde-pista">
        <div className="fila-entre" style={{ marginBottom: 'var(--espacio-3)' }}>
          <h2 className="subtitulo" style={{ margin: 0 }}>Ejemplo del ajolote</h2>
          <span className="sm-chip sm-chip-pista">Tutorial</span>
        </div>
        <p className="cuerpo">El ajolote compra {a} dulces de {formatoNumero(b, reto.moneda)}. Junta {a} montones de {b} monedas:</p>
        <ModeloVisual etapa={1} a={a} b={b} moneda={reto.moneda} mostrarTotal />
        <p className="numero-reto" style={{ margin: 'var(--espacio-3) 0' }}>
          {a} × {formatoNumero(b, reto.moneda)} = <span className="texto-selva">{formatoNumero(a * b, reto.moneda)}</span>
        </p>
        <p className="cuerpo texto-suave">Juntar montones iguales es multiplicar. Ahora te toca a ti.</p>
        <button className="sm-btn ancho" onClick={onListo}>¡Ahora yo!</button>
      </div>
    </div>
  );
}

function EjemploParecido({ reto }) {
  const e = ejemploParecido(reto);
  return (
    <div className="sm-card borde-pista">
      <div className="fila-entre" style={{ marginBottom: 'var(--espacio-2)' }}>
        <h3 className="subtitulo" style={{ margin: 0 }}>Un ejemplo parecido</h3>
        <span className="sm-chip sm-chip-pista">Otros números</span>
      </div>
      <p className="cuerpo" style={{ margin: '0 0 var(--espacio-2)' }}>
        {e.a} montones de {formatoNumero(e.b, e.moneda)}:
      </p>
      <p className="numero-reto" style={{ margin: 0 }}>
        {e.suma} = {formatoNumero(e.total, e.moneda)}
      </p>
      <p className="cuerpo texto-suave" style={{ margin: 'var(--espacio-2) 0 0' }}>
        Entonces {e.a} × {formatoNumero(e.b, e.moneda)} = {formatoNumero(e.total, e.moneda)}. Usa la misma idea en tu reto.
      </p>
    </div>
  );
}

export default function Reto({ retoId }) {
  const { estado, mundos, actualizar, aplicarServidor } = useJuego();
  const reto = buscarReto(mundos, retoId);
  const inicio = useRef(Date.now());
  const [enviando, setEnviando] = useState(false);
  const [errorRed, setErrorRed] = useState(null);

  const [respuesta, setRespuesta] = useState('');
  const [fase, setFase] = useState('resolviendo'); // resolviendo | casi | cumplida
  const [pistasUsadas, setPistasUsadas] = useState(0);
  const [errores, setErrores] = useState(0);
  const [diag, setDiag] = useState(null);
  const [resultado, setResultado] = useState(null);

  if (!reto || !retoJugable(estado, reto)) {
    return (
      <div className="pila">
        <DiceAjolote estado="curioso">Este sendero todavía está cerrado. Sigue el mapa para llegar aquí.</DiceAjolote>
        <button className="sm-btn" onClick={() => ir('/mapa')}>Ir al mapa</button>
      </div>
    );
  }

  const esPrimeroDelMundo = reto.mundo.retos[0].id === reto.id;
  if (esPrimeroDelMundo && reto.ejemplo && !estado.ejemplosVistos.includes(reto.mundo.id)) {
    return (
      <EjemploAjolote
        reto={reto}
        onListo={async () => {
          actualizar((s) => ({ ...s, celebrando: false }));
          try { aplicarServidor(await api.ejemploVisto(reto.mundo.id)); } catch (e) { setErrorRed(e.message); }
        }}
      />
    );
  }

  const repaso = Boolean(estado.completados[reto.id]) && fase !== 'cumplida';
  const etapa = etapaParaReto(reto, estado.etapaApoyo);
  const pistas = pistasDe(reto);
  const indice = reto.mundo.retos.findIndex((r) => r.id === reto.id) + 1;
  const hayRespuesta = /[0-9]/.test(respuesta);

  const pedirPista = () => {
    setPistasUsadas((n) => Math.min(MAX_PISTAS + 1, n + 1));
    setFase('resolviendo');
  };

  // La respuesta se valida en el SERVIDOR: el navegador nunca conoce la respuesta correcta.
  const comprobar = async (e) => {
    e.preventDefault();
    if (!hayRespuesta || enviando) return;
    setEnviando(true);
    setErrorRed(null);
    try {
      const r = await api.intentar(reto.id, {
        respuesta: respuesta.trim().slice(0, 20),
        pistas_usadas: pistasUsadas,
        tiempo_ms: Date.now() - inicio.current,
      });
      aplicarServidor(r.estado);
      if (r.correcto) {
        actualizar((s) => ({ ...s, celebrando: true }));
        setResultado({ ...r.recompensa, respuesta: r.respuesta, explicacion: r.explicacion });
        setFase('cumplida');
      } else {
        const d = r.diagnostico;
        setErrores((n) => n + 1);
        setDiag({ pasos: d.pasos, pasoTorcido: d.paso_torcido, pregunta: d.pregunta });
        setFase('casi');
      }
    } catch (err) {
      setErrorRed(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const reintentar = () => {
    setRespuesta('');
    setFase('resolviendo');
  };

  const terminar = () => {
    actualizar((s) => ({ ...s, celebrando: false }));
    const paso = siguientePaso(estado, mundos);
    if (paso?.tipo === 'reto' && paso.mundo.id === reto.mundo.id) ir(`/reto/${paso.reto.id}`);
    else ir('/mapa');
  };

  // ---------- ¡Misión cumplida! ----------
  if (fase === 'cumplida') {
    let texto;
    if (resultado.repaso) texto = '¡Lo resolviste otra vez! Los repasos hacen más fuerte al explorador.';
    else {
      texto = errores === 0 && pistasUsadas === 0
        ? `Lo descubriste tú solo, explorador. Ganaste ${resultado.ganadas} estrellas para ${estado.nombreAjolote}.`
        : `¡Lo lograste! Pedir ayuda también es de exploradores. Ganaste ${resultado.ganadas} estrellas para ${estado.nombreAjolote}.`;
      if (resultado.bono) texto += ` Y ★ ${resultado.bono} más por el reto del día.`;
    }
    return (
      <div className="pila">
        <DiceAjolote estado="celebrando" mundosSuperados={estado.mundosTerminados.length} accesorios={estado.stickers} traje={estado.traje}>
          ¡Misión cumplida! {reto.a} × {formatoNumero(reto.b, reto.moneda)} = {formatoNumero(resultado.respuesta, reto.moneda)}
        </DiceAjolote>
        <MisionCumplida
          texto={texto}
          textoBoton={resultado.repaso ? 'Siguiente' : '★ Reclamar premio'}
          onPremio={terminar}
        />
      </div>
    );
  }

  const animo = fase === 'casi' ? 'curioso' : 'feliz';
  const pistaActual = pistasUsadas > 0 && pistasUsadas <= MAX_PISTAS ? pistas[pistasUsadas - 1] : null;
  const pistasAgotadas = pistasUsadas >= MAX_PISTAS;

  return (
    <div className="reto-layout">
     <div className="pila col-principal">
      <DiceAjolote estado={animo} tamano={88} mundosSuperados={estado.mundosTerminados.length} accesorios={estado.stickers} traje={estado.traje}>
        {fase === 'casi'
          ? 'Mmm, revisemos el sendero juntos.'
          : pistaActual
            ? pistaActual
            : repaso
              ? 'Este reto ya lo superaste. ¡Repasar también suma!'
              : 'Piensa con calma. Si lo necesitas, pide una pista.'}
      </DiceAjolote>

      <form className="sm-card" onSubmit={comprobar}>
        <div className="fila-entre" style={{ marginBottom: 'var(--espacio-3)' }}>
          <span className="sm-chip">Mundo {reto.mundo.numero} · Reto {indice}</span>
          <span className="sm-chip sm-chip-sol">{repaso ? 'Repaso' : `★ +${pistasUsadas || errores ? 2 : 3}`}</span>
        </div>
        <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>{reto.titulo}</h2>
        <p className="cuerpo" style={{ margin: '0 0 var(--espacio-3)' }}>{reto.enunciado}</p>

        {etapa < 4 && <ModeloVisual etapa={etapa} a={reto.a} b={reto.b} moneda={reto.moneda} />}
        {etapa === 4 && pistasUsadas > 0 && (
          // Sin apoyo visual: el apoyo regresa como pista.
          <ModeloVisual etapa={3} a={reto.a} b={reto.b} moneda={reto.moneda} />
        )}

        {pistaActual && fase === 'resolviendo' && (
          <div className="pista-caja">
            <span className="sm-chip sm-chip-pista">PISTA {pistasUsadas} DE {MAX_PISTAS}</span>
            <div className="sm-bubble">{pistaActual}</div>
          </div>
        )}

        <div className="operacion">
          <label className="numero-reto" htmlFor="respuesta">
            {reto.a} × {formatoNumero(reto.b, reto.moneda)} =
          </label>
          <input
            id="respuesta"
            className="sm-input"
            inputMode="numeric"
            autoComplete="off"
            placeholder="?"
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            aria-label="Tu respuesta"
            disabled={fase === 'casi'}
          />
        </div>

        {fase === 'resolviendo' && (
          <div className="acciones">
            <button className="sm-btn" type="submit" disabled={!hayRespuesta || enviando}>{enviando ? 'Revisando…' : 'Comprobar'}</button>
            {!pistasAgotadas && (
              <button className="sm-btn sm-btn-pista" type="button" onClick={pedirPista}>? Pista</button>
            )}
            {pistasAgotadas && pistasUsadas === MAX_PISTAS && (
              <button className="sm-btn sm-btn-pista" type="button" onClick={pedirPista}>Ver ejemplo parecido</button>
            )}
          </div>
        )}
        {errorRed && <p className="etiqueta texto-casi" role="alert" style={{ margin: 'var(--espacio-3) 0 0' }}>{errorRed}</p>}
      </form>
     </div>

     <div className="pila col-lateral">
      {pistasUsadas > MAX_PISTAS && <EjemploParecido reto={reto} />}

      {fase === 'casi' && diag && (
        <>
          <MensajeCasi
            paso={diag.pasoTorcido}
            onPista={pedirPista}
            onReintentar={reintentar}
            pistasAgotadas={pistasAgotadas}
          />
          <SendaPasos pasos={diag.pasos} pregunta={diag.pregunta} numeroPista={0} />
        </>
      )}

      {fase !== 'casi' && pistasUsadas <= MAX_PISTAS && (
        <div className="solo-escritorio sm-card ayuda-lateral">
          <h3 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>Tu sendero</h3>
          <p className="cuerpo texto-suave" style={{ margin: 0 }}>
            Si te equivocas, aquí verás en qué paso se torció el camino. Equivocarse también es avanzar.
          </p>
        </div>
      )}
      <button className="sm-btn sm-btn-suave" type="button" onClick={() => ir('/mapa')}>Volver al mapa</button>
     </div>
    </div>
  );
}
