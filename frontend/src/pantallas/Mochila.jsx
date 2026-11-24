import { useState } from 'react';
import { useJuego } from '../estado/store.jsx';
import Ajolote from '../componentes/Ajolote.jsx';
import I from '../componentes/IconosUI.jsx';
import { Medidor, Proximamente } from '../componentes/Comunes.jsx';
import { api } from '../api.js';
import { VALORES, estadoAjolote, loQuePide } from '../logica/juego.js';
import { STICKERS } from '../contenido/mundos.js';

const MEDIDORES = [
  { id: 'comida', nombre: 'Comida & Nutrición', detalle: 'Lombrices y algas energéticas', icono: 'cuchara' },
  { id: 'pecera', nombre: 'Pecera de Cristal', detalle: 'Agua limpia y cristalina', icono: 'gota' },
  { id: 'alegria', nombre: 'Alegría & Motivación', detalle: 'Le encanta resolver retos contigo', icono: 'corazon' },
];

const BOTONES = [
  { id: 'alimentar', texto: 'Alimentar', sub: 'Nutre a tu ajolote', icono: 'cuchara', gracias: '¡Ñam! Una lombriz deliciosa.' },
  { id: 'jugar', texto: 'Jugar', sub: 'Nada en círculos contigo', icono: 'control', gracias: '¡Qué divertido! Tu ajolote nada en círculos.' },
  { id: 'limpiar', texto: 'Limpiar Pecera', sub: 'Mantenimiento', icono: 'escoba', gracias: '¡Pecera limpiecita!' },
  { id: 'descansar', texto: 'Tomar Siesta', sub: 'Recuperar energía', icono: 'cama', gracias: 'Tu ajolote se fue a dormir. Hasta la próxima aventura.' },
];

const REGLAS = [
  ['Acertar a la primera', 'Recompensa instantánea: ★ 3 estrellas'],
  ['Acertar tras pedir pistas', 'Recompensa: ★ 2 estrellas. ¡Pedir ayuda nunca se castiga!'],
  ['Reto del día', 'Completar la misión: ★ 5 de bono extra'],
  ['Cofre del fin de mundo', 'Gran victoria: ★ 10 + 1 sticker exclusivo'],
];

const ARMARIO = {
  mochila: { icono: 'mochila', efecto: 'Mundo 1: La tiendita' },
  bufanda: { icono: 'chispa', efecto: 'Mundo 2: El mercado' },
  sombrero: { icono: 'sombrero', efecto: 'Mundo 3: El río' },
};

function RenombrarAjolote() {
  const { estado, aplicarServidor } = useJuego();
  const [nombre, setNombre] = useState(estado.nombreAjolote);
  const cambio = nombre.trim() && nombre.trim() !== estado.nombreAjolote;
  return (
    <form className="renombrar" onSubmit={async (e) => { e.preventDefault(); aplicarServidor(await api.renombrarMascota(nombre.trim())); }}>
      <input className="entrada entrada-chica" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={20} aria-label="Nombre de tu ajolote" />
      <button className="btn btn-crema btn-chico" disabled={!cambio}>Cambiar nombre</button>
    </form>
  );
}

export default function Mochila() {
  const { estado, aplicarServidor, actualizar } = useJuego();
  const [mensaje, setMensaje] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const pide = loQuePide(estado.bienestar);
  const animo = estadoAjolote(estado);
  const kiko = estado.nombreAjolote;
  const b = estado.bienestar;
  const felicidad = Math.round(((b.comida + b.pecera + b.alegria) / 15) * 100);
  const energia = estado.dormido ? 1 : 5;
  const estadoTexto = estado.dormido ? 'Dormido' : felicidad >= 80 ? 'Radiante' : felicidad >= 50 ? 'Contento' : 'Te necesita';

  const accion = async (bt) => {
    setOcupado(true);
    try {
      aplicarServidor(await api.cuidar(bt.id));
      actualizar((s) => ({ ...s, celebrando: false }));
      setMensaje(bt.gracias);
    } catch (e) {
      setMensaje(e.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="pila-lg">
      <section className="tarjeta cabecera-pantalla">
        <span className="icono-caja ic-naranja-fuerte grande"><I n="mochila" tamano={28} /><span className="badge-num">{estado.stickers.length}</span></span>
        <div style={{ flex: 1 }}>
          <h1 className="t-lg" style={{ margin: 0 }}>Mochila de Expedición & Santuario <span className="chip">{kiko} Nvl. {estado.nivel}</span></h1>
          <p className="cuerpo-md texto-suave" style={{ margin: '2px 0 0' }}>¡Cuida a tu ajolote matemático, equípalo con los stickers que ganas y revisa cómo ganar estrellas!</p>
        </div>
        <div className="tarjeta-suave mini-stat">
          <span className="sobre gris">Estrellas disponibles</span>
          <b className="t-lg"><I n="estrella" tamano={22} relleno className="texto-selva" /> {estado.estrellas}</b>
        </div>
      </section>

      <div className="grid-12">
        <div className="col-7 pila-lg">
          <section className="tarjeta">
            <div className="fila-entre" style={{ marginBottom: 12 }}>
              <h2 className="t-md" style={{ margin: 0 }}><I n="pulso" tamano={22} className="texto-naranja" /> Bienestar de {kiko}</h2>
              <span className={`chip ${felicidad >= 50 ? 'chip-verde' : 'chip-ambar'}`}><span className="punto" /> Estado: {estadoTexto}</span>
            </div>
            <div className="pila-sm">
              {MEDIDORES.map((m) => {
                const v = b[m.id];
                return (
                  <div key={m.id} className={`fila-bienestar${v <= 2 ? ' pide' : ''}`}>
                    <span className="icono-caja ic-blanco"><I n={m.icono} /></span>
                    <div style={{ flex: 1 }}>
                      <b className="t-sm">{m.nombre}{v <= 2 && <span className="texto-casi"> · Pide</span>}</b>
                      <small className="cuerpo-sm texto-suave">{m.detalle}</small>
                    </div>
                    <Medidor valor={v} etiqueta={`${m.nombre}: ${v} de 5`} />
                  </div>
                );
              })}
              <div className="fila-bienestar">
                <span className="icono-caja ic-blanco"><I n="rayo" /></span>
                <div style={{ flex: 1 }}>
                  <b className="t-sm">Nivel de Energía</b>
                  <small className="cuerpo-sm texto-suave">{estado.dormido ? 'Está tomando una siesta' : 'Listo para más misiones'}</small>
                </div>
                <Medidor valor={energia} etiqueta={`Energía: ${energia} de 5`} />
              </div>
            </div>

            <div className="acciones-cuidado">
              {BOTONES.map((bt) => {
                const costo = VALORES.costos[bt.id];
                const faltan = Math.max(0, costo - estado.estrellas);
                const gratis = costo === 0;
                return (
                  <button key={bt.id} className={`boton-cuidado${gratis ? ' gratis' : ''}`} onClick={() => accion(bt)} disabled={faltan > 0 || ocupado}>
                    <I n={bt.icono} tamano={22} />
                    <span className="bc-texto"><b>{bt.texto}</b><small>{faltan > 0 ? `Te faltan ${faltan} ★` : bt.sub}</small></span>
                    <span className="bc-costo">{gratis ? 'Gratis' : <><I n="estrella" tamano={13} relleno /> -{costo}</>}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="tarjeta">
            <div className="fila-entre" style={{ marginBottom: 12 }}>
              <h2 className="t-md" style={{ margin: 0 }}><span className="icono-caja ic-crema chica"><I n="estrella" tamano={16} /></span> ¿Cómo se ganan estrellas?</h2>
              <span className="sobre">Reglas claras</span>
            </div>
            <div className="rejilla-2 apretada">
              {REGLAS.map(([t, d], i) => (
                <div key={t} className="regla">
                  <span className="regla-num">{i + 1}°</span>
                  <div><b className="t-sm">{t}</b><p className="cuerpo-sm texto-suave" style={{ margin: '2px 0 0' }}>{d}</p></div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-5 pila-lg">
          <section className="tarjeta-suave habitat">
            <div className="fila-entre">
              <span className="pastilla blanca"><I n="gota" tamano={14} /> Hábitat de Xochimilco</span>
              <span className="boton-redondo blanco"><I n="corazon" tamano={18} relleno className="c-corazon" /></span>
            </div>
            <div className="globo-habitat" role="status">
              {mensaje || (pide && animo !== 'dormido'
                ? `«¡${pide === 'comida' ? 'Tengo hambre' : pide === 'pecera' ? 'Mi pecera está sucia' : 'Quiero jugar'}!»`
                : animo === 'dormido' ? '«Zzz… despiértame para seguir»' : '«¡Hola! ¿Practicamos multiplicación hoy?»')}
            </div>
            <div className="habitat-ajolote">
              <Ajolote estado={animo} tamano={190} mundosSuperados={estado.mundosTerminados.length} accesorios={estado.stickers} traje={estado.traje} />
            </div>
            <span className="pastilla blanca centro-self"><I n="checkCirculo" tamano={16} className="texto-selva" /> Estado: {estadoTexto} ({felicidad}%)</span>
            <div className="fila-entre" style={{ marginTop: 12 }}>
              <span className="cuerpo-sm texto-suave">Cambia el nombre de tu ajolote:</span>
            </div>
            <RenombrarAjolote />
          </section>

          <section className="tarjeta">
            <div className="fila-entre">
              <h2 className="t-md" style={{ margin: 0 }}><span className="icono-caja ic-verde chica"><I n="cubo" tamano={16} /></span> Laboratorio 3D de Bolsillo</h2>
              <Proximamente />
            </div>
            <p className="cuerpo-sm texto-suave">Juguete para contar caras y vértices.</p>
            <div className="lab-3d" aria-hidden="true">
              <svg viewBox="0 0 120 100" width="140">
                <g fill="none" stroke="var(--magia)" strokeWidth="2">
                  <path d="M60 8 92 50 60 92 28 50z" /><path d="M28 50h64M60 8v84" strokeDasharray="4 4" opacity=".5" />
                </g>
                {[[60, 8], [92, 50], [60, 92], [28, 50]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="var(--magia)" />)}
              </svg>
              <span className="etq texto-suave">6 vértices • 8 caras</span>
            </div>
          </section>
        </div>
      </div>

      <div className="grid-12">
        <section className="tarjeta col-7">
          <div className="fila-entre" style={{ marginBottom: 12 }}>
            <div>
              <h2 className="t-md" style={{ margin: 0 }}><span className="icono-caja ic-crema chica"><I n="sombrero" tamano={16} /></span> Armario de Disfraces de {kiko}</h2>
              <p className="cuerpo-sm texto-suave" style={{ margin: '2px 0 0' }}>Tu ajolote se pone solito los stickers que ganas al abrir cofres.</p>
            </div>
            <span className="chip">{estado.stickers.length} / {Object.keys(STICKERS).length} Equipado</span>
          </div>
          <div className="armario">
            {Object.entries(STICKERS).map(([id, s]) => {
              const tiene = estado.stickers.includes(id);
              const a = ARMARIO[id] || { icono: 'chispa', efecto: '' };
              return (
                <div key={id} className={`prenda${tiene ? '' : ' falta'}`}>
                  {tiene && <span className="chip chip-verde prenda-badge">Puesto</span>}
                  <span className="prenda-icono"><I n={tiene ? a.icono : 'candado'} tamano={26} /></span>
                  <b className="t-sm">{s.nombre}</b>
                  <small className="cuerpo-sm texto-suave">{a.efecto}</small>
                  <span className={`chip ${tiene ? 'chip-gris' : 'chip-gris'}`}>{tiene ? 'Equipado' : 'Bloqueado'}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="tarjeta col-5">
          <div className="fila-entre" style={{ marginBottom: 12 }}>
            <div>
              <h2 className="t-md" style={{ margin: 0 }}><span className="icono-caja ic-verde chica"><I n="chispa" tamano={16} /></span> Bolsa de Pociones</h2>
              <p className="cuerpo-sm texto-suave" style={{ margin: '2px 0 0' }}>Consumibles de apoyo en lecciones</p>
            </div>
            <Proximamente />
          </div>
          <div className="pila-sm">
            {[['estrella', 'Poción Doble Estrella', 'Multiplica x2 las estrellas por 15 min'],
              ['escudo', 'Escudo de Racha', 'Protege tus días si olvidas jugar hoy'],
              ['lupa', 'Lupa de Pistas del Escáner', 'Pistas paso a paso extra']].map(([ic, t, d]) => (
              <div key={t} className="pocion">
                <span className="icono-caja ic-blanco"><I n={ic} /></span>
                <div style={{ flex: 1 }}><b className="t-sm">{t}</b><p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>{d}</p></div>
                <button className="btn btn-naranja btn-chico" disabled>Usar</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
