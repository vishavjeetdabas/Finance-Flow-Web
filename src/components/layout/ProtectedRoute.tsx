import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
    children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, isLoading, isInitialized } = useAuthStore();

    // Show loading while checking auth state
    if (!isInitialized || isLoading) {
        return (
            <div className="page flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export const PublicRoute = ({ children }: ProtectedRouteProps) => {
    const { user, isLoading, isInitialized, preferences } = useAuthStore();

    // Show loading while checking auth state
    if (!isInitialized || isLoading) {
        return (
            <div className="page flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    // Redirect to home if already authenticated
    if (user) {
        // Check if onboarding is completed
        if (preferences?.onboardingCompleted) {
            return <Navigate to="/" replace />;
        } else {
            return <Navigate to="/onboarding" replace />;
        }
    }

    return <>{children}</>;
};
