# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy only backend-relevant files
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY lib/ ./lib/
COPY api/ ./api/

# Expose the FastAPI port
EXPOSE 8000

# Start the FastAPI server
CMD ["uvicorn", "lib.fastapi_server:app", "--host", "0.0.0.0", "--port", "8000"]
