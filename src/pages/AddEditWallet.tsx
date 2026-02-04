import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';
import { WalletType } from '../types';
import { ArrowLeft, Check, Wallet } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const walletIcons = [
    'wallet', 'credit-card', 'banknote', 'building-2', 'piggy-bank',
    'landmark', 'coins', 'receipt', 'briefcase', 'shopping-bag'
];

export const AddEditWallet = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isEditMode = !!id;

    const { user } = useAuthStore();
    const { wallets, loadWallets, addWallet, updateWallet } = useWalletStore();

    const [name, setName] = useState('');
    const [type, setType] = useState<WalletType>(WalletType.PERSONAL);
    const [icon, setIcon] = useState('wallet');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            loadWallets(user.uid);
        }
    }, [user]);

    // Set type from URL param
    useEffect(() => {
        const typeParam = searchParams.get('type');
        if (typeParam === 'custodial') {
            setType(WalletType.CUSTODIAL);
        }
    }, [searchParams]);

    // Load existing wallet in edit mode
    useEffect(() => {
        if (isEditMode && wallets.length > 0) {
            const wallet = wallets.find(w => w.id === id);
            if (wallet) {
                setName(wallet.name);
                setType(wallet.type);
                setIcon(wallet.icon);
            }
        }
    }, [isEditMode, id, wallets]);

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

        if (!name.trim()) {
            setError('Please enter a wallet name');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            if (isEditMode) {
                await updateWallet(user.uid, id!, { name, type, icon });
            } else {
                await addWallet(user.uid, {
                    name,
                    type,
                    icon,
                    isDefault: false,
                    createdAt: Date.now()
                });
            }
            navigate(-1);
        } catch (err: any) {
            setError(err.message || 'Failed to save wallet');
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
                    <h1 className="page-title">{isEditMode ? 'Edit' : 'Add'} Wallet</h1>
                </div>

                {/* Name */}
                <div className="section">
                    <h2 className="section-title">Name</h2>
                    <input
                        type="text"
                        className="input"
                        placeholder="Wallet name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Type */}
                <div className="section">
                    <h2 className="section-title">Type</h2>
                    <div className="tabs">
                        <button
                            className={`tab ${type === WalletType.PERSONAL ? 'active' : ''}`}
                            onClick={() => setType(WalletType.PERSONAL)}
                        >
                            Personal
                        </button>
                        <button
                            className={`tab ${type === WalletType.CUSTODIAL ? 'active' : ''}`}
                            onClick={() => setType(WalletType.CUSTODIAL)}
                        >
                            Custodial
                        </button>
                    </div>
                    <p className="text-sm text-secondary mt-2">
                        {type === WalletType.PERSONAL
                            ? 'Included in your total balance and analytics'
                            : 'For tracking money you hold for others (excluded from analytics)'}
                    </p>
                </div>

                {/* Icon */}
                <div className="section">
                    <h2 className="section-title">Icon</h2>
                    <div className="grid grid-cols-5 gap-3">
                        {walletIcons.map(iconName => (
                            <button
                                key={iconName}
                                className={`p-4 rounded-lg flex items-center justify-center transition-all ${icon === iconName ? 'bg-accent' : 'bg-surface border border-border'
                                    }`}
                                style={{
                                    background: icon === iconName ? 'var(--color-accent)' : 'var(--color-surface)',
                                    borderColor: 'var(--color-border)',
                                    color: icon === iconName ? 'white' : 'var(--color-text-primary)'
                                }}
                                onClick={() => setIcon(iconName)}
                            >
                                {getIcon(iconName, 24)}
                            </button>
                        ))}
                    </div>
                </div>

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
                            {isEditMode ? 'Update' : 'Create'} Wallet
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
