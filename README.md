# Quest - Location-Based Quest Generation App

A fullstack web application that generates personalized quests using Google's ADK (Agent Development Kit) based on user location, preferences, and completed activities.

## Architecture

**Backend**: FastAPI with Google ADK multiagent system  
**Database**: Supabase (PostgreSQL)  
**Maps**: Google Maps API  
**Deployment**: Docker containers

## Backend Overview

The backend is built with FastAPI and leverages Google's Agent Development Kit (ADK) for intelligent quest generation. It uses a multiagent system that processes user preferences, location data, and quest history to generate personalized location-based activities.

### Key Backend Components

- **FastAPI Server** (`lib/fastapi_server.py`) - Main API server with CORS middleware
- **Multiagent System** (`lib/multiagent/`) - Google ADK integration for quest generation  
- **Maps Integration** (`lib/multiagent/maps_api.py`) - Quest location validation
- **Database Integration** - Supabase client for data persistence

### API Endpoints

#### POST /quests
Generates a new quest based on user preferences and location.

**Request Body:**
```json
{
  "user": {
    "interests": ["hiking", "photography"],
    "location": "San Francisco, CA", 
    "preference": "outdoor"
  },
  "questTitles": ["Golden Gate Park Walk"],
  "userId": "user123",
  "coords": {
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

#### GET /admin
Admin endpoint for database connectivity testing.

## Environment Variables

Required environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_MAPS_API_KEY=your_maps_api_key
```

## Development Setup

### Backend Setup
1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Start the FastAPI server:
```bash
uvicorn lib.fastapi_server:app --host 0.0.0.0 --port 8000 --reload
```

## Docker Deployment

The Dockerfile builds a backend-only container:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY lib/ ./lib/
COPY api/ ./api/
EXPOSE 8000
CMD ["uvicorn", "lib.fastapi_server:app", "--host", "0.0.0.0", "--port", "8000"]
```

See `docker.md` for detailed Docker setup instructions.

## Tech Stack

- **FastAPI** - Backend API framework
- **Google ADK** - Agent Development Kit for AI-powered quest generation
- **Google GenAI** - Google's generative AI APIs  
- **Supabase** - Database and authentication
- **Google Maps API** - Location services and validation