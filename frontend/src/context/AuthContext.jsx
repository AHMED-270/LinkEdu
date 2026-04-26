import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'linkedu_user';
const PROFILE_CACHE_KEY = 'linkedu_profile_cache';
const AUTH_TOKEN_KEY = 'linkedu_token';

const resolveApiOrigin = () => {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:8000';
  }

  const envBaseUrl = String(import.meta.env.VITE_API_URL || '').trim();
  if (envBaseUrl) {
    try {
      return new URL(envBaseUrl, window.location.origin).origin;
    } catch {
      // Fall through to hostname-based default.
    }
  }

  // Detect environment and protocol
  const isProduction = window.location.protocol === 'https:';
  if (isProduction) {
    // Production: use Laravel Cloud backend
    return 'https://backendlinkededu-main-oied8k.free.laravel.cloud';
  }

  // Development: use localhost
  return `${window.location.protocol}//${window.location.hostname}:8000`;
};

const normalizeProfilePhotoUrl = (rawValue) => {
  const value = String(rawValue || '').trim();
  if (!value) {
    return null;
  }

  if (/^data:image\//i.test(value) || /^blob:/i.test(value) || /^https?:\/\//i.test(value)) {
    return value;
  }

  if (typeof window === 'undefined') {
    return value;
  }

  if (value.startsWith('//')) {
    return `${window.location.protocol}${value}`;
  }

  const apiOrigin = resolveApiOrigin();
  if (value.startsWith('/')) {
    return `${apiOrigin}${value}`;
  }

  return `${apiOrigin}/${value.replace(/^\.?\//, '')}`;
};

const resolveProfilePhotoCandidate = (userData) => {
  if (!userData || typeof userData !== 'object') {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(userData, 'profilePhoto')) {
    return userData.profilePhoto;
  }

  if (Object.prototype.hasOwnProperty.call(userData, 'profile_photo_url')) {
    return userData.profile_photo_url;
  }

  if (Object.prototype.hasOwnProperty.call(userData, 'profile_photo_path')) {
    return userData.profile_photo_path;
  }

  return userData.profilePhoto ?? userData.profile_photo_url ?? userData.profile_photo_path ?? null;
};

const normalizeUserProfilePhoto = (userData) => {
  if (!userData || typeof userData !== 'object') {
    return userData;
  }

  const nextUser = { ...userData };
  const normalizedPhoto = normalizeProfilePhotoUrl(resolveProfilePhotoCandidate(nextUser));

  nextUser.profilePhoto = normalizedPhoto;
  nextUser.profile_photo_url = normalizedPhoto;

  return nextUser;
};

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
  const [postLoginTransition, setPostLoginTransition] = useState({
    active: false,
    targetRoute: null,
    startedAt: 0,
  });

  const startPostLoginTransition = useCallback((targetRoute = null) => {
    setPostLoginTransition({
      active: true,
      targetRoute,
      startedAt: Date.now(),
    });
  }, []);

  const completePostLoginTransition = useCallback(() => {
    setPostLoginTransition((previous) => {
      if (!previous.active) {
        return previous;
      }

      return {
        active: false,
        targetRoute: null,
        startedAt: 0,
      };
    });
  }, []);

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
    const normalizedUser = normalizeUserProfilePhoto(mergedUser);
    setUser(normalizedUser);
    safeStorage.set(JSON.stringify(normalizedUser));
    document.body.className = `theme-${normalizedUser.role}`;
  };

  const updateAuthenticatedUser = (patch) => {
    setUser((prevUser) => {
      if (!prevUser) {
        return prevUser;
      }

      const nextUser = normalizeUserProfilePhoto({ ...prevUser, ...patch });
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
    completePostLoginTransition();
  };

  return (
    <AuthContext.Provider value={{
      user,
      setAuthenticatedUser,
      updateAuthenticatedUser,
      logout,
      loading,
      postLoginTransition,
      startPostLoginTransition,
      completePostLoginTransition,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
