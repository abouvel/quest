import { UserService } from './lib/userService.js'

// Test with a specific user ID from your Supabase project
const TEST_USER_ID = '99ba348a-eee4-4d23-9982-fa943c9d0826' // Replace with actual user ID from your Supabase

async function testSupabaseIntegration() {
  console.log('Testing Supabase + Gemini Integration...\n')
  
  try {
    // 1. Get user from Supabase
    console.log('1. Fetching user...')
    const user = await UserService.getUser(TEST_USER_ID)
    
    if (!user) {
      console.log('❌ User not found. Please check the user ID.')
      return
    }
    
    console.log('✅ User found:')
    console.log('   Username:', user.username)
    console.log('   Streak count:', user.streak_count)
    console.log('   Preference:', user.preference)
    console.log('')
    
    // 2. Generate new quest using AI
    console.log('2. Generating new quest with AI...')
    const newQuest = await UserService.generateUserQuest(TEST_USER_ID)
    
    if (newQuest) {
      console.log('✅ Generated quest:')
      console.log('   Title:', newQuest.title)
      console.log('   Description:', newQuest.description)
      console.log('')
      console.log('🔍 Debug Information:')
      console.log('   User Location:', newQuest.debug.userLocation)
      console.log('   User Interests:', newQuest.debug.userInterests)
      console.log('   User Preference:', newQuest.debug.userPreference)
      console.log('   Completed Titles:', newQuest.debug.completedTitles)
      console.log('')
      console.log('📝 Full Prompt sent to AI:')
      console.log(newQuest.debug.prompt)
    } else {
      console.log('❌ Failed to generate quest')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Instructions for setup
console.log('=== Supabase + Gemini Integration Test ===')
console.log('')
console.log('Before running this test, make sure to:')
console.log('1. Set up your .env.local file with Supabase credentials:')
console.log('   NEXT_PUBLIC_SUPABASE_URL=your_project_url')
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key')
console.log('')
console.log('2. Replace TEST_USER_ID with an actual user ID from your Supabase project')
console.log('')
console.log('3. Ensure your Supabase tables exist:')
console.log('   - profiles (id, location, interests, preference)')
console.log('   - completed_quests (user_id, title)')
console.log('   - generated_quests (user_id, title, description, generated_at)')
console.log('')

// Uncomment the line below to run the test
testSupabaseIntegration() 