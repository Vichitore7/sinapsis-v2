// Piezas pequeñas compartidas entre pantallas.
import Ajolote from './Ajolote.jsx';
import { useJuego } from '../estado/store.jsx';

/**
 * Cabecita de Mix con el traje que eligió el alumno (Perfil > Stickers).
 * Va donde antes había una huella: logo, menú, "¡Mix está aquí!", consejos. Es decorativa (el texto de al lado dice quién es).
 */
export function CabezaKiko({ tamano = 28 }) {
  const { usuario, estado } = useJuego();
  const traje = usuario?.rol === 'alumno' ? estado.traje : null;
  return (
    <span className="cabeza-kiko" aria-hidden="true">
      <Ajolote estado="feliz" tamano={tamano} cabeza traje={traje} />
    </span>
  );
}

/** Globo de diálogo del ajolote con el ajolote a un lado. */
export function DiceAjolote({ estado = 'feliz', children, tamano = 96, mundosSuperados = 0, accesorios = [], traje = null }) {
  return (
    <div className="dice-ajolote">
      <Ajolote estado={estado} tamano={tamano} mundosSuperados={mundosSuperados} accesorios={accesorios} traje={traje} />
      <div className="sm-bubble globo">{children}</div>
    </div>
  );
}

/** Marcas de 0 a 5 (medidores, progreso). */
export function Marcas({ valor, max = 5, etiqueta }) {
  return (
    <span className="marcas" role="img" aria-label={etiqueta || `${valor} de ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`marca${i < valor ? ' on' : ''}`} />
      ))}
    </span>
  );
}

/** Barra de progreso con contorno. */
export function Barra({ valor, max, color = 'sol', etiqueta }) {
  const pct = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0;
  return (
    <div
      className={`barra barra-${color}`}
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={etiqueta}
    >
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Mensaje "¡Casi!" (components/MensajeCasi). */
export function MensajeCasi({ paso, onPista, onReintentar, pistasAgotadas }) {
  return (
    <div className="sm-casi sacude" role="status">
      <h2 className="titulo" style={{ margin: '0 0 var(--espacio-2)' }}>¡Casi!</h2>
      <p className="cuerpo" style={{ margin: '0 0 var(--espacio-4)' }}>
        El sendero se torció en el paso {paso}. ¿Lo revisamos juntos?
      </p>
      <div className="acciones">
        <button className="sm-btn sm-btn-pista" onClick={onPista}>
          {pistasAgotadas ? 'Ver ejemplo parecido' : '? Ver pista'}
        </button>
        <button className="sm-btn sm-btn-suave" onClick={onReintentar}>Reintentar</button>
      </div>
    </div>
  );
}

/** Mensaje "¡Misión cumplida!". */
export function MisionCumplida({ texto, onPremio, textoBoton = '★ Reclamar premio' }) {
  return (
    <div className="sm-acierto rebota" role="status">
      <h2 className="titulo" style={{ margin: '0 0 var(--espacio-2)' }}>✓ ¡Misión cumplida!</h2>
      <p className="cuerpo" style={{ margin: '0 0 var(--espacio-4)' }}>{texto}</p>
      <button className="sm-btn sm-btn-sol" onClick={onPremio}>{textoBoton}</button>
    </div>
  );
}

/** Medidor de 5 barritas verticales (estilo Stitch: verde lleno, lavanda vacío). */
export function Medidor({ valor, max = 5, etiqueta }) {
  return (
    <span className="medidor" role="img" aria-label={etiqueta || `${valor} de ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < valor ? 'on' : ''} />
      ))}
    </span>
  );
}

/** Insignia para piezas del diseño que todavía no tienen backend. */
export function Proximamente({ texto = 'Próximamente' }) {
  return <span className="chip chip-gris proximamente" title="Diseño de muestra: aún no funciona">{texto}</span>;
}
