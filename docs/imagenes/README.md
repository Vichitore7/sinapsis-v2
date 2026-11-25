# Imágenes de Selva Matemática

Aquí se guardan **todas las imágenes PNG** del proyecto (stickers, ilustraciones, capturas para presentaciones…), listas para usarse fuera de la app: presentaciones, redes, pósters, documentos.

## Cómo está organizada

Una carpeta por tema. Dentro de cada una, los PNG van sueltos y, si existen, sus SVG editables en `svg/`.

```
docs/imagenes/
├── README.md
├── stickers/                 Kiko el ajolote como sticker (fondo transparente, 512 px)
│   ├── kiko.png                      Kiko sin traje
│   ├── kiko-cabeza.png               Solo la cabecita
│   ├── kiko-trajinero.png            Traje de trajinero de Xochimilco
│   ├── kiko-trajinero-cabeza.png
│   ├── kiko-trajinera.png            Traje de trajinera de Xochimilco
│   ├── kiko-trajinera-cabeza.png
│   ├── kiko-<subcultura>-<estilo>.png  Premio del examen del Mundo 1: 20 trajes de subculturas de la CDMX
│   │                                 (emo, hippie, punk, skate, manifestante ambientalista, ska, rap, rock,
│   │                                 dark y lucha libre), dos estilos de cada una, también en versión -cabeza
│   ├── kiko-fes-gorra.png / kiko-fes-cabello.png   Premio del Mundo 2: rumbo a la FES Aragón (sudadera azul
│   │                                 con patita dorada, tenis y audífonos), también en versión -cabeza
│   ├── kiko-nevado-gorro.png / kiko-nevado-orejeras.png   Premio del Mundo 3: ropa para el frío, rumbo al
│   │                                 Nevado de Toluca, también en versión -cabeza
│   └── svg/                          Los mismos dibujos en SVG (se agrandan sin perder calidad;
│                                     se editan en Figma o Illustrator)
└── canal/                    Mundo 1 "El Canal de los Números" como stickers (borde blanco, 512 px)
    ├── trajinera-<color>.png         Trajinera de los ejercicios (roja, azul, verde, amarilla, rosa)
    ├── trajinera-nivel-<color>.png   Trajinera de los niveles del mapa (la portada va sin número)
    ├── chinampa-ahuejotes.png        Chinampas de las orillas: con ahuejotes, con casita
    ├── chinampa-casita.png           y con surcos de cempasúchil
    ├── chinampa-cempasuchil.png
    ├── lirio.png, pez.png, flor.png, persona.png, sombrerito.png, jarrito.png, ramo.png
    └── svg/                          Los mismos dibujos en SVG (el borde blanco va incluido)
└── fes/                      Mundo 3 "La FES de los Números" como stickers (borde blanco, 512 px)
    ├── peluche-mascota.png           Sticker de premio: peluche de la mascota de la FES
    ├── tlacuache.png                 Los 3 premios de cada nivel
    ├── titulo-fes-aragon.png         Letrero "¡Bienvenido a la FES Aragón!" del mapa
    ├── lugar-<lugar>.png             Lugares de los niveles: biblioteca, laboratorio, canchas, cafetería, auditorio,
    │                                 torre, explanada, salón y entrada (sin número)
    ├── campus-<cosa>.png             Decoración del mapa: torres, auditorio, mascota, hombre de morado, edificio,
    │                                 laboratorio, cancha, cafetería, puesto, alumnos, árbol, bici y banca
    └── svg/
```

## Reglas

- **Nombres** en minúsculas, sin acentos ni espacios, con guiones: `kiko-trajinera-cabeza.png`.
- **Fondo transparente** en stickers e ilustraciones (si una imagen lleva fondo, que sea a propósito).
- **Tema nuevo = carpeta nueva** (por ejemplo `mundos/`, `logros/`, `presentacion/`).
- No pongas aquí imágenes que use la app en pantalla: esas viven en `frontend/`.

## Volver a generar los stickers

Los stickers salen del mismo dibujo de la app: Kiko de `frontend/src/componentes/Ajolote.jsx`, el canal de `frontend/src/componentes/Canal.jsx` y la FES de `frontend/src/componentes/FES.jsx`. Por eso un elemento que se repite (una trajinera, un pez, una flor) siempre es el mismo dibujo, en la app y aquí. Si cambia un dibujo o se agrega uno nuevo:

```powershell
cd frontend
npm run stickers            # todo
npm run stickers -- kiko    # solo Kiko
npm run stickers -- canal   # solo el canal
npm run stickers -- fes     # solo la FES
```

El script (`frontend/scripts/exportar-stickers.mjs`) sobrescribe los archivos de `stickers/`, `canal/` y `fes/` (y sus `svg/`). En la app, el borde blanco lo pone la clase `.sticker` de `app.css`; en los SVG exportados va dibujado dentro del archivo para que se vea igual fuera de la app. Para el PNG usa Edge o Chrome sin abrir ventanas; no hay que instalar nada.
