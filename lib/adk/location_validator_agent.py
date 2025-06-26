from adk import LlmAgent

class LocationValidatorAgent(LlmAgent):
    def __init__(self, model):
        super().__init__(
            name="LocationValidatorAgent",
            model=model,
            instruction="""
You are a location validator. Given the quest and weather info, validate the location using search/map data.
If the location is valid, output coordinates, address, and validationStatus='valid'. If not, set validationStatus='invalid'.
Output a JSON object with: coordinates, address, validationStatus, and the quest.
""",
            description="Validates the quest location.",
            output_key="location_validation"
        ) 