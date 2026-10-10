import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

/**
 * Provides authentication state and actions to the component tree.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if a valid session cookie already exists
  useEffect(() => {
    authService.getMe()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await authService.login({ email, password });
    const me = await authService.getMe();
    setUser(me.user);
    return data;
  }

  async function register(name, email, password) {
    const data = await authService.register({ name, email, password });
    const me = await authService.getMe();
    setUser(me.user);
    return data;
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  async function updateProfile(payload) {
    const data = await authService.updateMe(payload);
    setUser(data.user);
    return data;
  }

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state and actions.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
