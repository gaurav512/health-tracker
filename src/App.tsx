import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation(); // Get the current location object

  if (authLoading || profileLoading) {
    return <div className="full-page-loader"><div></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user && !userProfile?.calorieTarget) {
    // Use location.pathname for comparison with HashRouter routes
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" />;
    } else {
      // This else block was part of the original code, I'm restoring it.
    }
  } else if (user && userProfile?.calorieTarget && location.pathname === '/onboarding') { // Use location.pathname
    return <Navigate to="/dashboard" />;
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