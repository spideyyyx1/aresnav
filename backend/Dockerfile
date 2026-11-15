FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY app/ ./app/
COPY data/ ./data/

ENV ARESNAV_API_HOST=0.0.0.0
ENV ARESNAV_API_PORT=8000
ENV ARESNAV_CORS_ORIGINS=*

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
