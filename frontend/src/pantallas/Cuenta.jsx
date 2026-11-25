// Entrar, crear cuenta y recuperar con código. Sin correo: usuario + contraseña + código de recuperación.
import { useState } from 'react';
import { api } from '../api.js';
import { useJuego } from '../estado/store.jsx';
import Ajolote from '../componentes/Ajolote.jsx';
import I from '../componentes/IconosUI.jsx';
import { guardarBienvenida } from '../componentes/LogroBienvenida.jsx';

function Campo({ id, etiqueta, ayuda, icono, extra, ...props }) {
  return (
    <div className="campo-st">
      <div className="fila-entre">
        <label className="t-sm" htmlFor={id}>{etiqueta}</label>
        {extra}
      </div>
      <div className="entrada-con-icono">
        {icono && <I n={icono} tamano={20} />}
        <input id={id} className="entrada" autoComplete="off" {...props} />
      </div>
      {ayuda && <span className="etq texto-suave">{ayuda}</span>}
    </div>
  );
}

const ANIMALES = ['Luna', 'Jaguar', 'Tucán', 'Quetzal', 'Colibrí', 'Mono', 'Rana', 'Puma', 'Lince', 'Tortuga', 'Iguana', 'Coyote'];
const ADJETIVOS = ['Veloz', 'Valiente', 'Curioso', 'Brillante', 'Sabio', 'Saltarín', 'Estelar', 'Alegre', 'Astuto', 'Risueño'];
function apodoMagico() {
  const a = ANIMALES[Math.floor(Math.random() * ANIMALES.length)];
  const b = ADJETIVOS[Math.floor(Math.random() * ADJETIVOS.length)];
  return `${a} ${b}`;
}

const PRIMARIA = ['1°', '2°', '3°', '4°', '5°', '6°'];
const SECUNDARIA = ['1° Año', '2° Año', '3° Año'];
// 'Primaria • 5°' → 'P5' y 'Secundaria • 2° Año' → 'S2': el código que guarda el servidor para elegir el diagnóstico.
const codigoGrado = (g) => `${g.startsWith('Secundaria') ? 'S' : 'P'}${g.match(/\d/)[0]}`;

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
  const [grado, setGrado] = useState('Primaria • 4°');
  const [error, setError] = useState(errorRed);
  const [enviando, setEnviando] = useState(false);
  const [pendiente, setPendiente] = useState(null); // { usuario, codigo } tras registrar o recuperar

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const cambiarModo = (m) => { setModo(m); setError(null); };
  const alumno = form.rol === 'alumno';

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
        // El grado se guarda en el servidor y decide qué examen diagnóstico le toca al alumno.
        const r = await api.registro({ usuario: form.usuario, apodo: form.apodo, password: form.password, rol: form.rol,
          ...(alumno && { grado: codigoGrado(grado) }) });
        // La notificación del logro de bienvenida sale al terminar el examen diagnóstico.
        if (r.bienvenida) guardarBienvenida(r.usuario.id, r.bienvenida);
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
      <div className="portada portada-simple">
        <div className="tarjeta-entrada">
          <MostrarCodigo
            codigo={pendiente.codigo}
            titulo={pendiente.recuperado ? 'Tu código cambió: guarda el nuevo' : '¡Guarda tu código secreto!'}
            onListo={() => entrar(pendiente.usuario)}
          />
        </div>
      </div>
    );
  }

  const textoBoton = enviando ? 'Un momento…'
    : modo === 'entrar' ? 'Entrar'
    : modo === 'crear' ? 'Crear mi cuenta'
    : 'Cambiar contraseña';

  return (
    <div className="portada portada-simple">
      <div className="portada-kiko">
        <span className="kiko-cabeza"><Ajolote estado="feliz" tamano={150} cabeza etiqueta="Mix, el ajolote" /></span>
        <h1 className="logo-texto grande">Mix</h1>
      </div>

      <section className="tarjeta tarjeta-entrada">
        <div className="segmentado segmentado-grande" role="tablist" aria-label="¿Quién eres?">
          {[['alumno', 'Alumno', 'perfil'], ['profesor', 'Profesor', 'birrete']].map(([v, t, ic]) => (
            <button key={v} role="tab" aria-selected={form.rol === v} className={`seg-btn${form.rol === v ? ' activo' : ''}`}
              onClick={() => setForm({ ...form, rol: v })}>
              <I n={ic} tamano={20} /> {t}
            </button>
          ))}
        </div>

        {modo === 'recuperar' ? (
          <h2 className="t-lg centro-texto" style={{ margin: '18px 0 0' }}>Recupera tu cuenta</h2>
        ) : (
          <div className="pestanas-entrada" role="tablist">
            <button role="tab" aria-selected={modo === 'entrar'} className={modo === 'entrar' ? 'activa' : ''} onClick={() => cambiarModo('entrar')}>Entrar</button>
            <button role="tab" aria-selected={modo === 'crear'} className={modo === 'crear' ? 'activa' : ''} onClick={() => cambiarModo('crear')}>Crear cuenta</button>
          </div>
        )}

        <form className="col-form" onSubmit={enviar}>
          <Campo id="usuario" etiqueta="Usuario" icono="perfil" value={form.usuario} onChange={set('usuario')} maxLength={20}
            ayuda={modo === 'crear' ? 'De 3 a 20 letras o números. Con este entras.' : null} autoCapitalize="none" placeholder="tu_usuario" />

          {modo === 'crear' && (
            <Campo id="apodo" etiqueta={alumno ? 'Tu apodo de explorador' : 'Cómo te llaman tus alumnos'} icono="huella"
              value={form.apodo} onChange={set('apodo')} maxLength={30} placeholder={alumno ? 'Luna Veloz' : 'Profe Ana'}
              ayuda={alumno ? 'Usa solo un apodo divertido. Nunca tu nombre real.' : null}
              extra={alumno && (
                <button type="button" className="enlace-icono" onClick={() => setForm({ ...form, apodo: apodoMagico() })}>
                  <I n="chispa" tamano={16} /> Apodo mágico
                </button>
              )} />
          )}

          {modo === 'crear' && alumno && (
            <div className="campo-st">
              <div className="fila-entre">
                <span className="t-sm">Nivel escolar</span>
                <span className="chip">{grado}</span>
              </div>
              <div className="niveles">
                <div className="nivel-grupo">
                  <span className="nivel-titulo"><span className="letra">P</span> <b>Primaria</b></span>
                  <div className="nivel-opciones">
                    {PRIMARIA.map((g) => {
                      const v = `Primaria • ${g}`;
                      return <button type="button" key={g} className={`nivel-btn${grado === v ? ' activo' : ''}`} aria-pressed={grado === v} onClick={() => setGrado(v)}>{g}</button>;
                    })}
                  </div>
                </div>
                <div className="nivel-grupo">
                  <span className="nivel-titulo"><span className="letra oscura">S</span> <b>Secundaria</b></span>
                  <div className="nivel-opciones">
                    {SECUNDARIA.map((g) => {
                      const v = `Secundaria • ${g}`;
                      return <button type="button" key={g} className={`nivel-btn${grado === v ? ' activo' : ''}`} aria-pressed={grado === v} onClick={() => setGrado(v)}>{g.replace(' Año', '')}</button>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {modo === 'recuperar' && (
            <Campo id="codigo" etiqueta="Código de recuperación" icono="llave" value={form.codigo} onChange={set('codigo')} maxLength={20}
              placeholder="XXXX-XXXX-XXXX" autoCapitalize="characters" />
          )}

          <Campo id="password" etiqueta={modo === 'recuperar' ? 'Contraseña nueva' : 'Contraseña'} icono="candado" type="password"
            value={form.password} onChange={set('password')} maxLength={64}
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            ayuda={modo !== 'entrar' ? 'Mínimo 6 caracteres.' : null} />

          {modo !== 'entrar' && (
            <Campo id="password2" etiqueta="Repite la contraseña" icono="candado" type="password" value={form.password2}
              onChange={set('password2')} maxLength={64} autoComplete="new-password" />
          )}

          {error && <div className="aviso-casi" role="alert">{error}</div>}

          <button className="btn btn-naranja btn-grande" type="submit" disabled={enviando}>
            {textoBoton} <I n="flecha" tamano={22} />
          </button>
          <p className="etq centro-texto" style={{ margin: 0 }}>
            {modo === 'recuperar'
              ? <button type="button" className="enlace-boton" onClick={() => cambiarModo('entrar')}>Volver a entrar</button>
              : <button type="button" className="enlace-boton" onClick={() => cambiarModo('recuperar')}>Olvidé mi contraseña</button>}
          </p>
        </form>
      </section>
      {errorRed && <p className="etq texto-casi centro-texto">Sin conexión con el servidor. Revisa que el backend esté prendido.</p>}
    </div>
  );
}
