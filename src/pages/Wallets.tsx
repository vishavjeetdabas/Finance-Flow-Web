import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';
import { useTransactionStore } from '../stores/transactionStore';
import { formatCurrency } from '../utils/currencyFormatter';
import { WalletType } from '../types';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit2,
    Wallet,
    CreditCard,
    Banknote
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export const Wallets = () => {
    const navigate = useNavigate();
    const { user, preferences } = useAuthStore();
    const { wallets, loadWallets, deleteWallet } = useWalletStore();
    const { loadTransactions, getWalletBalance } = useTransactionStore();
    const [selectedTab, setSelectedTab] = useState<'personal' | 'custodial'>('personal');

    const currency = preferences?.currency || 'INR';

    useEffect(() => {
        if (user) {
            loadWallets(user.uid);
            loadTransactions(user.uid);
        }
    }, [user]);

    const filteredWallets = wallets.filter(w =>
        w.type === (selectedTab === 'personal' ? WalletType.PERSONAL : WalletType.CUSTODIAL)
    );

    // Get icon component
    const getIcon = (iconName: string, size: number = 20) => {
        const iconKey = iconName
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('') as keyof typeof LucideIcons;

        const IconComponent = LucideIcons[iconKey] as React.ComponentType<{ size: number }>;
        return IconComponent ? <IconComponent size={size} /> : <Wallet size={size} />;
    };

    const handleDelete = async (walletId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        if (!confirm('Are you sure you want to delete this wallet? All transactions in this wallet will be affected.')) return;

        try {
            await deleteWallet(user.uid, walletId);
        } catch (err) {
            console.error('Failed to delete wallet:', err);
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
                    <h1 className="page-title flex-1">Wallets</h1>
                    <button
                        className="btn btn-primary btn-icon"
                        onClick={() => navigate(`/add-wallet?type=${selectedTab}`)}
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="tabs mb-6">
                    <button
                        className={`tab ${selectedTab === 'personal' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('personal')}
                    >
                        Personal
                    </button>
                    <button
                        className={`tab ${selectedTab === 'custodial' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('custodial')}
                    >
                        Custodial
                    </button>
                </div>

                {/* Info Card */}
                <div className="glass-card mb-6">
                    <p className="text-sm text-secondary">
                        {selectedTab === 'personal'
                            ? 'Personal wallets are included in your total balance and analytics.'
                            : 'Custodial wallets track money you hold for others (excluded from analytics).'}
                    </p>
                </div>

                {/* Wallet List */}
                {filteredWallets.length === 0 ? (
                    <div className="empty-state">
                        <Wallet className="empty-state-icon" />
                        <p className="empty-state-title">No {selectedTab} wallets</p>
                        <p className="empty-state-text">Add a wallet to start tracking</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredWallets.map(wallet => {
                            const balance = getWalletBalance(wallet.id);

                            return (
                                <div key={wallet.id} className="card">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ background: 'var(--color-accent-light)' }}
                                        >
                                            {getIcon(wallet.icon, 24)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold">{wallet.name}</p>
                                            <p className="text-sm text-secondary">
                                                Balance: {formatCurrency(balance, currency)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="btn btn-icon btn-secondary"
                                                onClick={() => navigate(`/edit-wallet/${wallet.id}`)}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            {!wallet.isDefault && (
                                                <button
                                                    className="btn btn-icon btn-secondary"
                                                    onClick={(e) => handleDelete(wallet.id, e)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
