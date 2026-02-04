import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { NavBar } from '../components/layout/NavBar';
import { formatCurrency } from '../utils/currencyFormatter';
import { formatDate, formatFullDate, getMonthRange, getWeekRange } from '../utils/dateUtils';
import { TransactionType, TransactionWithDetails } from '../types';
import {
    Filter,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    Wallet,
    X,
    Calendar
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

type FilterPeriod = 'all' | 'week' | 'month' | 'custom';
type FilterType = 'all' | 'income' | 'expense' | 'transfer';

export const Transactions = () => {
    const navigate = useNavigate();
    const { user, preferences } = useAuthStore();
    const { wallets, loadWallets } = useWalletStore();
    const { categories, loadCategories } = useCategoryStore();
    const { transactions, loadTransactions, getTransactionsWithDetails } = useTransactionStore();

    const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [showFilters, setShowFilters] = useState(false);

    const currency = preferences?.currency || 'INR';

    useEffect(() => {
        if (user) {
            loadWallets(user.uid);
            loadCategories(user.uid);
            loadTransactions(user.uid);
        }
    }, [user]);

    // Get icon component
    const getIcon = (iconName: string, size: number = 20) => {
        const iconKey = iconName
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('') as keyof typeof LucideIcons;

        const IconComponent = LucideIcons[iconKey] as React.ComponentType<{ size: number }>;
        return IconComponent ? <IconComponent size={size} /> : <Wallet size={size} />;
    };

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        let result = getTransactionsWithDetails(wallets, categories);

        // Filter by period
        if (filterPeriod !== 'all') {
            const now = new Date();
            let range: { start: number; end: number };

            if (filterPeriod === 'week') {
                range = getWeekRange(now);
            } else if (filterPeriod === 'month') {
                range = getMonthRange(now);
            } else {
                range = { start: 0, end: Date.now() };
            }

            result = result.filter(t => t.date >= range.start && t.date <= range.end);
        }

        // Filter by type
        if (filterType !== 'all') {
            result = result.filter(t => {
                if (filterType === 'income') {
                    return t.type === TransactionType.INCOME || t.type === TransactionType.OPENING_BALANCE;
                }
                if (filterType === 'expense') return t.type === TransactionType.EXPENSE;
                if (filterType === 'transfer') return t.type === TransactionType.TRANSFER;
                return true;
            });
        }

        return result;
    }, [transactions, wallets, categories, filterPeriod, filterType]);

    // Group by date
    const groupedTransactions = useMemo(() => {
        const groups = new Map<string, TransactionWithDetails[]>();

        for (const t of filteredTransactions) {
            const dateKey = formatFullDate(t.date);
            if (!groups.has(dateKey)) {
                groups.set(dateKey, []);
            }
            groups.get(dateKey)!.push(t);
        }

        return Array.from(groups.entries());
    }, [filteredTransactions]);

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

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="page-header flex justify-between items-center">
                    <h1 className="page-title">Transactions</h1>
                    <button
                        className={`btn btn-icon ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={20} />
                    </button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="card mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold">Filters</h3>
                            <button onClick={() => setShowFilters(false)}>
                                <X size={20} className="text-secondary" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-secondary mb-2">Period</p>
                            <div className="tabs">
                                {[
                                    { value: 'all', label: 'All' },
                                    { value: 'week', label: 'Week' },
                                    { value: 'month', label: 'Month' }
                                ].map(({ value, label }) => (
                                    <button
                                        key={value}
                                        className={`tab ${filterPeriod === value ? 'active' : ''}`}
                                        onClick={() => setFilterPeriod(value as FilterPeriod)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-secondary mb-2">Type</p>
                            <div className="tabs">
                                {[
                                    { value: 'all', label: 'All' },
                                    { value: 'expense', label: 'Expense' },
                                    { value: 'income', label: 'Income' },
                                    { value: 'transfer', label: 'Transfer' }
                                ].map(({ value, label }) => (
                                    <button
                                        key={value}
                                        className={`tab ${filterType === value ? 'active' : ''}`}
                                        onClick={() => setFilterType(value as FilterType)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Transaction List */}
                {groupedTransactions.length === 0 ? (
                    <div className="empty-state">
                        <Wallet className="empty-state-icon" />
                        <p className="empty-state-title">No transactions found</p>
                        <p className="empty-state-text">
                            {filterPeriod !== 'all' || filterType !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Start tracking by adding your first transaction'}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {groupedTransactions.map(([date, txns]) => (
                            <div key={date}>
                                <p className="text-sm font-medium text-secondary mb-2 flex items-center gap-2">
                                    <Calendar size={14} />
                                    {date}
                                </p>
                                <div className="flex flex-col gap-2">
                                    {txns.map(transaction => (
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
                                                    color: transaction.categoryColor || 'var(--color-accent)'
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
                                                <p className="transaction-wallet">
                                                    {transaction.walletName}
                                                    {transaction.toWalletName && ` → ${transaction.toWalletName}`}
                                                </p>
                                                {transaction.note && (
                                                    <p className="text-xs text-tertiary truncate">{transaction.note}</p>
                                                )}
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
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <NavBar />
        </div>
    );
};
