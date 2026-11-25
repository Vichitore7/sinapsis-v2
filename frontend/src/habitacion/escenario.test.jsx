import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Escenario from './Escenario.jsx';
import catalogo from '../../public/habitacion/catalogo.json';
const props={catalogo,objetos:[],animo:'feliz',traje:null,accesorios:[],mundosSuperados:0};
describe('Ajolote original en la habitación',()=>{
 it('renderiza el personaje de Sinapsis aun sin traje ni progreso',()=>{
  const html=renderToStaticMarkup(<Escenario {...props}/>);
  expect(html).toContain('Ajolote explorador feliz');
  expect(html).not.toContain('ajolote/feliz.svg');
 });
 it('conserva el traje equipado y el estado dormido',()=>{
  const html=renderToStaticMarkup(<Escenario {...props} traje="trajinero" dormido reaccion="dormido" objetos={[{stickerId:'cama',x:295,y:454}]}/>);
  expect(html).toContain('Ajolote explorador dormido con traje de trajinero');
  expect(html).not.toContain('ajolote/dormido.svg');
 });
});
it('el tema cambia los recursos pero no duerme al ajolote ni cambia la geometría',()=>{
 const objetos=[{stickerId:'cama',x:295,y:454}];
 const dia=renderToStaticMarkup(<Escenario {...props} objetos={objetos}/>);
 const noche=renderToStaticMarkup(<Escenario {...props} objetos={objetos} noche/>);
 expect(dia).toContain('habitacion/fondos/acuario.svg');
 expect(noche).toContain('habitacion/noche/fondos/acuario.svg');
 expect(noche).toContain('habitacion/noche/stickers/cama.svg');
 expect(noche).toContain('Ajolote explorador feliz');
 expect(noche.match(/translate\([^\)]+\)/)?.[0]).toEqual(dia.match(/translate\([^\)]+\)/)?.[0]);
});
