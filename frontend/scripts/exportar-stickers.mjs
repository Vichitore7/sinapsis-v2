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
  // Subculturas de la CDMX (premio del examen general del Mundo 1): todos los trajes de TrajesSubculturas.jsx.
  ...['emo-rayas', 'emo-mono', 'hippie-guitarra', 'hippie-flores', 'punk-verde', 'punk-rosa', 'skate-gorra', 'skate-gorro',
    'manif-xochimilco', 'manif-ajolote', 'ska-sombrero', 'ska-cuadros', 'rap-gorra', 'rap-chongo', 'rock-chopo', 'rock-mezclilla',
    'dark-capa', 'dark-encaje', 'lucha-azul', 'lucha-rosa',
    // Rumbo a la FES Aragón (premio del Mundo 2)
    'fes-gorra', 'fes-cabello'].map((t) => ({ archivo: `kiko-${t}`, traje: t })),
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

// ---------- Mundo 1 "El Canal de los Números": trajineras, chinampas y objetos para contar ----------

const SALIDA_CANAL = resolve(FRONTEND, '..', 'docs', 'imagenes', 'canal');
const SALIDA_CANAL_SVG = join(SALIDA_CANAL, 'svg');

async function cargarCanal() {
  mkdirSync(TEMP, { recursive: true });
  const destino = join(TEMP, 'Canal.mjs');
  await build({
    entryPoints: [join(FRONTEND, 'src', 'componentes', 'Canal.jsx')],
    bundle: true, format: 'esm', platform: 'node', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime'], outfile: destino, logLevel: 'silent',
  });
  return import(pathToFileURL(destino).href);
}

/** Los dibujos del canal que se exportan. Cada uno sale del mismo componente que usa la app. */
function stickersCanal(C) {
  const h = createElement;
  return [
    ...['rojo', 'azul', 'verde', 'amarillo', 'rosa'].map((color) => ({
      archivo: `trajinera-${{ rojo: 'roja', azul: 'azul', verde: 'verde', amarillo: 'amarilla', rosa: 'rosa' }[color]}`,
      el: h(C.Trajinera, { color }),
    })),
    ...['rojo', 'azul', 'verde', 'amarillo', 'rosa'].map((color) => ({
      archivo: `trajinera-nivel-${{ rojo: 'roja', azul: 'azul', verde: 'verde', amarillo: 'amarilla', rosa: 'rosa' }[color]}`,
      el: h(C.TrajineraNivel, { estado: 'hecho', color }),
    })),
    { archivo: 'chinampa-ahuejotes', el: h(C.ChinampaIsla, { variante: 0 }) },
    { archivo: 'chinampa-casita', el: h(C.ChinampaIsla, { variante: 1 }) },
    { archivo: 'chinampa-cempasuchil', el: h(C.ChinampaIsla, { variante: 2 }) },
    { archivo: 'lirio', el: h(C.Lirio) },
    { archivo: 'pez', el: h(C.Pez, {}) },
    { archivo: 'flor', el: h(C.Flor, {}) },
    { archivo: 'persona', el: h(C.Persona, {}) },
    { archivo: 'sombrerito', el: h(C.Sombrerito, {}) },
    { archivo: 'jarrito', el: h(C.Jarrito, {}) },
    { archivo: 'ramo', el: h(C.Ramo) },
  ];
}

/**
 * Deja el SVG listo para usarse solo: con margen y con el borde blanco de sticker dibujado por un filtro
 * (en la app ese borde lo pone la clase .sticker de app.css, que fuera de la app no existe).
 */
function aSvgCanal(markup) {
  const svg = markup.match(/<svg[\s\S]*<\/svg>/)[0]; // TrajineraNivel y Ramo vienen dentro de un <span>
  const [vx, vy, vw, vh] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const lado = Math.max(vw, vh);
  const borde = +(lado * 0.035).toFixed(2); // grosor del borde blanco (≈ el de Kiko)
  const caida = +(lado * 0.025).toFixed(2); // sombrita de abajo
  const m = borde * 2 + caida;
  const [x, y, w, h] = [vx - m, vy - m, vw + 2 * m, vh + 2 * m];
  const ancho = w >= h ? LADO : Math.round((LADO * w) / h);
  const alto = h >= w ? LADO : Math.round((LADO * h) / w);
  const filtro = `<defs><filter id="borde-sticker" filterUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}" color-interpolation-filters="sRGB">`
    + `<feMorphology in="SourceAlpha" operator="dilate" radius="${borde}" result="grueso"/>`
    + '<feFlood flood-color="#ffffff"/><feComposite in2="grueso" operator="in" result="blanco"/>'
    + `<feOffset in="grueso" dy="${caida}" result="bajo"/>`
    + '<feFlood flood-color="#1e1b3a" flood-opacity="0.22"/><feComposite in2="bajo" operator="in" result="sombra"/>'
    + '<feMerge><feMergeNode in="sombra"/><feMergeNode in="blanco"/><feMergeNode in="SourceGraphic"/></feMerge>'
    + '</filter></defs>';
  const interior = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const salida = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="${x} ${y} ${w} ${h}">`
    + `${filtro}<g filter="url(#borde-sticker)">${interior}</g></svg>`;
  return { svg: `<?xml version="1.0" encoding="UTF-8"?>\n${salida}\n`, ancho, alto };
}

// Qué exportar: `npm run stickers` hace todo; `npm run stickers -- kiko` o `-- canal` solo esa parte.
const solo = process.argv[2];
mkdirSync(SALIDA_SVG, { recursive: true });
const navegador = buscarNavegador();
if (!navegador) console.warn('No encontré Edge ni Chrome: solo genero los SVG.');

if (!solo || solo === 'kiko') {
  const Ajolote = await cargarAjolote();
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
  console.log(`Listo: ${SALIDA}`);
}

if (!solo || solo === 'canal') {
  const Canal = await cargarCanal();
  mkdirSync(SALIDA_CANAL_SVG, { recursive: true });
  for (const s of stickersCanal(Canal)) {
    const { svg, ancho, alto } = aSvgCanal(renderToStaticMarkup(s.el));
    const rutaSvg = join(SALIDA_CANAL_SVG, `${s.archivo}.svg`);
    writeFileSync(rutaSvg, svg);
    if (navegador) aPng(navegador, rutaSvg, join(SALIDA_CANAL, `${s.archivo}.png`), ancho, alto);
    console.log(`✓ canal/${s.archivo} (${ancho}×${alto})`);
  }
  console.log(`Listo: ${SALIDA_CANAL}`);
}
rmSync(join(TEMP, 'perfil-navegador'), { recursive: true, force: true });
