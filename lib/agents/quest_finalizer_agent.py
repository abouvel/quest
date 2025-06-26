from adk import LlmAgent

class QuestFinalizerAgent(LlmAgent):
    def __init__(self, model):
        super().__init__(
            name="QuestFinalizerAgent",
            model=model,
            instruction="""
You are a quest finalizer. Format the final quest object for the user, including all relevant info from previous steps.
Output a JSON object with: quest, coordinates, address, weatherOk, weatherSummary, validationStatus, and a feedbackPrompt.
""",
            description="Formats the final quest output.",
            output_key="final_quest"
        ) 