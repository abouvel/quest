import { supabase } from './supabase.js'
// import { generateQuest } from '../ai.js' // No longer needed
import { validateQuestLocation } from './mapsApi.js'
//import fetch from 'node-fetch';







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
        .select('title')
        .eq('user_id', userId)
        .eq('status', 'completed')

      if (error) throw error
      return data.map(quest => quest.title)
    } catch (error) {
      console.error('Error fetching completed quests:', error)
      return []
    }
  }

  // Check if quest needs regeneration (null description or ID, or different date)
  static async needsQuestRegeneration(userId) {
    try {
      const user = await this.getUser(userId)

      // If no current quest ID, check if there's a quest for today
      if (!user || !user.current_quest_id) {
        // Check if there's a quest assigned today
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

        const { data: todayQuest, error } = await supabase
          .from('quests')
          .select('*')
          .eq('user_id', userId)
          .gte('assigned_at', startOfDay.toISOString())
          .lt('assigned_at', endOfDay.toISOString())
          .order('assigned_at', { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking for today\'s quest:', error)
        }

        if (todayQuest) {
          // Found a quest for today, set it as current quest
          await this.setCurrentQuest(userId, todayQuest.id)
          return false // No regeneration needed
        }

        return true // No quest for today, needs regeneration
      }

      // Get the current quest
      const { data: quest, error } = await supabase
        .from('quests')
        .select('*')
        .eq('id', user.current_quest_id)
        .single()

      if (error || !quest) {
        return true // Quest not found, needs regeneration
      }

      // Check if quest has valid description and ID
      if (!quest.description || !quest.id) {
        return true // Invalid quest, needs regeneration
      }

      // Check if quest was assigned today
      if (quest.assigned_at) {
        const assignedDate = new Date(quest.assigned_at).toDateString()
        const today = new Date().toDateString()

        if (assignedDate === today) {
          return false // Quest was assigned today, no need to regenerate
        } else {
          return true // Quest was assigned on a different date, regenerate
        }
      }

      return true // Default to regenerate if we can't determine the date
    } catch (error) {
      console.error('Error checking quest regeneration:', error)
      return true // Error occurred, regenerate to be safe
    }
  }

  // Generate a new quest for a user (without saving to database)
  static async generateUserQuest(userId) {
    try {
      // Get user
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Fetch ALL quests for the user (both completed and active) to get titles for exclusion
      const { data: allQuests, error: questsError } = await supabase
        .from('quests')
        .select('title, status')
        .eq('user_id', userId)

      if (questsError) {
        console.error('Error fetching all user quests for exclusion:', questsError);
        // Continue with an empty exclusion list if there's an error
      }

      const excludedTitles = (allQuests || []).map(quest => quest.title);

      console.log('=== QUEST GENERATION DEBUG ===')
      console.log('User ID:', userId)
      console.log('Full user data:', user)
      console.log('location_description:', user.location_description)
      console.log('preference_tags:', user.preference_tags)

      // Get completed quests
      const completedTitles = await this.getCompletedQuests(userId)
      console.log('Completed quests:', completedTitles)

      // Extract user preferences and location
      let location = 'your city'
      let interests = ['general']
      let preference = 'outdoor'

      // Use location_description as primary location source
      if (user.location_description) {
        location = user.location_description
        console.log('Using location_description:', location)
      } else if (user.preference_tags && typeof user.preference_tags === 'object') {
        // Fallback to preference_tags.location
        if (user.preference_tags.location) {
          location = user.preference_tags.location
          console.log('Using preference_tags.location:', location)
        }
      }

      if (user.preference_tags && typeof user.preference_tags === 'object') {
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

      console.log('Final user data for AI:', userData)
      console.log('=== END QUEST GENERATION DEBUG ===')

      // Generate quest using FastAPI Python backend
      const response = await fetch('http://localhost:8000/generate-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userData,
          questTitles: excludedTitles,
          userId: userId
        })
      });
      if (!response.ok) throw new Error('Python API error');
      const quest = await response.json();
      // generate quest with user id

      // Handle nested 'final_quest' structure
      let questObj = quest && quest.final_quest ? quest.final_quest : quest;

      if (questObj) {
        // Validate and enhance quest location with real coordinates (optional, since Python already does it)
        console.log('Validating quest location...')
        const validatedQuest = await validateQuestLocation(questObj, location)

        if (validatedQuest.validated && validatedQuest.location?.coordinates) {
          console.log('Quest location validated with coordinates:', validatedQuest.location.coordinates)
          questObj.lat = validatedQuest.location.coordinates.lat
          questObj.lng = validatedQuest.location.coordinates.lng
          questObj.locationName = validatedQuest.location.name
          questObj.address = validatedQuest.location.address
        }
        // Return the quest without saving to database
        console.log('Generated quest (not saved to database yet):', questObj)
        return questObj
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
      const questData = {
        user_id: userId,
        title: quest.title,           // Save the title from AI
        description: quest.description, // Save the description from AI
        tags: [quest.category?.toLowerCase() || 'general'],
        assigned_at: new Date().toISOString(),
        status: 'active',
        elo_score: 1400
      }

      // Add coordinates if available
      if (quest.lat && quest.lng) {
        questData.lat = quest.lat
        questData.lng = quest.lng
        console.log('Saving quest with coordinates:', quest.lat, quest.lng)
      }
      // Add address if available
      if (quest.address) {
        questData.address = quest.address
        console.log('Saving quest with address:', quest.address)
      }

      const { error } = await supabase
        .from('quests')
        .insert(questData)

      if (error) {
        console.error('Supabase error saving quest:', error)
        throw error
      }
      console.log('Successfully saved generated quest with title, description, and coordinates')
      return true
    } catch (error) {
      console.error('Error saving generated quest:', error)
      return false
    }
  }

  // Mark quest as completed
  static async completeQuest(userId, questId) {
    try {
      // First get the quest to preserve its coordinates
      const { data: quest, error: fetchError } = await supabase
        .from('quests')
        .select('lat, lng')
        .eq('id', questId)
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching quest for completion:', fetchError)
        throw fetchError
      }

      const updateData = {
        status: 'completed',
        completed_at: new Date().toISOString()
      }

      // Preserve coordinates if they exist
      if (quest.lat && quest.lng) {
        updateData.lat = quest.lat
        updateData.lng = quest.lng
        console.log('Preserving coordinates for completed quest:', quest.lat, quest.lng)
      }

      const { error } = await supabase
        .from('quests')
        .update(updateData)
        .eq('id', questId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error completing quest:', error)
      return false
    }
  }

  // Clear and reset user location data (for debugging)
  static async resetUserLocation(userId) {
    try {
      console.log('Resetting location data for user:', userId)

      const { data, error } = await supabase
        .from('users')
        .update({
          location_description: null,
          preference_tags: {}
        })
        .eq('id', userId)
        .select()

      if (error) {
        console.error('Error resetting user location:', error)
        return false
      }

      console.log('Successfully reset location data for user:', userId)
      return true
    } catch (error) {
      console.error('Error in resetUserLocation:', error)
      return false
    }
  }

  // Set current quest for a user
  static async setCurrentQuest(userId, questId) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ current_quest_id: questId })
        .eq('id', userId)

      if (error) {
        console.error('Error setting current quest:', error)
        return false
      }

      console.log('Successfully set current quest for user:', userId, 'Quest ID:', questId)
      return true
    } catch (error) {
      console.error('Error in setCurrentQuest:', error)
      return false
    }
  }
} 