# EXPLR - Location-Based Quest Generation App

EXPLR is a full-stack web application that generates personalized real-world quests based on user interests, location, weather, and quest history using Google's Agent Development Kit (ADK). It combines AI-powered activity generation with social features to help users explore their surroundings and share experiences with friends.

---

## TL;DR
EXPLR helps users discover new places and experiences by generating personalized quests using AI, location data, and weather. Users complete quests by submitting photos and track their progress through a social feed and leaderboard. Built with Next.js, FastAPI, Supabase, and Google Maps.

---

## Project Links
- Live Demo: [quest-production-a5ff.up.railway.app](https://quest-production-a5ff.up.railway.app/)
- Devpost: [devpost.com/software/explr-mlcpig](https://devpost.com/software/explr-mlcpig)

---

## What This Project Does
- Personalized quest generation using multi-agent AI workflows
- Quest suggestions factor in user interests, real-time weather, and location
- Interactive quest map with Google Maps pinning and location validation
- Social feed to share completed quests with friends
- Leaderboard tracking user activity and streaks

---

## Multi-Agent Quest Generation Pipeline
1. Summarizer Agent – Analyzes user interests and quest history
2. Weather-Time Agent – Uses coordinates and weather API to suggest viable activities
3. Search Agent – Finds nearby places that fit the activity
4. Reformatter Agent – Finalizes quest object and metadata

---

## Tech Stack
Frontend:
- Next.js 15.2.4 (App Router)
- Tailwind CSS, shadcn/ui, Radix UI
- Supabase Auth
- Google Maps API

Backend:
- FastAPI (Python 3.11)
- Google ADK (multi-agent)
- Supabase (PostgreSQL)
- Weather API

DevOps:
- Docker
- Railway (deployment)

---

## Quick Start
### Frontend
```bash
cd app/
npm install
npm run dev
```
Visit: http://localhost:3000

### Backend
```bash
pip install -r requirements.txt
uvicorn lib.fastapi_server:app --host 0.0.0.0 --port 8000 --reload
```
Visit: http://localhost:8000

### Full Stack with Docker
```bash
docker-compose up --build
```

---

## Sample Quest Output
```json
{
  "final_quest": {
    "title": "Visit Local Art Museum",
    "description": "Philadelphia Museum of Art: See world-class exhibits...",
    "locationName": "Philadelphia Museum of Art",
    "address": "2600 Benjamin Franklin Pkwy, Philadelphia, PA 19130",
    "coords": { "lat": 39.9656, "lng": -75.1809 },
    "validated": true,
    "location": { "name": "...", "rating": 4.5, "placeId": "..." }
  }
}
```

---

## API Reference
### POST /quests
Generates a new quest for a user

### GET /admin
Health check for backend / DB status

Docs available at:
- Swagger: http://localhost:8000/docs
- OpenAPI: http://localhost:8000/openapi.json

---

## Development Notes
- Use TypeScript and functional components in frontend
- Backend agents follow a consistent four-step pipeline
- Quests are stored as validated JSON objects
- Add CORS middleware for frontend-backend integration

---

## Troubleshooting
| Problem                 | Solution                          |
|------------------------|-----------------------------------|
| Ports 3000/8000 taken  | Free ports or change config       |
| .env missing vars      | Define all required keys          |
| CORS errors            | Add proper middleware in FastAPI  |
| Map not rendering      | Enable Google Maps billing and key  |

---

## License
MIT License.
