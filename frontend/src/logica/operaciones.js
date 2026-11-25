// Operaciones del escáner: enteros (× + − ÷ con residuo) y fracciones (× + − ÷).
// Es el espejo de backend/app/operaciones.py: si cambias una regla aquí, cámbiala también allá.
//
// Una operación es { a, op, b, c, residuo } con los números como texto: '17' o '3/4'.
// El diagnóstico NUNCA regresa el resultado al alumno: solo en qué paso se torció y una pregunta.
import { diagnosticar as diagnosticarEnteros, normalizarOperador } from './diagnostico.js';

export const OPS = ['×', '+', '−', '÷'];

function mcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a) || 1;
}

/** Fracción reducida { n, d } (d > 0). */
function fr(n, d = 1) {
  const g = mcd(n, d);
  return { n: n / g, d: d / g };
}

const iguales = (x, y) => x.n * y.d === y.n * x.d;
const suma = (x, y) => fr(x.n * y.d + y.n * x.d, x.d * y.d);
const resta = (x, y) => fr(x.n * y.d - y.n * x.d, x.d * y.d);
const mult = (x, y) => fr(x.n * y.n, x.d * y.d);
const divi = (x, y) => fr(x.n * y.d, x.d * y.n);
const menor = (x, y) => x.n * y.d < y.n * x.d;

/** '17' -> {n:17,d:1}; '3/4' -> {n:3,d:4} (sin reducir). null si no es natural ni fracción. */
export function numero(texto) {
  const m = /^\s*(\d{1,7})\s*(?:\/\s*(\d{1,7}))?\s*$/.exec(String(texto ?? ''));
  if (!m) return null;
  const d = m[2] === undefined ? 1 : Number(m[2]);
  return d ? { n: Number(m[1]), d } : null;
}

export const esFraccion = (t) => String(t ?? '').includes('/');
export const textoDe = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);

export function normalizarOp(op) {
  if (op === '÷' || op === '/' || op === ':') return '÷';
  return normalizarOperador(op);
}

/** 'enteros' (× + −, lo de siempre), 'division' (enteros con ÷) o 'fracciones'. */
export function tipoDe(op) {
  if (['a', 'b', 'c'].some((k) => esFraccion(op[k]))) return 'fracciones';
  return op.op === '÷' ? 'division' : 'enteros';
}

/** Normaliza (acepta números o textos) o regresa null si el escáner no la puede revisar. */
export function validar(op) {
  const o = normalizarOp(op.op);
  const limpio = (v) => String(v ?? '').replace(/\s/g, '');
  const a = numero(op.a);
  const b = numero(op.b);
  const c = limpio(op.c);
  const residuo = limpio(op.residuo);
  if (!OPS.includes(o) || !a || !b || (c && !numero(c))) return null;
  if (o === '÷' && b.n === 0) return null;
  if (o === '−' && menor(a, b)) return null; // los negativos llegan en secundaria
  const salida = { a: limpio(op.a), op: o, b: limpio(op.b), c, residuo: '' };
  if (tipoDe(salida) === 'division' && residuo) {
    if (!/^\d+$/.test(residuo)) return null;
    salida.residuo = residuo;
  }
  return salida;
}

/** Lo correcto (solo para comparar; nunca se le muestra al alumno). */
export function resultado(op) {
  const a = numero(op.a);
  const b = numero(op.b);
  if (tipoDe(op) === 'division') {
    return { cociente: Math.floor(a.n / b.n), residuo: a.n % b.n, valor: fr(a.n, b.n) };
  }
  const valor = { '×': mult, '+': suma, '−': resta, '÷': divi }[op.op](a, b);
  return { valor };
}

function pasos(...textos) {
  return textos.map((texto) => ({ texto, estado: 'ok' }));
}

function torcer(ps, en) {
  ps[en - 1].estado = 'casi';
  for (let i = en; i < ps.length; i++) ps[i].estado = 'pendiente';
}

const mal = (ps, en, tipoError, pregunta) => {
  torcer(ps, en);
  return { correcto: false, pasos: ps, pasoTorcido: en, tipoError, pregunta };
};

/** Errores típicos de enteros (espejo de _errores_tipicos en operaciones.py). */
function erroresTipicos(d, a, o, b, c) {
  if (d.correcto || d.tipoError === 'sumo') return d;
  const bien = { '+': a + b, '−': a - b, '×': a * b }[o];
  let nuevo = null;
  if (o === '+' && bien - c === 10 && (a % 10) + (b % 10) >= 10) {
    nuevo = ['no_llevo', `Suma primero las unidades: ${a % 10} + ${b % 10}. ¿Te alcanzó para formar otra decena? ¿Dónde la pusiste?`];
  } else if (o === '−' && c - bien === 10 && (a % 10) < (b % 10)) {
    nuevo = ['no_pidio', `En las unidades, ¿te alcanza para quitar ${b % 10} de ${a % 10}? Si no, ¿a quién le pides prestado?`];
  } else if (o === '×' && b && c % b === 0 && Math.abs(c / b - a) === 1) {
    nuevo = ['un_grupo', `Tu ${c} son ${c / b} grupos de ${b}. ¿Cuántos grupos de ${b} necesitas juntar en ${a} × ${b}?`];
  } else if (o === '×' && a && c % a === 0 && Math.abs(c / a - b) === 1) {
    nuevo = ['un_grupo', `Tu ${c} son ${c / a} grupos de ${a}. ¿Cuántos grupos de ${a} necesitas juntar en ${a} × ${b}?`];
  }
  return nuevo ? { ...d, tipoError: nuevo[0], pregunta: nuevo[1] } : d;
}

/**
 * Mismo formato que diagnostico.js: { correcto, pasos, pasoTorcido, tipoError, pregunta }.
 * Para enteros con × + − usa el diagnóstico de siempre.
 */
export function diagnosticarOperacion(op) {
  const t = tipoDe(op);
  const { a, op: o, b, c } = op;
  if (t === 'enteros') {
    return erroresTipicos(diagnosticarEnteros({ a: Number(a), op: o, b: Number(b), c: Number(c) }), Number(a), o, Number(b), Number(c));
  }
  const bien = (ps, pregunta = null) => ({ correcto: true, pasos: ps, pasoTorcido: null, tipoError: null, pregunta });

  if (t === 'division') {
    const A = Number(a);
    const B = Number(b);
    const q = Number(c);
    const r = Number(op.residuo || 0);
    const ps = pasos(`Repartir ${A} entre ${B}`, `¿Cuántas veces cabe el ${B}?`, `Sobran ${r}`, 'Comprobar');
    const { cociente, residuo } = resultado(op);
    if (q === cociente && r === residuo) return bien(ps);
    if (r >= B) return mal(ps, 3, 'residuo_grande', `Te sobraron ${r}. ¿Con lo que sobra todavía alcanza para otro grupo de ${B}?`);
    if (q === cociente) return mal(ps, 3, 'residuo', `Comprueba: ¿${B} × ${q} + ${r} da ${A}?`);
    return mal(ps, 2, 'cociente', `Comprueba al revés: ¿${B} × ${q} + ${r} da ${A}?`);
  }

  // Fracciones
  const fa = numero(a);
  const fb = numero(b);
  const fc = numero(c);
  const { valor } = resultado(op);
  const paso2 = { '+': 'Partes del mismo tamaño', '−': 'Partes del mismo tamaño', '×': 'Numeradores y denominadores', '÷': 'Dar la vuelta a la segunda' }[o];
  const ps = pasos(`Datos: ${a} ${o} ${b}`, paso2, `= ${c}`, 'Resultado');
  if (iguales(fc, valor)) {
    const sinSimplificar = esFraccion(c) && fr(fc.n, fc.d).d !== fc.d;
    return bien(ps, sinSimplificar ? '¡Está bien! ¿Se puede escribir con números más pequeños?' : null);
  }
  if ((o === '+' || o === '−') && fa.d !== fb.d) {
    const juntos = o === '+'
      ? fr(fa.n + fb.n, fa.d + fb.d)
      : fr(Math.max(fa.n - fb.n, 0), Math.max(fa.d - fb.d, 1));
    if (iguales(fc, juntos)) {
      return mal(ps, 2, 'sumo_denominadores', `¿Un pedazo de 1/${fa.d} y uno de 1/${fb.d} son del mismo tamaño? Antes de juntarlos, ¿cómo los haces iguales?`);
    }
    return mal(ps, 2, 'denominador', `¿Qué denominador pueden tener ${a} y ${b} para que sus partes sean del mismo tamaño?`);
  }
  if (o === '÷' && iguales(fc, mult(fa, fb))) {
    return mal(ps, 2, 'multiplico', `Multiplicaste. Para dividir entre ${b}, ¿qué le pasa primero a la segunda fracción?`);
  }
  const preguntas = {
    '+': `Si las partes ya son iguales, ¿cuántas partes juntas en total al sumar ${a} + ${b}?`,
    '−': `Si las partes ya son iguales, ¿cuántas partes quedan al quitar ${b} de ${a}?`,
    '×': '¿Multiplicaste numerador por numerador y denominador por denominador?',
    '÷': `Comprueba al revés: ¿${c} × ${b} da ${a}?`,
  };
  return mal(ps, 3, 'calculo', preguntas[o]);
}

/** ¿El alumno ya dijo el resultado correcto en este texto? (para felicitarlo en el chat sin IA) */
export function yaLoDijo(op, texto) {
  const r = resultado(op);
  if (r.cociente !== undefined) return (texto.match(/\d+/g) || []).map(Number).includes(r.cociente);
  for (const [, n, d] of texto.matchAll(/(\d+)\s*\/\s*(\d+)/g)) {
    if (Number(d) && iguales(fr(Number(n), Number(d)), r.valor)) return true;
  }
  return r.valor.d === 1 && (texto.match(/\d+/g) || []).map(Number).includes(r.valor.n);
}

// Espejo de _DUDA en backend/app/tutor.py: "¿será 42?", "creo que 42", "no estoy seguro". Dijo el número, pero no lo
// afirma: no se confirma ni se niega. (En JS \b no reconoce letras con acento, por eso se usa \p{L}.)
const DUDA = /\?|(?:^|[^\p{L}])(?:ser[aá]|creo|tal vez|quiz[aá]s?|a lo mejor|puede ser|no s[eé])(?![\p{L}])|no (?:estoy|s[eé]) segur|\d\s*(?:o|ó|u)\s*\d/iu;
// Espejo de _NEGADO en backend/app/estrategia.py: "no es 42", "no me da 42", "42 no". Se quitan antes de buscar la
// respuesta ("no es 41, es 42" sí cuenta como 42).
const NEGADO = /(?<![\p{L}])no\s+(?:es|da|sale|son|ser[ií]a|era|fue|me\s+(?:da|sale|dio|sali[oó]))\s+(?:el\s+|de\s+)?\d+(?:\s*\/\s*\d+)?|\d+(?:\s*\/\s*\d+)?\s+no(?![\p{L}])/giu;

export function quitarNegados(texto) {
  return (texto || '').replace(NEGADO, ' ');
}

export function conDuda(texto) {
  return DUDA.test(texto || '');
}

/** ¿Con este mensaje resolvió su operación? Dijo el resultado correcto y lo afirma (no con duda). Es la misma regla
 *  del servidor (_anotar_si_lo_resolvio en backend/app/tutor.py), para reconocer el cierre aun sin conexión. */
export function resolvioEnChat(op, texto) {
  return !diagnosticarOperacion(op).correcto && yaLoDijo(op, quitarNegados(texto)) && !conDuda(texto);
}

/** Después de resolverla (ya sabe el resultado), sin conexión: por qué da eso, en palabras sencillas. */
export function explicacionResuelta(op) {
  const r = resultado(op);
  const texto = (v) => (v.d === 1 ? `${v.n}` : `${v.n}/${v.d}`);
  const t = tipoDe(op);
  if (t === 'division') {
    return `${op.a} ÷ ${op.b} pregunta cuántos grupos de ${op.b} caben en ${op.a}: caben ${r.cociente}${r.residuo ? ` y sobran ${r.residuo}` : ''}.`;
  }
  if (t === 'fracciones') {
    const como = {
      '+': 'primero partimos las dos en pedazos del mismo tamaño (el mismo denominador) y luego juntamos los pedazos',
      '−': 'primero partimos las dos en pedazos del mismo tamaño (el mismo denominador) y luego quitamos los pedazos',
      '×': 'tomamos una parte de otra parte: numerador por numerador y denominador por denominador',
      '÷': 'preguntamos cuántas veces cabe la segunda en la primera: multiplicamos por la segunda volteada',
    }[op.op];
    return `Con ${op.a} ${op.op} ${op.b}, ${como}. Así se llega a ${texto(r.valor)}.`;
  }
  return {
    '×': `${op.a} × ${op.b} son ${op.a} grupos de ${op.b}: si sumas ${op.b} ${op.a} veces, llegas a ${texto(r.valor)}.`,
    '+': `${op.a} + ${op.b}: juntamos unidades con unidades y decenas con decenas, y así llegamos a ${texto(r.valor)}.`,
    '−': `${op.a} − ${op.b} es lo que le falta a ${op.b} para llegar a ${op.a}, y eso es ${texto(r.valor)}.`,
  }[op.op];
}

/** Pistas generales del escáner para fracciones y divisiones (la primera es la del diagnóstico). */
export function pistasGenerales(op) {
  if (tipoDe(op) === 'division') {
    return [`¿Cuántos grupos de ${op.b} caben en ${op.a}? Ve sumando ${op.b} hasta acercarte.`,
      `Lo que sobra (el residuo) siempre es más chico que ${op.b}.`];
  }
  return {
    '+': ['Dibuja las dos fracciones como pizzas del mismo tamaño.', 'Busca un número que sirva de denominador para las dos.'],
    '−': ['Dibuja las dos fracciones como pizzas del mismo tamaño.', 'Busca un número que sirva de denominador para las dos.'],
    '×': ['Multiplica arriba con arriba y abajo con abajo.', '¿Se puede simplificar antes o después?'],
    '÷': ['Dividir entre una fracción es multiplicar por esa fracción volteada.', '¿Cuántas veces cabe la segunda fracción en la primera?'],
  }[op.op];
}
