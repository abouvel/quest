import { supabase } from './supabaseClient';

// Authentication utilities
export const authUtils = {
    // Sign up with email and password
    async signUp(email, password, username) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                }
            }
        });
        return { data, error };
    },

    // Sign in with email and password
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },

    // Sign out
    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    // Get current user
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    },

    // Listen to auth changes
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    }
};

// Quest utilities
export const questUtils = {
    // Get today's quest for a user
    async getTodayQuest(userId) {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('quests')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();
        return { data, error };
    },

    // Create a new quest
    async createQuest(questData) {
        const { data, error } = await supabase
            .from('quests')
            .insert([questData])
            .select();
        return { data, error };
    },

    // Complete a quest
    async completeQuest(questId, completionData) {
        const { data, error } = await supabase
            .from('quests')
            .update({
                completed: true,
                completed_at: new Date().toISOString(),
                ...completionData
            })
            .eq('id', questId)
            .select();
        return { data, error };
    },

    // Get user's quest history
    async getQuestHistory(userId, limit = 10) {
        const { data, error } = await supabase
            .from('quests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    }
};

// Post/Feed utilities
export const postUtils = {
    // Get all posts for the feed
    async getPosts(limit = 20) {
        const { data, error } = await supabase
            .from('posts')
            .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    // Create a new post
    async createPost(postData) {
        const { data, error } = await supabase
            .from('posts')
            .insert([postData])
            .select();
        return { data, error };
    },

    // Like a post
    async likePost(postId, userId) {
        const { data, error } = await supabase
            .from('post_likes')
            .upsert([{ post_id: postId, user_id: userId }])
            .select();
        return { data, error };
    },

    // Add comment to a post
    async addComment(postId, userId, comment) {
        const { data, error } = await supabase
            .from('post_comments')
            .insert([{
                post_id: postId,
                user_id: userId,
                comment: comment
            }])
            .select();
        return { data, error };
    },

    // Get comments for a post
    async getComments(postId) {
        const { data, error } = await supabase
            .from('post_comments')
            .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
        return { data, error };
    }
};

// User profile utilities
export const profileUtils = {
    // Get user profile
    async getProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        return { data, error };
    },

    // Update user profile
    async updateProfile(userId, updates) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select();
        return { data, error };
    },

    // Get user preferences
    async getPreferences(userId) {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();
        return { data, error };
    },

    // Update user preferences
    async updatePreferences(userId, preferences) {
        const { data, error } = await supabase
            .from('user_preferences')
            .upsert([{ user_id: userId, ...preferences }])
            .select();
        return { data, error };
    }
}; 