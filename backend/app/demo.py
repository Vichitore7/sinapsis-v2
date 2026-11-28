"""Cuentas de demostración para la app publicada (Foundathyon).

Se crean al arrancar solo si existe la variable DEMO_PASSWORD (la contraseña de todas las cuentas demo; nunca se
escribe en el código). Si ya existen, no se toca nada. Para probarlo en local:

    DEMO_PASSWORD=algo-secreto uv run python -m app.demo

Cuentas (todas con DEMO_PASSWORD):
- profe_mix: profesora con el grupo "3.º A" (3.º de primaria) y 4 tareas, una por módulo.
- nuevo_mix: alumno recién llegado (sin diagnóstico ni avance; tiene las tareas pendientes).
- experto_mix: alumno que ya terminó todos los niveles del Mapa y casi todas sus tareas.
- luna_mix, sol_mix, rio_mix, ame_mix, leo_mix: compañeros con avances distintos para que la gráfica
  del profesor tenga dificultad / comprende / domina.

Todo se registra con las mismas funciones que usa la app (escaneos, retos, exámenes), así que los datos son
coherentes con lo que mostrarían las pantallas si alguien hubiera jugado de verdad.
"""
from __future__ import annotations

import logging
import os
import random
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import actividades, aprendizaje, diagnostico, operaciones, servicio
from .modelos import Aula, AulaAlumno, AulaModulo, Diagnostico, Usuario
from .seguridad import codigo_aula, hash_password, hash_recuperacion, nuevo_codigo_recuperacion

log = logging.getLogger("selva")

PROFE = "profe_mix"
NUEVO = "nuevo_mix"
EXPERTO = "experto_mix"
GRADO = "P3"

# usuario → (apodo, cómo le va por módulo). Resultados por problema:
#   "bien" (a la primera), "ayuda" (se equivocó y lo corrigió con Mix), "mal" (se equivocó y no lo ha corregido),
#   "-" (no lo ha escaneado). Si todos los problemas pasaron por el escáner, la tarea queda entregada.
ALUMNOS: dict[str, tuple[str, dict[str, list[str]]]] = {
    EXPERTO: ("Teo", {"suma-resta": ["bien"] * 4, "multiplicacion": ["bien", "bien", "bien", "ayuda"],
                      "division": ["bien", "ayuda", "bien", "bien"], "fracciones": ["bien", "bien", "-", "-"]}),
    "luna_mix": ("Luna", {"suma-resta": ["bien", "ayuda", "bien", "bien"], "multiplicacion": ["ayuda", "bien", "bien", "ayuda"],
                          "division": ["ayuda", "mal", "ayuda", "mal"], "fracciones": ["bien", "ayuda", "-", "-"]}),
    "sol_mix": ("Sol", {"suma-resta": ["bien"] * 4, "multiplicacion": ["bien", "bien", "bien", "bien"],
                        "division": ["bien", "ayuda", "bien", "ayuda"], "fracciones": ["mal", "mal", "ayuda", "-"]}),
    "rio_mix": ("Río", {"suma-resta": ["ayuda", "mal", "ayuda", "mal"], "multiplicacion": ["mal", "ayuda", "mal", "mal"],
                        "division": ["mal", "mal", "ayuda", "-"], "fracciones": []}),
    "ame_mix": ("Ame", {"suma-resta": ["bien", "bien", "ayuda", "bien"], "multiplicacion": ["ayuda", "ayuda", "bien", "bien"],
                        "division": ["bien", "bien", "bien", "ayuda"], "fracciones": ["bien", "bien", "bien", "bien"]}),
    "leo_mix": ("Leo", {"suma-resta": ["ayuda", "bien", "mal", "ayuda"], "multiplicacion": ["sumo", "ayuda", "bien", "mal"],
                        "division": ["ayuda", "ayuda", "-", "-"], "fracciones": ["mal", "-", "-", "-"]}),
    NUEVO: ("Nico", {}),
}

# Tareas del grupo (banco de 3.º de primaria): (módulo, título, instrucciones, días para la fecha límite, problemas).
TAREAS = [
    ("suma-resta", "Sumas y restas con transformación", "Resuelve en tu cuaderno y escanea la página. Revisa si llevas o pides prestado.", -6,
     [("345", "+", "268", ""), ("702", "−", "358", ""), ("489", "+", "236", ""), ("600", "−", "245", "")]),
    ("multiplicacion", "Multiplicaciones de la semana", "Piensa cada multiplicación como grupos iguales.", -3,
     [("23", "×", "4", ""), ("15", "×", "20", ""), ("7", "×", "8", ""), ("30", "×", "6", "")]),
    ("division", "Repartos en la cafetería", "Escribe el cociente y, si sobra, el residuo.", 2,
     [("36", "÷", "4", "En la cafetería hay 36 tortas para 4 mesas. ¿Cuántas van en cada mesa?"),
      ("47", "÷", "5", "Se acomodan 47 sillas en filas de 5. ¿Cuántas filas completas salen y cuántas sobran?"),
      ("56", "÷", "7", ""), ("29", "÷", "3", "")]),
    ("fracciones", "Fracciones con el mismo denominador", "Dibuja la pizza si te ayuda.", 6,
     [("1/4", "+", "2/4", "Comiste 1/4 de pizza y luego 2/4 más. ¿Cuánta pizza comiste?"),
      ("3/8", "+", "1/8", ""), ("5/8", "−", "2/8", ""), ("3/4", "−", "1/4", "")]),
]

DIBUJO = {"suma-resta": "decenas", "multiplicacion": "grupos", "division": "objetos", "fracciones": "figura"}


def _usuario(db: Session, usuario: str, apodo: str, rol: str, password: str, grado: str | None) -> Usuario:
    u = Usuario(usuario=usuario, apodo=apodo, rol=rol, password_hash=hash_password(password),
                recuperacion_hash=hash_recuperacion(nuevo_codigo_recuperacion()), grado=grado)
    db.add(u)
    db.flush()
    return u


def _equivocada(op: dict) -> dict:
    """Una respuesta con un error típico (el que un alumno de 3.º comete de verdad)."""
    a, o, b = op["a"], op["op"], op["b"]
    if operaciones.tipo(op) == "fracciones":
        fa, fb = operaciones.numero(a), operaciones.numero(b)
        # Juntó numeradores y también denominadores: 1/4 + 2/4 = 3/8.
        n = fa.numerator + fb.numerator if o == "+" else max(fa.numerator - fb.numerator, 0)
        return {**op, "c": f"{n}/{fa.denominator + fb.denominator if o == '+' else fa.denominator}"}
    A, B = int(a), int(b)
    if o == "÷":
        if A % 2:  # residuo más grande que el divisor
            return {**op, "c": str(A // B - 1), "residuo": str(A % B + B)}
        return {**op, "c": str(A // B + 1), "residuo": str(A % B) if A % B else ""}  # se pasó en el cociente
    if o == "×":
        return {**op, "c": str(A * B - B)}  # le faltó un grupo
    if o == "+":
        return {**op, "c": str(A + B - 10 if (A % 10) + (B % 10) >= 10 else A + B + 1)}  # no llevó
    return {**op, "c": str(A - B + 10 if (A % 10) < (B % 10) else A - B - 1)}  # no pidió prestado


def _correcta(op: dict) -> dict:
    r = operaciones.resultado(op)
    if "cociente" in r:
        return {**op, "c": str(r["cociente"]), "residuo": str(r["residuo"]) if r["residuo"] else ""}
    return {**op, "c": operaciones.texto(r["valor"]), "residuo": ""}


def _escanear(db: Session, alumno: Usuario, act: actividades.Actividad, problema_id: str, op: dict) -> None:
    """Como POST de un escaneo: registra y guarda (cada escaneo es su propia petición en la app)."""
    actividades.registrar_escaneo(db, alumno.id, act, problema_id, op)
    db.commit()


def _resolver_tarea(db: Session, alumno: Usuario, act: actividades.Actividad, resultados: list[str]) -> None:
    for p, res in zip(act.problemas, resultados):
        if res == "-":
            continue
        op = operaciones.validar({"a": p["a"], "op": p["op"], "b": p["b"], "c": ""})
        if res == "sumo":  # sumó en lugar de multiplicar
            _escanear(db, alumno, act, p["id"], {**op, "c": str(int(op["a"]) + int(op["b"]))})
            continue
        if res in ("ayuda", "mal"):
            _escanear(db, alumno, act, p["id"], _equivocada(op))
        if res == "ayuda":
            concepto, nombre = aprendizaje.concepto_de_operacion(op)
            aprendizaje.registrar_ayuda_tutor(db, alumno.id, concepto, nombre, DIBUJO[act.modulo])
            db.commit()
        if res in ("bien", "ayuda"):
            _escanear(db, alumno, act, p["id"], _correcta(op))
    av = db.get(actividades.AvanceActividad, (alumno.id, act.id))
    if av and actividades.puede_entregar(act, av):
        av.entregada = datetime.now(timezone.utc)


def _diagnostico(db: Session, alumno: Usuario, rnd: random.Random, nivel: float) -> None:
    """Examen diagnóstico de entrada: acierta más o menos según `nivel` (0 a 1)."""
    respuestas = {p["id"]: (p["respuestas"][0] if rnd.random() < nivel else None) for p in diagnostico.preguntas(GRADO)}
    r = diagnostico.calificar(respuestas, GRADO)
    db.add(Diagnostico(alumno_id=alumno.id, resultados=r, aciertos=sum(r.values()), total=len(r), grado=GRADO))


def _terminar_mapa(db: Session, alumno: Usuario, rnd: random.Random) -> None:
    """Juega todos los mundos abiertos en orden, como lo haría el alumno (con algunas pistas y errores)."""
    for _ in range(20):  # cada vuelta abre el mundo siguiente; para cuando ya no hay nada que jugar
        est, _m = servicio.estado_de(db, alumno)
        mapa = servicio.estado_mapa(db, est, servicio.completados_de(db, alumno.id))
        pendiente = next(((u, l) for u, l in servicio.lecciones_en_orden(db)
                          if l is not None and mapa.get(l.id, {}).get("abierta") and l.id not in est.lecciones_terminadas), None)
        if pendiente is None:
            return
        _u, leccion = pendiente
        for e in leccion.ejercicios:
            if e.id in servicio.completados_de(db, alumno.id):
                continue
            if e.tipo == "numerica" and rnd.random() < 0.12:  # de vez en cuando se equivoca y lo corrige
                try:
                    servicio.registrar_intento(db, alumno, e.id, str(int(e.respuesta) + 1), 0, 25_000)
                except Exception:  # noqa: BLE001 - una respuesta que el reto no acepta: solo se omite el error
                    db.rollback()
            servicio.registrar_intento(db, alumno, e.id, e.respuesta, 1 if rnd.random() < 0.15 else 0, rnd.randint(8, 40) * 1000)
        if leccion.id in servicio.EXAMENES:
            examen = servicio.examen_mundo(db, alumno, leccion.id)
            for p in servicio._preguntas_examen(leccion.id):
                servicio.responder_examen(db, alumno, leccion.id, p["id"], p["respuesta"], 0, rnd.randint(10, 45) * 1000)
            fin = servicio.terminar_examen(db, alumno, leccion.id)
            premio = fin["examen"]["premio"] or examen["premio"]
            if premio:
                servicio.vestir(db, alumno, premio[0]["id"])  # ponerse el traje abre el mundo siguiente
        else:
            servicio.abrir_cofre(db, alumno, leccion.id)


def crear(db: Session, password: str) -> bool:
    """Crea las cuentas demo si no existen. Regresa True si las creó."""
    if db.scalar(select(Usuario).where(Usuario.usuario == PROFE)):
        return False
    rnd = random.Random(2026)
    profe = _usuario(db, PROFE, "Profe Mix", "profesor", password, None)
    aula = Aula(nombre="3.º A", codigo=codigo_aula(), profesor_id=profe.id, nivel="Primaria • 3°")
    aula.modulos = [AulaModulo(unidad_id=u, orden=i) for i, u in enumerate(("suma-resta", "multiplicacion", "division", "fracciones"))]
    db.add(aula)
    db.flush()

    hoy = date.today()
    tareas = []
    for modulo, titulo, instrucciones, dias, problemas in TAREAS:
        act = actividades.Actividad(
            aula_id=aula.id, titulo=titulo, modulo=modulo, instrucciones=instrucciones, material="",
            fecha_limite=hoy + timedelta(days=dias),
            problemas=actividades.normalizar_problemas([{"a": a, "op": o, "b": b, "enunciado": t} for a, o, b, t in problemas], modulo))
        db.add(act)
        tareas.append(act)
    db.flush()

    alumnos = {}
    for usuario, (apodo, _r) in ALUMNOS.items():
        alumnos[usuario] = _usuario(db, usuario, apodo, "alumno", password, GRADO)
        db.add(AulaAlumno(aula_id=aula.id, alumno_id=alumnos[usuario].id))
    db.commit()

    niveles = {EXPERTO: 0.95, "luna_mix": 0.6, "sol_mix": 0.8, "rio_mix": 0.35, "ame_mix": 0.85, "leo_mix": 0.5}
    for usuario, (_apodo, resultados) in ALUMNOS.items():
        alumno = alumnos[usuario]
        if usuario == NUEVO:
            continue  # recién llegado: sin diagnóstico (lo hace al entrar) ni avance
        _diagnostico(db, alumno, rnd, niveles[usuario])
        for act in tareas:
            _resolver_tarea(db, alumno, act, resultados.get(act.modulo, []))
        alumno.ultimo_acceso = datetime.now(timezone.utc) - timedelta(hours=rnd.randint(1, 72))
        db.commit()

    _terminar_mapa(db, alumnos[EXPERTO], rnd)
    db.commit()
    log.info("Cuentas demo creadas: %s, %s, %s y 5 compañeros en el aula %s.", PROFE, NUEVO, EXPERTO, aula.codigo)
    return True


if __name__ == "__main__":
    from .db import Base, SesionLocal, engine, migrar_columnas
    from .semilla import cargar_contenido

    clave = os.environ.get("DEMO_PASSWORD", "")
    if len(clave) < 6:
        raise SystemExit("Define DEMO_PASSWORD (mínimo 6 caracteres).")
    logging.basicConfig(level=logging.INFO)
    Base.metadata.create_all(engine)
    migrar_columnas(engine)
    with SesionLocal() as sesion:
        cargar_contenido(sesion)
        print("Creadas." if crear(sesion, clave) else "Ya existían; no se cambió nada.")
