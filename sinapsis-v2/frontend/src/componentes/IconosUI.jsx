// Íconos de línea (estilo Material/Lucide) para el rediseño Stitch.
// Los íconos tipo sticker de Iconos.jsx siguen usándose para premios y medidores.

const P = {
  habitacion: <><path d="M3 5l9-3 9 3v13l-9 4-9-4zM12 2v13M3 18l9-3 9 3M12 15v7" /></>,
  inicio: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" /></>,
  mapa: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>,
  escaner: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M8 9h8M8 12h8M8 15h5" /></>,
  aula: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.4" /><path d="M16 14.2c2.9 0 5 2.4 5 5.8" /></>,
  mochila: <><path d="M6 9a6 6 0 0 1 12 0v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" /><path d="M9 4.5V3h6v1.5M9 14h6M9 14v3" /></>,
  logros: <><path d="M8 4h8v6a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M10 18h4" /></>,
  perfil: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  estrella: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  fuego: <path d="M12 21c-3.9 0-7-2.8-7-6.5 0-3 2-5.2 3.5-6.8.4 1.6 1.2 2.8 2.4 3.3C10.6 7.5 12 4.6 14 3c.4 2.8 1.8 4.5 3.2 6 1.1 1.3 1.8 3 1.8 5 0 4-3.1 7-7 7z" />,
  corazon: <path d="M12 20s-7.5-4.6-9.2-9.3C1.7 7.4 3.8 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.4 0 5.5 3.4 4.4 6.7C19.5 15.4 12 20 12 20z" />,
  gema: <><path d="M6 4h12l3 5-9 11L3 9z" /><path d="M3 9h18M9 4l3 16 3-16" /></>,
  campana: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  huella: <><circle cx="7" cy="9" r="1.8" /><circle cx="11" cy="6" r="1.8" /><circle cx="15.5" cy="6.5" r="1.8" /><circle cx="18.5" cy="10.5" r="1.8" /><path d="M8 17c0-2.8 2.2-5 4.5-5s4 2 4 4.3c0 2-1.5 3.2-3.2 3.2-1 0-1.4-.5-2.3-.5S9.7 20 9 20c-.6 0-1-.7-1-3z" /></>,
  cohete: <><path d="M14 4c3.5-.8 5.8-.5 6 0 .5.2.8 2.5 0 6l-6 6-4-4z" /><path d="m10 12-3 0-3 3 4 1M12 14v3l-3 3-1-4M15 9h.01" /><path d="M6 18c-1 1-2 3-2 3s2-1 3-2" /></>,
  escudo: <><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  candado: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  checkCirculo: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  diana: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
  tarea: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" /></>,
  foco: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></>,
  enviar: <path d="M4 12 20 4l-4 16-4-6zM12 14l8-10" />,
  micro: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  camara: <><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></>,
  galeria: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M12 17v-5M9.5 14.5 12 12l2.5 2.5" /></>,
  descargar: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  imprimir: <><path d="M7 9V3h10v6M7 17H4v-7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7h-3" /><rect x="7" y="14" width="10" height="7" /></>,
  copiar: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  recargar: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  chispa: <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7zM19 16c.2 1.4.9 2.1 2.3 2.3-1.4.2-2.1.9-2.3 2.3-.2-1.4-.9-2.1-2.3-2.3 1.4-.2 2.1-.9 2.3-2.3z" />,
  jugar: <path d="M8 5v14l11-7z" />,
  birrete: <><path d="M2 9.5 12 5l10 4.5L12 14z" /><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9.5V15" /></>,
  rayo: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  gota: <path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z" />,
  cuchara: <><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10" /><path d="M17 3c-2 0-3 2.5-3 5.5S15 13 17 13v8" /></>,
  control: <><path d="M6 8h12a4 4 0 0 1 4 4l-.5 4a2.8 2.8 0 0 1-5 1.3L15 15H9l-1.5 2.3a2.8 2.8 0 0 1-5-1.3L2 12a4 4 0 0 1 4-4z" /><path d="M7 11v3M5.5 12.5h3M16 12h.01M18 13.5h.01" /></>,
  escoba: <><path d="M14 3 10 11" /><path d="M6 12h8l2 9H4z" /><path d="M8 16v5M12 16v5" /></>,
  cama: <><path d="M3 7v13M3 16h18v4M21 16v-4a3 3 0 0 0-3-3h-8v7" /><circle cx="7" cy="12" r="2" /></>,
  libro: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5M19 19v2H6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  ajustes: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  filtro: <path d="M4 5h16l-6 8v6l-4-2v-4z" />,
  cofre: <><rect x="3" y="10" width="18" height="10" rx="1" /><path d="M3 10a9 5 0 0 1 18 0M10 10v4h4v-4" /></>,
  llave: <><circle cx="7.5" cy="12" r="3.5" /><path d="M11 12h10M17 12v3M20 12v2" /></>,
  triangulo: <path d="M12 4 21 19H3z" />,
  cuadrado: <rect x="5" y="5" width="14" height="14" />,
  hexagono: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />,
  sombrero: <><ellipse cx="12" cy="17" rx="10" ry="3" /><path d="M6 16c0-5 2.5-9 6-9s6 4 6 9" /></>,
  matraz: <><path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" /><path d="M7 15h10" /></>,
  lupa: <><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></>,
  salir: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" /></>,
  wifi: <><path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" /><circle cx="12" cy="19" r="1" /></>,
  sinwifi: <><path d="M3 3l18 18M8.5 16a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 5-2.7M2 9a15 15 0 0 1 5.5-3.5M14.5 9.6a10 10 0 0 1 4.5 2.9M17 6a15 15 0 0 1 5 3" /><circle cx="12" cy="19" r="1" /></>,
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
  atras: <path d="M15 6l-6 6 6 6" />,
  cerebro: <><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1z" /><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1" /></>,
  rompecabezas: <path d="M5 8h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v3h-3a2 2 0 1 0-4 0H5v-3a2 2 0 1 0 0-4z" />,
  pulso: <path d="M3 12h4l2-5 4 10 2-5h6" />,
  globo: <path d="M4 5h16v11H9l-5 4z" />,
  altavoz: <><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></>,
  nota: <><path d="M9 18V5l10-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
  moneda: <><circle cx="12" cy="12" r="9" /><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2.1-.5-2.6-1.5M12 6.5V8M12 16v1.5" /></>,
  cubo: <><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></>,
};

export default function I({ n, tamano = 20, relleno = false, className = '', etiqueta, grosor = 2 }) {
  return (
    <svg
      className={`iu ${className}`}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill={relleno ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
    >
      {P[n]}
    </svg>
  );
}
