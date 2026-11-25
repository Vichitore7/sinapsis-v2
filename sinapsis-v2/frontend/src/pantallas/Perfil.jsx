// Perfil: unirse a un aula (alumno), tema, código de recuperación nuevo, cambiar contraseña y salir.
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useJuego } from '../estado/store.jsx';
import { MostrarCodigo } from './Cuenta.jsx';

function MisAulas() {
  const [aulas, setAulas] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [mensaje, setMensaje] = useState(null);

  const cargar = () => api.aulas().then((r) => setAulas(r.aulas)).catch(() => setAulas([]));
  useEffect(() => { cargar(); }, []);

  const unirse = async (e) => {
    e.preventDefault();
    setMensaje(null);
    try {
      const a = await api.unirse(codigo);
      setMensaje({ ok: true, texto: `¡Ya estás en ${a.nombre}!` });
      setCodigo('');
      cargar();
    } catch (err) {
      setMensaje({ ok: false, texto: err.message });
    }
  };

  return (
    <section className="sm-card">
      <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>Mi aula</h2>
      {aulas?.length ? (
        <ul className="lista-logros" style={{ marginBottom: 'var(--espacio-3)' }}>
          {aulas.map((a) => (
            <li key={a.id} className="logro hecho">
              <span className="sm-paso-marca">✓</span>
              <div>
                <div className="cuerpo-fuerte" style={{ margin: 0 }}>{a.nombre}</div>
                <div className="etiqueta texto-suave">Con {a.profesor}</div>
                {a.asignaciones.map((t) => (
                  <div key={t.id} className="etiqueta">Misión: {t.leccion}{t.fecha_limite ? ` · antes del ${t.fecha_limite}` : ''}</div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="cuerpo texto-suave" style={{ marginTop: 0 }}>Pídele el código a tu maestra o maestro.</p>
      )}
      <form className="acciones" onSubmit={unirse}>
        <input className="sm-input sm-input-texto input-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)}
          placeholder="ABC-123" maxLength={10} aria-label="Código del aula" autoCapitalize="characters" />
        <button className="sm-btn" disabled={codigo.replace(/[^a-z0-9]/gi, '').length < 6}>Unirme</button>
      </form>
      {mensaje && <p className={`etiqueta ${mensaje.ok ? 'texto-selva' : 'texto-casi'}`} role="status">{mensaje.texto}</p>}
    </section>
  );
}

export default function Perfil() {
  const { usuario, salir, tema, cambiarTema } = useJuego();
  const [codigoNuevo, setCodigoNuevo] = useState(null);
  const [pass, setPass] = useState({ actual: '', nueva: '' });
  const [mensajePass, setMensajePass] = useState(null);

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

  return (
    <div className="pila dos-columnas">
      <section className="sm-card">
        <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-1)' }}>{usuario.apodo}</h2>
        <p className="etiqueta texto-suave" style={{ marginTop: 0 }}>
          Usuario: {usuario.usuario} · {usuario.rol === 'profesor' ? 'Maestra o maestro' : 'Explorador'}
        </p>
        <div className="campo-form">
          <span className="cuerpo-fuerte">Tema</span>
          <div className="acciones">
            {[['claro', 'Día'], ['oscuro', 'Noche'], ['sistema', 'Como mi dispositivo']].map(([v, t]) => (
              <button key={v} className={`tip${tema === v ? ' sel-magia' : ''}`} aria-pressed={tema === v} onClick={() => cambiarTema(v)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="acciones" style={{ marginTop: 'var(--espacio-4)' }}>
          <button className="sm-btn sm-btn-suave" onClick={salir}>Salir</button>
        </div>
      </section>

      {usuario.rol === 'alumno' && <MisAulas />}

      <section className="sm-card">
        <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>Seguridad</h2>
        <form className="col-3" onSubmit={cambiarPass}>
          <input className="sm-input sm-input-texto" type="password" placeholder="Contraseña actual" aria-label="Contraseña actual"
            value={pass.actual} onChange={(e) => setPass({ ...pass, actual: e.target.value })} autoComplete="current-password" />
          <input className="sm-input sm-input-texto" type="password" placeholder="Contraseña nueva (mínimo 6)" aria-label="Contraseña nueva"
            value={pass.nueva} onChange={(e) => setPass({ ...pass, nueva: e.target.value })} autoComplete="new-password" />
          <button className="sm-btn" disabled={!pass.actual || pass.nueva.length < 6}>Cambiar contraseña</button>
          {mensajePass && <p className={`etiqueta ${mensajePass.ok ? 'texto-selva' : 'texto-casi'}`} role="status" style={{ margin: 0 }}>{mensajePass.texto}</p>}
        </form>
        <p className="cuerpo texto-suave">¿Perdiste tu código de recuperación? Genera uno nuevo mientras recuerdas tu contraseña.</p>
        <button className="sm-btn sm-btn-suave" onClick={generarCodigo}>Generar código nuevo</button>
      </section>
    </div>
  );
}
