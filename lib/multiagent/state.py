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
from agent import  code_pipeline_agent

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

    final_response_text = "Agent did not produce a final response." # Default

    # Key Concept: run_async executes the agent logic and yields Events.
    # We iterate through events to find the final answer.
    async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=content):
        # Uncomment to see all events:
        print(f"  [Event] Author: {event.author}, Type: {type(event).__name__}, Final: {event.is_final_response()}, Content: {event.content}")
    
    #     if event.is_final_response():
    #         if event.content and event.content.parts:
    #             final_response_text = event.content.parts[0].text
    #         elif event.actions and event.actions.escalate:
    #             final_response_text = f"Agent escalated: {event.error_message or 'No specific message.'}"
    #         break

    # print(f"<<< Agent Response: {final_response_text}")

async def main():
    # Create the specific session where the conversation will happen
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
        session_id=SESSION_ID,
        state={
        "interests": ["outdoors", "art", "restaurants"],
        "past_events": ["Visit the Modern Art Museum", "Hiking at Blue Hills"]
    }
    )
    print(f"Session created: App='{APP_NAME}', User='{USER_ID}', Session='{SESSION_ID}'")

    # --- Runner ---
    # Key Concept: Runner orchestrates the agent execution loop.
    runner = Runner(
        agent=code_pipeline_agent, # The agent we want to run
        app_name=APP_NAME,   # Associates runs with our app
        session_service=session_service # Uses our session manager
    )
    print(f"Runner created for agent '{runner.agent.name}'.")
    # Example usage:
    await call_agent_async("", runner, USER_ID, SESSION_ID)
    return session, runner

# Entry point for running as a script
if __name__ == "__main__":
    asyncio.run(main())