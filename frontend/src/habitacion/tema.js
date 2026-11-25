import { useEffect, useState } from 'react';

export function esNoche(tema, sistemaOscuro = false) {
  return tema === 'oscuro' || ((tema === 'sistema' || !tema) && sistemaOscuro);
}

// Solo presentación. No utiliza el estado dormido ni modifica el progreso.
export function useNocheHabitacion(tema) {
  const [sistema, setSistema] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const cambio = () => setSistema(media.matches);
    cambio();
    if (media.addEventListener) { media.addEventListener('change', cambio); return () => media.removeEventListener('change', cambio); }
    media.addListener(cambio); return () => media.removeListener(cambio);
  }, []);
  return esNoche(tema, sistema);
}

export function rutaIlustracion(ruta, noche = false) {
  return noche && /^(fondos|stickers)\//.test(ruta) ? `noche/${ruta}` : ruta;
}
