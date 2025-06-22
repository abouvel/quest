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

        // If signup successful, create user record
        if (data.user && !error) {
            await this.createUserRecord(data.user, username);
        }

        return { data, error };
    },

    // Sign in with email and password
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        // If login successful, ensure user record exists
        if (data.user && !error) {
            await this.ensureUserRecord(data.user);
        }

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
    },

    // Create user record in users table
    async createUserRecord(user, username) {
        const { data, error } = await supabase
            .from('users')
            .insert([{
                id: user.id,
                username: username,
                streak_count: 0,
                preference_tags: {}
            }])
            .select();
        return { data, error };
    },

    // Ensure user record exists (for existing users)
    async ensureUserRecord(user) {
        // Check if user record exists
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (checkError && checkError.code === 'PGRST116') {
            // User doesn't exist, create them
            const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
            await this.createUserRecord(user, username);
        }

        return { data: existingUser, error: checkError };
    },

    // Get user data from users table
    async getUserData(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        return { data, error };
    }
};

// Quest utilities
export const questUtils = {
    // Get current quest for a user using current_quest_id
    async getCurrentQuest(userId) {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('current_quest_id')
            .eq('id', userId)
            .single();

        if (userError || !user.current_quest_id) {
            return { data: null, error: userError };
        }

        const { data: quest, error: questError } = await supabase
            .from('quests')
            .select('*')
            .eq('id', user.current_quest_id)
            .single();

        return { data: quest, error: questError };
    },

    // Set current quest for a user
    async setCurrentQuest(userId, questId) {
        const { data, error } = await supabase
            .from('users')
            .update({ current_quest_id: questId })
            .eq('id', userId)
            .select();
        return { data, error };
    },

    // Get today's quest for a user
    async getTodayQuest(userId) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const { data, error } = await supabase
            .from('quests')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .gte('assigned_at', startOfDay.toISOString())
            .lt('assigned_at', endOfDay.toISOString())
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
                status: 'completed',
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
            .order('assigned_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    // Get all completed quests from all users (for feed)
    async getAllCompletedQuests(limit = 50) {
        const { data, error } = await supabase
            .from('quests')
            .select(`
                *,
                users!inner(username, streak_count)
            `)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    // Get active quests for a user
    async getActiveQuests(userId) {
        const { data, error } = await supabase
            .from('quests')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active');
        return { data, error };
    }
};

// User utilities
export const userUtils = {
    // Get user profile
    async getUser(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        return { data, error };
    },

    // Update user profile
    async updateUser(userId, updates) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select();
        return { data, error };
    },

    // Update user preferences
    async updatePreferences(userId, preferenceTags) {
        const { data, error } = await supabase
            .from('users')
            .update({ preference_tags: preferenceTags })
            .eq('id', userId)
            .select();
        return { data, error };
    },

    // Get user preferences
    async getPreferences(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('preference_tags')
            .eq('id', userId)
            .single();
        return { data, error };
    },

    // Update streak count
    async updateStreak(userId, streakCount) {
        const { data, error } = await supabase
            .from('users')
            .update({ streak_count: streakCount })
            .eq('id', userId)
            .select();
        return { data, error };
    },

    // Update daily completion date
    async updateDailyCompletion(userId, date) {
        const { data, error } = await supabase
            .from('users')
            .update({ daily_completed_date: date })
            .eq('id', userId)
            .select();
        return { data, error };
    },

    // Search users by username (for adding friends)
    async searchUsers(searchTerm, currentUserId, limit = 10) {
        const { data, error } = await supabase
            .from('users')
            .select('id, username')
            .ilike('username', `%${searchTerm}%`)
            .neq('id', currentUserId) // Exclude current user
            .limit(limit);
        return { data, error };
    },

    // Get user's friends list
    async getFriends(userId) {
        // First, get the current user's friends array
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('friends')
            .eq('id', userId)
            .single();

        if (userError || !userData?.friends || userData.friends.length === 0) {
            return { data: [], error: userError };
        }

        // Then, get the friend users' data
        const { data, error } = await supabase
            .from('users')
            .select('id, username, streak_count')
            .in('id', userData.friends);

        return { data: data || [], error };
    },

    // Add friend (mutual friendship)
    async addFriend(currentUserId, friendUserId) {
        // Start a transaction to add both users to each other's friends list
        const { data: currentUser, error: currentError } = await supabase
            .from('users')
            .select('friends')
            .eq('id', currentUserId)
            .single();

        if (currentError) return { error: currentError };

        const { data: friendUser, error: friendError } = await supabase
            .from('users')
            .select('friends')
            .eq('id', friendUserId)
            .single();

        if (friendError) return { error: friendError };

        // Add friend to current user's list
        const updatedCurrentFriends = [...(currentUser.friends || []), friendUserId];
        const { error: updateCurrentError } = await supabase
            .from('users')
            .update({ friends: updatedCurrentFriends })
            .eq('id', currentUserId);

        if (updateCurrentError) return { error: updateCurrentError };

        // Add current user to friend's list
        const updatedFriendFriends = [...(friendUser.friends || []), currentUserId];
        const { error: updateFriendError } = await supabase
            .from('users')
            .update({ friends: updatedFriendFriends })
            .eq('id', friendUserId);

        return { error: updateFriendError };
    },

    // Remove friend (mutual unfriending)
    async removeFriend(currentUserId, friendUserId) {
        // Remove friend from current user's list
        const { data: currentUser, error: currentError } = await supabase
            .from('users')
            .select('friends')
            .eq('id', currentUserId)
            .single();

        if (currentError) return { error: currentError };

        const updatedCurrentFriends = (currentUser.friends || []).filter(id => id !== friendUserId);
        const { error: updateCurrentError } = await supabase
            .from('users')
            .update({ friends: updatedCurrentFriends })
            .eq('id', currentUserId);

        if (updateCurrentError) return { error: updateCurrentError };

        // Remove current user from friend's list
        const { data: friendUser, error: friendError } = await supabase
            .from('users')
            .select('friends')
            .eq('id', friendUserId)
            .single();

        if (friendError) return { error: friendError };

        const updatedFriendFriends = (friendUser.friends || []).filter(id => id !== currentUserId);
        const { error: updateFriendError } = await supabase
            .from('users')
            .update({ friends: updatedFriendFriends })
            .eq('id', friendUserId);

        return { error: updateFriendError };
    },

    // Check if two users are friends
    async areFriends(userId1, userId2) {
        const { data, error } = await supabase
            .from('users')
            .select('friends')
            .eq('id', userId1)
            .single();

        if (error) return { areFriends: false, error };

        const areFriends = (data.friends || []).includes(userId2);
        return { areFriends, error: null };
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
        users:user_id(username)
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
        users:user_id(username)
      `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
        return { data, error };
    }
};

// Keep profileUtils for backward compatibility but redirect to userUtils
export const profileUtils = {
    // Get user profile
    async getProfile(userId) {
        return userUtils.getUser(userId);
    },

    // Update user profile
    async updateProfile(userId, updates) {
        return userUtils.updateUser(userId, updates);
    },

    // Get user preferences
    async getPreferences(userId) {
        return userUtils.getPreferences(userId);
    },

    // Update user preferences
    async updatePreferences(userId, preferences) {
        return userUtils.updatePreferences(userId, preferences);
    }
}; 