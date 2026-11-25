# Verificación de Sinapsis v2.0 — Cuidados v3

Base: `sinapsis-v2.0-habitacion-integrada.zip`, no la interfaz anterior. Se conservan los módulos educativos y los trajes.

## Resultados de esta entrega

- Backend: **61 pruebas superadas**, 2 advertencias de deprecación de HTTP 422. Incluye 4 pruebas nuevas de cuidados (reloj simulado, segunda sesión, concurrencia, dormir/cama/despertar y alegría por retos), además de las pruebas adaptadas de la economía y eliminación de Burbujas.
- Frontend: **18 pruebas superadas**, incluidas las tres pruebas nuevas de detección de caída sobre el ajolote, contador y posición del colchón. Compilación Vite de producción correcta.
- Migración SQLite: sobre una copia de la base de la integración anterior con 18 tablas, se añadió `mascotas.cuidados_hasta`, se ejecutó la migración dos veces y se verificó que no cambiaron los conteos de las tablas. Las instalaciones nuevas no crean `partidas_burbujas`; si ya existe, se preserva sin uso por seguridad de los datos.
- Las pruebas del tutor utilizan respuestas simuladas. Se reutilizó el entorno de pruebas temporal de la integración anterior (SDK Anthropic y adaptación de jiter por incompatibilidad de Python); no se empaqueta ese entorno. La comunicación real con Claude no se probó.
- No se realizó una prueba visual en navegador en esta entrega. El Chromium del entorno había bloqueado navegación local en la integración anterior. Falta comprobar manualmente arrastre real, controles táctiles, contraste, posición sobre el colchón y pantalla oscura. No hay despliegue público.

## Aceptación manual

1. Inicia backend y frontend con los comandos del README. Entra en Habitación como alumno. Comprueba que hay 4 pestañas: Cuidados, Decorar, Tienda, Trajes.
2. Arrastra alimento o esponja fuera del ajolote: no debe cambiar nada. Arrástralo sobre él: debe mostrar destellos, +2 marcas como máximo hasta 5 y un contador de 3:00. El otro cuidado sigue disponible.
3. Cuando una barra pase de incompleta a completa, verifica +1 estrella y XP sin cambio. Si ya está en 5, el cuidado no da otra estrella. Recarga la página y abre otra sesión durante la espera: no debe permitir repetir el mismo cuidado.
4. Pulsa Jugar: abre el Mapa/Mundos. Resuelve un reto nuevo correctamente: aumenta alegría en dos marcas, salvo el turno de desgaste de alegría. Al llenar alegría se recibe una estrella adicional sin XP. Repasos no generan ese premio.
5. Mueve la cama y pulsa Dormir: si hay cambios se guardan primero. El ajolote se coloca sobre el colchón y la pantalla se oscurece. Toca en cualquier punto: despierta sin esperar y vuelve al centro. No puede dormir otra vez hasta cumplir los 3 minutos desde el inicio anterior. Si retiras la cama, Dormir queda deshabilitado.
6. Compra una decoración con las estrellas verdes huecas; verifica que el saldo coincide con Inicio/Mundos. Comprueba que las compras, posiciones, capas y trajes ya adquiridos se conservan.
7. Repite las pruebas de arrastre y descanso en un celular. Verifica que funcionan las demás pantallas de la interfaz de tus compañeros.

No se incluyeron bases privadas, credenciales, dependencias instaladas ni artefactos de compilación. Conserva los archivos locales `.env` y `selva.db` de la versión integrada que estás usando. Detén los servidores y respalda la base antes de sustituir el código.

## Tienda v4 — desbloqueos por trajineras

Base: `sinapsis-v2.0-habitacion-cuidados-v3.zip`. Se conservan todas las mecánicas de cuidados y los precios. No se alteran las tablas, migraciones, reglas de XP ni los retos del mapa.

- Backend: 63 pruebas superadas (2 advertencias previas de HTTP 422). Dos pruebas nuevas verifican bloqueo aun con XP y saldo elevados, progreso parcial, desbloqueo al completar el tercer reto, aislamiento por alumno, precio, XP sin cambio, idempotencia y conservación/colocación de stickers adquiridos antes de v4.
- Frontend: 25 pruebas superadas; tres nuevas verifican estados de compra por requisito, saldo e inventario, dos el renderizado del personaje original y dos la opción predeterminada del armario. Build Vite correcto. Se ejecutaron mediante Node directamente porque los enlaces de los ejecutables npm del entorno de pruebas no tenían permiso de ejecución. No se incorporan dependencias nuevas.
- Se verificó que ambas copias del catálogo coinciden. Se actualizó la clave de caché del service worker. La API mantiene el saldo y progreso fuera de caché.
- Se reutilizó el entorno temporal de compatibilidad del SDK Anthropic (sin acceso al parser de streaming); las respuestas de tutor son simuladas. No se incluye ese entorno. No se probó la interfaz visual en navegador en esta entrega.

### Aceptación Tienda v4

1. Con una cuenta nueva entra a Habitación > Tienda: 0/12 trajineras, tres objetos iniciales adquiridos, grupos de requisitos 3/6/9/12 bloqueados y precios verdes visibles.
2. Resuelve los primeros ocho ejercicios del Canal: el grupo 3 indica 2/3 y sigue bloqueado aunque haya saldo. Resuelve el noveno y vuelve a la habitación: grupo 3 desbloqueado; grupo 6 bloqueado. Compra Anémona o Nenúfar por 10 estrellas; verifica inventario y que XP no cambie.
3. Sigue avanzando: al completar las trajineras 6, 9 y 12 se desbloquean sus grupos. No se exige examen general para estos stickers. Si no hay saldo, el botón indica Faltan estrellas.
4. Usa tu base anterior y verifica que cualquier sticker ya adquirido, aun con un requisito nuevo no cumplido, se pueda colocar sin cobrar nuevamente.
5. Revisa cuidados, trajes y otras pantallas. No hay cambios de esquema SQLite para v4.

### Trajes y personaje v4
- El aspecto sin traje es la primera opción y está activo en cuentas nuevas. Los trajes ya equipados se conservan; se puede volver al aspecto original con la API existente (`traje: null`).
- Se retiraron los seis SVG alternativos naranjas y el bloque `mascota` del catálogo; el escenario utiliza `Ajolote.jsx` para todos los estados y trajes. El resto de los recursos sigue sin cambios.
- Aceptación manual: en una cuenta nueva comprueba que el personaje coincide con el del armario; equipa un traje y vuelve a Sin traje especial, recarga, duerme sobre la cama y despierta. Comprueba que se conservan los trajes ganados y los desbloqueos educativos.
