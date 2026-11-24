// Pistas socráticas y ejemplo resuelto. Reglas del sistema de diseño:
// - Máximo 3 pistas por reto, una pregunta concreta cada una.
// - Después, un ejemplo resuelto PARECIDO, con otros números (nunca la respuesta del mismo reto).

export const MAX_PISTAS = 3;

export function pistasDe(reto) {
  if (reto.pistas && reto.pistas.length) return reto.pistas.slice(0, MAX_PISTAS);
  const { a, b, moneda, objeto = 'cosas' } = reto;
  const f = (n) => (moneda ? `$${n}` : String(n));
  return [
    `¿Cuántos ${objeto} hay y cuánto cuesta cada uno?`,
    `Si juntas ${a} montones de ${f(b)}, ¿qué operación estás haciendo?`,
    a <= 6
      ? `¿Cuánto da ${Array.from({ length: a }, () => b).join(' + ')}?`
      : `Cuenta de ${b} en ${b}, ${a} veces. ¿A qué número llegas?`,
  ];
}

/** Ejemplo parecido con otros números: mismo b, un montón menos (o uno más si a = 1). */
export function ejemploParecido(reto) {
  const a = reto.a > 2 ? reto.a - 1 : reto.a + 1;
  const b = reto.b;
  const pasos = Array.from({ length: a }, () => b);
  return {
    a,
    b,
    moneda: reto.moneda,
    suma: pasos.join(' + '),
    total: a * b,
  };
}
