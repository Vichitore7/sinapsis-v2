"""Crea las tablas y carga el contenido. Con --demo también crea usuarios y un aula de prueba.

    uv run python -m app.semilla          # solo contenido
    uv run python -m app.semilla --demo   # + profe_demo / alumno_demo (contraseña: selva123)
"""
from __future__ import annotations

import sys

from sqlalchemy import select
from sqlalchemy.orm import Session

from .contenido import UNIDADES, ejercicio_multiplicacion
from .db import Base, SesionLocal, engine
from .modelos import Aula, AulaAlumno, Ejercicio, Leccion, Unidad, Usuario
from .seguridad import codigo_aula, hash_password, hash_recuperacion, nuevo_codigo_recuperacion


def cargar_contenido(db: Session) -> None:
    """Inserta o actualiza el contenido (se puede correr varias veces)."""
    for u in UNIDADES:
        unidad = db.get(Unidad, u["id"]) or Unidad(id=u["id"])
        unidad.nombre, unidad.orden = u["nombre"], u["orden"]
        unidad.prerrequisito_id = u["prerrequisito"]
        unidad.proximamente = u.get("proximamente", False)
        db.merge(unidad)
        db.flush()
        for i, l in enumerate(u["lecciones"], start=1):
            leccion = db.get(Leccion, l["id"]) or Leccion(id=l["id"])
            leccion.unidad_id, leccion.orden, leccion.nombre = u["id"], i, l["nombre"]
            leccion.entrada, leccion.concepto, leccion.sticker = l["entrada"], l["concepto"], l["sticker"]
            db.merge(leccion)
            db.flush()
            for j, (id_, titulo, enunciado, a, b, objeto, etapa) in enumerate(l["retos"], start=1):
                datos = ejercicio_multiplicacion(id_, j, titulo, enunciado, a, b, objeto, etapa,
                                                 l.get("ejemplo") if j == 1 else None)
                db.merge(Ejercicio(leccion_id=l["id"], **datos))
    db.commit()


def crear_demo(db: Session) -> None:
    def usuario(nombre: str, apodo: str, rol: str) -> Usuario:
        u = db.scalar(select(Usuario).where(Usuario.usuario == nombre))
        if u:
            return u
        u = Usuario(usuario=nombre, apodo=apodo, rol=rol, password_hash=hash_password("selva123"),
                    recuperacion_hash=hash_recuperacion(nuevo_codigo_recuperacion()))
        db.add(u)
        db.flush()
        return u

    profe = usuario("profe_demo", "Profe Demo", "profesor")
    alumnos = [usuario(n, n.split("_")[0].capitalize(), "alumno") for n in ("luna_demo", "teo_demo", "sol_demo")]
    aula = db.scalar(select(Aula).where(Aula.profesor_id == profe.id))
    if not aula:
        aula = Aula(nombre="5.º B", codigo=codigo_aula(), profesor_id=profe.id)
        db.add(aula)
        db.flush()
        for a in alumnos:
            db.add(AulaAlumno(aula_id=aula.id, alumno_id=a.id))
    db.commit()
    print(f"Demo listo. Profesor: profe_demo · Alumnos: luna_demo, teo_demo, sol_demo · Contraseña: selva123 · Código del aula: {aula.codigo}")


def main() -> None:
    Base.metadata.create_all(engine)
    with SesionLocal() as db:
        cargar_contenido(db)
        print("Contenido cargado.")
        if "--demo" in sys.argv:
            crear_demo(db)


if __name__ == "__main__":
    main()
