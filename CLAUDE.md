# CLAUDE.md: Selva Matemática (ThinkLoop), sinapsis-v2

Contexto para Claude Code. Léelo al retomar el trabajo. Última actualización: **24 nov 2026**.

## Qué es

App web para aprender matemáticas de 1.º de primaria a 3.º de secundaria (México, SEP). La guía es **Kiko**, un ajolote al que el alumno puede cambiarle el nombre. La idea central es una **IA que enseña a pensar**: da pistas socráticas y nunca la respuesta.

- Equipo de 4 estudiantes de FES Aragón para el **UniconHub Hack / Claude Build Day**. **Entrega: 28 nov 2026.**
- Repo: GitHub `Vichitore7/sinapsis-v2`. El proyecto anterior está en `~/Documentos/Unicon-hub` (solo como referencia; no copiar código sin preguntar).

## Reglas del producto (no negociables)

- **Solo apodos.** Nada de correo ni nombre real; son menores de edad.
- **Equivocarse nunca se castiga.** Sin vidas, sin ranking y sin que la mascota se deteriore con el tiempo.
- **Las pistas guían sin dar la respuesta.**
- **Aula es para estudiar** (cursos tipo Classroom). **Mapa es para divertirse** aprendiendo.
- **Contenido con texto propio.** No copiar ni adaptar texto de la SEP, los libros de texto gratuitos, Khan Academy u OpenStax (este último prohíbe usarse con IA). Solo se cita el grado y el nombre del contenido. Ver `docs/material-de-estudio/fuentes.md`.
- El contenido es **borrador** hasta que lo revise una maestra o un maestro.

## Stack y cómo correrlo

- **Frontend:** React 18 + Vite, en `frontend/`.
  - Router por hash (`ruta.js`) y estado en un context (`estado/store.jsx`, `useJuego`).
  - Estilos: `styles/app.css` + `styles/stitch.css` (rediseño Stitch, naranja pastel, tokens `--st-*`).
  - `npm run dev` arranca en :5173 y manda `/api` al backend por el proxy de Vite. Pruebas: `npm test` (12).
- **Backend:** FastAPI + SQLAlchemy + SQLite, con `uv`, en `backend/`.
  - `uv run uvicorn app.main:app --port 8000 --reload`
  - Datos de prueba: `uv run python -m app.semilla --demo`
  - Pruebas: `uv run pytest` (45). Si falla todo, revisa que no esté exportada una `DATABASE_URL` vieja.
- **Seguridad:**
  - Contraseñas con argon2, sesión con JWT en cookie httpOnly y freno a intentos repetidos.
  - Código de recuperación guardado con HMAC.
  - **Las respuestas se validan en el servidor** y nunca llegan al navegador.
- **Al arrancar**, `create_all` + `migrar_columnas()` (en `db.py`) agregan las columnas nuevas, y `cargar_contenido` se puede correr varias veces sin duplicar.
- **Usuarios demo** (contraseña `selva123`): `profe_demo`, `teo_demo`, `luna_demo`, `sol_demo`.
- **Capturas de pantalla:** playwright-core con `/usr/bin/google-chrome`. Usa cuentas temporales y bórralas al terminar.

## Pantallas actuales

- **Alumno:** Inicio, Mapa, Escáner + IA Tutor, Mi Aula y Mascota (Mochila).
  - **Inicio:** Kiko pregunta "¿Queda algo pendiente?" y muestra cursos pendientes, Ir al Mapa y misiones.
  - **Mi Aula:** clases tipo Classroom, con mi avance y el promedio del grupo.
  - **Perfil:** logros, medallas, stickers, diplomas y personalizar.
  - **Examen diagnóstico:** arranca solo la primera vez que entra el alumno.
- **Profesor:** Modo Aula, Diagnóstico y Perfil.
  - **Modo Aula:** grupos con varios módulos. Los alumnos entran solo con el código o con aprobación del profe.
  - **Diagnóstico:** resultados por habilidad y por alumno, con exportación a CSV.
- **Contenido jugable:**
  - Mundo 1 **"El Canal de los Números"** (1.º de primaria, Xochimilco, de Gera): 12 niveles con 3 ejercicios cada uno, en `contenido_canal.py` y `componentes/Canal.jsx`. Los dibujos llevan borde blanco de sticker (clase `.sticker`) y los objetos para contar van en filas de 10 con pausa de 5 en 5 (a propósito: así se cuenta por grupos).
  - Mundo 2 **"El Centro de los Números"** (2.º de primaria, Centro de la CDMX, de Gera): 12 niveles de 3 ejercicios en `contenido_cdmx.py` y `componentes/CDMX.jsx`. Cada nivel es un transporte de la tarjeta de movilidad integrada, con 3 cacomixtles, y lleva `faseCPA` (niveles 1–4 concreto, 5–8 pictórico, 9–12 abstracto).
  - Mundo 3 **"La FES de los Números"** (3.º de primaria, FES Aragón, de Gera): 12 niveles de 3 ejercicios en `contenido_fes.py` y `componentes/FES.jsx`. Cada nivel es un lugar del campus, con 3 tlacuaches, y lleva `faseCPA`. El mapa tiene título propio (`Titulo` en el tema), andador y decoración del campus (torres, auditorio, mascota, hombre de morado…). Al terminar: constancia, sticker del peluche de la mascota y 2 trajes para el frío (`nevado-gorro`, `nevado-orejeras`), porque el siguiente mundo será el Nevado de Toluca. Respuestas de opción de hasta 60 caracteres (`esquemas.py`).
  - Los mundos temáticos (Canal, Centro y FES) se registran en `MUNDOS_TEMATICOS` (`contenido.py`) y en `componentes/Temas.jsx`. Terminan con **examen general**: certificado + 2 trajes de subculturas al azar (de estilos y subculturas distintos); ponerse uno abre el mundo siguiente. El profesor ve el reporte del examen en Diagnóstico.
  - Módulo `multiplicacion`: mundo m2 "El mercado" (Mundo 4, 4 retos; se abre con un traje del Nevado). **La tiendita (m1) se quitó**: `cargar_contenido` borra de la base los mundos que ya no están en el contenido.
  - La división (`÷`) solo está en los ejercicios (`OPERACIONES_EJERCICIOS` en `juego.py`); el tutor de IA sigue con `OPERACIONES` (sin división).
  - El resto dice "próximamente": división, fracciones, suma-resta, valor-posicional, decimales, geometría y medición.
- **Sin vidas:** la barra de arriba ya no muestra corazones (parecían vidas). El bienestar de Kiko vive en la Mochila.

## Equipo y Git

- **Backend:** Victor y Samuel. El resto del equipo hace frontend.
- **Samuel** hizo que en el chat del escáner se pueda **tomar foto o subirla de la galería** (`Escaner.jsx`, ya en `dev`). Coordinar con él antes de cambiar esa pantalla.
- **Gera** arma los niveles con `docs/material-de-estudio/` (Mundo 1, el Canal) y los stickers de `docs/imagenes/`.
- **Adrian** hace la mascota (Mochila, bienestar de Kiko). No mover esa mecánica sin él.
- **Ramas:** `main`, `dev`, `victor`, `gera`, `katia`, `samuel` y `zulu`.
  - Hasta `f2d0fc6` todas estaban iguales.
  - **Desde ahora solo se sube a `victor` y a `dev`, de preferencia con Pull Request.** Si se empuja a la rama de otra persona se le puede pisar el trabajo.
  - Antes de subir: `git pull origin dev`.
- Hacer commit o push solo cuando quien está trabajando lo pida.

### Cambios sin subir a propósito (solo en la compu de Victor: NO subir ni descartar)

Preparativos para una base PostgreSQL compartida. Por ahora cada quien usa su **SQLite local**; Victor quiere conservarlos para más adelante.
- `backend/pyproject.toml` + `uv.lock`: agregan `psycopg[binary]`.
- `backend/app/db.py`: `DEFAULT FALSE` en lugar de `0`, para que funcione en Postgres.
- `backend/.env.example`: comentarios para Neon o Supabase.

Al hacer commit de otra cosa, agrega solo las rutas de ese cambio. Si hay que tocar `pyproject.toml` o `uv.lock`, arma el commit desde la versión de `HEAD` con solo la dependencia nueva (`uv add --no-sync <paquete>`) y después vuelve a agregar `psycopg[binary]` encima.

## Tutor de IA (Victor)

**Ya hecho (24 nov):** el chat del escáner usa Claude.
- `app/tutor.py` (prompt socrático, filtro que bloquea respuestas con el resultado, límite por alumno), `app/rutas/tutor.py` (`POST /api/tutor`) y `tests/test_tutor.py` (Claude simulado, no gasta saldo).
- **Contrato:** recibe `{ operacion: {a, op, b, c}, mensaje, historial }` y regresa `{ respuesta, origen: "claude" | "reglas" }`.
- **Clave:** `ANTHROPIC_API_KEY` en `backend/.env`; nunca se sube. **Sin clave, sin internet, si Claude rechaza o si el alumno pasa su límite (40/hora, 150/día), usa las pistas por reglas.** Así a nadie se le rompe la app. Cada quien puede trabajar sin clave.
- **Modelo:** `TUTOR_MODELO` (por defecto `claude-haiku-5-5`) y `TUTOR_ESFUERZO` (`low`). Haiku 5.5 no tiene respaldo del servidor cuando rechaza: se maneja `stop_reason == "refusal"` con reglas.
- A Claude solo le llegan la operación y el chat: ni apodo ni id.
- Frontend: `api.tutor()` en `api.js`; `Escaner.jsx` contesta con reglas si no hay conexión.

**Falta:**
- **Leer la foto:** `leerOperacion` y `responderFoto` en `lector.js` siguen fijos. La lectura la hace el backend con Claude (probar Haiku; si falla, `claude-sonnet-5-5` solo para leer). Lo leído es la `operacion` del tutor. La foto se borra en cuanto se lee.
- **Comparar Haiku contra Sonnet** con unas 30 preguntas de `docs/material-de-estudio/` (1.º de primaria a 3.º de secundaria, más casos de "ya dime la respuesta").

## Pendientes e ideas (de la revisión del 23 nov, calificación 6.5/10)

Prioridades para la entrega:
1. **IA real:** falta la lectura de la foto (el tutor de texto ya usa Claude).
2. **Contenido:** cerrar un grado completo (3.º de primaria: multiplicación + división + fracciones, unos 12 retos por mundo). Además, hacer el **diagnóstico según el grado**: hoy son las mismas 8 preguntas de nivel 3.º–4.º para todos, y el grado solo se guarda en `localStorage` (`selva:grado:<id>`). Hay que guardarlo en el servidor.
3. **Publicarla:**
   - Frontend en Vercel o Netlify, y backend en Render o Railway, con Postgres (ahí sirven los cambios guardados de arriba).
   - GitHub Actions que corra las pruebas en cada push.
4. **Presentación:** video de respaldo de la demo y pasar `dev` a `main`.

Limpieza (baja prioridad):
- `pantallas/ModoAula.jsx` ya no se usa.
- `app.css` y `stitch.css` se pisan entre sí.
- La app descarga las fuentes Baloo y Nunito aunque ya no se usan.
- `docs/selva-matematica` es del diseño anterior.

Por ahora no: la Mochila (la hace Adrian), más pantallas ni más personalización.

## Documentos

- `docs/material-de-estudio/`: temas de la SEP 2024 por grado (fases 3 a 6), progresión por tema, ideas de mundo y fuentes con su licencia.
- `docs/selva-matematica/`: el sistema de diseño original (componentes y tokens).
- `README.md`: guía para arrancar el proyecto y problemas comunes.
