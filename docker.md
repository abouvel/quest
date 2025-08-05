# Docker Setup and Deployment

This document covers Docker deployment for the Quest backend application.

## Docker Configuration

The application uses a Python 3.11-slim base image optimized for the FastAPI backend.

### Dockerfile Breakdown

```dockerfile
FROM python:3.11-slim      # Lightweight Python runtime
WORKDIR /app               # Set container working directory
COPY requirements.txt ./   # Copy Python dependencies
RUN pip install --no-cache-dir -r requirements.txt  # Install dependencies
COPY lib/ ./lib/          # Copy backend logic
COPY api/ ./api/          # Copy API modules
EXPOSE 8000               # Expose FastAPI port
CMD ["uvicorn", "lib.fastapi_server:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Environment Setup

Create a `.env` file with required variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Build and Run

### Single Container (Backend Only)

Build the Docker image:
```bash
docker build -t quest-backend .
```

Run the container:
```bash
docker run -p 8000:8000 --env-file .env quest-backend
```

### Docker Compose (Development)

The `docker-compose.yaml` configuration supports both frontend and backend:

```yaml
version: '3.8'
services:
  web:
    build: .
    container_name: dev-app
    ports:
      - "8000:8000"  # FastAPI backend
      - "3000:3000"  # Next.js frontend
    volumes:
      - ./:/app      # Hot reload support
    env_file:
      - .env
    command: ["./start.sh"]
```

Start with Docker Compose:
```bash
docker-compose up --build
```

## Production Deployment

### Backend-Only Production Build

For production deployment of just the backend:

```bash
# Build production image
docker build -t quest-backend:prod .

# Run production container
docker run -d \
  --name quest-backend-prod \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  quest-backend:prod
```

### Health Checks

Add health check to Dockerfile for production:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/admin || exit 1
```

## Container Management

### View logs:
```bash
docker logs quest-backend-prod
```

### Execute commands in container:
```bash
docker exec -it quest-backend-prod bash
```

### Stop and remove:
```bash
docker stop quest-backend-prod
docker rm quest-backend-prod
```

## API Access

Once running, the FastAPI backend is available at:
- **Development**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Test Endpoints

```bash
# Health check
curl http://localhost:8000/admin

# Generate quest (POST request)
curl -X POST http://localhost:8000/quests \
  -H "Content-Type: application/json" \
  -d '{
    "user": {"interests": ["hiking"], "location": "SF", "preference": "outdoor"},
    "questTitles": [],
    "userId": "test123",
    "coords": {"latitude": 37.7749, "longitude": -122.4194}
  }'
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure port 8000 is not in use
2. **Environment variables**: Verify `.env` file exists and contains all required variables
3. **Dependencies**: Check `requirements.txt` includes all necessary packages
4. **Google ADK**: Ensure Google credentials are properly configured

### Debug Container

Run container with interactive shell:
```bash
docker run -it --env-file .env quest-backend bash
```