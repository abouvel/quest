# EXPLR - Location-Based Quest Generation Application

A full-stack application that generates AI-powered location-based quests with social features, built with Next.js frontend and FastAPI backend.

## Overview

EXPLR combines location-based quest generation with social networking features. Users can generate personalized quests based on their location and interests, complete them by taking photos, and share their experiences with friends through a social feed system.

## Architecture

### Frontend - Next.js Application
A modern React-based frontend built with Next.js 15, TypeScript, and Tailwind CSS.

**Tech Stack:**
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling framework
- **shadcn/ui** - High-quality UI component library
- **Radix UI** - Unstyled, accessible UI primitives
- **Supabase** - Authentication and database client
- **Google Maps API** - Location services and mapping
- **Lucide React** - Modern icon library

**Key Features:**
- Authentication system with Supabase integration
- AI-powered quest generation and completion
- Social feed with friends system and leaderboard
- Interactive map with quest markers
- Mobile-optimized responsive design

### Backend - FastAPI Application
A Python-based backend API that handles quest generation and business logic.

**Tech Stack:**
- **Python 3.11** - Runtime environment
- **FastAPI** - Modern web framework for APIs
- **Google Generative AI** - Quest generation
- **Supabase** - Database and authentication
- **Google Maps API** - Location services

## Project Structure

```
├── app/                     # Next.js frontend application
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page with auth
│   ├── dashboard/          # Social feed and dashboard
│   ├── friends/            # Friend management
│   ├── leaderboard/        # User rankings
│   ├── map/               # Interactive quest map
│   ├── preferences/        # User preferences setup
│   └── quest/             # Quest generation and completion
├── components/             # React components
│   ├── navigation.tsx      # App navigation
│   ├── theme-provider.tsx  # Theme context
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/                   # Backend Python modules
│   ├── fastapi_server.py  # FastAPI application
│   └── quest_generator.py # Quest generation logic
├── api/                   # API modules
└── docker-compose.yaml    # Docker configuration
```

## Environment Setup

Create `.env` file with required variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend runs on http://localhost:3000

### Backend Development
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn lib.fastapi_server:app --host 0.0.0.0 --port 8000
```
Backend runs on http://localhost:8000

### Full Stack with Docker
```bash
# Start both frontend and backend
docker-compose up --build
```

## Production Deployment

### Docker Deployment

**Backend Only:**
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

**Full Stack:**
```bash
docker-compose up --build
```

### Frontend Production Build
```bash
npm run build
npm start
```

## API Documentation

Once running, access the FastAPI documentation at:
- **Development**: http://localhost:8000/docs
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Test Endpoints

```bash
# Health check
curl http://localhost:8000/admin

# Generate quest
curl -X POST http://localhost:8000/quests \
  -H "Content-Type: application/json" \
  -d '{
    "user": {"interests": ["hiking"], "location": "SF", "preference": "outdoor"},
    "questTitles": [],
    "userId": "test123",
    "coords": {"latitude": 37.7749, "longitude": -122.4194}
  }'
```

## Key Features

### Authentication & User Management
- Secure authentication with Supabase
- User preference setup for new users
- Protected routes and authorization

### Quest System
- AI-powered quest generation based on location and interests
- Photo-based quest completion
- Quest history and tracking
- Google Maps integration for location services

### Social Features
- Social feed showing completed quests
- Friends system with friend management
- Leaderboard with user rankings and streaks
- Like and comment system for social interactions

### Map Integration
- Interactive map showing quest locations
- Visual quest markers and indicators
- Google Maps API integration
- Location validation and geocoding

## Development Guidelines

### Code Style
- TypeScript for type safety
- Functional components with React hooks
- Tailwind CSS for consistent styling
- shadcn/ui for component consistency

### State Management
- React hooks for local state
- Custom hooks for shared logic
- Supabase real-time for data synchronization

### Performance
- Next.js App Router optimizations
- Code splitting and lazy loading
- Image optimization
- Production-ready build process

## Troubleshooting

### Common Issues
1. **Port conflicts**: Ensure ports 3000 and 8000 are available
2. **Environment variables**: Verify all required variables are set in `.env`
3. **Dependencies**: Check all dependencies are installed correctly
4. **Google Services**: Ensure API keys are valid and services are enabled

### Debug Commands
```bash
# View Docker logs
docker logs quest-backend-prod

# Execute commands in container
docker exec -it quest-backend-prod bash

# Check frontend build
npm run lint
npm run build
```

## Contributing

1. Follow the established code style and patterns
2. Use TypeScript for all new code
3. Test your changes thoroughly
4. Update documentation as needed
5. Follow the component architecture patterns