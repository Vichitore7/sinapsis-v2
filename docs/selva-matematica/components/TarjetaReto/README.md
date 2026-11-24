# TarjetaReto

Tarjeta de un reto: chip de ubicación, recompensa, título narrativo, enunciado cotidiano, operación con campo de respuesta y acciones.

## Estructura
1. Chips: ubicación (`magia-suave`) y premio (`sol`).
2. Título en `subtitulo`, con voz de aventura (“Misión en el mercado”).
3. Enunciado en `cuerpo`, con contexto de México (tienditas, pasajes, recetas).
4. Operación en `numero-reto` + campo `sm-input` (Nunito 32px, `radio-sm`).
5. Primario “Comprobar” + botón de pista.

## Reglas
- `superficie`, contorno de 2px, `radio-lg`, `sombra-tarjeta`, relleno `espacio-4`.
- Un reto por tarjeta. Máximo 2 líneas de enunciado en celular.
- El campo de respuesta acepta también una foto del cuaderno (abre el escáner).
- Cuando el concepto es nuevo lleva un apoyo visual entre el enunciado y la operación (ver ModeloVisual). El apoyo muestra las cantidades, nunca el total.
