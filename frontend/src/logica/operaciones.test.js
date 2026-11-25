import { describe, expect, it } from 'vitest';
import { conDuda, diagnosticarOperacion, explicacionResuelta, resolvioEnChat, validar, yaLoDijo } from './operaciones.js';

const d = (a, op, b, c, residuo = '') => diagnosticarOperacion(validar({ a, op, b, c, residuo }));

describe('operaciones del escáner (espejo de backend/app/operaciones.py)', () => {
  it('valida', () => {
    expect(validar({ a: 6, op: 'x', b: 7, c: 42 }).op).toBe('×');
    expect(validar({ a: '3/0', op: '+', b: '1/2', c: '1' })).toBeNull();
    expect(validar({ a: '1/4', op: '−', b: '1/2', c: '1/4' })).toBeNull();
    expect(validar({ a: 5, op: '÷', b: 0, c: 1 })).toBeNull();
  });
  it('enteros como siempre', () => {
    expect(d(6, '×', 7, 42).correcto).toBe(true);
    expect(d(3, '×', 12, 15).tipoError).toBe('sumo');
  });
  it('división con residuo', () => {
    expect(d(17, '÷', 5, 3, 2).correcto).toBe(true);
    expect(d(17, '÷', 5, 2, 7).tipoError).toBe('residuo_grande');
    expect(d(17, '÷', 5, 3, 1).tipoError).toBe('residuo');
    expect(d(17, '÷', 5, 4, 0).tipoError).toBe('cociente');
  });
  it('fracciones', () => {
    expect(d('3/4', '+', '1/2', '5/4').correcto).toBe(true);
    expect(d('3/4', '+', '1/2', '10/8').pregunta).toMatch(/más pequeños/);
    expect(d('3/4', '+', '1/2', '4/6').tipoError).toBe('sumo_denominadores');
    expect(d('3/4', '+', '1/2', '4/4').tipoError).toBe('denominador');
    expect(d('1/2', '÷', '1/4', '1/8').tipoError).toBe('multiplico');
    expect(d('2/3', '×', '3/5', '6/15').correcto).toBe(true);
    expect(d('1/2', '+', '1/2', '1').correcto).toBe(true);
  });
  it('errores típicos de enteros', () => {
    expect(d(38, '+', 25, 53).tipoError).toBe('no_llevo');
    expect(d(52, '−', 27, 35).tipoError).toBe('no_pidio');
    expect(d(9, '×', 6, 45).tipoError).toBe('un_grupo');
    expect(d(3, '×', 12, 15).tipoError).toBe('sumo');
  });
  it('detecta si el alumno ya dijo el resultado', () => {
    const op = validar({ a: '3/4', op: '+', b: '1/2', c: '4/6' });
    expect(yaLoDijo(op, '¿es 10/8?')).toBe(true);
    expect(yaLoDijo(op, 'es 4/6')).toBe(false);
  });
});

describe('respuesta con duda', () => {
  it('distingue una conjetura de una respuesta afirmada', () => {
    for (const t of ['¿será 42? no estoy seguro', 'creo que 42', 'tal vez 42', 'no sé, 42', 'quizás 42']) expect(conDuda(t)).toBe(true);
    for (const t of ['es 42', 'me salió 42', 'sí, es 42 porque son 6 grupos de 7', 'creció']) expect(conDuda(t)).toBe(false);
  });
});

describe('ejercicio resuelto en el chat', () => {
  it('se cierra al afirmar el resultado, no al adivinarlo ni con otro número', () => {
    const op = validar({ a: 6, op: '×', b: 7, c: 41 });
    expect(resolvioEnChat(op, 'es 42')).toBe(true);
    expect(resolvioEnChat(op, '¿será 42?')).toBe(false);
    expect(resolvioEnChat(op, 'me sale 41')).toBe(false);
    expect(resolvioEnChat(validar({ a: 6, op: '×', b: 7, c: 42 }), 'es 42')).toBe(false); // ya estaba bien
  });
});

describe('negar el resultado no lo cierra', () => {
  it('"no es 42" no es decir 42; "no es 41, es 42" sí', () => {
    const op = validar({ a: 6, op: '×', b: 7, c: 41 });
    for (const t of ['No es 42', 'no me da 42', '42 no', '¿42 o 43?']) expect(resolvioEnChat(op, t)).toBe(false);
    expect(resolvioEnChat(op, 'no es 41, es 42')).toBe(true);
  });
});

describe('explicación después de resolver (sin conexión)', () => {
  it('explica la operación de cada tipo', () => {
    expect(explicacionResuelta(validar({ a: 6, op: '×', b: 7, c: 42 }))).toMatch(/6 grupos de 7/);
    expect(explicacionResuelta(validar({ a: 17, op: '÷', b: 5, c: 3, residuo: 2 }))).toMatch(/caben 3 y sobran 2/);
    expect(explicacionResuelta(validar({ a: '3/4', op: '+', b: '1/2', c: '5/4' }))).toMatch(/mismo tamaño/);
  });
});
