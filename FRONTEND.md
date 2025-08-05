# EXPLR Frontend Documentation

A Next.js-based frontend for the location-based quest generation application.

## Overview

The frontend is built with Next.js 15, TypeScript, and modern React patterns. It provides a complete user interface for authentication, quest generation, social features, and user management.

## Tech Stack

- **Next.js 15.2.4** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling framework
- **shadcn/ui** - High-quality UI component library
- **Radix UI** - Unstyled, accessible UI primitives
- **Supabase** - Authentication and database client
- **Google Maps API** - Location services and mapping
- **Lucide React** - Modern icon library

## Project Structure

```
app/
├── layout.tsx              # Root layout
├── page.tsx               # Landing page with auth
├── globals.css            # Global styles
├── api/
│   └── generate-quest/
│       └── route.ts       # Quest generation API route
├── dashboard/
│   └── page.tsx          # Quest feed and social dashboard
├── friends/
│   └── page.tsx          # Friend management
├── leaderboard/
│   └── page.tsx          # User rankings
├── map/
│   └── page.tsx          # Interactive quest map
├── preferences/
│   └── page.tsx          # User preferences setup
└── quest/
    └── page.tsx          # Quest generation and completion

components/
├── navigation.tsx         # App navigation component
├── theme-provider.tsx     # Theme context provider
└── ui/                   # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    └── ... (30+ UI components)

hooks/
├── useAuth.ts            # Authentication hook
├── use-mobile.tsx        # Mobile detection
└── use-toast.ts          # Toast notifications

lib/
├── supabase.js           # Supabase client
├── supabaseClient.js     # Additional Supabase utilities
├── supabaseUtils.js      # Database utility functions
├── utils.ts              # General utilities
└── globalQuestStore.ts   # Quest state management
```

## Key Features

### Authentication System
- **Landing Page** (`app/page.tsx`) - Login/signup with tabs
- **User Management** - Supabase auth integration
- **Profile Setup** - Preferences flow for new users
- **Protected Routes** - Authentication guards

### Quest System
- **Quest Generation** (`app/quest/page.tsx`) - AI-powered quest creation
- **Quest Completion** - Photo upload and feedback
- **Quest History** - Personal quest tracking
- **Location Integration** - Google Maps API for quest locations

### Social Features
- **Dashboard** (`app/dashboard/page.tsx`) - Social feed of completed quests
- **Friends System** (`app/friends/page.tsx`) - Friend management
- **Leaderboard** (`app/leaderboard/page.tsx`) - User rankings and streaks
- **Like/Comment System** - Social interactions

### Map Integration
- **Interactive Map** (`app/map/page.tsx`) - Visual quest exploration
- **Google Maps API** - Location services and validation
- **Quest Markers** - Visual quest indicators on map

## Environment Variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Development Setup

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Runs on http://localhost:3000

### Build for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Key Dependencies

### UI Framework
- `@radix-ui/*` - Accessible UI primitives (30+ components)
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Component variant management
- `tailwind-merge` - Tailwind class merging utility

### Data & State
- `@supabase/supabase-js` - Database and auth client
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form validation
- `zod` - Schema validation

### Maps & Location
- `@react-google-maps/api` - Google Maps React components
- `@googlemaps/js-api-loader` - Google Maps API loader

### AI Integration
- `@google/generative-ai` - Google Generative AI client

### Utils & Misc
- `date-fns` - Date manipulation
- `lucide-react` - Icon library
- `sonner` - Toast notifications
- `next-themes` - Theme management

## Configuration

### Next.js Config (`next.config.mjs`)
```javascript
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
```

### Tailwind Config (`tailwind.config.ts`)
- Custom color scheme
- shadcn/ui integration
- Responsive breakpoints
- Animation utilities

## Component Architecture

### Authentication Flow
1. **Landing Page** - Login/signup tabs
2. **Preferences Setup** - New user onboarding
3. **Dashboard** - Main app entry point

### Quest Flow
1. **Quest Generation** - AI-powered quest creation
2. **Quest Execution** - Location tracking and completion
3. **Quest Sharing** - Social feed integration

### Navigation
- **Bottom Navigation** - Mobile-optimized navigation
- **Responsive Design** - Desktop and mobile layouts
- **Protected Routes** - Authentication-based access

## API Integration

### Internal API Routes
- `POST /api/generate-quest` - Quest generation endpoint

### External Services
- **Supabase** - Database operations, auth, storage
- **Google Maps** - Location services, geocoding
- **Google AI** - Quest generation via ADK

## Build & Deployment

### Docker Support
The app includes Docker configuration for containerized deployment:

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "npm run build && npm start"]
```

### Production Optimizations
- Image optimization disabled for flexibility
- TypeScript/ESLint errors ignored during builds
- Production-ready build process
- Environment-based configuration

## Development Guidelines

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Tailwind for styling
- shadcn/ui for consistent UI

### State Management
- React hooks for local state
- Custom hooks for shared logic
- Supabase real-time for data sync

### Performance
- Next.js App Router for optimization
- Image optimization
- Code splitting
- Lazy loading where appropriate