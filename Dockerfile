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

# FastEmbed cache baked into the image to avoid downloading model weights at runtime (Heroku dynos are ephemeral).
ENV FASTEMBED_CACHE_PATH=/opt/fastembed_cache
ENV HF_HUB_DISABLE_TELEMETRY=1

COPY backend/pyproject.toml backend/uv.lock backend/README.md ./
RUN pip install --no-cache-dir uv \
  && uv sync --frozen

# Pre-download default embedding model during build so runtime can work without network.
# If you change PN_EMBEDDINGS_MODEL at runtime to a different model, you may need to allow network again.
ARG PN_EMBEDDINGS_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
RUN mkdir -p "$FASTEMBED_CACHE_PATH" \
  && HF_HUB_OFFLINE=0 uv run python -c "import warnings; warnings.filterwarnings('ignore', message=r'.*mean pooling instead of CLS embedding.*'); from fastembed import TextEmbedding; m=TextEmbedding(model_name='${PN_EMBEDDINGS_MODEL}'); list(m.embed(['warmup']))"
ENV HF_HUB_OFFLINE=1

COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./alembic.ini

# Serve SPA assets (built by Vite)
COPY --from=frontend-build /frontend/dist ./app/static

EXPOSE 8000

# Heroku sets $PORT dynamically; locally we default to 8000.
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
