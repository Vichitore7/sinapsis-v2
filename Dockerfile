# Mix en un solo servicio: FastAPI sirve la API (/api) y el frontend ya construido (/).
# Construir y probar en local:
#   docker build -t mix .
#   docker run --rm -p 8000:8000 -e SECRET_KEY=prueba mix      (sin DATABASE_URL usa SQLite dentro del contenedor)

# 1) Frontend: React + Vite → frontend/dist
FROM node:22.12.0-alpine AS frontend
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2) Backend: FastAPI con uv
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PROJECT_ENVIRONMENT=/app/.venv \
    PYTHONUNBUFFERED=1 ENTORNO=produccion PORT=8000
WORKDIR /app/backend
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY backend/app ./app
# El tutor lee el material de estudio junto con su manual (config.MATERIAL_DIR).
COPY docs/material-de-estudio /app/docs/material-de-estudio
COPY --from=frontend /src/frontend/dist /app/frontend/dist

# Sin permisos de administrador
RUN useradd --create-home --uid 10001 mix && chown -R mix /app/backend
USER mix

EXPOSE 8000
# Un solo proceso (256 MB de memoria). --proxy-headers: la plataforma pone el HTTPS delante.
CMD ["sh", "-c", "exec /app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
