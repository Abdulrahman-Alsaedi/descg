import React from 'react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { SignUpForm } from './components/SignUpForm';
import { Dashboard } from './components/Dashboard';


const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [showSignUp, setShowSignUp] = React.useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (user) return <Dashboard />;
  if (showSignUp) return <SignUpForm onSignUpSuccess={() => setShowSignUp(false)} />;
  return <LoginForm onShowSignUp={() => setShowSignUp(true)} />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;