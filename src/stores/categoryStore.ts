import { create } from 'zustand';
import { dataService } from '../services/dataService';
import { Category, CategoryType } from '../types';

interface CategoryState {
    categories: Category[];
    isLoading: boolean;
    error: string | null;

    // Actions
    loadCategories: (userId: string) => Promise<void>;
    addCategory: (userId: string, category: Omit<Category, 'id'>) => Promise<string>;
    updateCategory: (userId: string, categoryId: string, data: Partial<Category>) => Promise<void>;
    deleteCategory: (userId: string, categoryId: string) => Promise<void>;
    initializeDefaultCategories: (userId: string) => Promise<void>;
    clearCategories: () => void;

    // Computed getters
    getExpenseCategories: () => Category[];
    getIncomeCategories: () => Category[];
    getCategoryById: (id: string) => Category | undefined;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
    categories: [],
    isLoading: false,
    error: null,

    loadCategories: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const categories = await dataService.getCategories(userId);
            set({ categories, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    addCategory: async (userId: string, category: Omit<Category, 'id'>) => {
        try {
            const id = await dataService.addCategory(userId, category);
            const newCategory = { ...category, id };
            set({ categories: [...get().categories, newCategory] });
            return id;
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    updateCategory: async (userId: string, categoryId: string, data: Partial<Category>) => {
        try {
            await dataService.updateCategory(userId, categoryId, data);
            set({
                categories: get().categories.map(c =>
                    c.id === categoryId ? { ...c, ...data } : c
                )
            });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    deleteCategory: async (userId: string, categoryId: string) => {
        try {
            await dataService.deleteCategory(userId, categoryId);
            set({ categories: get().categories.filter(c => c.id !== categoryId) });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    initializeDefaultCategories: async (userId: string) => {
        try {
            await dataService.addDefaultCategories(userId);
            await get().loadCategories(userId);
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    clearCategories: () => set({ categories: [] }),

    getExpenseCategories: () => {
        return get().categories.filter(c => c.type === CategoryType.EXPENSE);
    },

    getIncomeCategories: () => {
        return get().categories.filter(c => c.type === CategoryType.INCOME);
    },

    getCategoryById: (id: string) => {
        return get().categories.find(c => c.id === id);
    }
}));
