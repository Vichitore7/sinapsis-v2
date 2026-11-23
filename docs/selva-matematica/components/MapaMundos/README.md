# MapaMundos

El mapa de mundos es la ruta de aprendizaje: nodos redondos unidos por un sendero, con un encabezado épico por mundo.

## Nodos
- **Completado**: `selva` con ✓ y `sombra-boton`.
- **Actual**: más grande (68px), `sol`, aro blanco de 4px; aquí se para el ajolote.
- **Bloqueado**: `bloqueado` sin sombra, con candado en `tinta`.
- **Cofre**: el último nodo de cada mundo, con un premio sticker.

## Reglas
- Encabezado en `titulo-mundo` color `magia`.
- Tramos recorridos en línea sólida `selva-profundo`; por recorrer, punteados `tinta-suave`.
- Cada nodo mide al menos 48px de área táctil y lleva `aria-label` con su estado.
- Sin conexión el mapa funciona igual; el avance se sincroniza después.
