// Diagnóstico de la "senda de pasos" sin IA.
// Recibe una operación (a op b = c) y dice en qué paso se torció el sendero,
// con una pregunta socrática concreta. NUNCA devuelve la respuesta correcta al alumno.

export const OPERACIONES = {
  '×': (a, b) => a * b,
  '+': (a, b) => a + b,
  '−': (a, b) => a - b,
};

export function normalizarOperador(op) {
  if (op === 'x' || op === 'X' || op === '*' || op === '×') return '×';
  if (op === '-' || op === '−' || op === '–') return '−';
  if (op === '+') return '+';
  return null;
}

function sumaRepetida(a, b) {
  return Array.from({ length: a }, () => b).join(' + ');
}

/**
 * @returns {{
 *   correcto: boolean,
 *   pasos: Array<{texto: string, estado: 'ok'|'casi'|'pendiente'}>,
 *   pasoTorcido: number|null,   // 1-based
 *   tipoError: 'sumo'|'calculo'|null,
 *   pregunta: string|null,
 * }}
 */
export function diagnosticar({ a, op, b, c, moneda = false }) {
  const operador = normalizarOperador(op);
  if (operador === null) throw new Error(`Operación no soportada: ${op}`);
  const f = (n) => (moneda ? `$${n}` : String(n));
  const esperado = OPERACIONES[operador](a, b);

  const datos = operador === '×' ? `${a} montones de ${f(b)}` : `${f(a)} y ${f(b)}`;
  const pasos = [
    { texto: `Datos: ${datos}`, estado: 'ok' },
    { texto: `${a} ${operador} ${f(b)}`, estado: 'ok' },
    { texto: `= ${f(c)}`, estado: 'ok' },
    { texto: 'Resultado', estado: 'ok' },
  ];

  if (c === esperado) {
    return { correcto: true, pasos, pasoTorcido: null, tipoError: null, pregunta: null };
  }

  // Multiplicación: ¿sumó los dos números en lugar de juntar montones?
  if (operador === '×' && c === a + b && a * b !== a + b) {
    pasos[1].estado = 'casi';
    pasos[2].estado = 'pendiente';
    pasos[3].estado = 'pendiente';
    return {
      correcto: false,
      pasos,
      pasoTorcido: 2,
      tipoError: 'sumo',
      pregunta: `¿Juntaste ${a} montones de ${f(b)}, o sumaste ${a} + ${b}?`,
    };
  }

  let pregunta;
  if (operador === '×') {
    pregunta = a <= 6
      ? `¿${sumaRepetida(a, b)} da ${c}?`
      : `¿${a} × ${b} da ${c}? Cuenta de ${b} en ${b}.`;
  } else if (operador === '+') {
    pregunta = `¿${a} + ${b} da ${c}? Cuenta desde ${a} y avanza ${b}.`;
  } else {
    pregunta = `Comprueba al revés: ¿${c} + ${b} da ${a}?`;
  }

  pasos[2].estado = 'casi';
  pasos[3].estado = 'pendiente';
  return { correcto: false, pasos, pasoTorcido: 3, tipoError: 'calculo', pregunta };
}
