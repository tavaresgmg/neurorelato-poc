# Production image: build frontend, then serve static via backend

FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim AS backend
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY backend/pyproject.toml backend/uv.lock backend/README.md ./
RUN pip install --no-cache-dir uv \
  && uv sync --frozen

COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./alembic.ini

# Serve SPA assets (built by Vite)
COPY --from=frontend-build /frontend/dist ./app/static

EXPOSE 8000

# Heroku sets $PORT dynamically; locally we default to 8000.
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
