from adk import LlmAgent

class QuestGeneratorAgent(LlmAgent):
    def __init__(self, model):
        super().__init__(
            name="QuestGeneratorAgent",
            model=model,
            instruction="""
You are a creative quest generator. Based on the user's location, interests, and completed quests, suggest a fun, specific real-world activity at a real location. 
Output a JSON object with: title, description, locationName, locationType, isOutdoor.
""",
            description="Generates a creative quest idea.",
            output_key="quest"
        ) 