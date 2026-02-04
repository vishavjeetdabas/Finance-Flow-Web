import { create } from 'zustand';
import { dataService } from '../services/dataService';
import {
    Transaction,
    TransactionWithDetails,
    TransactionType,
    CategoryTotal,
    Wallet,
    Category,
    WalletType
} from '../types';

interface TransactionState {
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;

    // Actions
    loadTransactions: (userId: string) => Promise<void>;
    addTransaction: (userId: string, transaction: Omit<Transaction, 'id'>) => Promise<string>;
    updateTransaction: (userId: string, transactionId: string, data: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (userId: string, transactionId: string) => Promise<void>;
    clearTransactions: () => void;

    // Computed helpers (need wallets and categories passed in)
    getTransactionsWithDetails: (wallets: Wallet[], categories: Category[]) => TransactionWithDetails[];
    getRecentTransactions: (wallets: Wallet[], categories: Category[], limit?: number) => TransactionWithDetails[];
    getWalletBalance: (walletId: string) => number;
    getTotalIncomeForPeriod: (startDate: number, endDate: number, wallets: Wallet[]) => number;
    getTotalExpenseForPeriod: (startDate: number, endDate: number, wallets: Wallet[]) => number;
    getExpenseByCategory: (startDate: number, endDate: number, wallets: Wallet[], categories: Category[]) => CategoryTotal[];
    getIncomeByCategory: (startDate: number, endDate: number, wallets: Wallet[], categories: Category[]) => CategoryTotal[];
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
    transactions: [],
    isLoading: false,
    error: null,

    loadTransactions: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const transactions = await dataService.getTransactions(userId);
            set({ transactions, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    addTransaction: async (userId: string, transaction: Omit<Transaction, 'id'>) => {
        try {
            const id = await dataService.addTransaction(userId, transaction);
            const newTransaction = { ...transaction, id };
            set({ transactions: [newTransaction, ...get().transactions] });
            return id;
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    updateTransaction: async (userId: string, transactionId: string, data: Partial<Transaction>) => {
        try {
            await dataService.updateTransaction(userId, transactionId, data);
            set({
                transactions: get().transactions.map(t =>
                    t.id === transactionId ? { ...t, ...data } : t
                )
            });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    deleteTransaction: async (userId: string, transactionId: string) => {
        try {
            await dataService.deleteTransaction(userId, transactionId);
            set({ transactions: get().transactions.filter(t => t.id !== transactionId) });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    clearTransactions: () => set({ transactions: [] }),

    getTransactionsWithDetails: (wallets: Wallet[], categories: Category[]) => {
        const { transactions } = get();

        return transactions.map(t => {
            const wallet = wallets.find(w => w.id === t.walletId);
            const toWallet = t.toWalletId ? wallets.find(w => w.id === t.toWalletId) : undefined;
            const category = t.categoryId ? categories.find(c => c.id === t.categoryId) : undefined;

            return {
                ...t,
                walletName: wallet?.name || 'Unknown',
                toWalletName: toWallet?.name,
                categoryName: category?.name,
                categoryIcon: category?.icon,
                categoryColor: category?.color
            };
        });
    },

    getRecentTransactions: (wallets: Wallet[], categories: Category[], limit = 10) => {
        const all = get().getTransactionsWithDetails(wallets, categories);
        return all.slice(0, limit);
    },

    getWalletBalance: (walletId: string) => {
        const { transactions } = get();

        let balance = 0;

        for (const t of transactions) {
            if (t.walletId === walletId) {
                if (t.type === TransactionType.INCOME || t.type === TransactionType.OPENING_BALANCE) {
                    balance += t.amount;
                } else if (t.type === TransactionType.EXPENSE) {
                    balance -= t.amount;
                } else if (t.type === TransactionType.TRANSFER) {
                    balance -= t.amount; // Outgoing transfer
                }
            }

            if (t.toWalletId === walletId && t.type === TransactionType.TRANSFER) {
                balance += t.amount; // Incoming transfer
            }
        }

        return balance;
    },

    getTotalIncomeForPeriod: (startDate: number, endDate: number, wallets: Wallet[]) => {
        const { transactions } = get();
        const personalWalletIds = wallets
            .filter(w => w.type === WalletType.PERSONAL)
            .map(w => w.id);

        return transactions
            .filter(t =>
                t.type === TransactionType.INCOME &&
                personalWalletIds.includes(t.walletId) &&
                t.date >= startDate &&
                t.date <= endDate
            )
            .reduce((sum, t) => sum + t.amount, 0);
    },

    getTotalExpenseForPeriod: (startDate: number, endDate: number, wallets: Wallet[]) => {
        const { transactions } = get();
        const personalWalletIds = wallets
            .filter(w => w.type === WalletType.PERSONAL)
            .map(w => w.id);

        return transactions
            .filter(t =>
                t.type === TransactionType.EXPENSE &&
                personalWalletIds.includes(t.walletId) &&
                t.date >= startDate &&
                t.date <= endDate
            )
            .reduce((sum, t) => sum + t.amount, 0);
    },

    getExpenseByCategory: (startDate: number, endDate: number, wallets: Wallet[], categories: Category[]) => {
        const { transactions } = get();
        const personalWalletIds = wallets
            .filter(w => w.type === WalletType.PERSONAL)
            .map(w => w.id);

        const categoryTotals = new Map<string, number>();

        transactions
            .filter(t =>
                t.type === TransactionType.EXPENSE &&
                personalWalletIds.includes(t.walletId) &&
                t.categoryId &&
                t.date >= startDate &&
                t.date <= endDate
            )
            .forEach(t => {
                const current = categoryTotals.get(t.categoryId!) || 0;
                categoryTotals.set(t.categoryId!, current + t.amount);
            });

        const result: CategoryTotal[] = [];
        categoryTotals.forEach((total, categoryId) => {
            const category = categories.find(c => c.id === categoryId);
            if (category) {
                result.push({
                    name: category.name,
                    color: category.color,
                    icon: category.icon,
                    total,
                    budget: category.budget
                });
            }
        });

        return result.sort((a, b) => b.total - a.total);
    },

    getIncomeByCategory: (startDate: number, endDate: number, wallets: Wallet[], categories: Category[]) => {
        const { transactions } = get();
        const personalWalletIds = wallets
            .filter(w => w.type === WalletType.PERSONAL)
            .map(w => w.id);

        const categoryTotals = new Map<string, number>();

        transactions
            .filter(t =>
                t.type === TransactionType.INCOME &&
                personalWalletIds.includes(t.walletId) &&
                t.categoryId &&
                t.date >= startDate &&
                t.date <= endDate
            )
            .forEach(t => {
                const current = categoryTotals.get(t.categoryId!) || 0;
                categoryTotals.set(t.categoryId!, current + t.amount);
            });

        const result: CategoryTotal[] = [];
        categoryTotals.forEach((total, categoryId) => {
            const category = categories.find(c => c.id === categoryId);
            if (category) {
                result.push({
                    name: category.name,
                    color: category.color,
                    icon: category.icon,
                    total,
                    budget: category.budget
                });
            }
        });

        return result.sort((a, b) => b.total - a.total);
    }
}));
