"""Pasitos: el ejercicio DEL ALUMNO partido en pasos chiquitos, uno por mensaje (escalera v2, 24 nov).

Antes, la escalera cambiaba de estrategia en cada escalón (pregunta → dibujo → ejemplo con otros números → penúltimo
paso) y para un niño cada salto era otro tema. Ahora se trabaja SIEMPRE sobre su operación, una idea a la vez:

    5/6 + 2/3  →  1) "¿2/3 es lo mismo que cuántos sextos?"   (intermedio: 4/6)
                  2) "Entonces 5/6 + 4/6: ¿cuántos sextos juntas?"   (el resultado lo dice él)

Todo lo calcula el código con números exactos (nada de cuentas del modelo). Cada pasito trae:
- pregunta: lo que se le pregunta (corto);
- reexplicar: el MISMO pasito explicado más concreto (cuando pregunta "¿por qué?" o no entiende), a veces con dibujo;
- resuelto: cuánto da ESE pasito (se muestra solo si se atora dos veces; nunca en el último pasito);
- una forma de saber si contestó bien.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from fractions import Fraction

from . import dibujos, operaciones

_PARTES = {2: "medios", 3: "tercios", 4: "cuartos", 5: "quintos", 6: "sextos", 7: "séptimos", 8: "octavos",
           9: "novenos", 10: "décimos", 12: "doceavos"}
_FRACCION = re.compile(r"(\d+)\s*/\s*(\d+)")


# Los niños contestan de muchas formas: "7", "siete", "7 decenas", "son 70". Se leen todas como números.
_PALABRAS = {"cero": 0, "uno": 1, "una": 1, "un": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5, "seis": 6, "siete": 7,
             "ocho": 8, "nueve": 9, "diez": 10, "once": 11, "doce": 12, "trece": 13, "catorce": 14, "quince": 15,
             "dieciséis": 16, "dieciseis": 16, "diecisiete": 17, "dieciocho": 18, "diecinueve": 19, "veinte": 20,
             "treinta": 30, "cuarenta": 40, "cincuenta": 50, "sesenta": 60, "setenta": 70, "ochenta": 80, "noventa": 90,
             "cien": 100, "ciento": 100, "doscientos": 200, "trescientos": 300, "cuatrocientos": 400, "quinientos": 500,
             "seiscientos": 600, "setecientos": 700, "ochocientos": 800, "novecientos": 900, "mil": 1000}
_PALABRA = re.compile(r"\b(" + "|".join(sorted(_PALABRAS, key=len, reverse=True)) + r")\b", re.I)
_EN_LUGAR = re.compile(r"(\d+)\s*(decenas?|dieces|centenas?|cientos)\b", re.I)


def numeros_del_alumno(mensaje: str) -> set[int]:
    """Todos los números que dijo, en cifra o con palabras; "7 decenas" también cuenta como 70."""
    texto = _PALABRA.sub(lambda m: str(_PALABRAS[m[1].lower()]), _FRACCION.sub(" ", mensaje or ""))
    numeros = {int(x) for x in re.findall(r"\d+", texto)}
    for n, lugar in _EN_LUGAR.findall(texto):
        numeros.add(int(n) * (100 if lugar.lower().startswith(("cent", "cien")) else 10))
    return numeros


def partes(d: int) -> str:
    return _PARTES.get(d, f"{d}-avos")


@dataclass
class Pasito:
    pregunta: str
    reexplicar: str
    resuelto: str = ""
    final: bool = False
    entero: int | None = None                   # contestó bien si dice este número (suelto)
    fraccion: tuple[int, int] | None = None     # …o esta fracción tal cual (p. ej. 4/6, no 2/3)
    dibujo: dict | None = None                  # dibujo verificado para la explicación concreta
    porque: str = ""                            # respuesta a "¿por qué?" (distinta de `reexplicar`)
    reexplicar2: str = ""                       # una ayuda todavía más chica (si se vuelve a atorar)
    otras: list[int] = field(default_factory=list)  # otras respuestas igual de válidas (p. ej. "7" decenas por 70)
    extra: list[str] = field(default_factory=list)

    def __post_init__(self):
        # Solo dibujos que cumplen los límites (p. ej. una pizza en 20 partes no se dibuja: queda solo el texto).
        if self.dibujo is not None:
            self.dibujo = dibujos.validar(self.dibujo)

    def acierta(self, mensaje: str) -> bool:
        """¿El alumno contestó bien ESTE pasito?"""
        if self.fraccion:
            n, d = self.fraccion
            if any((int(a), int(b)) == (n, d) for a, b in _FRACCION.findall(mensaje or "")):
                return True
        if self.entero is not None:
            dichos = numeros_del_alumno(mensaje)
            return self.entero in dichos or any(o in dichos for o in self.otras)
        return False


def _fr(x: Fraction) -> str:
    return operaciones.texto(x)


# ---------------- Fracciones ----------------

def _fracciones(op: dict) -> list[Pasito]:
    a, b, o = op["a"], op["b"], op["op"]
    fa, fb = operaciones.numero(a), operaciones.numero(b)
    na, da, nb, db = fa.numerator, fa.denominator, fb.numerator, fb.denominator
    # Las fracciones tal como las escribió el alumno (sin simplificar): "2/4" sigue siendo 2 cuartos.
    if "/" in a:
        na, da = (int(x) for x in a.split("/"))
    if "/" in b:
        nb, db = (int(x) for x in b.split("/"))
    pasos: list[Pasito] = []
    if o in "+−":
        m = math.lcm(da, db)
        nuevos = {}
        for txt, n, d in ((a, na, da), (b, nb, db)):
            if d != m:
                k = m // d
                nuevos[txt] = n * k
                pasos.append(Pasito(
                    pregunta=f"Vamos a partir {txt} en pedacitos más chicos, en {partes(m)}. ¿{txt} es lo mismo que cuántos {partes(m)}?",
                    reexplicar=(f"Mira la pizza de {txt}: si cada pedazo lo partes en {k}, la pizza queda en {m} pedacitos iguales "
                                f"({partes(m)}). ¿Cuántos pedacitos quedan pintados?"),
                    resuelto=f"{txt} es lo mismo que {n * k}/{m}: los mismos pedazos, solo que más chiquitos.",
                    entero=n * k, fraccion=(n * k, m),
                    porque=(f"Porque partir cada pedazo en {k} no cambia cuánta pizza tienes: los {n} pedazos de {txt} "
                            f"se vuelven {n * k} pedacitos más chiquitos. Es la misma cantidad de pizza. "
                            f"Lo hacemos para que las dos fracciones tengan pedacitos del mismo tamaño."),
                    dibujo={"tipo": "fracciones", "forma": "circulo", "fracciones": [txt, f"{n * k}/{m}"]}))
        e1, e2 = nuevos.get(a, na * (m // da)), nuevos.get(b, nb * (m // db))
        accion = "juntas en total" if o == "+" else "te quedan"
        pasos.append(Pasito(
            pregunta=f"Ahora ya son pedacitos del mismo tamaño: {e1}/{m} {o} {e2}/{m}. ¿Cuántos {partes(m)} {accion}?",
            reexplicar=(f"Las dos pizzas tienen pedacitos del mismo tamaño ({partes(m)}). "
                        f"{'Cuenta los pedacitos pintados de las dos.' if o == '+' else f'De los {e1} pedacitos, quita {e2}. ¿Cuántos quedan?'}"),
            final=True, dibujo={"tipo": "fracciones", "forma": "circulo", "fracciones": [f"{e1}/{m}", f"{e2}/{m}"]},
            porque=(f"Porque ya son pedacitos del mismo tamaño: {'sumar' if o == '+' else 'restar'} es solo contar "
                    f"pedacitos. Los {partes(m)} se quedan igual.")))
        return pasos
    if o == "÷":
        pasos.append(Pasito(
            pregunta=f"Para dividir entre {b}, primero le damos la vuelta: el de arriba pasa abajo. ¿Cómo queda {b} al revés?",
            reexplicar=f"{b} tiene un {nb} arriba y un {db} abajo. Cámbialos de lugar: ¿qué fracción te queda?",
            resuelto=f"{b} al revés es {db}/{nb}.", fraccion=(db, nb),
            porque=f"Porque dividir entre {b} es ver cuántas veces cabe {b}, y eso da lo mismo que multiplicar por {b} al revés. Es un truco para que sea más fácil."))
        nb, db = db, nb
        b = f"{nb}/{db}"
    # Multiplicación (o la división ya volteada)
    pasos.append(Pasito(
        pregunta=f"{a} × {b}: multiplica los de arriba. ¿Cuánto es {na} × {nb}?",
        reexplicar=f"Para multiplicar fracciones, los de arriba se multiplican entre sí: {na} veces {nb}. ¿Cuánto da?",
        resuelto=f"Arriba: {na} × {nb} = {na * nb}.", entero=na * nb,
        porque="Porque al multiplicar fracciones tomas una parte de otra parte: arriba cuentas los pedazos que tomas y abajo en cuántos pedacitos quedó partido el entero."))
    pasos.append(Pasito(
        pregunta=f"Ahora los de abajo: ¿cuánto es {da} × {db}?",
        reexplicar=f"Igual que arriba, pero con los de abajo: {da} veces {db}. ¿Cuánto da?",
        resuelto=f"Abajo: {da} × {db} = {da * db}.", entero=da * db))
    pasos.append(Pasito(
        pregunta="Junta lo de arriba y lo de abajo: ¿qué fracción te queda?",
        reexplicar="Pon el número de arriba sobre el número de abajo, como una fracción. ¿Cuál es?", final=True))
    return pasos


# ---------------- Enteros ----------------

def _multiplicacion(a: int, b: int) -> list[Pasito]:
    if b >= 10 or a >= 10:
        x, y = (a, b) if b >= 10 else (b, a)  # y es el que se parte en decenas y unidades
        d, u = y - y % 10, y % 10
        if not u:
            return [Pasito(pregunta=f"{x} × {y} es {x} × {y // 10} decenas. ¿Cuánto da?",
                           reexplicar=f"Primero haz {x} × {y // 10} y luego agrégale un cero al final. ¿Cuánto da?", final=True)]
        return [
            Pasito(pregunta=f"Partimos el {y} en {d} y {u}. Primero: ¿cuánto es {x} × {d}?",
                   reexplicar=f"{x} × {d} es lo mismo que {x} × {d // 10} y luego un cero al final. ¿Cuánto da?",
                   resuelto=f"{x} × {d} = {x * d}.", entero=x * d,
                   porque=f"Porque {y} es {d} más {u}: multiplicar {x} por cada parte y luego juntar da lo mismo, y es más fácil."),
            Pasito(pregunta=f"Ahora: ¿cuánto es {x} × {u}?",
                   reexplicar=f"Son {u} grupos de {x}. Puedes ir sumando: {x}, {x * 2}… ¿cuánto da {x} × {u}?",
                   resuelto=f"{x} × {u} = {x * u}.", entero=x * u),
            Pasito(pregunta=f"Junta las dos partes: {x * d} + {x * u}. ¿Cuánto da?",
                   reexplicar=f"Suma primero las decenas y luego las unidades de {x * d} y {x * u}.", final=True),
        ]
    k = 5 if a > 5 else (2 if a >= 4 else 0)
    grupos = lambda n: {"tipo": "grupos", "objeto": "flor", "grupos": [b] * n} if b <= 10 and n <= 6 and n * b <= 30 else None
    if not k:
        return [Pasito(pregunta=f"{a} × {b} es juntar {a} grupos de {b}: {' + '.join([str(b)] * a)}. ¿Cuánto da?",
                       reexplicar=f"Cuenta de {b} en {b}, {a} veces, con tus dedos. ¿En qué número terminas?", final=True)]
    return [
        Pasito(pregunta=f"{a} × {b} son {a} grupos de {b}. Empecemos con {k}: ¿cuánto son {k} grupos de {b}?",
               reexplicar=f"Aquí hay {k} grupos de {b} flores. Cuéntalas de {b} en {b}: ¿cuántas son?",
               resuelto=f"{k} grupos de {b} son {k * b}.", entero=k * b, dibujo=grupos(k),
               porque=f"Porque {a} grupos son {k} grupos más {a - k} grupos. Por partes es más fácil que todos de golpe."),
        Pasito(pregunta=f"Te faltan {a - k} grupos de {b}. ¿Cuánto son {a - k} grupos de {b}?",
               reexplicar=f"Cuenta de {b} en {b}, {a - k} veces: ¿cuánto da?",
               resuelto=f"{a - k} grupos de {b} son {(a - k) * b}.", entero=(a - k) * b, dibujo=grupos(a - k)),
        Pasito(pregunta=f"Junta los dos: {k * b} + {(a - k) * b}. ¿Cuánto da?",
               reexplicar=f"Empieza en {k * b} y súmale {(a - k) * b}: primero las decenas y luego las unidades.", final=True),
    ]


_LUGAR = ["unidades", "decenas", "centenas", "unidades de millar", "decenas de millar"]


def _suma(a: int, b: int) -> list[Pasito]:
    if a >= 10 or b >= 10:
        # Por lugar (unidades, decenas, centenas…): un pasito por cada lugar donde los dos números tienen cifra.
        pasos, partes_, llevo = [], [], 0
        for lugar in range(len(str(max(a, b)))):
            va, vb = (a // 10 ** lugar % 10) * 10 ** lugar, (b // 10 ** lugar % 10) * 10 ** lugar
            cifras = va // 10 ** lugar + vb // 10 ** lugar
            # Formas válidas de contestar este lugar: la cifra ("6" decenas) y, como en el método de columnas, con lo
            # que se lleva del lugar anterior ("7" decenas o 70). Ninguna es el resultado final.
            otras = [cifras] if lugar else []
            if lugar and llevo:
                otras += [cifras + llevo, (cifras + llevo) * 10 ** lugar]
            llevo = (cifras + llevo) // 10
            if va and vb:
                nombre = _LUGAR[lugar] if lugar < len(_LUGAR) else "ese lugar"
                if lugar == 0:
                    dibujo = {"tipo": "grupos", "objeto": "flor", "grupos": [va, vb]}
                    reexplicar = f"Las unidades son las flores sueltas: {va} y {vb}. Júntalas y cuéntalas."
                    porque = ("Porque se suma por lugares: primero las unidades (las sueltas), luego las decenas y luego "
                              "las centenas. Si las unidades pasan de 9, forman otra decena.")
                elif lugar == 1:
                    dibujo = {"tipo": "decenas", "ramos": (va + vb) // 10, "sueltas": 0} if va + vb <= 90 else None
                    ramos = lambda n: f"{n} ramo{'s' if n != 1 else ''}"  # noqa: E731
                    reexplicar = (f"Las decenas son los ramos completos de 10: {ramos(va // 10)} y {ramos(vb // 10)}. "
                                  "¿Cuántas flores son?")
                    porque = "Porque cada cifra vale según su lugar: el de las decenas cuenta de 10 en 10."
                else:
                    dibujo = None
                    reexplicar = f"Suma solo las cifras de las {nombre}, {va // 10 ** lugar} + {vb // 10 ** lugar}, y luego ponle los ceros."
                    porque = f"Porque cada cifra vale según su lugar: el de las {nombre} cuenta de {10 ** lugar} en {10 ** lugar}."
                pasos.append(Pasito(
                    pregunta=f"{'Primero' if not pasos else 'Ahora'} las {nombre}: ¿cuánto es {va} + {vb}?",
                    reexplicar=reexplicar, porque=porque, resuelto=f"{va} + {vb} = {va + vb}.", entero=va + vb,
                    otras=otras, dibujo=dibujo))
            if va or vb:
                partes_.append(va + vb)
        if not pasos or len(partes_) < 2:  # nada que partir (p. ej. 300 + 58): un solo pasito, y es el resultado
            return [Pasito(pregunta=f"Junta {a} y {b} por lugares: centenas con centenas, decenas con decenas y unidades con unidades. ¿Cuánto da?",
                           reexplicar="Fíjate qué cifra va en cada lugar: las unidades a la derecha, luego las decenas y luego las centenas.",
                           final=True)]
        suma_txt = " + ".join(str(x) for x in reversed(partes_))
        pasos.append(Pasito(pregunta=f"Junta todo: {suma_txt}. ¿Cuánto da?",
                            reexplicar=f"Pon cada parte en su lugar: {suma_txt}. Si algún lugar pasa de 9, forma uno del siguiente lugar.",
                            final=True))
        return pasos
    falta = 10 - a
    if a + b > 10 and 0 < falta < b:
        return [
            Pasito(pregunta=f"¿Cuánto le falta a {a} para llegar a 10?",
                   reexplicar=f"Cuenta con tus dedos desde {a} hasta 10: ¿cuántos dedos levantaste?",
                   resuelto=f"A {a} le faltan {falta} para llegar a 10.", entero=falta,
                   porque="Porque sumar desde una decena es más fácil: primero completas la decena y luego agregas lo que sobra.",
                   dibujo={"tipo": "recta", "hasta": 20, "inicio": a}),
            Pasito(pregunta=f"Usamos {falta} de los {b} para llegar a 10. ¿Cuántos te sobran de los {b}?",
                   reexplicar=f"Tenías {b} y ya usaste {falta}. Tapa {falta} dedos: ¿cuántos quedan?",
                   resuelto=f"De {b} te sobran {b - falta}.", entero=b - falta),
            Pasito(pregunta=f"Entonces es 10 + {b - falta}. ¿Cuánto da?",
                   reexplicar=f"Después del 10, cuenta {b - falta} más con tus dedos. ¿En qué número terminas?", final=True),
        ]
    return [Pasito(pregunta=f"Empieza en {a} y cuenta {b} más con tus dedos. ¿En qué número terminas?",
                   reexplicar=f"Aquí hay {a} flores. Imagina {b} flores más y cuéntalas todas, una por una.", final=True,
                   reexplicar2=(f"Contemos juntos, un dedo a la vez. Empezamos en {a}: ¿qué número sigue?" if b > 1 else ""),
                   dibujo={"tipo": "objetos", "objeto": "flor", "cantidad": a} if a <= 30 else None)]


def _resta(a: int, b: int) -> list[Pasito]:
    if b >= 10:
        d, u = b - b % 10, b % 10
        if not u:
            return [Pasito(pregunta=f"Quita {b // 10} decenas a {a}: ¿cuánto es {a} − {b}?",
                           reexplicar=f"Desde {a}, quita una decena a la vez, {b // 10} veces.", final=True)]
        return [
            Pasito(pregunta=f"Partimos el {b} en {d} y {u}. Primero quita las decenas: ¿cuánto es {a} − {d}?",
                   reexplicar=f"Desde {a}, quita una decena a la vez, {d // 10} veces: ¿en qué número caes?",
                   resuelto=f"{a} − {d} = {a - d}.", entero=a - d,
                   porque="Porque es más fácil quitar por partes: primero las decenas (de una en una) y luego las unidades."),
            Pasito(pregunta=f"Ahora quita las unidades: {a - d} − {u}. ¿Cuánto da?",
                   reexplicar=f"Desde {a - d}, cuenta {u} hacia atrás con tus dedos.", final=True),
        ]
    if a >= 10 and a % 10 < b:
        bajar = a % 10
        return [
            Pasito(pregunta=f"Baja primero hasta la decena: ¿cuánto es {a} − {bajar}?",
                   reexplicar=f"Quítale a {a} sus {bajar} unidades sueltas: ¿qué decena queda?",
                   resuelto=f"{a} − {bajar} = {a - bajar}.", entero=a - bajar),
            Pasito(pregunta=f"Ya quitaste {bajar}; te {'falta' if b - bajar == 1 else 'faltan'} {b - bajar} por quitar: {a - bajar} − {b - bajar}. ¿Cuánto da?",
                   reexplicar=f"Desde {a - bajar}, cuenta {b - bajar} hacia atrás.", final=True),
        ]
    return [Pasito(pregunta=f"Tacha {b} de las {a} flores. ¿Cuántas quedan sin tachar?",
                   reexplicar=f"Tapa {b} flores con tu dedo y cuenta las que se ven.", final=True,
                   reexplicar2=(f"Contemos hacia atrás, un dedo a la vez. Empezamos en {a}: ¿qué número va antes?" if b > 1 else ""),
                   dibujo={"tipo": "objetos", "objeto": "flor", "cantidad": a} if a <= 30 else None)]


def _division(a: int, b: int) -> list[Pasito]:
    pasos = []
    q = a // b
    # Un pasito de calentamiento con k grupos, eligiendo k para que ni k ni k × b sean el cociente (no lo revela).
    k = next((k for k in (2, 3) if k < q and k != q and k * b != q), None)
    if k:
        pasos.append(Pasito(pregunta=f"Vamos a hacer grupos de {b}. ¿Cuánto son {k} grupos de {b}?",
                            reexplicar=f"Un grupo tiene {b}. Súmalo {k} veces: {' + '.join([str(b)] * k)}. ¿Cuánto da?",
                            resuelto=f"{k} grupos de {b} son {k * b}.", entero=k * b,
                            porque=f"Porque dividir {a} entre {b} es ver cuántos grupos de {b} caben en {a}.",
                            dibujo={"tipo": "grupos", "objeto": "flor", "grupos": [b] * k} if b <= 10 else None))
    pasos.append(Pasito(
        pregunta=f"Sigue juntando grupos de {b} sin pasarte de {a}. ¿Cuántos grupos caben y cuánto sobra?",
        reexplicar=f"Ve sumando {b} en {b} y cuenta los grupos hasta que ya no te alcance para otro. Lo que falta para {a} es lo que sobra.",
        final=True, dibujo={"tipo": "objetos", "objeto": "flor", "cantidad": a} if a <= 30 else None))
    return pasos


def _menciona(texto: str, valor: Fraction) -> bool:
    """¿El texto menciona este valor (fracción, aunque sea equivalente, o número suelto)?"""
    if operaciones.trae_fraccion(texto, valor):
        return True
    if valor.denominator == 1:
        return str(valor.numerator) in re.findall(r"\d+", _FRACCION.sub(" ", texto))
    return False


def _revela(lista: list[Pasito], op: dict) -> bool:
    r = operaciones.resultado(op)
    secreto = Fraction(r["cociente"]) if "cociente" in r else r["valor"]
    visibles = {operaciones.numero(op["a"]), operaciones.numero(op["b"])}
    if secreto in visibles:
        return False  # 7 × 1 = 7: el resultado ya está a la vista en la operación
    for p in lista:
        textos = [p.pregunta, p.reexplicar, p.porque, p.reexplicar2] + ([p.resuelto] if not p.final else [])
        if any(_menciona(t, secreto) for t in textos):
            return True
    return False


def _sencillo(op: dict) -> list[Pasito]:
    """Red de seguridad: un solo pasito que solo menciona los números de la operación."""
    a, o, b = op["a"], op["op"], op["b"]
    como = {"+": f"junta {a} y {b}", "−": f"a {a} quítale {b}", "×": f"junta {a} grupos de {b}",
            "÷": f"reparte {a} en grupos de {b}"}[o]
    return [Pasito(pregunta=f"Resuélvelo dibujando: {como}. ¿Cuánto te da?",
                   reexplicar=f"Dibuja bolitas o usa tus dedos: {como}, y cuenta con calma.", final=True)]


def pasitos(op: dict) -> list[Pasito]:
    """El ejercicio del alumno en pasitos. El último siempre es el resultado, y lo dice el alumno.

    Red de seguridad: si por una coincidencia algún texto mencionara el resultado (p. ej. 11 − 6 = 5 con
    "te faltan 5 por quitar"), se usa un solo pasito sencillo que no lo menciona.
    """
    t = operaciones.tipo(op)
    if t == "fracciones":
        lista = _fracciones(op)
    else:
        a, b = int(operaciones.numero(op["a"])), int(operaciones.numero(op["b"]))
        lista = _division(a, b) if t == "division" else {"×": _multiplicacion, "+": _suma, "−": _resta}[op["op"]](a, b)
    return _sencillo(op) if _revela(lista, op) else lista
