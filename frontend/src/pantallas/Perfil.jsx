// Usuario: logros, medallas, stickers, diplomas y personalizar (alumno). El profesor solo ve personalizar.
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useJuego } from '../estado/store.jsx';
import { MostrarCodigo } from './Cuenta.jsx';
import I from '../componentes/IconosUI.jsx';
import Ajolote from '../componentes/Ajolote.jsx';
import { SeccionDiplomas, SeccionLogros, SeccionMedallas, SeccionStickers } from './Logros.jsx';

const PESTANAS = [
  ['logros', 'Logros', 'diana'],
  ['medallas', 'Medallas', 'logros'],
  ['stickers', 'Stickers', 'libro'],
  ['diplomas', 'Diplomas', 'chispa'],
  ['personalizar', 'Personalizar', 'ajustes'],
];

// La ruta #/perfil/<pestaña> abre esa pestaña directo (p. ej. #/perfil/stickers desde la notificación de bienvenida).
export default function Perfil({ retoId: pestanaRuta }) {
  const { usuario, salir, tema, cambiarTema, estado, mundos, entrar } = useJuego();
  const alumno = usuario.rol === 'alumno';
  const inicial = alumno ? (PESTANAS.some(([id]) => id === pestanaRuta) ? pestanaRuta : 'logros') : 'personalizar';
  const [pestana, setPestana] = useState(inicial);
  useEffect(() => { setPestana(inicial); }, [inicial]);
  const [codigoNuevo, setCodigoNuevo] = useState(null);
  const [pass, setPass] = useState({ actual: '', nueva: '' });
  const [mensajePass, setMensajePass] = useState(null);
  const [apodo, setApodo] = useState(usuario.apodo);
  const [mensajeApodo, setMensajeApodo] = useState(null);

  const guardarApodo = async (e) => {
    e.preventDefault();
    try {
      const r = await api.cambiarPerfil({ apodo: apodo.trim() });
      await entrar(r.usuario);
      setMensajeApodo({ ok: true, texto: 'Apodo actualizado.' });
    } catch (err) {
      setMensajeApodo({ ok: false, texto: err.message });
    }
  };

  const generarCodigo = async () => {
    if (!window.confirm('Se generará un código nuevo y el anterior dejará de servir. ¿Continuar?')) return;
    const r = await api.nuevoCodigo();
    setCodigoNuevo(r.codigo_recuperacion);
  };

  const cambiarPass = async (e) => {
    e.preventDefault();
    try {
      await api.cambiarPassword(pass);
      setPass({ actual: '', nueva: '' });
      setMensajePass({ ok: true, texto: 'Contraseña cambiada.' });
    } catch (err) {
      setMensajePass({ ok: false, texto: err.message });
    }
  };

  if (codigoNuevo) {
    return <MostrarCodigo codigo={codigoNuevo} titulo="Tu código nuevo" onListo={() => setCodigoNuevo(null)} />;
  }

  const personalizar = (
    <div className="grid-12">
      <section className="tarjeta col-7 pila-md">
        <h2 className="t-md" style={{ margin: 0 }}><I n="perfil" tamano={20} className="texto-naranja" /> Tu perfil</h2>
        <form className="campo-st" onSubmit={guardarApodo}>
          <label className="etq" htmlFor="apodo-perfil">{alumno ? 'Apodo (nunca tu nombre real)' : 'Cómo te llaman tus alumnos'}</label>
          <div className="renombrar">
            <input id="apodo-perfil" className="entrada entrada-chica" value={apodo} onChange={(e) => setApodo(e.target.value)} maxLength={30} />
            <button className="btn btn-crema btn-chico" disabled={!apodo.trim() || apodo.trim() === usuario.apodo}>Guardar</button>
          </div>
          {mensajeApodo && <span className={`etq ${mensajeApodo.ok ? 'texto-selva' : 'texto-casi'}`}>{mensajeApodo.texto}</span>}
          <span className="cuerpo-sm texto-suave">Usuario: {usuario.usuario} · {alumno ? 'Explorador' : 'Maestra o maestro'}</span>
        </form>
        <div className="campo-st">
          <span className="etq">Tema</span>
          <div className="segmentado">
            {[['claro', 'Día'], ['oscuro', 'Noche'], ['sistema', 'Como mi dispositivo']].map(([v, t]) => (
              <button key={v} className={`seg-btn${tema === v ? ' activo' : ''}`} aria-pressed={tema === v} onClick={() => cambiarTema(v)}>{t}</button>
            ))}
          </div>
        </div>
        <button className="btn btn-blanco btn-chico" style={{ alignSelf: 'flex-start' }} onClick={salir}><I n="salir" tamano={16} /> Cerrar sesión</button>
      </section>

      <section className="tarjeta col-5 pila-md">
        <h2 className="t-md" style={{ margin: 0 }}><I n="candado" tamano={20} className="texto-naranja" /> Seguridad</h2>
        <form className="pila-sm" onSubmit={cambiarPass}>
          <input className="entrada entrada-chica" type="password" placeholder="Contraseña actual" aria-label="Contraseña actual"
            value={pass.actual} onChange={(e) => setPass({ ...pass, actual: e.target.value })} autoComplete="current-password" />
          <input className="entrada entrada-chica" type="password" placeholder="Contraseña nueva (mínimo 6)" aria-label="Contraseña nueva"
            value={pass.nueva} onChange={(e) => setPass({ ...pass, nueva: e.target.value })} autoComplete="new-password" />
          <button className="btn btn-naranja btn-chico" disabled={!pass.actual || pass.nueva.length < 6}>Cambiar contraseña</button>
          {mensajePass && <p className={`etq ${mensajePass.ok ? 'texto-selva' : 'texto-casi'}`} role="status" style={{ margin: 0 }}>{mensajePass.texto}</p>}
        </form>
        <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>¿Perdiste tu código de recuperación? Genera uno nuevo mientras recuerdas tu contraseña.</p>
        <button className="btn btn-crema btn-chico" onClick={generarCodigo}>Generar código nuevo</button>
      </section>
    </div>
  );

  if (!alumno) {
    return (
      <div className="pila-lg">
        <h1 className="t-xl" style={{ margin: 0 }}>{usuario.apodo}</h1>
        {personalizar}
      </div>
    );
  }

  return (
    <div className="pila-lg">
      <section className="tarjeta cabecera-pantalla">
        <span className="kiko-cabeza chica"><Ajolote estado="feliz" tamano={56} cabeza traje={estado.traje} etiqueta={`${estado.nombreAjolote}, tu ajolote`} /></span>
        <div style={{ flex: 1 }}>
          <h1 className="t-lg" style={{ margin: 0 }}>{estado.apodo} <span className="chip">Nivel {estado.nivel}</span></h1>
          <p className="cuerpo-md texto-suave" style={{ margin: '2px 0 0' }}>★ {estado.estrellas} estrellas · racha de {estado.rachaDias} día{estado.rachaDias === 1 ? '' : 's'}</p>
        </div>
      </section>
      <div className="pestanas-chip" role="tablist" aria-label="Secciones de tu perfil">
        {PESTANAS.map(([id, texto, icono]) => (
          <button key={id} role="tab" aria-selected={pestana === id} className={`chip-tab${pestana === id ? ' activo' : ''}`} onClick={() => setPestana(id)}>
            <I n={icono} tamano={16} /> {texto}
          </button>
        ))}
      </div>
      {pestana === 'logros' && <SeccionLogros estado={estado} />}
      {pestana === 'medallas' && <SeccionMedallas estado={estado} mundos={mundos} />}
      {pestana === 'stickers' && <SeccionStickers estado={estado} mundos={mundos} />}
      {pestana === 'diplomas' && <SeccionDiplomas estado={estado} mundos={mundos} />}
      {pestana === 'personalizar' && personalizar}
    </div>
  );
}
