// Íconos tipo sticker (README > Iconografía): forma rellena, contorno de 2px en tinta,
// borde blanco y sombra sólida (la sombra y el borde los pone la clase .sticker).

const T = { stroke: 'var(--tinta)', strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' };

const FORMAS = {
  inicio: (
    <>
      <path d="M10 30 L32 12 L54 30 L54 54 L10 54 Z" fill="var(--selva)" {...T} />
      <rect x="26" y="36" width="12" height="18" rx="3" fill="var(--sol)" {...T} />
    </>
  ),
  mapa: (
    <>
      <path d="M8 16 L24 10 L40 16 L56 10 L56 50 L40 56 L24 50 L8 56 Z" fill="var(--sol)" {...T} />
      <path d="M18 40 Q26 22 34 32 T48 22" fill="none" stroke="var(--magia)" strokeWidth="3" strokeDasharray="4 4" strokeLinecap="round" />
    </>
  ),
  escaner: (
    <>
      <rect x="8" y="18" width="48" height="34" rx="8" fill="var(--pista)" {...T} />
      <rect x="22" y="10" width="20" height="10" rx="3" fill="var(--pista)" {...T} />
      <circle cx="32" cy="35" r="10" fill="var(--superficie)" {...T} />
    </>
  ),
  aula: (
    <>
      <rect x="8" y="12" width="48" height="32" rx="4" fill="var(--selva-profundo)" {...T} />
      <path d="M16 24 h14 M16 32 h22" stroke="var(--superficie)" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 44 L18 56 M42 44 L46 56" {...T} fill="none" />
    </>
  ),
  mochila: (
    <>
      <rect x="12" y="16" width="40" height="40" rx="12" fill="var(--magia)" {...T} />
      <rect x="20" y="34" width="24" height="16" rx="4" fill="var(--sol)" {...T} />
      <path d="M24 16 Q24 6 32 6 Q40 6 40 16" fill="none" {...T} />
    </>
  ),
  logros: (
    <>
      <path d="M32 6 L39 22 L56 24 L43 36 L47 54 L32 45 L17 54 L21 36 L8 24 L25 22 Z" fill="var(--sol)" {...T} />
    </>
  ),
  comida: (
    <path d="M8 40 Q16 20 26 40 T44 40 T62 40" fill="none" stroke="var(--ajolote-rosa-profundo)" strokeWidth="7" strokeLinecap="round" />
  ),
  pecera: (
    <>
      <ellipse cx="32" cy="48" rx="24" ry="11" fill="var(--popo)" {...T} />
      <ellipse cx="32" cy="34" rx="17" ry="10" fill="var(--popo)" {...T} />
      <ellipse cx="34" cy="21" rx="10" ry="8" fill="var(--popo)" {...T} />
      <circle cx="26" cy="35" r="2.4" fill="var(--tinta)" /><circle cx="38" cy="35" r="2.4" fill="var(--tinta)" />
    </>
  ),
  alegria: (
    <>
      <circle cx="32" cy="32" r="22" fill="var(--sol)" {...T} />
      <path d="M12 24 Q32 36 52 24 M12 42 Q32 30 52 42" fill="none" stroke="var(--magia)" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  candado: (
    <>
      <rect x="14" y="28" width="36" height="28" rx="6" fill="var(--superficie)" {...T} />
      <path d="M22 28 V20 Q22 10 32 10 Q42 10 42 20 V28" fill="none" {...T} />
    </>
  ),
  cofre: (
    <>
      <rect x="8" y="26" width="48" height="28" rx="4" fill="var(--sol)" {...T} />
      <path d="M8 26 Q8 12 32 12 Q56 12 56 26 Z" fill="var(--sol-profundo)" {...T} />
      <rect x="27" y="22" width="10" height="12" rx="2" fill="var(--magia)" {...T} />
    </>
  ),
  bufanda: (
    <>
      <path d="M8 20 Q32 34 56 20 L56 32 Q32 46 8 32 Z" fill="var(--casi)" {...T} />
      <rect x="38" y="34" width="12" height="24" rx="4" fill="var(--casi)" {...T} />
    </>
  ),
  sombrero: (
    <>
      <ellipse cx="32" cy="44" rx="28" ry="8" fill="var(--sol)" {...T} />
      <path d="M14 44 Q14 16 32 16 Q50 16 50 44 Z" fill="var(--sol)" {...T} />
      <rect x="14" y="34" width="36" height="6" fill="var(--selva)" {...T} strokeWidth="2" />
    </>
  ),
};

export default function Icono({ nombre, tamano = 40, etiqueta, sticker = true }) {
  return (
    <svg
      className={sticker ? 'sticker' : undefined}
      width={tamano}
      height={tamano}
      viewBox="0 0 64 64"
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
    >
      {FORMAS[nombre]}
    </svg>
  );
}
