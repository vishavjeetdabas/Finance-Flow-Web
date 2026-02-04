import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Wallet, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

export const Login = () => {
    const navigate = useNavigate();
    const { signIn, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await signIn(email, password);
            navigate('/');
        } catch (err) {
            // Error is handled in the store
        }
    };

    return (
        <div className="page flex flex-col items-center justify-center p-6" style={{ minHeight: '100vh' }}>
            <div className="w-full max-w-sm">
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <div
                        className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%)',
                            boxShadow: 'var(--shadow-glow)'
                        }}
                    >
                        <Wallet size={40} color="white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
                    <p className="text-secondary">Sign in to continue to FinanceFlow</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Email */}
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <div className="relative">
                            <Mail
                                size={20}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary"
                            />
                            <input
                                type="email"
                                className="input"
                                style={{ paddingLeft: '48px' }}
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div className="relative">
                            <Lock
                                size={20}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary"
                            />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                style={{ paddingLeft: '48px', paddingRight: '48px' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-tertiary"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg" style={{ background: 'var(--color-error-bg)' }}>
                            <p className="text-sm text-error">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary btn-full mt-4"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="spinner" style={{ width: '20px', height: '20px' }} />
                        ) : (
                            <>
                                Sign In
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                {/* Sign Up Link */}
                <p className="text-center mt-6 text-secondary">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-accent font-medium">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};
