// El contenido (mundos y retos) ahora vive en el BACKEND: backend/app/contenido.py.
// El frontend lo recibe de GET /api/contenido (sin respuestas) y lo guarda en caché para el Modo Aula sin internet.
// Aquí solo quedan datos de presentación y ayudas para buscar.

export const STICKERS = {
  flor: { nombre: 'Flor de la chinampa' },
  tarjeta: { nombre: 'Tarjeta del Metro' },
  peluche: { nombre: 'Peluche de la mascota de la FES' },
  esfera: { nombre: 'Bolita de nieve del Nevado' },
  mochila: { nombre: 'Mochila de la selva' },
  bufanda: { nombre: 'Bufanda del mercado' },
  sombrero: { nombre: 'Sombrero del río' },
};

// Stickers especiales (temáticos): se ven y se le ponen a Mix en Perfil > Stickers.
// Los de traje típico son el regalo de inicio de sesión (al crear la cuenta).
export const TRAJES = {
  trajinero: { nombre: 'Traje de trajinero', origen: 'Inicio de sesión', detalle: 'Sombrero de palma, camisa de manta, faja tejida y garrocha de bambú.' },
  trajinera: { nombre: 'Traje de trajinera', origen: 'Inicio de sesión', detalle: 'Pañoleta bordada, trenzas, blusa con flores, falda de rayas y remo.' },
  // Rumbo a la FES Aragón: premio fijo del examen del Mundo 2 (sudadera azul con patita dorada, tenis y audífonos).
  'fes-gorra': { nombre: 'FES Aragón: sudadera y gorra', origen: 'Constancia Mundo 2', detalle: 'Sudadera azul con patita dorada, gorra, pantalón, tenis y audífonos.' },
  'fes-cabello': { nombre: 'FES Aragón: sudadera y cabello largo', origen: 'Constancia Mundo 2', detalle: 'Sudadera azul con patita dorada, cabello largo, falda, tenis y audífonos.' },
  // Rumbo al Nevado de Toluca: premio fijo del examen del Mundo 3 (ropa para el frío).
  'nevado-gorro': { nombre: 'Nevado: chamarra y gorro', origen: 'Constancia Mundo 3', detalle: 'Gorro tejido con pompón, chamarra acolchonada, bufanda, guantes y botas para la nieve.' },
  'nevado-orejeras': { nombre: 'Nevado: abrigo y orejeras', origen: 'Constancia Mundo 3', detalle: 'Orejeras peludas, abrigo largo con botones, bufanda, guantes y botas para la nieve.' },
  // Rumbo a las Grutas de Tolantongo: premio fijo del examen del Mundo 4 (trajes de baño).
  'tolantongo-short': { nombre: 'Tolantongo: short de baño y visera', origen: 'Constancia Mundo 4', detalle: 'Visera, short de baño con flores y chanclas para el balneario.' },
  'tolantongo-completo': { nombre: 'Tolantongo: traje de baño completo y goggles', origen: 'Constancia Mundo 4', detalle: 'Goggles, traje de baño a rayas, flotador y chanclas para el balneario.' },
  // Subculturas de la CDMX: premio del examen general del Mundo 1 (2 al azar, de estilos distintos).
  // Los nombres dicen cómo se ve el traje; cualquiera puede usar cualquiera.
  ...Object.fromEntries([
    ['emo-rayas', 'Emo de rayas', 'Fleco negro de lado, playera a rayas y cinturón de estoperoles.'],
    ['emo-mono', 'Emo con moño', 'Fleco negro con mechón rosa, moño y falda a cuadros.'],
    ['hippie-guitarra', 'Hippie con guitarra', 'Banda en la frente, lentes redondos, ropa de colores y guitarra.'],
    ['hippie-flores', 'Hippie con flores', 'Corona de flores, lentes redondos y ropa de colores con el símbolo de paz.'],
    ['punk-verde', 'Punk de cresta verde', 'Cresta de picos, chamarra negra con estoperoles y botas.'],
    ['punk-rosa', 'Punk de cresta rosa', 'Cresta rosa, chamarra con estoperoles y cuadros rojos.'],
    ['skate-gorra', 'Skate de gorra', 'Gorra hacia atrás, sudadera con capucha y patineta.'],
    ['skate-gorro', 'Skate de gorro', 'Gorro tejido con pompón, sudadera grande y patineta.'],
    ['manif-xochimilco', 'Manifestante por Xochimilco', 'Gorra, paliacate y pancarta "¡Cuidemos Xochimilco!".'],
    ['manif-ajolote', 'Manifestante por el ajolote', 'Paliacate en la cabeza y pancarta "¡Salvemos al ajolote!".'],
    ['ska-sombrero', 'Ska de sombrerito', 'Sombrerito negro, camisa blanca, tirantes y cuadros blanco y negro.'],
    ['ska-cuadros', 'Ska de cuadros', 'Diadema y ropa a cuadros blanco y negro, con tirantes.'],
    ['rap-gorra', 'Rap de gorra plana', 'Gorra de visera plana, cadena dorada, playera grande y grabadora.'],
    ['rap-chongo', 'Rap de chongo', 'Chongo alto, arracadas doradas, sudadera y micrófono.'],
    ['rock-chopo', 'Rock del Chopo', 'Cabello largo, chaleco negro, playera con rayo y guitarra eléctrica.'],
    ['rock-mezclilla', 'Rock de mezclilla', 'Lentes de estrella, chamarra de mezclilla con parches y guitarra.'],
    ['dark-capa', 'Dark de capa', 'Capucha y capa negra con luna plateada.'],
    ['dark-encaje', 'Dark de encaje', 'Tocado negro con rosas moradas y vestido de encaje.'],
    ['lucha-azul', 'Lucha libre: máscara azul', 'Máscara azul con relámpagos y capa roja de campeón.'],
    ['lucha-rosa', 'Lucha libre: máscara rosa', 'Máscara rosa con flamas doradas y capa morada.'],
  ].map(([id, nombre, detalle]) => [id, { nombre, origen: 'Certificado Mundo 1', detalle }])),
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
