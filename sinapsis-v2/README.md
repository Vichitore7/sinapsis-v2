# Selva Matemática (sinapsis-v2)

**IA que enseña a pensar.** Plataforma gamificada de matemáticas básicas para alumnas y alumnos de 9 a 15 años en México. Se explora una selva de mundos y retos junto a un ajolote guía que nunca castiga el error: lo convierte en una pista.

Proyecto para UniconHub Hack / Claude Build Day (28 de noviembre de 2026).

## Novedad: Habitación del ajolote (MVP)

La sección **Habitación** sustituye a Mochila. Incluye editor isométrico de stickers, tienda con estrellas reales, inventario, cuidados, guardado SQLite y minijuego Burbujas. Lee [la guía técnica y las pruebas](docs/selva-matematica/Habitacion.md).

**Actualización sin perder datos:** descomprime la versión nueva en una carpeta distinta. Detén tu backend anterior, haz una copia de seguridad de `backend/selva.db` y `backend/.env` (o de la base que indique `DATABASE_URL`) y copia esos archivos privados a la carpeta nueva. Mantén la misma `SECRET_KEY` para tus sesiones y códigos de recuperación. El arranque crea las tablas nuevas sin borrar las existentes. No uses `--demo` con una base real. Conserva tu carpeta original hasta verificar la actualización.

**Instalación nueva:** sigue los comandos de abajo. Puedes omitir la semilla `--demo` y registrar tu usuario desde la interfaz: el backend carga el contenido base automáticamente. Para el frontend, `npm ci` instala las versiones exactas del lockfile. En móvil, abre `http://IP_DE_TU_LAPTOP:5173` en la misma red; puede ser necesario permitir el puerto 5173 en el firewall local. Para producción, configura HTTPS y proxy de `/api`; no se incluye despliegue público.

## Cómo correrla (dos terminales)

Necesitas Node 20 o más reciente y [uv](https://docs.astral.sh/uv/) para Python.

**1. Backend (FastAPI)**
```bash
cd backend
cp .env.example .env                       # y pon una SECRET_KEY (el archivo explica cómo)
uv sync
uv run python -m app.semilla --demo        # base de datos + usuarios de prueba
uv run uvicorn app.main:app --reload       # http://localhost:8000/docs  ← documentación de la API (Swagger)
uv run pytest                              # pruebas
```

**2. Frontend (React + Vite)**
```bash
cd frontend
npm install
npm run dev                                # http://localhost:5173  (también se abre desde el celular en la misma red)
npm test
```
En desarrollo Vite manda `/api` al backend, así que no hay que configurar CORS.

**Usuarios de prueba** (contraseña `selva123`): `profe_demo` (maestro, con el aula "5.º B") y `luna_demo`, `teo_demo`, `sol_demo` (alumnos). El código del aula aparece al correr la semilla y en "Mis aulas".

## Qué hay

| | Alumno | Maestro |
|---|---|---|
| **Cuenta** | Usuario + contraseña + **código de recuperación** (sin correo). Se muestra una sola vez. | Igual. |
| **Juego** | Mapa de mundos, retos con apoyo visual, 3 pistas socráticas, "¡Casi!" con la senda de pasos, cofres con stickers, estrellas, nivel y racha. | — |
| **Ajolote** | Medidores de comida, pecera y alegría. Se cuidan con estrellas y se le puede cambiar el nombre. | — |
| **Aulas** | Se une con un código tipo `X7K-92B` y ve las misiones asignadas. | Crea aulas, comparte y regenera el código, asigna mundos con fecha límite, quita alumnos y ve el **panel**: quién necesita apoyo, errores más comunes, qué reforzar y el detalle de cada alumno. |
| **Modo Aula** | — | Prueba en el salón con un solo dispositivo **sin internet** (se guarda en el dispositivo). |
| **Escáner** | Foto → recorte → confirmar lectura → senda de pasos. | Igual. |
| **Ajustes** | Tema Día, Noche o como el dispositivo. | Igual. |

### Seguridad
- Contraseñas con **argon2**. El código de recuperación se guarda solo como hash (HMAC).
- Sesión con **JWT en cookie httpOnly**. Recuperar la cuenta o cambiar la contraseña cierra las demás sesiones.
- **Freno a intentos** en el inicio de sesión y en la recuperación.
- **Las respuestas nunca llegan al navegador**: el servidor valida cada intento y solo devuelve la senda de pasos.
- **Autorización por recurso**: un maestro solo ve sus aulas (las demás dan 404) y un alumno solo su progreso.
- Validación de entradas con **Pydantic**, ORM (**SQLAlchemy**), CORS limitado al frontend y `.env` fuera de Git.

## Estructura

```
docs/selva-matematica/     Sistema de diseño (la referencia de cómo se ve y se comporta todo)
backend/
  app/main.py              App, CORS, errores con forma {"error": "..."}
  app/modelos.py           Tablas: usuarios, aulas, aula_alumnos, asignaciones, unidades, lecciones,
                           ejercicios, intentos, progreso, estado_juego, mascotas, ajustes_usuario
  app/seguridad.py         Contraseñas, códigos, JWT, freno a intentos, roles
  app/juego.py             REGLAS del juego (VALORES iniciales arriba) + diagnóstico de la senda
  app/contenido.py         Contenido semilla + generador de retos de multiplicación
  app/servicio.py          Lógica del alumno (intentos, cofres, cuidados, mapa)
  app/rutas/               auth · juego · aulas · ajustes
  tests/                   pytest
frontend/
  src/api.js               Cliente de la API + adaptadores
  src/estado/store.jsx     Sesión y estado (el servidor es la fuente de verdad)
  src/pantallas/           Cuenta, Inicio, Mapa, Reto, Habitación, Logros, Perfil, Aulas, ModoAula, Escaner
  src/logica/              Ayudas de vista, diagnóstico del escáner y Modo Aula sin internet
```

**Para agregar retos:** se edita `backend/app/contenido.py` y se corre `uv run python -m app.semilla`.
**Para cambiar a PostgreSQL:** se cambia `DATABASE_URL` en `.env` y se instala el driver (`uv add "psycopg[binary]"`).

## Reglas que no se rompen (del sistema de diseño)

- **El error nunca es rojo** ni quita vidas, puntos o estrellas. Por eso no hay vidas ni corazones.
- **Sin rankings ni tabla de posiciones.** Las listas del maestro van en orden alfabético.
- **El ajolote es la única mascota** y sus medidores **solo bajan al jugar**: si la app no se usa, nada baja y nada se rompe.
- **Nunca se muestra la respuesta del mismo reto** en las pistas. Después de 3 pistas viene un ejemplo con otros números.
- Apodos en lugar de nombres completos. Colores solo con tokens. Español de México, sin emojis en la interfaz.

## Pendiente (para repartir)

- [ ] **IA del escáner**: endpoint que lea la foto. En el frontend, `frontend/src/logica/lector.js` ya está listo para conectarlo.
- [ ] **Tutor con IA** (pistas personalizadas), con límite de pistas y freno a solicitudes. La API key va solo en `.env`.
- [ ] **Diagnóstico inicial** (examen corto por tema) y nivel estimado por tema.
- [ ] **Revisión pedagógica** del contenido, que todo está en borrador. Faltan las unidades de División y Fracciones.
- [ ] Modo sin conexión para el alumno: guardar intentos y enviarlos al volver el internet.
- [ ] Revisar el tema Noche con diseño: el sistema solo define el tema Día.
- [ ] Despliegue (Railway, Render o servidor propio) con `ENTORNO=produccion` y HTTPS.
