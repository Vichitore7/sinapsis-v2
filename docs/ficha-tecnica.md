# Ficha técnica: Mix

**Equipo Sinapsis** · UniconHub Hack 2026 · Repositorio: `Vichitore7/sinapsis-v2`

## Qué es

Mix es una app web para aprender matemáticas de 1.º de primaria a 3.º de secundaria. La guía es Mix, un ajolote que **no piensa por ti: piensa contigo**. El alumno resuelve en su cuaderno y le toma foto. Mix lee la operación, detecta el error típico y lo guía con pasitos hasta que el alumno encuentra la respuesta. Nunca se la da.

**Frentes del reto que atiende:**
- **B. IA que enseña a pensar:** pistas en lugar de respuestas, pide el razonamiento y revisa el proceso, no solo el resultado.
- **A. Diagnóstico real:** examen de entrada según el grado y diagnóstico del error en cada ejercicio. El profesor ve en qué se atora cada alumno, por tema.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5, CSS propio (sin librerías de interfaz), router por hash |
| Backend | Python 3 + FastAPI, SQLAlchemy 2, Pydantic 2, gestionado con `uv` |
| Base de datos | SQLite en desarrollo; lista para PostgreSQL (Neon o Supabase) en producción |
| IA | Claude Haiku 5.5 (API de Anthropic) para el tutor y para leer la foto del cuaderno |
| Seguridad | Contraseñas con argon2, sesión con JWT en cookie httpOnly, freno a intentos repetidos, código de recuperación con HMAC |
| Pruebas | 243 pruebas de backend (pytest), 41 de frontend (Vitest) y una evaluación pedagógica de 30 escenarios con un juez de IA |

## Cómo funciona por dentro

- **La respuesta nunca llega al navegador.** Las respuestas se validan en el servidor.
- **La IA no puede dar el resultado.** Se le pide en las instrucciones y, además, un filtro del código bloquea cualquier mensaje que traiga el resultado, aunque venga escrito como fracción equivalente. Las cuentas de cada pasito las escribe el código, ya verificadas, y del modelo solo se usa una frase corta. Probado con más de 800 operaciones.
- **El error se diagnostica con reglas.** Por ejemplo: sumó en vez de multiplicar, no llevó la decena, no pidió prestado o sumó numeradores y denominadores.
- **Memoria de aprendizaje.** Guarda por alumno y por concepto solo conteos y etiquetas, nunca el texto del chat. Un tema cuenta como dominado con 3 ejercicios distintos sin ayuda, no por un acierto.
- **Funciona sin IA.** Si no hay conexión, no hay saldo o el alumno llega a su límite, Mix sigue ayudando con pistas por reglas.
- **Evaluación pedagógica.** Calificación del juez: 4.8 de 5 en "guía sin dar la respuesta".

## Qué tan adecuado es para México

- **Contenido:** programa de la SEP 2024 por fases, con texto propio y el método concreto → pictórico → abstracto. Se cita el grado y el nombre del contenido, sin copiar libros de texto.
- **Pocos dispositivos:** el alumno trabaja en papel, como en la escuela. Basta un celular para la foto; no hacen falta tablets ni capturar nada.
- **Mala conexión:** sin internet sigue dando pistas por reglas.
- **Contexto cercano:** los mundos son Xochimilco, el Centro Histórico (Metro y Metrobús), la FES Aragón y el Nevado de Toluca, con animales de aquí (ajolote, cacomixtle, tlacuache y teporingo).
- **Menores de edad:**
  - Solo apodos: sin correo ni nombre real.
  - La foto del cuaderno no se guarda.
  - Al modelo no le llegan ni el apodo ni el id.
- **Sin castigo:** sin vidas, sin ranking, y la mascota nunca se deteriora.

## Qué haría falta para llevarlo a la realidad

No se requieren grandes inversiones:

1. **Publicarla:** frontend en Vercel o Netlify y backend en Render o Railway, con Postgres en Neon o Supabase. Para un piloto alcanzan los planes gratuitos o de pocos dólares al mes. El código para Postgres ya está preparado.
2. **Costo de IA bajo y con tope:**
   - Se usa Haiku, un modelo pequeño y económico.
   - En nuestra evaluación, 30 conversaciones completas de tutoría costaron unos 0.05 USD.
   - Cada alumno tiene un límite (40 mensajes por hora y 150 por día), así que el gasto por alumno tiene techo.
3. **Revisión docente:** el contenido es un borrador hasta que lo revise una maestra o un maestro.
4. **Piloto en una escuela:** probar la lectura con fotos reales de cuaderno y medir el avance con el diagnóstico de entrada.
5. **Aviso de privacidad** conforme a la ley mexicana de protección de datos personales y consentimiento de madres, padres o tutores.
6. **Más contenido:** hoy están completos los mundos de 1.º a 4.º de primaria. Falta cerrar 5.º y 6.º de primaria y secundaria.

## Cómo correrlo

```bash
# Backend
cd backend && uv run uvicorn app.main:app --port 8000
uv run python -m app.semilla --demo   # usuarios demo, contraseña selva123
# Frontend
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Sin `ANTHROPIC_API_KEY` la app funciona completa con pistas por reglas. Con la clave en `backend/.env`, el tutor y la lectura de la foto usan Claude.
