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
                const { user, error } = await authUtils.getCurrentUser();
                if (error) throw error;
                setUser(user);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        getInitialUser();

        // Listen for auth changes
        const { data: { subscription } } = authUtils.onAuthStateChange(
            async (event: string, session: Session | null) => {
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
            const { error } = await authUtils.signOut();
            if (error) throw error;
            setUser(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
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