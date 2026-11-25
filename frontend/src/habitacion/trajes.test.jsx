import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SeccionStickers } from '../pantallas/Logros.jsx';
const { jugador }=vi.hoisted(()=>({jugador:{nombreAjolote:'Kiko',trajes:['trajinero','trajinera'],traje:null,stickers:[]}}));
vi.mock('../estado/store.jsx',()=>({useJuego:()=>({estado:jugador,aplicarServidor:()=>{}})}));
describe('Armario de Sinapsis',()=>{
 it('muestra primero el aspecto original como activo al iniciar',()=>{
  jugador.traje=null;
  const html=renderToStaticMarkup(<SeccionStickers estado={jugador} mundos={[]}/>);
  expect(html).toMatch(/traje-carta activo[\s\S]*?Predeterminado[\s\S]*?Sin traje especial[\s\S]*?aria-pressed="true"/);
  expect(html.indexOf('Predeterminado')).toBeLessThan(html.indexOf('Traje de trajinero'));
 });
 it('permite regresar al aspecto original sin quitar los trajes ganados',()=>{
  jugador.traje='trajinero';
  const html=renderToStaticMarkup(<SeccionStickers estado={jugador} mundos={[]}/>);
  expect(html).toContain('Usar aspecto original');
  expect(html).toMatch(/traje-carta activo[\s\S]*?Traje de trajinero/);
  expect(html).toContain('Traje de trajinera');
 });
});
