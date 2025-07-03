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
You will receive:
- weather_suggestions: activity suggestions from the weather agent
- current_location: the user's current location (latitude, longitude, city/state)

For each weather suggestion, use google_search to find a specific, real, and popular location or event that matches the activity and is within driving distance (within 50 miles) of the current_location. Always include the user's city/state in your search queries to ensure results are nearby. Do NOT call any tool to get the location; use the provided current_location.

Output ONLY valid JSON in this exact format:
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
    tools=[google_search],
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

First, get the current weather using get_weather() and get_current_time(). Then suggest 2-3 specific, creative activities or quests that would be enjoyable and appropriate for the weather. Only suggest activities that are suitable for the current weather (e.g., don't suggest outdoor activities if it's raining). Use the user_summary to personalize your suggestions.

IMPORTANT: Only suggest events or activities that are available to do TODAY (the day this request is submitted). Do NOT suggest events that are only available on future dates.

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
    tools=[get_weather, get_current_time],
    output_key="weather_suggestions"
)
weather_tool = AgentTool(weather_agent)

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
summarizer_tool = AgentTool(summarizer_agent)

# Final reformatter agent to produce the required output format
reformatter_agent = Agent(
    model="gemini-2.0-flash",
    name="reformatter_agent",
    instruction="""
You are a response formatter. Given the search results, reformat and output ONLY valid JSON in this final required format:
{
  "final_quest": {
    "title": "...",
    "description": "...",
    "locationName": "...",
    "address": "..."
  }
}

Use the first result in the search_results list as the quest. IMPORTANT: The quest you select must be available to do TODAY (the day this request is submitted). Do NOT select events that are only available on future dates.

Example:
{
  "final_quest": {
    "title": "Visit a Local Art Museum",
    "description": "See the 'American Gothic' painting and enjoy world-class exhibits.",
    "locationName": "Philadelphia Museum of Art",
    "address": "2600 Benjamin Franklin Pkwy, Philadelphia, PA 19130"
  }
}
""",
    output_key="final_quest"
)
reformatter_tool = AgentTool(reformatter_agent)

code_pipeline_agent = Agent(
    model="gemini-2.0-flash",
    description="This function is designed to find the perfect place to do a daily quest. Make sure you go through the whole pipeline and print out {final_quest}",
    name="code_pipeline_agent",
    instruction="""
You are a quest generation pipeline coordinator. Follow these steps in order:

1. First, call the summarizer_tool to get a user summary based on their interests and past events
2. Then, call the weather_tool with the user summary to get weather-appropriate activity suggestions (this agent will get weather data internally)
3. Next, call get_current_location and store the result in state as current_location. Then call the search_tool with both the weather suggestions and the current_location from state.
4. Finally, call the reformatter_tool to format the final quest output

Make sure to pass the output from each step as input to the next step. The final output should be a quest in the required format.

Call the tools in this exact sequence:
1. summarizer_tool
2. weather_tool  
3. get_current_location, then search_tool with weather_suggestions and current_location
4. reformatter_tool
""",
    tools=[summarizer_tool, weather_tool, search_tool, reformatter_tool, get_current_location],
    output_key="final_quest"
)

