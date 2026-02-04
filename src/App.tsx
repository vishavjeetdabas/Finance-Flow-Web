import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute, PublicRoute } from './components/layout/ProtectedRoute';
import { SplashScreen } from './components/SplashScreen';

// Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/onboarding/Onboarding';
import { Home } from './pages/Home';
import { Transactions } from './pages/Transactions';
import { AddEditTransaction } from './pages/AddEditTransaction';
import { Analytics } from './pages/Analytics';
import { Categories } from './pages/Categories';
import { AddEditCategory } from './pages/AddEditCategory';
import { Wallets } from './pages/Wallets';
import { AddEditWallet } from './pages/AddEditWallet';
import { Settings } from './pages/Settings';

function App() {
  const { initialize, preferences, isInitialized } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, []);

  // Apply theme mode (dark/light/system)
  useEffect(() => {
    if (isInitialized) {
      const themeMode = preferences?.themeMode ?? (preferences?.darkMode ? 'dark' : 'light');

      let isDark: boolean;
      if (themeMode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = themeMode === 'dark';
      }

      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  }, [preferences?.darkMode, preferences?.themeMode, isInitialized]);

  return (
    <>
      {/* Splash Screen - auto fades out via CSS */}
      {!isInitialized && <SplashScreen />}

      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute><Signup /></PublicRoute>
          } />

          {/* Onboarding */}
          <Route path="/onboarding" element={
            <ProtectedRoute><Onboarding /></ProtectedRoute>
          } />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute><Home /></ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute><Transactions /></ProtectedRoute>
          } />
          <Route path="/add-transaction" element={
            <ProtectedRoute><AddEditTransaction /></ProtectedRoute>
          } />
          <Route path="/edit-transaction/:id" element={
            <ProtectedRoute><AddEditTransaction /></ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute><Analytics /></ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute><Categories /></ProtectedRoute>
          } />
          <Route path="/add-category" element={
            <ProtectedRoute><AddEditCategory /></ProtectedRoute>
          } />
          <Route path="/edit-category/:id" element={
            <ProtectedRoute><AddEditCategory /></ProtectedRoute>
          } />
          <Route path="/wallets" element={
            <ProtectedRoute><Wallets /></ProtectedRoute>
          } />
          <Route path="/add-wallet" element={
            <ProtectedRoute><AddEditWallet /></ProtectedRoute>
          } />
          <Route path="/edit-wallet/:id" element={
            <ProtectedRoute><AddEditWallet /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute><Settings /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
