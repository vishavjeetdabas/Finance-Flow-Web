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
import { jsPDF } from 'jspdf';
import {
    Filter,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    Wallet,
    X,
    Calendar,
    FileDown
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
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportType, setExportType] = useState<FilterType>('all');

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

    // Export to PDF function
    const exportToPDF = () => {
        const doc = new jsPDF();

        // Filter transactions for export
        let exportData = filteredTransactions;
        if (exportType !== 'all') {
            exportData = exportData.filter(t => {
                if (exportType === 'income') return t.type === TransactionType.INCOME || t.type === TransactionType.OPENING_BALANCE;
                if (exportType === 'expense') return t.type === TransactionType.EXPENSE;
                if (exportType === 'transfer') return t.type === TransactionType.TRANSFER;
                return true;
            });
        }

        // Header
        doc.setFontSize(20);
        doc.setTextColor(255, 107, 53); // Accent color
        doc.text('FinanceFlow', 105, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Transaction Report', 105, 30, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 38, { align: 'center' });
        doc.text(`Type: ${exportType.charAt(0).toUpperCase() + exportType.slice(1)}`, 105, 44, { align: 'center' });

        // Table headers
        let y = 55;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Date', 20, y);
        doc.text('Category', 55, y);
        doc.text('Type', 110, y);
        doc.text('Amount', 180, y, { align: 'right' });

        // Draw line under headers
        doc.setDrawColor(200, 200, 200);
        doc.line(20, y + 2, 190, y + 2);
        y += 10;

        // Table content
        doc.setTextColor(0, 0, 0);
        let totalIncome = 0;
        let totalExpense = 0;

        exportData.forEach((t, index) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            const dateStr = formatDate(t.date);
            const category = t.categoryName || t.type;
            const type = t.type;
            const amount = formatCurrency(t.amount, currency);

            // Alternate row background
            if (index % 2 === 0) {
                doc.setFillColor(248, 249, 250);
                doc.rect(15, y - 5, 180, 8, 'F');
            }

            doc.text(dateStr, 20, y);
            doc.text(category.substring(0, 25), 55, y);
            doc.text(type, 110, y);

            // Color code amounts
            if (t.type === TransactionType.INCOME || t.type === TransactionType.OPENING_BALANCE) {
                doc.setTextColor(52, 199, 89); // Green
                doc.text('+' + amount, 180, y, { align: 'right' });
                totalIncome += t.amount;
            } else if (t.type === TransactionType.EXPENSE) {
                doc.setTextColor(255, 59, 48); // Red
                doc.text('-' + amount, 180, y, { align: 'right' });
                totalExpense += t.amount;
            } else {
                doc.setTextColor(0, 122, 255); // Blue for transfers
                doc.text(amount, 180, y, { align: 'right' });
            }
            doc.setTextColor(0, 0, 0);

            y += 8;
        });

        // Summary
        y += 10;
        if (y > 260) {
            doc.addPage();
            y = 20;
        }

        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, 190, y);
        y += 10;

        doc.setFontSize(11);
        doc.setTextColor(52, 199, 89);
        doc.text(`Total Income: +${formatCurrency(totalIncome, currency)}`, 20, y);
        y += 8;
        doc.setTextColor(255, 59, 48);
        doc.text(`Total Expense: -${formatCurrency(totalExpense, currency)}`, 20, y);
        y += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`Net: ${formatCurrency(totalIncome - totalExpense, currency)}`, 20, y);

        // Save the PDF
        doc.save(`financeflow-transactions-${new Date().toISOString().split('T')[0]}.pdf`);
        setShowExportModal(false);
    };

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="page-header flex justify-between items-center">
                    <h1 className="page-title">Transactions</h1>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-icon btn-secondary"
                            onClick={() => setShowExportModal(true)}
                            title="Export PDF"
                        >
                            <FileDown size={20} />
                        </button>
                        <button
                            className={`btn btn-icon ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={20} />
                        </button>
                    </div>
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

            {/* Export Modal */}
            {showExportModal && (
                <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Export Transactions</h2>
                            <button onClick={() => setShowExportModal(false)}>
                                <X size={24} className="text-secondary" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-secondary mb-3">Select transaction type to export:</p>
                            <div className="tabs">
                                {[
                                    { value: 'all', label: 'All' },
                                    { value: 'expense', label: 'Expense' },
                                    { value: 'income', label: 'Income' },
                                    { value: 'transfer', label: 'Transfer' }
                                ].map(({ value, label }) => (
                                    <button
                                        key={value}
                                        className={`tab ${exportType === value ? 'active' : ''}`}
                                        onClick={() => setExportType(value as FilterType)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <p className="text-sm text-tertiary mb-4">
                            {filteredTransactions.length} transactions will be exported based on current filters.
                        </p>

                        <div className="flex gap-3">
                            <button
                                className="btn btn-secondary flex-1"
                                onClick={() => setShowExportModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary flex-1"
                                onClick={exportToPDF}
                            >
                                <FileDown size={20} />
                                Export PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <NavBar />
        </div>
    );
};
