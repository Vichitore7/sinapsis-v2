"""Tablas de la base de datos.

usuarios · aulas · aula_alumnos · aula_modulos · asignaciones · unidades · lecciones · ejercicios
intentos · progreso · estado_juego · mascotas · ajustes_usuario · diagnosticos
"""
from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def ahora() -> datetime:
    return datetime.now(timezone.utc)


# Regalo de bienvenida: dos stickers de traje típico de las trajineras de Xochimilco.
TRAJES_BIENVENIDA = ("trajinero", "trajinera")


# ---------------- Usuarios ----------------

class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario: Mapped[str] = mapped_column(String(20), unique=True, index=True)  # siempre en minúsculas
    apodo: Mapped[str] = mapped_column(String(30))  # lo que se muestra; nunca nombre completo
    rol: Mapped[str] = mapped_column(String(10))  # alumno | profesor | admin
    password_hash: Mapped[str] = mapped_column(String(255))
    recuperacion_hash: Mapped[str] = mapped_column(String(64))
    version_sesion: Mapped[int] = mapped_column(Integer, default=0)  # sube al cerrar sesión o recuperar: invalida tokens viejos
    avatar: Mapped[str | None] = mapped_column(String(50), nullable=True)
    grado: Mapped[str | None] = mapped_column(String(3), nullable=True)  # P1–P6 o S1–S3 (solo alumnos); elige su diagnóstico
    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)
    ultimo_acceso: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AjustesUsuario(Base):
    __tablename__ = "ajustes_usuario"

    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    tema: Mapped[str] = mapped_column(String(10), default="sistema")  # claro | oscuro | sistema
    idioma: Mapped[str] = mapped_column(String(10), default="es-MX")
    sonido: Mapped[bool] = mapped_column(Boolean, default=True)
    notificaciones: Mapped[bool] = mapped_column(Boolean, default=False)
    meta_diaria: Mapped[int] = mapped_column(Integer, default=3)  # retos por día


# ---------------- Aulas ----------------

class Aula(Base):
    __tablename__ = "aulas"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(60))
    codigo: Mapped[str] = mapped_column(String(7), unique=True, index=True)  # p. ej. X7K-92B
    profesor_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), index=True)
    nivel: Mapped[str | None] = mapped_column(String(40), nullable=True)  # p. ej. "Primaria • 5°"
    # False: basta el código para entrar. True: el profesor aprueba a cada alumno (evita filtraciones del código).
    requiere_aprobacion: Mapped[bool] = mapped_column(Boolean, default=False)
    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)

    alumnos: Mapped[list[AulaAlumno]] = relationship(cascade="all, delete-orphan", back_populates="aula")
    modulos: Mapped[list[AulaModulo]] = relationship(cascade="all, delete-orphan", order_by="AulaModulo.orden")
    asignaciones: Mapped[list[Asignacion]] = relationship(cascade="all, delete-orphan", back_populates="aula")


class AulaAlumno(Base):
    __tablename__ = "aula_alumnos"

    aula_id: Mapped[int] = mapped_column(ForeignKey("aulas.id", ondelete="CASCADE"), primary_key=True)
    alumno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    estado: Mapped[str] = mapped_column(String(10), default="activo")  # activo | pendiente
    unido: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)

    aula: Mapped[Aula] = relationship(back_populates="alumnos")
    alumno: Mapped[Usuario] = relationship()


class AulaModulo(Base):
    """Módulos (unidades) que el profesor ve en el año escolar con esa aula."""
    __tablename__ = "aula_modulos"

    aula_id: Mapped[int] = mapped_column(ForeignKey("aulas.id", ondelete="CASCADE"), primary_key=True)
    unidad_id: Mapped[str] = mapped_column(ForeignKey("unidades.id"), primary_key=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)


class Asignacion(Base):
    __tablename__ = "asignaciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    aula_id: Mapped[int] = mapped_column(ForeignKey("aulas.id", ondelete="CASCADE"), index=True)
    leccion_id: Mapped[str] = mapped_column(ForeignKey("lecciones.id", ondelete="CASCADE"))
    fecha_limite: Mapped[date | None] = mapped_column(Date, nullable=True)
    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)

    aula: Mapped[Aula] = relationship(back_populates="asignaciones")


# ---------------- Contenido ----------------
# Unidad = tema (Multiplicación, División...). Lección = un "mundo" de la selva. Ejercicio = un reto.

class Unidad(Base):
    __tablename__ = "unidades"

    id: Mapped[str] = mapped_column(String(30), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(60))
    orden: Mapped[int] = mapped_column(Integer)
    prerrequisito_id: Mapped[str | None] = mapped_column(ForeignKey("unidades.id"), nullable=True)
    proximamente: Mapped[bool] = mapped_column(Boolean, default=False)

    lecciones: Mapped[list[Leccion]] = relationship(order_by="Leccion.orden", back_populates="unidad")


class Leccion(Base):
    __tablename__ = "lecciones"

    id: Mapped[str] = mapped_column(String(30), primary_key=True)
    unidad_id: Mapped[str] = mapped_column(ForeignKey("unidades.id"))
    orden: Mapped[int] = mapped_column(Integer)
    nombre: Mapped[str] = mapped_column(String(60))
    entrada: Mapped[str] = mapped_column(Text)  # frase épica al entrar al mundo
    concepto: Mapped[str] = mapped_column(String(160))  # SQLite no revisa el largo, Postgres sí
    sticker: Mapped[str] = mapped_column(String(30))  # premio del cofre
    estado_revision: Mapped[str] = mapped_column(String(20), default="borrador")  # borrador | verificado | revisado | publicado

    unidad: Mapped[Unidad] = relationship(back_populates="lecciones")
    ejercicios: Mapped[list[Ejercicio]] = relationship(order_by="Ejercicio.orden", back_populates="leccion")


class Ejercicio(Base):
    __tablename__ = "ejercicios"

    id: Mapped[str] = mapped_column(String(30), primary_key=True)
    leccion_id: Mapped[str] = mapped_column(ForeignKey("lecciones.id"), index=True)
    orden: Mapped[int] = mapped_column(Integer)
    tipo: Mapped[str] = mapped_column(String(20), default="numerica")  # numerica | opcion_multiple | ordenar_pasos
    titulo: Mapped[str] = mapped_column(String(80))
    enunciado: Mapped[str] = mapped_column(Text)
    datos: Mapped[dict] = mapped_column(JSON)  # {a, b, op, moneda, objeto, etapa_min, ejemplo, opciones?}
    respuesta: Mapped[str] = mapped_column(String(100))  # NUNCA se manda al frontend antes de acertar
    pistas: Mapped[list] = mapped_column(JSON)  # [pista 1, pista 2, pista 3]
    dificultad: Mapped[int] = mapped_column(Integer, default=1)
    explicacion: Mapped[str] = mapped_column(Text, default="")

    leccion: Mapped[Leccion] = relationship(back_populates="ejercicios")


# ---------------- Progreso ----------------

class Intento(Base):
    __tablename__ = "intentos"

    id: Mapped[int] = mapped_column(primary_key=True)
    alumno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), index=True)
    ejercicio_id: Mapped[str] = mapped_column(ForeignKey("ejercicios.id"), index=True)
    respuesta: Mapped[str] = mapped_column(String(100))
    correcto: Mapped[bool] = mapped_column(Boolean)
    tipo_error: Mapped[str | None] = mapped_column(String(20), nullable=True)  # sumo | calculo
    pistas_usadas: Mapped[int] = mapped_column(Integer, default=0)
    tiempo_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)


class Progreso(Base):
    """Un renglón por reto superado."""
    __tablename__ = "progreso"
    __table_args__ = (UniqueConstraint("alumno_id", "ejercicio_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    alumno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), index=True)
    ejercicio_id: Mapped[str] = mapped_column(ForeignKey("ejercicios.id"))
    estrellas: Mapped[int] = mapped_column(Integer)
    con_ayuda: Mapped[bool] = mapped_column(Boolean)
    fecha: Mapped[date] = mapped_column(Date)


class EstadoJuego(Base):
    """Estrellas, escalera de apoyo, cofres, stickers y racha de un alumno."""
    __tablename__ = "estado_juego"

    alumno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    estrellas: Mapped[int] = mapped_column(Integer, default=0)  # se gastan en cuidados
    xp: Mapped[int] = mapped_column(Integer, default=0)  # estrellas ganadas en total (no se gastan): da el nivel
    etapa_apoyo: Mapped[int] = mapped_column(Integer, default=1)
    racha_sin_pistas: Mapped[int] = mapped_column(Integer, default=0)
    ultimo_bono_dia: Mapped[date | None] = mapped_column(Date, nullable=True)
    lecciones_terminadas: Mapped[list] = mapped_column(JSON, default=list)
    stickers: Mapped[list] = mapped_column(JSON, default=list)
    ejemplos_vistos: Mapped[list] = mapped_column(JSON, default=list)
    racha_dias: Mapped[int] = mapped_column(Integer, default=0)
    ultima_actividad: Mapped[date | None] = mapped_column(Date, nullable=True)
    stats: Mapped[dict] = mapped_column(JSON, default=dict)  # cuidados, pistas_pedidas, retos_sin_ayuda


class Mascota(Base):
    """El ajolote del alumno. Los medidores bajan solo al jugar (no con el tiempo)."""
    __tablename__ = "mascotas"

    alumno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(20), default="Mix")
    comida: Mapped[int] = mapped_column(Integer, default=4)
    pecera: Mapped[int] = mapped_column(Integer, default=4)
    alegria: Mapped[int] = mapped_column(Integer, default=4)
    dormido: Mapped[bool] = mapped_column(Boolean, default=False)
    cuidados_hasta: Mapped[dict] = mapped_column(JSON, default=dict)
    retos_desde_bajada: Mapped[int] = mapped_column(Integer, default=0)
    turno_medidor: Mapped[int] = mapped_column(Integer, default=0)
    # Trajes típicos que el alumno tiene (regalo de bienvenida al crear la cuenta) y el que trae puesto.
    trajes: Mapped[list] = mapped_column(JSON, default=lambda: list(TRAJES_BIENVENIDA))
    traje: Mapped[str | None] = mapped_column(String(20), nullable=True)
    actualizado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora, onupdate=ahora)


class Diagnostico(Base):
    """Examen diagnóstico que el alumno hace al entrar por primera vez."""
    __tablename__ = "diagnosticos"

    alumno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    resultados: Mapped[dict] = mapped_column(JSON)  # {habilidad: true/false}
    aciertos: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)
    grado: Mapped[str | None] = mapped_column(String(3), nullable=True)  # examen de qué grado hizo (None = el general)


class ExamenMundo(Base):
    """Examen general al final de un mundo (hoy: El Canal de los Números).

    `detalle` guarda todo lo que pasó en cada pregunta para el reporte del profesor:
    {pregunta_id: {"intentos": [{"respuesta", "correcto", "tiempo_ms"}], "pistas": n, "estado": ..., "tiempo_ms": n}}
    estado de cada pregunta: pendiente | a_la_primera | con_ayuda | por_reforzar
    """
    __tablename__ = "examenes_mundo"
    __table_args__ = (UniqueConstraint("alumno_id", "leccion_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    alumno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), index=True)
    leccion_id: Mapped[str] = mapped_column(ForeignKey("lecciones.id"))
    detalle: Mapped[dict] = mapped_column(JSON, default=dict)
    terminado: Mapped[bool] = mapped_column(Boolean, default=False)
    aciertos: Mapped[int] = mapped_column(Integer, default=0)  # preguntas logradas (a la primera o con ayuda)
    total: Mapped[int] = mapped_column(Integer, default=0)
    premio: Mapped[list] = mapped_column(JSON, default=list)  # trajes ganados al terminar
    inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)
    fin: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Habitacion(Base):
    """Una habitación por alumno; revisión para evitar sobrescribir cambios de otro dispositivo."""
    __tablename__ = "habitaciones"
    alumno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    objetos: Mapped[list] = mapped_column(JSON, default=list)
    revision: Mapped[int] = mapped_column(Integer, default=0)


class StickerAdquirido(Base):
    """Una copia de cada diseño por alumno; conserva el precio realmente pagado."""
    __tablename__ = "inventario_habitacion"
    alumno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    sticker_id: Mapped[str] = mapped_column(String(30), primary_key=True)
    precio: Mapped[int] = mapped_column(Integer, default=0)
    adquirido: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)

