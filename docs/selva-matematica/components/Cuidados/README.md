# Cuidados

Panel donde el alumno cuida a su ajolote: tres medidores de bienestar, el ícono con lo que pide y los botones de cuidado.

## Medidores
- Tres: **comida**, **pecera** y **alegría**, cada uno con ícono sticker (lombriz, popo, pelota) y 5 marcas.
- Marca llena en `selva`; vacía en `bloqueado`. Contorno de 2px en `tinta`.
- Cuando un medidor tiene 2 marcas o menos, la fila pasa a `casi-suave` y lleva la etiqueta “Pide” en `casi-texto`. El estado nunca depende solo del color.

## Aviso de necesidad
- El medidor más bajo se muestra como un sticker que flota sobre el ajolote, sin texto. Solo aparece con 2 marcas o menos.
- Rebote corto de 1.2 s; con `prefers-reduced-motion` no se mueve.

## Botones de cuidado
- Alimentar (★ 1) y Jugar (★ 2) usan el botón principal; Limpiar y Descansar (gratis) usan el botón suave.
- Si no alcanzan las estrellas, el botón se ve bloqueado y dice cuántas faltan. Nunca desaparece.
- Limpiar y Descansar siempre están disponibles.

## Reglas
- Las estrellas y los medidores solo bajan al jugar; sin uso, nada cambia.
- Un medidor nunca baja de 1 marca.
- Sin textos que culpen: el ajolote pide, no reclama.
