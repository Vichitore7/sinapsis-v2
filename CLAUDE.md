# CLAUDE.md: Mix (ThinkLoop), sinapsis-v2

Contexto para Claude Code. Léelo al retomar el trabajo. Última actualización: **25 nov 2026**.

## Qué es

App web para aprender matemáticas de 1.º de primaria a 3.º de secundaria (México, SEP). La guía es **Mix**, un ajolote al que el alumno puede cambiarle el nombre. La idea central es una **IA que enseña a pensar**: da pistas socráticas y nunca la respuesta.

- **Nombres (25 nov):** la app se llamaba "Selva Matemática" y el ajolote "Kiko"; ahora **la app y el ajolote se llaman Mix** (la app lleva el nombre de su guía; un rato fueron "Sinapsis" y "Mih"). El repo sigue siendo `sinapsis-v2`.
  - Solo cambió lo que se ve. Los nombres internos siguen con "kiko": clases CSS `kiko-*`, archivos de stickers `kiko-*.png`, el componente `CabezaKiko` y `de: "kiko"` en el chat.
  - Al arrancar, los ajolotes que se llamaban "Kiko" (o "Mih", el nombre que tuvo un rato) pasan a "Mix" (`main.py`).
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
  - `npm run dev` arranca en :5173 y manda `/api` al backend por el proxy de Vite. Pruebas: `npm test` (40).
- **Backend:** FastAPI + SQLAlchemy + SQLite, con `uv`, en `backend/`.
  - `uv run uvicorn app.main:app --port 8000 --reload`
  - Datos de prueba: `uv run python -m app.semilla --demo`
  - Pruebas: `uv run pytest` (232). Si falla todo, revisa que no esté exportada una `DATABASE_URL` vieja.
- **Seguridad:**
  - Contraseñas con argon2, sesión con JWT en cookie httpOnly y freno a intentos repetidos.
  - Código de recuperación guardado con HMAC.
  - **Las respuestas se validan en el servidor** y nunca llegan al navegador.
- **Al arrancar**, `create_all` + `migrar_columnas()` (en `db.py`) agregan las columnas nuevas, y `cargar_contenido` se puede correr varias veces sin duplicar.
- **Usuarios demo** (contraseña `selva123`): `profe_demo`, `teo_demo`, `luna_demo`, `sol_demo`.
- **Capturas de pantalla:** playwright-core con `/usr/bin/google-chrome`. Usa cuentas temporales y bórralas al terminar.

## Pantallas actuales

- **Alumno:** Inicio, Mapa, Escáner + IA Tutor, Mi Aula y Mascota (Mochila).
  - **Inicio:** Mix pregunta "¿Queda algo pendiente?" y muestra cursos pendientes, Ir al Mapa y misiones.
  - **Mi Aula:** clases tipo Classroom, con mi avance y el promedio del grupo.
  - **Perfil:** logros, medallas, stickers, diplomas y personalizar.
  - **Examen diagnóstico:** arranca solo la primera vez que entra el alumno. **Según el grado** (de Samuel, 25 nov): el grado que elige al crear su cuenta se guarda en el servidor (`usuarios.grado`) y hay un examen de 8 preguntas por grado (P1 a S3) en `diagnostico.py`; las cuentas sin grado siguen con el examen general.
  - **Mascota → Habitación** (de Adrian, 25 nov): acuario con stickers (día y noche), tienda y escenario (`frontend/src/habitacion/`, `pantallas/Habitacion.jsx`, `rutas/habitacion.py`). Los cuidados no cuestan estrellas; hay un tiempo de espera entre cuidados (`mascotas.cuidados_hasta`) y para dormir hay que poner la cama.
- **Profesor:** Modo Aula, Diagnóstico y Perfil.
  - **Actividades del aula (25 nov):** `app/actividades.py` + `rutas/actividades.py` (pruebas en `tests/test_actividades.py`); frontend en `componentes/ActividadesProfe.jsx` (Modo Aula), `componentes/Actividades.jsx` (Mi Aula) y `componentes/ComprensionProfe.jsx` (Diagnóstico). Separadas del Mapa: el Aula y el Escáner son para estudiar.
    - **Por módulo** (Suma y resta, Multiplicación, División, Fracciones; `MODULOS`): el profesor elige el módulo y dentro marca los ejercicios del banco de su grado o escribe los suyos (deben ser de ese módulo). El alumno y el profesor ven las tareas agrupadas por módulo, y la gráfica y "Tutor sugiere" también van por módulo.
    - El profesor crea una actividad con título, instrucciones, **material de texto y enlaces** (sin archivos por ahora), fecha límite opcional y **problemas**: los escribe o los toma del **banco de prueba por grado** (`BANCO`, P1 a S3, texto propio; temas según el estándar de contenidos). Solo operaciones que el escáner revisa (naturales y fracciones con + − × ÷).
    - El alumno los resuelve **en su cuaderno y los escanea** (`#/escaner/:aula.:actividad.:problema`): Mix revisa cada uno (filtro obligatorio) y le ayuda si algo está mal; lo resuelve al escanear la corrección o cuando Mix confirma en el chat que ya lo resolvió. Solo puede **entregar** cuando todos los problemas pasaron por el escáner. Si escanea otra operación, Mix le avisa que no es la del problema.
    - **Foto de la página completa (25 nov), como en Classroom:**
      - En Inicio, "¿Tienes alguna tarea pendiente?" lista las tareas sin entregar; cada una abre `#/escaner/:aula.:actividad` (`pantallas/EscanerTarea.jsx`).
      - El alumno le toma foto a su página (y luego a la otra, si hace falta). `POST /api/actividades/{id}/leer-pagina` (`lector.leer_pagina` + `actividades.emparejar_pagina`) lee todas las operaciones y las acomoda en su problema, sin registrar nada.
      - El alumno confirma o corrige su resultado, y cada una se registra con el escaneo de siempre.
      - "Revisar con Mix" abre el escáner de ese problema con la operación ya confirmada (`sessionStorage`, `claveTraspaso`), sin otra foto y sin registrarla dos veces.
      - Sin IA, escanea cada problema con "Solo este".
    - El profesor ve quién entregó y cada respuesta en palabras ("Pregunta 1: 6 × 7: primero contestó 13 (sumó en lugar de multiplicar); lo corrigió con ayuda de Mix").
    - **El profesor solo ve lo de sus clases y tareas, nada del Mapa** (25 nov): Diagnóstico ya no muestra progreso de la selva, retos, estrellas, racha ni exámenes de los mundos; el panel por alumno usa `resumen_alumno` (tareas entregadas, ejercicios a la primera / con ayuda / sin corregir, errores) y el CSV también. El endpoint viejo `/aulas/{id}/panel` sigue en el backend, pero la pantalla ya no lo usa.
    - **Diagnóstico:** el "Examen diagnóstico de entrada" se quitó de la pantalla del profesor (el alumno lo sigue haciendo); en su lugar, una **gráfica por tema** (dificultad / comprende / domina, rampa azul ordinal validada para daltonismo) con filtros por categoría y por alumno (apodo). "Tutor sugiere" usa lo de las actividades: qué domina, qué no termina de comprender, qué no entendió, el error que repite y qué le ha funcionado (los dibujos de Mix que ayudaron). La categoría la decide el código, nunca el modelo; solo conteos y etiquetas, nunca el texto del chat.
  - **Modo Aula:** grupos con varios módulos. Los alumnos entran solo con el código o con aprobación del profe.
  - **Diagnóstico:** resultados por habilidad y por alumno, con exportación a CSV.
- **Contenido jugable:**
  - Mundo 1 **"El Canal de los Números"** (1.º de primaria, Xochimilco, de Gera): 12 niveles con 3 ejercicios cada uno, en `contenido_canal.py` y `componentes/Canal.jsx`. Los dibujos llevan borde blanco de sticker (clase `.sticker`) y los objetos para contar van en filas de 10 con pausa de 5 en 5 (a propósito: así se cuenta por grupos).
  - Mundo 2 **"El Centro de los Números"** (2.º de primaria, Centro de la CDMX, de Gera): 12 niveles de 3 ejercicios en `contenido_cdmx.py` y `componentes/CDMX.jsx`. Cada nivel es un transporte de la tarjeta de movilidad integrada, con 3 cacomixtles, y lleva `faseCPA` (niveles 1–4 concreto, 5–8 pictórico, 9–12 abstracto).
  - Mundo 3 **"La FES de los Números"** (3.º de primaria, FES Aragón, de Gera): 12 niveles de 3 ejercicios en `contenido_fes.py` y `componentes/FES.jsx`. Cada nivel es un lugar del campus, con 3 tlacuaches, y lleva `faseCPA`. El mapa tiene título propio (`Titulo` en el tema), andador y decoración del campus (torres, auditorio, mascota, hombre de morado…). Al terminar: constancia, sticker del peluche de la mascota y 2 trajes para el frío (`nevado-gorro`, `nevado-orejeras`), porque el siguiente mundo será el Nevado de Toluca. Respuestas de opción de hasta 60 caracteres (`esquemas.py`).
  - Mundo 4 **"El Nevado de los Números"** (4.º de primaria, Nevado de Toluca, de Gera): 12 niveles de 3 ejercicios en `contenido_nevado.py` y `componentes/Nevado.jsx`. Cada nivel es una parada de la subida (entrada, albergue, bosque, lagunas, cráter, cumbre…), con 3 teporingos, y lleva `faseCPA`. Mapa nevado (de noche, con copos) con sendero de tierra y título propio. Las respuestas con decimales, fracciones o cociente y residuo van como opción (el campo numérico solo lee enteros). Al terminar: constancia de alpinista, sticker de la bolita de nieve (`esfera`) y 2 trajes de baño (`tolantongo-short`, `tolantongo-completo`), porque el siguiente mundo será las Grutas de Tolantongo.
  - Los mundos temáticos (Canal, Centro, FES y Nevado) se registran en `MUNDOS_TEMATICOS` (`contenido.py`) y en `componentes/Temas.jsx`. Terminan con **examen general**: certificado + 2 trajes de subculturas al azar (de estilos y subculturas distintos); ponerse uno abre el mundo siguiente. El profesor ve el reporte del examen en Diagnóstico.
  - Módulo `multiplicacion`: mundo m2 "El mercado" (Mundo 5, 4 retos; se abre con un traje de Tolantongo). **La tiendita (m1) se quitó**: `cargar_contenido` borra de la base los mundos que ya no están en el contenido.
  - La división (`÷`) solo está en los ejercicios (`OPERACIONES_EJERCICIOS` en `juego.py`); el tutor de IA sigue con `OPERACIONES` (sin división).
  - El resto dice "próximamente": división, fracciones, suma-resta, valor-posicional, decimales, geometría y medición.
- **Sin vidas:** la barra de arriba ya no muestra corazones (parecían vidas). El bienestar de Mix vive en la Mochila.

## Equipo y Git

- **Backend:** Victor y Samuel. El resto del equipo hace frontend.
- **Samuel** hizo que en el chat del escáner se pueda **tomar foto o subirla de la galería** (`Escaner.jsx`, ya en `dev`). Coordinar con él antes de cambiar esa pantalla.
- **Gera** arma los niveles con `docs/material-de-estudio/` (Mundo 1, el Canal) y los stickers de `docs/imagenes/`.
- **Adrian** hace la mascota (Mochila, bienestar de Mix). No mover esa mecánica sin él.
- **Ramas:** `main`, `dev`, `victor`, `gera`, `katia`, `samuel` y `zulu`.
  - Hasta `f2d0fc6` todas estaban iguales.
  - **Desde ahora solo se sube a `victor` y a `dev`, de preferencia con Pull Request.** Si se empuja a la rama de otra persona se le puede pisar el trabajo.
  - **Ojo al subir:** el PR #8 de Adrian traía una copia completa del proyecto dentro de una carpeta `sinapsis-v2/` (por eso la app no la usaba); se integró en las carpetas correctas en el #9. Sube siempre desde la carpeta del repo, nunca una copia dentro de ella. `zulu` todavía tiene esa copia vieja.
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
- **Manual del tutor: `backend/app/agente.md`.** Personalidad, regla de oro (ayuda, no respuesta), formato, escalera de ayuda, cómo adaptarse al grado y a la forma de aprender (visual, auditiva, kinestésica, lógica, narrativa), fuentes confiables, emociones y seguridad. Se manda en cada mensaje junto con `docs/material-de-estudio/` (la progresión de todos los grados y el archivo del grado del alumno, sin las "Ideas de mundo"). **Para cambiar cómo se comporta Mix, edita ese archivo.**
- `app/tutor.py` (carga el manual, filtro que bloquea respuestas con el resultado, límite por alumno), `app/rutas/tutor.py` (`POST /api/tutor`) y `tests/test_tutor.py` (Claude simulado, no gasta saldo).
- **Dibujos:** Claude no genera imágenes. Contesta con un JSON fijo (`output_config.format`, esquema en `app/dibujos.py`) con el texto y, si ayuda, un `dibujo` (objetos, grupos, quitar, recta, decenas, monedas, gráfica o figura) que el chat pinta con los stickers del Mundo 1 (`VisualCanal` de `Canal.jsx`). Un dibujo fuera de límites se descarta; uno que al contarlo da el resultado hace que se use la respuesta por reglas.
- Mix también contesta dudas de temas sin operación escaneada. Si el alumno escribe una cuenta en el chat ("cuánto es 345 x 12"), el filtro también bloquea su resultado.
- **Contrato:** recibe `{ operacion?: {a, op, b, c}, mensaje, historial, grado?, ejercicio?, turno?, recibido? }` (el grado es el que eligió al registrarse, p. ej. `"Primaria • 4°"`; `turno` y `recibido`, ver "Sincronía" abajo) y regresa `{ respuesta, origen: "claude" | "reglas", dibujo }`.
- **Clave:** `ANTHROPIC_API_KEY` en `backend/.env`; nunca se sube. **Sin clave, sin internet, si Claude rechaza o si el alumno pasa su límite (40/hora, 150/día), usa las pistas por reglas.** Así a nadie se le rompe la app. Cada quien puede trabajar sin clave.
- **Modelo:** `TUTOR_MODELO` (por defecto `claude-haiku-5-5`) y `TUTOR_ESFUERZO` (`medium` desde el 24 nov; con `low` "reciclaba" preguntas). Haiku 5.5 no tiene respaldo del servidor cuando rechaza: se maneja `stop_reason == "refusal"` con reglas.
- A Claude solo le llegan la operación y el chat: ni apodo ni id.
- Frontend: `api.tutor()` en `api.js`; `Escaner.jsx` contesta con reglas si no hay conexión.

**Lectura de la foto (24 nov):** `app/lector.py` + `POST /api/escaner/leer` (`rutas/escaner.py`, pruebas en `tests/test_lector.py`).
- Recibe `{ foto: dataURL }` y regresa `{ lectura: { a, op, b, c | null, dudoso } | null, origen }`. Claude **transcribe sin corregir** (aunque el resultado esté mal); `c` es null si el alumno no escribió resultado.
- La foto solo vive en memoria durante la petición: no se guarda ni se registra. Cuenta para el límite del alumno.
- Modelo: `LECTOR_MODELO` (por defecto el mismo que `TUTOR_MODELO`, Haiku). Si en fotos reales lee mal, probar `claude-sonnet-5-5` solo aquí.
- Frontend: `leerOperacion` en `lector.js` llama al backend; el escáner muestra "Mix está leyendo…" y luego la confirmación. Una foto mandada al chat se lee y va a la misma confirmación. **Nunca se diagnostica sin que el alumno confirme.** Sin clave o si no se lee, el alumno la escribe a mano.

**Fracciones, divisiones y otros ejercicios (24 nov):**
- `app/operaciones.py` (espejo en `frontend/src/logica/operaciones.js`; si cambias una regla, cambia las dos): números como texto (`"17"`, `"3/4"`), operaciones × + − ÷, división con `residuo`. Diagnostica errores típicos (sumar numeradores y denominadores, multiplicar en vez de dividir, residuo mayor que el divisor) y acepta fracciones equivalentes. Las restas que dan negativo no se revisan (son de secundaria).
- El lector regresa `{ lectura, otro, origen }`: `otro` es un ejercicio que el escáner no revisa (problema de texto, ecuación…). El chat lo muestra con botones **Sí / No**; si el alumno confirma, se manda al tutor como `ejercicio` y Mix lo guía sin resolverlo.
- El filtro del tutor también bloquea resultados en fracción (aunque sean equivalentes, p. ej. 10/8 por 5/4).

**Memoria de aprendizaje (fase 1 de 4, 24 nov):** `app/aprendizaje.py` (tabla `aprendizaje`, una fila por alumno y concepto; pruebas en `tests/test_aprendizaje.py`).
- La llena el **código**: retos del mapa (`servicio.registrar_intento`), operaciones confirmadas en el escáner (`POST /api/escaner/resultado`) y el chat (qué dibujo usó Mix y si después el alumno lo resolvió). Solo conteos y etiquetas, nunca el texto del chat.
- Estado por concepto: nuevo, practicando, necesita_refuerzo o dominado. **Dominado = 3 ejercicios distintos sin ayuda** y pocos errores recientes (nunca por un acierto).
- Mix recibe en cada mensaje un resumen corto (`resumen_para_tutor`) con indicaciones que decide el código ("ya domina…: no le expliques lo básico"). `GET /api/aprendizaje` muestra la memoria del alumno.
- El manual ya no etiqueta "alumno visual/auditivo": prueba representaciones y recuerda cuál le ayudó.
- **Decisión:** no se da la solución completa ni como último recurso (regla no negociable); en su lugar, ejemplo parecido resuelto o resolver juntos hasta el penúltimo paso.

**Escalera de pistas (fase 2, versión 2 del 24 nov):** `app/estrategia.py` (tabla `escaleras`) + `app/pasitos.py`; pruebas en `tests/test_estrategia.py`.
- La v1 cambiaba de estrategia en cada escalón (pregunta → dibujo → ejemplo con otros números → penúltimo paso) y para un niño cada salto era otro tema; además repetía el texto fijo aunque el alumno preguntara "¿por qué?". **La v2 trabaja siempre sobre SU ejercicio, partido en pasitos** de una idea (p. ej. 5/6 + 2/3: "¿2/3 son cuántos sextos?" → "5/6 + 4/6: ¿cuántos sextos?").
- Primer mensaje: pista sobre su error (la escribe Mix). Luego, según lo que contesta: acierta el pasito → avanza; "¿por qué?" → explicación del porqué de ESE pasito (con dibujo), sin avanzar; "no entiendo" → lo explica más concreto y, si se vuelve a atorar, le dice cuánto da ese pasito y avanza. El último pasito (el resultado) lo hace él; si se atora ahí, ejemplo parecido con otros números y luego ofrecer descanso. 1.º, 2.º y "le está costando" van directo a los pasitos.
- **Las cuentas las escribe el código** (verificadas); del modelo solo una frase corta sin números. Hay una red de seguridad: si algún texto de un pasito mencionara el resultado por coincidencia, se usa un pasito sencillo. Las pruebas revisan más de 800 operaciones.
- Con una operación del escáner, **los dibujos los pone solo el código**.
- **Cuentas escritas en el chat** ("quiero resolver 47 + 36") se toman como su ejercicio: misma escalera de pasitos, y Mix no la olvida. "70 + 13 = 83" cuenta como respuesta, no como cuenta nueva. Si ya la resolvió, su escalera se cierra; si la vuelve a escribir, empieza de cero.
- **El código revisa las respuestas del alumno en la plática libre**: si Mix preguntó una cuenta ("¿cuánto suman 70 y 7?"), el backend le dice si el alumno contestó bien (Haiku llegó a decir que 70 + 7 no era 77). Y si el alumno menciona números como 877, Mix recibe su valor posicional ya calculado.
- Lenguaje sin género: solo conocemos el apodo; el manual lo pide y el código corrige lo más común ("solito" → "por tu cuenta").
- Diagnósticos de errores típicos en `operaciones.py` (espejo en `operaciones.js`): sumó en vez de multiplicar, no llevó la decena, no pidió prestado, un grupo de más/menos, sumó numeradores y denominadores, multiplicó en vez de dividir, residuo grande.
- **Pendiente de decidir:** el juez sugiere, en 1.º y 2.º, dibujar las dos cantidades para que el niño las cuente (hoy se bloquea porque contando sale el resultado).

**Sincronía y estabilidad (25 nov, revisado con Codex en varias rondas):**
- **Turnos.** Cada mensaje del chat lleva `turno` (`"visita:n"`, sube con cada mensaje) y `recibido` (el último turno cuya respuesta SÍ se mostró). El avance de la escalera (`escaleras.pendiente`) y la ayuda en la memoria (`turnos_tutor.ayuda`) quedan pendientes hasta que el siguiente mensaje los confirma; si la respuesta se descartó (cambió de ejercicio, error de red), el pasito se repite en vez de perderse. Un reintento del mismo turno recibe la misma respuesta; uno más viejo que el último no altera nada. Sin `turno` (la evaluación, clientes viejos) todo se guarda al momento, como antes. Código en `estrategia.sincronizar`, `dejar_pendiente` y `anotar_entrega`.
- **Intención antes de avanzar** (`estrategia.intencion`): "voy a descansar, seguimos mañana" es pausa y "quiero entender qué es una fracción" es cambio de tema; ninguna cuenta como atasco ni avanza la escalera. Si el mensaje trae números, "esto", "este paso" o "por qué", se toma como pregunta de su ejercicio.
- **Dudas y negaciones no son acierto:** "¿será 42?", "creo que 42", "42 o 43", "no es 42" no cierran el ejercicio ni un pasito; "no es 41, es 42" sí. Con duda, Mix pide que explique cómo llegó (sin confirmar ni negar). La misma regla en `estrategia.py` y `operaciones.js`.
- **Chat del escáner** (`Escaner.jsx`): un mensaje a la vez (enviar, pistas, reiniciar y fotos se bloquean mientras Mix piensa); cada "pensando" es de su petición; al reiniciar o confirmar otro ejercicio, las respuestas tardías se descartan; antes de pedir pistas espera a que el servidor registre el escaneo (si falla dos veces, usa las pistas del navegador). Al confirmar un escaneo incorrecto empieza un intento nuevo y la pista que ya mostró la pantalla cuenta como el primer escalón.
- **Ejercicio resuelto:** se apagan las pistas de ese ejercicio (con o sin conexión), pero si pide "¿por qué?" o "explícame" se le explica (sin conexión, con `explicacionResuelta`).
- **Tiempo de dudas al resolver (25 nov):**
  - Al resolver, Mix dice "¡Lo lograste!" y el código agrega la pregunta "¿Te quedó todo claro o tienes alguna duda de lo que vimos?" (`PREGUNTA_DUDAS`). El tutor regresa `cierre: true` y el chat muestra los botones **¡Todo claro!** y **Tengo una duda**.
  - Esos dos botones los contesta el código, sin Claude.
  - Después, con el ejercicio cerrado, Mix explica sus dudas de lo que vieron. Ya puede decir el resultado, pero no pone cuentas nuevas: la red de seguridad quita solo las preguntas que piden resolver una cuenta. Si el alumno se sale del tema, lo regresa.
  - Las instrucciones están en `TERMINADO` (`tutor.py`) y en `agente.md`.
- **Estado del juego sin choques:** dos peticiones simultáneas de una cuenta nueva ya no dan 500 (`servicio.estado_de`, `INSERT … ON CONFLICT DO NOTHING`, sirve en SQLite y Postgres; en SQLite además está el candado `bloquear_escritura` de Adrian).
- **Prueba de navegador** (Playwright, con el tutor y el escáner simulados: no gasta saldo) que cubre estas secuencias. Por ahora NO está en el repo (falta acordar con el equipo agregar `playwright-core` al `package.json`).

**Dibujos nuevos (fase 3):** `fracciones` (pizza o chocolate), `balanza`, `porcentaje` (cuadrícula de 100) y `tabla`, en `dibujos.py` y `frontend/src/componentes/DibujoTutor.jsx` (con descripción en texto). **El esquema JSON de la respuesta debe ser simple** (`tipo` + `datos` como texto JSON): con un esquema grande Claude tardaba más de 20 s o respondía "Schema is too complex"; hay una prueba que lo vigila.

**Evaluación pedagógica (fase 4):** `backend/evaluacion/` (30 escenarios de 1.º de primaria a 3.º de secundaria en `escenarios.py`).
- `uv run python -m evaluacion.evaluar` (≈ $0.05 con Haiku) · `--juez` agrega calificación de 1 a 5 con Claude Opus 5.5 (≈ $0.80 más) · `--esfuerzo low` para comparar · `--solo <id>`.
- Usa una base temporal (no toca `selva.db`); el reporte queda en `evaluacion/resultados/` (ignorado por git).
- Resultado 24 nov (Haiku `medium`, escalera v2): 30/30 sin problemas de código; juez: guía sin dar **4.8** (v1: 4.4), adapta nivel 4.3, no complica 4.1, claridad 4.0, calidez 4.5.

**Falta:**
- Probar la lectura con fotos reales de cuaderno (hasta ahora solo con imágenes de prueba con letra imitada).
- **Comparar Haiku contra Sonnet** con unas 30 preguntas de `docs/material-de-estudio/` (1.º de primaria a 3.º de secundaria, más casos de "ya dime la respuesta").

## Pendientes e ideas (de la revisión del 23 nov, calificación 6.5/10)

Prioridades para la entrega:
1. **IA real:** el tutor y la lectura de la foto ya usan Claude; falta probar con fotos reales y comparar Haiku contra Sonnet.
2. **Contenido:** cerrar un grado completo (3.º de primaria: multiplicación + división + fracciones, unos 12 retos por mundo). El Mundo 3 (FES, 3.º) ya está; el **diagnóstico según el grado** ya está (Samuel, 25 nov).
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
