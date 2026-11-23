// Pruebas de la lógica del frontend. Las reglas del juego (estrellas, medidores, cofres)
// se prueban en el backend: backend/tests/test_api.py.
import { describe, it, expect } from 'vitest';
import { diagnosticar } from './diagnostico.js';
import { pistasDe, ejemploParecido, MAX_PISTAS } from './pistas.js';
import { etapaParaReto, loQuePide, estadoAjolote, nodosDeMundo, siguientePaso, retoJugable, VALORES } from './juego.js';
import { aulaInicial, iniciarSesion, marcar, siguienteReto, resumenSesion, progresoAlumno, limpiarApodos } from './aula.js';
import { adaptarMundos, adaptarEstado } from '../api.js';

// Contenido de ejemplo con la forma que devuelve GET /api/contenido.
const MUNDOS = adaptarMundos([
  {
    id: 'm1', numero: 1, nombre: 'La tiendita', retos: [
      { id: 'm1-r1', titulo: 'A', enunciado: '', a: 3, b: 6, op: '×', moneda: true, objeto: 'paletas', etapa_min: 1, pistas: [] },
      { id: 'm1-r2', titulo: 'B', enunciado: '', a: 4, b: 3, op: '×', moneda: true, objeto: 'chicles', etapa_min: 1, pistas: [] },
    ],
  },
  {
    id: 'm2', numero: 2, nombre: 'El mercado', retos: [
      { id: 'm2-r1', titulo: 'C', enunciado: '', a: 3, b: 12, op: '×', moneda: true, objeto: 'mangos', etapa_min: 1, pistas: [] },
    ],
  },
]);

const RESUMEN = {
  apodo: 'Luna', estrellas: 8, xp: 8, nivel: 1, racha_dias: 1, etapa_apoyo: 1,
  ultimo_bono_dia: '2026-11-23', ultima_actividad: '2026-11-23',
  completados: { 'm1-r1': { estrellas: 3, con_ayuda: false, fecha: '2026-11-23' } },
  lecciones_terminadas: [], stickers: [], ejemplos_vistos: ['m1'],
  stats: { cuidados: 0, pistas_pedidas: 0, retos_sin_ayuda: 1 },
  mascota: { nombre: 'Kiko', comida: 4, pecera: 2, alegria: 4, dormido: false, pide: 'pecera' },
  logros: [],
  mapa: {
    m1: { abierta: true, nodos: { 'm1-r1': 'completado', 'm1-r2': 'actual' }, cofre: 'bloqueado' },
    m2: { abierta: false, nodos: { 'm2-r1': 'bloqueado' }, cofre: 'bloqueado' },
  },
};

describe('diagnóstico de la senda (escáner)', () => {
  it('error de cálculo en el paso 3 con pregunta de suma repetida (ejemplo del sistema de diseño)', () => {
    const d = diagnosticar({ a: 3, op: '×', b: 12, c: 26 });
    expect(d.pasoTorcido).toBe(3);
    expect(d.pregunta).toBe('¿12 + 12 + 12 da 26?');
    expect(d.pasos.map((p) => p.estado)).toEqual(['ok', 'ok', 'casi', 'pendiente']);
  });

  it('detecta que sumó en vez de multiplicar', () => {
    expect(diagnosticar({ a: 3, op: 'x', b: 12, c: 15 }).tipoError).toBe('sumo');
  });

  it('suma y resta', () => {
    expect(diagnosticar({ a: 5, op: '+', b: 4, c: 9 }).correcto).toBe(true);
    expect(diagnosticar({ a: 9, op: '-', b: 4, c: 6 }).pregunta).toBe('Comprueba al revés: ¿6 + 4 da 9?');
  });
});

describe('pistas', () => {
  it('usa las pistas del servidor si vienen; si no, genera 3 que no dicen la respuesta', () => {
    expect(pistasDe({ ...MUNDOS[0].retos[0], pistas: ['x', 'y', 'z'] })).toEqual(['x', 'y', 'z']);
    const p = pistasDe(MUNDOS[0].retos[0]);
    expect(p).toHaveLength(MAX_PISTAS);
    p.forEach((t) => expect(t).not.toContain('18'));
  });

  it('el ejemplo parecido usa otros números', () => {
    const r = MUNDOS[1].retos[0];
    expect(ejemploParecido(r).total).not.toBe(r.a * r.b);
  });
});

describe('vista del estado que manda el servidor', () => {
  const estado = adaptarEstado(RESUMEN);

  it('adapta el formato de la API', () => {
    expect(estado.bienestar).toEqual({ comida: 4, pecera: 2, alegria: 4 });
    expect(estado.ejemplosVistos).toEqual(['m1']);
    expect(estado.stats.retosSinAyuda).toBe(1);
  });

  it('mapa, siguiente paso y retos jugables', () => {
    expect(nodosDeMundo(estado, MUNDOS[0]).nodos.map((n) => n.estado)).toEqual(['completado', 'actual']);
    expect(siguientePaso(estado, MUNDOS).reto.id).toBe('m1-r2');
    expect(retoJugable(estado, MUNDOS[0].retos[0])).toBe(true);
    expect(retoJugable(estado, MUNDOS[1].retos[0])).toBe(false);
  });

  it('el ajolote pide lo que más falta y se pone curioso', () => {
    expect(loQuePide(estado.bienestar)).toBe('pecera');
    expect(estadoAjolote(estado)).toBe('curioso');
    expect(estadoAjolote({ ...estado, dormido: true })).toBe('dormido');
  });

  it('más de 12 monedas pasa a bolsitas', () => {
    expect(etapaParaReto({ b: 15, etapaMin: 1 }, 1)).toBe(2);
    expect(etapaParaReto({ b: 12, etapaMin: 1 }, 1)).toBe(1);
  });
});

describe('modo aula (sin internet)', () => {
  it('limpia apodos repetidos y vacíos', () => {
    expect(limpiarApodos(['Luna', ' luna ', '', 'Teo'])).toEqual(['Luna', 'Teo']);
  });

  it('cada ✓ suma a la meta del salón y el panel resume sin ranking', () => {
    let a = aulaInicial('5.º B', ['Teo', 'Luna', 'Beto']);
    a = iniciarSesion(a, MUNDOS[0], '2026-11-23');
    a = marcar(a, 'Luna', { ok: true });
    a = marcar(a, 'Teo', { ok: false, error: 'sumo' });
    a = marcar(a, 'Beto', { ok: false });
    expect(a.meta).toBe(1);
    a = marcar(a, 'Luna', { ok: false });
    expect(a.meta).toBe(0);
    a = marcar(a, 'Luna', { ok: true });
    let fin = siguienteReto(a);
    while (!fin.terminada) fin = siguienteReto(fin.aula);
    const res = resumenSesion(fin.aula.sesiones[0], fin.aula.apodos, MUNDOS);
    expect(res.aciertos).toBe(1);
    expect(res.fallos).toBe(2);
    expect(res.errores[0].id).toBe('sumo');
    expect(res.apoyo).toEqual(['Beto', 'Teo']);
    expect(progresoAlumno(fin.aula.sesiones, 'Luna')).toBe(5);
  });

  it('al llegar a la meta el salón gana un premio y la meta reinicia', () => {
    let a = { ...aulaInicial('5.º B', ['Luna']), meta: VALORES.metaSalon - 1 };
    a = iniciarSesion(a, MUNDOS[0], '2026-11-23');
    a = marcar(a, 'Luna', { ok: true });
    expect(a.premiosSalon).toBe(1);
    expect(a.meta).toBe(0);
  });
});
