"""Mundo 1: El Canal de los Números (1.º de primaria), inspirado en el canal de Xochimilco.

12 niveles (chinampas en el mapa) con 3 ejercicios cada uno; cada ejercicio resuelto enciende un pez.
Todo está en BORRADOR: falta la revisión pedagógica de la maestra o el maestro.

Tipos de ejercicio:
- conteo:   respuesta numérica (contar, leer una gráfica, medir, monedas, decenas).
- numerica: una cuenta a op b (+ o −) con objetos; se diagnostica con la senda de pasos.
- opcion:   elegir una de las opciones (comparar, ordinales, figuras).

`visual` le dice al frontend qué dibujar (componentes/Canal.jsx). Nunca trae la respuesta marcada.
"""
from __future__ import annotations

from .juego import OPERACIONES_EJERCICIOS as OPERACIONES

TEMA = "xochimilco"
LECCION_ID = "x1"


def _conteo(id_, titulo, enunciado, respuesta, visual, pistas, error, moneda=False):
    return {"id": id_, "tipo": "conteo", "titulo": titulo, "enunciado": enunciado, "respuesta": str(respuesta),
            "visual": visual, "pistas": pistas, "pregunta_error": error, "moneda": moneda,
            "explicacion": f"La respuesta es {'$' if moneda else ''}{respuesta}."}


def _cuenta(id_, titulo, enunciado, a, op, b, visual, pistas):
    resultado = OPERACIONES[op](a, b)
    assert op != "÷" or a % b == 0, f"{id_}: el reparto debe ser exacto"
    return {"id": id_, "tipo": "numerica", "titulo": titulo, "enunciado": enunciado, "respuesta": str(resultado),
            "a": a, "b": b, "op": op, "visual": visual, "pistas": pistas,
            "explicacion": f"{a} {op} {b} = {resultado}."}


def _opcion(id_, titulo, enunciado, opciones, respuesta, visual, pistas, error):
    assert respuesta in opciones, f"{id_}: la respuesta no está en las opciones"
    return {"id": id_, "tipo": "opcion", "titulo": titulo, "enunciado": enunciado, "respuesta": respuesta,
            "opciones": opciones, "visual": visual, "pistas": pistas, "pregunta_error": error,
            "explicacion": f"La respuesta es: {respuesta}."}


# ---------- Pistas reutilizables (nunca dicen la respuesta) ----------

def _p_contar(obj):
    return [f"Toca cada {obj} con tu dedo mientras cuentas.",
            "Cuenta despacio: 1, 2, 3… sin saltarte ninguno.",
            "Cuenta primero la fila de arriba y luego sigue con la de abajo."]


def _p_suma(a, b, obj):
    return [f"¿Cuántas {obj} hay en cada grupo?",
            "Junta los dos grupos y cuenta todas.",
            f"Empieza en {a} y cuenta {b} más con tus dedos."]


def _p_resta(a, b, obj):
    return [f"¿Cuántos {obj} había al principio?",
            "Tapa con tu dedo los que ya se fueron.",
            "Cuenta los que quedan sin tachar."]


def _p_recta(a, b, op):
    return [f"Busca el {a} en la recta numérica.",
            "Para sumar avanza a la derecha; para restar regresa a la izquierda.",
            f"Da {b} saltitos desde el {a}. ¿En qué número caes?"]


_P_CARRERA = ["La meta está a la derecha: la trajinera más cerca de la meta llegó primero.",
              "Cuenta desde la meta: primero, segundo, tercero, cuarto.",
              "Señala la trajinera con tu dedo y di su lugar en voz alta."]
_P_FIGURA = ["Cuenta sus lados.",
             "¿Tiene esquinas o es redondo?",
             "Triángulo: 3 lados. Cuadrado: 4 lados iguales. Rectángulo: 4 lados, dos largos y dos cortos."]
_P_MEDIR = ["Empieza a contar desde la punta.",
            "Cuenta los cuadritos que tiene debajo, uno por uno.",
            "El último cuadrito que toca es tu respuesta."]
_P_MONEDAS = ["Cuenta lo que vale cada moneda, no cuántas monedas hay.",
              "Empieza por la moneda más grande.",
              "Suma de una en una: la grande, luego la que sigue, luego la siguiente."]
_P_GRAFICA = ["Busca la barra del color que te preguntan.",
              "Cuenta los cuadritos de esa barra de abajo hacia arriba.",
              "Si son dos colores, cuenta los de uno y luego sigue con los del otro."]
_P_DECENAS = ["Cada ramo tiene 10 flores.",
              "Cuenta los ramos de 10 en 10: 10, 20, 30…",
              "Después suma las flores sueltas, de una en una."]

_COLORES = {"roja": "rojo", "azul": "azul", "verde": "verde", "amarilla": "amarillo"}


def _carrera(orden):
    """orden: colores del 1.º al 4.º lugar."""
    return {"tipo": "carrera", "trajineras": [{"color": _COLORES[c], "nombre": c} for c in orden]}


_LUGARES = ["1.º lugar", "2.º lugar", "3.º lugar", "4.º lugar"]
_TRAJINERAS = ["La roja", "La azul", "La verde", "La amarilla"]
_FIGURAS = ["Triángulo", "Círculo", "Cuadrado", "Rectángulo"]
_GRAFICA = {"tipo": "grafica", "titulo": "Color favorito para pintar la trajinera", "barras": [
    {"etiqueta": "Rojo", "color": "rojo", "valor": 5}, {"etiqueta": "Azul", "color": "azul", "valor": 7},
    {"etiqueta": "Amarillo", "color": "amarillo", "valor": 3}, {"etiqueta": "Verde", "color": "verde", "valor": 4}]}


NIVELES = [
    ("Conteo hasta 10", "Flores en la trajinera", [
        _conteo("x1-n01-1", "Flores del arco", "La trajinera Lupita lleva flores en su arco. ¿Cuántas flores hay?", 6,
                {"tipo": "objetos", "objeto": "flor", "cantidad": 6}, _p_contar("flor"), "¿Contaste cada flor una sola vez? Vuelve a contar tocándolas."),
        _conteo("x1-n01-2", "La canasta de Doña Rosa", "Doña Rosa acomodó cempasúchiles en su canasta. ¿Cuántas flores hay?", 8,
                {"tipo": "objetos", "objeto": "flor", "cantidad": 8}, _p_contar("flor"), "¿Contaste cada flor una sola vez? Vuelve a contar tocándolas."),
        _conteo("x1-n01-3", "Flores en la proa", "¡Mira cuántas flores hay en la proa! Cuéntalas todas.", 10,
                {"tipo": "objetos", "objeto": "flor", "cantidad": 10}, _p_contar("flor"), "¿Contaste las dos filas? Vuelve a contar tocándolas."),
    ]),
    ("Números hasta el 20", "Peces en el canal", [
        _conteo("x1-n02-1", "Un banco de peces", "Un banco de peces nada junto a la chinampa. ¿Cuántos peces hay?", 13,
                {"tipo": "objetos", "objeto": "pez", "cantidad": 13}, _p_contar("pez"), "Cuenta la primera fila completa (son 10) y sigue contando desde ahí."),
        _conteo("x1-n02-2", "Peces bajo el puente", "Debajo del puente se juntaron muchos peces. ¿Cuántos son?", 17,
                {"tipo": "objetos", "objeto": "pez", "cantidad": 17}, _p_contar("pez"), "La primera fila tiene 10. ¿Cuántos más hay en la segunda?"),
        _conteo("x1-n02-3", "¿Qué número sigue?", "Los peces llevan números en la espalda. ¿Qué número le toca al último pez?", 18,
                {"tipo": "serie", "objeto": "pez", "numeros": [15, 16, 17, None]},
                ["Lee los números en voz alta.", "Cada número es uno más que el anterior.", "¿Qué número dices después del 17 cuando cuentas?"],
                "¿Qué número va justo después del 17?"),
    ]),
    ("Comparación", "Más o menos pasajeros", [
        _opcion("x1-n03-1", "¿Cuál lleva más?", "Dos trajineras salen del embarcadero. ¿Cuál lleva MÁS pasajeros?", ["La roja", "La azul"], "La roja",
                {"tipo": "comparar", "grupos": [{"color": "rojo", "etiqueta": "La roja", "cantidad": 6}, {"color": "azul", "etiqueta": "La azul", "cantidad": 4}]},
                ["Cuenta los pasajeros de cada trajinera.", "Junta un pasajero de una con uno de la otra.", "La que tiene pasajeros sin pareja lleva más."],
                "Cuenta otra vez los pasajeros de cada una. ¿Cuál tiene más?"),
        _opcion("x1-n03-2", "¿Cuál lleva menos?", "Ahora llegan otras dos trajineras. ¿Cuál lleva MENOS pasajeros?", ["La verde", "La amarilla"], "La verde",
                {"tipo": "comparar", "grupos": [{"color": "verde", "etiqueta": "La verde", "cantidad": 7}, {"color": "amarillo", "etiqueta": "La amarilla", "cantidad": 9}]},
                ["Cuenta los pasajeros de cada trajinera.", "Junta un pasajero de una con uno de la otra.", "La que se queda sin pareja primero lleva menos."],
                "Menos es la que tiene el número más chico. Cuenta otra vez."),
        _conteo("x1-n03-3", "¿Cuántos más?", "La trajinera azul lleva 8 pasajeros y la roja lleva 5. ¿Cuántos pasajeros MÁS lleva la azul?", 3,
                {"tipo": "comparar", "grupos": [{"color": "azul", "etiqueta": "La azul", "cantidad": 8}, {"color": "rojo", "etiqueta": "La roja", "cantidad": 5}]},
                ["Pon en pareja un pasajero de la azul con uno de la roja.", "Fíjate en los pasajeros de la azul que se quedaron sin pareja.", "Cuenta solo los que no tienen pareja."],
                "Cuenta solo los pasajeros de la azul que se quedan sin pareja."),
    ]),
    ("Ordinales", "Carrera de trajineras", [
        _opcion("x1-n04-1", "La trajinera azul", "¡Carrera en el canal! ¿En qué lugar llegó la trajinera azul?", _LUGARES, "2.º lugar",
                _carrera(["verde", "azul", "roja", "amarilla"]), _P_CARRERA, "Cuenta desde la meta: primero, segundo… ¿dónde está la azul?"),
        _opcion("x1-n04-2", "¿Quién llegó en tercer lugar?", "En la misma carrera, ¿qué trajinera llegó en TERCER lugar?", _TRAJINERAS, "La roja",
                _carrera(["verde", "azul", "roja", "amarilla"]), _P_CARRERA, "Cuenta tres trajineras desde la meta."),
        _opcion("x1-n04-3", "Revancha", "Hubo revancha y cambió el orden. ¿En qué lugar llegó la trajinera verde?", _LUGARES, "3.º lugar",
                _carrera(["amarilla", "roja", "verde", "azul"]), _P_CARRERA, "Cuenta desde la meta: primero, segundo… ¿dónde está la verde?"),
    ]),
    ("Suma con objetos", "Juntar flores", [
        _cuenta("x1-n05-1", "Flores para el arco", "Ana tiene 4 flores y su hermano le da 3 más. ¿Cuántas flores tienen juntas?", 4, "+", 3,
                {"tipo": "grupos", "objeto": "flor", "grupos": [4, 3]}, _p_suma(4, 3, "flores")),
        _cuenta("x1-n05-2", "La chinampa florece", "En la chinampa salieron 6 flores el lunes y 2 el martes. ¿Cuántas flores hay?", 6, "+", 2,
                {"tipo": "grupos", "objeto": "flor", "grupos": [6, 2]}, _p_suma(6, 2, "flores")),
        _cuenta("x1-n05-3", "Dos canastas", "Doña Rosa junta dos canastas con 5 flores cada una. ¿Cuántas flores tiene?", 5, "+", 5,
                {"tipo": "grupos", "objeto": "flor", "grupos": [5, 5]}, _p_suma(5, 5, "flores")),
    ]),
    ("Resta con objetos", "Vender recuerdos", [
        _cuenta("x1-n06-1", "Sombreritos de recuerdo", "Don Pepe tenía 7 sombreritos de recuerdo y vendió 2. ¿Cuántos le quedan?", 7, "−", 2,
                {"tipo": "quitar", "objeto": "sombrerito", "total": 7, "quitar": 2}, _p_resta(7, 2, "sombreritos")),
        _cuenta("x1-n06-2", "Jarritos de barro", "En el puesto había 9 jarritos y se vendieron 4. ¿Cuántos jarritos quedan?", 9, "−", 4,
                {"tipo": "quitar", "objeto": "jarrito", "total": 9, "quitar": 4}, _p_resta(9, 4, "jarritos")),
        _cuenta("x1-n06-3", "Últimos recuerdos", "Quedaban 8 sombreritos y una familia compró 5. ¿Cuántos sombreritos quedan?", 8, "−", 5,
                {"tipo": "quitar", "objeto": "sombrerito", "total": 8, "quitar": 5}, _p_resta(8, 5, "sombreritos")),
    ]),
    ("Suma y resta hasta 10", "Saltos en el embarcadero", [
        _cuenta("x1-n07-1", "Ajolotes que llegan", "En la chinampa hay 6 ajolotes y llegan 3 más. ¿Cuántos ajolotes hay?", 6, "+", 3,
                {"tipo": "recta", "hasta": 10, "inicio": 6}, _p_recta(6, 3, "+")),
        _cuenta("x1-n07-2", "Tamales para el camino", "El remero llevaba 10 tamales y regaló 4. ¿Cuántos tamales le quedan?", 10, "−", 4,
                {"tipo": "recta", "hasta": 10, "inicio": 10}, _p_recta(10, 4, "−")),
        _cuenta("x1-n07-3", "Remadas", "La trajinera avanzó 2 remadas y luego 7 más. ¿Cuántas remadas dio en total?", 2, "+", 7,
                {"tipo": "recta", "hasta": 10, "inicio": 2}, _p_recta(2, 7, "+")),
    ]),
    ("Figuras geométricas", "Formas de la trajinera", [
        _opcion("x1-n08-1", "El banderín", "Este banderín de papel picado adorna la trajinera. ¿Qué figura tiene?", _FIGURAS, "Triángulo",
                {"tipo": "figura", "figura": "triangulo", "donde": "banderin"}, _P_FIGURA, "Cuenta sus lados con tu dedo. ¿Cuántos tiene?"),
        _opcion("x1-n08-2", "La flor pintada", "En el arco de la trajinera pintaron una flor redonda. ¿Qué figura tiene su centro?", _FIGURAS, "Círculo",
                {"tipo": "figura", "figura": "circulo", "donde": "flor"}, _P_FIGURA, "¿Tiene esquinas o es redondo?"),
        _opcion("x1-n08-3", "El letrero", "El letrero con el nombre de la trajinera tiene dos lados largos y dos cortos. ¿Qué figura es?", _FIGURAS, "Rectángulo",
                {"tipo": "figura", "figura": "rectangulo", "donde": "letrero"}, _P_FIGURA, "¿Sus 4 lados miden lo mismo, o hay largos y cortos?"),
    ]),
    ("Medición", "Medir el remo", [
        _conteo("x1-n09-1", "El remo", "¿Cuántos cuadritos mide el remo?", 6,
                {"tipo": "medir", "objetos": [{"objeto": "remo", "largo": 6}]}, _P_MEDIR, "Cuenta solo los cuadritos que están debajo del remo."),
        _conteo("x1-n09-2", "La garrocha", "El trajinero usa una garrocha larga para empujar la trajinera. ¿Cuántos cuadritos mide?", 9,
                {"tipo": "medir", "objetos": [{"objeto": "garrocha", "largo": 9}]}, _P_MEDIR, "Cuenta solo los cuadritos que están debajo de la garrocha."),
        _opcion("x1-n09-3", "¿Cuál es más largo?", "¿Cuál remo es MÁS largo?", ["El remo A", "El remo B"], "El remo B",
                {"tipo": "medir", "objetos": [{"objeto": "remo", "largo": 5, "etiqueta": "Remo A"}, {"objeto": "remo", "largo": 7, "etiqueta": "Remo B"}]},
                _P_MEDIR, "Mide cada remo en cuadritos. ¿Cuál tiene más?"),
    ]),
    ("Monedas", "Comprar en el embarcadero", [
        _conteo("x1-n10-1", "Para un elote", "Juntaste estas monedas para comprar un elote. ¿Cuánto dinero tienes?", 8,
                {"tipo": "monedas", "monedas": [5, 2, 1]}, _P_MONEDAS, "Empieza por la de $5 y súmale las otras.", moneda=True),
        _conteo("x1-n10-2", "Una nieve de garrafa", "Para la nieve de garrafa juntaste estas monedas. ¿Cuánto dinero tienes?", 14,
                {"tipo": "monedas", "monedas": [10, 2, 2]}, _P_MONEDAS, "Empieza por la de $10 y súmale las de $2.", moneda=True),
        _conteo("x1-n10-3", "Un paseo en trajinera", "Tu familia junta estas monedas para el paseo. ¿Cuánto dinero tienen?", 17,
                {"tipo": "monedas", "monedas": [10, 5, 1, 1]}, _P_MONEDAS, "Empieza por la de $10, luego la de $5 y al final las de $1.", moneda=True),
    ]),
    ("Gráficas", "Colores favoritos", [
        _conteo("x1-n11-1", "El amarillo", "Los niños votaron por el color para pintar la trajinera. ¿Cuántos niños eligieron el AMARILLO?", 3,
                _GRAFICA, _P_GRAFICA, "Cuenta solo los cuadritos de la barra amarilla."),
        _opcion("x1-n11-2", "El favorito", "Mirando la gráfica, ¿qué color le gustó a MÁS niños?", ["Rojo", "Azul", "Amarillo", "Verde"], "Azul",
                _GRAFICA, ["Busca la barra más alta.", "Cuenta los cuadritos de cada barra.", "La barra con más cuadritos es la favorita."],
                "¿Cuál barra es la más alta?"),
        _conteo("x1-n11-3", "Rojo y verde", "¿Cuántos niños eligieron ROJO o VERDE? Júntalos.", 9,
                _GRAFICA, _P_GRAFICA, "Cuenta los de la barra roja y sigue contando con los de la verde."),
    ]),
    ("Números hasta el 100", "Las flores del canal", [
        _conteo("x1-n12-1", "Ramos y flores", "En el mercado de flores hay ramos de 10 y flores sueltas. ¿Cuántas flores hay en total?", 34,
                {"tipo": "decenas", "ramos": 3, "sueltas": 4}, _P_DECENAS, "Cuenta los ramos de 10 en 10 y luego las sueltas."),
        _conteo("x1-n12-2", "Solo ramos", "Doña Rosa armó estos ramos de 10 flores. ¿Cuántas flores son?", 50,
                {"tipo": "decenas", "ramos": 5, "sueltas": 0}, _P_DECENAS, "Cuenta los ramos de 10 en 10."),
        _conteo("x1-n12-3", "¡Muchas flores!", "Para la fiesta del canal juntaron todas estas flores. ¿Cuántas hay?", 78,
                {"tipo": "decenas", "ramos": 7, "sueltas": 8}, _P_DECENAS, "Primero los ramos de 10 en 10; después las sueltas de una en una."),
    ]),
]

LECCION = {
    "id": LECCION_ID,
    "nombre": "El Canal de los Números",
    "concepto": "Números, conteo y primeras cuentas (1.º)",
    "sticker": "flor",
    "entrada": "¡Sube a la trajinera, explorador! En el canal de Xochimilco los números flotan entre chinampas.",
    "tema": TEMA,
}


def ejercicios() -> list[dict]:
    """Los 36 ejercicios en orden, cada uno con su nivel (1 a 12) y el título de la chinampa."""
    salida = []
    for n, (tema, titulo, lista) in enumerate(NIVELES, start=1):
        assert len(lista) == 3, f"El nivel {n} debe tener 3 ejercicios"
        for e in lista:
            salida.append({**e, "nivel": n, "nivel_tema": tema, "nivel_titulo": titulo})
    return salida


# ---------- Examen general del canal (al final de los 12 niveles) ----------
# Una pregunta por nivel, con números nuevos. Al terminarlo: certificado + 2 trajes de subculturas.
# Hasta 3 intentos por pregunta y se pueden pedir pistas; si falla los 3, queda "por reforzar" y sigue.

_GRAFICA_EXAMEN = {"tipo": "grafica", "titulo": "Fruta favorita en el embarcadero", "barras": [
    {"etiqueta": "Rojo", "color": "rojo", "valor": 4}, {"etiqueta": "Azul", "color": "azul", "valor": 6},
    {"etiqueta": "Amarillo", "color": "amarillo", "valor": 2}, {"etiqueta": "Verde", "color": "verde", "valor": 5}]}

EXAMEN = [
    _conteo("x1-ex-01", "Flores para la fiesta", "¿Cuántas flores hay en la trajinera?", 9,
            {"tipo": "objetos", "objeto": "flor", "cantidad": 9}, _p_contar("flor"), "Toca cada flor con tu dedo y vuelve a contar."),
    _conteo("x1-ex-02", "Peces del embarcadero", "¿Cuántos peces nadan junto al embarcadero?", 15,
            {"tipo": "objetos", "objeto": "pez", "cantidad": 15}, _p_contar("pez"), "La primera fila tiene 10. Sigue contando desde ahí."),
    _opcion("x1-ex-03", "¿Cuál lleva más?", "¿Qué trajinera lleva MÁS pasajeros?", ["La roja", "La azul"], "La azul",
            {"tipo": "comparar", "grupos": [{"color": "rojo", "etiqueta": "La roja", "cantidad": 5}, {"color": "azul", "etiqueta": "La azul", "cantidad": 8}]},
            ["Cuenta los pasajeros de cada trajinera.", "Junta un pasajero de una con uno de la otra.", "La que tiene pasajeros sin pareja lleva más."],
            "Cuenta otra vez los pasajeros de cada una."),
    _opcion("x1-ex-04", "La gran carrera", "¿En qué lugar llegó la trajinera verde?", _LUGARES, "4.º lugar",
            _carrera(["roja", "amarilla", "azul", "verde"]), _P_CARRERA, "Cuenta desde la meta hasta llegar a la verde."),
    _cuenta("x1-ex-05", "Juntar flores", "Lupe tiene 3 flores y Toño le regala 5. ¿Cuántas flores tiene Lupe?", 3, "+", 5,
            {"tipo": "grupos", "objeto": "flor", "grupos": [3, 5]}, _p_suma(3, 5, "flores")),
    _cuenta("x1-ex-06", "Jarritos vendidos", "Había 9 jarritos y se vendieron 3. ¿Cuántos jarritos quedan?", 9, "−", 3,
            {"tipo": "quitar", "objeto": "jarrito", "total": 9, "quitar": 3}, _p_resta(9, 3, "jarritos")),
    _cuenta("x1-ex-07", "Saltos en la recta", "La trajinera estaba en el 7 y avanzó 3 lugares. ¿A qué número llegó?", 7, "+", 3,
            {"tipo": "recta", "hasta": 10, "inicio": 7}, _p_recta(7, 3, "+")),
    _opcion("x1-ex-08", "La ventana", "La ventana de la casita de la chinampa tiene 4 lados iguales. ¿Qué figura es?", _FIGURAS, "Cuadrado",
            {"tipo": "figura", "figura": "cuadrado", "donde": "ventana"}, _P_FIGURA, "¿Sus 4 lados miden lo mismo?"),
    _conteo("x1-ex-09", "Medir el remo", "¿Cuántos cuadritos mide el remo?", 8,
            {"tipo": "medir", "objetos": [{"objeto": "remo", "largo": 8}]}, _P_MEDIR, "Cuenta solo los cuadritos que están debajo del remo."),
    _conteo("x1-ex-10", "Monedas para el elote", "¿Cuánto dinero hay en estas monedas?", 13,
            {"tipo": "monedas", "monedas": [5, 5, 2, 1]}, _P_MONEDAS, "Empieza por las de $5 y luego suma las demás.", moneda=True),
    _conteo("x1-ex-11", "La gráfica", "¿Cuántos niños eligieron el color VERDE?", 5,
            _GRAFICA_EXAMEN, _P_GRAFICA, "Cuenta solo los cuadritos de la barra verde."),
    _conteo("x1-ex-12", "Ramos del mercado", "¿Cuántas flores hay en total?", 62,
            {"tipo": "decenas", "ramos": 6, "sueltas": 2}, _P_DECENAS, "Cuenta los ramos de 10 en 10 y luego las sueltas."),
]


def examen() -> list[dict]:
    """Las 12 preguntas del examen con el nivel (tema) al que pertenece cada una."""
    return [{**p, "nivel": n, "nivel_tema": NIVELES[n - 1][0]} for n, p in enumerate(EXAMEN, start=1)]
