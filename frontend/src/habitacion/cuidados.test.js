import {describe,it,expect} from 'vitest';
import {dentroMascota,segundosRestantes} from './Cuidados.jsx';
describe('cuidados: arrastre y temporizadores',()=>{
 it('acepta soltar sobre el ajolote y no fuera',()=>{
  const rect={left:100,right:250,top:120,bottom:280};
  expect(dentroMascota(160,190,rect)).toBe(true);
  expect(dentroMascota(100,120,rect)).toBe(true);
  expect(dentroMascota(99,190,rect)).toBe(false);
  expect(dentroMascota(160,281,rect)).toBe(false);
  expect(dentroMascota(160,190,null)).toBe(false);
 });
 it('cada plazo llega a cero sin valores negativos',()=>{
  expect(segundosRestantes(181000,1000)).toBe(180);
  expect(segundosRestantes(181000,180001)).toBe(1);
  expect(segundosRestantes(181000,181000)).toBe(0);
  expect(segundosRestantes(181000,182000)).toBe(0);
  expect(segundosRestantes(undefined,1000)).toBe(0);
 });
});
