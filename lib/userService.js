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

  // Ignore completed quests for now
  static async getCompletedQuests(userId) {
    return []
  }

  // Generate a new quest for a user
  static async generateUserQuest(userId) {
    try {
      // Get user
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Get completed quests (ignored for now)
      const completedTitles = await this.getCompletedQuests(userId)

      // Prepare user data for AI
      const userData = {
        location: 'your city', // default, since not in schema
        interests: ['fun'], // default, since not in schema
        preference: user.preference || 'outdoor'
      }

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
        .from('generated_quests')
        .insert({
          user_id: userId,
          title: quest.title,
          description: quest.description,
          generated_at: new Date().toISOString()
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error saving generated quest:', error)
      return false
    }
  }

  // Mark quest as completed (not used for now)
  static async completeQuest(userId, questId) {
    return false
  }
} 