// Ayudas para MOSTRAR el estado del juego.
// Las reglas (estrellas, medidores, cofres, escalera de apoyo) viven en el backend: backend/app/juego.py.
// Aquí solo se interpreta lo que manda el servidor.

export const VALORES = {
  metaSalon: 60, // VALOR INICIAL: estrellas para el premio del salón (Modo Aula sin internet)
  costos: { alimentar: 1, jugar: 2, limpiar: 0, descansar: 0 }, // deben coincidir con backend/app/juego.py
};

const MEDIDORES = ['comida', 'pecera', 'alegria'];

export function hoy(fecha = new Date()) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diasEntre(desde, hasta) {
  if (!desde) return 0;
  const a = new Date(`${desde}T00:00:00`);
  const b = new Date(`${hasta}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

/** Etapa de apoyo visual para un reto: 1 monedas, 2 bolsitas, 3 barras, 4 solo números. */
export function etapaParaReto(reto, etapaApoyo) {
  let etapa = Math.max(reto.etapaMin || 1, etapaApoyo || 1);
  if (etapa === 1 && reto.b > 12) etapa = 2; // más de 12 monedas por montón: bolsitas
  return Math.min(etapa, 4);
}

/** El medidor que el ajolote pide (el más bajo, solo si está en 2 marcas o menos). */
export function loQuePide(bienestar) {
  if (!bienestar) return null;
  let peor = null;
  for (const m of MEDIDORES) {
    if (bienestar[m] <= 2 && (peor === null || bienestar[m] < bienestar[peor])) peor = m;
  }
  return peor;
}

export function estadoAjolote(estado) {
  if (estado.dormido) return 'dormido';
  if (estado.celebrando) return 'celebrando';
  if (loQuePide(estado.bienestar)) return 'curioso';
  return 'feliz';
}

/** Nodos de un mundo según el mapa que calcula el servidor. */
export function nodosDeMundo(estado, mundo) {
  const info = estado.mapa?.[mundo.id];
  if (!info) {
    return { nodos: mundo.retos.map((r) => ({ reto: r, estado: 'bloqueado' })), cofre: 'bloqueado', abierto: false };
  }
  return {
    nodos: mundo.retos.map((r) => ({ reto: r, estado: info.nodos[r.id] || 'bloqueado' })),
    cofre: info.cofre,
    abierto: info.abierta,
  };
}

export function retosCompletadosDe(estado, mundo) {
  return mundo.retos.filter((r) => estado.completados?.[r.id]).length;
}

/** El siguiente lugar a donde ir: un reto, un cofre o null si todo está hecho. */
export function siguientePaso(estado, mundos) {
  for (const mundo of mundos) {
    if (mundo.proximamente) continue;
    const { nodos, cofre, abierto } = nodosDeMundo(estado, mundo);
    if (!abierto) continue;
    const actual = nodos.find((n) => n.estado === 'actual');
    if (actual) return { tipo: 'reto', reto: actual.reto, mundo };
    if (cofre === 'actual') return { tipo: 'cofre', mundo };
  }
  return null;
}

export function retoJugable(estado, reto) {
  if (!reto) return false;
  return (estado.mapa?.[reto.mundo.id]?.nodos?.[reto.id] || 'bloqueado') !== 'bloqueado';
}
