import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './firebase/auth';
import { useUserProfile } from './context/UserProvider';
import LoginPage from './pages/LoginPage/LoginPage';
import SignUpPage from './pages/SignUpPage/SignUpPage';
import OnboardingFlow from './components/OnboardingFlow/OnboardingFlow';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: profileLoading } = useUserProfile();

  if (authLoading || profileLoading) {
    return <div className="full-page-loader"><div></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user && !userProfile?.calorieTarget) {
    if (window.location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" />;
    }
  }
  
  return children;
};

function App() {
  const { user, loading: authLoading } = useAuth();
  const { loading: profileLoading } = useUserProfile();

  if (authLoading || profileLoading) {
    return <div className="full-page-loader"><div></div></div>;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
      />
      <Route 
        path="/signup" 
        element={user ? <Navigate to="/dashboard" /> : <SignUpPage />}
      />
      <Route 
        path="/onboarding" 
        element={<ProtectedRoute><OnboardingFlow /></ProtectedRoute>}
      />
      <Route 
        path="/dashboard" 
        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
      />
      <Route 
        path="/profile" 
        element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
      />
    </Routes>
  );
}

export default App;
