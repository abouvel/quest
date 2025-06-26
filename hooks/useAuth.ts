import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authUtils } from '@/lib/supabaseUtils';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Get initial user
        const getInitialUser = async () => {
            try {
                // Get current user (this will handle session checking internally)
                const { user, error } = await authUtils.getCurrentUser();

                if (error) {
                    // Handle various auth errors by clearing invalid tokens
                    if (error.message?.includes('Refresh Token Not Found') ||
                        error.message?.includes('Invalid Refresh Token') ||
                        error.message?.includes('Auth session missing')) {
                        console.log('Clearing invalid auth state:', error.message);
                        // Clear any invalid tokens from storage
                        localStorage.removeItem('supabase.auth.token');
                        sessionStorage.clear();
                        setUser(null);
                        setLoading(false);
                        return;
                    }
                    throw error;
                }

                setUser(user);
            } catch (err) {
                console.error('Auth error:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getInitialUser();

        // Listen for auth changes
        const { data: { subscription } } = authUtils.onAuthStateChange(
            async (event: string, session: Session | null) => {
                console.log('Auth state change:', event, session?.user?.email);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, username: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await authUtils.signUp(email, password, username);
            if (error) throw error;
            return { data, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            return { data: null, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await authUtils.signIn(email, password);
            if (error) throw error;
            return { data, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            return { data: null, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            // Clear any stored tokens first
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.clear();

            const { error } = await authUtils.signOut();
            if (error) throw error;
            setUser(null);
        } catch (err) {
            console.error('Sign out error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            // Even if signOut fails, clear the user state
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        isAuthenticated: !!user
    };
} 