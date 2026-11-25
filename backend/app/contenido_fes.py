"""Mundo 3: La FES de los Números (3.º de primaria), inspirado en la FES Aragón (UNAM).

12 niveles (en el mapa, cada uno es un lugar del campus: biblioteca, laboratorio, canchas, cafetería…) con 3
ejercicios cada uno; cada ejercicio resuelto encuentra un tlacuache. Termina con un examen general (como el canal).
Todo está en BORRADOR: falta la revisión pedagógica de la maestra o el maestro. Texto propio (no de la SEP).

Fase del método CPA de cada nivel (`fase_cpa`, en el frontend `faseCPA`):
- concreto  (niveles 1 a 4): objetos que se pueden contar o tocar (libros, bloques, boletos, pizzas).
- pictórico (niveles 5 a 8): dibujos y esquemas (arreglos, repartos, figuras, relojes).
- abstracto (niveles 9 a 12): solo números, símbolos y tablas.

Ajustado al programa de 3.º (Fase 4): leer, escribir, ordenar y series hasta 4 cifras; suma y resta con algoritmo
hasta 3 cifras; multiplicación con producto de hasta 3 cifras (×10, ×20, ×30 y arreglos de una cifra); división como
reparto y agrupamiento; fracciones con medios, cuartos, octavos y dieciseisavos (comparar con igual numerador o
denominador, sumas equivalentes); 1/10 de metro; triángulos, figuras en objetos y prismas armados con cuadrados;
reloj (hora, media hora, cuarto de hora); tablas de frecuencias y pictogramas.
Lo que el programa deja para 4.º (gráficas de barras, perímetro, sumas de 4 cifras) no está aquí.
"""
from __future__ import annotations

from .contenido_canal import _conteo, _cuenta, _opcion

TEMA = "fes"
LECCION_ID = "f3"

CONCRETO, PICTORICO, ABSTRACTO = "concreto", "pictórico", "abstracto"


# ---------- Pistas reutilizables (nunca dicen la respuesta) ----------

_P_ORDENAR = ["Todos tienen 4 cifras: empieza comparando los millares.",
              "Si los millares son iguales, compara las centenas; luego las decenas.",
              "De menor a mayor: el más chico va primero."]
_P_LETRA = ["Lee el número por partes: primero los millares.",
            "Después las centenas, luego las decenas y al final las unidades.",
            "Si hay un 0, ese lugar no se dice en voz alta."]
_P_SERIE = ["Lee los números de los casilleros en voz alta.",
            "¿Cuánto cambia de un casillero al siguiente?",
            "Fíjate en la cifra de las centenas: ¿cuánto sube cada vez?"]
_P_MILES = ["El cubo grande vale 1,000, la placa 100, la barra 10 y el cubito 1.",
            "Cuenta cuántos hay de cada uno.",
            "Escribe los millares, luego las centenas, las decenas y las unidades. Si falta uno, va un 0."]
_P_VALOR = ["Cuenta los lugares desde la derecha: unidades, decenas, centenas, millares.",
            "¿En qué lugar está la cifra que te preguntan?",
            "Una cifra en los millares vale miles."]


def _p_algoritmo(op):
    if op == "+":
        return ["Acomoda las cifras en columnas: centenas con centenas, decenas con decenas y unidades con unidades.",
                "Empieza por las unidades, a la derecha.",
                "Si una columna pasa de 9, llevas 1 a la columna de la izquierda."]
    return ["Acomoda las cifras en columnas: centenas con centenas, decenas con decenas y unidades con unidades.",
            "Empieza por las unidades, a la derecha.",
            "Si arriba hay menos que abajo, pide prestado 1 a la columna de la izquierda. Con ceros, ve pidiendo de lugar en lugar."]


_P_FRACCION = ["Mira las pizzas: todas son del mismo tamaño.",
               "Entre más pedazos se corta una pizza, más chico es cada pedazo.",
               "Compara cuánto se ve pintado en cada pizza."]
_P_SIGNO = ["Compara qué parte pintada es más grande.",
            "El signo abre la boca hacia la cantidad más grande.",
            "Si las dos partes pintadas son iguales, va el signo =."]


def _p_por_10(a, b):
    return [f"Piensa en {b} como {b // 100 if b % 100 == 0 else b // 10} {'centenas' if b % 100 == 0 else 'decenas'}.",
            f"Primero multiplica sin los ceros y luego agrégalos al final.",
            f"También puedes sumar {a} veces: {' + '.join([str(b)] * a)}."]


def _p_arreglo(f, c):
    return [f"¿Cuántas filas hay y cuántos hay en cada fila?",
            f"Cada fila tiene lo mismo: puedes sumar {c} + {c} + … tantas veces como filas.",
            f"Eso es lo mismo que {f} × {c}."]


def _p_reparto(a, b):
    return ["¿Cuántos hay en total y entre cuántos se reparten?",
            "Reparte uno a cada quien, luego otro, hasta que se acaben.",
            f"¿Qué número por {b} da {a}?"]


def _p_agrupar(a, b):
    return [f"Ahora no repartes: haces grupos de {b}.",
            f"Ve sacando grupos de {b} y cuéntalos.",
            f"¿Cuántas veces cabe el {b} en el {a}?"]


_P_COMPROBAR = ["Dividir y multiplicar son operaciones contrarias.",
                "Si a cada uno le tocan 9 y son 5, ¿cuánto había en total?",
                "Busca la multiplicación que usa los mismos tres números."]
_P_TRIANGULO = ["Cuenta los lados con tu dedo.",
                "Los vértices son las esquinas, donde se juntan dos lados.",
                "¿Un triángulo tiene el mismo número de lados que de esquinas?"]
_P_TIPO_TRIANGULO = ["Mira las medidas de los tres lados.",
                     "Equilátero: 3 lados iguales. Isósceles: 2 iguales. Escaleno: los 3 distintos.",
                     "¿Cuántos lados miden lo mismo?"]
_P_FIGURAS = ["Busca las figuras de 3 lados.",
              "Revisa el techo, la bandera y las ventanas.",
              "Señala cada triángulo con tu dedo y cuéntalos."]
_P_RELOJ = ["La manecilla corta marca la hora; la larga, los minutos.",
            "Cada número del reloj son 5 minutos para la manecilla larga.",
            "Si la larga apunta al 3, ya pasó un cuarto de hora: 15 minutos."]
_P_MINUTOS = ["Una hora tiene 60 minutos.",
              "Media hora es la mitad de 60; un cuarto de hora es la cuarta parte.",
              "Calcula cada parte en minutos y luego súmalas."]
_P_DURACION = ["Empieza en la hora que marca el reloj.",
               "Primero avanza la hora completa.",
               "Después avanza la media hora: 30 minutos."]
_P_MEDIDA = ["Recuerda: 1 metro tiene 100 cm y 1 kilo tiene 1,000 g.",
             "La mitad es partir en 2 partes iguales; un cuarto, en 4; un décimo, en 10.",
             "Divide la medida completa entre 2, entre 4 o entre 10."]
_P_EQUIV = ["Piensa en una pizza partida en pedazos iguales.",
            "Junta los pedazos: ¿qué parte de la pizza tapan?",
            "Dos cuartos tapan lo mismo que una mitad; dos octavos, un cuarto; dos dieciseisavos, un octavo."]
_P_PICTOGRAMA = ["Busca la fila que te preguntan.",
                 "Cada dibujo vale 10. Cuenta de 10 en 10.",
                 "Di en voz alta: 10, 20, 30…"]
_P_TABLA = ["Lee todos los números de la columna.",
            "El total es juntar todo: suma los números.",
            "Suma de dos en dos para no perderte."]
_P_FRECUENCIA = ["La frecuencia dice cuántas veces se votó por cada cosa.",
                 "Lee el número de cada renglón.",
                 "Compara los números: el más grande es el favorito; el más chico, el que menos gustó."]
_P_DOS_PASOS = ["Este problema tiene dos partes: primero cuántos hay, luego cuántos quedan.",
                "Primero multiplica: cajas por galletas en cada caja.",
                "Después resta las que se comió."]
_P_MITAD_PESOS = ["La mitad es partir en 2 partes iguales.",
                  "¿Qué número sumado dos veces da 100?",
                  "Piensa en 100 pesos repartidos entre 2 personas."]
_P_CUBO = ["Piensa en un dado: cada cara es un cuadrado.",
           "Cuenta la cara de arriba y la de abajo.",
           "Luego cuenta las de los lados: adelante, atrás, izquierda y derecha."]


# ---------- Visuales que se repiten ----------

def _bloques(m, c, d, u):
    return {"tipo": "bloques_mil", "millares": m, "centenas": c, "decenas": d, "unidades": u}


def _pizzas(*fr):
    """fr: (numerador, denominador, etiqueta)"""
    return {"tipo": "pizzas", "fracciones": [{"num": n, "den": d, "etiqueta": e} for n, d, e in fr]}


def _algoritmo(a, b, op):
    return {"tipo": "tabla_valor", "filas": [a, b], "op": op}


_SIGNOS = ["<", ">", "="]
_TIPOS_TRIANGULO = ["Equilátero", "Isósceles", "Escaleno"]
_PICTO_BIBLIOTECA = {"tipo": "pictograma", "titulo": "Visitas a la biblioteca", "icono": "libro", "valor": 10,
                     "filas": [{"etiqueta": "Lunes", "cantidad": 4}, {"etiqueta": "Martes", "cantidad": 6}, {"etiqueta": "Miércoles", "cantidad": 3}]}
_TABLA_DEPORTES = {"tipo": "tabla", "titulo": "Deporte favorito en las canchas", "columnas": ["Deporte", "Votos (frecuencia)"],
                   "filas": [["Fútbol", "9"], ["Básquet", "6"], ["Voleibol", "4"]]}


NIVELES = [
    # ---------------- Concreto ----------------
    ("Números hasta 4 cifras", "La Biblioteca de los Millares", CONCRETO, [
        _opcion("f3-n01-1", "Los estantes", "En la biblioteca de la FES, los libros llevan un número en el lomo: 3,450, 3,045, 3,540 y 3,405. ¿Cómo quedan ordenados de menor a mayor?",
                ["3,045 < 3,405 < 3,450 < 3,540", "3,540 < 3,450 < 3,405 < 3,045", "3,045 < 3,450 < 3,405 < 3,540"], "3,045 < 3,405 < 3,450 < 3,540",
                {"tipo": "libros", "numeros": [3450, 3045, 3540, 3405]}, _P_ORDENAR, "Los millares son iguales. ¿Cuál tiene menos centenas?"),
        _opcion("f3-n01-2", "La ficha del libro", "La ficha de un libro dice 2,308 páginas leídas en el mes. ¿Cómo se escribe ese número con letra?",
                ["Dos mil trescientos ocho", "Doscientos treinta y ocho", "Dos mil treinta y ocho"], "Dos mil trescientos ocho",
                {"tipo": "libros", "numeros": [2308]}, _P_LETRA, "¿Cuántos millares tiene el 2,308? ¿Y cuántas centenas?"),
        _conteo("f3-n01-3", "Los casilleros", "Los casilleros del pasillo van numerados: 1,200, 1,300, 1,400… ¿Qué número le toca al casillero que falta?", 1500,
                {"tipo": "casilleros", "numeros": [1200, 1300, 1400, None, 1600, 1700]}, _P_SERIE, "Cada casillero sube 100. ¿Qué sigue del 1,400?"),
    ]),
    ("Valor posicional con millares", "El Laboratorio Descomponedor", CONCRETO, [
        _opcion("f3-n02-1", "La máquina del laboratorio", "En el laboratorio de electrónica hay una máquina que parte los números en pedazos. ¿Cómo descompone el 4,782?",
                ["4,000 + 700 + 80 + 2", "4,000 + 70 + 800 + 2", "400 + 700 + 80 + 2"], "4,000 + 700 + 80 + 2",
                _bloques(4, 7, 8, 2), _P_MILES, "El 7 está en las centenas: ¿vale 7, 70 o 700?"),
        _conteo("f3-n02-2", "Armar el número", "En la mesa del laboratorio de electricidad hay 5 cubos de 1,000, ninguna placa, 9 barras de 10 y 1 cubito. ¿Qué número forman?", 5091,
                _bloques(5, 0, 9, 1), _P_MILES, "Si no hay placas, en las centenas va un 0."),
        _opcion("f3-n02-3", "¿Cuánto vale el 6?", "En el número 6,215, ¿cuánto vale el 6?", ["6", "600", "6,000"], "6,000",
                _bloques(6, 2, 1, 5), _P_VALOR, "El 6 está en el cuarto lugar desde la derecha. ¿Qué lugar es ese?"),
    ]),
    ("Suma y resta de 3 cifras", "El Torneo de las Canchas", CONCRETO, [
        _cuenta("f3-n03-1", "Aficionados del torneo", "Al torneo de las canchas de la FES llegaron 456 aficionados el sábado y 278 el domingo. ¿Cuántos llegaron en total?",
                456, "+", 278, _algoritmo(456, 278, "+"), _p_algoritmo("+")),
        _cuenta("f3-n03-2", "Boletos de la final", "Para la final se imprimieron 500 boletos y ya se vendieron 347. ¿Cuántos boletos quedan?",
                500, "−", 347, _algoritmo(500, 347, "−"), _p_algoritmo("−")),
        _cuenta("f3-n03-3", "Los vasos de agua", "Para la carrera se compraron 850 vasos de agua y se usaron 467. ¿Cuántos vasos sobraron?",
                850, "−", 467, _algoritmo(850, 467, "−"), _p_algoritmo("−")),
    ]),
    ("Comparar fracciones", "Las Pizzas de la Cafetería", CONCRETO, [
        _opcion("f3-n04-1", "Mitad o cuarto", "En la cafetería, Kiko pide 1/2 de pizza y su amiga 1/4 de otra pizza del mismo tamaño. ¿Qué signo va en 1/2 __ 1/4?", _SIGNOS, ">",
                _pizzas((1, 2, "1/2"), (1, 4, "1/4")), _P_SIGNO, "¿Qué pedazo es más grande: la mitad o la cuarta parte?"),
        _opcion("f3-n04-2", "De mayor a menor", "Tres pizzas iguales se partieron distinto: 1/8, 1/2 y 1/4. ¿Cómo quedan ordenados los pedazos de MAYOR a menor?",
                ["1/2 > 1/4 > 1/8", "1/8 > 1/4 > 1/2", "1/4 > 1/2 > 1/8"], "1/2 > 1/4 > 1/8",
                _pizzas((1, 8, "1/8"), (1, 2, "1/2"), (1, 4, "1/4")), _P_FRACCION, "Entre más pedazos, ¿cada uno es más grande o más chico?"),
        _opcion("f3-n04-3", "¿Quién comió más?", "Kiko comió 2/4 de una pizza y su amigo 1/2 de otra igual. ¿Quién comió más?",
                ["Kiko", "Su amigo", "Comieron lo mismo"], "Comieron lo mismo",
                _pizzas((2, 4, "Kiko: 2/4"), (1, 2, "Su amigo: 1/2")), _P_FRACCION, "Mira las partes pintadas: ¿alguna es más grande?"),
    ]),
    # ---------------- Pictórico ----------------
    ("Multiplicar por 10, 20 y 30 y en arreglos", "Las Butacas del Auditorio", PICTORICO, [
        _cuenta("f3-n05-1", "Secciones del auditorio", "El auditorio de la FES tiene 4 secciones con 30 butacas cada una. ¿Cuántas butacas hay?", 4, "×", 30,
                {"tipo": "secciones", "grupos": 4, "cada": 30, "etiqueta": "butacas"}, _p_por_10(4, 30)),
        _cuenta("f3-n05-2", "Los estantes de la biblioteca", "La biblioteca tiene 6 estantes nuevos y en cada uno caben 20 libros. ¿Cuántos libros caben?", 6, "×", 20,
                {"tipo": "secciones", "grupos": 6, "cada": 20, "etiqueta": "libros"}, _p_por_10(6, 20)),
        _cuenta("f3-n05-3", "La tablilla de focos", "En el laboratorio de electrónica, una tablilla tiene 6 filas con 8 focos LED cada una. ¿Cuántos focos hay?", 6, "×", 8,
                {"tipo": "arreglo", "filas": 6, "columnas": 8, "objeto": "led"}, _p_arreglo(6, 8)),
    ]),
    ("División: repartir y agrupar", "Las Tortas de la Cafetería", PICTORICO, [
        _cuenta("f3-n06-1", "Tortas para el equipo", "En la cafetería hay 36 tortas para repartir entre 4 equipos en partes iguales. ¿Cuántas le tocan a cada equipo?", 36, "÷", 4,
                {"tipo": "reparto", "total": 36, "entre": 4, "objeto": "torta"}, _p_reparto(36, 4)),
        _cuenta("f3-n06-2", "Paquetes de plumones", "En la papelería hay 24 plumones y se arman paquetes de 6. ¿Cuántos paquetes salen?", 24, "÷", 6,
                {"tipo": "agrupar", "total": 24, "cada": 6, "objeto": "plumon"}, _p_agrupar(24, 6)),
        _opcion("f3-n06-3", "Comprobar la división", "Kiko repartió 45 galletas entre 5 amigos y a cada uno le tocaron 9 (45 ÷ 5 = 9). ¿Qué multiplicación lo comprueba?",
                ["9 × 5 = 45", "9 + 5 = 14", "45 × 5 = 225"], "9 × 5 = 45",
                {"tipo": "reparto", "total": 45, "entre": 5, "objeto": "galleta"}, _P_COMPROBAR, "¿Qué operación usa el 9, el 5 y el 45?"),
    ]),
    ("Triángulos y figuras", "Las Torres de la FES", PICTORICO, [
        _opcion("f3-n07-1", "El banderín de la torre", "En lo alto de la torre ondea un banderín con forma de triángulo. ¿Cuántos lados y cuántos vértices tiene?",
                ["3 lados y 3 vértices", "3 lados y 4 vértices", "4 lados y 3 vértices"], "3 lados y 3 vértices",
                {"tipo": "triangulo", "lados": [6, 6, 6], "unidad": "cm", "mostrar": False}, _P_TRIANGULO, "Cuenta las esquinas del banderín."),
        _opcion("f3-n07-2", "La ventana de la torre", "La ventana triangular de la torre mide 5 cm, 5 cm y 3 cm de lado. ¿Qué tipo de triángulo es?", _TIPOS_TRIANGULO, "Isósceles",
                {"tipo": "triangulo", "lados": [5, 5, 3], "unidad": "cm"}, _P_TIPO_TRIANGULO, "¿Cuántos lados miden lo mismo?"),
        _conteo("f3-n07-3", "La fachada", "Mira el dibujo de la fachada del edificio. ¿Cuántos triángulos encuentras?", 3,
                {"tipo": "fachada"}, _P_FIGURAS, "Revisa el techo, la bandera y la ventana de arriba."),
    ]),
    ("Fracciones y tiempo", "El Reloj de la Explanada", PICTORICO, [
        _opcion("f3-n08-1", "La hora del recreo", "El reloj de la explanada marca la hora del recreo. ¿Qué hora es?", ["3:15", "3:45", "4:15"], "3:15",
                {"tipo": "reloj", "hora": 3, "minutos": 15}, _P_RELOJ, "¿A qué número apunta la manecilla larga? ¿Cuántos minutos son?"),
        _conteo("f3-n08-2", "Ensayo de la banda", "La banda de la FES ensaya 1/4 de hora antes del concierto y 1/2 hora después. ¿Cuántos minutos ensaya en total?", 45,
                {"tipo": "reloj", "hora": 12, "minutos": 0, "sectores": [[0, 15, "#f5b700"], [15, 45, "#3a86ff"]], "sinManecillas": True}, _P_MINUTOS,
                "¿Cuántos minutos son un cuarto de hora? ¿Y media hora?"),
        _opcion("f3-n08-3", "La clase de dibujo", "La clase de dibujo empieza a la hora que marca el reloj y dura 1 hora y 30 minutos. ¿A qué hora termina?", ["3:30", "3:00", "2:30"], "3:30",
                {"tipo": "reloj", "hora": 2, "minutos": 0}, _P_DURACION, "Primero avanza 1 hora. ¿Luego cuánto falta?"),
    ]),
    # ---------------- Abstracto ----------------
    ("Medición con fracciones", "El Metro del Laboratorio", ABSTRACTO, [
        _conteo("f3-n09-1", "Un décimo de metro", "Para armar un circuito se corta 1/10 de metro de cable. ¿Cuántos centímetros son?", 10,
                None, _P_MEDIDA, "Un metro tiene 100 cm. Pártelo en 10 partes iguales."),
        _conteo("f3-n09-2", "Un cuarto de kilo", "El carrete de soldadura del laboratorio pesa 1/4 de kilo. ¿Cuántos gramos son?", 250,
                None, _P_MEDIDA, "Un kilo tiene 1,000 g. Pártelo en 4 partes iguales."),
        _opcion("f3-n09-3", "Los rollos de cable", "Hay tres rollos de cable que pesan 1/4 kg, 1 kg y 1/2 kg. ¿Cómo quedan ordenadas de MENOR a mayor?",
                ["1/4 kg < 1/2 kg < 1 kg", "1 kg < 1/2 kg < 1/4 kg", "1/2 kg < 1/4 kg < 1 kg"], "1/4 kg < 1/2 kg < 1 kg",
                None, _P_MEDIDA, "¿Qué es más: la mitad de un kilo o la cuarta parte?"),
    ]),
    ("Fracciones equivalentes", "El Pastel de la Graduación", ABSTRACTO, [
        _opcion("f3-n10-1", "Dos rebanadas", "En la graduación, Kiko se sirve 1/4 de pastel y luego otro 1/4. ¿Cuánto pastel se sirvió?", ["1/2", "2/8", "1/8"], "1/2",
                None, _P_EQUIV, "Dos cuartos juntos, ¿qué parte del pastel tapan?"),
        _conteo("f3-n10-2", "Rebanadas chiquitas", "¿Cuántas rebanadas de 1/16 se necesitan para formar 1/8 de pastel?", 2,
                None, _P_EQUIV, "Un octavo es el doble de grande que un dieciseisavo."),
        _opcion("f3-n10-3", "Media charola", "¿Cuál de estas sumas forma 1/2 pastel?", ["1/4 + 1/4", "1/8 + 1/8", "1/2 + 1/4"], "1/4 + 1/4",
                None, _P_EQUIV, "¿Cuántos cuartos caben en una mitad?"),
    ]),
    ("Pictogramas y tablas de frecuencias", "La Encuesta del Campus", ABSTRACTO, [
        _conteo("f3-n11-1", "Visitas del lunes", "En el pictograma, cada libro vale 10 visitas a la biblioteca. ¿Cuántas visitas hubo el lunes?", 40,
                _PICTO_BIBLIOTECA, _P_PICTOGRAMA, "Cuenta solo los libros del lunes, de 10 en 10."),
        _conteo("f3-n11-2", "Lo más pedido en la cafetería", "La tabla dice cuántos alumnos pidieron cada antojito. ¿Cuántos alumnos son en total?", 20,
                {"tipo": "tabla", "titulo": "Antojito favorito", "columnas": ["Antojito", "Alumnos"],
                 "filas": [["Tortas", "8"], ["Chilaquiles", "5"], ["Quesadillas", "7"], ["Total", "?"]]},
                _P_TABLA, "El total es la suma de toda la columna de alumnos."),
        _opcion("f3-n11-3", "El deporte favorito", "Según la tabla de frecuencias, ¿cuál es el deporte favorito en las canchas?", ["Fútbol", "Básquet", "Voleibol"], "Fútbol",
                _TABLA_DEPORTES, _P_FRECUENCIA, "¿Qué deporte tiene el número más grande?"),
    ]),
    ("Repaso final", "El Gran Desafío de la FES", ABSTRACTO, [
        _conteo("f3-n12-1", "Las galletas", "Kiko compra 3 cajas con 12 galletas cada una y se come 5. ¿Cuántas galletas le quedan?", 31,
                None, _P_DOS_PASOS, "Primero: ¿cuántas galletas había en las 3 cajas?"),
        _conteo("f3-n12-2", "La sudadera de oferta", "Una sudadera de la FES costaba $100 y hoy cuesta la mitad, 1/2 de $100. ¿Cuánto cuesta hoy?", 50,
                None, _P_MITAD_PESOS, "La mitad de 100 es partir 100 en 2 partes iguales.", moneda=True),
        _conteo("f3-n12-3", "La caja de regalo", "Para la graduación, Kiko arma una caja con forma de cubo usando cuadrados de cartón. ¿Cuántos cuadrados necesita?", 6,
                None, _P_CUBO, "Cuenta las caras: arriba, abajo y los lados."),
    ]),
]

LECCION = {
    "id": LECCION_ID,
    "nombre": "La FES de los Números",
    "concepto": "Números hasta 9,999, fracciones, multiplicación, división y medida (3.º)",
    "sticker": "peluche",  # sticker de premio: peluche de la mascota de la FES Aragón
    "entrada": "¡Bienvenido a la FES Aragón! Hoy eres estudiante universitario: recorre el campus, lugar por lugar.",
    "tema": TEMA,
}


# Premio del examen: 2 atuendos para el frío, porque el siguiente viaje es al Nevado de Toluca
# (uno con chamarra y gorro, otro con abrigo largo y orejeras; ninguno se nombra por género).
PREMIO_TRAJES = ["nevado-gorro", "nevado-orejeras"]


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
    _opcion("f3-ex-01", "Los libros", "¿Cómo quedan de menor a mayor los libros 2,610, 2,061, 2,601?",
            ["2,061 < 2,601 < 2,610", "2,610 < 2,601 < 2,061", "2,601 < 2,061 < 2,610"], "2,061 < 2,601 < 2,610",
            {"tipo": "libros", "numeros": [2610, 2061, 2601]}, _P_ORDENAR, "Los millares son iguales. Compara las centenas."),
    _conteo("f3-ex-02", "El laboratorio", "¿Qué número forman 3 cubos de 1,000, 4 placas de 100, ninguna barra y 6 cubitos?", 3406,
            _bloques(3, 4, 0, 6), _P_MILES, "Si no hay barras, en las decenas va un 0."),
    _cuenta("f3-ex-03", "El torneo", "El viernes llegaron 375 aficionados y el sábado 548. ¿Cuántos llegaron en total?", 375, "+", 548,
            _algoritmo(375, 548, "+"), _p_algoritmo("+")),
    _opcion("f3-ex-04", "Las pizzas", "¿Qué signo va en 1/8 __ 1/4?", _SIGNOS, "<",
            _pizzas((1, 8, "1/8"), (1, 4, "1/4")), _P_SIGNO, "¿Qué pedazo es más chico?"),
    _cuenta("f3-ex-05", "El auditorio", "Hay 5 filas con 30 butacas cada una. ¿Cuántas butacas son?", 5, "×", 30,
            {"tipo": "secciones", "grupos": 5, "cada": 30, "etiqueta": "butacas"}, _p_por_10(5, 30)),
    _cuenta("f3-ex-06", "Las tortas", "Se reparten 28 tortas entre 4 equipos en partes iguales. ¿Cuántas le tocan a cada uno?", 28, "÷", 4,
            {"tipo": "reparto", "total": 28, "entre": 4, "objeto": "torta"}, _p_reparto(28, 4)),
    _opcion("f3-ex-07", "La torre", "Un triángulo mide 4 cm, 6 cm y 7 cm de lado. ¿Qué tipo de triángulo es?", _TIPOS_TRIANGULO, "Escaleno",
            {"tipo": "triangulo", "lados": [4, 6, 7], "unidad": "cm"}, _P_TIPO_TRIANGULO, "¿Hay algún lado igual a otro?"),
    _opcion("f3-ex-08", "El reloj", "¿Qué hora marca el reloj de la explanada?", ["5:30", "6:30", "5:15"], "5:30",
            {"tipo": "reloj", "hora": 5, "minutos": 30}, _P_RELOJ, "Si la manecilla larga apunta al 6, ¿cuántos minutos son?"),
    _conteo("f3-ex-09", "El metro", "¿Cuántos centímetros hay en 1/2 metro?", 50,
            None, _P_MEDIDA, "Un metro tiene 100 cm. ¿Cuánto es la mitad?"),
    _conteo("f3-ex-10", "El pastel", "¿Cuántas rebanadas de 1/4 forman 1/2 pastel?", 2,
            None, _P_EQUIV, "¿Cuántos cuartos caben en una mitad?"),
    _opcion("f3-ex-11", "La encuesta", "Según la tabla de frecuencias, ¿qué deporte tiene MENOS votos?", ["Fútbol", "Básquet", "Voleibol"], "Voleibol",
            _TABLA_DEPORTES, _P_FRECUENCIA, "¿Qué deporte tiene el número más chico?"),
    _conteo("f3-ex-12", "La caja de zapatos", "Kiko arma una caja como de zapatos (prisma rectangular): 2 tapas y 4 lados. ¿Cuántos rectángulos de cartón usa?", 6,
            None, _P_CUBO, "Suma las tapas y los lados."),
]


def examen() -> list[dict]:
    """Las 12 preguntas del examen con el nivel (tema) y la fase CPA al que pertenece cada una."""
    return [{**p, "nivel": n, "nivel_tema": NIVELES[n - 1][0], "fase_cpa": NIVELES[n - 1][2]} for n, p in enumerate(EXAMEN, start=1)]
