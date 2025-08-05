# EXPLR - Location-Based Quest Generation App

EXPLR is a full-stack web application that generates personalized real-world quests based on user interests, location, weather, and quest history using Google's Agent Development Kit (ADK). It combines AI-powered activity generation with social features to help users explore their surroundings and share experiences with friends.

## Core Features

- AI-powered quest generation
- Location validation via Google Maps API
- Weather-aware suggestions
- Quest completion via photos
- Social feed, friends, and leaderboard
- Mobile-first design with interactive maps

## Architecture

### Frontend (Next.js + TypeScript)

- Framework: Next.js 15.2.4 with App Router
- Styling: Tailwind CSS, shadcn/ui, Radix UI
- Icons: Lucide React
- Auth & DB: Supabase (PostgreSQL)
- Maps: Google Maps API

### Backend (FastAPI + Google ADK)

- Language: Python 3.11
- Framework: FastAPI
- Quest Generation: Google Agent Development Kit (multi-agent system)
- Database: Supabase (PostgreSQL)
- Location and Weather: Google Maps API, Weather API
- Deployment: Docker, Railway

## Project Structure

├── app/ # Next.js frontend  
│ ├── dashboard/ # Social feed and dashboard  
│ ├── friends/ # Friend management  
│ ├── leaderboard/ # Leaderboard page  
│ ├── map/ # Interactive quest map  
│ ├── preferences/ # User preferences setup  
│ └── quest/ # Quest generation and completion  
├── components/ # Reusable UI components  
├── hooks/ # Custom React hooks  
├── lib/ # Backend Python logic  
│ ├── fastapi_server.py # FastAPI app  
│ └── multiagent/ # Multiagent system  
├── api/ # Additional backend API modules  
├── docker-compose.yaml # Docker orchestration file  
└── requirements.txt # Python dependencies

## Multiagent Workflow

The backend uses a 4-stage agent pipeline to generate quests using Google's Agent Development Kit (ADK).

### Pipeline

1. **Summarizer Agent**

   - Inputs: User interests, completed quest history
   - Output: `user_summary`

2. **Weather-Time Agent**

   - Inputs: User summary, coordinates
   - Output: `weather_suggestions` (2–3 activity ideas)

3. **Search Agent**

   - Inputs: Weather suggestions, user location
   - Output: `search_results` (real-world locations)

4. **Reformatter Agent**
   - Inputs: Search results
   - Output: Final quest object

### Location Validation

Google Maps API validates all locations. It:

- Confirms the place exists
- Provides metadata like name, rating, and coordinates
- Performs fallback searches for partial matches

### Example Output

{
"final_quest": {
"title": "Visit Local Art Museum",
"description": "Philadelphia Museum of Art: See world-class exhibits...",
"locationName": "Philadelphia Museum of Art",
"address": "2600 Benjamin Franklin Pkwy, Philadelphia, PA 19130",
"coords": { "lat": 39.9656, "lng": -75.1809 },
"validated": true,
"location": {
"name": "...",
"rating": 4.5,
"placeId": "..."
}
}
}

## API Reference

### POST `/quests`

Generates a new quest.

**Request:**
{
"user": {
"interests": ["hiking", "photography"],
"location": "San Francisco, CA",
"preference": "outdoor"
},
"questTitles": [],
"userId": "user123",
"coords": {
"latitude": 37.7749,
"longitude": -122.4194
}
}

### GET `/admin`

Health check and DB connection test.

### Swagger Docs

- `http://localhost:8000/docs`
- `http://localhost:8000/openapi.json`

## Environment Variables

Create a `.env` file:

# Supabase

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url  
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Services

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_client_api_key  
GOOGLE_MAPS_API_KEY=your_server_api_key

## Development Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker (optional)

### Frontend

cd app/  
npm install  
npm run dev

Runs on `http://localhost:3000`

### Backend

pip install -r requirements.txt  
uvicorn lib.fastapi_server:app --host 0.0.0.0 --port 8000 --reload

Runs on `http://localhost:8000`

### Full Stack (Docker)

docker-compose up --build

## Production Deployment

### Railway

- Deploy frontend and backend as separate Docker services
- Backend uses `uvicorn` to serve FastAPI
- Frontend uses `npm run build` + `npm start`

### Backend Local Production

docker build -t quest-backend:prod .  
docker run -d \\  
 --name quest-backend-prod \\  
 -p 8000:8000 \\  
 --env-file .env \\  
 --restart unless-stopped \\  
 quest-backend:prod

## Key Features Summary

### Authentication

- Supabase-based secure login
- Preference setup for onboarding
- Session management

### Quest Engine

- Personalized quest generation with ADK
- Weather and time filtering
- Duplicate quest prevention
- Location metadata enrichment

### Social Features

- Social feed of completed quests
- Friends and invite system
- Leaderboard and streak tracking

### Map Integration

- Interactive quest map
- Google Maps pinning
- Location validation and geocoding

## Developer Guidelines

- Use TypeScript and functional React components
- Style with Tailwind CSS and shadcn/ui
- Backend modules should follow the agent pipeline structure
- Store quests in consistent JSON format
- Add API docs for any new endpoints

## Troubleshooting

| Problem               | Solution                                   |
| --------------------- | ------------------------------------------ |
| Ports 3000/8000 taken | Free up the ports or change in config      |
| .env missing vars     | Check all required keys are defined        |
| CORS errors           | Ensure FastAPI CORS middleware is enabled  |
| Map not rendering     | Make sure Maps API key is active + billing |
