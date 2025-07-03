#!/bin/bash

        # Load environment variables from .env and .env.local files for local testing.
        if [ -f .env ]; then
          echo "Sourcing .env"
          set -a
          . ./.env
          set +a
        fi
        if [ -f .env.local ]; then
          echo "Sourcing .env.local"
          set -a
          . ./.env.local
          set +a
        fi
        echo "Environment variables loaded. Verifying critical ones:"
        echo "GEMINI_API_KEY: ${GEMINI_API_KEY:-(not set)}"
        echo "GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY:-(not set)}"
        echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: ${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:-(not set)}"
        echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-(not set)}"
        echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:-(not set)}"

        # Start FastAPI in the background
        uvicorn lib.multiagent.state:app --host 0.0.0.0 --port 8000 &

        # Start Next.js using 'npm start' in the background
        # This assumes your package.json has a "start" script, e.g., "next start"
        npm start &

        # Wait for all background processes to finish
        wait -n