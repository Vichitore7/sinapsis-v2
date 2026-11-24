# EscanerSinConexion

Pantalla que aparece cuando el alumno saca la foto sin internet. La foto se guarda y el alumno sigue pensando con 3 preguntas generales, sin esperar.

## Estructura
1. Globo del ajolote: “Tu foto está en mi mochila”.
2. Chip de estado en `pista`: “En espera · 1 foto”.
3. Tres preguntas generales numeradas (no usan IA): ¿qué te pide el problema?, ¿qué datos tienes?, ¿qué operación usaste y por qué?
4. Línea de cierre: “Cuando haya internet, leeré tu foto.”

## Reglas
- La foto queda comprimida en el dispositivo y se borra en cuanto se envía.
- Las preguntas son las mismas para todos los ejercicios y se responden en el cuaderno, no en la app.
- El resultado, cuando llega, se guarda para consultarlo sin conexión y se avisa con un ícono sticker sobre el ajolote.
- Nunca se bloquea el resto de la app mientras la foto espera.
