from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from lib.multiagent.state import generate_quest_py
import os

try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None

app = FastAPI()

# Allow CORS from any origin (any port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://quest-production-a5ff.up.railway.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_supabase_admin():
    SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise Exception("Missing Supabase environment variables")
    if create_client is None:
        raise Exception("supabase-py is not installed")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

@app.post("/quests")
async def create_quest(request: Request):
    body = await request.json()
    user = body.get("user")
    questTitles = body.get("questTitles")
    userId = body.get("userId")
    coords = body.get("coords") 
    result = await generate_quest_py(user, questTitles, userId, coords)
    return JSONResponse(content=result)

@app.get("/admin")
async def get_admin():
    try:
        supabase = get_supabase_admin()
        # Get a sample quest (first one)
        result = supabase.table("quests").select("*").limit(1).execute()
        return JSONResponse(content={"status": "ok", "sample": result.data})
    except Exception as e:
        return JSONResponse(content={"status": "error", "error": str(e)}, status_code=500) 