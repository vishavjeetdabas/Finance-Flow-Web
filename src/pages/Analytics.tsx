import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { NavBar } from '../components/layout/NavBar';
import { formatCurrency } from '../utils/currencyFormatter';
import { getMonthRange, getWeekRange, getDayOfMonth, getDaysInMonth } from '../utils/dateUtils';
import {
    TrendingUp,
    TrendingDown,
    Flame,
    Target,
    PiggyBank,
    Wallet
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export const Analytics = () => {
    const { user, preferences } = useAuthStore();
    const { wallets, loadWallets } = useWalletStore();
    const { categories, loadCategories } = useCategoryStore();
    const {
        transactions,
        loadTransactions,
        getTotalIncomeForPeriod,
        getTotalExpenseForPeriod,
        getExpenseByCategory,
        getIncomeByCategory
    } = useTransactionStore();

    const [selectedTab, setSelectedTab] = useState<'expense' | 'income'>('expense');
    const currency = preferences?.currency || 'INR';

    useEffect(() => {
        if (user) {
            loadWallets(user.uid);
            loadCategories(user.uid);
            loadTransactions(user.uid);
        }
    }, [user]);

    // Calculate all analytics
    const analytics = useMemo(() => {
        const weekRange = getWeekRange();
        const monthRange = getMonthRange();
        const dayOfMonth = getDayOfMonth();
        const daysInMonth = getDaysInMonth();

        const weeklyIncome = getTotalIncomeForPeriod(weekRange.start, weekRange.end, wallets);
        const weeklyExpense = getTotalExpenseForPeriod(weekRange.start, weekRange.end, wallets);
        const monthlyIncome = getTotalIncomeForPeriod(monthRange.start, monthRange.end, wallets);
        const monthlyExpense = getTotalExpenseForPeriod(monthRange.start, monthRange.end, wallets);

        const monthlySavings = monthlyIncome - monthlyExpense;
        const burnRate = dayOfMonth > 0 ? monthlyExpense / dayOfMonth : 0;
        const projectedMonthlySpend = burnRate * daysInMonth;

        const expenseByCategory = getExpenseByCategory(monthRange.start, monthRange.end, wallets, categories);
        const incomeByCategory = getIncomeByCategory(monthRange.start, monthRange.end, wallets, categories);

        const top3Expense = expenseByCategory.slice(0, 3);

        return {
            weeklyIncome,
            weeklyExpense,
            monthlyIncome,
            monthlyExpense,
            monthlySavings,
            burnRate,
            projectedMonthlySpend,
            expenseByCategory,
            incomeByCategory,
            top3Expense
        };
    }, [transactions, wallets, categories]);

    // Get icon component
    const getIcon = (iconName: string, size: number = 20) => {
        const iconKey = iconName
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('') as keyof typeof LucideIcons;

        const IconComponent = LucideIcons[iconKey] as React.ComponentType<{ size: number }>;
        return IconComponent ? <IconComponent size={size} /> : <Wallet size={size} />;
    };

    const categoryData = selectedTab === 'expense'
        ? analytics.expenseByCategory
        : analytics.incomeByCategory;

    const totalCategoryAmount = categoryData.reduce((sum, c) => sum + c.total, 0);

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <h1 className="page-title">Analytics</h1>
                </div>

                {/* Weekly Stats */}
                <div className="section">
                    <h2 className="section-title">This Week</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="stat-card">
                            <div className="stat-icon income">
                                <TrendingUp size={20} />
                            </div>
                            <p className="stat-label">Income</p>
                            <p className="stat-value income">+{formatCurrency(analytics.weeklyIncome, currency)}</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon expense">
                                <TrendingDown size={20} />
                            </div>
                            <p className="stat-label">Expense</p>
                            <p className="stat-value expense">-{formatCurrency(analytics.weeklyExpense, currency)}</p>
                        </div>
                    </div>
                </div>

                {/* Monthly Stats */}
                <div className="section">
                    <h2 className="section-title">This Month</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="stat-card">
                            <div className="stat-icon income">
                                <TrendingUp size={20} />
                            </div>
                            <p className="stat-label">Income</p>
                            <p className="stat-value income">+{formatCurrency(analytics.monthlyIncome, currency)}</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon expense">
                                <TrendingDown size={20} />
                            </div>
                            <p className="stat-label">Expense</p>
                            <p className="stat-value expense">-{formatCurrency(analytics.monthlyExpense, currency)}</p>
                        </div>
                    </div>
                </div>

                {/* Insights */}
                <div className="section">
                    <h2 className="section-title">Insights</h2>
                    <div className="flex flex-col gap-3">
                        <div className="glass-card flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{
                                    background: analytics.monthlySavings >= 0
                                        ? 'var(--color-success-bg)'
                                        : 'var(--color-error-bg)'
                                }}
                            >
                                <PiggyBank
                                    size={24}
                                    style={{
                                        color: analytics.monthlySavings >= 0
                                            ? 'var(--color-success)'
                                            : 'var(--color-error)'
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-secondary">Monthly Savings</p>
                                <p className={`text-lg font-bold ${analytics.monthlySavings >= 0 ? 'text-success' : 'text-error'}`}>
                                    {analytics.monthlySavings >= 0 ? '+' : ''}{formatCurrency(analytics.monthlySavings, currency)}
                                </p>
                            </div>
                        </div>

                        <div className="glass-card flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ background: 'var(--color-warning)20' }}
                            >
                                <Flame size={24} style={{ color: 'var(--color-warning)' }} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-secondary">Daily Burn Rate</p>
                                <p className="text-lg font-bold">{formatCurrency(analytics.burnRate, currency)}/day</p>
                            </div>
                        </div>

                        <div className="glass-card flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ background: 'var(--color-accent-light)' }}
                            >
                                <Target size={24} className="text-accent" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-secondary">Projected Monthly Spend</p>
                                <p className="text-lg font-bold">{formatCurrency(analytics.projectedMonthlySpend, currency)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="section">
                    <h2 className="section-title">Category Breakdown</h2>

                    <div className="tabs mb-4">
                        <button
                            className={`tab ${selectedTab === 'expense' ? 'active' : ''}`}
                            onClick={() => setSelectedTab('expense')}
                        >
                            Expenses
                        </button>
                        <button
                            className={`tab ${selectedTab === 'income' ? 'active' : ''}`}
                            onClick={() => setSelectedTab('income')}
                        >
                            Income
                        </button>
                    </div>

                    {categoryData.length === 0 ? (
                        <div className="empty-state">
                            <Wallet className="empty-state-icon" />
                            <p className="empty-state-title">No data yet</p>
                            <p className="empty-state-text">
                                Add some {selectedTab === 'expense' ? 'expenses' : 'income'} to see the breakdown
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {categoryData.map(category => {
                                const percentage = totalCategoryAmount > 0
                                    ? (category.total / totalCategoryAmount) * 100
                                    : 0;

                                return (
                                    <div key={category.name} className="card">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{ background: category.color + '20', color: category.color }}
                                            >
                                                {getIcon(category.icon)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{category.name}</p>
                                                <p className="text-sm text-secondary">{percentage.toFixed(1)}%</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{formatCurrency(category.total, currency)}</p>
                                                {category.budget && (
                                                    <p className="text-xs text-secondary">
                                                        of {formatCurrency(category.budget, currency)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div
                                            className="h-2 rounded-full overflow-hidden"
                                            style={{ background: 'var(--color-border)' }}
                                        >
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${Math.min(percentage, 100)}%`,
                                                    background: category.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <NavBar />
        </div>
    );
};
