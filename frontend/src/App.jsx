// Marco de la app (rediseño Stitch "Jungle Gamified EdTech"):
// - Computadora (≥ 1024px): menú lateral fijo + barra superior con contadores.
// - Celular: barra superior compacta + navegación abajo.
import { useState } from 'react';
import { useJuego } from './estado/store.jsx';
import { useRuta, ir } from './ruta.js';
import I from './componentes/IconosUI.jsx';
import Ajolote from './componentes/Ajolote.jsx';
import { CabezaKiko } from './componentes/Comunes.jsx';
import Cuenta from './pantallas/Cuenta.jsx';
import Inicio from './pantallas/Inicio.jsx';
import Mapa from './pantallas/Mapa.jsx';
import Reto from './pantallas/Reto.jsx';
import Habitacion from './pantallas/Habitacion.jsx';
import Escaner from './pantallas/Escaner.jsx';
import Aulas from './pantallas/Aulas.jsx';
import Perfil from './pantallas/Perfil.jsx';
import MiAula from './pantallas/MiAula.jsx';
import DiagnosticoProfe from './pantallas/DiagnosticoProfe.jsx';
import ExamenDiagnostico from './pantallas/ExamenDiagnostico.jsx';
import ExamenMundo from './pantallas/ExamenMundo.jsx';
import { loQuePide } from './logica/juego.js';

// Cada rol ve su propio menú. El primero de la lista es su pantalla de inicio.
// Aula = estudiar (clases y módulos). Mapa = divertirse aprendiendo. Logros, medallas, stickers y diplomas viven en Perfil.
const NAV = {
  alumno: [
    { id: 'inicio', texto: 'Inicio', corto: 'Inicio', icono: 'inicio' },
    { id: 'mapa', texto: 'Mapa', corto: 'Mapa', icono: 'mapa' },
    { id: 'escaner', texto: 'Escáner + IA Tutor', corto: 'Escáner', icono: 'escaner' },
    { id: 'aula', texto: 'Mi Aula', corto: 'Aula', icono: 'aula' },
    { id: 'habitacion', texto: 'Habitación', corto: 'Habitación', icono: 'habitacion' },
  ],
  profesor: [
    { id: 'aulas', texto: 'Modo Aula', corto: 'Aula', icono: 'aula' },
    { id: 'diagnostico', texto: 'Diagnóstico', corto: 'Diagnóstico', icono: 'cerebro' },
    { id: 'perfil', texto: 'Perfil', corto: 'Perfil', icono: 'perfil' },
  ],
};

const PANTALLAS = {
  alumno: { inicio: Inicio, mapa: Mapa, reto: Reto, examen: ExamenMundo, habitacion: Habitacion, mochila: Habitacion, mascota: Habitacion, escaner: Escaner, aula: MiAula, perfil: Perfil, logros: Perfil },
  profesor: { aulas: Aulas, diagnostico: DiagnosticoProfe, perfil: Perfil },
};

function Avisos({ estado, rol }) {
  const [abierto, setAbierto] = useState(false);
  const pide = rol === 'alumno' ? loQuePide(estado.bienestar) : null;
  const avisos = [];
  if (pide) avisos.push({ texto: `${estado.nombreAjolote} te necesita: revisa su ${pide === 'comida' ? 'comida' : pide === 'pecera' ? 'pecera' : 'alegría'}.`, ruta: '/habitacion' });
  return (
    <div className="avisos">
      <button className="boton-redondo" aria-label={`Avisos${avisos.length ? `: ${avisos.length} nuevo` : ''}`} aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
        <I n="campana" />
        {avisos.length > 0 && <span className="punto-aviso" />}
      </button>
      {abierto && (
        <div className="popover" role="dialog" aria-label="Avisos">
          {avisos.length ? avisos.map((a, i) => (
            <button key={i} className="popover-item" onClick={() => { setAbierto(false); ir(a.ruta); }}>{a.texto}</button>
          )) : <p className="etq texto-suave" style={{ margin: 0 }}>Sin avisos nuevos. ¡Todo en orden en la selva!</p>}
        </div>
      )}
    </div>
  );
}

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
    return <Cuenta />;
  }

  const rol = usuario.rol === 'profesor' ? 'profesor' : 'alumno';
  // El diagnóstico de entrada arranca solo la primera vez (no se sugiere con una tarjeta).
  if (rol === 'alumno' && estado.diagnosticoHecho === false) {
    return <ExamenDiagnostico />;
  }
  const nav = NAV[rol];
  const pantallas = PANTALLAS[rol];
  const id = pantallas[pantalla] ? pantalla : nav[0].id;
  const Pantalla = pantallas[id];
  const activa = ['mochila', 'mascota'].includes(id) ? 'habitacion' : id === 'reto' || id === 'examen' ? 'mapa' : id === 'logros' ? 'perfil' : id;
  const alumno = rol === 'alumno';

  return (
    <div className="app">
      <aside className="lateral" aria-label="Menú">
        <a href="#/" className="logo">
          <span className="logo-icono"><CabezaKiko tamano={38} /></span>
          <span className="logo-texto">Selva<small>Matemática</small></span>
        </a>

        {alumno ? (
          <button className="tarjeta-estrellas" onClick={() => ir('/habitacion')} aria-label={`${estado.estrellas} estrellas, nivel ${estado.nivel}. Ir a la habitación`}>
            <span className="estrellas"><I n="estrella" tamano={18} className="texto-selva" /> {estado.estrellas}</span>
            <span className="nivel">Nivel {estado.nivel}</span>
          </button>
        ) : (
          <div className="tarjeta-estrellas">
            <span className="estrellas"><I n="perfil" tamano={18} /> {usuario.apodo}</span>
          </div>
        )}
        <span className="chip-modo"><I n="birrete" tamano={14} /> {alumno ? 'Modo Estudiante' : 'Modo Profesor'}</span>

        <nav className="menu" aria-label="Navegación principal">
          {nav.map((n, i) => (
            <a key={n.id} href={`#/${i === 0 ? '' : n.id}`} className={`menu-item${activa === n.id ? ' activo' : ''}`}
              aria-current={activa === n.id ? 'page' : undefined}>
              <I n={n.icono} tamano={22} />
              <span className="texto-largo">{n.texto}</span>
              <span className="texto-corto">{n.corto}</span>
            </a>
          ))}
        </nav>

        <a href={alumno ? '#/habitacion' : '#/perfil'} className="tarjeta-kiko">
          <span className="kiko-icono"><CabezaKiko tamano={34} /></span>
          <span>
            <b>{alumno ? `${estado.nombreAjolote} el Ajolote` : 'Kiko el Ajolote'}</b>
            <small>{alumno && estado.dormido ? 'Está dormido. ¡Despiértalo!' : '¡Listo para aprender!'}</small>
          </span>
        </a>
      </aside>

      <header className="barra-top">
        <a href="#/" className="logo logo-movil" aria-label="Selva Matemática">
          <span className="logo-icono"><CabezaKiko tamano={32} /></span>
        </a>
        <div className="pastillas">
          {alumno ? (
            <>
              <span className="pastilla" title="Días seguidos jugando"><I n="fuego" tamano={16} className="c-fuego" /> <span className="solo-ancho">Racha: </span>{estado.rachaDias} día{estado.rachaDias === 1 ? '' : 's'}</span>
              <span className="pastilla" title="Experiencia acumulada"><I n="gema" tamano={16} className="c-gema" /> {estado.xp}</span>
              <button className="pastilla pastilla-estrellas solo-movil" onClick={() => ir('/habitacion')} aria-label={`${estado.estrellas} estrellas`}><I n="estrella" tamano={16} /> {estado.estrellas}</button>
            </>
          ) : (
            <span className="pastilla"><I n="wifi" tamano={16} className="texto-selva" /> <span className="solo-ancho">Sincronizado con Selva</span></span>
          )}
        </div>
        <div className="top-derecha">
          <Avisos estado={estado} rol={rol} />
          <a href="#/perfil" className="boton-redondo avatar" aria-label="Mi perfil"><I n="perfil" /></a>
        </div>
      </header>

      <main className="contenido" id="contenido">
        <Pantalla key={id === 'reto' ? param : ['mochila', 'mascota'].includes(id) ? 'habitacion' : id} retoId={param} />
      </main>
    </div>
  );
}
