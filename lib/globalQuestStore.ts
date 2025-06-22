import { supabase } from './supabaseClient'
import { questUtils, userUtils } from './supabaseUtils'

interface Quest {
    id: string
    user_id: string
    title: string
    description: string
    status: 'active' | 'completed'
    assigned_at: string
    completed_at?: string | null
    lat?: number | null
    lng?: number | null
    liked?: boolean
    feedback_tags?: string[]
    feedback_text?: string
    image_path?: string
    image_url?: string
    tags?: string[]
}

// Global quest storage
let allQuests: Quest[] = []
let isLoading = false
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const globalQuestStore = {
    // Get all quests (from cache if recent, otherwise fetch)
    getAllQuests: async (userId: string, forceRefresh = false): Promise<Quest[]> => {
        const now = Date.now()

        // Return cached data if recent and not forcing refresh
        if (!forceRefresh && allQuests.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
            console.log('Returning cached quests:', allQuests.length)
            return allQuests
        }

        // Prevent multiple simultaneous fetches
        if (isLoading) {
            console.log('Quest fetch already in progress, waiting...')
            // Wait for current fetch to complete
            while (isLoading) {
                await new Promise(resolve => setTimeout(resolve, 100))
            }
            return allQuests
        }

        try {
            isLoading = true
            console.log('Fetching all quests for user:', userId)

            // Fetch ALL quests for the user (both completed and incomplete)
            const { data: userQuests, error: userError } = await supabase
                .from('quests')
                .select('*')
                .eq('user_id', userId)
                .order('assigned_at', { ascending: false })
                .limit(100)

            if (userError) {
                console.error('Error fetching user quests:', userError)
                return allQuests // Return cached data on error
            }

            // Store the quests globally
            allQuests = userQuests || []
            lastFetchTime = now

            console.log('Fetched and stored quests globally:', allQuests.length)
            return allQuests

        } catch (error) {
            console.error('Error in global quest fetch:', error)
            return allQuests // Return cached data on error
        } finally {
            isLoading = false
        }
    },

    // Get quests from cache without fetching
    getCachedQuests: (): Quest[] => allQuests,

    // Get completed quests
    getCompletedQuests: (): Quest[] => {
        return allQuests.filter(quest => quest.status === 'completed' && quest.completed_at)
    },

    // Get incomplete quests
    getIncompleteQuests: (): Quest[] => {
        return allQuests.filter(quest => quest.status === 'active' && !quest.completed_at)
    },

    // Get current active quest
    getCurrentQuest: (): Quest | null => {
        return allQuests.find(quest => quest.status === 'active' && !quest.completed_at) || null
    },

    // Add a quest to the global store
    addQuest: (quest: Quest): void => {
        allQuests = [quest, ...allQuests] // Add to beginning
    },

    // Update a quest in the global store
    updateQuest: (id: string, updates: Partial<Quest>): void => {
        allQuests = allQuests.map(quest =>
            quest.id === id ? { ...quest, ...updates } : quest
        )
    },

    // Clear the global store
    clearQuests: (): void => {
        allQuests = []
        lastFetchTime = 0
    },

    // Get cache status
    getCacheStatus: () => ({
        questCount: allQuests.length,
        lastFetch: lastFetchTime,
        isLoading,
        isStale: (Date.now() - lastFetchTime) > CACHE_DURATION
    })
} 