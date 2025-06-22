import { supabase } from './lib/supabase.js'

async function testUserPreferences() {
  try {
    console.log('Testing user preferences...')
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }
    
    console.log('Users found:', users.length)
    
    if (users.length > 0) {
      const user = users[0]
      console.log('First user data:', {
        id: user.id,
        username: user.username,
        preference_tags: user.preference_tags,
        streak_count: user.streak_count
      })
      
      // Test preference_tags parsing
      if (user.preference_tags && typeof user.preference_tags === 'object') {
        const positivePrefs = Object.keys(user.preference_tags).filter(key => 
          user.preference_tags[key] > 0
        )
        console.log('Positive preferences:', positivePrefs)
      }
    }
    
    // Test quest generation for first user
    if (users.length > 0) {
      console.log('\nTesting quest generation...')
      const { UserService } = await import('./lib/userService.js')
      const quest = await UserService.generateUserQuest(users[0].id)
      console.log('Generated quest:', quest)
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testUserPreferences() 