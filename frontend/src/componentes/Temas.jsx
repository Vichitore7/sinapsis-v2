// Mundos temáticos (12 niveles de 3 ejercicios + examen general). Cada tema dice cómo se ve su mundo:
// el nodo de cada nivel en el mapa, los 3 premios por nivel, los dibujos de los ejercicios, la decoración y las palabras.
// Mapa.jsx, Reto.jsx y ExamenMundo.jsx usan esto, así un mundo nuevo solo agrega su tema aquí.
import { COLORES_NIVEL, ChinampaIsla, Lirio, PecesNivel, TrajineraNivel, VisualCanal } from './Canal.jsx';
import { CacomixtlesNivel, Monumento, PapelPicado, TRANSPORTES, TransporteNivel, VisualCDMX } from './CDMX.jsx';
import { BanderinesFES, CampusDeco, LUGARES, LugarNivel, TituloFES, TlacuachesNivel, VisualFES, lugarDe } from './FES.jsx';

// Decoración del canal: chinampas y lirios esparcidos por las orillas (top en % del alto del mapa).
const DECO_CANAL = [
  { tipo: 'isla', lado: 'izq', top: '1%', variante: 0 }, { tipo: 'lirio', lado: 'der', top: '6%' },
  { tipo: 'isla', lado: 'der', top: '12%', variante: 1 }, { tipo: 'lirio', lado: 'izq', top: '19%' },
  { tipo: 'isla', lado: 'izq', top: '24%', variante: 2 }, { tipo: 'isla', lado: 'der', top: '35%', variante: 0 },
  { tipo: 'lirio', lado: 'izq', top: '42%' }, { tipo: 'isla', lado: 'izq', top: '48%', variante: 1 },
  { tipo: 'lirio', lado: 'der', top: '55%' }, { tipo: 'isla', lado: 'der', top: '60%', variante: 2 },
  { tipo: 'isla', lado: 'izq', top: '72%', variante: 0 }, { tipo: 'lirio', lado: 'der', top: '78%' },
  { tipo: 'isla', lado: 'der', top: '84%', variante: 1 }, { tipo: 'isla', lado: 'izq', top: '93%', variante: 2 },
];

// Decoración del Centro: lugares representativos y jacarandas en las orillas, y en los huecos del pasto
// cosas de la vida en la calle (puestos, taxi, farol, organillero…) y papel picado cruzando la avenida.
const DECO_CDMX = [
  // Lugares representativos y jacarandas (orillas)
  { tipo: 'monumento', lado: 'izq', top: '1%', cual: 'angel' }, { tipo: 'monumento', lado: 'der', top: '7%', cual: 'palacio' },
  { tipo: 'arbol', lado: 'izq', top: '16%', cual: 'jacaranda' }, { tipo: 'monumento', lado: 'der', top: '22%', cual: 'bellas' },
  { tipo: 'monumento', lado: 'izq', top: '30%', cual: 'castillo' }, { tipo: 'arbol', lado: 'der', top: '38%', cual: 'jacaranda' },
  { tipo: 'monumento', lado: 'izq', top: '45%', cual: 'kiosco' }, { tipo: 'monumento', lado: 'der', top: '52%', cual: 'revolucion' },
  { tipo: 'arbol', lado: 'izq', top: '60%', cual: 'jacaranda' }, { tipo: 'monumento', lado: 'der', top: '67%', cual: 'torre' },
  { tipo: 'monumento', lado: 'izq', top: '75%', cual: 'palacio' }, { tipo: 'arbol', lado: 'der', top: '83%', cual: 'jacaranda' },
  { tipo: 'monumento', lado: 'izq', top: '90%', cual: 'bellas' },
  // La vida en la calle (en los huecos, un poco más adentro)
  { tipo: 'cosa', lado: 'izq', top: '9%', x: '3%', cual: 'tacos' }, { tipo: 'cosa', lado: 'der', top: '14%', x: '4%', cual: 'farol' },
  { tipo: 'cosa', lado: 'izq', top: '24%', x: '5%', cual: 'metro' }, { tipo: 'cosa', lado: 'der', top: '30%', x: '3%', cual: 'alebrije' },
  { tipo: 'cosa', lado: 'izq', top: '38%', x: '3%', cual: 'globero' }, { tipo: 'cosa', lado: 'der', top: '45%', x: '4%', cual: 'banca' },
  { tipo: 'cosa', lado: 'izq', top: '53%', x: '4%', cual: 'taxi' }, { tipo: 'cosa', lado: 'der', top: '60%', x: '3%', cual: 'organillero' },
  { tipo: 'cosa', lado: 'izq', top: '68%', x: '3%', cual: 'elotes' }, { tipo: 'cosa', lado: 'der', top: '75%', x: '4%', cual: 'tacos' },
  { tipo: 'cosa', lado: 'izq', top: '83%', x: '5%', cual: 'xolo' }, { tipo: 'cosa', lado: 'der', top: '91%', x: '3%', cual: 'taxi' },
  { tipo: 'cosa', lado: 'izq', top: '97%', x: '6%', cual: 'farol' },
  // Segunda vuelta para que no se vea vacío
  { tipo: 'cosa', lado: 'izq', top: '13%', x: '1%', cual: 'farol' }, { tipo: 'cosa', lado: 'der', top: '18%', x: '2%', cual: 'xolo' },
  { tipo: 'cosa', lado: 'izq', top: '27.5%', x: '2%', cual: 'elotes' }, { tipo: 'cosa', lado: 'der', top: '34%', x: '2%', cual: 'metro' },
  { tipo: 'cosa', lado: 'izq', top: '42%', x: '1%', cual: 'banca' }, { tipo: 'cosa', lado: 'izq', top: '57%', x: '2%', cual: 'alebrije' },
  { tipo: 'cosa', lado: 'der', top: '64%', x: '2%', cual: 'globero' }, { tipo: 'cosa', lado: 'izq', top: '72%', x: '1%', cual: 'organillero' },
  { tipo: 'cosa', lado: 'der', top: '79%', x: '2%', cual: 'farol' }, { tipo: 'cosa', lado: 'izq', top: '87%', x: '2%', cual: 'metro' },
  { tipo: 'cosa', lado: 'der', top: '96.5%', x: '2%', cual: 'elotes' },
  // Papel picado de lado a lado
  { tipo: 'banderines', top: '3.5%' }, { tipo: 'banderines', top: '49%' }, { tipo: 'banderines', top: '95%' },
];

// Decoración de la FES Aragón: torres, auditorio, la mascota, el hombre de morado, edificios, laboratorios,
// canchas y cafetería en las orillas; alumnos, puestos de comida, bicis y árboles en los huecos del pasto.
const DECO_FES = [
  // Lugares grandes del campus (orillas)
  { tipo: 'monumento', lado: 'izq', top: '4%', cual: 'torres' }, { tipo: 'monumento', lado: 'der', top: '8%', cual: 'mascota' },
  { tipo: 'monumento', lado: 'izq', top: '15%', cual: 'auditorio' }, { tipo: 'monumento', lado: 'der', top: '21%', cual: 'laboratorio' },
  { tipo: 'monumento', lado: 'izq', top: '28%', cual: 'morado' }, { tipo: 'monumento', lado: 'der', top: '34%', cual: 'cafeteria' },
  { tipo: 'monumento', lado: 'izq', top: '41%', cual: 'cancha' }, { tipo: 'monumento', lado: 'der', top: '47%', cual: 'edificio' },
  { tipo: 'monumento', lado: 'izq', top: '54%', cual: 'laboratorio' }, { tipo: 'monumento', lado: 'der', top: '60%', cual: 'torres' },
  { tipo: 'monumento', lado: 'izq', top: '67%', cual: 'edificio' }, { tipo: 'monumento', lado: 'der', top: '73%', cual: 'auditorio' },
  { tipo: 'monumento', lado: 'izq', top: '80%', cual: 'cafeteria' }, { tipo: 'monumento', lado: 'der', top: '86%', cual: 'cancha' },
  { tipo: 'monumento', lado: 'izq', top: '92%', cual: 'mascota' },
  // La vida en el campus (en los huecos, un poco más adentro)
  { tipo: 'cosa', lado: 'der', top: '14%', x: '4%', cual: 'alumnos' }, { tipo: 'cosa', lado: 'izq', top: '10.5%', x: '4%', cual: 'puesto' },
  { tipo: 'cosa', lado: 'izq', top: '22%', x: '3%', cual: 'arbol' }, { tipo: 'cosa', lado: 'der', top: '28%', x: '3%', cual: 'bici' },
  { tipo: 'cosa', lado: 'izq', top: '35%', x: '4%', cual: 'alumnos' }, { tipo: 'cosa', lado: 'der', top: '41%', x: '4%', cual: 'puesto' },
  { tipo: 'cosa', lado: 'izq', top: '48%', x: '3%', cual: 'banca' }, { tipo: 'cosa', lado: 'der', top: '54%', x: '3%', cual: 'alumnos' },
  { tipo: 'cosa', lado: 'izq', top: '61%', x: '4%', cual: 'puesto' }, { tipo: 'cosa', lado: 'der', top: '67%', x: '4%', cual: 'arbol' },
  { tipo: 'cosa', lado: 'izq', top: '74%', x: '3%', cual: 'alumnos' }, { tipo: 'cosa', lado: 'der', top: '80%', x: '3%', cual: 'bici' },
  { tipo: 'cosa', lado: 'izq', top: '86.5%', x: '4%', cual: 'arbol' }, { tipo: 'cosa', lado: 'der', top: '92%', x: '4%', cual: 'alumnos' },
  { tipo: 'cosa', lado: 'izq', top: '97.5%', x: '5%', cual: 'banca' }, { tipo: 'cosa', lado: 'der', top: '97.5%', x: '3%', cual: 'puesto' },
  // Banderines azul y oro de lado a lado
  { tipo: 'banderines', top: '17.5%' }, { tipo: 'banderines', top: '57%' }, { tipo: 'banderines', top: '95%' },
];

const transporteDe = (nivel) => TRANSPORTES[(nivel - 1) % TRANSPORTES.length];

export const TEMAS = {
  xochimilco: {
    clase: 'tema-canal',
    claseMapa: 'canal-mapa',
    Visual: VisualCanal,
    Medallas: PecesNivel,
    Nodo: ({ nivel, estado, children }) => (
      <TrajineraNivel estado={estado} color={COLORES_NIVEL[(nivel - 1) % COLORES_NIVEL.length]}>{children}</TrajineraNivel>
    ),
    nombreNodo: () => 'Trajinera',
    deco: DECO_CANAL,
    Deco: ({ d }) => (d.tipo === 'lirio' ? <Lirio /> : <ChinampaIsla variante={d.variante} />),
    palabras: {
      premios: 'peces',
      encontrar: '¡Pescaste un pez!',
      llenar: (n) => `¡Llenaste la trajinera ${n}!`,
      enEste: 'en esta trajinera',
      siguiente: 'Con los 3 peces zarpa la siguiente trajinera.',
      irSiguiente: 'Ir a la siguiente trajinera',
      examenListo: 'Ya puedes presentar el examen general del canal.',
      diploma: 'Certificado de explorador',
      premioTitulo: 'Subculturas de la CDMX',
    },
    consejos: [
      'Para contar sin perderte, toca cada flor con tu dedo.',
      'Cuenta de 10 en 10 los ramos y luego las flores sueltas.',
      'Sumar es juntar; restar es quitar. ¡Usa tus dedos!',
      'Cada trajinera lleva 3 peces: resuelve sus 3 ejercicios para llenarla.',
    ],
  },
  cdmx: {
    clase: 'tema-cdmx',
    claseMapa: 'canal-mapa cdmx-mapa',
    Visual: VisualCDMX,
    Medallas: CacomixtlesNivel,
    Nodo: ({ nivel, estado, children }) => <TransporteNivel tipo={transporteDe(nivel).id} estado={estado}>{children}</TransporteNivel>,
    nombreNodo: (nivel) => transporteDe(nivel).nombre,
    deco: DECO_CDMX,
    Deco: ({ d }) => (d.tipo === 'banderines' ? <PapelPicado /> : <Monumento tipo={d.cual} />),
    palabras: {
      premios: 'cacomixtles',
      encontrar: '¡Encontraste un cacomixtle!',
      llenar: (n) => `¡Completaste la estación ${n}!`,
      enEste: 'en esta estación',
      siguiente: 'Con los 3 cacomixtles sale el siguiente transporte.',
      irSiguiente: 'Ir al siguiente transporte',
      examenListo: 'Ya puedes presentar el examen general del Centro.',
      diploma: 'Constancia de explorador',
      premioTitulo: '¡Nos vamos a la FES Aragón!',
    },
    consejos: [
      'Para leer un número grande, empieza por las centenas: las cajas de 100.',
      'En la recta numérica, sumar es avanzar y restar es regresar.',
      'Multiplicar es sumar grupos iguales: 3 × 4 es 4 + 4 + 4.',
      'Cada transporte lleva 3 cacomixtles: resuelve sus 3 ejercicios para encontrarlos.',
    ],
  },
  fes: {
    clase: 'tema-fes',
    claseMapa: 'canal-mapa fes-mapa',
    Titulo: TituloFES,
    Visual: VisualFES,
    Medallas: TlacuachesNivel,
    Nodo: ({ nivel, estado, children }) => <LugarNivel tipo={lugarDe(nivel)} estado={estado}>{children}</LugarNivel>,
    nombreNodo: (nivel) => LUGARES[lugarDe(nivel)].nombre,
    deco: DECO_FES,
    Deco: ({ d }) => (d.tipo === 'banderines' ? <BanderinesFES /> : <CampusDeco tipo={d.cual} />),
    palabras: {
      premios: 'tlacuaches',
      encontrar: '¡Encontraste un tlacuache!',
      llenar: (n) => `¡Recorriste el lugar ${n} del campus!`,
      enEste: 'en este lugar del campus',
      siguiente: 'Con los 3 tlacuaches se abre el siguiente lugar del campus.',
      irSiguiente: 'Ir al siguiente lugar',
      examenListo: 'Ya puedes presentar el examen general de la FES.',
      diploma: 'Constancia de universitario',
      premioTitulo: '¡Abrígate, nos vamos al Nevado de Toluca!',
    },
    consejos: [
      'Para comparar números de 4 cifras, empieza por los millares.',
      'Una fracción con MÁS pedazos tiene pedazos más chicos: 1/8 es menos que 1/4.',
      'Dividir es repartir en partes iguales. Compruébalo multiplicando.',
      'Cada lugar del campus esconde 3 tlacuaches: resuelve sus 3 ejercicios para encontrarlos.',
    ],
  },
};

/** El tema de un mundo, o null si es un mundo de los de antes (multiplicación con monedas). */
export const temaDe = (mundo) => (mundo && TEMAS[mundo.tema]) || null;

const FASES = { concreto: 'Concreto', 'pictórico': 'Pictórico', abstracto: 'Abstracto' };

/** Chip con la fase CPA del nivel (concreto → pictórico → abstracto), si el nivel la tiene. */
export function ChipFase({ fase }) {
  if (!fase) return null;
  return <span className={`chip chip-fase fase-${fase === 'pictórico' ? 'pictorico' : fase}`} title="Fase del método CPA">{FASES[fase] || fase}</span>;
}
