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

## Agent Workflow Architecture

The backend leverages Google's Agent Development Kit (ADK) with a sophisticated multiagent pipeline for personalized quest generation:

### Agent Pipeline (`lib/multiagent/`)

**Core Components:**
- **State Management** (`state.py`) - Session management and user context storage
- **Agent Definitions** (`agent.py`) - Four specialized agents working in sequence
- **Maps Validation** (`maps_api.py`) - Google Maps API integration for location verification

### Agent Workflow Sequence

The quest generation follows a 4-step agent pipeline:

#### 1. **Summarizer Agent** 
- **Input**: User interests + completed quest history
- **Function**: Creates personalized user profile avoiding duplicate activities
- **Output**: `user_summary` - tailored preference analysis

#### 2. **Weather-Time Agent**
- **Input**: User summary + coordinates (lat/lng JSON)
- **Tools**: Weather API (`get_weather`) + time utilities (`get_current_time`)
- **Function**: Suggests 2-3 weather-appropriate activities for TODAY only
- **Output**: `weather_suggestions` array with titles and descriptions

#### 3. **Search Agent**
- **Input**: Weather suggestions + user location + coordinates
- **Tools**: Google Search API
- **Function**: Finds real, popular locations within 50 miles matching suggested activities
- **Output**: `search_results` with place names, addresses, and coordinates

#### 4. **Reformatter Agent**
- **Input**: Search results from previous agent
- **Function**: Formats final quest with standardized structure
- **Output**: `final_quest` object with title, description, location details

### Pipeline Coordinator

**Code Pipeline Agent** (`code_pipeline_agent`) orchestrates the entire workflow:
```python
# Execution sequence:
1. summarizer_tool(interests, past_events) → user_summary
2. weather_tool(user_summary, coordinates) → weather_suggestions  
3. search_tool(weather_suggestions, coordinates) → search_results
4. reformatter_tool(search_results) → final_quest
```

### Location Data Flow

**Critical**: Coordinates are passed as JSON objects throughout the pipeline:
```json
{
  "latitude": 40.0326992,
  "longitude": -75.4852164
}
```

### Quest Validation

**Maps API Integration** (`maps_api.py`):
- Validates generated quest locations using Google Maps API
- Performs multi-tier location search (exact name → partial name → fallback)
- Enriches quest data with real place details, ratings, and verified coordinates
- Returns validation status and location metadata

### Session Management

**ADK Session Handling** (`state.py`):
- In-memory session service for user context
- Stores user preferences, coordinates, and completion history
- Maintains conversation state across agent interactions
- Session-scoped data persistence during quest generation

### Output Format

Final quest structure:
```json
{
  "final_quest": {
    "title": "Visit Local Art Museum",
    "description": "Philadelphia Museum of Art: See world-class exhibits...",
    "locationName": "Philadelphia Museum of Art", 
    "address": "2600 Benjamin Franklin Pkwy, Philadelphia, PA 19130",
    "coords": { "lat": 39.9656, "lng": -75.1809 },
    "validated": true,
    "location": {
      "name": "...", "rating": 4.5, "placeId": "..."
    }
  }
}
```

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