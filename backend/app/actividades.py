"""Actividades del aula: el profesor deja problemas y material; el alumno los resuelve en su cuaderno y los escanea.

Aula y Escáner son para estudiar (el Mapa es para jugar), así que esto vive aparte de los mundos.

- El profesor arma una actividad con título, instrucciones, material (texto y enlaces) y problemas: los escribe él o
  los toma del banco de prueba por grado (`BANCO`, con texto propio; los temas siguen el estándar de contenidos).
- El alumno resuelve cada problema en su cuaderno y lo escanea. Kiko revisa la operación (filtro obligatorio): si algo
  está mal, le ayuda en el chat hasta que lo corrige. Cuando todos los problemas pasaron por el escáner, puede entregar.
- Con lo que resolvieron, el profesor ve qué domina, qué comprende y qué se le dificulta a cada alumno (`comprension`).

Las respuestas correctas nunca salen al navegador del alumno: se revisan aquí con app/operaciones.py.
"""
from __future__ import annotations

from collections import Counter
from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, ForeignKey, Integer, String, Text, select
from sqlalchemy.orm import Mapped, Session, mapped_column

from . import aprendizaje, estrategia, operaciones
from .db import Base
from .modelos import ahora


class Actividad(Base):
    __tablename__ = "actividades"

    id: Mapped[int] = mapped_column(primary_key=True)
    aula_id: Mapped[int] = mapped_column(ForeignKey("aulas.id", ondelete="CASCADE"), index=True)
    titulo: Mapped[str] = mapped_column(String(80))
    modulo: Mapped[str | None] = mapped_column(String(40), nullable=True)  # suma-resta | multiplicacion | division | fracciones
    instrucciones: Mapped[str] = mapped_column(Text, default="")
    material: Mapped[str] = mapped_column(Text, default="")  # texto y enlaces para estudiar
    fecha_limite: Mapped[date | None] = mapped_column(Date, nullable=True)
    problemas: Mapped[list] = mapped_column(JSON, default=list)  # [{id, a, op, b, enunciado}]
    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)


class AvanceActividad(Base):
    """Lo que hizo un alumno en una actividad: por problema, sus escaneos y si ya lo resolvió."""
    __tablename__ = "avances_actividad"

    alumno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    actividad_id: Mapped[int] = mapped_column(ForeignKey("actividades.id", ondelete="CASCADE"), primary_key=True)
    # {problema_id: {"intentos": [{"c", "residuo", "correcto", "tipo_error"}], "resuelto": bool, "con_ayuda": bool}}
    problemas: Mapped[dict] = mapped_column(JSON, default=dict)
    entregada: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actualizado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora, onupdate=ahora)


# ---------------- Banco de problemas de prueba por grado (texto propio) ----------------
# Solo operaciones que el escáner sabe revisar: números naturales y fracciones con × + − ÷ (sin negativos ni decimales).

def _p(a, op, b, enunciado: str = "") -> dict:
    return {"a": str(a), "op": op, "b": str(b), "enunciado": enunciado}


# Los módulos de las tareas son los mismos del aula (unidades del contenido).
MODULOS = {"suma-resta": "Suma y resta", "multiplicacion": "Multiplicación", "division": "División",
           "fracciones": "Fracciones"}


def modulo_de(op: dict) -> str:
    """A qué módulo pertenece una operación: fracciones si lleva fracciones; si no, según la operación."""
    if operaciones.tipo(op) == "fracciones":
        return "fracciones"
    return {"+": "suma-resta", "−": "suma-resta", "×": "multiplicacion", "÷": "division"}[op["op"]]


BANCO: dict[str, dict] = {
    "P1": {"grado": "1.º de primaria", "problemas": [
        _p(4, "+", 3, "En la trajinera van 4 niñas y suben 3 niños. ¿Cuántos van ahora?"),
        _p(9, "−", 5, "Había 9 globos y se volaron 5. ¿Cuántos quedan?"),
        _p(12, "+", 5), _p(18, "−", 6), _p(20, "+", 7), _p(15, "−", 3), _p(8, "+", 6),
        _p(2, "×", 4, "Hay 2 bolsitas con 4 dulces cada una. ¿Cuántos dulces hay?"), _p(3, "×", 2), _p(5, "×", 2),
        _p(6, "÷", 2, "Reparte 6 canicas entre 2 amigos por igual. ¿Cuántas le tocan a cada uno?"), _p(8, "÷", 4),
    ]},
    "P2": {"grado": "2.º de primaria", "problemas": [
        _p(45, "+", 32), _p(68, "−", 25),
        _p(37, "+", 48, "En el Metro subieron 37 personas en una estación y 48 en la siguiente. ¿Cuántas subieron?"),
        _p(82, "−", 47), _p(256, "+", 131), _p(90, "−", 36),
        _p(4, "×", 5), _p(3, "×", 7, "Cada boleto cuesta 3 pesos. ¿Cuánto pagas por 7 boletos?"), _p(6, "×", 4), _p(2, "×", 9),
        _p(18, "÷", 3, "Reparte 18 elotes entre 3 puestos por igual. ¿Cuántos le tocan a cada uno?"),
        _p(24, "÷", 4), _p(15, "÷", 5),
    ]},
    "P3": {"grado": "3.º de primaria", "problemas": [
        _p(345, "+", 268), _p(702, "−", 358), _p(489, "+", 236), _p(600, "−", 245),
        _p(23, "×", 4), _p(15, "×", 20), _p(7, "×", 8), _p(30, "×", 6),
        _p(36, "÷", 4, "En la cafetería hay 36 tortas para 4 mesas. ¿Cuántas van en cada mesa?"),
        _p(47, "÷", 5, "Se acomodan 47 sillas en filas de 5. ¿Cuántas filas completas salen y cuántas sobran?"),
        _p(56, "÷", 7), _p(29, "÷", 3),
        _p("1/4", "+", "2/4", "Comiste 1/4 de pizza y luego 2/4 más. ¿Cuánta pizza comiste?"),
        _p("3/8", "+", "1/8"), _p("5/8", "−", "2/8"), _p("3/4", "−", "1/4"),
    ]},
    "P4": {"grado": "4.º de primaria", "problemas": [
        _p(2345, "+", 1678), _p(5000, "−", 2364), _p(3608, "+", 2795), _p(8000, "−", 4567),
        _p(124, "×", 13), _p(56, "×", 24), _p(305, "×", 12),
        _p(456, "÷", 6), _p(375, "÷", 12, "Hay 375 hojas para hacer cuadernos de 12 hojas. ¿Cuántos cuadernos completos salen?"),
        _p(984, "÷", 8), _p(700, "÷", 25),
        _p("1/3", "+", "1/6"), _p("2/5", "+", "1/10"), _p("7/9", "−", "2/9"), _p("5/6", "−", "1/3"),
    ]},
    "P5": {"grado": "5.º de primaria", "problemas": [
        _p(45780, "+", 36925), _p(90000, "−", 48356),
        _p(125, "×", 24, "Una caja trae 125 lápices. ¿Cuántos lápices hay en 24 cajas?"), _p(248, "×", 36),
        _p(4500, "÷", 36), _p(1728, "÷", 24),
        _p("3/4", "+", "1/6"), _p("5/6", "−", "1/4"), _p("3/5", "×", 4), _p("2/7", "+", "3/14"), _p("1/2", "+", "1/3"),
        _p("2/3", "×", 5),
    ]},
    "P6": {"grado": "6.º de primaria", "problemas": [
        _p(125600, "+", 87450), _p(300000, "−", 125875),
        _p(1250, "×", 12), _p(345, "×", 208),
        _p(2400, "÷", 48), _p(9876, "÷", 12),
        _p("3/4", "÷", 3, "Se reparten 3/4 de litro de agua de jamaica en 3 vasos iguales. ¿Cuánto va en cada vaso?"),
        _p("2/3", "×", "3/5"), _p("7/10", "−", "1/4"), _p("9/4", "÷", "3/2"), _p("3/5", "+", "1/2"),
    ]},
    "S1": {"grado": "1.º de secundaria", "problemas": [
        _p(125, "×", 125), _p(48, "×", 75),
        _p(360, "÷", 24, "Un rollo de 360 cm de listón se corta en tramos de 24 cm. ¿Cuántos tramos salen?"), _p(1452, "÷", 33),
        _p("3/4", "÷", "1/2"), _p("5/6", "+", "7/8"), _p("2/3", "×", "9/4"), _p("11/12", "−", "3/8"), _p("7/3", "+", "5/6"),
    ]},
    "S2": {"grado": "2.º de secundaria", "problemas": [
        _p(48, "×", 52), _p(2025, "÷", 45), _p(3600, "÷", 75),
        _p("15/4", "−", "7/6"), _p("8/9", "×", "3/4"), _p("5/12", "+", "11/18"),
        _p("3/5", "÷", "9/10", "Con 3/5 de kilo de masa se hacen porciones de 9/10 de kilo. ¿Cuántas porciones salen?"),
    ]},
    "S3": {"grado": "3.º de secundaria", "problemas": [
        _p(256, "×", 64),
        _p(1728, "÷", 12, "Un cubo de 1728 cubitos se separa en 12 capas iguales. ¿Cuántos cubitos tiene cada capa?"),
        _p(5625, "÷", 75),
        _p("17/6", "+", "5/9"), _p("13/8", "−", "5/12"), _p("12/25", "×", "5/6"), _p("49/10", "÷", "7/5"),
    ]},
}


def banco() -> list[dict]:
    """El banco para el profesor (sin resultados), con el tema de cada problema."""
    salida = []
    for clave, g in BANCO.items():
        problemas = []
        for p in g["problemas"]:
            op = operaciones.validar({**p, "c": ""})
            problemas.append({**p, "tema": aprendizaje.concepto_de_operacion(op)[1], "modulo": modulo_de(op)})
        salida.append({"clave": clave, "grado": g["grado"], "problemas": problemas})
    return salida


# ---------------- Problemas ----------------

def normalizar_problemas(problemas: list[dict], modulo: str | None = None) -> list[dict]:
    """Valida los problemas del profesor. Regresa [{id, a, op, b, enunciado}] o lanza ValueError.
    Con `modulo`, todos tienen que ser de ese módulo (la tarea se organiza por módulo)."""
    salida = []
    for i, p in enumerate(problemas, start=1):
        op = operaciones.validar({"a": p.get("a"), "op": p.get("op"), "b": p.get("b"), "c": ""})
        if op is None:
            raise ValueError(f"El problema {i} no se puede revisar con el escáner: usa números naturales o "
                             "fracciones con ×, +, − o ÷ (sin negativos).")
        if modulo and modulo_de(op) != modulo:
            raise ValueError(f"El problema {i} ({op['a']} {op['op']} {op['b']}) es de {MODULOS[modulo_de(op)]}, "
                             f"no de {MODULOS[modulo]}.")
        salida.append({"id": f"p{i}", "a": op["a"], "op": op["op"], "b": op["b"],
                       "enunciado": (p.get("enunciado") or "").strip()[:300]})
    if not salida:
        raise ValueError("Agrega al menos un problema.")
    return salida


def texto_problema(p: dict) -> str:
    return f"{p['a']} {p['op']} {p['b']}"


def _coincide(p: dict, op: dict) -> bool:
    """¿Lo que escaneó es la operación del problema? En + y × el orden no importa."""
    if op["op"] != p["op"]:
        return False
    if (op["a"], op["b"]) == (p["a"], p["b"]):
        return True
    return p["op"] in "+×" and (op["a"], op["b"]) == (p["b"], p["a"])


def _avance(db: Session, alumno_id: int, actividad: Actividad) -> AvanceActividad:
    av = db.get(AvanceActividad, (alumno_id, actividad.id))
    if av is None:
        av = AvanceActividad(alumno_id=alumno_id, actividad_id=actividad.id, problemas={})
        db.add(av)
    return av


def registrar_escaneo(db: Session, alumno_id: int, actividad: Actividad, problema_id: str, op: dict) -> dict:
    """El alumno escaneó su cuaderno para este problema. No hace commit."""
    p = next((x for x in actividad.problemas if x["id"] == problema_id), None)
    if p is None:
        raise LookupError("Ese problema no existe.")
    if not _coincide(p, op):
        return {"coincide": False, "problema": texto_problema(p)}
    d = operaciones.diagnosticar(op)
    if d["correcto"] is None:
        return {"coincide": True, "sin_resultado": True, "problema": texto_problema(p)}
    av = _avance(db, alumno_id, actividad)
    estado = dict(av.problemas.get(problema_id) or {"intentos": [], "resuelto": False, "con_ayuda": False})
    estado["intentos"] = [*estado["intentos"], {"c": op["c"], "residuo": op.get("residuo") or "",
                                                "correcto": bool(d["correcto"]), "tipo_error": d.get("tipo_error")}][-10:]
    if d["correcto"] and not estado["resuelto"]:
        estado["resuelto"] = True
        estado["con_ayuda"] = len(estado["intentos"]) > 1  # lo corrigió después de un escaneo con error
    av.problemas = {**av.problemas, problema_id: estado}
    aprendizaje.resultado_escaneo(db, alumno_id, op)  # memoria de Kiko y escalera de pistas, como el escáner normal
    return {"coincide": True, "correcto": bool(d["correcto"]), "resuelto": estado["resuelto"], "problema": texto_problema(p)}


def resuelto_en_chat(db: Session, alumno_id: int, actividad: Actividad, problema_id: str) -> dict:
    """Kiko confirmó en el chat que ya lo resolvió (después de escanearlo con error). No hace commit."""
    p = next((x for x in actividad.problemas if x["id"] == problema_id), None)
    if p is None:
        raise LookupError("Ese problema no existe.")
    av = _avance(db, alumno_id, actividad)
    estado = av.problemas.get(problema_id)
    if not estado or not estado["intentos"]:
        return {"resuelto": False}  # primero tiene que escanearlo (el filtro de Kiko es obligatorio)
    op = operaciones.validar({"a": p["a"], "op": p["op"], "b": p["b"], "c": ""})
    if not estado["resuelto"] and estrategia.resuelta(db, alumno_id, op):
        av.problemas = {**av.problemas, problema_id: {**estado, "resuelto": True, "con_ayuda": True}}
        return {"resuelto": True}
    return {"resuelto": bool(estado["resuelto"])}


def puede_entregar(actividad: Actividad, av: AvanceActividad | None) -> bool:
    """Todos los problemas pasaron por el escáner (por el filtro de Kiko) al menos una vez."""
    hechos = (av.problemas if av else {})
    return all((hechos.get(p["id"]) or {}).get("intentos") for p in actividad.problemas)


def para_alumno(actividad: Actividad, av: AvanceActividad | None) -> dict:
    """Vista del alumno: sin resultados correctos."""
    hechos = av.problemas if av else {}
    problemas = []
    for p in actividad.problemas:
        e = hechos.get(p["id"]) or {}
        estado = "resuelto" if e.get("resuelto") else ("revisar" if e.get("intentos") else "pendiente")
        problemas.append({"id": p["id"], "texto": texto_problema(p), "enunciado": p.get("enunciado", ""), "estado": estado})
    return {
        "id": actividad.id, "aula_id": actividad.aula_id, "titulo": actividad.titulo,
        "modulo": actividad.modulo, "modulo_nombre": MODULOS.get(actividad.modulo or "", "Otras actividades"),
        "instrucciones": actividad.instrucciones, "material": actividad.material,
        "fecha_limite": actividad.fecha_limite.isoformat() if actividad.fecha_limite else None,
        "problemas": problemas, "resueltos": sum(1 for x in problemas if x["estado"] == "resuelto"),
        "entregada": bool(av and av.entregada), "puede_entregar": puede_entregar(actividad, av),
    }


def respuestas_de(actividad: Actividad, av: AvanceActividad | None) -> list[dict]:
    """Para el profesor: cada problema con lo que contestó el alumno, en palabras."""
    hechos = av.problemas if av else {}
    salida = []
    for n, p in enumerate(actividad.problemas, start=1):
        e = hechos.get(p["id"]) or {}
        intentos = e.get("intentos") or []
        primero = intentos[0] if intentos else None
        resp = lambda i: i["c"] + (f" residuo {i['residuo']}" if i.get("residuo") else "")  # noqa: E731
        if not intentos:
            estado, nota = "pendiente", "Todavía no lo escanea."
        elif e.get("resuelto") and not e.get("con_ayuda"):
            estado, nota = "bien", f"Contestó {resp(primero)} a la primera."
        elif e.get("resuelto"):
            error = aprendizaje.NOMBRES_ERROR.get(primero.get("tipo_error") or "", "")
            estado, nota = "con_ayuda", (f"Primero contestó {resp(primero)}" + (f" ({error})" if error else "")
                                         + "; lo corrigió con ayuda de Kiko.")
        else:
            ultimo = intentos[-1]
            error = aprendizaje.NOMBRES_ERROR.get(ultimo.get("tipo_error") or "", "")
            estado, nota = "mal", f"Contestó {resp(ultimo)}" + (f" ({error})" if error else "") + "; todavía no lo corrige."
        salida.append({"numero": n, "texto": texto_problema(p), "enunciado": p.get("enunciado", ""), "estado": estado,
                       "nota": nota, "tema": aprendizaje.concepto_de_operacion(
                           operaciones.validar({"a": p["a"], "op": p["op"], "b": p["b"], "c": ""}))[1]})
    return salida


# ---------------- Comprensión por tema (para el profesor) ----------------

CATEGORIAS = ("dificultad", "comprende", "domina")


def _categoria(intentados: int, primera: int, con_ayuda: int, sin_resolver: int) -> tuple[str, str]:
    """(categoría para la gráfica, frase para el profesor). La decide el código, no el modelo."""
    resueltos = primera + con_ayuda
    if primera == intentados:  # todo bien a la primera
        return "domina", ("Lo domina" if intentados >= 2 else "Lo resolvió bien a la primera")
    if sin_resolver == 0 and primera >= 2 and primera * 3 >= intentados * 2:
        return "domina", "Lo domina"
    if resueltos * 2 >= intentados:
        return "comprende", ("Lo comprende" if sin_resolver == 0 else "No lo termina de comprender")
    return "dificultad", ("No lo entendió todavía" if resueltos == 0 else "Se le dificulta")


def comprension(db: Session, actividades: list[Actividad], alumno_id: int) -> list[dict]:
    """Por módulo (los mismos de las tareas): qué tal le va con lo que resolvió en las actividades (escaneado), qué
    error repite y qué le ha funcionado en el chat con Kiko. Solo conteos y etiquetas: nunca el texto del chat."""
    por_tema: dict[str, dict] = {}
    for act in actividades:
        av = db.get(AvanceActividad, (alumno_id, act.id))
        if not av:
            continue
        for p in act.problemas:
            e = av.problemas.get(p["id"])
            if not e or not e.get("intentos"):
                continue
            op = operaciones.validar({"a": p["a"], "op": p["op"], "b": p["b"], "c": ""})
            modulo = modulo_de(op)
            t = por_tema.setdefault(modulo, {"concepto": modulo, "nombre": MODULOS[modulo], "intentados": 0, "primera": 0,
                                             "con_ayuda": 0, "sin_resolver": 0, "errores": Counter(), "conceptos": set()})
            t["conceptos"].add(aprendizaje.concepto_de_operacion(op)[0])  # p. ej. suma_fracciones, resta_fracciones
            t["intentados"] += 1
            if e.get("resuelto"):
                t["con_ayuda" if e.get("con_ayuda") else "primera"] += 1
            else:
                t["sin_resolver"] += 1
            for i in e["intentos"]:
                if not i.get("correcto") and i.get("tipo_error"):
                    t["errores"][i["tipo_error"]] += 1
    salida = []
    for t in por_tema.values():
        categoria, frase = _categoria(t["intentados"], t["primera"], t["con_ayuda"], t["sin_resolver"])
        # Lo que le ha funcionado en el chat con Kiko, juntando los conceptos del módulo.
        juntas: dict[str, dict] = {}
        for concepto in t["conceptos"]:
            memoria = db.get(aprendizaje.Aprendizaje, (alumno_id, concepto))
            for k, r in ((memoria.representaciones if memoria else None) or {}).items():
                j = juntas.setdefault(k, {"usada": 0, "ayudo": 0})
                j["usada"] += r.get("usada", 0)
                j["ayudo"] += r.get("ayudo", 0)
        funciono = sorted(((k, r) for k, r in juntas.items() if r["ayudo"]), key=lambda x: -x[1]["ayudo"])
        error = t["errores"].most_common(1)
        salida.append({
            "concepto": t["concepto"], "nombre": t["nombre"], "categoria": categoria, "frase": frase,
            "problemas": t["intentados"], "a_la_primera": t["primera"], "con_ayuda": t["con_ayuda"],
            "sin_resolver": t["sin_resolver"],
            "error_frecuente": aprendizaje.NOMBRES_ERROR.get(error[0][0], error[0][0]) if error else None,
            "le_ha_funcionado": [f"{aprendizaje.NOMBRES_REPRESENTACION.get(k, k)} (le ayudó {r['ayudo']} de "
                                 f"{r['usada']} {'vez' if r['usada'] == 1 else 'veces'})" for k, r in funciono[:2]],
        })
    orden = {c: i for i, c in enumerate(CATEGORIAS)}
    modulos = list(MODULOS)  # primero lo que se le dificulta; dentro, en el orden de los módulos
    return sorted(salida, key=lambda x: (orden[x["categoria"]], modulos.index(x["concepto"])))


def resumen_alumno(db: Session, actividades: list[Actividad], alumno_id: int) -> dict:
    """Para el panel del profesor: cómo va con SUS tareas (nada del Mapa). Solo conteos."""
    r = {"tareas": len(actividades), "entregadas": 0, "ejercicios": 0, "escaneados": 0, "a_la_primera": 0,
         "con_ayuda": 0, "sin_corregir": 0, "errores": Counter()}
    for act in actividades:
        av = db.get(AvanceActividad, (alumno_id, act.id))
        r["ejercicios"] += len(act.problemas)
        if not av:
            continue
        r["entregadas"] += bool(av.entregada)
        for p in act.problemas:
            e = av.problemas.get(p["id"]) or {}
            if not e.get("intentos"):
                continue
            r["escaneados"] += 1
            if e.get("resuelto"):
                r["con_ayuda" if e.get("con_ayuda") else "a_la_primera"] += 1
            else:
                r["sin_corregir"] += 1
            for i in e["intentos"]:
                if not i.get("correcto") and i.get("tipo_error"):
                    r["errores"][i["tipo_error"]] += 1
    errores = r.pop("errores")
    r["errores"] = [{"id": k, "texto": aprendizaje.NOMBRES_ERROR.get(k, k), "veces": n} for k, n in errores.most_common(3)]
    return r


def actividades_de_aula(db: Session, aula_id: int) -> list[Actividad]:
    return list(db.scalars(select(Actividad).where(Actividad.aula_id == aula_id).order_by(Actividad.creado.desc())))

