# Material de estudio: Matemáticas de 1.º de primaria a 3.º de secundaria

> **Antes de escribir cualquier reto, lee esto:**
> - **No copies ni adaptes texto de la SEP.** Sus programas solo se pueden reproducir sin fines comerciales y **sin modificarlos**. Aquí están resumidos con nuestras palabras; en la app solo se cita el grado y el nombre del contenido como fundamento.
> - **Todo texto de la app es propio**: enunciados, pistas, historias y explicaciones. Tampoco se copian textos ni ilustraciones de los libros de texto gratuitos, Khan Academy, libros comerciales u OpenStax (este último prohíbe usarse con IA).
> - **Revisión docente** antes de publicar un mundo.
>
> Detalle en [fuentes.md](fuentes.md).

Base curricular para diseñar los **mundos** (Mapa, para divertirse) y los **módulos** (Aula, para estudiar) de Selva Matemática.

Los temas salen de los **Programas Sintéticos 2024 de la SEP** (Nueva Escuela Mexicana), del campo formativo *Saberes y Pensamiento Científico*. Ahí vive matemáticas en toda la educación básica. Las fuentes y sus licencias están en [fuentes.md](fuentes.md).

## Archivos

| Archivo | Grados | Fase SEP |
|---|---|---|
| [primaria-1-2.md](primaria-1-2.md) | 1.º y 2.º de primaria | Fase 3 |
| [primaria-3-4.md](primaria-3-4.md) | 3.º y 4.º de primaria | Fase 4 |
| [primaria-5-6.md](primaria-5-6.md) | 5.º y 6.º de primaria | Fase 5 |
| [secundaria-1-3.md](secundaria-1-3.md) | 1.º, 2.º y 3.º de secundaria | Fase 6 |
| [progresion-por-tema.md](progresion-por-tema.md) | Todos | Cómo crece cada tema de un grado al siguiente |
| [fuentes.md](fuentes.md) | — | Enlaces oficiales y qué se puede hacer con cada uno |

## Cómo usarlo para armar un mundo o una fase

1. **Elige el grado y el contenido.** Cada archivo está ordenado por eje:
   - Números
   - Operaciones
   - Geometría
   - Medición
   - Datos y probabilidad
2. **Lee lo que pide la SEP en ese grado.** Cada tema trae una lista de **lo que el alumno debe lograr**. Esas son las metas del mundo.
3. **Revisa el grado anterior** en [progresion-por-tema.md](progresion-por-tema.md). Lo que se vio ahí es el prerrequisito, y el diagnóstico de entrada puede medirlo.
4. **Usa las ideas de mundo** que vienen al final de cada tema. Son sugerencias del equipo, no de la SEP; cámbialas con libertad.
5. **Escribe los retos con texto propio.** No copies frases de la SEP ni de los libros (ver [fuentes.md](fuentes.md)).

Reglas del proyecto que también aplican al contenido:
- Solo apodos.
- Equivocarse nunca se castiga.
- Las pistas guían sin dar la respuesta.

## Cómo se conecta con lo que ya existe en la app

Hoy `backend/app/contenido.py` tiene estos módulos:

| id en la app | Estado | Dónde está en el programa SEP |
|---|---|---|
| `multiplicacion` | **jugable** (mundos m1 y m2) | 2.º (noción) → 3.º (tablas) → 4.º (3 × 2 cifras) |
| `division` | próximamente | 2.º (repartos) → 3.º (a ÷ b = c) → 4.º (algoritmo, residuo) |
| `fracciones` | próximamente | 3.º (medios a dieciseisavos) → 4.º (tercios a décimos) → 5.º–6.º (operaciones) |
| `suma-resta` | próximamente | 1.º → 4.º (hasta 4 cifras y decimales) |
| `valor-posicional` | próximamente | 1.º (hasta 100) → 6.º (billones, maya y romano) |
| `decimales` | próximamente | 4.º (centésimos) → 6.º (división de decimales) |
| `geometria` | próximamente | Todos los grados (figuras, cuerpos, ángulos) |
| `medicion` | próximamente | Todos los grados (longitud, masa, capacidad, tiempo, área, volumen) |

Temas del programa que **todavía no tienen módulo** y podrían agregarse:
- proporcionalidad y porcentajes (5.º–6.º y secundaria)
- datos y gráficas (todos los grados)
- probabilidad (5.º y después)
- números con signo (1.º de secundaria)
- álgebra y ecuaciones (secundaria)
- funciones (secundaria)
- Pitágoras y trigonometría (3.º de secundaria)

## Diferencias con el resumen que juntó el equipo

El resumen que pegamos en el chat se parece al programa, pero en algunos puntos no coincide con la versión 2024. Cuando difieran, **manda el programa de la SEP**. Los temas que solo están en el resumen se marcan en cada archivo como *complementario*: se pueden usar, pero no son obligatorios en ese grado.

| Tema | Resumen del equipo | Programa SEP 2024 |
|---|---|---|
| Números negativos | 6.º de primaria | Empiezan en **1.º de secundaria** |
| Mediana | 5.º de primaria | Moda en 4.º–5.º; media y rango en 6.º; **mediana en 1.º de secundaria** |
| Números romanos y mayas | 5.º–6.º | **6.º** |
| Volumen de prismas | 6.º con fórmula | 6.º **contando cubos**; con fórmula en 3.º de secundaria |
| Plano cartesiano | 6.º | 6.º, solo el primer cuadrante (coincide) |
| Teorema de Tales | 3.º de secundaria | No aparece por nombre; sí "congruencia y semejanza de triángulos" en 3.º |
| Productos notables y factorización | 3.º de secundaria | Se pide "resolver por factorización y fórmula general" en 3.º |
| Teselados | 2.º de secundaria | 2.º (coincide) |
| Sistema inglés | 2.º de secundaria | 2.º (coincide): yarda, pulgada, galón, onza, libra |

## Estado de este material

**Borrador (23 de noviembre de 2026):** los temas se pasaron a mano desde los PDF oficiales. Antes de publicar un mundo, una maestra o maestro debe revisar el grado y el lenguaje.
