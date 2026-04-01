 import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'linkedu_user';
const PROFILE_CACHE_KEY = 'linkedu_profile_cache';

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

const safeProfileCache = {
  getMap() {
    try {
      const raw = localStorage.getItem(PROFILE_CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  },
  setMap(mapValue) {
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(mapValue));
    } catch {
      // Ignore storage failures in restricted browser modes.
    }
  },
  getByEmail(email) {
    if (!email) return null;
    const mapValue = this.getMap();
    return mapValue[email] ?? null;
  },
  setByEmail(email, profilePatch) {
    if (!email || !profilePatch || typeof profilePatch !== 'object') return;
    const mapValue = this.getMap();
    mapValue[email] = { ...(mapValue[email] || {}), ...profilePatch };
    this.setMap(mapValue);
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = safeStorage.get();

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Validate session by checking if user still exists on backend
          try {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const validateResponse = await fetch(apiBaseUrl + '/api/user', {
              method: 'GET',
              credentials: 'include',
              headers: { 'Accept': 'application/json' }
            });
            
            if (validateResponse.ok) {
              setUser(parsedUser);
            } else {
              // Session invalid, clear stale auth
              safeStorage.remove();
              setUser(null);
            }
          } catch (validationError) {
            // If validation request fails, most likely DB was reset
            // Clear stale auth tokens and require re-login
            safeStorage.remove();
            setUser(null);
          }
        } catch {
          safeStorage.remove();
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const setAuthenticatedUser = (userData) => {
    const cachedProfile = safeProfileCache.getByEmail(userData?.email);
    const mergedUser = cachedProfile ? { ...userData, ...cachedProfile } : userData;
    setUser(mergedUser);
    safeStorage.set(JSON.stringify(mergedUser));
  };

  const updateAuthenticatedUser = (patch) => {
    setUser((prevUser) => {
      if (!prevUser) {
        return prevUser;
      }

      const nextUser = { ...prevUser, ...patch };
      safeProfileCache.setByEmail(nextUser.email, {
        profilePhoto: nextUser.profilePhoto ?? null,
      });
      safeStorage.set(JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const logout = () => {
    setUser(null);
    safeStorage.remove();
  };

  return (
    <AuthContext.Provider value={{ user, setAuthenticatedUser, updateAuthenticatedUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
