// Reglas del ciclo de juego (Recompensas-y-cuidados.md y Apoyo-visual.md).
// Funciones puras: reciben el estado y devuelven uno nuevo. Así se pueden probar fácil.
// Los números marcados como VALOR INICIAL están para probar con alumnos y ajustarse aquí.

import { MUNDOS, buscarReto } from '../contenido/mundos.js';

export const VALORES = {
  estrellasPrimera: 3,      // VALOR INICIAL: acertar a la primera
  estrellasConAyuda: 2,     // VALOR INICIAL: acertar después de pistas o errores
  bonoRetoDelDia: 5,        // VALOR INICIAL
  estrellasMundo: 10,       // VALOR INICIAL: cofre del mundo
  costoAlimentar: 1,        // VALOR INICIAL
  costoJugar: 2,            // VALOR INICIAL
  retosPorBajada: 3,        // VALOR INICIAL: cada 3 retos baja una marca de un medidor
  rachaParaSubirEtapa: 3,   // VALOR INICIAL: 3 retos seguidos sin pistas -> menos apoyo visual
  metaSalon: 60,            // VALOR INICIAL: estrellas para el premio del salón
  maxMarcas: 5,
  minMarcas: 1,
};

const MEDIDORES = ['comida', 'pecera', 'alegria'];

export function estadoInicial() {
  return {
    version: 1,
    apodo: '',
    nombreAjolote: 'Kiko',
    estrellas: 0,
    completados: {},          // { retoId: { estrellas, conAyuda, fecha } }
    mundosTerminados: [],     // ids de mundos con cofre abierto
    stickers: [],             // ids de stickers ganados
    bienestar: { comida: 4, pecera: 4, alegria: 4 },
    turnoMedidor: 0,
    retosDesdeBajada: 0,
    rachaSinPistas: 0,
    etapaApoyo: 1,
    ejemplosVistos: [],       // ids de mundos cuyo ejemplo del ajolote ya se vio
    ultimoBonoDia: null,      // 'YYYY-MM-DD'
    ultimaVisita: null,
    dormido: false,
    celebrando: false,
    stats: { cuidados: 0, pistasPedidas: 0, retosSinAyuda: 0 },
    escaner: { pendientes: [], historial: [] },
    aula: null,
  };
}

export function hoy(fecha = new Date()) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diasEntre(desde, hasta) {
  if (!desde) return 0;
  const a = new Date(`${desde}T00:00:00`);
  const b = new Date(`${hasta}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

// ---------- Recompensas ----------

export function estrellasPorAcierto({ conAyuda }) {
  return conAyuda ? VALORES.estrellasConAyuda : VALORES.estrellasPrimera;
}

/**
 * Registra un reto resuelto. Devuelve { estado, ganadas, bono, repaso }.
 * conAyuda = true si pidió pistas o se equivocó antes de acertar.
 */
export function resolverReto(estado, retoId, { conAyuda, pistas = 0 }, fecha = new Date()) {
  const dia = hoy(fecha);
  if (estado.completados[retoId]) {
    // Repaso: no da estrellas, pero tampoco castiga.
    return { estado, ganadas: 0, bono: 0, repaso: true };
  }
  const ganadas = estrellasPorAcierto({ conAyuda });
  const bono = estado.ultimoBonoDia === dia ? 0 : VALORES.bonoRetoDelDia;

  let s = {
    ...estado,
    estrellas: estado.estrellas + ganadas + bono,
    ultimoBonoDia: dia,
    completados: { ...estado.completados, [retoId]: { estrellas: ganadas, conAyuda, fecha: dia } },
    stats: {
      ...estado.stats,
      pistasPedidas: estado.stats.pistasPedidas + pistas,
      retosSinAyuda: estado.stats.retosSinAyuda + (conAyuda ? 0 : 1),
    },
    celebrando: true,
    dormido: false,
  };
  s = avanzarEtapa(s, { conAyuda: pistas > 0 });
  s = gastarBienestarAlJugar(s);
  return { estado: s, ganadas, bono, repaso: false };
}

// ---------- Escalera de abstracción ----------

function avanzarEtapa(estado, { conAyuda }) {
  if (conAyuda) return { ...estado, rachaSinPistas: 0 };
  const racha = estado.rachaSinPistas + 1;
  if (racha >= VALORES.rachaParaSubirEtapa && estado.etapaApoyo < 4) {
    return { ...estado, rachaSinPistas: 0, etapaApoyo: estado.etapaApoyo + 1 };
  }
  return { ...estado, rachaSinPistas: racha };
}

/** Etapa de apoyo visual para un reto: 1 monedas, 2 bolsitas, 3 barras, 4 solo números. */
export function etapaParaReto(reto, etapaApoyo) {
  let etapa = Math.max(reto.etapaMin || 1, etapaApoyo);
  if (etapa === 1 && reto.b > 12) etapa = 2; // más de 12 monedas por montón: bolsitas
  return Math.min(etapa, 4);
}

// ---------- Bienestar ----------

function gastarBienestarAlJugar(estado) {
  const n = estado.retosDesdeBajada + 1;
  if (n < VALORES.retosPorBajada) return { ...estado, retosDesdeBajada: n };
  const medidor = MEDIDORES[estado.turnoMedidor % MEDIDORES.length];
  const valor = Math.max(VALORES.minMarcas, estado.bienestar[medidor] - 1);
  return {
    ...estado,
    retosDesdeBajada: 0,
    turnoMedidor: estado.turnoMedidor + 1,
    bienestar: { ...estado.bienestar, [medidor]: valor },
  };
}

/** El medidor que el ajolote pide (el más bajo, solo si está en 2 marcas o menos). */
export function loQuePide(bienestar) {
  let peor = null;
  for (const m of MEDIDORES) {
    if (bienestar[m] <= 2 && (peor === null || bienestar[m] < bienestar[peor])) peor = m;
  }
  return peor;
}

export function estadoAjolote(estado) {
  if (estado.dormido) return 'dormido';
  if (estado.celebrando) return 'celebrando';
  if (loQuePide(estado.bienestar)) return 'curioso';
  return 'feliz';
}

export const CUIDADOS = {
  alimentar: { costo: () => VALORES.costoAlimentar, medidor: 'comida', sube: 2 },
  jugar: { costo: () => VALORES.costoJugar, medidor: 'alegria', sube: 2 },
  limpiar: { costo: () => 0, medidor: 'pecera', sube: VALORES.maxMarcas },
  descansar: { costo: () => 0, medidor: null, sube: 0 },
};

/** Aplica un cuidado. Si no alcanzan las estrellas, devuelve el mismo estado y ok=false. */
export function cuidar(estado, accion) {
  const c = CUIDADOS[accion];
  if (!c) throw new Error(`Cuidado desconocido: ${accion}`);
  const costo = c.costo();
  if (estado.estrellas < costo) return { estado, ok: false, faltan: costo - estado.estrellas };
  if (accion === 'descansar') {
    return { estado: { ...estado, dormido: true, celebrando: false }, ok: true, faltan: 0 };
  }
  const actual = estado.bienestar[c.medidor];
  return {
    ok: true,
    faltan: 0,
    estado: {
      ...estado,
      estrellas: estado.estrellas - costo,
      bienestar: { ...estado.bienestar, [c.medidor]: Math.min(VALORES.maxMarcas, actual + c.sube) },
      stats: { ...estado.stats, cuidados: estado.stats.cuidados + 1 },
      dormido: false,
    },
  };
}

// ---------- Mapa ----------

export function retosCompletadosDe(estado, mundo) {
  return mundo.retos.filter((r) => estado.completados[r.id]).length;
}

export function mundoDesbloqueado(estado, mundo) {
  if (mundo.proximamente) return false;
  const i = MUNDOS.findIndex((m) => m.id === mundo.id);
  if (i <= 0) return true;
  return estado.mundosTerminados.includes(MUNDOS[i - 1].id);
}

/** Estado de cada nodo de un mundo: 'completado' | 'actual' | 'bloqueado', y el cofre. */
export function nodosDeMundo(estado, mundo) {
  const abierto = mundoDesbloqueado(estado, mundo);
  let actualAsignado = false;
  const nodos = mundo.retos.map((r) => {
    if (estado.completados[r.id]) return { reto: r, estado: 'completado' };
    if (abierto && !actualAsignado) {
      actualAsignado = true;
      return { reto: r, estado: 'actual' };
    }
    return { reto: r, estado: 'bloqueado' };
  });
  let cofre = 'bloqueado';
  if (estado.mundosTerminados.includes(mundo.id)) cofre = 'abierto';
  else if (abierto && mundo.retos.length > 0 && !actualAsignado) cofre = 'actual';
  return { nodos, cofre, abierto };
}

/** El siguiente lugar a donde ir: un reto, un cofre o null si todo está hecho. */
export function siguientePaso(estado) {
  for (const mundo of MUNDOS) {
    const { nodos, cofre, abierto } = nodosDeMundo(estado, mundo);
    if (!abierto) continue;
    const actual = nodos.find((n) => n.estado === 'actual');
    if (actual) return { tipo: 'reto', reto: actual.reto, mundo };
    if (cofre === 'actual') return { tipo: 'cofre', mundo };
  }
  return null;
}

export function abrirCofre(estado, mundoId) {
  const mundo = MUNDOS.find((m) => m.id === mundoId);
  if (!mundo || estado.mundosTerminados.includes(mundoId)) return { estado, ok: false };
  if (nodosDeMundo(estado, mundo).cofre !== 'actual') return { estado, ok: false };
  return {
    ok: true,
    estado: {
      ...estado,
      estrellas: estado.estrellas + VALORES.estrellasMundo,
      mundosTerminados: [...estado.mundosTerminados, mundoId],
      stickers: estado.stickers.includes(mundo.sticker) ? estado.stickers : [...estado.stickers, mundo.sticker],
      celebrando: true,
    },
  };
}

/** Un reto se puede jugar si ya está completado (repaso) o es el actual. */
export function retoJugable(estado, retoId) {
  const reto = buscarReto(retoId);
  if (!reto) return false;
  const { nodos } = nodosDeMundo(estado, reto.mundo);
  const nodo = nodos.find((n) => n.reto.id === retoId);
  return nodo && nodo.estado !== 'bloqueado';
}

// ---------- Logros ----------

export function logros(estado) {
  const resueltos = Object.keys(estado.completados).length;
  return [
    { id: 'primera', nombre: 'Primera misión', detalle: 'Resuelve tu primer reto.', hecho: resueltos >= 1 },
    { id: 'cinco', nombre: 'Explorador constante', detalle: 'Resuelve 5 retos.', hecho: resueltos >= 5 },
    { id: 'solo', nombre: 'Lo descubrí yo', detalle: 'Resuelve 3 retos sin pistas.', hecho: estado.stats.retosSinAyuda >= 3 },
    { id: 'pista', nombre: 'Pedir ayuda es de valientes', detalle: 'Usa una pista y termina el reto.', hecho: estado.stats.pistasPedidas >= 1 && resueltos >= 1 },
    { id: 'cuidador', nombre: 'Gran cuidador', detalle: 'Cuida a tu ajolote 5 veces.', hecho: estado.stats.cuidados >= 5 },
    { id: 'mundo', nombre: 'Mundo superado', detalle: 'Abre el cofre de un mundo.', hecho: estado.mundosTerminados.length >= 1 },
  ];
}
