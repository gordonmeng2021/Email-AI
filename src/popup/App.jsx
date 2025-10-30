import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import EmailList from './components/EmailList';
import Settings from './components/Settings';
import CustomLabels from './components/CustomLabels';
import { isAuthenticated, signIn, signOut } from '../utils/auth';
import { getStorage } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const isAuth = await isAuthenticated();
      setAuthenticated(isAuth);

      if (isAuth) {
        const result = await getStorage(STORAGE_KEYS.USER_EMAIL);
        setUserEmail(result[STORAGE_KEYS.USER_EMAIL] || '');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    try {
      setLoading(true);
      const { email } = await signIn();
      console.log('Successfully signed in');
      setAuthenticated(true);
      setUserEmail(email);
    } catch (error) {
      console.error('Sign in failed:', error);
      // Display detailed error message to user
      const errorMessage = error.message || 'Sign in failed. Please try again.';
      alert(`Sign in failed: ${errorMessage}\n\nPlease make sure:\n- The extension is properly configured\n- You have internet connection\n- Pop-ups are not blocked`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setAuthenticated(false);
      setUserEmail('');
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-8">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Email AI</h1>
            <p className="text-gray-600">Smart email organization powered by AI</p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-4xl">📧</span>
              <span className="text-4xl">🤖</span>
            </div>
            <ul className="text-left text-sm text-gray-700 space-y-2">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Auto-classify emails
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Generate AI-powered replies
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Multi-language support
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Save hours every week
              </li>
            </ul>
          </div>

          <button
            onClick={handleSignIn}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            Sign in with Google
          </button>

          <p className="mt-4 text-xs text-gray-500">
            We'll access your Gmail to help manage emails
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Email AI</h1>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-600 truncate max-w-[120px]">{userEmail}</span>
              <button
                onClick={() => setCurrentView('settings')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  currentView === 'settings'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={handleSignOut}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="flex space-x-1 px-4 overflow-x-auto">
          <NavTab
            active={currentView === 'dashboard'}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </NavTab>
          <NavTab
            active={currentView === 'emails'}
            onClick={() => setCurrentView('emails')}
          >
            Emails
          </NavTab>
          <NavTab
            active={currentView === 'customLabels'}
            onClick={() => setCurrentView('customLabels')}
          >
            Custom Labels
          </NavTab>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'emails' && <EmailList />}
        {currentView === 'customLabels' && <CustomLabels />}
        {currentView === 'settings' && <Settings />}
      </main>
    </div>
  );
}

function NavTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
        active
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

export default App;
