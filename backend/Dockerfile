FROM python:3.11-slim

# Install Tectonic dependencies and the binary
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates \
    libgraphite2-3 libharfbuzz0b libicu-dev libfontconfig1 \
    && curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh \
    && mv tectonic /usr/local/bin/ \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create user for HF Spaces (UID 1000 required)
RUN useradd -m -u 1000 user
USER user

ENV HOME=/home/user
ENV PATH=/home/user/.local/bin:$PATH
ENV HF_HOME=/home/user/.cache/huggingface

WORKDIR /home/user/app

# Install Python dependencies first (better caching)
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Pre-download Qwen model as the correct user (avoids permission issues)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('Qwen/Qwen3-Embedding-0.6B')"

# Copy application code
COPY --chown=user . .

# Set template directory for Docker environment
ENV TEMPLATES_DIR=/home/user/app/templates

EXPOSE 7860
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]
