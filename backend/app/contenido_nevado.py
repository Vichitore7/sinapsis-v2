"""Mundo 4: El Nevado de los Números (4.º de primaria), inspirado en el Nevado de Toluca (Xinantécatl).

12 niveles (en el mapa, cada uno es una parada de la subida: cabaña, bosque de oyameles, lagunas, cumbre…) con 3
ejercicios cada uno; cada ejercicio resuelto encuentra un teporingo. Termina con un examen general (como el canal).
Todo está en BORRADOR: falta la revisión pedagógica de la maestra o el maestro. Texto propio (no de la SEP).

Fase del método CPA de cada nivel (`fase_cpa`, en el frontend `faseCPA`):
- concreto  (niveles 1 a 4): letreros, dinero, tiras y pizzas que se pueden contar.
- pictórico (niveles 5 a 8): grupos, productos parciales, repartos, cuerpos y desarrollos planos.
- abstracto (niveles 9 a 12): números, medidas, figuras con nombre y gráficas.

Ajustado al programa de 4.º (Fase 4): leer, escribir y ordenar hasta 5 cifras y ordinales hasta 20; decimales hasta
centésimos (con dinero); fracciones con tercios, quintos, sextos, octavos y décimos, equivalencias, sumas y restas con
distinto denominador y encontrar el entero; doble, triple y mitad; 3 cifras × 2 cifras con descomposición; división
con cociente y residuo; prismas (caras, aristas, vértices y desarrollo plano del cubo); perímetro y área con
retículas; equivalencias de tiempo; cuadriláteros; gráficas de barras y moda; problemas de varios pasos.

Las respuestas con decimales, fracciones o cociente y residuo van como opción (el campo numérico solo lee enteros).
"""
from __future__ import annotations

from .contenido_canal import _conteo, _cuenta, _opcion

TEMA = "nevado"
LECCION_ID = "n4"

CONCRETO, PICTORICO, ABSTRACTO = "concreto", "pictórico", "abstracto"


# ---------- Pistas reutilizables (nunca dicen la respuesta) ----------

_P_LEER = ["Separa el número en dos partes: lo que va antes de la coma son los miles.",
           "Lee primero los miles y di la palabra «mil».",
           "Después lee las centenas, decenas y unidades que quedan."]
_P_ANTES = ["El número que va antes es uno menos.",
            "Si termina en ceros, al quitarle 1 cambian varias cifras.",
            "Piensa en un cuentakilómetros que va hacia atrás: ¿qué número aparece?"]
_P_ORDENAR = ["Todos empiezan con 12 mil: compara las centenas.",
              "Si las centenas son iguales, compara las decenas y luego las unidades.",
              "De menor a mayor: el más chico va primero."]
_P_ORDINAL = ["Los ordinales dicen el lugar: primero, segundo, tercero…",
              "Del 11 al 19 se dicen con «decimo»: decimoprimero, decimosegundo…",
              "«Quinceavo» es una fracción (una parte de 15), no un lugar."]
_P_PESOS = ["Lo que está antes del punto son pesos.",
            "Lo que está después del punto son centavos.",
            "Lee primero los pesos y luego los centavos."]
_P_DECIMAL = ["Escribe los dos con la misma cantidad de cifras después del punto: 0.80 y 0.75.",
              "Ahora compáralos como centavos: ¿80 o 75?",
              "Mira las cuadrículas: ¿cuál tiene más cuadritos pintados?"]
_P_SUMA_PESOS = ["Acomoda el punto debajo del punto.",
                 "Suma primero los centavos; si pasan de 100, llevas 1 peso.",
                 "Después suma los pesos."]
_P_RESTA_PESOS = ["Acomoda el punto debajo del punto.",
                  "Resta primero los centavos; si no alcanza, pide 1 peso (son 100 centavos).",
                  "Después resta los pesos."]
_P_FRACCION = ["Cuenta en cuántas partes iguales está partida la tira: ese es el denominador (abajo).",
               "Cuenta las partes pintadas: ese es el numerador (arriba).",
               "Escribe pintadas / total."]
_P_EQUIV = ["Compara las dos tiras: miden lo mismo.",
            "¿Cuántos sextos tapan la misma parte que la mitad?",
            "Multiplica arriba y abajo por el mismo número."]
_P_MISMO_NUM = ["Las dos fracciones tienen el mismo numerador: 2 pedazos.",
                "Entre más partes tiene el entero, más chico es cada pedazo.",
                "¿Qué pedazos son más grandes: quintos u octavos?"]
_P_SUMA_FR = ["No se pueden sumar pedazos de distinto tamaño.",
              "Busca una fracción equivalente para que los dos tengan el mismo denominador.",
              "Ya con el mismo denominador, suma (o resta) solo los numeradores."]
_P_ENTERO = ["La tira completa es el costal entero.",
             "Si 1 de las 4 partes pesa eso, ¿cuánto pesan las 4?",
             "Multiplica lo que pesa una parte por el número de partes."]


def _p_doble(n, veces):
    palabra = {2: "doble", 3: "triple"}[veces]
    return [f"El {palabra} es sumar el número {veces} veces.",
            f"Parte el {n} en decenas y unidades: {n // 10 * 10} y {n % 10}.",
            f"Saca el {palabra} de cada parte y luego júntalas."]


def _p_mitad(n):
    return ["La mitad es repartir en 2 partes iguales.",
            f"Parte el {n} en decenas y unidades: {n // 10 * 10} y {n % 10}.",
            "Saca la mitad de cada parte y luego júntalas."]


def _p_parciales(a, b):
    d, u = b // 10 * 10, b % 10
    return [f"Descompón el {b}: {d} + {u}.",
            f"Multiplica {a} × {d} y luego {a} × {u}.",
            "Suma los dos resultados."]


_P_RESIDUO = ["¿Cuántas veces cabe el divisor sin pasarte?",
              "Multiplica el divisor por tu cociente y réstalo del total.",
              "Lo que sobra es el residuo: siempre es más chico que el divisor."]
_P_SOBRAN = ["Ve armando bolsas completas.",
             "¿Cuántas bolsas completas salen sin pasarte?",
             "Las que no alcanzan para otra bolsa son las que sobran."]
_P_COMPROBAR = ["Para comprobar una división se usa la multiplicación.",
                "Multiplica el divisor por el cociente.",
                "No olvides sumar lo que sobró."]
_P_CUBO = ["Las caras son los cuadrados, las aristas son los bordes y los vértices son las esquinas.",
           "Cuenta las caras: arriba, abajo y cuatro alrededor.",
           "Cuenta las aristas de arriba, las de abajo y las paradas."]
_P_DESARROLLO = ["Un cubo tiene 6 caras: el desarrollo necesita 6 cuadrados.",
                 "Imagina que doblas los cuadrados por las líneas.",
                 "¿Alguno quedaría encimado o faltaría una tapa?"]
_P_PRISMA = ["Mira la caja: ¿qué forma tiene cada lado?",
             "Las tapas y los lados tienen 4 lados y 4 esquinas rectas.",
             "¿Cómo se llama esa figura?"]
_P_PERIMETRO = ["El perímetro es todo el borde, el contorno.",
                "Un rectángulo tiene 2 lados largos y 2 lados cortos.",
                "Suma los 4 lados: largo + largo + ancho + ancho."]
_P_AREA = ["El área es lo que cubre por dentro: la superficie.",
           "Cuenta los cuadritos pintados.",
           "Atajo: cuenta los de una fila y multiplica por el número de filas."]
_P_HORAS = ["Una hora tiene 60 minutos.",
            "Suma 60 tantas veces como horas haya.",
            "O multiplica las horas por 60."]
_P_SEGUNDOS = ["Un minuto tiene 60 segundos.",
               "Suma 60 tantas veces como minutos haya.",
               "O multiplica los minutos por 60."]
_P_PERIODOS = ["Lustro: 5 años. Década: 10 años.",
               "Siglo: 100 años. Milenio: 1,000 años.",
               "Ordena de menos años a más años."]
_P_CUADRILATERO = ["Mira si los 4 lados miden lo mismo.",
                   "Mira si las esquinas son rectas (como la esquina de una hoja).",
                   "Cuadrado: lados iguales y esquinas rectas. Rombo: lados iguales sin esquinas rectas."]
_P_PARALELOS = ["Los lados paralelos van en la misma dirección y nunca se juntan, como las vías del tren.",
                "El rectángulo y el cuadrado tienen dos pares de lados paralelos.",
                "¿Qué cuadrilátero tiene solo un par?"]
_P_MODA = ["La moda es el dato que más se repite.",
           "En una gráfica de barras, es la barra más alta.",
           "Lee el nombre que está debajo de esa barra."]
_P_DIFERENCIA = ["Lee el número de arriba de cada barra.",
                 "¿Cuántos más es una resta?",
                 "Resta el chico al grande."]
_P_DOS_PASOS = ["Este problema tiene dos partes: primero cuánto pagan, luego el cambio.",
                "Multiplica lo que cuesta una entrada por el número de personas.",
                "Resta eso a lo que entregaron."]


# ---------- Visuales que se repiten ----------

def _tiras(*tr):
    """tr: (numerador, denominador, etiqueta)"""
    return {"tipo": "tiras", "tiras": [{"num": n, "den": d, "etiqueta": e} for n, d, e in tr]}


def _parciales(a, b):
    """Multiplicación por descomposición: a × (decenas de b) + a × (unidades de b)."""
    return {"tipo": "parciales", "a": a, "partes": [b // 10 * 10, b % 10]}


_SIGNOS = ["<", ">", "="]
_CUADRILATEROS = ["Cuadrado", "Rectángulo", "Rombo", "Trapecio"]
_BARRAS_GORROS = {"tipo": "barras", "titulo": "Color de gorro en la excursión",
                  "barras": [{"etiqueta": "Rojo", "valor": 9, "color": "#d62839"}, {"etiqueta": "Azul", "valor": 6, "color": "#3a86ff"}, {"etiqueta": "Verde", "valor": 4, "color": "#2e9e44"}]}


NIVELES = [
    # ---------------- Concreto ----------------
    ("Números hasta 5 cifras", "El Sendero de las 5 Cifras", CONCRETO, [
        _opcion("n4-n01-1", "El letrero de la entrada", "El letrero de la entrada dice cuántas personas visitaron el Nevado este mes: 28,450. ¿Cómo se lee?",
                ["Veintiocho mil cuatrocientos cincuenta", "Doscientos ochenta y cuatro mil cincuenta", "Veintiocho mil cuarenta y cinco"],
                "Veintiocho mil cuatrocientos cincuenta",
                {"tipo": "letrero", "numero": 28450, "texto": "visitantes este mes"}, _P_LEER, "¿Cuántos miles hay antes de la coma?"),
        _conteo("n4-n01-2", "Justo antes", "Los postes del sendero van numerados. ¿Qué número tiene el poste que está justo antes del 50,000?", 49999,
                {"tipo": "postes", "numeros": [None, 50000, 50001]}, _P_ANTES, "Al 50,000 quítale 1. ¿Qué pasa con los ceros?"),
        _opcion("n4-n01-3", "Las alturas", "Cuatro excursionistas anotaron números de su mapa: 12,300, 12,030, 12,003 y 12,330. ¿Cómo quedan de menor a mayor?",
                ["12,003 < 12,030 < 12,300 < 12,330", "12,330 < 12,300 < 12,030 < 12,003", "12,030 < 12,003 < 12,300 < 12,330"],
                "12,003 < 12,030 < 12,300 < 12,330",
                {"tipo": "postes", "numeros": [12300, 12030, 12003, 12330]}, _P_ORDENAR, "Los cuatro tienen 12 mil. ¿Cuál tiene menos centenas?"),
    ]),
    ("Decimales con dinero", "La Tienda del Albergue", CONCRETO, [
        _opcion("n4-n02-1", "El precio del café", "En la tienda del albergue, un café de olla cuesta $3.45. ¿Cómo se lee ese precio?",
                ["Tres pesos con cuarenta y cinco centavos", "Tres pesos con cuatro centavos", "Trescientos cuarenta y cinco pesos"],
                "Tres pesos con cuarenta y cinco centavos",
                {"tipo": "letrero", "numero": "$3.45", "texto": "café de olla"}, _P_PESOS, "¿Qué parte son pesos y qué parte son centavos?"),
        _opcion("n4-n02-2", "¿Cuál es mayor?", "Mix tomó 0.8 de un litro de chocolate y su amigo 0.75. ¿Qué número es mayor?", ["0.8", "0.75", "Son iguales"], "0.8",
                {"tipo": "decimales", "valores": [0.8, 0.75]}, _P_DECIMAL, "Escribe 0.8 como 0.80. ¿Qué es más: 80 o 75 centésimos?"),
        _opcion("n4-n02-3", "Quesadilla y chocolate", "Una quesadilla cuesta $12.50 y un chocolate caliente $8.75. ¿Cuánto pagas por los dos?", ["$20.25", "$21.25", "$22.25"], "$21.25",
                {"tipo": "tabla", "titulo": "Precios del albergue", "columnas": ["Producto", "Precio"], "filas": [["Quesadilla", "$12.50"], ["Chocolate", "$8.75"]]},
                _P_SUMA_PESOS, "50 centavos más 75 centavos, ¿pasan de 100?"),
    ]),
    ("Fracciones: tercios, quintos y sextos", "El Mosaico de Hielo", CONCRETO, [
        _opcion("n4-n03-1", "El vidrio escarchado", "La ventana de la cabaña está partida en partes iguales y algunas tienen escarcha. ¿Qué fracción tiene escarcha?", ["2/5", "2/3", "3/5"], "2/5",
                _tiras((2, 5, "")), _P_FRACCION, "¿En cuántas partes iguales está partida? ¿Cuántas tienen escarcha?"),
        _opcion("n4-n03-2", "Medio en sextos", "Mix tiene 1/2 barra de amaranto. ¿Qué fracción con denominador 6 es igual a 1/2?", ["3/6", "2/6", "1/6"], "3/6",
                _tiras((1, 2, "1/2"), (0, 6, "sextos")), _P_EQUIV, "¿Cuántos sextos caben en la mitad de la tira?"),
        _opcion("n4-n03-3", "¿Quién tiene más?", "Mix tiene 2/5 de una galleta y su amigo 2/8 de otra igual. ¿Qué signo va en 2/5 __ 2/8?", _SIGNOS, ">",
                _tiras((2, 5, "2/5"), (2, 8, "2/8")), _P_MISMO_NUM, "Los dos tienen 2 pedazos. ¿Cuáles son más grandes?"),
    ]),
    ("Sumar y restar fracciones; el entero", "El Chocolate Caliente", CONCRETO, [
        _opcion("n4-n04-1", "Dos tazas", "En la mañana Mix tomó 1/2 jarra de chocolate y en la tarde 1/4. ¿Cuánto tomó en total?", ["3/4", "2/6", "2/4"], "3/4",
                _tiras((1, 2, "1/2"), (1, 4, "1/4")), _P_SUMA_FR, "Cambia 1/2 por cuartos. ¿Cuántos cuartos son?"),
        _opcion("n4-n04-2", "Lo que quedó", "Había 3/4 de jarra de chocolate y se sirvió 1/2. ¿Cuánto queda?", ["1/4", "2/2", "2/4"], "1/4",
                _tiras((3, 4, "3/4"), (1, 2, "1/2")), _P_SUMA_FR, "1/2 son 2/4. ¿Cuánto es 3/4 menos 2/4?"),
        _conteo("n4-n04-3", "El costal de avena", "Una cuarta parte (1/4) de un costal de avena pesa 5 kg. ¿Cuántos kilos pesa el costal entero?", 20,
                {"tipo": "tiras", "tiras": [{"num": 1, "den": 4, "etiqueta": "costal", "rotulo": "5 kg"}]}, _P_ENTERO, "Si 1/4 pesa 5 kg, ¿cuánto pesan los 4 cuartos?"),
    ]),
    # ---------------- Pictórico ----------------
    ("Doble, triple y mitad", "El Campamento del Doble", PICTORICO, [
        _cuenta("n4-n05-1", "Bombones para la fogata", "En el campamento, un grupo lleva 48 bombones. Otro grupo lleva lo mismo. ¿Cuántos bombones son el doble de 48?", 2, "×", 48,
                {"tipo": "secciones", "grupos": 2, "cada": 48, "etiqueta": "bombones"}, _p_doble(48, 2)),
        _cuenta("n4-n05-2", "Leña para tres noches", "Cada noche se usan 25 leños. ¿Cuántos leños se necesitan para 3 noches (el triple de 25)?", 3, "×", 25,
                {"tipo": "secciones", "grupos": 3, "cada": 25, "etiqueta": "leños"}, _p_doble(25, 3)),
        _cuenta("n4-n05-3", "Mitad y mitad", "Hay 86 galletas para repartir entre 2 cabañas por partes iguales. ¿Cuánto es la mitad de 86?", 86, "÷", 2,
                {"tipo": "reparto", "total": 86, "entre": 2, "objeto": "galleta"}, _p_mitad(86)),
    ]),
    ("Multiplicar 3 cifras por 2 cifras", "Los Oyameles del Bosque", PICTORICO, [
        _cuenta("n4-n06-1", "Semillas de oyamel", "Para reforestar, cada caja trae 234 semillas de oyamel. ¿Cuántas semillas hay en 12 cajas?", 234, "×", 12,
                _parciales(234, 12), _p_parciales(234, 12)),
        _cuenta("n4-n06-2", "Los arbolitos", "En el vivero del Nevado hay 23 charolas con 156 arbolitos cada una. ¿Cuántos arbolitos hay?", 156, "×", 23,
                _parciales(156, 23), _p_parciales(156, 23)),
        _cuenta("n4-n06-3", "Las hileras", "En la ladera se plantaron 48 hileras con 25 oyameles cada una. ¿Cuántos oyameles se plantaron?", 48, "×", 25,
                _parciales(48, 25), _p_parciales(48, 25)),
    ]),
    ("División con cociente y residuo", "Sobran Semillas", PICTORICO, [
        _opcion("n4-n07-1", "Bolsas de 8", "Mix tiene 75 semillas y las guarda en bolsas de 8. ¿Cuál es el cociente y cuál el residuo de 75 ÷ 8?",
                ["Cociente 9 y residuo 3", "Cociente 8 y residuo 11", "Cociente 10 y residuo 5"], "Cociente 9 y residuo 3",
                {"tipo": "agrupar", "total": 75, "cada": 8, "objeto": "semilla"}, _P_RESIDUO, "¿Cuánto es 9 × 8? ¿Te pasas de 75?"),
        _conteo("n4-n07-2", "Las que sobran", "Mix reparte 50 semillas en bolsas de 6. ¿Cuántas semillas le sobran?", 2,
                {"tipo": "agrupar", "total": 50, "cada": 6, "objeto": "semilla"}, _P_SOBRAN, "¿Cuántas bolsas de 6 completas salen de 50?"),
        _opcion("n4-n07-3", "Comprobar", "Al dividir 128 ÷ 5 salió cociente 25 y residuo 3. ¿Qué cuenta lo comprueba?",
                ["5 × 25 + 3 = 128", "5 × 25 = 128", "25 + 5 + 3 = 128"], "5 × 25 + 3 = 128",
                None, _P_COMPROBAR, "Divisor × cociente + residuo, ¿da el total?"),
    ]),
    ("Prismas y desarrollo del cubo", "La Caja de Hielo", PICTORICO, [
        _opcion("n4-n08-1", "El cubo de hielo", "Mix encontró un cubo de hielo en la orilla de la laguna. ¿Cuántas caras, aristas y vértices tiene?",
                ["6 caras, 12 aristas y 8 vértices", "6 caras, 8 aristas y 12 vértices", "4 caras, 12 aristas y 8 vértices"], "6 caras, 12 aristas y 8 vértices",
                {"tipo": "cubo"}, _P_CUBO, "Cuenta los bordes con tu dedo, sin repetir."),
        _opcion("n4-n08-2", "Armar la caja", "¿Cuál de estos desarrollos planos se dobla para formar un cubo?", ["A", "B", "C"], "B",
                {"tipo": "desarrollos"}, _P_DESARROLLO, "Cuenta los cuadrados de cada uno. ¿Alguno tiene 6 y se dobla sin encimarse?"),
        _opcion("n4-n08-3", "La hielera", "La hielera del campamento tiene forma de prisma rectangular. ¿Qué forma tienen sus caras?", ["Rectángulos", "Triángulos", "Círculos"], "Rectángulos",
                {"tipo": "prisma"}, _P_PRISMA, "Cuenta los lados de una cara."),
    ]),
    # ---------------- Abstracto ----------------
    ("Perímetro y área", "La Cerca del Refugio", ABSTRACTO, [
        _conteo("n4-n09-1", "El huerto del refugio", "El huerto del refugio es un rectángulo de 8 m de largo y 5 m de ancho. ¿Cuál es su perímetro, en metros?", 26,
                None, _P_PERIMETRO, "Suma los 4 lados, no solo dos."),
        _conteo("n4-n09-2", "El piso de la cabaña", "El piso de la cabaña está cubierto con losetas cuadradas. ¿Cuál es su área, en cuadritos?", 24,
                {"tipo": "reticula", "filas": 4, "columnas": 6}, _P_AREA, "¿Cuántos cuadritos hay en una fila? ¿Cuántas filas hay?"),
        _conteo("n4-n09-3", "La cerca", "Mix quiere cercar un corral rectangular de 10 m por 4 m. ¿Cuántos metros de cerca necesita?", 28,
                None, _P_PERIMETRO, "La cerca va por todo el borde: suma los 4 lados."),
    ]),
    ("Medición del tiempo", "El Reloj del Volcán", ABSTRACTO, [
        _conteo("n4-n10-1", "La caminata", "La caminata al cráter dura 2 horas. ¿Cuántos minutos son?", 120,
                None, _P_HORAS, "¿Cuántos minutos tiene una hora?"),
        _conteo("n4-n10-2", "El descanso", "El guía pide descansar 3 minutos. ¿Cuántos segundos son?", 180,
                None, _P_SEGUNDOS, "¿Cuántos segundos tiene un minuto?"),
        _opcion("n4-n10-3", "Los periodos", "¿Cómo quedan de menor a mayor duración: siglo, lustro, milenio y década?",
                ["Lustro < década < siglo < milenio", "Década < lustro < siglo < milenio", "Lustro < siglo < década < milenio"], "Lustro < década < siglo < milenio",
                None, _P_PERIODOS, "¿Cuántos años tiene cada uno?"),
    ]),
    ("Cuadriláteros", "Los Cristales de Hielo", ABSTRACTO, [
        _opcion("n4-n11-1", "El cristal", "Este cristal de hielo tiene 4 lados iguales, pero sus esquinas no son rectas. ¿Cómo se llama?", _CUADRILATEROS, "Rombo",
                {"tipo": "cuadrilatero", "forma": "rombo"}, _P_CUADRILATERO, "Lados iguales, pero esquinas que no son rectas…"),
        _opcion("n4-n11-2", "La loseta", "Una loseta tiene 4 lados iguales y 4 ángulos rectos. ¿Qué cuadrilátero es?", _CUADRILATEROS, "Cuadrado",
                None, _P_CUADRILATERO, "Lados iguales y esquinas rectas."),
        _opcion("n4-n11-3", "Un par paralelo", "¿Qué cuadrilátero tiene solo un par de lados paralelos?", _CUADRILATEROS, "Trapecio",
                None, _P_PARALELOS, "¿Cuál tiene un lado de arriba más corto que el de abajo, y los dos van derechitos?"),
    ]),
    ("Gráficas de barras, moda y repaso", "La Gran Gráfica del Nevado", ABSTRACTO, [
        _opcion("n4-n12-1", "La moda", "La gráfica muestra el color de gorro de los excursionistas. ¿Cuál es la moda?", ["Rojo", "Azul", "Verde"], "Rojo",
                _BARRAS_GORROS, _P_MODA, "¿Cuál es la barra más alta?"),
        _conteo("n4-n12-2", "¿Cuántos más?", "Según la gráfica, ¿cuántos gorros rojos hay más que azules?", 3,
                _BARRAS_GORROS, _P_DIFERENCIA, "Resta los azules a los rojos."),
        _conteo("n4-n12-3", "El cambio", "Una familia de 4 personas entra al Nevado. Cada entrada cuesta $45 y pagan con $200. ¿Cuánto les dan de cambio?", 20,
                None, _P_DOS_PASOS, "Primero: ¿cuánto cuestan las 4 entradas?", moneda=True),
    ]),
]

LECCION = {
    "id": LECCION_ID,
    "nombre": "El Nevado de los Números",
    "concepto": "Números hasta 5 cifras, decimales, fracciones, operaciones, geometría y medida (4.º)",
    "sticker": "esfera",  # sticker de premio: una bolita (esfera) de nieve con el Nevado adentro
    "entrada": "¡Abrígate! Llegamos al Nevado de Toluca: sube por el sendero hasta las lagunas del cráter.",
    "tema": TEMA,
}


# Premio del examen: 2 trajes de baño, porque el siguiente viaje es a las Grutas de Tolantongo (Hidalgo)
# (uno de short con visera, otro completo con goggles; ninguno se nombra por género).
PREMIO_TRAJES = ["tolantongo-short", "tolantongo-completo"]


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
    _opcion("n4-ex-01", "La fila", "En la fila para subir al cráter hay 20 personas y Mix va en el lugar 15. ¿Cómo se dice ese lugar?",
            ["Decimoquinto", "Quinceavo", "Decimosexto"], "Decimoquinto", None, _P_ORDINAL, "«Quinceavo» es una fracción. ¿Cómo se dicen los lugares del 11 al 19?"),
    _opcion("n4-ex-02", "El cambio", "Mix pagó con $50.00 un recuerdo de $23.40. ¿Cuánto le dieron de cambio?", ["$26.60", "$27.60", "$33.40"], "$26.60",
            {"tipo": "letrero", "numero": "$23.40", "texto": "recuerdo del Nevado"}, _P_RESTA_PESOS, "Para restar 40 centavos a 0 centavos, pide 1 peso."),
    _opcion("n4-ex-03", "La escarcha", "¿Qué fracción de la ventana tiene escarcha?", ["4/6", "2/6", "6/4"], "4/6",
            _tiras((4, 6, "")), _P_FRACCION, "Pintadas sobre el total de partes."),
    _opcion("n4-ex-04", "El pastel", "Mix comió 1/3 de un pastel y su amigo 1/6. ¿Qué fracción comieron entre los dos?", ["3/6", "2/9", "2/6"], "3/6",
            _tiras((1, 3, "1/3"), (1, 6, "1/6")), _P_SUMA_FR, "Cambia 1/3 por sextos. ¿Cuántos sextos son?"),
    _cuenta("n4-ex-05", "La mitad", "Hay 64 bombones para 2 grupos por partes iguales. ¿Cuánto es la mitad de 64?", 64, "÷", 2,
            None, _p_mitad(64)),
    _cuenta("n4-ex-06", "El vivero", "Hay 21 charolas con 142 arbolitos cada una. ¿Cuántos arbolitos hay?", 142, "×", 21,
            _parciales(142, 21), _p_parciales(142, 21)),
    _opcion("n4-ex-07", "Las semillas", "¿Cuál es el cociente y cuál el residuo de 128 ÷ 5?", ["Cociente 25 y residuo 3", "Cociente 24 y residuo 8", "Cociente 26 y residuo 2"],
            "Cociente 25 y residuo 3", None, _P_RESIDUO, "Recuerda: el residuo siempre es más chico que el divisor."),
    _conteo("n4-ex-08", "Las esquinas", "¿Cuántos vértices tiene un cubo?", 8,
            {"tipo": "cubo"}, _P_CUBO, "Los vértices son las esquinas: cuenta las de arriba y las de abajo."),
    _conteo("n4-ex-09", "La cerca cuadrada", "Un corral cuadrado mide 7 m de cada lado. ¿Cuántos metros de cerca necesita?", 28,
            None, _P_PERIMETRO, "Un cuadrado tiene 4 lados iguales."),
    _conteo("n4-ex-10", "Un día entero", "¿Cuántas horas tiene un día?", 24,
            None, ["Piensa en un día completo: la mañana, la tarde y la noche.", "El reloj da dos vueltas completas en un día.", "Cada vuelta del reloj son 12 horas."],
            "El reloj da dos vueltas de 12 horas."),
    _opcion("n4-ex-11", "El letrero", "El letrero del mirador tiene solo un par de lados paralelos. ¿Qué figura es?", _CUADRILATEROS, "Trapecio",
            {"tipo": "cuadrilatero", "forma": "trapecio"}, _P_PARALELOS, "¿Cuántos pares de lados paralelos tiene?"),
    _opcion("n4-ex-12", "La encuesta", "En la encuesta del albergue votaron por su bebida favorita: café 5, chocolate 11, atole 8. ¿Cuál es la moda?",
            ["Café", "Chocolate", "Atole"], "Chocolate",
            {"tipo": "barras", "titulo": "Bebida favorita", "barras": [{"etiqueta": "Café", "valor": 5, "color": "#8b5a2b"}, {"etiqueta": "Chocolate", "valor": 11, "color": "#5e3a17"}, {"etiqueta": "Atole", "valor": 8, "color": "#e8c27a"}]},
            _P_MODA, "¿Cuál tiene más votos?"),
]


def examen() -> list[dict]:
    """Las 12 preguntas del examen con el nivel (tema) y la fase CPA al que pertenece cada una."""
    return [{**p, "nivel": n, "nivel_tema": NIVELES[n - 1][0], "fase_cpa": NIVELES[n - 1][2]} for n, p in enumerate(EXAMEN, start=1)]
