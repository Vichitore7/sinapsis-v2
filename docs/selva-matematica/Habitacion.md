# Habitación del ajolote — Sinapsis V2

## Arquitectura y alcance

Módulo integrado en la app React/Vite y la API FastAPI/SQLAlchemy/SQLite existentes. La navegación del alumno cambia Mascota por Habitación (`#/habitacion`); `#/mochila` y `#/mascota` siguen funcionando. El rol profesor conserva su menú original. La pantalla Mochila es un alias de Habitación. Se conserva el rediseño Stitch y el sistema de trajes de Xochimilco y subculturas; Trajes reutiliza el armario de Perfil y el personaje equipado aparece en el escenario.

- Escenario isométrico 2D SVG, `viewBox` 960 × 760; no requiere Konva ni nuevos paquetes. Pointer Events y transformación de coordenadas con `getScreenCTM().inverse()`, compatible en diseño con ratón, lápiz y toque. Flechas alternativas para desplazar. El orden del arreglo controla la profundidad dentro de cada grupo (pared/suelo); la mascota se dibuja delante. Se valida el anclaje, no la huella completa del mueble; no hay colisiones y se permite superponer.
- 18 stickers independientes, 4 iconos y un fondo. El ajolote usa siempre el componente Ajolote.jsx de Sinapsis; se retiraron los seis SVG alternativos de color naranja. Tres iniciales gratuitos (cama, tapete, alga). Una copia de cada diseño por alumno. Los accesorios originales de cofres siguen siendo distintos y visibles en Inicio, Perfil y la pestaña Trajes de Habitación.
- Economía original: 3 estrellas a la primera, 2 con ayuda, bono diario 5, cofre 10. Precios de 3–25 estrellas (más tres decoraciones gratuitas). Desde Tienda v4, los desbloqueos dependen de las trajineras superadas en El Canal de los Números, no del nivel de XP. No se duplica saldo ni usuario. Los cuidados son gratis; se usa el icono de estrella verde hueca del diseño Stitch. Una estrella adicional al pasar de menos de 5 a 5 marcas, sin XP.
- El bienestar original usa tres medidores de 1 a 5 (comida, pecera, alegría); disminuyen al jugar retos, nunca por ausencia. Alimentar y limpiar: +2 marcas, arrastra el objeto al ajolote; al aceptar el servidor aparecen destellos durante un segundo. Los tres cuidados (incluido dormir) tienen espera independiente de 180 segundos, persistida en SQLite. Dormir es visual: requiere cama colocada, guarda la escena si hay cambios, coloca el ajolote en el colchón, oscurece la pantalla; tocar en cualquier parte despierta y lo devuelve al centro, sin esperar. El ajolote no muere.
- Jugar lleva a `#/mapa` (Mapa de trajineras). El minijuego de burbujas se eliminó de interfaz y API. Cada reto nuevo correcto recupera +2 alegría excepto en el turno de desgaste de alegría (se conserva la bajada); los repasos no dan bienestar ni estrellas.
- Guardado explícito en servidor con revisión optimista. Si otro dispositivo guardó, responde 409; recargar descarta borrador local. Sin conexión no se puede comprar ni guardar. Se impide que el service worker almacene respuestas API; mantiene caché de recursos públicos.

## Datos y API

Tablas nuevas creadas de forma aditiva por `Base.metadata.create_all` al arrancar: `habitaciones` (alumno, objetos JSON, revisión), `inventario_habitacion` (alumno/sticker, precio pagado, fecha). La migración añade `mascotas.cuidados_hasta` (JSON con plazos en segundos Unix) sin borrar datos. Si ya existe la tabla histórica `partidas_burbujas`, se conserva inactiva; no se crea en instalaciones nuevas. El catálogo autorizado es `backend/app/catalogo_habitacion.json`; su copia pública sirve para inspección. Cambiar precios o tamaños en ambas copias si se editan manualmente; la aplicación consume el catálogo del servidor.

Todas las rutas requieren la cookie JWT existente y rol alumno (o admin, como el resto del juego). No aceptan identificadores de usuario desde el navegador. Transacciones SQLite `BEGIN IMMEDIATE` serializan compras, retos y cuidados antes de consultar saldo; el inventario tiene clave única, los reintentos de compra no cobran dos veces. No se probó otro motor de base de datos.

| Método | Ruta | Entrada |
|---|---|---|
| GET | /api/habitacion | — |
| PUT | /api/habitacion | `{revision, objetos:[{stickerId,x,y}]}` (orden = capas) |
| POST | /api/habitacion/compras | `{stickerId}` |
| POST | /api/mascota/cuidar | `{accion: alimentar, limpiar o descansar}` |
| POST | /api/mascota/despertar | — |

Las operaciones de habitación devuelven `objetos`, `revision`, `inventario`, `trajineras` (número, título, resueltos, total, superada) y el resumen `estado` existente; GET también devuelve `catalogo`. El estado de mascota devuelve `cuidados_restantes` en segundos, calculados en el servidor. El cliente representa el contador con reloj monotónico; FastAPI verifica el plazo y la recompensa en la transacción.

## Fases implementadas

1. Recursos gráficos: `frontend/public/habitacion/`.
2. Pantalla Habitación, navegación y estilos: `frontend/src/pantallas/Habitacion.jsx`, `App.jsx`.
3. Motor gráfico SVG: `habitacion/Escenario.jsx` y `geometria.js`.
4. Editor: inventario, posicionamiento táctil/ratón, controles de flecha, capas, retirar y recolocar.
5. Cuidados: reutilización de mascota, medidores y sesión originales; dormir/despertar, cambio de nombre y reacciones.
6. Tienda e inventario: catálogo y compras con saldo real.
7. Backend, JWT y SQLite: modelos y rutas nuevas, guardado por alumno.
8. Jugar redirige a Mundos; el minijuego de la versión anterior está retirado.
9. Integración y pruebas: pruebas de API y geometría, build Vite; consulta PRUEBAS-HABITACION.md para resultados de esta integración.

## Prueba manual de aceptación

1. Inicia ambos servicios siguiendo el README. Registra un alumno (no profesor), completa el diagnóstico inicial y entra en Habitación y verifica los tres stickers gratuitos.
2. Abre Decorar, arrastra una cama y cambia la capa; usa flechas, retira y vuelve a colocar otro elemento. Pulsa Guardar. Recarga la página: posiciones y capas deben conservarse.
3. Resuelve el primer reto de El Canal de los Números (`x1-n01-1`). Con 9 estrellas iniciales (3 + bono diario de 5 + 1 por llenar alegría si parte de 4), compra Concha por 4. Verifica saldo 5 y que el sticker aparece en Decorar. Reintentar compra no descuenta.
4. Arrastra comida y esponja dentro y fuera del ajolote; verifica +2 marcas, destellos solo al soltar correctamente y +1 estrella solo al llenar una barra. Repite antes/después de 3 minutos y recarga. Mueve o retira la cama y comprueba dormir, pantalla oscura, toque para despertar y regreso al centro. Jugar abre Mundos.
5. Abre la cuenta en otra pestaña/dispositivo y guarda un cambio. Una revisión antigua debe dar conflicto, sin sobreescribir.
6. Prueba en un teléfono en la misma red: controles táctiles, desplazamiento y botones. Comprueba Inicio, Mapa, Escáner, Logros, Perfil y rol profesor.

El paquete no incluye `.env`, `selva.db`, dependencias instaladas ni `.git`. Para conservar cuentas y progreso de la instalación original, copia tu base y `.env` desde tu carpeta local (sin compartirlas); haz respaldo antes. No ejecutes la semilla demo sobre tu base real. La app crea las tablas nuevas al arrancar. Consulta README.

## Tienda v4: desbloqueo por trajineras

El catálogo define `mapaTienda.id = x1` y `trajineraRequerida` por sticker (0 = sin requisito). La API lee los ejercicios reales de ese mapa, los agrupa por el número de trajinera (`datos.nivel`) y compara con el progreso persistido del alumno. En el contenido actual hay tres retos por trajinera y doce trajineras. No basta con llegar a la trajinera, tener XP alta ni tener estrellas suficientes. No se requiere terminar el examen general.

| Requisito | Stickers nuevos disponibles |
|---|---|
| Inicio | Cama, tapete, alga, mesa, lámpara, helecho, coral, jardín de algas, piedras, concha, cuadro |
| Trajinera 3 | Anémona, nenúfar |
| Trajinera 6 | Sillón, librero, ventana |
| Trajinera 9 | Burbujeador |
| Trajinera 12 | Cofre de tesoro |

Los precios permanecen iguales. La compra sigue exigiendo saldo suficiente y es validada en el servidor. Los stickers adquiridos anteriormente se conservan incluso si su nuevo requisito no se ha cumplido. No hay migración de base de datos ni duplicación del progreso. La asignación de requisitos es configurable en el catálogo de servidor y su copia pública. El nivel de XP permanece activo en el resto de Sinapsis.

### Trajes v4
El aspecto predeterminado es `traje: null` (Sin traje especial). El armario muestra esta opción primero, permite volver a ella y conserva los trajes ganados y equipados anteriormente. El personaje en la habitación usa siempre el mismo componente que el armario, también al dormir.
