"""Mundo 2: El Centro de los Números (2.º de primaria), inspirado en el Centro de la CDMX.

12 niveles (en el mapa, cada uno es un transporte de la tarjeta de movilidad integrada) con 3 ejercicios
cada uno; cada ejercicio resuelto encuentra un cacomixtle. Termina con un examen general (como el canal).
Todo está en BORRADOR: falta la revisión pedagógica de la maestra o el maestro. Texto propio (no de la SEP).

Cada nivel lleva su fase del método CPA (`fase_cpa`, en el frontend `faseCPA`):
- concreto  (niveles 1 a 4): objetos que se pueden contar (personas, boletos, vagones).
- pictórico (niveles 5 a 8): dibujos y esquemas (recta numérica, tabla de valor, bloques, grupos).
- abstracto (niveles 9 a 12): solo números y símbolos (algoritmo, signos, tablas).
"""
from __future__ import annotations

from .contenido_canal import _conteo, _cuenta, _opcion

TEMA = "cdmx"
LECCION_ID = "c2"

CONCRETO, PICTORICO, ABSTRACTO = "concreto", "pictórico", "abstracto"


# ---------- Pistas reutilizables (nunca dicen la respuesta) ----------

def _p_pictograma(valor):
    return [f"Busca la fila que te preguntan.",
            f"Cada dibujo vale {valor}. Cuenta de {valor} en {valor}.",
            f"Cuenta los dibujos de esa fila y di: {valor}, {valor * 2}, {valor * 3}…"]


_P_PAQUETES = ["Cada caja tiene 100 boletos y cada tira tiene 10.",
               "Cuenta las cajas de 100 en 100, luego las tiras de 10 en 10.",
               "Al final suma los boletos sueltos, de uno en uno."]
_P_VALOR = ["Mira en qué lugar está el número: derecha, en medio o izquierda.",
            "A la derecha van las unidades, en medio las decenas y a la izquierda las centenas.",
            "¿Cuántas tiras de 10 hay en el dibujo?"]
_P_COMPARAR = ["Compara primero las centenas (las cajas de 100).",
               "Si las centenas son iguales, compara las decenas; si también, las unidades.",
               "El signo abre la boca hacia el número más grande."]
_P_SERIE = ["Lee los números en voz alta.",
            "Fíjate cuánto cambia de un vagón al siguiente.",
            "¿Va hacia adelante (suma) o hacia atrás (resta)?"]


def _p_recta(a, b, op):
    return [f"Busca el {a} en la recta.",
            "Para sumar avanza a la derecha; para restar regresa a la izquierda.",
            f"Da saltos desde el {a} hasta completar {b}. Si puedes, salta de 10 en 10."]


def _p_algoritmo(op):
    if op == "+":
        return ["Acomoda los números: unidades con unidades y decenas con decenas.",
                "Empieza por las unidades, a la derecha.",
                "Si las unidades pasan de 9, llevas 1 decena a la columna de las decenas."]
    return ["Acomoda los números: unidades con unidades y decenas con decenas.",
            "Empieza por las unidades, a la derecha.",
            "Si arriba hay menos unidades que abajo, pide prestada 1 decena (son 10 unidades más)."]


_P_BLOQUES = ["Cada placa grande vale 100, cada barra vale 10 y cada cubito vale 1.",
              "Cuenta cuántas placas, barras y cubitos hay.",
              "Escribe las centenas, luego las decenas y al final las unidades."]


def _p_grupos(a, b):
    return [f"¿Cuántas bolsitas hay y cuántos dulces tiene cada una?",
            f"Suma los dulces de cada bolsita: {' + '.join([str(b)] * a)}.",
            f"Eso es lo mismo que {a} × {b}: {a} grupos de {b}."]


def _p_reparto(a, b):
    return [f"¿Cuántos hay y entre cuántos se reparten?",
            "Reparte uno a cada quien, luego otro, hasta que se acaben.",
            f"¿Qué número por {b} da {a}?"]


_P_POLIGONO = ["Cuenta los lados con tu dedo, sin repetir ninguno.",
               "Tres lados: triángulo. Cuatro: cuadrilátero.",
               "Cinco lados: pentágono. Seis: hexágono."]
_P_MEDIDA = ["Lee bien qué te preguntan: ¿juntar, o cuánto más?",
             "Si es juntar, suma. Si es cuánto más, resta el chico al grande.",
             "No olvides la unidad: kilos, centímetros o cuartas."]
_P_TABLA = ["Busca el renglón que te preguntan.",
            "Lee el número de la columna de al lado.",
            "Si comparas, fíjate cuál número es más grande o más chico."]
_P_RELOJ = ["La manecilla corta marca la hora.",
            "La manecilla larga marca los minutos: si apunta al 12, es en punto.",
            "¿A qué número apunta la manecilla corta?"]


# ---------- Visuales que se repiten ----------

def _paq(c, d, u, etiqueta=None):
    return {"centenas": c, "decenas": d, "unidades": u, **({"etiqueta": etiqueta} if etiqueta else {})}


_PICTO_ZOCALO = {"tipo": "pictograma", "titulo": "Visitantes del Zócalo", "icono": "persona", "valor": 10,
                 "filas": [{"etiqueta": "Lunes", "cantidad": 4}, {"etiqueta": "Martes", "cantidad": 6}, {"etiqueta": "Miércoles", "cantidad": 3}]}
_PICTO_VIAJES = {"tipo": "pictograma", "titulo": "Viajes de la mañana", "icono": "boleto", "valor": 100,
                 "filas": [{"etiqueta": "Metro", "cantidad": 5}, {"etiqueta": "Metrobús", "cantidad": 3}, {"etiqueta": "Trolebús", "cantidad": 2}]}
_SIGNOS = ["<", ">", "="]
_POLIGONOS = ["Triángulo", "Cuadrilátero", "Pentágono", "Hexágono"]
_TABLA_LLUVIA = {"tipo": "tabla", "titulo": "Días de lluvia en Chapultepec", "columnas": ["Mes", "Días con lluvia"],
                 "filas": [["Junio", "8"], ["Julio", "12"], ["Agosto", "10"]]}


def _comparar(izq, der):
    return {"tipo": "comparar_paquetes", "izquierda": izq, "derecha": der}


NIVELES = [
    # ---------------- Concreto ----------------
    ("Conteo hasta 1000 y pictogramas", "El Censo del Zócalo", CONCRETO, [
        _conteo("c2-n01-1", "Visitantes del martes", "En el pictograma, cada persona dibujada representa 10 visitantes del Zócalo. ¿Cuántos visitantes llegaron el martes?", 60,
                _PICTO_ZOCALO, _p_pictograma(10), "Cuenta solo la fila del martes, de 10 en 10."),
        _conteo("c2-n01-2", "Viajes en Metro", "Cada boleto dibujado vale 100 viajes. ¿Cuántos viajes hizo el Metro en la mañana?", 500,
                _PICTO_VIAJES, _p_pictograma(100), "Cuenta los boletos de la fila del Metro de 100 en 100."),
        _opcion("c2-n01-3", "El día con más gente", "Mirando el pictograma del Zócalo, ¿qué día llegaron MÁS visitantes?", ["Lunes", "Martes", "Miércoles"], "Martes",
                _PICTO_ZOCALO, ["Compara qué fila es la más larga.", "Cuenta los dibujos de cada fila.", "La fila con más dibujos tiene más visitantes."],
                "¿Qué fila tiene más personas dibujadas?"),
    ]),
    ("Unidades, decenas y centenas", "La Taquilla del Metro", CONCRETO, [
        _conteo("c2-n02-1", "Boletos en la taquilla", "En la taquilla hay cajas de 100 boletos, tiras de 10 y boletos sueltos. ¿Cuántos boletos hay?", 235,
                {"tipo": "paquetes", **_paq(2, 3, 5)}, _P_PAQUETES, "Cuenta las cajas de 100 en 100, las tiras de 10 en 10 y luego los sueltos."),
        _conteo("c2-n02-2", "Sin tiras", "Hoy no hay tiras de 10, solo cajas y boletos sueltos. ¿Cuántos boletos hay?", 407,
                {"tipo": "paquetes", **_paq(4, 0, 7)}, _P_PAQUETES, "Si no hay tiras, en las decenas va un 0."),
        _opcion("c2-n02-3", "¿Qué vale el 8?", "En el número 386, ¿qué vale el 8?", ["8 unidades", "8 decenas", "8 centenas"], "8 decenas",
                {"tipo": "paquetes", **_paq(3, 8, 6)}, _P_VALOR, "El 8 está en medio. ¿Qué lugar es el de en medio?"),
    ]),
    ("Comparar con <, > y =", "El Duelo de las Estaciones", CONCRETO, [
        _opcion("c2-n03-1", "Pino Suárez contra Bellas Artes", "Por Pino Suárez pasaron 142 pasajeros y por Bellas Artes 129. ¿Qué signo va en 142 __ 129?", _SIGNOS, ">",
                _comparar(_paq(1, 4, 2, "Pino Suárez"), _paq(1, 2, 9, "Bellas Artes")), _P_COMPARAR, "Las centenas son iguales. Compara las decenas."),
        _opcion("c2-n03-2", "Zócalo contra Allende", "En Zócalo se vendieron 305 boletos y en Allende 350. ¿Qué signo va en 305 __ 350?", _SIGNOS, "<",
                _comparar(_paq(3, 0, 5, "Zócalo"), _paq(3, 5, 0, "Allende")), _P_COMPARAR, "¿Cuál tiene más tiras de 10?"),
        _opcion("c2-n03-3", "Empate", "Por Hidalgo pasaron 260 pasajeros y por Juárez también 260. ¿Qué signo va en 260 __ 260?", _SIGNOS, "=",
                _comparar(_paq(2, 6, 0, "Hidalgo"), _paq(2, 6, 0, "Juárez")), _P_COMPARAR, "¿Hay alguna diferencia entre los dos números?"),
    ]),
    ("Serie numérica hasta 1000", "Los Vagones Numerados", CONCRETO, [
        _conteo("c2-n04-1", "El último vagón", "Los vagones del Metro van numerados en orden. ¿Qué número le toca al último?", 1000,
                {"tipo": "vagones", "numeros": [997, 998, 999, None]}, _P_SERIE, "¿Qué número sigue después del 999?"),
        _conteo("c2-n04-2", "Hacia atrás", "Ahora el tren va en reversa y los números bajan. ¿Qué número sigue?", 601,
                {"tipo": "vagones", "numeros": [604, 603, 602, None]}, _P_SERIE, "Los números van bajando de 1 en 1."),
        _conteo("c2-n04-3", "De 10 en 10", "En esta línea los vagones van de 10 en 10. ¿Qué número sigue?", 400,
                {"tipo": "vagones", "numeros": [370, 380, 390, None]}, _P_SERIE, "Cada vagón tiene 10 más que el anterior."),
    ]),
    # ---------------- Pictórico ----------------
    ("Suma y resta en la recta numérica", "La Ruta del Metrobús", PICTORICO, [
        _cuenta("c2-n05-1", "Avanzar paradas", "El Metrobús está en la parada 30 y avanza 20 paradas. ¿A qué parada llega?", 30, "+", 20,
                {"tipo": "recta", "desde": 0, "hasta": 100, "paso": 10, "inicio": 30}, _p_recta(30, 20, "+")),
        _cuenta("c2-n05-2", "Regresar paradas", "Ahora está en la parada 70 y regresa 30 paradas. ¿A qué parada llega?", 70, "−", 30,
                {"tipo": "recta", "desde": 0, "hasta": 100, "paso": 10, "inicio": 70}, _p_recta(70, 30, "−")),
        _cuenta("c2-n05-3", "Pasitos cortos", "El Metrobús está en la parada 45 y avanza 8. ¿A qué parada llega?", 45, "+", 8,
                {"tipo": "recta", "desde": 40, "hasta": 60, "paso": 1, "etiquetas": 5, "inicio": 45}, _p_recta(45, 8, "+")),
    ]),
    ("Suma y resta de dos cifras", "Los Antojitos de Coyoacán", PICTORICO, [
        _cuenta("c2-n06-1", "Esquites y agua", "En Coyoacán, un esquite cuesta 34 pesos y un agua 25 pesos. ¿Cuántos pesos pagas por los dos?", 34, "+", 25,
                {"tipo": "tabla_valor", "filas": [34, 25], "op": "+"}, _p_algoritmo("+")),
        _cuenta("c2-n06-2", "Churros y chocolate", "Unos churros cuestan 47 pesos y un chocolate 36. ¿Cuánto pagas en total?", 47, "+", 36,
                {"tipo": "tabla_valor", "filas": [47, 36], "op": "+"}, _p_algoritmo("+")),
        _cuenta("c2-n06-3", "El cambio", "Llevabas 65 pesos y gastaste 28 en un helado. ¿Cuántos pesos te quedan?", 65, "−", 28,
                {"tipo": "tabla_valor", "filas": [65, 28], "op": "−"}, _p_algoritmo("−")),
    ]),
    ("Descomponer cantidades", "El Tesoro de Palacio Nacional", PICTORICO, [
        _conteo("c2-n07-1", "Contar el tesoro", "Un guía de Palacio Nacional acomodó el tesoro en bloques. ¿Qué número forman?", 345,
                {"tipo": "bloques", **_paq(3, 4, 5)}, _P_BLOQUES, "Cuenta: placas de 100, barras de 10 y cubitos de 1."),
        _opcion("c2-n07-2", "Partir en pedazos", "¿Cómo se descompone el número 562?", ["500 + 60 + 2", "500 + 6 + 2", "50 + 60 + 2"], "500 + 60 + 2",
                {"tipo": "bloques", **_paq(5, 6, 2)}, _P_BLOQUES, "El 6 está en las decenas: ¿vale 6 o vale 60?"),
        _conteo("c2-n07-3", "Sin barras", "En el cofre hay 7 placas de 100 y 9 cubitos, y ninguna barra. ¿Qué número es?", 709,
                {"tipo": "bloques", **_paq(7, 0, 9)}, _P_BLOQUES, "Si no hay barras, en las decenas va un 0."),
    ]),
    ("Multiplicación como suma repetida", "Las Bolsitas del Centro", PICTORICO, [
        _cuenta("c2-n08-1", "Bolsitas de dulces", "En la Alameda venden bolsitas con 4 dulces cada una. Compras 3 bolsitas. ¿Cuántos dulces tienes?", 3, "×", 4,
                {"tipo": "grupos_iguales", "grupos": 3, "cada": 4, "objeto": "dulce"}, _p_grupos(3, 4)),
        _cuenta("c2-n08-2", "Pares de elotes", "Hay 5 platos con 2 elotes cada uno. ¿Cuántos elotes hay?", 5, "×", 2,
                {"tipo": "grupos_iguales", "grupos": 5, "cada": 2, "objeto": "elote"}, _p_grupos(5, 2)),
        _cuenta("c2-n08-3", "Globos del Zócalo", "Un globero tiene 4 ramos con 5 globos cada uno. ¿Cuántos globos tiene?", 4, "×", 5,
                {"tipo": "grupos_iguales", "grupos": 4, "cada": 5, "objeto": "globo"}, _p_grupos(4, 5)),
    ]),
    # ---------------- Abstracto ----------------
    ("Introducción a la división", "Repartiendo Tamales", ABSTRACTO, [
        _cuenta("c2-n09-1", "Tamales para tres", "Doña Lupe reparte 12 tamales entre 3 amigos en partes iguales. ¿Cuántos le tocan a cada uno?", 12, "÷", 3,
                None, _p_reparto(12, 3)),
        _cuenta("c2-n09-2", "Dos hermanos", "Hay 10 tamales para 2 hermanos, en partes iguales. ¿Cuántos le tocan a cada uno?", 10, "÷", 2,
                None, _p_reparto(10, 2)),
        _cuenta("c2-n09-3", "Cinco platos", "Se reparten 15 tamales en 5 platos iguales. ¿Cuántos tamales van en cada plato?", 15, "÷", 5,
                None, _p_reparto(15, 5)),
    ]),
    ("Polígonos por número de lados", "El Tangram de Bellas Artes", ABSTRACTO, [
        _opcion("c2-n10-1", "La pieza del vitral", "Esta pieza del vitral de Bellas Artes tiene 5 lados. ¿Cómo se llama?", _POLIGONOS, "Pentágono",
                {"tipo": "poligono", "lados": 5}, _P_POLIGONO, "¿Cómo se llama una figura de 5 lados?"),
        _conteo("c2-n10-2", "Contar lados", "¿Cuántos lados tiene esta figura del tangram?", 6,
                {"tipo": "poligono", "lados": 6}, _P_POLIGONO, "Cuenta los lados con tu dedo, sin repetir."),
        _opcion("c2-n10-3", "La ventana", "La ventana del teatro tiene 4 lados. ¿Cómo se llama esa figura?", _POLIGONOS, "Cuadrilátero",
                {"tipo": "poligono", "lados": 4}, _P_POLIGONO, "Una figura de 4 lados es un…"),
    ]),
    ("Longitud y peso", "La Balanza de San Juan", ABSTRACTO, [
        _conteo("c2-n11-1", "Kilos de semillas", "En el Mercado de San Juan, la bolsa de frijol pesa 2 kg y la de arroz 3 kg. ¿Cuántos kilos pesan juntas?", 5,
                {"tipo": "tabla", "titulo": "Lo que pesa cada bolsa", "columnas": ["Producto", "Peso"], "filas": [["Frijol", "2 kg"], ["Arroz", "3 kg"]]},
                _P_MEDIDA, "Juntar es sumar los kilos."),
        _opcion("c2-n11-2", "Medir con cuartas", "La banca mide 6 cuartas y la mesa 4 cuartas. ¿Cuál es más larga?", ["La banca", "La mesa"], "La banca",
                {"tipo": "tabla", "titulo": "Medidas en cuartas", "columnas": ["Objeto", "Mide"], "filas": [["Banca", "6 cuartas"], ["Mesa", "4 cuartas"]]},
                _P_MEDIDA, "¿Cuál tiene más cuartas?"),
        _conteo("c2-n11-3", "Las cuerdas", "Una cuerda mide 50 cm y otra 30 cm. ¿Cuántos centímetros más mide la primera?", 20,
                {"tipo": "tabla", "titulo": "Largo de las cuerdas", "columnas": ["Cuerda", "Mide"], "filas": [["Primera", "50 cm"], ["Segunda", "30 cm"]]},
                _P_MEDIDA, "¿Cuánto más es una resta: el largo menos el corto."),
    ]),
    ("Tablas, datos y la hora", "El Calendario de Chapultepec", ABSTRACTO, [
        _conteo("c2-n12-1", "Lluvia en julio", "La tabla dice cuántos días llovió en Chapultepec. ¿Cuántos días llovió en julio?", 12,
                _TABLA_LLUVIA, _P_TABLA, "Busca el renglón de julio."),
        _opcion("c2-n12-2", "El mes más seco", "Según la tabla, ¿en qué mes llovió MENOS?", ["Junio", "Julio", "Agosto"], "Junio",
                _TABLA_LLUVIA, _P_TABLA, "Busca el número más chico de la tabla."),
        _opcion("c2-n12-3", "Paseo en lancha", "El paseo en lancha del lago empieza a la hora que marca el reloj. ¿Qué hora es?", ["3:00", "12:15", "9:00"], "3:00",
                {"tipo": "reloj", "hora": 3, "minutos": 0}, _P_RELOJ, "Mira a qué número apunta la manecilla corta."),
    ]),
]

LECCION = {
    "id": LECCION_ID,
    "nombre": "El Centro de los Números",
    "concepto": "Números hasta el 1000, operaciones y medida (2.º)",
    "sticker": "tarjeta",  # sticker de la Tarjeta del Metro (tarjeta de movilidad integrada)
    "entrada": "¡Bienvenido al Centro, pasajero! Con tu tarjeta de movilidad vamos a recorrer la ciudad, estación por estación.",
    "tema": TEMA,
}


# Premio del examen: en lugar de trajes de subculturas al azar, los 2 atuendos para irse a la FES Aragón
# (sudadera azul con patita dorada, tenis y audífonos; uno con gorra y pantalón, otro con cabello largo y falda).
PREMIO_TRAJES = ["fes-gorra", "fes-cabello"]


def ejercicios() -> list[dict]:
    """Los 36 ejercicios en orden, con su nivel (1 a 12), tema, título y fase CPA."""
    salida = []
    for n, (tema, titulo, fase, lista) in enumerate(NIVELES, start=1):
        assert len(lista) == 3, f"El nivel {n} debe tener 3 ejercicios"
        for e in lista:
            salida.append({**e, "nivel": n, "nivel_tema": tema, "nivel_titulo": titulo, "fase_cpa": fase})
    return salida


# ---------- Examen general (al final de los 12 niveles) ----------

EXAMEN = [
    _conteo("c2-ex-01", "Visitantes del sábado", "Cada persona dibujada vale 10 visitantes. ¿Cuántos visitantes llegaron el sábado?", 70,
            {"tipo": "pictograma", "titulo": "Visitantes del Zócalo", "icono": "persona", "valor": 10,
             "filas": [{"etiqueta": "Sábado", "cantidad": 7}, {"etiqueta": "Domingo", "cantidad": 5}]},
            _p_pictograma(10), "Cuenta solo la fila del sábado, de 10 en 10."),
    _conteo("c2-ex-02", "La taquilla", "¿Cuántos boletos hay en la taquilla?", 361,
            {"tipo": "paquetes", **_paq(3, 6, 1)}, _P_PAQUETES, "Cajas de 100, tiras de 10 y sueltos."),
    _opcion("c2-ex-03", "El duelo", "¿Qué signo va en 418 __ 481?", _SIGNOS, "<",
            _comparar(_paq(4, 1, 8, "418"), _paq(4, 8, 1, "481")), _P_COMPARAR, "Las centenas son iguales. Compara las decenas."),
    _conteo("c2-ex-04", "Vagones en reversa", "Los números bajan de 1 en 1. ¿Qué número sigue?", 797,
            {"tipo": "vagones", "numeros": [800, 799, 798, None]}, _P_SERIE, "Los números van bajando de 1 en 1."),
    _cuenta("c2-ex-05", "La ruta", "El Metrobús está en la parada 60 y avanza 30. ¿A qué parada llega?", 60, "+", 30,
            {"tipo": "recta", "desde": 0, "hasta": 100, "paso": 10, "inicio": 60}, _p_recta(60, 30, "+")),
    _cuenta("c2-ex-06", "Tacos y agua", "Unos tacos cuestan 56 pesos y un agua 27. ¿Cuánto pagas en total?", 56, "+", 27,
            {"tipo": "tabla_valor", "filas": [56, 27], "op": "+"}, _p_algoritmo("+")),
    _conteo("c2-ex-07", "El tesoro", "¿Qué número forman estos bloques?", 628,
            {"tipo": "bloques", **_paq(6, 2, 8)}, _P_BLOQUES, "Placas de 100, barras de 10 y cubitos de 1."),
    _cuenta("c2-ex-08", "Bolsitas", "Hay 2 bolsitas con 6 dulces cada una. ¿Cuántos dulces hay?", 2, "×", 6,
            {"tipo": "grupos_iguales", "grupos": 2, "cada": 6, "objeto": "dulce"}, _p_grupos(2, 6)),
    _cuenta("c2-ex-09", "Repartir tamales", "Se reparten 20 tamales entre 4 amigos en partes iguales. ¿Cuántos le tocan a cada uno?", 20, "÷", 4,
            None, _p_reparto(20, 4)),
    _opcion("c2-ex-10", "La pieza", "Esta figura tiene 3 lados. ¿Cómo se llama?", _POLIGONOS, "Triángulo",
            {"tipo": "poligono", "lados": 3}, _P_POLIGONO, "¿Cómo se llama una figura de 3 lados?"),
    _conteo("c2-ex-11", "Las mochilas", "Una mochila pesa 4 kg y otra 6 kg. ¿Cuántos kilos pesan juntas?", 10,
            {"tipo": "tabla", "titulo": "Peso de las mochilas", "columnas": ["Mochila", "Peso"], "filas": [["Roja", "4 kg"], ["Azul", "6 kg"]]},
            _P_MEDIDA, "Juntar es sumar los kilos."),
    _opcion("c2-ex-12", "La hora del museo", "El museo abre a la hora que marca el reloj. ¿Qué hora es?", ["9:00", "3:00", "12:45"], "9:00",
            {"tipo": "reloj", "hora": 9, "minutos": 0}, _P_RELOJ, "Mira a qué número apunta la manecilla corta."),
]


def examen() -> list[dict]:
    """Las 12 preguntas del examen con el nivel (tema) y la fase CPA al que pertenece cada una."""
    return [{**p, "nivel": n, "nivel_tema": NIVELES[n - 1][0], "fase_cpa": NIVELES[n - 1][2]} for n, p in enumerate(EXAMEN, start=1)]
