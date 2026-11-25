import {describe,it,expect} from 'vitest';
import {dentro,centro,caja,moverCapa} from './geometria.js';
const suelo=[[100,470],[480,250],[860,470],[480,690]];
describe('geometría y capas de habitación',()=>{
 it('permite centro y borde, rechaza exterior',()=>{expect(dentro(480,470,suelo)).toBe(true);expect(dentro(100,470,suelo)).toBe(true);expect(dentro(100,100,suelo)).toBe(false);});
 it('mantiene anclaje al escalar',()=>{expect(caja({x:480,y:470},{ancho:240,alto:240,anclaje:[120,200]},120)).toEqual({x:420,y:370,width:120,height:120});expect(centro(suelo)).toEqual({x:480,y:470});});
 it('reordena solo dentro de una superficie y no muta',()=>{const objetos=[{stickerId:'a'},{stickerId:'w'},{stickerId:'b'}],c={a:{superficie:'suelo'},b:{superficie:'suelo'},w:{superficie:'paredIzquierda'}};expect(moverCapa(objetos,'a',1,c).map(o=>o.stickerId)).toEqual(['b','w','a']);expect(objetos[0].stickerId).toBe('a');expect(moverCapa(objetos,'w',1,c)).toBe(objetos);});
});
