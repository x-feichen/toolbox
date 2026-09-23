# ToolBox API — production image
# Base images (python:3.13-slim, ghcr.io/astral-sh/uv) are pulled at build time.
FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:0.12.6 /uv /usr/local/bin/uv

WORKDIR /app

# Dependency install (cached layer); use a China mirror by default — remove
# the UV_DEFAULT_INDEX line if you have direct PyPI access.
ENV UV_DEFAULT_INDEX=https://pypi.tuna.tsinghua.edu.cn/simple
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev

COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app

EXPOSE 8000

# Apply migrations before serving; DATABASE_URL comes from the environment.
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"]
