# EscanerLectura

Pantalla donde el ajolote muestra lo que leyó del cuaderno y el alumno lo confirma o lo corrige. Es obligatoria: el diagnóstico no empieza hasta que el alumno dice “¡Así es!”.

## Estados
- **Confirmar**: globo del ajolote (“Leí esto en tu cuaderno”), la operación en una hoja de cuadrícula con `numero-reto`, y dos botones: **¡Así es!** (principal) y **Corregir** (suave).
- **Corregir**: la operación se vuelve editable en campos grandes (`radio-sm`, Nunito 32px). El botón principal pasa a **Listo**.

## Reglas
- La lectura se presenta con humildad (“Leí esto… ¿es correcto?”); si el ajolote duda de un número, lo marca con un subrayado `pista` y pregunta por él.
- Se muestra la nota “Después de leerla, borro la foto”, siempre visible en esta pantalla.
- Nunca se culpa al alumno si la lectura salió mal; corregir es un botón, no una falta.
- Después de confirmar, la foto ya no existe: solo queda el texto.
