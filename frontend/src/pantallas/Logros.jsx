// Secciones de "Usuario" (Perfil del alumno): logros, medallas, stickers y diplomas.
import { useState } from 'react';
import { api } from '../api.js';
import { useJuego } from '../estado/store.jsx';
import I from '../componentes/IconosUI.jsx';
import Ajolote from '../componentes/Ajolote.jsx';
import { STICKERS, TRAJES } from '../contenido/mundos.js';

const ARTE = {
  flor: { icono: 'chispa', fondo: 'sticker-rosa' },
  mochila: { icono: 'mochila', fondo: 'sticker-ambar' },
  bufanda: { icono: 'chispa', fondo: 'sticker-cielo' },
  sombrero: { icono: 'sombrero', fondo: 'sticker-oro' },
};
const ICONO_LOGRO = ['estrella', 'logros', 'foco', 'corazon', 'huella', 'gema'];

function fechaLarga(d = new Date()) {
  return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase());
}

export function SeccionLogros({ estado }) {
  const lista = estado.logros || [];
  const hechos = lista.filter((l) => l.hecho).length;
  return (
    <section className="tarjeta">
      <div className="fila-entre" style={{ marginBottom: 12 }}>
        <div>
          <h2 className="t-md" style={{ margin: 0 }}><I n="diana" tamano={20} className="texto-naranja" /> Logros</h2>
          <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>Se cumplen solos mientras juegas y estudias.</p>
        </div>
        <span className="chip chip-verde">{hechos} / {lista.length}</span>
      </div>
      <ul className="misiones rejilla-2 apretada">
        {lista.map((l, i) => (
          <li key={l.id} className={`mision${l.hecho ? ' hecha' : ''}`}>
            <span className="mision-check">{l.hecho ? <I n="check" tamano={18} grosor={3} /> : null}</span>
            <div style={{ flex: 1 }}>
              <b className="t-sm">{l.nombre}</b>
              <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>{l.detalle}</p>
            </div>
            <span className="mision-icono"><I n={ICONO_LOGRO[i % ICONO_LOGRO.length]} tamano={16} /></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Medallas: hitos de nivel, racha y mundos superados (se calculan con el estado del servidor). */
function medallas(estado, mundos) {
  const terminados = estado.mundosTerminados || [];
  const lista = [
    { id: 'diag', nombre: 'Explorador valiente', detalle: 'Hiciste tu diagnóstico de entrada', icono: 'diana', ok: !!estado.diagnosticoHecho },
    { id: 'n2', nombre: 'Nivel 2', detalle: 'Sube a nivel 2', icono: 'estrella', ok: estado.nivel >= 2 },
    { id: 'n5', nombre: 'Nivel 5', detalle: 'Sube a nivel 5', icono: 'estrella', ok: estado.nivel >= 5 },
    { id: 'r3', nombre: 'Racha de 3 días', detalle: 'Practica 3 días seguidos', icono: 'fuego', ok: estado.rachaDias >= 3 },
    { id: 'r7', nombre: 'Racha de 7 días', detalle: 'Practica una semana seguida', icono: 'fuego', ok: estado.rachaDias >= 7 },
  ];
  mundos.filter((m) => !m.proximamente && m.retos.length).forEach((m) => {
    lista.push({ id: m.id, nombre: `Medalla de ${m.nombre}`, detalle: `Supera el mundo ${m.numero}`, icono: 'logros', ok: terminados.includes(m.id) });
  });
  return lista;
}

export function SeccionMedallas({ estado, mundos }) {
  const lista = medallas(estado, mundos);
  const ganadas = lista.filter((m) => m.ok).length;
  return (
    <section className="tarjeta">
      <div className="fila-entre" style={{ marginBottom: 12 }}>
        <h2 className="t-md" style={{ margin: 0 }}><I n="logros" tamano={20} className="texto-naranja" /> Medallas</h2>
        <span className="chip">{ganadas} / {lista.length}</span>
      </div>
      <div className="medallas">
        {lista.map((m) => (
          <div key={m.id} className={`medalla${m.ok ? '' : ' falta'}`}>
            <span className="medalla-disco"><I n={m.ok ? m.icono : 'candado'} tamano={26} /></span>
            <b className="t-sm">{m.nombre}</b>
            <small className="cuerpo-sm texto-suave">{m.detalle}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Stickers especiales (temáticos): se ven y se le ponen a Kiko aquí, en el Perfil.
 * Los stickers normales de los mundos se equipan en la Mochila.
 */
function StickersEspeciales() {
  const { estado, aplicarServidor } = useJuego();
  const [guardando, setGuardando] = useState(null);
  const [error, setError] = useState(null);
  const kiko = estado.nombreAjolote;
  const especiales = estado.trajes.filter((id) => TRAJES[id]).map((id) => ({ id, ...TRAJES[id] }));
  if (!especiales.length) return null;
  const puesto = estado.traje ? TRAJES[estado.traje] : null;

  const ponerse = async (traje) => {
    setGuardando(traje ?? 'quitar');
    setError(null);
    try {
      aplicarServidor(await api.vestir(traje));
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="especiales">
      <div className="fila-entre" style={{ marginBottom: 12 }}>
        <div>
          <h3 className="t-md" style={{ margin: 0 }}><I n="chispa" tamano={18} className="texto-naranja" /> Stickers especiales</h3>
          <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>Trajes típicos de las trajineras de Xochimilco. Toca uno para vestir a {kiko}.</p>
        </div>
        <span className="pastilla">{especiales.length} especiales</span>
      </div>
      <div className="especiales-cuerpo">
        <div className="vestir-vista">
          <span className="sobre">Así se ve {kiko}</span>
          <Ajolote estado="feliz" tamano={170} traje={estado.traje} etiqueta={`${kiko}${puesto ? ` con ${puesto.nombre.toLowerCase()}` : ''}`} />
          <b className="t-sm">{puesto ? puesto.nombre : 'Sin traje especial'}</b>
          {puesto && (
            <button className="btn btn-crema btn-chico" disabled={guardando !== null} onClick={() => ponerse(null)}>
              {guardando === 'quitar' ? 'Quitando…' : 'Quitar traje'}
            </button>
          )}
        </div>
        <div className="trajes">
          {especiales.map((t) => {
            const activo = estado.traje === t.id;
            return (
              <div key={t.id} className={`traje-carta${activo ? ' activo' : ''}`}>
                <span className="chip chip-oro">{t.origen}</span>
                <span className="traje-arte"><Ajolote estado="feliz" tamano={92} traje={t.id} etiqueta={t.nombre} /></span>
                <b className="t-sm">{t.nombre}</b>
                <small className="cuerpo-sm texto-suave">{t.detalle}</small>
                <button className={`btn btn-chico ${activo ? 'btn-verde' : 'btn-naranja'}`} aria-pressed={activo}
                  disabled={guardando !== null || activo} onClick={() => ponerse(t.id)}>
                  {guardando === t.id ? 'Vistiendo…' : activo ? <><I n="check" tamano={14} grosor={3} /> Puesto</> : `Ponérselo a ${kiko}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {error && <p className="etq texto-casi" role="alert" style={{ margin: '8px 0 0' }}>{error}</p>}
    </div>
  );
}

export function SeccionStickers({ estado, mundos }) {
  const jugables = mundos.filter((m) => !m.proximamente && m.retos.length);
  const stickers = Object.entries(STICKERS).map(([id, s], i) => ({ id, ...s, mundo: jugables[i] || null }));
  return (
    <section className="tarjeta pila-lg">
      <StickersEspeciales />
      <div>
      <div className="fila-entre" style={{ marginBottom: 12 }}>
        <div>
          <h2 className="t-md" style={{ margin: 0 }}><I n="libro" tamano={20} className="texto-naranja" /> Álbum de Stickers</h2>
          <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>Abre el cofre al final de cada mundo para ganar uno.</p>
        </div>
        <span className="pastilla">{estado.stickers.length} de {stickers.length}</span>
      </div>
      <div className="album-stitch">
        {stickers.map((s) => {
          const tiene = estado.stickers.includes(s.id);
          const arte = ARTE[s.id] || { icono: 'estrella', fondo: 'sticker-rosa' };
          return (
            <div key={s.id} className={`sticker-carta${tiene ? '' : ' falta'}`}>
              <span className={`sticker-arte ${tiene ? arte.fondo : ''}`}><I n={tiene ? arte.icono : 'candado'} tamano={34} /></span>
              <b>{tiene ? s.nombre : '¿Secreto?'}</b>
              <small className={tiene ? 'texto-selva' : ''}>{s.mundo ? `Mundo ${s.mundo.numero}` : 'Pronto'}</small>
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
}

export function SeccionDiplomas({ estado, mundos }) {
  const terminados = estado.mundosTerminados || [];
  const ultimo = mundos.find((m) => m.id === terminados[terminados.length - 1]);
  return (
    <section className="tarjeta tarjeta-grande">
      <div className="fila-entre" style={{ alignItems: 'flex-start' }}>
        <div>
          <span className="sobre">Constancias de explorador</span>
          <h2 className="t-lg" style={{ margin: '4px 0 0' }}>Diplomas</h2>
        </div>
        <span className="chip"><I n="checkCirculo" tamano={14} /> {terminados.length} listo{terminados.length === 1 ? '' : 's'}</span>
      </div>
      <div className="diplomas">
        <div className={`diploma${ultimo ? '' : ' borrador'}`} id="diploma-imprimible">
          <span className="diploma-deco" aria-hidden="true" />
          <div className="fila-entre">
            <span className="diploma-marca"><span className="diploma-sm">SM</span> Selva Matemática</span>
            <span className="chip chip-oro">{ultimo ? `Mundo ${ultimo.numero} superado` : 'En camino'}</span>
          </div>
          <p className="diploma-titulo">Certificado de explorador de honor</p>
          <p className="diploma-nombre">{estado.apodo}</p>
          <p className="cuerpo-md texto-suave">
            {ultimo
              ? `Ha demostrado dominio en ${ultimo.nombre} (${ultimo.concepto?.toLowerCase() || 'retos de la selva'}) y resolución autónoma con entusiasmo.`
              : 'Al superar tu primer mundo aparecerá aquí tu constancia de explorador.'}
          </p>
          <div className="diploma-pie">
            <div><small>Fecha de expedición</small><b>{fechaLarga()}</b></div>
            <div className="diploma-firma">
              <Ajolote estado="feliz" tamano={44} cabeza />
              <div><b>{estado.nombreAjolote} el Ajolote</b><small><i>Tutor mentor</i></small></div>
            </div>
          </div>
        </div>
        <div className="diploma-acciones">
          <h3 className="t-md" style={{ margin: 0 }}>Lleva tu logro a casa o al aula</h3>
          <p className="cuerpo-md texto-suave">Imprímela en tamaño carta o guárdala como PDF desde la ventana de impresión.</p>
          <button className="btn btn-naranja ancho" disabled={!ultimo} onClick={() => window.print()}><I n="descargar" /> Guardar como PDF</button>
          <button className="btn btn-crema ancho" disabled={!ultimo} onClick={() => window.print()}><I n="imprimir" /> Imprimir constancia</button>
          <p className="cuerpo-sm texto-suave"><I n="escudo" tamano={14} className="texto-selva" /> Solo lleva tu apodo, nunca tu nombre real. Sin valor curricular.</p>
        </div>
      </div>
    </section>
  );
}
