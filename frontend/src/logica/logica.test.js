import { describe, it, expect } from 'vitest';
import { diagnosticar } from './diagnostico.js';
import { pistasDe, ejemploParecido, MAX_PISTAS } from './pistas.js';
import {
  estadoInicial, resolverReto, cuidar, etapaParaReto, loQuePide, estadoAjolote,
  nodosDeMundo, abrirCofre, siguientePaso, retoJugable, VALORES,
} from './juego.js';
import { aulaInicial, iniciarSesion, marcar, siguienteReto, resumenSesion, progresoAlumno, limpiarApodos } from './aula.js';
import { MUNDOS, buscarReto } from '../contenido/mundos.js';

const dia1 = new Date('2026-11-23T10:00:00');
const dia2 = new Date('2026-11-24T10:00:00');

describe('diagnóstico de la senda', () => {
  it('acierto: todos los pasos ok', () => {
    const d = diagnosticar({ a: 3, op: '×', b: 12, c: 36, moneda: true });
    expect(d.correcto).toBe(true);
    expect(d.pasos.every((p) => p.estado === 'ok')).toBe(true);
  });

  it('error de cálculo en el paso 3 con pregunta de suma repetida (ejemplo del sistema de diseño)', () => {
    const d = diagnosticar({ a: 3, op: '×', b: 12, c: 26 });
    expect(d.pasoTorcido).toBe(3);
    expect(d.tipoError).toBe('calculo');
    expect(d.pregunta).toBe('¿12 + 12 + 12 da 26?');
    expect(d.pasos.map((p) => p.estado)).toEqual(['ok', 'ok', 'casi', 'pendiente']);
  });

  it('detecta que sumó en vez de multiplicar', () => {
    const d = diagnosticar({ a: 3, op: 'x', b: 12, c: 15 });
    expect(d.pasoTorcido).toBe(2);
    expect(d.tipoError).toBe('sumo');
  });

  it('nunca revela la respuesta correcta en la pregunta', () => {
    for (const r of MUNDOS.flatMap((m) => m.retos)) {
      const d = diagnosticar({ a: r.a, op: '×', b: r.b, c: r.a * r.b + 1 });
      expect(d.pregunta).not.toContain(String(r.a * r.b));
    }
  });

  it('suma y resta', () => {
    expect(diagnosticar({ a: 5, op: '+', b: 4, c: 9 }).correcto).toBe(true);
    expect(diagnosticar({ a: 9, op: '-', b: 4, c: 6 }).pregunta).toBe('Comprueba al revés: ¿6 + 4 da 9?');
  });
});

describe('pistas', () => {
  it('máximo 3 pistas y ninguna dice la respuesta', () => {
    for (const r of MUNDOS.flatMap((m) => m.retos)) {
      const p = pistasDe(r);
      expect(p).toHaveLength(MAX_PISTAS);
      p.forEach((t) => expect(t).not.toContain(`${r.a * r.b}`));
    }
  });

  it('el ejemplo parecido usa otros números', () => {
    const r = buscarReto('m2-r1');
    const e = ejemploParecido(r);
    expect(e.total).not.toBe(r.a * r.b);
  });
});

describe('recompensas', () => {
  it('a la primera da 3 + bono del día; con ayuda da 2 y sin bono el mismo día', () => {
    let s = estadoInicial();
    let r = resolverReto(s, 'm1-r1', { conAyuda: false }, dia1);
    expect(r.ganadas).toBe(3);
    expect(r.bono).toBe(VALORES.bonoRetoDelDia);
    r = resolverReto(r.estado, 'm1-r2', { conAyuda: true, pistas: 1 }, dia1);
    expect(r.ganadas).toBe(2);
    expect(r.bono).toBe(0);
    expect(r.estado.estrellas).toBe(3 + 5 + 2);
    r = resolverReto(r.estado, 'm1-r3', { conAyuda: false }, dia2);
    expect(r.bono).toBe(5);
  });

  it('repetir un reto no da estrellas', () => {
    const r1 = resolverReto(estadoInicial(), 'm1-r1', { conAyuda: false }, dia1);
    const r2 = resolverReto(r1.estado, 'm1-r1', { conAyuda: false }, dia1);
    expect(r2.repaso).toBe(true);
    expect(r2.estado.estrellas).toBe(r1.estado.estrellas);
  });
});

describe('bienestar y cuidados', () => {
  it('cada 3 retos baja una marca por turnos y nunca baja de 1', () => {
    let s = { ...estadoInicial(), bienestar: { comida: 1, pecera: 4, alegria: 4 } };
    const ids = ['m1-r1', 'm1-r2', 'm1-r3', 'm1-r4', 'm2-r1', 'm2-r2'];
    for (const id of ids) s = resolverReto(s, id, { conAyuda: true }, dia1).estado;
    expect(s.bienestar).toEqual({ comida: 1, pecera: 3, alegria: 4 });
  });

  it('alimentar cuesta 1; sin estrellas no se puede y dice cuántas faltan', () => {
    let s = estadoInicial();
    const sin = cuidar(s, 'jugar');
    expect(sin.ok).toBe(false);
    expect(sin.faltan).toBe(2);
    s = { ...s, estrellas: 1, bienestar: { comida: 2, pecera: 4, alegria: 4 } };
    const r = cuidar(s, 'alimentar');
    expect(r.ok).toBe(true);
    expect(r.estado.estrellas).toBe(0);
    expect(r.estado.bienestar.comida).toBe(4);
  });

  it('limpiar y descansar son gratis', () => {
    const s = { ...estadoInicial(), bienestar: { comida: 4, pecera: 1, alegria: 4 } };
    expect(cuidar(s, 'limpiar').estado.bienestar.pecera).toBe(5);
    expect(estadoAjolote(cuidar(s, 'descansar').estado)).toBe('dormido');
  });

  it('pide lo que más falta solo con 2 marcas o menos', () => {
    expect(loQuePide({ comida: 3, pecera: 3, alegria: 3 })).toBe(null);
    expect(loQuePide({ comida: 2, pecera: 1, alegria: 3 })).toBe('pecera');
  });
});

describe('escalera de apoyo visual', () => {
  it('más de 12 monedas pasa a bolsitas', () => {
    expect(etapaParaReto({ b: 15, etapaMin: 1 }, 1)).toBe(2);
    expect(etapaParaReto({ b: 12, etapaMin: 1 }, 1)).toBe(1);
  });

  it('3 retos seguidos sin pistas suben una etapa', () => {
    let s = estadoInicial();
    for (const id of ['m1-r1', 'm1-r2', 'm1-r3']) s = resolverReto(s, id, { conAyuda: false }, dia1).estado;
    expect(s.etapaApoyo).toBe(2);
  });
});

describe('mapa', () => {
  it('al inicio el reto 1 es el actual y el mundo 2 está bloqueado', () => {
    const s = estadoInicial();
    const { nodos, cofre } = nodosDeMundo(s, MUNDOS[0]);
    expect(nodos.map((n) => n.estado)).toEqual(['actual', 'bloqueado', 'bloqueado', 'bloqueado']);
    expect(cofre).toBe('bloqueado');
    expect(retoJugable(s, 'm1-r2')).toBe(false);
    expect(retoJugable(s, 'm2-r1')).toBe(false);
  });

  it('terminar los retos habilita el cofre, que da sticker y abre el mundo 2', () => {
    let s = estadoInicial();
    for (const r of MUNDOS[0].retos) s = resolverReto(s, r.id, { conAyuda: false }, dia1).estado;
    expect(siguientePaso(s).tipo).toBe('cofre');
    const antes = s.estrellas;
    s = abrirCofre(s, 'm1').estado;
    expect(s.estrellas).toBe(antes + VALORES.estrellasMundo);
    expect(s.stickers).toContain('mochila');
    expect(siguientePaso(s).reto.id).toBe('m2-r1');
  });
});

describe('modo aula', () => {
  it('limpia apodos repetidos y vacíos', () => {
    expect(limpiarApodos(['Luna', ' luna ', '', 'Teo'])).toEqual(['Luna', 'Teo']);
  });

  it('cada ✓ suma a la meta del salón y el panel resume sin ranking', () => {
    let a = aulaInicial('5.º B', ['Teo', 'Luna', 'Beto']);
    a = iniciarSesion(a, 'm1', '2026-11-23');
    a = marcar(a, 'Luna', { ok: true });
    a = marcar(a, 'Teo', { ok: false, error: 'sumo' });
    a = marcar(a, 'Beto', { ok: false });
    expect(a.meta).toBe(1);
    a = marcar(a, 'Luna', { ok: false });
    expect(a.meta).toBe(0);
    a = marcar(a, 'Luna', { ok: true });
    let fin = siguienteReto(a);
    while (!fin.terminada) fin = siguienteReto(fin.aula);
    const res = resumenSesion(fin.aula.sesiones[0], fin.aula.apodos);
    expect(res.aciertos).toBe(1);
    expect(res.fallos).toBe(2);
    expect(res.errores[0].id).toBe('sumo');
    expect(res.sinError).toBe(1);
    expect(res.apoyo).toEqual(['Beto', 'Teo']);
    expect(progresoAlumno(fin.aula.sesiones, 'Luna')).toBe(5);
    expect(progresoAlumno(fin.aula.sesiones, 'Mía')).toBe(null);
  });

  it('al llegar a la meta el salón gana un premio y la meta reinicia', () => {
    let a = { ...aulaInicial('5.º B', ['Luna']), meta: VALORES.metaSalon - 1 };
    a = iniciarSesion(a, 'm1', '2026-11-23');
    a = marcar(a, 'Luna', { ok: true });
    expect(a.premiosSalon).toBe(1);
    expect(a.meta).toBe(0);
  });
});
