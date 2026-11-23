// Modo Aula (Modo-aula.md): un dispositivo del maestro, sin ranking, apodos en vez de nombres.
import { VALORES } from './juego.js';
import { ERRORES_TIPICOS, buscarMundo } from '../contenido/mundos.js';

export function aulaInicial(grupo, apodos) {
  return {
    grupo,
    apodos: limpiarApodos(apodos),
    meta: 0,
    premiosSalon: 0,
    sesiones: [],
    sesionActual: null,
  };
}

export function limpiarApodos(lista) {
  const vistos = new Set();
  return lista
    .map((a) => a.trim())
    .filter((a) => a && !vistos.has(a.toLowerCase()) && vistos.add(a.toLowerCase()));
}

export function iniciarSesion(aula, mundoId, fecha) {
  const mundo = buscarMundo(mundoId);
  return {
    ...aula,
    sesionActual: { fecha, mundoId, retos: mundo.retos.map((r) => r.id), indice: 0, marcas: {} },
  };
}

/** Marca a un alumno en el reto actual. marca = { ok: true } | { ok: false, error?: id } | null (borrar). */
export function marcar(aula, apodo, marca) {
  const s = aula.sesionActual;
  const retoId = s.retos[s.indice];
  const delReto = { ...(s.marcas[retoId] || {}) };
  const antes = delReto[apodo];
  if (marca === null) delReto[apodo] = undefined;
  else delReto[apodo] = marca;

  // Meta colectiva: cada ✓ suma 1. Quitar un ✓ la resta (para corregir un toque equivocado).
  let meta = aula.meta;
  if (antes?.ok && !marca?.ok) meta -= 1;
  if (!antes?.ok && marca?.ok) meta += 1;
  let premiosSalon = aula.premiosSalon;
  if (meta >= VALORES.metaSalon) {
    meta -= VALORES.metaSalon;
    premiosSalon += 1;
  }
  meta = Math.max(0, meta);

  return { ...aula, meta, premiosSalon, sesionActual: { ...s, marcas: { ...s.marcas, [retoId]: delReto } } };
}

export function siguienteReto(aula) {
  const s = aula.sesionActual;
  if (s.indice + 1 < s.retos.length) {
    return { aula: { ...aula, sesionActual: { ...s, indice: s.indice + 1 } }, terminada: false };
  }
  return { aula: terminarSesion(aula), terminada: true };
}

export function terminarSesion(aula) {
  if (!aula.sesionActual) return aula;
  return { ...aula, sesiones: [...aula.sesiones, aula.sesionActual], sesionActual: null };
}

/** Resumen del panel del maestro para una sesión. */
export function resumenSesion(sesion, apodos) {
  const mundo = buscarMundo(sesion.mundoId);
  const retos = mundo.retos.filter((r) => sesion.retos.includes(r.id));
  let aciertos = 0;
  let fallos = 0;
  const conteoErrores = {};
  const fallosPorAlumno = {};
  const marcadosPorAlumno = {};

  for (const r of retos) {
    const marcas = sesion.marcas[r.id] || {};
    for (const apodo of apodos) {
      const m = marcas[apodo];
      if (!m) continue;
      marcadosPorAlumno[apodo] = (marcadosPorAlumno[apodo] || 0) + 1;
      if (m.ok) aciertos++;
      else {
        fallos++;
        fallosPorAlumno[apodo] = (fallosPorAlumno[apodo] || 0) + 1;
        if (m.error) conteoErrores[m.error] = (conteoErrores[m.error] || 0) + 1;
      }
    }
  }

  const errores = ERRORES_TIPICOS.filter((e) => conteoErrores[e.id])
    .map((e) => ({ ...e, alumnos: conteoErrores[e.id] }))
    .sort((x, y) => y.alumnos - x.alumnos);
  const sinError = fallos - Object.values(conteoErrores).reduce((s, n) => s + n, 0);

  // Necesitan apoyo: fallaron la mitad o más de lo que se les marcó. Orden alfabético, nunca por resultado.
  const apoyo = apodos
    .filter((a) => marcadosPorAlumno[a] && (fallosPorAlumno[a] || 0) / marcadosPorAlumno[a] >= 0.5)
    .sort((x, y) => x.localeCompare(y, 'es'));

  const retoEjemplo = retos[0];
  let refuerzo = null;
  if (errores.length && retoEjemplo) {
    refuerzo = errores[0].refuerzo.replaceAll('{a}', retoEjemplo.a).replaceAll('{b}', retoEjemplo.b);
  } else if (fallos > 0 && retoEjemplo) {
    refuerzo = `Repasa con monedas un reto como ${retoEjemplo.a} × ${retoEjemplo.b} antes de seguir.`;
  }

  return { mundo, aciertos, fallos, total: aciertos + fallos, errores, sinError, apoyo, refuerzo };
}

/** Progreso de un alumno en varias sesiones: 0 a 5 marcas según su proporción de aciertos. */
export function progresoAlumno(sesiones, apodo) {
  let ok = 0;
  let total = 0;
  for (const s of sesiones) {
    for (const marcas of Object.values(s.marcas)) {
      const m = marcas[apodo];
      if (!m) continue;
      total++;
      if (m.ok) ok++;
    }
  }
  if (total === 0) return null;
  return Math.round((ok / total) * 5);
}
