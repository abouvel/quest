# Use an official Python runtime as a parent image.
FROM python:3.10-slim-buster

# Set the working directory in the container.
WORKDIR /app

# --- Install Node.js and npm ---
# This is required for building and running the Next.js frontend.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# --- Optimize Node.js dependency installation and build caching ---
# Copy package.json and package-lock.json first to leverage Docker cache.
# If only these files change, npm install will re-run.
# If your application code changes (but not these files), this layer will be cached.
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# --- Optimize Python dependency installation and build caching ---
# Copy requirements.txt first to leverage Docker cache.
# If only this file changes, pip install will re-run.
# If your application code changes (but not this file), this layer will be cached.
COPY requirements.txt ./
# IMPORTANT: Increased --timeout to prevent read timeouts during package downloads.
RUN pip install --no-cache-dir --timeout 600 -r requirements.txt

# --- Build the Next.js frontend ---
# This step needs the full application code, so it comes after initial dependency installs.
# We copy all remaining application code here.
COPY . .
RUN npm run build

# Make start.sh executable
RUN chmod +x start.sh

# Expose ports for FastAPI (8000) and Next.js (3000)
EXPOSE 8000
EXPOSE 3000

# Start both FastAPI and Next.js using the start.sh script
CMD ["./start.sh"]
