// Exporta los stickers de Kiko (sin traje y con cada traje típico) como SVG y PNG con fondo transparente.
// Usa el mismo componente Ajolote.jsx de la app, así que si cambia el dibujo basta con volver a correrlo.
//
//   cd frontend
//   npm run stickers
//
// Salida: docs/imagenes/stickers/ (PNG) y docs/imagenes/stickers/svg/ (SVG editables). El PNG se genera con Edge o Chrome en modo headless;
// si no hay ninguno instalado, solo se generan los SVG.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const FRONTEND = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = resolve(FRONTEND, '..', 'docs', 'imagenes', 'stickers');
const SALIDA_SVG = join(SALIDA, 'svg');
const TEMP = join(FRONTEND, 'node_modules', '.cache', 'stickers');
const LADO = 512; // px del lado más largo del PNG

// Colores con los que se ve Kiko en la app (tema Día del rediseño Stitch). En los stickers no cambian con el tema.
const COLORES = {
  '--tinta': '#1e1b3a', '--contorno': '#1e1b3a', '--superficie': '#ffffff', '--borde-sticker': '#ffffff',
  '--tinta-suave': '#47454f', '--sol': '#fbbf24', '--sol-profundo': '#f59e0b', '--selva': '#10b981',
  '--magia': '#fdab78', '--pista': '#4aa8ff', '--casi': '#ff9f6b',
  '--ajolote-rosa': '#ff8fb8', '--ajolote-rosa-profundo': '#e0628f',
  '--font-display': "'Plus Jakarta Sans', 'Nunito', sans-serif",
};

const STICKERS = [
  { archivo: 'kiko', traje: null },
  { archivo: 'kiko-trajinero', traje: 'trajinero' },
  { archivo: 'kiko-trajinera', traje: 'trajinera' },
];

async function cargarAjolote() {
  mkdirSync(TEMP, { recursive: true });
  const destino = join(TEMP, 'Ajolote.mjs');
  await build({
    entryPoints: [join(FRONTEND, 'src', 'componentes', 'Ajolote.jsx')],
    bundle: true, format: 'esm', platform: 'node', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime'], outfile: destino, logLevel: 'silent',
  });
  return (await import(pathToFileURL(destino).href)).default;
}

/** Cambia var(--x) por su color y deja margen para que no se corte el borde blanco del sticker. */
function aSvgSuelto(markup, cabeza) {
  let svg = markup.replace(/var\((--[\w-]+)\)/g, (_, nombre) => {
    if (!(nombre in COLORES)) throw new Error(`Falta el color de ${nombre} en COLORES`);
    return COLORES[nombre];
  });
  const [vx, vy, vw, vh] = cabeza ? [-4, 2, 208, 170] : [-8, -8, 216, 216];
  const ancho = vw >= vh ? LADO : Math.round((LADO * vw) / vh);
  const alto = vh >= vw ? LADO : Math.round((LADO * vh) / vw);
  svg = svg
    .replace(/viewBox="[^"]*"/, `viewBox="${vx} ${vy} ${vw} ${vh}"`)
    .replace(/width="[^"]*"/, `width="${ancho}"`)
    .replace(/height="[^"]*"/, `height="${alto}"`)
    .replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return { svg: `<?xml version="1.0" encoding="UTF-8"?>\n${svg}\n`, ancho, alto };
}

function buscarNavegador() {
  const opciones = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ];
  return opciones.find((r) => existsSync(r)) || null;
}

function aPng(navegador, rutaSvg, rutaPng, ancho, alto) {
  // Una página mínima con el SVG a tamaño exacto y fondo transparente.
  const html = join(TEMP, 'captura.html');
  writeFileSync(html, `<!doctype html><html><head><style>html,body{margin:0;background:transparent}img{display:block}</style></head>`
    + `<body><img src="${pathToFileURL(rutaSvg).href}" width="${ancho}" height="${alto}"></body></html>`);
  execFileSync(navegador, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${join(TEMP, 'perfil-navegador')}`, '--default-background-color=00000000',
    `--window-size=${ancho},${alto}`, `--screenshot=${rutaPng}`, pathToFileURL(html).href,
  ], { stdio: 'ignore', timeout: 60000 });
}

const Ajolote = await cargarAjolote();
mkdirSync(SALIDA_SVG, { recursive: true });
const navegador = buscarNavegador();
if (!navegador) console.warn('No encontré Edge ni Chrome: solo genero los SVG.');

for (const s of STICKERS) {
  for (const cabeza of [false, true]) {
    const nombre = `${s.archivo}${cabeza ? '-cabeza' : ''}`;
    const markup = renderToStaticMarkup(createElement(Ajolote, { estado: 'feliz', tamano: LADO, traje: s.traje, cabeza }));
    const { svg, ancho, alto } = aSvgSuelto(markup, cabeza);
    const rutaSvg = join(SALIDA_SVG, `${nombre}.svg`);
    writeFileSync(rutaSvg, svg);
    if (navegador) aPng(navegador, rutaSvg, join(SALIDA, `${nombre}.png`), ancho, alto);
    console.log(`✓ ${nombre} (${ancho}×${alto})`);
  }
}
rmSync(join(TEMP, 'perfil-navegador'), { recursive: true, force: true });
console.log(`Listo: ${SALIDA}`);
