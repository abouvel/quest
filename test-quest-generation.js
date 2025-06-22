import { UserService } from './lib/userService.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testQuestGeneration() {
  try {
    console.log('🧪 Testing Quest Generation with Coordinates...')
    
    // Replace with an actual user ID from your database
    const testUserId = 'your-test-user-id' // You'll need to replace this
    
    console.log('📋 Generating quest for user:', testUserId)
    
    // Generate a quest
    const quest = await UserService.generateUserQuest(testUserId)
    
    if (quest) {
      console.log('✅ Quest generated successfully!')
      console.log('📝 Title:', quest.title)
      console.log('📄 Description:', quest.description)
      console.log('🏷️ Category:', quest.category)
      console.log('📍 Location Name:', quest.locationName)
      console.log('🏠 Address:', quest.address)
      
      if (quest.lat && quest.lng) {
        console.log('🗺️ Coordinates:', quest.lat, quest.lng)
        console.log('🌐 Google Maps URL:', `https://www.google.com/maps?q=${quest.lat},${quest.lng}`)
      } else {
        console.log('⚠️ No coordinates found')
      }
      
      // Test saving the quest
      console.log('\n💾 Testing quest save...')
      const saveResult = await UserService.saveGeneratedQuest(testUserId, quest)
      
      if (saveResult) {
        console.log('✅ Quest saved successfully with coordinates!')
      } else {
        console.log('❌ Failed to save quest')
      }
      
    } else {
      console.log('❌ Failed to generate quest')
    }
    
  } catch (error) {
    console.error('❌ Error testing quest generation:', error)
  }
}

// Run the test
testQuestGeneration() 