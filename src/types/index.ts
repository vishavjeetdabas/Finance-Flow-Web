// ============================================
// TYPES & INTERFACES
// ============================================

// Type constants matching Android app
export const WalletType = {
    PERSONAL: 'PERSONAL',
    CUSTODIAL: 'CUSTODIAL'
} as const;
export type WalletType = typeof WalletType[keyof typeof WalletType];

export const CategoryType = {
    INCOME: 'INCOME',
    EXPENSE: 'EXPENSE'
} as const;
export type CategoryType = typeof CategoryType[keyof typeof CategoryType];

export const TransactionType = {
    INCOME: 'INCOME',
    EXPENSE: 'EXPENSE',
    TRANSFER: 'TRANSFER',
    OPENING_BALANCE: 'OPENING_BALANCE'
} as const;
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export const TransactionMode = {
    EXPENSE: 'EXPENSE',
    INCOME: 'INCOME',
    TRANSFER: 'TRANSFER'
} as const;
export type TransactionMode = typeof TransactionMode[keyof typeof TransactionMode];

// Entity interfaces
export interface Wallet {
    id: string;
    name: string;
    type: WalletType;
    icon: string;
    isDefault: boolean;
    createdAt: number;
}

export interface Category {
    id: string;
    name: string;
    type: CategoryType;
    icon: string;
    color: string; // Hex color
    budget?: number;
    isDefault: boolean;
    createdAt: number;
}

export interface Transaction {
    id: string;
    amount: number;
    type: TransactionType;
    walletId: string;
    toWalletId?: string;
    categoryId?: string;
    note: string;
    transferReason?: string;
    date: number;
    createdAt: number;
}

// Extended transaction with joined data
export interface TransactionWithDetails extends Transaction {
    walletName: string;
    toWalletName?: string;
    categoryName?: string;
    categoryIcon?: string;
    categoryColor?: string;
}

// Analytics types
export interface CategoryTotal {
    name: string;
    color: string;
    icon: string;
    total: number;
    budget?: number;
}

export interface DayTotal {
    day: string;
    total: number;
}

export interface MonthTotal {
    month: string;
    total: number;
}

// User preferences
export interface UserPreferences {
    onboardingCompleted: boolean;
    darkMode: boolean;
    currency: string;
}

// Auth user
export interface AppUser {
    uid: string;
    email: string | null;
    displayName: string | null;
}

// State types for stores
export interface HomeState {
    totalBalance: number;
    bankBalance: number;
    cashBalance: number;
    custodialBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    recentTransactions: TransactionWithDetails[];
    wallets: Wallet[];
    custodialWalletsWithBalances: Array<{ wallet: Wallet; balance: number }>;
    quickAddCategories: Category[];
    isLoading: boolean;
}

export interface AnalyticsState {
    weeklyIncome: number;
    weeklyExpense: number;
    monthlyIncome: number;
    monthlyExpense: number;
    monthlySavings: number;
    burnRate: number;
    projectedMonthlySpend: number;
    expenseByCategory: CategoryTotal[];
    incomeByCategory: CategoryTotal[];
    top3ExpenseCategories: CategoryTotal[];
    selectedCategoryName: string | null;
    selectedCategoryHistory: DayTotal[] | MonthTotal[];
    selectedPeriod: 'DAILY' | 'MONTHLY';
    selectedTab: number;
    isLoading: boolean;
}
