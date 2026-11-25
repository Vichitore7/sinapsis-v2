# Selva Matemática

Sistema de diseño de la plataforma gamificada de matemáticas básicas para niñas, niños y adolescentes de 9 a 15 años en México. La alumna o el alumno explora una **selva mágica** de mundos y retos junto a un **ajolote guía** que nunca castiga el error: lo convierte en una pista. El estilo es de **aventura / videojuego**, con botones 3D que se hunden al tocarlos, ilustraciones tipo sticker y una paleta verde, morada y amarilla.

Este es un primer sistema hecho desde cero para el hackatón: no hay logotipo todavía, así que el nombre se escribe en Baloo 2 ExtraBold, en color `tinta`.

## Principios

1. **El error es un sendero, no una caída.** Nunca rojo, nunca se quitan vidas ni puntos. El error usa `casi` (durazno) y siempre lleva a una pista o a reintentar.
2. **Se nota qué se puede tocar.** Todo lo presionable tiene contorno de 2px en `tinta` y sombra sólida abajo (`sombra-boton`). Lo que no se toca es plano.
3. **Funciona en el peor salón.** Pantallas baratas, proyectores deslavados y sin internet: contrastes altos, sin sombras difusas, ilustraciones en SVG ligero y fuentes guardadas en el dispositivo.
4. **El ajolote acompaña, no distrae.** Aparece para celebrar, para preguntar y para animar. Nunca tapa el reto.

## Contenido y voz: el explorador épico

El ajolote habla como el narrador de una aventura: misiones, senderos, mapas y tesoros. Tutea, va en español de México y nunca regaña.

La regla que equilibra la épica con la pedagogía: **lo épico va en la narrativa, lo claro va en la pista.** Celebraciones, entradas a un mundo y regresos pueden ser grandilocuentes. Las pistas socráticas son siempre una pregunta concreta sobre el paso donde se torció el procedimiento.

| Momento | Sí | No |
|---|---|---|
| Acierto | “¡Misión cumplida, explorador!” | “Correcto.” |
| Error | “¡Casi! El sendero se torció en el paso 3. ¿Lo revisamos juntos?” | “Incorrecto. -1 vida.” |
| Pista | “¿12 + 12 + 12 da 26?” | “El sendero de los números esconde un secreto…” (demasiado vago) |
| Regreso tras días sin entrar | “¡La selva te esperaba! ¿Seguimos la aventura?” | “Tu mascota está triste porque no viniste.” |
| Modo Aula | “¡Expedición del 5.º B: 3 de 5 misiones!” | Rankings con nombres de alumnos. |

- Máximo 3 pistas por reto; después, un ejemplo resuelto parecido (nunca la respuesta del mismo reto).
- Los números se escriben con cifras (“3 mangos”), los precios con `$` y sin decimales cuando no hacen falta.
- Contextos cotidianos de México: tienditas, mercados, tortas, pasajes, recetas.
- Sin emojis en el texto de la interfaz; los íconos sticker cumplen esa función.

## Fundamentos visuales

### Color
- `fondo` en toda la app; `superficie` para tarjetas y globos.
- `selva` es la acción principal; su texto va en `tinta`, nunca en blanco (no pasa contraste).
- `magia` es la acción secundaria y la identidad del ajolote (branquias); su texto va en blanco.
- `sol` se reserva para premios y para el nodo actual del mapa. Si todo brilla, nada brilla.
- Estados pedagógicos: acierto `selva` / `selva-suave`, pista `pista` / `pista-suave` / `pista-texto`, error formativo `casi` / `casi-suave` / `casi-texto`. Pista (azul) y casi (durazno) se distinguen también por luminosidad e ícono, no solo por color.
- `ajolote-rosa` y `ajolote-rosa-profundo` son exclusivos de la mascota.

### Tipografía
- **Baloo 2** (ExtraBold 800 / Bold 700) para títulos y botones: gordita y de juego.
- **Nunito** para enunciados, diálogos y **todos los números** (`numero-reto`): sus cifras son las más legibles.
- Cuerpo mínimo de 18px (`cuerpo`). `etiqueta` (14px) solo para chips y contadores.
- Ambas son Google Fonts gratuitas; para el modo sin conexión se descargan en el service worker de la PWA.

### Forma y profundidad
- Radios: `radio-md` (16px) en botones, `radio-lg` (24px) en tarjetas, `radio-pill` en nodos e insignias.
- Contorno de 2px en `tinta` en todo lo interactivo.
- Sombras sólidas, nunca difusas: `sombra-boton`, `sombra-tarjeta`, `sombra-sticker`.
- Botón presionado: `transform: translateY(4px)` y sin sombra. Es el “clic” físico del juego.
- Espaciado en múltiplos de 4/8px (`espacio-1` a `espacio-6`). Área táctil mínima de 48px (`espacio-6`).

### Movimiento
- Rebotes cortos (150–250 ms) al presionar, al ganar un premio y al aparecer el ajolote.
- La tarjeta “¡Casi!” hace una sacudida suave de 200 ms, sin sonido de error.
- Respetar `prefers-reduced-motion`: sin rebotes ni sacudidas, solo cambios de color.

## Ilustración: estilo sticker

Mascota, premios e íconos se dibujan como **calcomanías**: formas planas en colores de la paleta, contorno interno en `tinta` o en el tono profundo, **borde blanco grueso** (6–8px en `superficie`) y `sombra-sticker` debajo.

- Los premios (alimentos, dulces, accesorios) son stickers coleccionables que van al álbum de logros.
- Formato SVG para que pesen KB y funcionen sin conexión.
- Sin degradados ni texturas.

### El ajolote guía
- Cuerpo `ajolote-rosa`, mejillas y sombras `ajolote-rosa-profundo`, branquias `magia` que **brillan** (se iluminan con `sol`) cuando el alumno aprende algo.
- Metáfora central: el ajolote se regenera. Equivocarse y volver a intentar lo hace más fuerte.
- Estados: **feliz** (por defecto), **curioso** (después de un error; nunca triste), **celebrando** (acierto o premio) y **dormido** (inactividad, sin culpa).
- Evolución: sus branquias ganan un color nuevo con cada mundo superado.

## Iconografía

Íconos ilustrados tipo sticker de 40–56px: forma rellena de la paleta, contorno de 2px en `tinta`, borde blanco de 4px y `sombra-sticker`. En la barra de navegación siempre llevan etiqueta de texto debajo (`etiqueta`).

Íconos base: Inicio, Mapa, Escáner de cuaderno, Modo Aula, Mochila (premios) y Logros. Todavía no existen como archivos; se dibujan siguiendo esta regla.

## Accesibilidad
- Texto con contraste de 4.5:1 o más (cada token lo indica en su nota).
- Foco del teclado: anillo de 3px en `pista` con 3px de separación.
- Nunca se comunica un estado solo con color: acierto lleva ✓, pista lleva ícono de lupa o globo, casi lleva el mensaje “¡Casi!”.
