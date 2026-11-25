import { useJuego } from './estado/store.jsx';
import { useRuta, ir } from './ruta.js';
import Icono from './componentes/Iconos.jsx';
import Ajolote from './componentes/Ajolote.jsx';
import Cuenta from './pantallas/Cuenta.jsx';
import Inicio from './pantallas/Inicio.jsx';
import Mapa from './pantallas/Mapa.jsx';
import Reto from './pantallas/Reto.jsx';
import Habitacion from './pantallas/Habitacion.jsx';
import Logros from './pantallas/Logros.jsx';
import Escaner from './pantallas/Escaner.jsx';
import ModoAula from './pantallas/ModoAula.jsx';
import Aulas from './pantallas/Aulas.jsx';
import Perfil from './pantallas/Perfil.jsx';

// Cada rol ve su propio menú. El primero de la lista es su pantalla de inicio.
const NAV = {
  alumno: [
    { id: 'inicio', texto: 'Inicio', icono: 'inicio' },
    { id: 'mapa', texto: 'Mapa', icono: 'mapa' },
    { id: 'escaner', texto: 'Escáner', icono: 'escaner' },
    { id: 'habitacion', texto: 'Habitación', icono: 'habitacion' },
    { id: 'logros', texto: 'Logros', icono: 'logros' },
    { id: 'perfil', texto: 'Perfil', icono: 'perfil' },
  ],
  profesor: [
    { id: 'aulas', texto: 'Mis aulas', icono: 'aula' },
    { id: 'modo-aula', texto: 'Modo Aula', icono: 'mapa' },
    { id: 'escaner', texto: 'Escáner', icono: 'escaner' },
    { id: 'perfil', texto: 'Perfil', icono: 'perfil' },
  ],
};

const PANTALLAS = {
  alumno: { inicio: Inicio, mapa: Mapa, reto: Reto, habitacion: Habitacion, logros: Logros, escaner: Escaner, perfil: Perfil },
  profesor: { aulas: Aulas, 'modo-aula': ModoAula, escaner: Escaner, perfil: Perfil },
};

export default function App() {
  const { usuario, cargando, estado } = useJuego();
  const { pantalla, param } = useRuta();

  if (cargando) {
    return (
      <div className="pantalla-carga" role="status">
        <Ajolote estado="feliz" tamano={120} />
        <p className="cuerpo-fuerte">Abriendo la selva…</p>
      </div>
    );
  }

  if (!usuario) {
    return <main className="contenido contenido-solo"><Cuenta /></main>;
  }

  const rol = usuario.rol === 'profesor' ? 'profesor' : 'alumno';
  const nav = NAV[rol];
  const pantallas = PANTALLAS[rol];
  const destino = pantalla === 'mochila' && rol === 'alumno' ? 'habitacion' : pantalla;
  const id = pantallas[destino] ? destino : nav[0].id;
  const Pantalla = pantallas[id];
  const activa = id === 'reto' ? 'mapa' : id;

  return (
    <div className="app">
      <header className="barra-superior">
        <a href="#/" className="marca-app">Selva Matemática</a>
        {rol === 'alumno' ? (
          <button className="sm-chip sm-chip-sol chip-estrellas" onClick={() => ir('/habitacion')} aria-label={`${estado.estrellas} estrellas. Ir a la habitación`}>
            ★ {estado.estrellas}
          </button>
        ) : (
          <span className="sm-chip">{usuario.apodo}</span>
        )}
      </header>

      <main className="contenido" id="contenido">
        <Pantalla key={id === 'reto' ? param : id} retoId={param} />
      </main>

      <nav className={`nav-inferior nav-${nav.length}`} aria-label="Navegación principal">
        {nav.map((n, i) => (
          <a
            key={n.id}
            href={`#/${i === 0 ? '' : n.id}`}
            className={`nav-item${activa === n.id ? ' activo' : ''}`}
            aria-current={activa === n.id ? 'page' : undefined}
          >
            <Icono nombre={n.icono} tamano={34} />
            <span className="etiqueta">{n.texto}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
