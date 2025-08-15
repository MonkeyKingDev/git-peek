import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall, setAuthErrorHandler } from '../utils/api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFromUrl = urlParams.get('session');
    
    
    if (sessionFromUrl) {
      setSessionId(sessionFromUrl);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      checkSession(sessionFromUrl);
    } else {
      const savedSession = localStorage.getItem('github_session');
      if (savedSession) {
        setSessionId(savedSession);
        checkSession(savedSession);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const checkSession = async (session) => {
    try {
      const userData = await apiCall(`/auth/user?session_id=${session}`);
      setUser(userData);
      localStorage.setItem('github_session', session);
      setLoading(false);
    } catch (error) {
      // Check if it's a 401/auth error
      if (error.message.includes('Session expired') || error.message.includes('401')) {
        localStorage.removeItem('github_session');
        setSessionId(null);
        setUser(null);
      }
      
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      const response = await apiCall('/auth/login');
      window.location.href = response.auth_url;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (sessionId) {
        await apiCall('/auth/logout', 'POST', { session_id: sessionId });
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('github_session');
      setSessionId(null);
      setUser(null);
    }
  };

  const handleAuthError = () => {
    localStorage.removeItem('github_session');
    setSessionId(null);
    setUser(null);
    setLoading(false);
    // Redirect to login page
    window.location.href = '/';
  };

  // Set up the auth error handler when the context is created
  useEffect(() => {
    setAuthErrorHandler(handleAuthError);
  }, []);

  const value = {
    user,
    sessionId,
    login,
    logout,
    loading,
    isAuthenticated: !!user && !!sessionId
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}