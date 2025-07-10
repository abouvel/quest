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
from lib.multiagent.agent import code_pipeline_agent # Assuming this is your actual agent instance
import argparse
import json
from lib.multiagent.maps_api import validate_quest_location

# FastAPI imports
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

# Initialize the session service globally
session_service = InMemorySessionService()

# Define constants for identifying the interaction context
APP_NAME = "weather_tutorial_app"
USER_ID = "user_1"
SESSION_ID = "session_001" # Using a fixed ID for simplicity

async def call_agent_async(query: str, runner: Runner, user_id: str, session_id: str):
    """Sends a query to the agent and prints the final response.

    Args:
        query: The user's query string.
        runner: The ADK Runner instance.
        user_id: The ID of the user.
        session_id: The ID of the session.
    """
    print(f"\n>>> User Query: {query}")

    # Prepare the user's message in ADK format
    content = types.Content(role='user', parts=[types.Part(text=query)])

    final_response_text = None

    # Iterate through events to find the final answer.
    # The runner.run_async method yields events as the agent processes the request.
    async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=content):
        # Print all events for debugging purposes
        if event.content and event.content.parts:
            print(f"    Content: {event.content}")
            # Capture the latest content part as the potential final response
            final_response_text = event.content.parts[0].text
        
        # Check for the final response event.
        # The ADK runner indicates the final response with is_final_response()
        if hasattr(event, 'is_final_response') and event.is_final_response():
            if event.content and event.content.parts:
                final_response_text = event.content.parts[0].text
            elif getattr(event, 'actions', None) and getattr(event.actions, 'escalate', False):
                # Handle escalation scenarios if the agent decides to escalate
                final_response_text = f"Agent escalated: {getattr(event, 'error_message', 'No specific message.')}"
            break # Exit the loop once the final response is found

    print(f"<<< Agent Response: {final_response_text}")
    return final_response_text

async def generate_quest_py(user: dict, questTitles: list, userId: str, coords: dict | None):
    """Generates a quest based on user preferences and location using the ADK agent.

    Args:
        user: A dictionary containing user preferences (interests, location, preference).
        questTitles: A list of already completed quest titles.
        userId: The ID of the user.
        coords: A dictionary with 'latitude' and 'longitude', or None.

    Returns:
        The generated quest object, potentially validated.
    """
    # Create the specific session where the conversation will happen
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=userId,
        session_id=SESSION_ID
    )
    
    # Store user info in session state for the agent to use
    session.state["interests"] = user.get("interests", "")
    session.state["location"] = user.get("location", "")
    session.state["preference"] = user.get("preference", "")
    session.state["completedTitles"] = questTitles

    # Store coordinates in session state for the weather agent or other location-aware agents
    coords_str = "unknown location"
    if coords:
        if hasattr(coords, "latitude") and hasattr(coords, "longitude"):
            coords_str = f"{coords.latitude}, {coords.longitude}"
        elif isinstance(coords, dict) and "latitude" in coords and "longitude" in coords:
            coords_str = f"{coords['latitude']}, {coords['longitude']}"
        else:
            coords_str = str(coords)
    session.state["coordinates"] = coords_str

    # Initialize the ADK Runner with your agent, session service, and the app_name
    # This is the crucial missing part from your original code.
    # Ensure 'code_pipeline_agent' is the correct agent instance you intend to use.
    runner = Runner(agent=code_pipeline_agent, session_service=session_service, app_name=APP_NAME)

    # Compose a user query string based on their preferences
    query = f"I like {', '.join(user.get('interests', []))}. I have already gone to {', '.join(questTitles)}. My location is {coords_str}."
    
    # Call the agent asynchronously with the initialized runner
    result = await call_agent_async(query, runner, userId, SESSION_ID)
    
    # Clean and parse the result if it's a string (e.g., if the agent returns JSON in a string)
    import re
    if isinstance(result, str):
        # Remove markdown code block fences if present
        result = re.sub(r"^```json|```$", "", result, flags=re.MULTILINE).strip()
        try:
            result = json.loads(result)
        except json.JSONDecodeError:
            # If parsing fails, keep it as a string or handle as an error
            print(f"Warning: Could not parse agent response as JSON: {result}")
            pass # Keep result as string if it's not valid JSON
    
    # Only handle 'final_quest' structure if the result is a dictionary
    if isinstance(result, dict) and 'final_quest' in result:
        quest_obj = result['final_quest']
        # Validate the quest location using your external function
        validated = validate_quest_location(quest_obj)
        result['final_quest'] = validated
        return result
    
    return result

# FastAPI app (unchanged)
app = FastAPI()

# Main execution block for running the script directly
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run ADK quest pipeline.")
    parser.add_argument('--user', type=str, required=True, help='User JSON string')
    parser.add_argument('--quests', type=str, required=True, help='Quest titles JSON string')
    parser.add_argument('--userId', type=str, default=USER_ID, help='User ID')
    parser.add_argument('--coords', type=str, help='Coordinates JSON string (optional)')
    args = parser.parse_args()
    
    # Parse command-line arguments
    user = json.loads(args.user)
    questTitles = json.loads(args.quests)
    userId = args.userId
    coords = json.loads(args.coords) if args.coords else None
    
    # Run the quest generation asynchronously
    quest = asyncio.run(generate_quest_py(user, questTitles, userId, coords))
    
    # Print only the final quest JSON to stdout for command-line usage
    if isinstance(quest, dict):
        print(json.dumps(quest, indent=2)) # Use indent for pretty printing
    else:
        print(quest)
