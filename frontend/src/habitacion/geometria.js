export function dentro(x, y, poligono) {
  const signos = poligono.map((a, i) => {
    const b = poligono[(i + 1) % poligono.length];
    return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
  });
  return signos.every(s => s >= 0) || signos.every(s => s <= 0);
}
export const valido = (obj, sticker, escenario) => dentro(obj.x, obj.y, escenario[sticker.superficie]);
export function centro(poligono) {
  return { x: Math.round(poligono.reduce((s, p) => s + p[0], 0) / poligono.length), y: Math.round(poligono.reduce((s, p) => s + p[1], 0) / poligono.length) };
}
export function caja(obj, recurso, ancho = recurso.anchoVisual) {
  const escala = ancho / recurso.ancho;
  return { x: obj.x - recurso.anclaje[0] * escala, y: obj.y - recurso.anclaje[1] * escala, width: ancho, height: recurso.alto * escala };
}
export function moverCapa(objetos, id, delta, catalogo) {
  const i = objetos.findIndex(o => o.stickerId === id);
  if (i < 0) return objetos;
  const grupo = o => catalogo[o.stickerId].superficie === 'suelo' ? 'suelo' : 'pared';
  let j = i + delta;
  while (j >= 0 && j < objetos.length && grupo(objetos[j]) !== grupo(objetos[i])) j += delta;
  if (j < 0 || j >= objetos.length) return objetos;
  const copia = [...objetos]; [copia[i], copia[j]] = [copia[j], copia[i]]; return copia;
}

// Centro del colchón en el dibujo original de 240 × 240.
export function posicionMascota(escenario, cama, recursoCama, dormido) {
  if (!dormido || !cama || !recursoCama) return {...centro(escenario.suelo), ancho:170};
  const b=caja(cama,recursoCama);
  return {x:b.x+b.width*145/240,y:b.y+b.height*163/240,ancho:b.width*.55};
}
