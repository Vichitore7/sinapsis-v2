// Estado global de la app.
//
// - Lo del juego (estrellas, progreso, ajolote, mapa) viene del SERVIDOR: es la fuente de verdad.
// - Lo que funciona sin internet (Modo Aula del maestro, escáner) se guarda en el dispositivo,
//   separado por usuario.
// - El contenido se guarda en caché para que el Modo Aula funcione sin conexión.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adaptarEstado, adaptarMundos, api, ErrorApi } from '../api.js';

const Contexto = createContext(null);
const CLAVE_CONTENIDO = 'selva:contenido:v1';

function localVacio() {
  return { celebrando: false, escaner: { pendientes: [], historial: [] }, aula: null };
}

function leer(clave, porDefecto) {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : porDefecto;
  } catch {
    return porDefecto;
  }
}

function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin espacio o almacenamiento bloqueado: la app sigue funcionando en memoria.
  }
}

export function ProveedorEstado({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorRed, setErrorRed] = useState(null);
  const [mundosCrudos, setMundosCrudos] = useState(() => leer(CLAVE_CONTENIDO, null));
  const [juego, setJuego] = useState(null);
  const [local, setLocal] = useState(localVacio);
  const [tema, setTema] = useState('sistema');

  const claveLocal = usuario ? `selva:local:${usuario.id}` : null;
  const mundos = useMemo(() => (mundosCrudos ? adaptarMundos(mundosCrudos) : []), [mundosCrudos]);

  const cargarTodo = useCallback(async (u) => {
    setUsuario(u);
    setLocal({ ...localVacio(), ...leer(`selva:local:${u.id}`, {}) });
    const [c, a] = await Promise.all([api.contenido(), api.ajustes()]);
    setMundosCrudos(c.mundos);
    guardar(CLAVE_CONTENIDO, c.mundos);
    setTema(a.tema);
    if (u.rol === 'alumno') setJuego(adaptarEstado(await api.estado()));
  }, []);

  // Al abrir la app: ¿hay sesión?
  useEffect(() => {
    (async () => {
      try {
        const { usuario: u } = await api.yo();
        await cargarTodo(u);
      } catch (e) {
        if (e instanceof ErrorApi && e.estado === 0) setErrorRed(e.message);
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    })();
  }, [cargarTodo]);

  useEffect(() => {
    if (claveLocal) guardar(claveLocal, local);
  }, [claveLocal, local]);

  // Tema: 'sistema' lo resuelve el navegador con prefers-color-scheme (ver app.css).
  useEffect(() => {
    if (tema === 'sistema') document.documentElement.removeAttribute('data-tema');
    else document.documentElement.setAttribute('data-tema', tema);
  }, [tema]);

  const entrar = useCallback(async (u) => {
    setCargando(true);
    try {
      await cargarTodo(u);
    } finally {
      setCargando(false);
    }
  }, [cargarTodo]);

  const salir = useCallback(async () => {
    try { await api.logout(); } catch { /* aunque falle la red, se cierra localmente */ }
    setUsuario(null);
    setJuego(null);
    setLocal(localVacio());
    window.location.hash = '/';
  }, []);

  /** Recibe la respuesta de la API (formato del servidor) y actualiza el juego. */
  const aplicarServidor = useCallback((resumen) => setJuego(adaptarEstado(resumen)), []);

  /** Para lo que vive solo en el dispositivo (escáner, Modo Aula, animaciones). */
  const actualizar = useCallback((fn) => setLocal((s) => fn(s)), []);

  const cambiarTema = useCallback(async (t) => {
    setTema(t);
    try { await api.guardarAjustes({ tema: t }); } catch { /* se queda local si no hay red */ }
  }, []);

  // `estado` junta lo del servidor y lo local con la forma que usan las pantallas.
  const estado = useMemo(
    () => (juego ? { ...juego, ...local } : { ...local, estrellas: 0, stickers: [], mundosTerminados: [] }),
    [juego, local]
  );

  const valor = {
    usuario, cargando, errorRed, mundos, estado, tema,
    entrar, salir, aplicarServidor, actualizar, cambiarTema,
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useJuego() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useJuego debe usarse dentro de <ProveedorEstado>');
  return ctx;
}
