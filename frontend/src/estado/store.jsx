// Estado global de la app, guardado en el dispositivo (localStorage) para que funcione sin internet.
// Cuando exista backend, aquí es donde se sincroniza.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { estadoInicial } from '../logica/juego.js';

const CLAVE = 'selva-matematica:v1';
const Contexto = createContext(null);

function cargar() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return estadoInicial();
    // Se mezcla con el inicial para que los campos nuevos tengan valor por defecto.
    const guardado = JSON.parse(crudo);
    const base = estadoInicial();
    return { ...base, ...guardado, stats: { ...base.stats, ...guardado.stats }, escaner: { ...base.escaner, ...guardado.escaner } };
  } catch {
    return estadoInicial();
  }
}

export function ProveedorEstado({ children }) {
  const [estado, setEstado] = useState(cargar);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch {
      // Sin espacio o almacenamiento bloqueado: la app sigue funcionando en memoria.
    }
  }, [estado]);

  /** actualizar(fn) recibe una función estado -> estado nuevo. */
  const actualizar = useCallback((fn) => setEstado((s) => fn(s)), []);
  const reiniciar = useCallback(() => setEstado(estadoInicial()), []);

  return <Contexto.Provider value={{ estado, actualizar, reiniciar }}>{children}</Contexto.Provider>;
}

export function useJuego() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useJuego debe usarse dentro de <ProveedorEstado>');
  return ctx;
}
