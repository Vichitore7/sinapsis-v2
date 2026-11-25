// Lector de la foto del cuaderno.
//
// PENDIENTE (backend): aquí se conectará el servicio que lee la operación de la foto
// (por ejemplo un endpoint del backend que llama a un modelo con visión).
// Debe devolver { a, op, b, c, dudoso? } o null si no pudo leer.
// La API key NUNCA va en el frontend: solo en el backend.
//
// Mientras no exista, devuelve null y el alumno escribe la operación tal como está en su cuaderno.
// La regla del sistema de diseño se mantiene: nunca se diagnostica antes de que el alumno confirme.

export async function leerOperacion(_fotoDataUrl) {
  return null;
}

// Respuesta de Kiko a una foto enviada en el chat.
//
// PENDIENTE (backend): aquí se conectará la IA del tutor. Recibirá la foto comprimida
// (dataURL JPEG, menos de 300 KB) y devolverá el texto de Kiko. La API key va solo en el backend.
//
// Mientras tanto, es una respuesta fija de prueba.
export async function responderFoto(_fotoDataUrl) {
  return '¡Vas bien!';
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
