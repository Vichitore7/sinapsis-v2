// Recorte y compresión de la foto del cuaderno (Escaner-de-cuaderno.md).
// VALOR INICIAL: menos de 300 KB por foto.
export const MAX_BYTES = 300 * 1024;

export function leerArchivo(archivo) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(archivo);
  });
}

export function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function bytesDeDataUrl(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.floor((base64.length * 3) / 4);
}

/**
 * Recorta (marco en proporciones 0..1) y comprime a JPEG hasta quedar bajo `maxBytes`.
 * Una página completa de la tarea usa más resolución (`lado`) para que se lean todas las operaciones.
 * @returns {Promise<string>} dataURL
 */
export async function recortarYComprimir(src, marco, { lado = 1200, maxBytes = MAX_BYTES } = {}) {
  const img = await cargarImagen(src);
  const sx = Math.round(marco.x * img.naturalWidth);
  const sy = Math.round(marco.y * img.naturalHeight);
  const sw = Math.max(1, Math.round(marco.w * img.naturalWidth));
  const sh = Math.max(1, Math.round(marco.h * img.naturalHeight));

  let escala = Math.min(1, lado / Math.max(sw, sh));
  let calidad = 0.8;
  for (let intento = 0; intento < 8; intento++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sw * escala));
    canvas.height = Math.max(1, Math.round(sh * escala));
    canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL('image/jpeg', calidad);
    if (bytesDeDataUrl(url) <= maxBytes) return url;
    if (calidad > 0.5) calidad -= 0.15;
    else escala *= 0.75;
  }
  throw new Error('No se pudo comprimir la foto');
}
