import { supabase } from './supabase.js'
import { generateQuest } from '../ai.js'

export class UserService {
  // Get user by ID
  static async getUser(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  }

  // Get completed quests for a user
  static async getCompletedQuests(userId) {
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('description')
        .eq('user_id', userId)
        .eq('status', 'completed')

      if (error) throw error
      return data.map(quest => quest.description)
    } catch (error) {
      console.error('Error fetching completed quests:', error)
      return []
    }
  }

  // Generate a new quest for a user
  static async generateUserQuest(userId) {
    try {
      // Get user
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error('User not found')
      }

      console.log('User data:', user)

      // Get completed quests
      const completedTitles = await this.getCompletedQuests(userId)
      console.log('Completed quests:', completedTitles)

      // Extract user preferences from preference_tags
      let location = 'your city'
      let interests = ['general']
      let preference = 'outdoor'
      
      if (user.preference_tags && typeof user.preference_tags === 'object') {
        // Extract location
        if (user.preference_tags.location) {
          location = user.preference_tags.location
        }
        
        // Extract interests
        if (user.preference_tags.interests && Array.isArray(user.preference_tags.interests)) {
          interests = user.preference_tags.interests
        }
        
        // Determine indoor/outdoor preference based on activity types
        if (user.preference_tags.activityTypes && Array.isArray(user.preference_tags.activityTypes)) {
          const outdoorActivities = ['Parks & Recreation', 'Outdoor Activities', 'Nature']
          const hasOutdoor = user.preference_tags.activityTypes.some(activity => 
            outdoorActivities.includes(activity)
          )
          preference = hasOutdoor ? 'outdoor' : 'indoor'
        }
        
        // Use indoorOutdoorPreference if available (50 is neutral, >50 is outdoor)
        if (user.preference_tags.indoorOutdoorPreference !== undefined) {
          preference = user.preference_tags.indoorOutdoorPreference > 50 ? 'outdoor' : 'indoor'
        }
      }

      // Prepare user data for AI
      const userData = {
        location: location,
        interests: interests,
        preference: preference
      }

      console.log('User data for AI:', userData)

      // Generate quest using AI
      const quest = await generateQuest(userData, completedTitles)
      
      if (quest) {
        // Save the generated quest to database
        await this.saveGeneratedQuest(userId, quest)
        return quest
      }

      return null
    } catch (error) {
      console.error('Error generating user quest:', error)
      return null
    }
  }

  // Save generated quest to database
  static async saveGeneratedQuest(userId, quest) {
    try {
      const { error } = await supabase
        .from('quests')
        .insert({
          user_id: userId,
          description: quest.title, // Use title as description for quests table
          tags: [quest.category?.toLowerCase() || 'general'],
          assigned_at: new Date().toISOString(),
          status: 'active'
        })

      if (error) {
        console.error('Supabase error saving quest:', error)
        throw error
      }
      console.log('Successfully saved generated quest')
      return true
    } catch (error) {
      console.error('Error saving generated quest:', error)
      return false
    }
  }

  // Mark quest as completed
  static async completeQuest(userId, questId) {
    try {
      const { error } = await supabase
        .from('quests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', questId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error completing quest:', error)
      return false
    }
  }
} 