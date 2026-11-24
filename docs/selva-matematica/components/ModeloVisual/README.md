# ModeloVisual

Apoyo visual que acompaña a la tarjeta de reto para que el alumno entienda qué significa una operación antes de resolverla de memoria. Funciona como una escalera: se empieza con objetos concretos y poco a poco se llega a los números solos.

## La escalera
1. **Monedas**: montones de monedas. Para conceptos nuevos.
2. **Bolsitas**: cada bolsita trae una cantidad, con la etiqueta de su valor (“$12”). Cuando las monedas ya no caben.
3. **Barras**: bloques iguales con un total desconocido (“?”). Puente hacia el modelo de barras de la secundaria.
4. **Solo números**: sin apoyo. El apoyo vuelve como pista si el alumno lo pide.

## El ejemplo del ajolote
La primera misión de un concepto abre con un ejemplo del ajolote con otros números (2 × $5): las monedas se juntan y se muestra el total. Después viene el reto del alumno, con sus propios montones y **sin el total**.

## Reglas
- Un montón tiene como máximo 12 monedas, en dos filas de seis y con su cantidad escrita debajo. Con más, se pasa a bolsitas.
- Moneda: `sol` con contorno de 1.5px en `tinta`. Bolsita: `sol` con nudo `magia`. Barra: `magia-suave` con borde `magia`.
- El total solo se muestra en el ejemplo del ajolote, nunca en el reto.
- Cada dibujo lleva `aria-label` que dice las cantidades, por ejemplo “3 montones de 12 monedas cada uno”.
