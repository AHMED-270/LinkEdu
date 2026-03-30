<<<<<<< HEAD
import { useState } from 'react'
import './App.css'
import AuthHero from './components/AuthHero'
import LoginCard from './components/LoginCard'
import DirecteurDashboard from './components/DirecteurDashboard'

function App() {
  const [user, setUser] = useState(null)

  if (user) {
    return <DirecteurDashboard user={user} onLogout={() => setUser(null)} />
=======
﻿import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

// Layout & Admin
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';

// Pages
import Dashboard from './pages/Dashboard';
import Devoirs from './pages/Devoirs';
import Ressources from './pages/Ressources';
import EmploiDuTemps from './pages/EmploiDuTemps';
import Annonces from './pages/Annonces';
import Eleves from './pages/Eleves';
import Appel from './pages/Appel';
import Notes from './pages/Notes';
import Avancement from './pages/Avancement';
import Reclamation from './pages/Reclamation';
import Parametres from './pages/Parametres';
import Login from './pages/Login';
import StudentPortal from './pages/StudentPortal';
import ParentPortal from './pages/ParentPortal';

import './App.css';

const getHomeRouteByRole = (role) => {
  if (role === 'admin' || role === 'directeur') return '/admin';
  if (role === 'professeur') return '/dashboard';
  if (role === 'etudiant') return '/etudiant';
  if (role === 'parent') return '/parent';
  return '/login';
};

// Global Loading Component
const FullScreenLoader = () => (
  <div className="loading-screen">
    <div className="loader-core"></div>
    <p>Chargement de LinkedU...</p>
  </div>
);

// Root Route - Redirects based on auth status
const RootRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <FullScreenLoader />;
  return user ? <Navigate to={getHomeRouteByRole(user?.role)} replace /> : <Navigate to="/login" replace />;
};

// Protected Layout Wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRouteByRole(user.role)} replace />;
>>>>>>> 4389ff52fc7c5d9e3c2a0d8cf7f3e2af58278124
  }
  
  return children;
};

// Animated Route Wrapper
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, ease: "easeInOut" }}
    className="page-transition-wrapper"
  >
    {children}
  </motion.div>
);

// Animated Routes Component
const AppRoutes = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  return (
<<<<<<< HEAD
    <main className="auth-page">
      <AuthHero />
      <LoginCard onLoginSuccess={setUser} />
    </main>
=======
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><RootRoute /></PageTransition>} />
        
        {/* Authentication */}
        <Route 
          path="/login" 
          element={user ? <Navigate to={getHomeRouteByRole(user?.role)} replace /> : <PageTransition><Login /></PageTransition>} 
        />
        
        {/* Administrator Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin', 'directeur']}>
              <PageTransition>
                <AdminDashboard onLogout={logout} userRole={user?.role || 'admin'} user={user} />
              </PageTransition>
            </ProtectedRoute>
          }
        />

        {/* Student and Parent Routes */}
        <Route path="/etudiant/*" element={<ProtectedRoute allowedRoles={['etudiant']}><PageTransition><StudentPortal /></PageTransition></ProtectedRoute>} />
        <Route path="/parent/*" element={<ProtectedRoute allowedRoles={['parent']}><PageTransition><ParentPortal /></PageTransition></ProtectedRoute>} />
        
        {/* Professeur Routes */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['professeur']}><PageTransition><Layout title="Tableau de Bord"><Dashboard /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/devoirs" element={<ProtectedRoute allowedRoles={['professeur']}><PageTransition><Layout title="Devoirs & Ressources"><Devoirs /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/ressources" element={<ProtectedRoute allowedRoles={['professeur']}><PageTransition><Layout title="Publier une Ressource"><Ressources /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/emploi-du-temps" element={<ProtectedRoute allowedRoles={['professeur']}><PageTransition><Layout title="Emploi du Temps"><EmploiDuTemps /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/annonces" element={<ProtectedRoute allowedRoles={['professeur']}><PageTransition><Layout title="Annonces"><Annonces /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/mes-classes" element={<ProtectedRoute allowedRoles={['professeur']}><PageTransition><Layout title="Mes Classes"><Eleves /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/appel" element={<ProtectedRoute allowedRoles={['professeur']}><PageTransition><Layout title="Feuille d'Appel"><Appel /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/notes-absences" element={<ProtectedRoute allowedRoles={['professeur']}><PageTransition><Layout title="Notes & Absences"><Notes /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/avancement" element={<ProtectedRoute allowedRoles={['professeur']}><PageTransition><Layout title="Avancement"><Avancement /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/reclamation" element={<ProtectedRoute allowedRoles={['professeur']}><PageTransition><Layout title="RÃ©clamation"><Reclamation /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/profil" element={<ProtectedRoute allowedRoles={['professeur']}><PageTransition><Layout title="Profil"><Parametres /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/parametres" element={<ProtectedRoute allowedRoles={['professeur']}><PageTransition><Layout title="ParamÃ¨tres"><Parametres /></Layout></PageTransition></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? getHomeRouteByRole(user?.role) : '/login'} replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
>>>>>>> 4389ff52fc7c5d9e3c2a0d8cf7f3e2af58278124
  );
}

export default App;
