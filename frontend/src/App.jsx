import { useJuego } from './estado/store.jsx';
import { useRuta, ir } from './ruta.js';
import Icono from './componentes/Iconos.jsx';
import Inicio from './pantallas/Inicio.jsx';
import Mapa from './pantallas/Mapa.jsx';
import Reto from './pantallas/Reto.jsx';
import Mochila from './pantallas/Mochila.jsx';
import Logros from './pantallas/Logros.jsx';
import Escaner from './pantallas/Escaner.jsx';
import ModoAula from './pantallas/ModoAula.jsx';

const NAV = [
  { id: 'inicio', texto: 'Inicio', icono: 'inicio' },
  { id: 'mapa', texto: 'Mapa', icono: 'mapa' },
  { id: 'escaner', texto: 'Escáner', icono: 'escaner' },
  { id: 'aula', texto: 'Modo Aula', icono: 'aula' },
  { id: 'mochila', texto: 'Mochila', icono: 'mochila' },
  { id: 'logros', texto: 'Logros', icono: 'logros' },
];

function Pantalla({ pantalla, param }) {
  switch (pantalla) {
    case 'mapa': return <Mapa />;
    case 'reto': return <Reto key={param} retoId={param} />;
    case 'mochila': return <Mochila />;
    case 'logros': return <Logros />;
    case 'escaner': return <Escaner />;
    case 'aula': return <ModoAula />;
    default: return <Inicio />;
  }
}

export default function App() {
  const { estado } = useJuego();
  const { pantalla, param } = useRuta();
  const activa = pantalla === 'reto' ? 'mapa' : pantalla;

  return (
    <div className="app">
      <header className="barra-superior">
        <a href="#/" className="marca-app">Selva Matemática</a>
        <button className="sm-chip sm-chip-sol chip-estrellas" onClick={() => ir('/mochila')} aria-label={`${estado.estrellas} estrellas. Ir a la mochila`}>
          ★ {estado.estrellas}
        </button>
      </header>

      <main className="contenido" id="contenido">
        <Pantalla pantalla={pantalla} param={param} />
      </main>

      <nav className="nav-inferior" aria-label="Navegación principal">
        {NAV.map((n) => (
          <a
            key={n.id}
            href={`#/${n.id === 'inicio' ? '' : n.id}`}
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
