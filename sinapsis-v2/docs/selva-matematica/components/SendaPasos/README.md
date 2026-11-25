# SendaPasos

La senda de pasos muestra el procedimiento del alumno como un camino y marca en `casi` el paso donde se torció, con una pregunta socrática debajo. Es el formato de las pistas y del resultado del escáner de cuaderno.

## Estados de cada paso
- **Correcto** (`sm-paso-ok`): `selva-suave` con ✓ en `selva`.
- **Aquí se torció** (`sm-paso-casi`): `casi-suave`, borde de 3px en `casi`, número del paso y globo de pista (`sm-bubble`) con una pregunta concreta.
- **Pendiente** (`sm-paso-pendiente`): borde punteado y texto `tinta-suave`.

## Reglas
- Nunca se muestra la respuesta correcta en la senda.
- Una sola pregunta por pista; contador “PISTA N DE 3”.
- Después de la tercera pista se ofrece un ejemplo resuelto parecido, en una tarjeta aparte.
- La narrativa épica va en el título (“Tu sendero”); la pregunta va directa y clara.
