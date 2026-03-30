import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'linkedu_user';
const PROFILE_CACHE_KEY = 'linkedu_profile_cache';
const AUTH_TOKEN_KEY = 'linkedu_token';

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

const safeTokenStorage = {
  remove() {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
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
    const storedUser = safeStorage.get();

    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        document.body.className = `theme-${u.role}`;
      } catch {
        safeStorage.remove();
        document.body.className = '';
      }
    } else {
      document.body.className = '';
    }

    setLoading(false);
  }, []);

  const setAuthenticatedUser = (userData) => {
    const cachedProfile = safeProfileCache.getByEmail(userData?.email);
    const mergedUser = cachedProfile ? { ...userData, ...cachedProfile } : userData;
    setUser(mergedUser);
    safeStorage.set(JSON.stringify(mergedUser));
    document.body.className = `theme-${mergedUser.role}`;
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
      document.body.className = `theme-${nextUser.role}`;
      return nextUser;
    });
  };

  const logout = () => {
    setUser(null);
    safeStorage.remove();
    safeTokenStorage.remove();
    document.body.className = '';
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
