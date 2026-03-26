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

const testUsers = {
  professeur: {
    id: 1,
    name: 'Prof. Ahmed Benali',
    email: 'professeur@linkedu.ma',
    role: 'professeur',
    avatar: null,
    initials: 'AB',
    matieres: ['Physique Chimie', 'Mathématiques', 'SVT'],
    etablissement: 'Lycée Al Khawarizmi — Casablanca'
  },
  directeur: {
    id: 2,
    name: 'M. Youssef El Idrissi',
    email: 'directeur@linkedu.ma',
    role: 'directeur',
    avatar: null,
    initials: 'YE',
    matieres: [],
    etablissement: 'Lycée Al Khawarizmi — Casablanca'
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

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          const normalizedEmail = email.trim().toLowerCase();
          const isDirector = normalizedEmail === 'directeur@linkedu.ma';
          const baseUser = isDirector ? testUsers.directeur : testUsers.professeur;
          const userData = {
            ...baseUser,
            email: normalizedEmail
          };

          setUser(userData);
          safeStorage.set(JSON.stringify(userData));
          resolve(userData);
        } else {
          reject(new Error('Email et mot de passe requis'));
        }
      }, 800);
    });
  };

  const logout = () => {
    setUser(null);
    safeStorage.remove();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
