import {describe,it,expect} from 'vitest';
import {estadoCompra} from './Tienda.jsx';
const s={id:'sillon',precio:12,trajineraRequerida:6};
describe('Tienda por trajineras',()=>{
 it('bloquea una trajinera parcial, ausente o diferente aun con estrellas',()=>{
  expect(estadoCompra(s,[],[{numero:6,superada:false}],1000)).toBe('bloqueado');
  expect(estadoCompra(s,[],[{numero:3,superada:true}],1000)).toBe('bloqueado');
  expect(estadoCompra(s,[],[],1000)).toBe('bloqueado');
 });
 it('exige saldo después de desbloquear y conserva compras previas',()=>{
  const t=[{numero:6,superada:true}];
  expect(estadoCompra(s,[],t,11)).toBe('sinSaldo');
  expect(estadoCompra(s,[],t,12)).toBe('disponible');
  expect(estadoCompra(s,['sillon'],[],0)).toBe('adquirido');
 });
 it('los stickers iniciales no exigen una trajinera',()=>{
  expect(estadoCompra({...s,trajineraRequerida:0},[],[],12)).toBe('disponible');
 });
});
