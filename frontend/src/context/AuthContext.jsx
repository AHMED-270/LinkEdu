import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'linkedu_user';

const safeStorage = {
  get() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore storage failures in restricted browser modes.
    }
  },
  remove() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures in restricted browser modes.
    }
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = safeStorage.get();

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        safeStorage.remove();
      }
    }

    setLoading(false);
  }, []);

  const setAuthenticatedUser = (userData) => {
    setUser(userData);
    safeStorage.set(JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    safeStorage.remove();
  };

  return (
    <AuthContext.Provider value={{ user, setAuthenticatedUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
