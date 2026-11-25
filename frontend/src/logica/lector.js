// Lector de la foto del cuaderno.
//
// El backend lee la foto con Claude (POST /api/escaner/leer) y regresa la operación tal como está escrita,
// sin corregirla. La foto no se guarda en el servidor. La API key NUNCA va en el frontend.
// Si no se pudo leer, el alumno escribe la operación tal como está en su cuaderno.
// La regla del sistema de diseño se mantiene: nunca se diagnostica antes de que el alumno confirme.
import { api } from '../api.js';

/**
 * Lee la foto con el backend. Regresa { lectura, otro }:
 * - lectura: { a, op, b, c, residuo, dudoso } con números como texto ('17', '3/4'), o null;
 * - otro: texto de un ejercicio que el escáner no revisa (va al chat para que el alumno lo confirme), o null.
 */
export async function leerFoto(fotoDataUrl) {
  try {
    const { lectura, otro } = await api.leerFoto(fotoDataUrl);
    return { lectura: lectura || null, otro: otro || null };
  } catch {
    return { lectura: null, otro: null };
  }
}

/** Pistas del escáner: la primera es la del diagnóstico; las otras son preguntas generales del paso. */
export function pistasEscaner({ a, op, b }, diag) {
  const generales = {
    '×': [`¿Cuántas veces se repite el ${b}?`, `Escribe ${b} + ${b} + … en tu cuaderno, ${a} veces, y súmalo paso a paso.`],
    '+': [`¿Qué pasa si cuentas desde ${a} y avanzas de uno en uno?`, `Separa ${b} en decenas y unidades, y súmalas a ${a} por partes.`],
    '−': [`¿Cuánto le falta a ${b} para llegar a ${a}?`, `Cuenta hacia atrás desde ${a}, ${b} lugares.`],
  };
  return [diag.pregunta, ...(generales[op] || [])].slice(0, 3);
}
