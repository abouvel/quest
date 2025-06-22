import { generateQuest } from './ai.js';

// Test data
const testUser = {
  location: "Philadelphia, PA",
  interests: ["hiking", "rock climbing", "food"],
  preference: "outdoor"
};

const completedTitles = ["Visit Golden Gate Bridge", "Try a new coffee shop"];

async function testGemini() {
  console.log("Testing Gemini API configuration...");
  console.log("User:", testUser);
  console.log("Completed quests:", completedTitles);
  console.log("\nGenerating new quest...\n");
  
  try {
    const quest = await generateQuest(testUser, completedTitles);
    
    if (quest) {
      console.log("✅ Success! Generated quest:");
      console.log("Title:", quest.title);
      console.log("Description:", quest.description);
    } else {
      console.log("❌ Failed to generate quest - check API key and configuration");
    }
  } catch (error) {
    console.error("❌ Error testing Gemini:", error.message);
  }
}

testGemini(); 