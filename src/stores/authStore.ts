import { create } from 'zustand';
import { User } from 'firebase/auth';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';
import { AppUser, UserPreferences } from '../types';

// Helper function to convert Firebase error codes to user-friendly messages
const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
            return 'No account found with this email. Please sign up first.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please sign in instead.';
        case 'auth/weak-password':
            return 'Password is too weak. Please use at least 6 characters.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        default:
            return 'An error occurred. Please try again.';
    }
};

interface AuthState {
    user: AppUser | null;
    preferences: UserPreferences | null;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    // Actions
    initialize: () => void;
    signUp: (email: string, password: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    loadPreferences: () => Promise<void>;
    updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
    setOnboardingCompleted: (completed: boolean) => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    preferences: null,
    isLoading: true,
    isInitialized: false,
    error: null,

    initialize: () => {
        const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                const appUser: AppUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName
                };
                set({ user: appUser, isLoading: false, isInitialized: true });

                // Load preferences
                await get().loadPreferences();
            } else {
                set({
                    user: null,
                    preferences: null,
                    isLoading: false,
                    isInitialized: true
                });
            }
        });

        // Return unsubscribe function for cleanup
        return unsubscribe;
    },

    signUp: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
            const firebaseUser = await authService.signUp(email, password);
            const appUser: AppUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName
            };

            // Initialize default preferences
            const defaultPrefs: UserPreferences = {
                onboardingCompleted: false,
                darkMode: true,
                currency: 'INR'
            };
            await dataService.setPreferences(firebaseUser.uid, defaultPrefs);

            set({ user: appUser, preferences: defaultPrefs, isLoading: false });
        } catch (error: any) {
            const userFriendlyError = getAuthErrorMessage(error.code || error.message);
            set({ error: userFriendlyError, isLoading: false });
            throw error;
        }
    },

    signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
            const firebaseUser = await authService.signIn(email, password);
            const appUser: AppUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName
            };
            set({ user: appUser, isLoading: false });

            // Load preferences after sign in
            await get().loadPreferences();
        } catch (error: any) {
            const userFriendlyError = getAuthErrorMessage(error.code || error.message);
            set({ error: userFriendlyError, isLoading: false });
            throw error;
        }
    },

    signOut: async () => {
        set({ isLoading: true });
        try {
            await authService.signOut();
            set({ user: null, preferences: null, isLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to sign out', isLoading: false });
            throw error;
        }
    },

    loadPreferences: async () => {
        const { user } = get();
        if (!user) return;

        try {
            const prefs = await dataService.getPreferences(user.uid);
            set({ preferences: prefs });
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    },

    updatePreferences: async (prefs: Partial<UserPreferences>) => {
        const { user, preferences } = get();
        if (!user) return;

        try {
            await dataService.updatePreferences(user.uid, prefs);
            set({ preferences: { ...preferences!, ...prefs } });
        } catch (error: any) {
            set({ error: error.message || 'Failed to update preferences' });
        }
    },

    setOnboardingCompleted: async (completed: boolean) => {
        await get().updatePreferences({ onboardingCompleted: completed });
    },

    clearError: () => set({ error: null })
}));
