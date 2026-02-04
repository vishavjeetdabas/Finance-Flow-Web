import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { auth } from '../firebase';

export const authService = {
    // Sign up with email and password
    async signUp(email: string, password: string): Promise<User> {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },

    // Sign in with email and password
    async signIn(email: string, password: string): Promise<User> {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },

    // Sign out
    async signOut(): Promise<void> {
        await signOut(auth);
    },

    // Get current user
    getCurrentUser(): User | null {
        return auth.currentUser;
    },

    // Subscribe to auth state changes
    onAuthStateChanged(callback: (user: User | null) => void): () => void {
        return onAuthStateChanged(auth, callback);
    }
};
