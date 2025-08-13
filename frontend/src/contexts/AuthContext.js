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
    console.log('AuthContext useEffect triggered');
    console.log('Full URL:', window.location.href);
    console.log('Search params:', window.location.search);
    console.log('Pathname:', window.location.pathname);
    
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFromUrl = urlParams.get('session');
    
    console.log('AuthContext useEffect - sessionFromUrl:', sessionFromUrl);
    console.log('AuthContext useEffect - current URL:', window.location.href);
    console.log('All URL params:', Object.fromEntries(urlParams.entries()));
    
    if (sessionFromUrl) {
      console.log('Setting session from URL:', sessionFromUrl);
      setSessionId(sessionFromUrl);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      checkSession(sessionFromUrl);
    } else {
      const savedSession = localStorage.getItem('github_session');
      console.log('No session in URL, checking localStorage:', savedSession);
      if (savedSession) {
        setSessionId(savedSession);
        checkSession(savedSession);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const checkSession = async (session) => {
    console.log('checkSession called with:', session);
    try {
      console.log('Making API call to validate session...');
      const userData = await apiCall(`/auth/user?session_id=${session}`);
      console.log('Session validation successful, user data:', userData);
      console.log('User name:', userData?.name);
      console.log('User login:', userData?.login);
      setUser(userData);
      localStorage.setItem('github_session', session);
      setLoading(false);
    } catch (error) {
      console.error('Session validation failed:', error);
      
      // Check if it's a 401/auth error
      if (error.message.includes('Session expired') || error.message.includes('401')) {
        console.log('Auth error detected in checkSession - clearing session');
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
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (sessionId) {
        await apiCall('/auth/logout', 'POST', { session_id: sessionId });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('github_session');
      setSessionId(null);
      setUser(null);
    }
  };

  const handleAuthError = () => {
    console.log('Handling auth error - clearing session and redirecting to login');
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