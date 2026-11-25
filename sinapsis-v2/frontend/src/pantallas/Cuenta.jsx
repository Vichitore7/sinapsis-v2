// Entrar, crear cuenta y recuperar con código. Sin correo: usuario + contraseña + código de recuperación.
import { useState } from 'react';
import { api } from '../api.js';
import { useJuego } from '../estado/store.jsx';
import Ajolote from '../componentes/Ajolote.jsx';

function Campo({ id, etiqueta, ayuda, ...props }) {
  return (
    <div className="campo-form">
      <label className="cuerpo-fuerte" htmlFor={id}>{etiqueta}</label>
      <input id={id} className="sm-input sm-input-texto" autoComplete="off" {...props} />
      {ayuda && <span className="etiqueta texto-suave">{ayuda}</span>}
    </div>
  );
}

/** Se muestra UNA sola vez después de registrarse o recuperar. */
export function MostrarCodigo({ codigo, onListo, titulo = '¡Guarda tu código secreto!' }) {
  const [anotado, setAnotado] = useState(false);
  return (
    <section className="sm-card">
      <div className="dice-ajolote">
        <Ajolote estado="curioso" tamano={90} />
        <div className="sm-bubble globo">
          Si un día olvidas tu contraseña, este código es la única forma de recuperar tu cuenta.
        </div>
      </div>
      <h2 className="subtitulo" style={{ margin: 'var(--espacio-4) 0 var(--espacio-2)' }}>{titulo}</h2>
      <p className="codigo-secreto" aria-label={`Código: ${codigo.split('').join(' ')}`}>{codigo}</p>
      <p className="cuerpo texto-suave" style={{ marginTop: 0 }}>
        Anótalo en tu cuaderno o pídele a un adulto que lo guarde. No lo vuelvas a ver aquí: no se puede consultar después.
      </p>
      <label className="casilla">
        <input type="checkbox" checked={anotado} onChange={(e) => setAnotado(e.target.checked)} />
        <span className="cuerpo-fuerte" style={{ margin: 0 }}>Ya lo anoté</span>
      </label>
      <button className="sm-btn ancho" disabled={!anotado} onClick={onListo} style={{ marginTop: 'var(--espacio-3)' }}>Continuar</button>
    </section>
  );
}

export default function Cuenta() {
  const { entrar, errorRed } = useJuego();
  const [modo, setModo] = useState('entrar'); // entrar | crear | recuperar
  const [form, setForm] = useState({ usuario: '', apodo: '', password: '', password2: '', codigo: '', rol: 'alumno' });
  const [error, setError] = useState(errorRed);
  const [enviando, setEnviando] = useState(false);
  const [pendiente, setPendiente] = useState(null); // { usuario, codigo } tras registrar o recuperar

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    if ((modo === 'crear' || modo === 'recuperar') && form.password !== form.password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setEnviando(true);
    try {
      if (modo === 'entrar') {
        const r = await api.login({ usuario: form.usuario, password: form.password });
        await entrar(r.usuario);
      } else if (modo === 'crear') {
        const r = await api.registro({ usuario: form.usuario, apodo: form.apodo, password: form.password, rol: form.rol });
        setPendiente({ usuario: r.usuario, codigo: r.codigo_recuperacion });
      } else {
        const r = await api.recuperar({ usuario: form.usuario, codigo: form.codigo, nueva_password: form.password });
        setPendiente({ usuario: r.usuario, codigo: r.codigo_recuperacion, recuperado: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (pendiente) {
    return (
      <div className="pantalla-cuenta">
        <MostrarCodigo
          codigo={pendiente.codigo}
          titulo={pendiente.recuperado ? 'Tu código cambió: guarda el nuevo' : '¡Guarda tu código secreto!'}
          onListo={() => entrar(pendiente.usuario)}
        />
      </div>
    );
  }

  const titulos = { entrar: 'Entrar', crear: 'Crear cuenta', recuperar: 'Recuperar mi cuenta' };

  return (
    <div className="pantalla-cuenta">
      <div className="portada-arte" aria-hidden="true">
        <span className="bloque b-selva" /><span className="bloque b-magia" />
        <span className="bloque b-sol" /><span className="bloque b-rosa" />
      </div>
      <h1 className="titulo-app">Selva Matemática</h1>
      <p className="etiqueta texto-suave">Equivocarse también es avanzar.</p>

      <section className="sm-card" style={{ marginTop: 'var(--espacio-4)' }}>
        <div className="pestanas" role="tablist">
          {['entrar', 'crear'].map((m) => (
            <button key={m} role="tab" aria-selected={modo === m} className={`pestana${modo === m ? ' activa' : ''}`}
              onClick={() => { setModo(m); setError(null); }}>
              {titulos[m]}
            </button>
          ))}
        </div>

        {modo === 'recuperar' && <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-3)' }}>{titulos.recuperar}</h2>}

        <form className="col-3" onSubmit={enviar}>
          {modo === 'crear' && (
            <div className="campo-form">
              <span className="cuerpo-fuerte">Soy…</span>
              <div className="acciones">
                {[['alumno', 'Alumno'], ['profesor', 'Maestra o maestro']].map(([v, t]) => (
                  <button key={v} type="button" className={`tip${form.rol === v ? ' sel-magia' : ''}`} aria-pressed={form.rol === v}
                    onClick={() => setForm({ ...form, rol: v })}>{t}</button>
                ))}
              </div>
            </div>
          )}

          <Campo id="usuario" etiqueta="Usuario" value={form.usuario} onChange={set('usuario')} maxLength={20}
            ayuda={modo === 'crear' ? 'De 3 a 20 letras o números. Con este entras.' : null} autoCapitalize="none" />

          {modo === 'crear' && (
            <Campo id="apodo" etiqueta={form.rol === 'alumno' ? 'Apodo' : 'Cómo te llaman tus alumnos'} value={form.apodo}
              onChange={set('apodo')} maxLength={30}
              ayuda={form.rol === 'alumno' ? 'Así te saluda Kiko. Usa un apodo, no tu nombre completo.' : 'Ej. Profe Ana'} />
          )}

          {modo === 'recuperar' && (
            <Campo id="codigo" etiqueta="Código de recuperación" value={form.codigo} onChange={set('codigo')} maxLength={20}
              placeholder="XXXX-XXXX-XXXX" autoCapitalize="characters" />
          )}

          <Campo id="password" etiqueta={modo === 'recuperar' ? 'Contraseña nueva' : 'Contraseña'} type="password"
            value={form.password} onChange={set('password')} maxLength={64}
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            ayuda={modo !== 'entrar' ? 'Mínimo 6 caracteres.' : null} />

          {modo !== 'entrar' && (
            <Campo id="password2" etiqueta="Repite la contraseña" type="password" value={form.password2}
              onChange={set('password2')} maxLength={64} autoComplete="new-password" />
          )}

          {error && <div className="sm-casi mensaje-error" role="alert">{error}</div>}

          <button className="sm-btn ancho" type="submit" disabled={enviando}>
            {enviando ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : modo === 'crear' ? 'Crear mi cuenta' : 'Cambiar contraseña'}
          </button>
        </form>

        <div className="pie-cuenta">
          {modo === 'recuperar' ? (
            <button className="enlace-boton" onClick={() => { setModo('entrar'); setError(null); }}>Volver a entrar</button>
          ) : (
            <button className="enlace-boton" onClick={() => { setModo('recuperar'); setError(null); }}>Olvidé mi contraseña</button>
          )}
        </div>
      </section>
    </div>
  );
}
