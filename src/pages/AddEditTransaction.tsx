import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { formatCurrency, getCurrencySymbol } from '../utils/currencyFormatter';
import { formatDateForInput, parseDateFromInput } from '../utils/dateUtils';
import { TransactionType, TransactionMode, CategoryType, WalletType } from '../types';
import {
    ArrowLeft,
    Check,
    Trash2,
    Wallet,
    Calendar
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export const AddEditTransaction = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isEditMode = !!id;

    const { user, preferences } = useAuthStore();
    const { wallets, loadWallets } = useWalletStore();
    const { categories, loadCategories, getExpenseCategories, getIncomeCategories } = useCategoryStore();
    const { transactions, loadTransactions, addTransaction, updateTransaction, deleteTransaction } = useTransactionStore();

    const [mode, setMode] = useState<TransactionMode>(TransactionMode.EXPENSE);
    const [amount, setAmount] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [selectedWalletId, setSelectedWalletId] = useState<string>('');
    const [toWalletId, setToWalletId] = useState<string>('');
    const [note, setNote] = useState('');
    const [transferReason, setTransferReason] = useState('');
    const [date, setDate] = useState(formatDateForInput(Date.now()));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const currency = preferences?.currency || 'INR';

    useEffect(() => {
        if (user) {
            loadWallets(user.uid);
            loadCategories(user.uid);
            loadTransactions(user.uid);
        }
    }, [user]);

    // Set default wallet once loaded
    useEffect(() => {
        if (wallets.length > 0 && !selectedWalletId) {
            const defaultWallet = wallets.find(w => w.isDefault) || wallets[0];
            setSelectedWalletId(defaultWallet.id);

            // Find a different wallet for transfer destination
            const otherWallet = wallets.find(w => w.id !== defaultWallet.id);
            if (otherWallet) setToWalletId(otherWallet.id);
        }
    }, [wallets]);

    // Set category from URL param
    useEffect(() => {
        const categoryId = searchParams.get('category');
        if (categoryId && categories.length > 0) {
            const category = categories.find(c => c.id === categoryId);
            if (category) {
                setSelectedCategoryId(categoryId);
                setMode(category.type === CategoryType.INCOME ? TransactionMode.INCOME : TransactionMode.EXPENSE);
            }
        }
    }, [searchParams, categories]);

    // Load existing transaction in edit mode
    useEffect(() => {
        if (isEditMode && transactions.length > 0) {
            const txn = transactions.find(t => t.id === id);
            if (txn) {
                setAmount(txn.amount.toString());
                setSelectedCategoryId(txn.categoryId || '');
                setSelectedWalletId(txn.walletId);
                setToWalletId(txn.toWalletId || '');
                setNote(txn.note);
                setTransferReason(txn.transferReason || '');
                setDate(formatDateForInput(txn.date));

                if (txn.type === TransactionType.TRANSFER) {
                    setMode(TransactionMode.TRANSFER);
                } else if (txn.type === TransactionType.INCOME) {
                    setMode(TransactionMode.INCOME);
                } else {
                    setMode(TransactionMode.EXPENSE);
                }
            }
        }
    }, [isEditMode, id, transactions]);

    // Get available categories based on mode
    const availableCategories = useMemo(() => {
        if (mode === TransactionMode.TRANSFER) return [];
        return mode === TransactionMode.INCOME ? getIncomeCategories() : getExpenseCategories();
    }, [mode, categories]);

    // Auto-select first category when mode changes
    useEffect(() => {
        if (availableCategories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(availableCategories[0].id);
        }
    }, [availableCategories]);

    // Get icon component
    const getIcon = (iconName: string, size: number = 20) => {
        const iconKey = iconName
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('') as keyof typeof LucideIcons;

        const IconComponent = LucideIcons[iconKey] as React.ComponentType<{ size: number }>;
        return IconComponent ? <IconComponent size={size} /> : <Wallet size={size} />;
    };

    const handleSave = async () => {
        if (!user) return;

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (mode !== TransactionMode.TRANSFER && !selectedCategoryId) {
            setError('Please select a category');
            return;
        }

        if (mode === TransactionMode.TRANSFER && selectedWalletId === toWalletId) {
            setError('Please select different wallets for transfer');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const transactionData = {
                amount: amountNum,
                type: mode === TransactionMode.TRANSFER
                    ? TransactionType.TRANSFER
                    : mode === TransactionMode.INCOME
                        ? TransactionType.INCOME
                        : TransactionType.EXPENSE,
                walletId: selectedWalletId,
                toWalletId: mode === TransactionMode.TRANSFER ? toWalletId : undefined,
                categoryId: mode !== TransactionMode.TRANSFER ? selectedCategoryId : undefined,
                note,
                transferReason: mode === TransactionMode.TRANSFER ? transferReason : undefined,
                date: parseDateFromInput(date),
                createdAt: Date.now()
            };

            if (isEditMode) {
                await updateTransaction(user.uid, id!, transactionData);
            } else {
                await addTransaction(user.uid, transactionData);
            }

            navigate(-1);
        } catch (err: any) {
            setError(err.message || 'Failed to save transaction');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !id) return;

        if (!confirm('Are you sure you want to delete this transaction?')) return;

        setIsLoading(true);
        try {
            await deleteTransaction(user.uid, id);
            navigate(-1);
        } catch (err: any) {
            setError(err.message || 'Failed to delete transaction');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="page-header flex items-center gap-4">
                    <button className="btn btn-icon btn-secondary" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="page-title flex-1">{isEditMode ? 'Edit' : 'Add'} Transaction</h1>
                    {isEditMode && (
                        <button className="btn btn-icon btn-danger" onClick={handleDelete}>
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>

                {/* Mode Tabs */}
                <div className="tabs mb-6">
                    {[
                        { value: TransactionMode.EXPENSE, label: 'Expense' },
                        { value: TransactionMode.INCOME, label: 'Income' },
                        { value: TransactionMode.TRANSFER, label: 'Transfer' }
                    ].map(({ value, label }) => (
                        <button
                            key={value}
                            className={`tab ${mode === value ? 'active' : ''}`}
                            onClick={() => setMode(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Amount Input */}
                <div className="text-center mb-6">
                    <p className="text-sm text-secondary mb-2">Amount</p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl font-bold text-secondary">{getCurrencySymbol(currency)}</span>
                        <input
                            type="number"
                            className="input input-amount"
                            style={{ maxWidth: '200px' }}
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Category Selection (not for transfer) */}
                {mode !== TransactionMode.TRANSFER && (
                    <div className="section">
                        <h2 className="section-title">Category</h2>
                        <div className="grid grid-cols-4 gap-3">
                            {availableCategories.map(category => (
                                <button
                                    key={category.id}
                                    className={`category-chip ${selectedCategoryId === category.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedCategoryId(category.id)}
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

                {/* Wallet Selection */}
                <div className="section">
                    <h2 className="section-title">
                        {mode === TransactionMode.TRANSFER ? 'From Wallet' : 'Wallet'}
                    </h2>
                    <div className="flex flex-col gap-2">
                        {wallets.map(wallet => (
                            <button
                                key={wallet.id}
                                className={`card flex items-center gap-3 ${selectedWalletId === wallet.id ? 'border-accent' : ''}`}
                                style={{
                                    borderColor: selectedWalletId === wallet.id ? 'var(--color-accent)' : undefined,
                                    borderWidth: selectedWalletId === wallet.id ? '2px' : '1px'
                                }}
                                onClick={() => setSelectedWalletId(wallet.id)}
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ background: 'var(--color-accent-light)' }}
                                >
                                    {getIcon(wallet.icon)}
                                </div>
                                <span className="font-medium flex-1 text-left">{wallet.name}</span>
                                {selectedWalletId === wallet.id && <Check size={20} className="text-accent" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* To Wallet (for transfer) */}
                {mode === TransactionMode.TRANSFER && (
                    <div className="section">
                        <h2 className="section-title">To Wallet</h2>
                        <div className="flex flex-col gap-2">
                            {wallets
                                .filter(w => w.id !== selectedWalletId)
                                .map(wallet => (
                                    <button
                                        key={wallet.id}
                                        className={`card flex items-center gap-3`}
                                        style={{
                                            borderColor: toWalletId === wallet.id ? 'var(--color-accent)' : undefined,
                                            borderWidth: toWalletId === wallet.id ? '2px' : '1px'
                                        }}
                                        onClick={() => setToWalletId(wallet.id)}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ background: 'var(--color-accent-light)' }}
                                        >
                                            {getIcon(wallet.icon)}
                                        </div>
                                        <span className="font-medium flex-1 text-left">{wallet.name}</span>
                                        {toWalletId === wallet.id && <Check size={20} className="text-accent" />}
                                    </button>
                                ))}
                        </div>
                    </div>
                )}

                {/* Date */}
                <div className="section">
                    <h2 className="section-title">Date</h2>
                    <div className="relative">
                        <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                        <input
                            type="date"
                            className="input"
                            style={{ paddingLeft: '48px' }}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Note */}
                <div className="section">
                    <h2 className="section-title">Note (Optional)</h2>
                    <input
                        type="text"
                        className="input"
                        placeholder="Add a note..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>

                {/* Transfer Reason */}
                {mode === TransactionMode.TRANSFER && (
                    <div className="section">
                        <h2 className="section-title">Transfer Reason (Optional)</h2>
                        <input
                            type="text"
                            className="input"
                            placeholder="Why are you transferring?"
                            value={transferReason}
                            onChange={(e) => setTransferReason(e.target.value)}
                        />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="p-3 rounded-lg mb-4" style={{ background: 'var(--color-error-bg)' }}>
                        <p className="text-sm text-error">{error}</p>
                    </div>
                )}

                {/* Save Button */}
                <button
                    className="btn btn-primary btn-full"
                    onClick={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="spinner" style={{ width: '20px', height: '20px' }} />
                    ) : (
                        <>
                            <Check size={20} />
                            {isEditMode ? 'Update' : 'Save'} Transaction
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
