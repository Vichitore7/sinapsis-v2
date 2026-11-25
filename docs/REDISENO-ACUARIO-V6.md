# Habitación V6 — Acuario de día y noche

Base: Sinapsis V2.0 Habitación V5.1.

- 18 decoraciones redibujadas en SVG; cada una dispone de una variante diurna y otra nocturna, con contorno blanco más ancho por la noche.
- Fondo isométrico de día y noche, misma geometría de 960 × 760. Paredes acuáticas, burbujas, reflejos, iluminación y sombras estáticas. La variante nocturna no implica dormir al ajolote.
- Los recursos diurnos mantienen sus rutas originales. Los nocturnos se guardan en `frontend/public/habitacion/noche/`. Las ilustraciones de Cuidados y los trajes se conservan.
- `tema.js` utiliza el tema global (`claro`, `oscuro`, `sistema`) y observa cambios en la preferencia de color del dispositivo. Escenario, Decorar y Tienda cargan la variante correspondiente, sin duplicar objetos en inventario.
- Sin cambios en backend, catálogo, precios, requisitos, anclajes, orden de capas, guardado, tiempos de espera, estrellas, skins ni base de datos. Se actualizó la versión de caché del service worker para evitar recursos gráficos antiguos.
- Compilación Vite correcta y 29 pruebas Vitest superadas (25 existentes y 4 nuevas). Composición y catálogo de recursos renderizados en Chromium; no equivale a una prueba completa de la sesión de usuario ni de los controles táctiles. No se ejecutó el backend porque se conserva sin cambios.

## Comprobaciones locales

1. Entrar a Habitación y cambiar entre tema claro, oscuro y sistema.
2. Comparar las imágenes en Decorar y Tienda; deben corresponder al tema.
3. Colocar objetos y cambiar su capa; alternar el tema y confirmar que las posiciones no varían.
4. Dormir y despertar a Kiko en ambos temas: la oscuridad por dormir sigue siendo independiente del tema global.
5. Comprobar los cuidados, los trajes, las compras y el guardado en un navegador de escritorio y móvil.

No se requiere migración. Conservar `.env` y la base de datos de la instalación funcional (con el servidor detenido y una copia de respaldo). Ejecutar `npm ci`, `npm run dev` o `npm run build` como en V5.1.
