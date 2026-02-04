import { create } from 'zustand';
import { dataService } from '../services/dataService';
import { Wallet, WalletType } from '../types';

interface WalletState {
    wallets: Wallet[];
    isLoading: boolean;
    error: string | null;

    // Actions
    loadWallets: (userId: string) => Promise<void>;
    addWallet: (userId: string, wallet: Omit<Wallet, 'id'>) => Promise<string>;
    updateWallet: (userId: string, walletId: string, data: Partial<Wallet>) => Promise<void>;
    deleteWallet: (userId: string, walletId: string) => Promise<void>;
    clearWallets: () => void;

    // Computed getters
    getPersonalWallets: () => Wallet[];
    getCustodialWallets: () => Wallet[];
    getWalletById: (id: string) => Wallet | undefined;
}

export const useWalletStore = create<WalletState>((set, get) => ({
    wallets: [],
    isLoading: false,
    error: null,

    loadWallets: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const wallets = await dataService.getWallets(userId);
            set({ wallets, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    addWallet: async (userId: string, wallet: Omit<Wallet, 'id'>) => {
        try {
            const id = await dataService.addWallet(userId, wallet);
            const newWallet = { ...wallet, id };
            set({ wallets: [...get().wallets, newWallet] });
            return id;
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    updateWallet: async (userId: string, walletId: string, data: Partial<Wallet>) => {
        try {
            await dataService.updateWallet(userId, walletId, data);
            set({
                wallets: get().wallets.map(w =>
                    w.id === walletId ? { ...w, ...data } : w
                )
            });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    deleteWallet: async (userId: string, walletId: string) => {
        try {
            await dataService.deleteWallet(userId, walletId);
            set({ wallets: get().wallets.filter(w => w.id !== walletId) });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    clearWallets: () => set({ wallets: [] }),

    getPersonalWallets: () => {
        return get().wallets.filter(w => w.type === WalletType.PERSONAL);
    },

    getCustodialWallets: () => {
        return get().wallets.filter(w => w.type === WalletType.CUSTODIAL);
    },

    getWalletById: (id: string) => {
        return get().wallets.find(w => w.id === id);
    }
}));
