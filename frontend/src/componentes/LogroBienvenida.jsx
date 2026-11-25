// Notificación de logro "Inicio de la aventura" con el regalo de inicio de sesión (2 stickers de traje típico).
// El registro la deja pendiente en este dispositivo y aparece al terminar el examen diagnóstico.
import Ajolote from './Ajolote.jsx';
import I from './IconosUI.jsx';

const clave = (usuarioId) => `selva:bienvenida:${usuarioId}`;

export function guardarBienvenida(usuarioId, bienvenida) {
  try { localStorage.setItem(clave(usuarioId), JSON.stringify(bienvenida)); } catch { /* sin almacenamiento: no hay aviso */ }
}

export function leerBienvenida(usuarioId) {
  try {
    const crudo = localStorage.getItem(clave(usuarioId));
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

export function borrarBienvenida(usuarioId) {
  try { localStorage.removeItem(clave(usuarioId)); } catch { /* nada que borrar */ }
}

/** onInicio: seguir a la pantalla de inicio. onStickers: ir a Perfil > Stickers para vestir a Mix. */
export default function LogroBienvenida({ bienvenida, onInicio, onStickers }) {
  return (
    <section className="tarjeta logro-aviso" role="alertdialog" aria-labelledby="logro-titulo" aria-describedby="logro-texto">
      <span className="logro-medalla"><I n="logros" tamano={30} /></span>
      <span className="sobre">¡Logro desbloqueado!</span>
      <h2 id="logro-titulo" className="t-lg" style={{ margin: 0 }}>{bienvenida.logro}</h2>
      <p id="logro-texto" className="cuerpo-md" style={{ margin: 0 }}>
        Cuenta creada. ¡Tu aventura en la selva empieza ahora! Como regalo de inicio de sesión te damos {bienvenida.trajes.length} stickers
        de traje típico de los trajineros de Xochimilco.
      </p>
      <div className="logro-regalo">
        {bienvenida.trajes.map((t) => (
          <figure key={t.id}>
            <Ajolote estado="celebrando" tamano={96} traje={t.id} etiqueta={`Mix con ${t.nombre.toLowerCase()}`} />
            <figcaption>{t.nombre}</figcaption>
          </figure>
        ))}
      </div>
      <span className="logro-pista"><I n="perfil" tamano={16} /> Los encuentras en tu Perfil → Stickers</span>
      <div className="logro-acciones">
        <button className="btn btn-naranja btn-grande" onClick={onStickers} autoFocus><I n="sombrero" /> Vestir a Mix</button>
        <button className="btn btn-crema btn-grande" onClick={onInicio}>Ir al inicio <I n="flecha" /></button>
      </div>
    </section>
  );
}
