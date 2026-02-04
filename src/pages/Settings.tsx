import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { dataService } from '../services/dataService';
import { NavBar } from '../components/layout/NavBar';
import { supportedCurrencies } from '../utils/currencyFormatter';
import { ThemeMode } from '../types';
import {
    Moon,
    Sun,
    Monitor,
    DollarSign,
    Trash2,
    LogOut,
    Wallet,
    FileText,
    AlertTriangle,
    ChevronDown
} from 'lucide-react';

export const Settings = () => {
    const navigate = useNavigate();
    const { user, preferences, updatePreferences, signOut } = useAuthStore();
    const { clearWallets } = useWalletStore();
    const { clearCategories } = useCategoryStore();
    const { clearTransactions } = useTransactionStore();

    const [isResetting, setIsResetting] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Get current theme mode with fallback for backward compatibility
    const themeMode: ThemeMode = preferences?.themeMode ?? (preferences?.darkMode ? 'dark' : 'light');
    const currency = preferences?.currency ?? 'INR';

    // Handle theme change with system preference detection
    const handleThemeChange = async (mode: ThemeMode) => {
        const isDark = mode === 'system'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : mode === 'dark';

        await updatePreferences({ themeMode: mode, darkMode: isDark });
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };

    // Listen for system theme changes when in system mode
    useEffect(() => {
        if (themeMode !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [themeMode]);

    const handleCurrencyChange = async (newCurrency: string) => {
        await updatePreferences({ currency: newCurrency });
    };

    const handleResetApp = async () => {
        if (!user) return;

        setIsResetting(true);
        try {
            await dataService.clearAllUserData(user.uid);
            clearWallets();
            clearCategories();
            clearTransactions();
            await updatePreferences({ onboardingCompleted: false });
            navigate('/onboarding');
        } catch (err) {
            console.error('Failed to reset app:', err);
        } finally {
            setIsResetting(false);
            setShowResetConfirm(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (err) {
            console.error('Failed to sign out:', err);
        }
    };

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <h1 className="page-title">Settings</h1>
                </div>

                {/* User Info */}
                <div className="section">
                    <div className="card flex items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                            style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
                        >
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">{user?.email}</p>
                            <p className="text-sm text-secondary">Synced to cloud</p>
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="section">
                    <h2 className="section-title">Appearance</h2>
                    <div className="card">
                        <div className="flex items-center gap-4 mb-4">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ background: 'var(--color-accent-light)' }}
                            >
                                {themeMode === 'dark' ? <Moon size={20} className="text-accent" /> :
                                    themeMode === 'light' ? <Sun size={20} className="text-accent" /> :
                                        <Monitor size={20} className="text-accent" />}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Theme</p>
                                <p className="text-sm text-secondary">Choose your preferred theme</p>
                            </div>
                        </div>
                        <div className="tabs">
                            <button
                                className={`tab ${themeMode === 'light' ? 'active' : ''}`}
                                onClick={() => handleThemeChange('light')}
                            >
                                <Sun size={16} className="mr-1" />
                                Light
                            </button>
                            <button
                                className={`tab ${themeMode === 'dark' ? 'active' : ''}`}
                                onClick={() => handleThemeChange('dark')}
                            >
                                <Moon size={16} className="mr-1" />
                                Dark
                            </button>
                            <button
                                className={`tab ${themeMode === 'system' ? 'active' : ''}`}
                                onClick={() => handleThemeChange('system')}
                            >
                                <Monitor size={16} className="mr-1" />
                                System
                            </button>
                        </div>
                    </div>
                </div>

                {/* Currency */}
                <div className="section">
                    <h2 className="section-title">Currency</h2>
                    <div className="card">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ background: 'var(--color-success-bg)' }}
                            >
                                <DollarSign size={20} className="text-success" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Currency</p>
                                <p className="text-sm text-secondary">Symbol display only</p>
                            </div>
                            <div className="relative">
                                <select
                                    value={currency}
                                    onChange={(e) => handleCurrencyChange(e.target.value)}
                                    className="input pr-10 appearance-none cursor-pointer min-w-[120px]"
                                    style={{ paddingRight: '2.5rem' }}
                                >
                                    {supportedCurrencies.map(curr => (
                                        <option key={curr.code} value={curr.code}>
                                            {curr.symbol} {curr.code}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={18}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wallets */}
                <div className="section">
                    <h2 className="section-title">Wallets</h2>
                    <button
                        className="card flex items-center gap-4 w-full"
                        onClick={() => navigate('/wallets')}
                    >
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--color-accent-light)' }}
                        >
                            <Wallet size={20} className="text-accent" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-medium">Manage Wallets</p>
                            <p className="text-sm text-secondary">Add, edit, or delete wallets</p>
                        </div>
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="section">
                    <h2 className="section-title text-error">Danger Zone</h2>
                    <div className="flex flex-col gap-2">
                        <button
                            className="card flex items-center gap-4 w-full"
                            onClick={() => setShowResetConfirm(true)}
                        >
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ background: 'var(--color-error-bg)' }}
                            >
                                <Trash2 size={20} className="text-error" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium text-error">Reset App</p>
                                <p className="text-sm text-secondary">Delete all data and start fresh</p>
                            </div>
                        </button>

                        <button
                            className="card flex items-center gap-4 w-full"
                            onClick={handleSignOut}
                        >
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ background: 'var(--color-border)' }}
                            >
                                <LogOut size={20} className="text-secondary" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium">Sign Out</p>
                                <p className="text-sm text-secondary">Sign out of your account</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <div
                                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                                style={{ background: 'var(--color-error-bg)' }}
                            >
                                <AlertTriangle size={32} className="text-error" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Reset App?</h2>
                            <p className="text-secondary mb-6">
                                This will permanently delete all your wallets, categories, and transactions.
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    className="btn btn-secondary flex-1"
                                    onClick={() => setShowResetConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-danger flex-1"
                                    onClick={handleResetApp}
                                    disabled={isResetting}
                                >
                                    {isResetting ? (
                                        <div className="spinner" style={{ width: '20px', height: '20px' }} />
                                    ) : (
                                        'Reset'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <NavBar />
        </div>
    );
};
