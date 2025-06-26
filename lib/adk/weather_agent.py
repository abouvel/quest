from adk import LlmAgent

class WeatherAgent(LlmAgent):
    def __init__(self, model):
        super().__init__(
            name="WeatherAgent",
            model=model,
            instruction="""
You are a weather suitability checker. Given the quest and its location, check the weather using the provided weather data.
If the quest is outdoor and the weather is bad, set weatherOk to false and suggest an alternative.
Output a JSON object with: weatherOk, weatherSummary, weatherDetails, and the quest.
""",
            description="Checks weather suitability for the quest.",
            output_key="weather"
        ) 