# Imágenes de Selva Matemática

Aquí se guardan **todas las imágenes PNG** del proyecto (stickers, ilustraciones, capturas para presentaciones…), listas para usarse fuera de la app: presentaciones, redes, pósters, documentos.

## Cómo está organizada

Una carpeta por tema. Dentro de cada una, los PNG van sueltos y, si existen, sus SVG editables en `svg/`.

```
docs/imagenes/
├── README.md
└── stickers/                 Kiko el ajolote como sticker (fondo transparente, 512 px)
    ├── kiko.png                      Kiko sin traje
    ├── kiko-cabeza.png               Solo la cabecita
    ├── kiko-trajinero.png            Traje de trajinero de Xochimilco
    ├── kiko-trajinero-cabeza.png
    ├── kiko-trajinera.png            Traje de trajinera de Xochimilco
    ├── kiko-trajinera-cabeza.png
    └── svg/                          Los mismos dibujos en SVG (se agrandan sin perder calidad;
                                      se editan en Figma o Illustrator)
```

## Reglas

- **Nombres** en minúsculas, sin acentos ni espacios, con guiones: `kiko-trajinera-cabeza.png`.
- **Fondo transparente** en stickers e ilustraciones (si una imagen lleva fondo, que sea a propósito).
- **Tema nuevo = carpeta nueva** (por ejemplo `mundos/`, `logros/`, `presentacion/`).
- No pongas aquí imágenes que use la app en pantalla: esas viven en `frontend/`.

## Volver a generar los stickers

Los stickers salen del mismo dibujo de la app (`frontend/src/componentes/Ajolote.jsx`). Si cambia el dibujo o se agrega un traje:

```powershell
cd frontend
npm run stickers
```

El script (`frontend/scripts/exportar-stickers.mjs`) sobrescribe los archivos de `stickers/` y `stickers/svg/`. Para el PNG usa Edge o Chrome sin abrir ventanas; no hay que instalar nada.
