import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateQuestLocation } from "./lib/mapsApi.js";
import { globalQuestStore } from "./lib/globalQuestStore.ts";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateQuest(user, completedTitles = []) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Get completed quest titles from global store if available
  let questTitles = completedTitles;

  try {
    // Try to get quests from global store first
    const allQuests = await globalQuestStore.getAllQuests(user.id);
    const completedQuests = globalQuestStore.getCompletedQuests();
    const incompleteQuests = globalQuestStore.getIncompleteQuests();

    // Combine both completed and incomplete quest titles
    const completedTitles = completedQuests.map(quest => quest.title);
    const incompleteTitles = incompleteQuests.map(quest => quest.title);
    questTitles = [...completedTitles, ...incompleteTitles];
    console.log("-------------questTitles", questTitles);

    console.log('Using quest titles from global store - Completed:', completedTitles.length, 'Incomplete:', incompleteTitles.length);
  } catch (error) {
    console.log('Global store not available, using provided completedTitles:', completedTitles.length);
    questTitles = completedTitles;
  }

  const prompt = `
  Generate one fun, short, creative real-world activity that someone can do in ${user.location}.
  Their preferences are: ${user.interests.join(", ")}.
  
  IMPORTANT: Do not suggest any of these events - avoid them completely: [${questTitles.join(", ")}].
  
Keep it under 25 words and give it a title and 1-sentence description.

The quest needs to be specific to a certain location. Simply saying "Go to a restaurant and try a new dish" is not enough.
The quest should name a specific restaurant, cafe, park, etc that has good reviews and is a popular spot.
Don't feel like you have to combine different interests into one quest. 

An example of a good quest:
"Go to the Philadelphia Museum of Art and see the "American Gothic" painting" and add a fun fact about the painting.

An example of a bad quest:
"Find hidden NYC-themed goodies in a department store."

The title should have the title of the location the activity takes place at in it.
Make sure that the location is an actual place with an address in the area specified.

For the locationName, use the name of the location the activity takes place at and dont follow it with a "in South Bay Area, CA" or anything like that.
An example of a good locationName: "Santana Row"
An example of a bad locationName: "Santana Row in South Bay Area, CA"

Return ONLY valid JSON in this exact format:
{
  "title": "...",
  "description": "...",
  "locationName": "..."
}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  const cleaned = response.replace(/```json|```/g, '').trim();

  try {
    const questData = JSON.parse(cleaned);

    // Validate and enhance the quest with real location data
    const enhancedQuest = await validateQuestLocation(questData, user.location);

    // Add debugging information
    return {
      ...enhancedQuest,
      debug: {
        userLocation: user.location,
        userInterests: user.interests,
        userPreference: user.preference,
        completedTitles: questTitles,
        prompt: prompt
      }
    };
  } catch (err) {
    console.error("AI response error:", err, cleaned);
    return null;
  }
}
