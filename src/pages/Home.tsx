import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { NavBar } from '../components/layout/NavBar';
import { formatCurrency } from '../utils/currencyFormatter';
import { formatDate, getMonthRange } from '../utils/dateUtils';
import { WalletType, TransactionType, CategoryType } from '../types';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    ChevronRight,
    Wallet,
    CreditCard,
    Banknote
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export const Home = () => {
    const navigate = useNavigate();
    const { user, preferences } = useAuthStore();
    const { wallets, loadWallets } = useWalletStore();
    const { categories, loadCategories } = useCategoryStore();
    const {
        transactions,
        loadTransactions,
        getWalletBalance,
        getTotalIncomeForPeriod,
        getTotalExpenseForPeriod,
        getRecentTransactions
    } = useTransactionStore();

    const currency = preferences?.currency || 'INR';

    // Load data on mount
    useEffect(() => {
        if (user) {
            loadWallets(user.uid);
            loadCategories(user.uid);
            loadTransactions(user.uid);
        }
    }, [user]);

    // Calculate balances
    const balances = useMemo(() => {
        const personalWallets = wallets.filter(w => w.type === WalletType.PERSONAL);
        const custodialWallets = wallets.filter(w => w.type === WalletType.CUSTODIAL);

        let totalBalance = 0;
        let bankBalance = 0;
        let cashBalance = 0;
        let custodialBalance = 0;

        // Calculate personal wallet balances
        for (const wallet of personalWallets) {
            const balance = getWalletBalance(wallet.id);
            totalBalance += balance;

            // Determine if bank or cash based on name
            const name = wallet.name.toLowerCase();
            if (name.includes('bank') || name.includes('upi') || name.includes('card')) {
                bankBalance += balance;
            } else {
                cashBalance += balance;
            }
        }

        // Calculate custodial balances
        const custodialWithBalances = custodialWallets.map(wallet => ({
            wallet,
            balance: getWalletBalance(wallet.id)
        }));

        custodialBalance = custodialWithBalances.reduce((sum, { balance }) => sum + balance, 0);

        return {
            totalBalance,
            bankBalance,
            cashBalance,
            custodialBalance,
            custodialWithBalances
        };
    }, [wallets, transactions]);

    // Monthly stats
    const monthlyStats = useMemo(() => {
        const { start, end } = getMonthRange();
        return {
            income: getTotalIncomeForPeriod(start, end, wallets),
            expense: getTotalExpenseForPeriod(start, end, wallets)
        };
    }, [transactions, wallets]);

    // Quick add categories (expense categories)
    const quickAddCategories = useMemo(() => {
        return categories
            .filter(c => c.type === CategoryType.EXPENSE)
            .slice(0, 8);
    }, [categories]);

    // Recent transactions
    const recentTransactions = useMemo(() => {
        return getRecentTransactions(wallets, categories, 5);
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

    const getTransactionIcon = (type: TransactionType) => {
        switch (type) {
            case TransactionType.INCOME:
            case TransactionType.OPENING_BALANCE:
                return <TrendingUp size={20} />;
            case TransactionType.EXPENSE:
                return <TrendingDown size={20} />;
            case TransactionType.TRANSFER:
                return <ArrowRightLeft size={20} />;
        }
    };

    const getTransactionColor = (type: TransactionType) => {
        switch (type) {
            case TransactionType.INCOME:
            case TransactionType.OPENING_BALANCE:
                return 'var(--color-success)';
            case TransactionType.EXPENSE:
                return 'var(--color-error)';
            case TransactionType.TRANSFER:
                return 'var(--color-transfer)';
        }
    };

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <p className="text-secondary text-sm mb-1">Total Balance</p>
                    <h1 className="text-3xl font-bold">{formatCurrency(balances.totalBalance, currency)}</h1>
                </div>

                {/* Balance Card */}
                <div className="balance-card mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="balance-label">Personal Accounts</p>
                            <p className="balance-amount">{formatCurrency(balances.totalBalance, currency)}</p>
                        </div>
                    </div>

                    <div className="flex gap-6 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                        <div className="flex items-center gap-2">
                            <CreditCard size={16} style={{ opacity: 0.8 }} />
                            <div>
                                <p className="text-xs" style={{ opacity: 0.7 }}>Bank</p>
                                <p className="font-semibold">{formatCurrency(balances.bankBalance, currency)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Banknote size={16} style={{ opacity: 0.8 }} />
                            <div>
                                <p className="text-xs" style={{ opacity: 0.7 }}>Cash</p>
                                <p className="font-semibold">{formatCurrency(balances.cashBalance, currency)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="stat-card" onClick={() => navigate('/analytics')}>
                        <div className="stat-icon income">
                            <TrendingUp size={20} />
                        </div>
                        <p className="stat-label">This Month Income</p>
                        <p className="stat-value income">+{formatCurrency(monthlyStats.income, currency)}</p>
                    </div>
                    <div className="stat-card" onClick={() => navigate('/analytics')}>
                        <div className="stat-icon expense">
                            <TrendingDown size={20} />
                        </div>
                        <p className="stat-label">This Month Expense</p>
                        <p className="stat-value expense">-{formatCurrency(monthlyStats.expense, currency)}</p>
                    </div>
                </div>

                {/* Quick Add */}
                {quickAddCategories.length > 0 && (
                    <div className="section">
                        <h2 className="section-title">Quick Add</h2>
                        <div className="quick-add-scroll">
                            {quickAddCategories.map(category => (
                                <button
                                    key={category.id}
                                    className="category-chip"
                                    onClick={() => navigate(`/add-transaction?category=${category.id}`)}
                                >
                                    <div
                                        className="category-chip-icon"
                                        style={{ background: category.color + '20', color: category.color }}
                                    >
                                        {getIcon(category.icon, 18)}
                                    </div>
                                    <span className="category-chip-name">{category.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Transactions */}
                <div className="section">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="section-title mb-0">Recent Transactions</h2>
                        <button
                            className="btn btn-ghost text-sm p-2"
                            onClick={() => navigate('/transactions')}
                        >
                            See All <ChevronRight size={16} />
                        </button>
                    </div>

                    {recentTransactions.length === 0 ? (
                        <div className="empty-state">
                            <Wallet className="empty-state-icon" />
                            <p className="empty-state-title">No transactions yet</p>
                            <p className="empty-state-text">Add your first transaction to get started</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {recentTransactions.map(transaction => (
                                <div
                                    key={transaction.id}
                                    className="transaction-item"
                                    onClick={() => navigate(`/edit-transaction/${transaction.id}`)}
                                >
                                    <div
                                        className="transaction-icon"
                                        style={{
                                            background: transaction.categoryColor
                                                ? transaction.categoryColor + '20'
                                                : 'var(--color-accent-light)',
                                            color: transaction.categoryColor || getTransactionColor(transaction.type)
                                        }}
                                    >
                                        {transaction.categoryIcon
                                            ? getIcon(transaction.categoryIcon)
                                            : getTransactionIcon(transaction.type)}
                                    </div>
                                    <div className="transaction-details">
                                        <p className="transaction-category">
                                            {transaction.categoryName || transaction.type}
                                        </p>
                                        <p className="transaction-wallet">{transaction.walletName}</p>
                                    </div>
                                    <div className="transaction-amount-container">
                                        <p className={`transaction-amount ${transaction.type === TransactionType.INCOME ||
                                                transaction.type === TransactionType.OPENING_BALANCE
                                                ? 'income'
                                                : transaction.type === TransactionType.EXPENSE
                                                    ? 'expense'
                                                    : 'transfer'
                                            }`}>
                                            {transaction.type === TransactionType.INCOME ||
                                                transaction.type === TransactionType.OPENING_BALANCE ? '+' : '-'}
                                            {formatCurrency(transaction.amount, currency)}
                                        </p>
                                        <p className="transaction-date">{formatDate(transaction.date)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Custodial Wallets (if any) */}
                {balances.custodialWithBalances.length > 0 && (
                    <div className="section">
                        <h2 className="section-title">Custodial Wallets</h2>
                        <div className="flex flex-col gap-2">
                            {balances.custodialWithBalances.map(({ wallet, balance }) => (
                                <div key={wallet.id} className="card flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ background: 'var(--color-accent-light)' }}
                                    >
                                        {getIcon(wallet.icon)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{wallet.name}</p>
                                    </div>
                                    <p className="font-semibold">{formatCurrency(balance, currency)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* FAB */}
            <button className="btn-fab" onClick={() => navigate('/add-transaction')}>
                <Plus size={24} />
            </button>

            <NavBar />
        </div>
    );
};
