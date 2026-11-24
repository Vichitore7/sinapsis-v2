// El contenido (mundos y retos) ahora vive en el BACKEND: backend/app/contenido.py.
// El frontend lo recibe de GET /api/contenido (sin respuestas) y lo guarda en caché para el Modo Aula sin internet.
// Aquí solo quedan datos de presentación y ayudas para buscar.

export const STICKERS = {
  mochila: { nombre: 'Mochila de la selva' },
  bufanda: { nombre: 'Bufanda del mercado' },
  sombrero: { nombre: 'Sombrero del río' },
};

// Stickers especiales (temáticos): se ven y se le ponen a Kiko en Perfil > Stickers.
// Los de traje típico son el regalo de inicio de sesión (al crear la cuenta).
export const TRAJES = {
  trajinero: { nombre: 'Traje de trajinero', origen: 'Inicio de sesión', detalle: 'Sombrero de palma, camisa de manta, faja tejida y garrocha de bambú.' },
  trajinera: { nombre: 'Traje de trajinera', origen: 'Inicio de sesión', detalle: 'Pañoleta bordada, trenzas, blusa con flores, falda de rayas y remo.' },
};

// Errores típicos que el maestro puede marcar en el Modo Aula (sin internet).
export const ERRORES_TIPICOS = [
  { id: 'sumo', texto: 'Sumó en vez de multiplicar', refuerzo: 'Repasa con monedas por qué {a} × {b} es juntar {a} montones de {b}. Usa bolsitas con el grupo antes del siguiente reto.' },
  { id: 'calculo', texto: 'Error de cálculo', refuerzo: 'Practiquen contar de {b} en {b} en voz alta, con las monedas en el pizarrón.' },
  { id: 'otro', texto: 'Otro', refuerzo: 'Pide a 2 alumnos que expliquen su procedimiento en el pizarrón y compárenlos.' },
];

export function buscarReto(mundos, id) {
  for (const m of mundos) {
    const r = m.retos.find((x) => x.id === id);
    if (r) return r;
  }
  return null;
}

export function buscarMundo(mundos, id) {
  return mundos.find((m) => m.id === id) || null;
}

export function formatoNumero(n, moneda) {
  return moneda ? `$${n}` : String(n);
}
