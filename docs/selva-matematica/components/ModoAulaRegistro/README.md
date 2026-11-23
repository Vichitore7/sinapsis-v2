# ModoAulaRegistro

Lista que usa el maestro para marcar cómo le fue a cada alumno después de cada reto. Está pensada para un celular, con una mano y sin internet.

## Estructura
1. Encabezado con el número del reto y la operación (“Reto 3 de 5 · 3 × $12”).
2. Una fila por alumno, con su apodo y dos botones: ✓ y ✗.
3. Al tocar ✗ se despliegan los **errores típicos del reto** como chips; el maestro puede tocar uno o ninguno.
4. Pie con el avance (“3 de 6 marcados”) y el botón “Siguiente reto”.

## Reglas
- Filas de 56px de alto como mínimo; botones ✓ y ✗ de 48px.
- ✓ seleccionado: `selva`, texto `tinta`. ✗ seleccionado: `casi`, texto `tinta`. Nunca rojo.
- Se identifica con apodo o código, nunca con nombre completo.
- Marcar un error típico es opcional. Sin marcarlo, el panel solo cuenta ✗.
- El botón “Siguiente reto” está siempre activo; no obliga a marcar a todos.
