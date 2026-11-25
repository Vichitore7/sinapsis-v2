# Selva Matemática (sinapsis-v2)

**IA que enseña a pensar.** Plataforma gamificada de matemáticas básicas para alumnas y alumnos de 9 a 15 años en México. Se explora una selva de mundos y retos junto a un ajolote guía que nunca castiga el error: lo convierte en una pista.

Proyecto para UniconHub Hack / Claude Build Day (28 de noviembre de 2026).

---

## Índice

1. [Qué necesitas instalar (una sola vez)](#1-qué-necesitas-instalar-una-sola-vez)
2. [Descargar el proyecto](#2-descargar-el-proyecto)
3. [Preparar el backend (una sola vez)](#3-preparar-el-backend-una-sola-vez)
4. [Preparar el frontend (una sola vez)](#4-preparar-el-frontend-una-sola-vez)
5. [Prender la app (cada vez que trabajes)](#5-prender-la-app-cada-vez-que-trabajes)
6. [Cómo trabajamos con Git](#6-cómo-trabajamos-con-git)
7. [Problemas comunes](#7-problemas-comunes)
8. [Qué hay en la app](#8-qué-hay-en-la-app)
9. [Estructura del código](#9-estructura-del-código)
10. [Reglas que no se rompen](#10-reglas-que-no-se-rompen)
11. [Pendiente](#11-pendiente)

---

## Cómo está armado (en 10 segundos)

La app tiene **dos partes que deben estar prendidas AL MISMO TIEMPO**, cada una en su propia terminal:

```
  Navegador  ──►  FRONTEND (React + Vite)  ──/api──►  BACKEND (FastAPI + SQLite)
                  http://localhost:5173               http://localhost:8000
                  lo que se ve                        cuentas, retos, progreso, aulas
```

> ⚠️ Si solo prendes el frontend, la página abre pero **nada funciona** (no puedes entrar ni crear cuenta).

---

## 1. Qué necesitas instalar (una sola vez)

| Programa | Para qué | Cómo revisar si ya lo tienes |
|---|---|---|
| **Git** | Descargar y subir el código | `git --version` |
| **Node.js 20 o más nuevo** | Correr el frontend (trae `npm`) | `node -v` |
| **uv** | Correr el backend de Python (instala Python y las librerías por ti) | `uv --version` |
| **VS Code** (recomendado) | Editor | — |

**Instalar uv:**

```bash
# Linux / Mac
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Después de instalarlo **cierra y vuelve a abrir la terminal** para que reconozca el comando `uv`.

**Node.js:** descárgalo de https://nodejs.org (versión LTS).

**Extensiones recomendadas de VS Code:** "Python" (Microsoft) y "ES7+ React snippets" (opcional). Para que VS Code entienda el backend: `Ctrl+Shift+P` → *Python: Select Interpreter* → elige `backend/.venv` (aparece después del paso 3).

> **uv** es como `npm` pero para Python: `uv sync` ≈ `npm install`, `uv run ...` ≈ `npm run ...`. No es una extensión de VS Code; es un programa de terminal.curl -LsSf https://astral.sh/uv/install.sh | sh


---

## 2. Descargar el proyecto

```bash
git clone https://github.com/Vichitore7/sinapsis-v2.git
cd sinapsis-v2
git checkout TU-RAMA          # victor, gera, zulu, samuel o katia
```

Si ya lo tenías clonado:

```bash
cd sinapsis-v2
git checkout TU-RAMA
git pull
```

---

## 3. Preparar el backend (una sola vez)

Todos estos comandos van **dentro de la carpeta `backend`**:

```bash
cd backend
```

**a) Crear tu archivo `.env`** (configuración local; nunca se sube a Git):

```bash
# Linux / Mac
cp .env.example .env

# Windows (PowerShell)
copy .env.example .env
```

**b) Poner una clave secreta.** Genera una:

```bash
uv run python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Abre `backend/.env` y pega el resultado después de `SECRET_KEY=` (sin espacios ni comillas). Si la dejas vacía la app funciona igual, pero se cierra tu sesión cada vez que reinicias el backend.

**c) Instalar dependencias y crear la base de datos con usuarios de prueba:**

```bash
uv sync
uv run python -m app.semilla --demo
```

La última línea imprime algo como:

```
Demo listo. Profesor: profe_demo · Alumnos: luna_demo, teo_demo, sol_demo · Contraseña: selva123 · Código del aula: KVV-7SH
```

---

## 4. Preparar el frontend (una sola vez)

En **otra terminal**, desde la carpeta principal del proyecto:

```bash
cd frontend
npm install
```

> Cada vez que hagas `git pull` y alguien haya agregado librerías, vuelve a correr `npm install` (frontend) y `uv sync` (backend). No pasa nada si lo corres de más.

---

## 5. Prender la app (cada vez que trabajes)

Necesitas **dos terminales abiertas** (en VS Code: botón **+** del panel de terminal, o `Ctrl+Shift+ñ`).

**Terminal 1 — backend:**

```bash
cd backend
uv run uvicorn app.main:app --reload
```

Listo cuando dice: `Uvicorn running on http://127.0.0.1:8000`

**Terminal 2 — frontend:**

```bash
cd frontend
npm run dev
```

Listo cuando dice: `Local: http://localhost:5173/`

**Abre http://localhost:5173** y entra con un usuario de prueba (contraseña `selva123`):

| Usuario | Rol | Qué ves |
|---|---|---|
| `profe_demo` | Maestro | Mis aulas (con "5.º B" y su código), panel del grupo, Modo Aula |
| `luna_demo`, `teo_demo`, `sol_demo` | Alumno | Mapa, retos, ajolote, logros |

O crea tu propia cuenta con "Crear cuenta".

**Revisar que todo está bien:**

- http://localhost:8000/docs → documentación interactiva de la API (Swagger). Si abre, el backend está prendido.
- http://localhost:5173 → la app.

**Probar en tu celular:** conecta el celular a la misma red Wi-Fi y abre la dirección `Network:` que muestra `npm run dev` (por ejemplo `http://192.168.1.20:5173`).

**Para apagar:** `Ctrl+C` en cada terminal.

**Correr las pruebas:**

```bash
cd backend && uv run pytest        # backend
cd frontend && npm test            # frontend
```

---

## 6. Cómo trabajamos con Git

- Cada quien trabaja en **su rama**: `victor`, `gera`, `zulu`, `samuel`, `katia`.
- **Nadie sube directo a `main` ni a `dev`.** Para juntar tu trabajo, abre un Pull Request de tu rama a `dev`.
- Backend: Victor y Samuel.

Flujo de cada día:

```bash
git checkout TU-RAMA
git pull                           # traer lo último
# ... trabajas ...
git add .
git commit -m "Qué cambiaste, en una frase"
git push
```

Para traer a tu rama lo que ya se juntó en `dev`:

```bash
git fetch
git merge origin/dev
```

**Nunca subas:** `backend/.env` (tiene tu clave secreta), `backend/selva.db` (tu base de datos local), `node_modules/` ni `.venv/`. El `.gitignore` ya los excluye; si `git status` los muestra, avisa.

---

## 7. Problemas comunes

| Lo que ves | Causa probable | Solución |
|---|---|---|
| La app abre pero dice "Algo salió mal", "problemas con el servidor" o no deja entrar | **El backend no está prendido** | Prende la Terminal 1 (paso 5). Revisa que http://localhost:8000/docs abra. |
| `uv: command not found` / "uv no se reconoce" | uv no está instalado o la terminal es vieja | Instálalo (paso 1) y **abre una terminal nueva**. |
| `npm: command not found` | Falta Node.js | Instálalo de nodejs.org y abre una terminal nueva. |
| `No module named 'app'` o `ModuleNotFoundError` | Corriste el comando fuera de `backend/` | `cd backend` y repite. |
| `Address already in use` (puerto 8000 o 5173) | Ya hay otro servidor prendido | Ciérralo (`Ctrl+C` en su terminal) o reinicia la compu. |
| Error rojo de Vite: `Failed to resolve import ...` | Faltan librerías del frontend | `cd frontend && npm install` |
| La sesión se cierra cada vez que reinicias el backend | `SECRET_KEY` vacía en `.env` | Pon una clave (paso 3b). |
| "Usuario o contraseña incorrectos" con los usuarios demo | No se creó el demo | `cd backend && uv run python -m app.semilla --demo` |
| Quiero borrar todo y empezar de cero | — | Apaga el backend, borra `backend/selva.db` y corre otra vez `uv run python -m app.semilla --demo`. |
| "Demasiados intentos. Espera unos minutos." | Freno de seguridad tras 5 contraseñas mal | Espera 10 minutos o reinicia el backend. |
| Cambié contenido en `contenido.py` y no aparece | La base de datos ya tenía el contenido viejo | `cd backend && uv run python -m app.semilla` |

Si nada de esto funciona: copia **el error de la terminal del backend** (ahí aparece el error real) y mándalo al grupo.

---

## 8. Qué hay en la app

| | Alumno | Maestro |
|---|---|---|
| **Cuenta** | Usuario + contraseña + **código de recuperación** (sin correo). El código se muestra una sola vez: hay que anotarlo. | Igual. |
| **Juego** | Mapa de mundos, retos con apoyo visual, 3 pistas socráticas, "¡Casi!" con la senda de pasos, cofres con stickers, estrellas, nivel y racha. | — |
| **Ajolote** | Medidores de comida, pecera y alegría. Se cuida con estrellas y se le puede cambiar el nombre. | — |
| **Aulas** | Se une con un código tipo `X7K-92B` (en Perfil) y ve las misiones asignadas. | Crea aulas, comparte y regenera el código, asigna mundos con fecha límite, quita alumnos y ve el **panel**: quién necesita apoyo, errores más comunes, qué reforzar y el detalle por alumno. |
| **Modo Aula** | — | Prueba en el salón con un solo dispositivo, **sin internet** (se guarda en el dispositivo). |
| **Escáner** | Foto → recorte → confirmar lectura → senda de pasos. | Igual. |
| **Ajustes** | Tema Día, Noche o el del dispositivo. | Igual. |

La app se adapta sola: en **celular** el menú va abajo y en **computadora** (1024 px o más) va a la izquierda.

### Seguridad

- Contraseñas con **argon2**. El código de recuperación se guarda solo como hash (HMAC).
- Sesión con **JWT en una cookie httpOnly**. Recuperar la cuenta o cambiar la contraseña cierra las demás sesiones.
- **Freno a intentos** en el inicio de sesión y en la recuperación.
- **Las respuestas nunca llegan al navegador**: el servidor valida cada intento y solo devuelve la senda de pasos.
- **Autorización por recurso**: un maestro solo ve sus aulas (las demás dan 404) y un alumno solo su progreso.
- Validación con **Pydantic**, ORM (**SQLAlchemy**), CORS limitado al frontend y `.env` fuera de Git.

---

## 9. Estructura del código

```
docs/selva-matematica/     Sistema de diseño: cómo se ve y se comporta todo. LÉANLO antes de diseñar.
backend/
  app/main.py              Arranque de la API, CORS, errores con forma {"error": "..."}
  app/config.py            Lee el .env
  app/modelos.py           Tablas de la base de datos
  app/esquemas.py          Validación de lo que llega del navegador
  app/seguridad.py         Contraseñas, códigos, sesión, freno a intentos, roles
  app/juego.py             REGLAS del juego (VALORES iniciales arriba) + diagnóstico de la senda
  app/contenido.py         Mundos y retos + generador de retos de multiplicación
  app/servicio.py          Lógica del alumno: intentos, cofres, cuidados, mapa
  app/semilla.py           Crea la base y los usuarios demo
  app/rutas/               auth · juego · aulas · ajustes (un archivo por grupo de endpoints)
  tests/                   Pruebas (pytest)
frontend/
  src/api.js               Todas las llamadas al backend en un solo lugar
  src/estado/store.jsx     Sesión y estado (el servidor es la fuente de verdad)
  src/pantallas/           Una pantalla por archivo: Cuenta, Inicio, Mapa, Reto, Mochila, Logros,
                           Perfil, Aulas, ModoAula, Escaner
  src/componentes/         Ajolote, íconos, ModeloVisual, SendaPasos, MensajeCasi...
  src/logica/              Ayudas de vista, diagnóstico del escáner, Modo Aula sin internet
  src/styles/              tokens.css (del sistema de diseño) y app.css
```

**Tareas frecuentes:**

- **Agregar o cambiar retos:** edita `backend/app/contenido.py` y corre `cd backend && uv run python -m app.semilla`.
- **Agregar un endpoint:** crea la función en `backend/app/rutas/`, valida la entrada en `esquemas.py`, agrega su llamada en `frontend/src/api.js` y escribe una prueba en `backend/tests/`.
- **Ajustar estrellas, costos o reglas:** `VALORES` al inicio de `backend/app/juego.py` (los cuidados ya no tienen costo).
- **Cambiar a PostgreSQL:** cambia `DATABASE_URL` en `.env` e instala el driver: `uv add "psycopg[binary]"`.
- **Ver y probar la API sin frontend:** http://localhost:8000/docs.

---

## 10. Reglas que no se rompen (del sistema de diseño)

- **El error nunca es rojo** ni quita vidas, puntos o estrellas. Por eso no hay vidas ni corazones.
- **Sin rankings ni tabla de posiciones.** Las listas del maestro van en orden alfabético.
- **El ajolote es la única mascota.** Sus medidores **solo bajan al jugar**: si la app no se usa, nada baja y nada se rompe.
- **Nunca se muestra la respuesta del mismo reto** en las pistas. Después de 3 pistas viene un ejemplo con otros números.
- **Apodos, nunca nombres completos.** Colores solo con los tokens de `tokens.css`. Español de México, sin emojis en la interfaz.

---

## 11. Pendiente

- [ ] **IA del escáner**: endpoint que lea la foto. En el frontend, `frontend/src/logica/lector.js` ya está listo para conectarse. La API key va solo en `backend/.env`.
- [ ] **Tutor con IA** (pistas personalizadas), con límite de pistas y freno a solicitudes.
- [ ] **Diagnóstico inicial** (examen corto por tema) y nivel estimado por tema.
- [ ] **Revisión pedagógica** del contenido, que todo está en borrador. Faltan las unidades de División y Fracciones.
- [ ] Modo sin conexión para el alumno: guardar intentos y enviarlos al volver el internet.
- [ ] Revisar el tema Noche con diseño: el sistema solo define el tema Día.
- [ ] Despliegue (Railway, Render o servidor propio) con `ENTORNO=produccion` y HTTPS.


## Habitación del ajolote (integración v2.0)

La sección **Mascota** se reemplazó por **Habitación** (`#/habitacion`; alias `#/mochila` y `#/mascota`). Se mantiene el rediseño Stitch y el progreso de los mundos, los exámenes, los trajes, el diagnóstico, las aulas y el tutor. La habitación tiene decoración isométrica, inventario, compras con las estrellas reales, cuidados arrastrables, descanso y guardado por alumno. Trajes conserva el armario y permite equipar los premios necesarios para abrir mundos.

- [Diseño y API de Habitación](docs/selva-matematica/Habitacion.md)
- [Pruebas de integración](docs/PRUEBAS-HABITACION.md)

Arranca los servicios como antes (`uv sync`, `uv run uvicorn app.main:app --reload` en backend; `npm ci`, `npm run dev` en frontend). Para conservar cuentas, usa una copia de **la base de datos de esta nueva versión v2.0** y su `.env` local, con ambos servidores detenidos y respaldo previo. No reemplaces la base de esta versión con la de la versión anterior del juego: los usuarios y mundos podrían no coincidir. Este ZIP no fusiona bases de datos ni incluye archivos privados, entornos virtuales o dependencias instaladas. Las tablas activas de Habitación se crean al arrancar; se migra automáticamente la columna de temporizadores de mascotas. El minijuego de burbujas se retiró. Los datos de una tabla histórica de burbujas no se borran.

### Actualización de Cuidados v3

Alimentar, limpiar y dormir son gratuitos y tienen recargas independientes de tres minutos, validadas por FastAPI. Cada barra que llega a cinco marcas desde un valor menor da una estrella verde sin XP. Jugar abre Mundos. El descanso requiere cama y se termina tocando la pantalla. Consulta [reglas](docs/selva-matematica/Recompensas-y-cuidados.md).

### Actualización Tienda v4

La tienda desbloquea decoraciones según las trajineras completadas de El Canal de los Números, no según la XP. Los accesorios especiales se desbloquean al superar las trajineras 3, 6, 9 y 12. Los precios, estrellas verdes e inventario previo se conservan. No se requiere ninguna migración adicional ni dependencias nuevas. Consulta [Habitación](docs/selva-matematica/Habitacion.md).

En Tienda y Trajes v4, el personaje de Habitación usa el ajolote original de Sinapsis (Sin traje especial por defecto). El armario permite volver a ese aspecto sin perder los trajes ni el progreso.
