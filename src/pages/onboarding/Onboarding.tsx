import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { WalletType, TransactionType } from '../../types';
import {
    Wallet,
    ArrowRight,
    Banknote,
    CreditCard,
    CheckCircle2,
    Sparkles
} from 'lucide-react';

type OnboardingStep = 'welcome' | 'wallets' | 'balance' | 'complete';

export const Onboarding = () => {
    const navigate = useNavigate();
    const { user, setOnboardingCompleted } = useAuthStore();
    const { addWallet } = useWalletStore();
    const { initializeDefaultCategories } = useCategoryStore();
    const { addTransaction } = useTransactionStore();

    const [step, setStep] = useState<OnboardingStep>('welcome');
    const [bankBalance, setBankBalance] = useState('');
    const [cashBalance, setCashBalance] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleNext = () => {
        if (step === 'welcome') {
            setStep('wallets');
        } else if (step === 'wallets') {
            setStep('balance');
        } else if (step === 'balance') {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        if (!user) return;

        setIsLoading(true);
        setError('');

        try {
            // Initialize default categories
            await initializeDefaultCategories(user.uid);

            // Create default wallets
            const bankWalletId = await addWallet(user.uid, {
                name: 'My Bank/UPI',
                type: WalletType.PERSONAL,
                icon: 'credit-card',
                isDefault: true,
                createdAt: Date.now()
            });

            const cashWalletId = await addWallet(user.uid, {
                name: 'My Cash',
                type: WalletType.PERSONAL,
                icon: 'banknote',
                isDefault: true,
                createdAt: Date.now()
            });

            // Add opening balances if provided
            const bankAmount = parseFloat(bankBalance) || 0;
            const cashAmount = parseFloat(cashBalance) || 0;

            if (bankAmount > 0) {
                await addTransaction(user.uid, {
                    amount: bankAmount,
                    type: TransactionType.OPENING_BALANCE,
                    walletId: bankWalletId,
                    note: 'Opening Balance',
                    date: Date.now(),
                    createdAt: Date.now()
                });
            }

            if (cashAmount > 0) {
                await addTransaction(user.uid, {
                    amount: cashAmount,
                    type: TransactionType.OPENING_BALANCE,
                    walletId: cashWalletId,
                    note: 'Opening Balance',
                    date: Date.now(),
                    createdAt: Date.now()
                });
            }

            // Mark onboarding as complete
            await setOnboardingCompleted(true);

            setStep('complete');
        } catch (err: any) {
            setError(err.message || 'Setup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderWelcome = () => (
        <div className="text-center">
            <div
                className="w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center"
                style={{
                    background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%)',
                    boxShadow: 'var(--shadow-glow)'
                }}
            >
                <Wallet size={48} color="white" />
            </div>

            <h1 className="text-3xl font-bold mb-4">Welcome to FinanceFlow</h1>
            <p className="text-secondary text-lg mb-8">
                Take control of your finances with smart tracking, beautiful analytics, and effortless budgeting.
            </p>

            <div className="flex flex-col gap-4 mt-8">
                <div className="flex items-center gap-4 p-4 glass-card text-left">
                    <Sparkles size={24} className="text-accent" />
                    <div>
                        <p className="font-medium">Track Expenses</p>
                        <p className="text-sm text-secondary">Monitor where your money goes</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 glass-card text-left">
                    <Sparkles size={24} className="text-accent" />
                    <div>
                        <p className="font-medium">Smart Analytics</p>
                        <p className="text-sm text-secondary">Insights to make better decisions</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 glass-card text-left">
                    <Sparkles size={24} className="text-accent" />
                    <div>
                        <p className="font-medium">Cloud Sync</p>
                        <p className="text-sm text-secondary">Access from any device</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderWallets = () => (
        <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Setup Your Wallets</h1>
            <p className="text-secondary mb-8">
                We'll create two default wallets for you to start tracking
            </p>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 p-5 glass-card text-left">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--color-accent-light)' }}
                    >
                        <CreditCard size={24} className="text-accent" />
                    </div>
                    <div>
                        <p className="font-semibold">My Bank/UPI</p>
                        <p className="text-sm text-secondary">For digital payments</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-5 glass-card text-left">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--color-success-bg)' }}
                    >
                        <Banknote size={24} className="text-success" />
                    </div>
                    <div>
                        <p className="font-semibold">My Cash</p>
                        <p className="text-sm text-secondary">For cash transactions</p>
                    </div>
                </div>
            </div>

            <p className="text-sm text-tertiary mt-6">
                You can add more wallets anytime from the settings
            </p>
        </div>
    );

    const renderBalance = () => (
        <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Set Opening Balances</h1>
            <p className="text-secondary mb-8">
                Enter your current balances (optional)
            </p>

            <div className="flex flex-col gap-6">
                <div className="input-group text-left">
                    <label className="input-label flex items-center gap-2">
                        <CreditCard size={16} />
                        Bank/UPI Balance
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-secondary">₹</span>
                        <input
                            type="number"
                            className="input"
                            style={{ paddingLeft: '36px', fontSize: '18px' }}
                            placeholder="0"
                            value={bankBalance}
                            onChange={(e) => setBankBalance(e.target.value)}
                        />
                    </div>
                </div>

                <div className="input-group text-left">
                    <label className="input-label flex items-center gap-2">
                        <Banknote size={16} />
                        Cash Balance
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-secondary">₹</span>
                        <input
                            type="number"
                            className="input"
                            style={{ paddingLeft: '36px', fontSize: '18px' }}
                            placeholder="0"
                            value={cashBalance}
                            onChange={(e) => setCashBalance(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg mt-4" style={{ background: 'var(--color-error-bg)' }}>
                    <p className="text-sm text-error">{error}</p>
                </div>
            )}
        </div>
    );

    const renderComplete = () => (
        <div className="text-center">
            <div
                className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-success-bg)' }}
            >
                <CheckCircle2 size={48} className="text-success" />
            </div>

            <h1 className="text-2xl font-bold mb-4">You're All Set!</h1>
            <p className="text-secondary text-lg mb-8">
                Start tracking your expenses and take control of your finances
            </p>

            <button
                className="btn btn-primary btn-full"
                onClick={() => navigate('/')}
            >
                Go to Dashboard
                <ArrowRight size={20} />
            </button>
        </div>
    );

    return (
        <div className="page flex flex-col justify-center p-6" style={{ minHeight: '100vh' }}>
            <div className="w-full max-w-md mx-auto">
                {/* Progress Indicator */}
                {step !== 'complete' && (
                    <div className="flex gap-2 mb-8 justify-center">
                        {['welcome', 'wallets', 'balance'].map((s, i) => (
                            <div
                                key={s}
                                className="h-1.5 rounded-full transition-all"
                                style={{
                                    width: step === s ? '32px' : '8px',
                                    background: ['welcome', 'wallets', 'balance'].indexOf(step) >= i
                                        ? 'var(--color-accent)'
                                        : 'var(--color-border)'
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="min-h-[400px] flex flex-col justify-center">
                    {step === 'welcome' && renderWelcome()}
                    {step === 'wallets' && renderWallets()}
                    {step === 'balance' && renderBalance()}
                    {step === 'complete' && renderComplete()}
                </div>

                {/* Navigation */}
                {step !== 'complete' && (
                    <button
                        className="btn btn-primary btn-full mt-8"
                        onClick={handleNext}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="spinner" style={{ width: '20px', height: '20px' }} />
                        ) : (
                            <>
                                {step === 'balance' ? 'Complete Setup' : 'Continue'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
