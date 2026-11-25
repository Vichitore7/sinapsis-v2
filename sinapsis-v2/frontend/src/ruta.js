// Enrutador mínimo con el hash de la URL (#/mapa, #/reto/m1-r1...).
// Sin dependencias para que funcione igual sin internet y sea fácil de leer.
import { useEffect, useState } from 'react';

export function ir(ruta) {
  window.location.hash = ruta.startsWith('/') ? ruta : `/${ruta}`;
}

function leer() {
  const h = window.location.hash.replace(/^#/, '') || '/';
  const partes = h.split('/').filter(Boolean);
  return { pantalla: partes[0] || 'inicio', param: partes[1] || null };
}

export function useRuta() {
  const [ruta, setRuta] = useState(leer);
  useEffect(() => {
    const cambio = () => {
      setRuta(leer());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', cambio);
    return () => window.removeEventListener('hashchange', cambio);
  }, []);
  return ruta;
}
