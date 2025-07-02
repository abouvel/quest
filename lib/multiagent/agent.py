import datetime
from zoneinfo import ZoneInfo
from google.adk.agents import Agent
import os
import asyncio
from google.adk.sessions import InMemorySessionService
from google.adk.agents import SequentialAgent
from google.adk.runners import Runner
from google.adk.tools import google_search
from google.adk.tools.agent_tool import AgentTool
from google.genai import types # For creating message Content/Parts
import requests
from datetime import datetime

def get_current_location():
    try:
        response = requests.get("https://ipinfo.io/json")
        response.raise_for_status()
        data = response.json()
        loc = data.get("loc")  # Format: "latitude,longitude"
        if loc:
            latitude, longitude = map(float, loc.split(","))
            return latitude, longitude
    except Exception as e:
        print(f"Error fetching current location: {e}")
    # Default to a known location if lookup fails
    return 52.52, 13.41  # Berlin, as fallback


def get_weather() -> dict:
    latitude, longitude = get_current_location()
    url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        temp = data.get("current", {}).get("temperature_2m")
        print(f"Current temperature at ({latitude}, {longitude}): {temp}°C")
        return {
            "status": "success",
            "report": f"The current temperature at ({latitude}, {longitude}) is {temp}°C."
        }
    except Exception as e:
        print(f"Error fetching weather: {e}")
        return {
            "status": "error",
            "error_message": f"Could not fetch weather for ({latitude}, {longitude}): {e}"
        }


def get_current_time() -> dict:
    """Returns the current local time on the machine running the code.

    Returns:
        dict: status and result or error msg.
    """
    now = datetime.now()
    report = f'The current local time is {now.strftime("%Y-%m-%d %H:%M:%S")}'
    return {"status": "success", "report": report}


search_agent = Agent(
    model="gemini-2.0-flash",
    name="search_agent",
    instruction="""
Using the provided {weather_suggestions}, output ONLY valid JSON in this exact format:
{
  "search_results": [
    {
      "suggestion_title": "...",
      "place_name": "...",
      "address": "...",
      "description": "..."
    }
  ]
}

For each suggestion, search for a specific, real, and popular location or event that matches the activity. Make sure the place exists and is well-reviewed.

Example:
{
  "search_results": [
    {
      "suggestion_title": "Visit a Local Art Museum",
      "place_name": "Philadelphia Museum of Art",
      "address": "2600 Benjamin Franklin Pkwy, Philadelphia, PA 19130",
      "description": "See the 'American Gothic' painting and enjoy world-class exhibits."
    }
  ]
}
""",
    tools=[google_search, get_current_location],
    output_key="search_results"
)
search_tool = AgentTool(search_agent)

weather_agent = Agent(
    name="weather_time_agent",
    model="gemini-2.0-flash",
    description=(
        "Agent that suggests activities based on the user's summarized interests and the current weather. It will recommend things to do that match the weather conditions and the user's preferences."
    ),
    instruction="""
Given a summary of the user's interests and preferences {user_summary} and the current weather report, output ONLY valid JSON in this exact format:
{
  "weather_suggestions": [
    {
      "title": "...",
      "description": "..."
    },
    {
      "title": "...",
      "description": "..."
    }
  ]
}

Suggest 2-3 specific, creative activities or quests that would be enjoyable and appropriate for the weather. Only suggest activities that are suitable for the current weather (e.g., don't suggest outdoor activities if it's raining). Use the user_summary to personalize your suggestions.

Example:
{
  "weather_suggestions": [
    {
      "title": "Visit a Local Art Museum",
      "description": "Enjoy indoor exhibits and discover new artists while staying dry."
    },
    {
      "title": "Cooking Class at a Culinary School",
      "description": "Learn to cook a new dish and meet fellow food lovers."
    }
  ]
}
""",
    output_key="weather_suggestions"
)

# Summarizer agent for user interests and past events
summarizer_agent = Agent(
    model="gemini-2.0-flash",
    name="summarizer_agent",
    instruction="""
Given a user's interests and a list of their past completed events, output ONLY valid JSON in this exact format:
{
  "user_summary": "..."
}

Summarize what this user enjoys and the types of activities they are most likely to appreciate. Be specific and insightful, not generic. Do not include activities they have already done.

Input:
- interests: a list of user interests (e.g., ['art', 'food', 'outdoors'])
- past_events: a list of event titles the user has completed (e.g., ['Visit the Modern Art Museum', 'Hiking at Blue Hills'])

Example:
{
  "user_summary": "This user enjoys outdoor adventures, art, and food. They have already visited art museums and gone hiking, so suggest new cultural or culinary experiences, or outdoor activities they haven't tried."
}
""",
    description="Summarizes user interests and past events into a user profile.",
    output_key="user_summary"
)

# Final reformatter agent to produce the required output format
reformatter_agent = Agent(
    model="gemini-2.0-flash",
    name="reformatter_agent",
    instruction="""
You are a response formatter. Given the search results in the following JSON format:
{
  "results": [
    {
      "suggestion_title": "...",
      "place_name": "...",
      "address": "...",
      "description": "..."
    }
  ]
}
Reformat and output ONLY valid JSON in this final required format:
{
  "quest": {
    "title": "...",
    "description": "...",
    "locationName": "...",
    "address": "..."
  }
}

Use the first result in the list as the quest. Example:
{
  "quest": {
    "title": "Visit a Local Art Museum",
    "description": "See the 'American Gothic' painting and enjoy world-class exhibits.",
    "locationName": "Philadelphia Museum of Art",
    "address": "2600 Benjamin Franklin Pkwy, Philadelphia, PA 19130"
  }
}
""",
    output_key="final_quest"
)

code_pipeline_agent = SequentialAgent( 
    description="this function is designed to find the perfect place to do a daily quest. Make sure you go through the whole pipline and print out {final_quest} ",
    name="code_pipeline_agent",
    sub_agents=[summarizer_agent, weather_agent, search_agent, reformatter_agent],
)

