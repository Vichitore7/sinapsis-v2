# Habitación del ajolote — Sinapsis V2

## Arquitectura y alcance

Módulo integrado en la app React/Vite y la API FastAPI/SQLAlchemy/SQLite existentes. La navegación del alumno cambia Mochila por Habitación (`#/habitacion`); el enlace antiguo sigue funcionando. El rol profesor conserva su menú original. La pantalla Mochila original permanece en el repositorio como referencia, sin ruta separada.

- Escenario isométrico 2D SVG, `viewBox` 960 × 760; no requiere Konva ni nuevos paquetes. Pointer Events y transformación de coordenadas con `getScreenCTM().inverse()`, compatible en diseño con ratón, lápiz y toque. Flechas alternativas para desplazar. El orden del arreglo controla la profundidad dentro de cada grupo (pared/suelo); la mascota se dibuja delante. Se valida el anclaje, no la huella completa del mueble; no hay colisiones y se permite superponer.
- 18 stickers independientes, 6 estados gráficos, 4 iconos y un fondo. SVG del kit anterior. Tres iniciales gratuitos (cama, tapete, alga). Una copia de cada diseño por alumno. Los accesorios originales de cofres siguen siendo distintos y visibles en Inicio/Logros.
- Economía original: 3 estrellas a la primera, 2 con ayuda, bono diario 5, cofre 10. Los precios de la nueva tienda se ajustaron a 3–25, niveles 1–3. Nivel = XP acumulada // 30 + 1. No se duplica saldo ni usuario. Los cuidados mantienen los costos originales (alimentar 1, jugar 2, limpiar/dormir/despertar gratis).
- El bienestar original usa tres medidores de 1 a 5 (comida, pecera, alegría); disminuyen al jugar retos, nunca por ausencia. Se conserva dormir/despertar sin introducir un medidor de energía ni decay temporal. Reacciones visuales al decorar y cuidar. El ajolote no muere.
- Minijuego Burbujas: seis objetivos emitidos/validados por el servidor, sin penalizaciones; sesión de cinco minutos, +1 alegría (máximo 5) una vez por partida, sin estrellas/XP. No pretende ser un mecanismo antifraude fuerte; no genera recompensas económicas.
- Guardado explícito en servidor con revisión optimista. Si otro dispositivo guardó, responde 409; recargar descarta borrador local. Sin conexión no se puede comprar ni guardar. Se impide que el service worker almacene respuestas API; mantiene caché de recursos públicos.

## Datos y API

Tablas nuevas creadas de forma aditiva por `Base.metadata.create_all` al arrancar: `habitaciones` (alumno, objetos JSON, revisión), `inventario_habitacion` (alumno/sticker, precio pagado, fecha), `partidas_burbujas` (una sesión por alumno). Las tablas existentes no se alteran. El catálogo autorizado es `backend/app/catalogo_habitacion.json`; su copia pública sirve para inspección. Cambiar precios o tamaños en ambas copias si se editan manualmente; la aplicación consume el catálogo del servidor.

Todas las rutas requieren la cookie JWT existente y rol alumno (o admin, como el resto del juego). No aceptan identificadores de usuario desde el navegador. Transacciones SQLite `BEGIN IMMEDIATE` serializan compras, retos y cuidados antes de consultar saldo; el inventario tiene clave única, los reintentos de compra no cobran dos veces. No se probó otro motor de base de datos.

| Método | Ruta | Entrada |
|---|---|---|
| GET | /api/habitacion | — |
| PUT | /api/habitacion | `{revision, objetos:[{stickerId,x,y}]}` (orden = capas) |
| POST | /api/habitacion/compras | `{stickerId}` |
| POST | /api/habitacion/burbujas | — |
| POST | /api/habitacion/burbujas/golpe | `{partidaId,paso,celda}` |

Las operaciones de habitación devuelven `objetos`, `revision`, `inventario` y el resumen `estado` existente; GET también devuelve `catalogo`. El minijuego devuelve `partidaId`, `objetivo`, `aciertos`, `total`, `finalizada` y, al completar, `estado`. Las rutas existentes `/api/mascota/*` se reutilizan.

## Fases implementadas

1. Recursos gráficos: `frontend/public/habitacion/`.
2. Pantalla Habitación, navegación y estilos: `frontend/src/pantallas/Habitacion.jsx`, `App.jsx`.
3. Motor gráfico SVG: `habitacion/Escenario.jsx` y `geometria.js`.
4. Editor: inventario, posicionamiento táctil/ratón, controles de flecha, capas, retirar y recolocar.
5. Cuidados: reutilización de mascota, medidores y sesión originales; dormir/despertar, cambio de nombre y reacciones.
6. Tienda e inventario: catálogo y compras con saldo real.
7. Backend, JWT y SQLite: modelos y rutas nuevas, guardado por alumno.
8. Minijuego Burbujas.
9. Integración y pruebas: pruebas de API y geometría, build Vite; falta la validación visual en navegador físico o local (el navegador del entorno de trabajo bloqueó la navegación a localhost).

## Prueba manual de aceptación

1. Inicia ambos servicios siguiendo el README. Registra un alumno (no profesor), entra en Habitación y verifica los tres stickers gratuitos.
2. Abre Decorar, arrastra una cama y cambia la capa; usa flechas, retira y vuelve a colocar otro elemento. Pulsa Guardar. Recarga la página: posiciones y capas deben conservarse.
3. Resuelve el primer reto del mapa (3 × 6). Con 8 estrellas iniciales (3 + bono diario de 5 si es el primer reto del día), compra Concha por 4. Verifica saldo 4 y que el sticker aparece en Decorar. Reintentar compra no descuenta.
4. Alimenta, limpia, duerme y despierta; comprueba el estado en Inicio. Juega Burbujas hasta completar seis objetivos y verifica que no cambia el saldo.
5. Abre la cuenta en otra pestaña/dispositivo y guarda un cambio. Una revisión antigua debe dar conflicto, sin sobreescribir.
6. Prueba en un teléfono en la misma red: controles táctiles, desplazamiento y botones. Comprueba Inicio, Mapa, Escáner, Logros, Perfil y rol profesor.

El paquete no incluye `.env`, `selva.db`, dependencias instaladas ni `.git`. Para conservar cuentas y progreso de la instalación original, copia tu base y `.env` desde tu carpeta local (sin compartirlas); haz respaldo antes. No ejecutes la semilla demo sobre tu base real. La app crea las tablas nuevas al arrancar. Consulta README.
