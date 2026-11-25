import { describe, it, expect } from 'vitest';
import { esNoche, rutaIlustracion } from './tema.js';
import catalogo from '../../public/habitacion/catalogo.json';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Acuario día y noche', () => {
  it('respeta el tema explícito y el del sistema', () => {
    expect(esNoche('claro', true)).toBe(false);
    expect(esNoche('oscuro', false)).toBe(true);
    expect(esNoche('sistema', true)).toBe(true);
    expect(esNoche('sistema', false)).toBe(false);
  });
  it('mantiene los recursos de cuidados y las rutas originales de día', () => {
    expect(rutaIlustracion('stickers/cama.svg')).toBe('stickers/cama.svg');
    expect(rutaIlustracion('iconos/dormir.svg', true)).toBe('iconos/dormir.svg');
  });
  it('cada ilustración tiene dos variantes con dimensiones originales', () => {
    const recursos = [catalogo.escenario, ...catalogo.stickers];
    expect(catalogo.stickers).toHaveLength(18);
    for (const r of recursos) {
      const paths = [false,true].map(n => resolve('public/habitacion', rutaIlustracion(r.imagen,n)));
      expect(paths.every(p => existsSync(p))).toBe(true);
      const [dia,noche] = paths.map(p => readFileSync(p,'utf8'));
      expect(noche).not.toEqual(dia);
      for (const svg of [dia,noche]) expect(svg).toContain(`viewBox="0 0 ${r.ancho} ${r.alto}"`);
    }
  });
});


describe('Perspectiva sin sombras exteriores', () => {
  it('quita las elipses de suelo y conserva el borde blanco de los stickers en ambos temas', () => {
    for (const noche of [false, true]) {
      const svg = r => readFileSync(resolve('public/habitacion', rutaIlustracion(r.imagen,noche)), 'utf8');
      expect(svg(catalogo.escenario)).not.toContain('cx="480" cy="682" rx="300" ry="38"');
      for (const sticker of catalogo.stickers) {
        const dibujo = svg(sticker);
        expect(dibujo).not.toContain('cx="120" cy="202" rx="54" ry="8"');
        expect(dibujo).not.toContain('<feOffset');
        expect(dibujo).toContain('flood-color="#FFFFFF"');
        expect(dibujo).toContain('<feMergeNode in="papel"/>');
      }
    }
  });
});
