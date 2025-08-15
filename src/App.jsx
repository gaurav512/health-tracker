import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './firebase/auth';
import { useUserProfile } from './context/UserProvider';
import LoginPage from './pages/LoginPage/LoginPage';
import SignUpPage from './pages/SignUpPage/SignUpPage';
import OnboardingFlow from './components/OnboardingFlow/OnboardingFlow';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
// import './App.css'; // Removed unused import
import React from 'react'; // Removed useEffect as it's no longer used

// A wrapper for routes that require a logged-in user.
const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: profileLoading } = useUserProfile();

  if (authLoading || profileLoading) {
    return <div className="full-page-loader"><div></div></div>; // Or a spinner component
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // If user is logged in but hasn't completed onboarding, force them to the onboarding page.
  if (user && !userProfile?.calorieTarget) {
    // Allow access only to the onboarding page itself
    if (window.location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" />;
    }
  }
  
  return children;
};

function App() {
  // Removed diagnostic logs

  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: profileLoading } = useUserProfile();

  if (authLoading || profileLoading) {
    return <div className="full-page-loader"><div></div></div>; // Full page loader
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