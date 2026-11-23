# Selva Matemática (sinapsis-v2)

**IA que enseña a pensar.** Plataforma gamificada de matemáticas básicas para alumnas y alumnos de 9 a 15 años en México. Se explora una selva de mundos y retos junto a **Kiko**, un ajolote guía que nunca castiga el error: lo convierte en una pista.

Proyecto para UniconHub Hack / Claude Build Day (28 de noviembre de 2026).

## Cómo correrla

Necesitas Node 20 o más reciente.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (también se abre desde el celular en la misma red)
npm test           # pruebas de la lógica del juego
npm run build      # versión para publicar (incluye el modo sin conexión)
```

## Qué funciona ya

| Pantalla | Qué hace |
|---|---|
| **Inicio** | Pide un apodo, saluda (con mensaje especial si regresas después de días), muestra el reto del día y el bienestar de Kiko. |
| **Mapa** | 3 mundos con nodos completados, actual y bloqueados, y un cofre al final de cada mundo. El mundo 3 está marcado como "próximamente". |
| **Reto** | Tarjeta del reto con apoyo visual (monedas, bolsitas o barras), "Comprobar", hasta 3 pistas socráticas y luego un ejemplo parecido. Si hay error, muestra "¡Casi!" con la senda de pasos. La primera misión abre con el ejemplo del ajolote. |
| **Mochila** | Cuidados de Kiko: medidores de comida, pecera y alegría, y las acciones alimentar, jugar, limpiar y descansar. |
| **Logros** | Álbum de stickers, logros y constancia "sin valor curricular". |
| **Escáner** | Captura (cámara o galería), recorte, compresión a menos de 300 KB, confirmación de lo leído y diagnóstico con la senda de pasos. Sin internet, guarda la foto "en la mochila" y hace las 3 preguntas generales. La foto se borra al confirmar. |
| **Modo Aula** | El maestro arma el grupo con apodos, proyecta un reto a la vez, revela la respuesta y marca ✓/✗ con errores típicos opcionales. Incluye la meta colectiva de estrellas y el panel del maestro (errores comunes, qué reforzar, alumnos que necesitan apoyo y progreso). |

Todo se guarda en el dispositivo (`localStorage`). Todavía no hay backend.

## Estructura

```
docs/selva-matematica/   Sistema de diseño original (tokens, reglas y componentes). Es la referencia: léanlo.
frontend/
  src/contenido/mundos.js    Mundos, retos y errores típicos. Para agregar contenido se edita SOLO este archivo.
  src/logica/                Reglas puras y con pruebas:
    juego.js                 Estrellas, bienestar, mapa, escalera de apoyo, logros (VALORES iniciales arriba)
    diagnostico.js           Senda de pasos: dónde se torció el procedimiento (sin IA)
    pistas.js                Pistas socráticas y ejemplo parecido
    aula.js                  Modo Aula: marcas, meta del salón y resumen del panel
    lector.js                Lectura de la foto del escáner (PENDIENTE: conectar backend)
    imagen.js                Recorte y compresión de la foto
    logica.test.js           Pruebas (npm test)
  src/componentes/           Ajolote, íconos sticker, ModeloVisual, SendaPasos, MensajeCasi...
  src/pantallas/             Una pantalla por archivo
  src/estado/store.jsx       Estado global guardado en el dispositivo
  src/styles/                tokens.css (del sistema de diseño) y app.css
  public/sw.js               Service worker para funcionar sin internet
```

## Reglas que no se rompen (del sistema de diseño)

- **El error nunca es rojo** ni quita vidas, puntos o estrellas. Se usa `casi` (durazno) y siempre lleva a una pista o a reintentar.
- **Nunca se muestra la respuesta del mismo reto** en las pistas. Después de 3 pistas viene un ejemplo con otros números.
- **El apoyo visual nunca muestra el total** del reto; solo el ejemplo del ajolote lo muestra.
- **Sin rankings.** En el Modo Aula hay apodos, nunca nombres completos, y la lista de apoyo va en orden alfabético.
- **Colores, radios y espacios solo con tokens** (`var(--selva)`, `var(--radio-md)`…).
- Texto en español de México, tuteando, sin emojis en la interfaz.

## Pendiente (para repartir)

- [ ] **Backend + IA del escáner**: implementar `frontend/src/logica/lector.js` contra un endpoint del backend. La API key va solo en el backend.
- [ ] **Revisión pedagógica** de los retos y las pistas con la maestra o el maestro. Todo el contenido es borrador.
- [ ] Mundo 3 (fracciones): apoyos visuales para división y fracciones (pendiente en `Apoyo-visual.md`).
- [ ] Cuentas y sincronización: vincular el apodo del Modo Aula con la cuenta de cada alumno, más el aviso privado de progreso.
- [ ] Ilustración final del ajolote y los stickers por parte del equipo de diseño. Los actuales son los dibujos de referencia del sistema.
- [ ] Probar los VALORES iniciales con alumnos (`frontend/src/logica/juego.js`).
- [ ] Privacidad: consentimiento de madres y padres para usar la cámara, y borrado de datos al terminar el ciclo escolar.
