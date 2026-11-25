# Botón

Botón 3D de juego: contorno de 2px en `tinta`, `radio-md`, sombra sólida de 4px que desaparece al presionar (baja 4px).

## Variantes
- **Primario** (`selva`, texto `tinta`): la acción principal de la pantalla (“▶ Jugar”, “Comprobar”). Uno por pantalla.
- **Secundario** (`magia`, texto blanco): acciones de navegación o del Modo Aula.
- **Premio** (`sol`): solo para reclamar recompensas.
- **Pista** (`pista-suave`, texto `pista-texto`): pedir una pista socrática.
- **Suave** (`superficie`): reintentar, cancelar, volver.
- **Bloqueado**: relleno `bloqueado`, sin sombra, con candado.

## Reglas
- Alto mínimo 52px; texto en `boton` (Baloo 2, 20px).
- Verbo primero y corto: “Comprobar”, no “Haz clic para comprobar tu respuesta”.
- Foco del teclado: anillo de 3px en `pista`.
- Clases: `sm-btn` + `sm-btn-magia` | `sm-btn-sol` | `sm-btn-pista` | `sm-btn-suave` (en `components/bundle.css`).
