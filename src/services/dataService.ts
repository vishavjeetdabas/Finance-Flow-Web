import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    writeBatch,
    setDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Wallet, Category, Transaction, UserPreferences } from '../types';

// Helper to get user-specific collection path
const getUserCollection = (userId: string, collectionName: string) => {
    return collection(db, 'users', userId, collectionName);
};

const getUserDoc = (userId: string, collectionName: string, docId: string) => {
    return doc(db, 'users', userId, collectionName, docId);
};

export const dataService = {
    // ============================================
    // WALLETS
    // ============================================
    async getWallets(userId: string): Promise<Wallet[]> {
        const walletsRef = getUserCollection(userId, 'wallets');
        const q = query(walletsRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallet));
    },

    async addWallet(userId: string, wallet: Omit<Wallet, 'id'>): Promise<string> {
        const walletsRef = getUserCollection(userId, 'wallets');
        const docRef = await addDoc(walletsRef, wallet);
        return docRef.id;
    },

    async updateWallet(userId: string, walletId: string, data: Partial<Wallet>): Promise<void> {
        const walletRef = getUserDoc(userId, 'wallets', walletId);
        await updateDoc(walletRef, data);
    },

    async deleteWallet(userId: string, walletId: string): Promise<void> {
        const walletRef = getUserDoc(userId, 'wallets', walletId);
        await deleteDoc(walletRef);
    },

    // ============================================
    // CATEGORIES
    // ============================================
    async getCategories(userId: string): Promise<Category[]> {
        const categoriesRef = getUserCollection(userId, 'categories');
        const q = query(categoriesRef, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    },

    async addCategory(userId: string, category: Omit<Category, 'id'>): Promise<string> {
        const categoriesRef = getUserCollection(userId, 'categories');
        const docRef = await addDoc(categoriesRef, category);
        return docRef.id;
    },

    async updateCategory(userId: string, categoryId: string, data: Partial<Category>): Promise<void> {
        const categoryRef = getUserDoc(userId, 'categories', categoryId);
        await updateDoc(categoryRef, data);
    },

    async deleteCategory(userId: string, categoryId: string): Promise<void> {
        const categoryRef = getUserDoc(userId, 'categories', categoryId);
        await deleteDoc(categoryRef);
    },

    async addDefaultCategories(userId: string): Promise<void> {
        const batch = writeBatch(db);
        const categoriesRef = getUserCollection(userId, 'categories');

        // Default expense categories
        const expenseCategories = [
            { name: 'Food & Dining', type: 'EXPENSE', icon: 'utensils', color: '#E57373', isDefault: true },
            { name: 'Transport', type: 'EXPENSE', icon: 'car', color: '#64B5F6', isDefault: true },
            { name: 'Shopping', type: 'EXPENSE', icon: 'shopping-bag', color: '#BA68C8', isDefault: true },
            { name: 'Entertainment', type: 'EXPENSE', icon: 'film', color: '#FFB74D', isDefault: true },
            { name: 'Health', type: 'EXPENSE', icon: 'heart-pulse', color: '#81C784', isDefault: true },
            { name: 'Bills & Utilities', type: 'EXPENSE', icon: 'receipt', color: '#90A4AE', isDefault: true },
            { name: 'Education', type: 'EXPENSE', icon: 'graduation-cap', color: '#4DB6AC', isDefault: true },
            { name: 'Groceries', type: 'EXPENSE', icon: 'shopping-cart', color: '#E57373', isDefault: true },
            { name: 'Personal Care', type: 'EXPENSE', icon: 'sparkles', color: '#81C784', isDefault: true },
            { name: 'Other', type: 'EXPENSE', icon: 'more-horizontal', color: '#78909C', isDefault: true }
        ];

        // Default income categories
        const incomeCategories = [
            { name: 'Salary', type: 'INCOME', icon: 'briefcase', color: '#4CAF50', isDefault: true },
            { name: 'Freelance', type: 'INCOME', icon: 'laptop', color: '#7986CB', isDefault: true },
            { name: 'Gift', type: 'INCOME', icon: 'gift', color: '#F06292', isDefault: true },
            { name: 'Investment', type: 'INCOME', icon: 'trending-up', color: '#9575CD', isDefault: true },
            { name: 'Refund', type: 'INCOME', icon: 'rotate-ccw', color: '#78909C', isDefault: true },
            { name: 'Other', type: 'INCOME', icon: 'more-horizontal', color: '#78909C', isDefault: true }
        ];

        const allCategories = [...expenseCategories, ...incomeCategories];

        for (const cat of allCategories) {
            const docRef = doc(categoriesRef);
            batch.set(docRef, { ...cat, createdAt: Date.now() });
        }

        await batch.commit();
    },

    // ============================================
    // TRANSACTIONS
    // ============================================
    async getTransactions(userId: string): Promise<Transaction[]> {
        const transactionsRef = getUserCollection(userId, 'transactions');
        const q = query(transactionsRef, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    },

    async addTransaction(userId: string, transaction: Omit<Transaction, 'id'>): Promise<string> {
        const transactionsRef = getUserCollection(userId, 'transactions');
        const docRef = await addDoc(transactionsRef, transaction);
        return docRef.id;
    },

    async updateTransaction(userId: string, transactionId: string, data: Partial<Transaction>): Promise<void> {
        const transactionRef = getUserDoc(userId, 'transactions', transactionId);
        await updateDoc(transactionRef, data);
    },

    async deleteTransaction(userId: string, transactionId: string): Promise<void> {
        const transactionRef = getUserDoc(userId, 'transactions', transactionId);
        await deleteDoc(transactionRef);
    },

    // ============================================
    // PREFERENCES
    // ============================================
    async getPreferences(userId: string): Promise<UserPreferences | null> {
        const prefsRef = doc(db, 'users', userId, 'settings', 'preferences');
        const snapshot = await getDoc(prefsRef);
        if (snapshot.exists()) {
            return snapshot.data() as UserPreferences;
        }
        return null;
    },

    async setPreferences(userId: string, prefs: UserPreferences): Promise<void> {
        const prefsRef = doc(db, 'users', userId, 'settings', 'preferences');
        await setDoc(prefsRef, prefs);
    },

    async updatePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<void> {
        const prefsRef = doc(db, 'users', userId, 'settings', 'preferences');
        await updateDoc(prefsRef, prefs);
    },

    // ============================================
    // BULK OPERATIONS
    // ============================================
    async clearAllUserData(userId: string): Promise<void> {
        // Delete all wallets, categories, transactions
        const collections = ['wallets', 'categories', 'transactions'];

        for (const collName of collections) {
            const collRef = getUserCollection(userId, collName);
            const snapshot = await getDocs(collRef);
            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }

        // Delete preferences
        const prefsRef = doc(db, 'users', userId, 'settings', 'preferences');
        await deleteDoc(prefsRef);
    }
};
