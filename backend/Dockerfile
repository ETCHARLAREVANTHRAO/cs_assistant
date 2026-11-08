FROM python:3.11-slim

WORKDIR /app

# Install system dependencies:
# - tesseract-ocr: required by pytesseract for image and scanned-PDF text extraction
# - libgomp1: required by onnxruntime (fastembed) OpenMP runtime
# - curl: for healthcheck and container inspection
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the fastembed model at build time so it's cached and never fetched at runtime
RUN python -c "from fastembed import TextEmbedding; TextEmbedding('BAAI/bge-small-en-v1.5')"

COPY . .

# Render defaults web services to port 10000, local dev defaults to port 8000
ENV PORT=10000
EXPOSE 10000 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
