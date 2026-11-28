"""Configuración por variables de entorno (ver .env.example). Nada secreto se escribe en el código."""
from __future__ import annotations

import os
import secrets
import warnings
from pathlib import Path


def _cargar_env() -> None:
    """Carga backend/.env si existe (sin dependencias extra). Las variables reales del sistema mandan."""
    ruta = Path(__file__).resolve().parent.parent / ".env"
    if not ruta.exists():
        return
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        linea = linea.strip()
        if not linea or linea.startswith("#") or "=" not in linea:
            continue
        clave, valor = linea.split("=", 1)
        os.environ.setdefault(clave.strip(), valor.strip().strip('"').strip("'"))


_cargar_env()

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./selva.db")
# Los servicios de Postgres (Foundathyon, Neon…) dan "postgres://" o "postgresql://"; SQLAlchemy usa psycopg 3 con "postgresql+psycopg://".
for _prefijo in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(_prefijo):
        DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL.removeprefix(_prefijo)
ENTORNO = os.environ.get("ENTORNO", "desarrollo")  # desarrollo | produccion

SECRET_KEY = os.environ.get("SECRET_KEY", "")
if not SECRET_KEY:
    if ENTORNO == "produccion":
        raise RuntimeError("Falta SECRET_KEY en producción.")
    warnings.warn("SECRET_KEY no definida: se usa una temporal (las sesiones se cierran al reiniciar).")
    SECRET_KEY = secrets.token_urlsafe(32)

# Orígenes permitidos para CORS (separados por coma). En desarrollo el frontend usa el proxy de Vite.
CORS_ORIGENES = [o.strip() for o in os.environ.get("CORS_ORIGENES", "http://localhost:5173").split(",") if o.strip()]

SESION_DIAS = int(os.environ.get("SESION_DIAS", "30"))

# Tutor de IA (app/tutor.py). Sin ANTHROPIC_API_KEY el tutor usa las pistas por reglas y nada se rompe.
# La clave la lee el SDK de anthropic directo del entorno; nunca se escribe en el código ni se manda al navegador.
TUTOR_ACTIVO = bool(os.environ.get("ANTHROPIC_API_KEY", "").strip())
TUTOR_MODELO = os.environ.get("TUTOR_MODELO", "claude-haiku-5-5")
TUTOR_ESFUERZO = os.environ.get("TUTOR_ESFUERZO", "medium")  # low | medium | high (24 nov: low "reciclaba"; probando medium)
LECTOR_MODELO = os.environ.get("LECTOR_MODELO", TUTOR_MODELO)  # lee la foto; si Haiku falla, probar claude-sonnet-5-5
TUTOR_LIMITE_HORA = int(os.environ.get("TUTOR_LIMITE_HORA", "40"))  # mensajes a Claude por alumno; después, reglas
TUTOR_LIMITE_DIA = int(os.environ.get("TUTOR_LIMITE_DIA", "150"))
# Material de estudio que lee el tutor junto con su manual (app/agente.md). Por defecto, el de docs/ del repo.
MATERIAL_DIR = Path(os.environ.get("MATERIAL_DIR", Path(__file__).resolve().parents[2] / "docs" / "material-de-estudio"))
COOKIE_SEGURA = ENTORNO == "produccion"  # cookie solo por HTTPS en producción
# Frontend ya construido (npm run build). Si existe, el backend lo sirve en "/" y todo queda en un mismo dominio (deploy).
FRONTEND_DIR = Path(os.environ.get("FRONTEND_DIR", Path(__file__).resolve().parents[2] / "frontend" / "dist"))
SERVIR_FRONTEND = os.environ.get("SERVIR_FRONTEND", "1" if ENTORNO == "produccion" else "0") == "1"
# Cuentas de demostración (app/demo.py): se crean al arrancar solo si hay contraseña. Nunca se escribe en el código.
DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "").strip()
