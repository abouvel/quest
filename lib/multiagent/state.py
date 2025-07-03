from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
import datetime
from zoneinfo import ZoneInfo
from google.adk.agents import Agent
from google.adk.agents import sequential_agent

import os
import asyncio
from google.genai import types # For creating message Content/Parts
import requests
from lib.multiagent.agent import  code_pipeline_agent
import argparse
import json
from lib.multiagent.maps_api import validate_quest_location

# FastAPI imports
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

session_service = InMemorySessionService()

# Define constants for identifying the interaction context
APP_NAME = "weather_tutorial_app"
USER_ID = "user_1"
SESSION_ID = "session_001" # Using a fixed ID for simplicity

async def call_agent_async(query: str, runner, user_id, session_id):
    """Sends a query to the agent and prints the final response."""
    print(f"\n>>> User Query: {query}")

    # Prepare the user's message in ADK format
    content = types.Content(role='user', parts=[types.Part(text=query)])

    final_response_text = None

    # Iterate through events to find the final answer.
    async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=content):
        # Print all events for debugging
        if event.content and event.content.parts:
            print(f"   Content: {event.content.parts[0].text}")
        # Check for final response
        if hasattr(event, 'is_final_response') and event.is_final_response():
            if event.content and event.content.parts:
                final_response_text = event.content.parts[0].text
            elif getattr(event, 'actions', None) and getattr(event.actions, 'escalate', False):
                final_response_text = f"Agent escalated: {getattr(event, 'error_message', 'No specific message.')}"
            break

    print(f"<<< Agent Response: {final_response_text}")
    return final_response_text

async def generate_quest_py(user, questTitles, userId):
    # Create the specific session where the conversation will happen
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=userId,
        session_id=SESSION_ID
    )
    # Store user info in session state if needed
    session.state["interests"] = user.get("interests", "")
    session.state["location"] = user.get("location", "")
    session.state["preference"] = user.get("preference", "")
    session.state["completedTitles"] = questTitles
    runner = Runner(
        agent=code_pipeline_agent,
        app_name=APP_NAME,
        session_service=session_service
    )
    # Compose a user query string
    query = f"I like {', '.join(user.get('interests', []))}. I have already gone to {', '.join(questTitles)}. My location is {user.get('location', '')}."
    result = await call_agent_async(query, runner, userId, SESSION_ID)
    # Clean and parse the result if it's a string
    import re
    if isinstance(result, str):
        result = re.sub(r"^```json|```$", "", result, flags=re.MULTILINE).strip()
        try:
            result = json.loads(result)
        except Exception:
            pass
    # Only handle 'final_quest' structure
    if isinstance(result, dict) and 'final_quest' in result:
        quest_obj = result['final_quest']
        validated = validate_quest_location(quest_obj)
        result['final_quest'] = validated
        return result
    return result

# FastAPI app
app = FastAPI()

@app.post("/generate-quest")
async def generate_quest_endpoint(request: Request):
    data = await request.json()
    user = data.get("user")
    questTitles = data.get("questTitles")
    userId = data.get("userId", USER_ID)
    quest = await generate_quest_py(user, questTitles, userId)
    return JSONResponse(content=quest)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run ADK quest pipeline.")
    parser.add_argument('--user', type=str, required=True, help='User JSON string')
    parser.add_argument('--quests', type=str, required=True, help='Quest titles JSON string')
    parser.add_argument('--userId', type=str, default=USER_ID, help='User ID')
    args = parser.parse_args()
    user = json.loads(args.user)
    questTitles = json.loads(args.quests)
    userId = args.userId
    quest = asyncio.run(generate_quest_py(user, questTitles, userId))
    # Print only the final quest JSON to stdout
    if isinstance(quest, dict):
        print(json.dumps(quest))
    else:
        print(quest)