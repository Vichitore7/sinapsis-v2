// Contenido de la aventura. Para agregar retos o mundos solo se edita este archivo.
//
// Cada reto es una multiplicación "a montones de b": a × b.
//   a, b        números del reto (la respuesta es a × b y NO se escribe aquí)
//   moneda      true si se escribe con "$"
//   etapaMin    etapa mínima de apoyo visual (1 monedas, 2 bolsitas, 3 barras, 4 solo números)
//   pistas      opcional: 3 preguntas socráticas propias; si no hay, se generan (ver logica/pistas.js)
//   errores     errores típicos para el Modo Aula (el primero se detecta solo: "sumó en vez de multiplicar")
//
// Todo el contenido está en estado BORRADOR: falta la revisión de la maestra o el maestro.

export const MUNDOS = [
  {
    id: 'm1',
    numero: 1,
    nombre: 'La tiendita',
    entrada: '¡Bienvenido a la tiendita, explorador! Aquí las monedas cuentan historias.',
    concepto: 'Multiplicación con monedas',
    sticker: 'mochila',
    retos: [
      {
        id: 'm1-r1',
        titulo: 'Primera compra',
        enunciado: 'Teo compra 3 paletas. Cada una cuesta $6. ¿Cuánto paga en total?',
        a: 3, b: 6, moneda: true, objeto: 'paletas', etapaMin: 1,
        ejemplo: { a: 2, b: 5 },
      },
      {
        id: 'm1-r2',
        titulo: 'Los chicles del recreo',
        enunciado: 'Luna compra 4 chicles de $3 cada uno. ¿Cuánto gasta?',
        a: 4, b: 3, moneda: true, objeto: 'chicles', etapaMin: 1,
      },
      {
        id: 'm1-r3',
        titulo: 'Tortas para todos',
        enunciado: 'Mía lleva 2 tortas a la escuela. Cada torta cuesta $12. ¿Cuánto pagó?',
        a: 2, b: 12, moneda: true, objeto: 'tortas', etapaMin: 1,
      },
      {
        id: 'm1-r4',
        titulo: 'Aguas frescas',
        enunciado: 'Beto invita 5 aguas frescas de $8. ¿Cuánto paga en la tiendita?',
        a: 5, b: 8, moneda: true, objeto: 'aguas', etapaMin: 1,
      },
    ],
  },
  {
    id: 'm2',
    numero: 2,
    nombre: 'El mercado',
    entrada: '¡El mercado abre sus puestos! Aquí las cuentas crecen, explorador.',
    concepto: 'Multiplicación con bolsitas y barras',
    sticker: 'bufanda',
    retos: [
      {
        id: 'm2-r1',
        titulo: 'Misión en el mercado',
        enunciado: 'Kiko quiere comprar 3 mangos. Cada uno cuesta $12. ¿Cuánto paga en total?',
        a: 3, b: 12, moneda: true, objeto: 'mangos', etapaMin: 1,
      },
      {
        id: 'm2-r2',
        titulo: 'El puesto de aguacates',
        enunciado: 'Sol compra 4 kilos de aguacate. El kilo cuesta $15. ¿Cuánto paga?',
        a: 4, b: 15, moneda: true, objeto: 'kilos', etapaMin: 2,
      },
      {
        id: 'm2-r3',
        titulo: 'Pasajes de regreso',
        enunciado: 'Una familia de 6 toma el camión. Cada pasaje cuesta $9. ¿Cuánto pagan?',
        a: 6, b: 9, moneda: true, objeto: 'pasajes', etapaMin: 2,
      },
      {
        id: 'm2-r4',
        titulo: 'La receta de la abuela',
        enunciado: 'La abuela compra 3 paquetes de tortillas de $22. ¿Cuánto gasta?',
        a: 3, b: 22, moneda: true, objeto: 'paquetes', etapaMin: 3,
      },
    ],
  },
  {
    id: 'm3',
    numero: 3,
    nombre: 'El río de las fracciones',
    entrada: 'Próximamente: el equipo está preparando este mundo.',
    concepto: 'Fracciones (pendiente)',
    sticker: 'sombrero',
    proximamente: true,
    retos: [],
  },
];

export const STICKERS = {
  mochila: { nombre: 'Mochila de la selva', mundo: 'm1' },
  bufanda: { nombre: 'Bufanda del mercado', mundo: 'm2' },
  sombrero: { nombre: 'Sombrero del río', mundo: 'm3' },
  aula: { nombre: 'Medalla del salón', mundo: null },
};

// Errores típicos que el maestro puede marcar en el Modo Aula.
export const ERRORES_TIPICOS = [
  { id: 'sumo', texto: 'Sumó en vez de multiplicar', refuerzo: 'Repasa con monedas por qué {a} × {b} es juntar {a} montones de {b}. Usa bolsitas con el grupo antes del siguiente reto.' },
  { id: 'calculo', texto: 'Error de cálculo', refuerzo: 'Practiquen contar de {b} en {b} en voz alta, con las monedas en el pizarrón.' },
  { id: 'otro', texto: 'Otro', refuerzo: 'Pide a 2 alumnos que expliquen su procedimiento en el pizarrón y compárenlos.' },
];

export function todosLosRetos() {
  return MUNDOS.flatMap((m) => m.retos.map((r) => ({ ...r, mundo: m })));
}

export function buscarReto(id) {
  return todosLosRetos().find((r) => r.id === id) || null;
}

export function buscarMundo(id) {
  return MUNDOS.find((m) => m.id === id) || null;
}

export function formatoNumero(n, moneda) {
  return moneda ? `$${n}` : String(n);
}
