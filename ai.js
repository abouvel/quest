import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateQuest(user, completedTitles) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
  Generate one fun, short, creative real-world activity that someone can do in ${user.location}.
  Their preferences are: ${user.interests.join(", ")}.
  Only return quests they haven't already done: [${completedTitles.join(", ")}].
  It should be either indoor or outdoor depending on their setting: ${user.preference}.
  Keep it under 25 words and give it a title and 1-sentence description.

  Return ONLY valid JSON in this exact format:
  {
    "title": "...",
    "description": "..."
  }
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  const cleaned = response.replace(/```json|```/g, '').trim();

  try {
    const questData = JSON.parse(cleaned);
    
    // Add debugging information
    return {
      ...questData,
      debug: {
        userLocation: user.location,
        userInterests: user.interests,
        userPreference: user.preference,
        completedTitles: completedTitles,
        prompt: prompt
      }
    };
  } catch (err) {
    console.error("AI response error:", err, cleaned);
    return null;
  }
}
