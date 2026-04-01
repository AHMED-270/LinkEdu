import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

// Layout & Admin
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import DirecteurDashboard from './components/DirecteurDashboard';
import AuthHero from './components/AuthHero';
import LoginCard from './components/LoginCard';

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
// import Login from './pages/Login';
import StudentPortal from './pages/StudentPortal';
import ParentPortal from './pages/ParentPortal';
import { ROLE, getHomeRouteByRole } from './constants/roles';

import './App.css';

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
  if (user) {
    return <Navigate to={getHomeRouteByRole(user?.role)} replace />;
  }
  return <Navigate to="/login" replace />;
};

// Protected Layout Wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRouteByRole(user.role)} replace />;
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
  const { user, loading, logout, login } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><RootRoute /></PageTransition>} />
        
        {/* Authentication */}
        <Route 
          path="/login" 
          element={user ? <Navigate to={getHomeRouteByRole(user?.role)} replace /> : (
            <PageTransition>
              <main className="auth-page">
                <AuthHero />
                <LoginCard onLoginSuccess={login} />
              </main>
            </PageTransition>
          )} 
        />
        
        {/* Administrator Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={[ROLE.ADMIN]}>
              <PageTransition>
                <AdminDashboard onLogout={logout} userRole={user?.role || ROLE.ADMIN} user={user} />
              </PageTransition>
            </ProtectedRoute>
          }
        />

        <Route
          path="/directeur/*"
          element={
            <ProtectedRoute allowedRoles={[ROLE.DIRECTEUR]}>
              <PageTransition>
                <DirecteurDashboard onLogout={logout} user={user} />
              </PageTransition>
            </ProtectedRoute>
          }
        />

        {/* Student and Parent Routes */}
        <Route path="/etudiant/*" element={<ProtectedRoute allowedRoles={[ROLE.ETUDIANT]}><PageTransition><StudentPortal /></PageTransition></ProtectedRoute>} />
        <Route path="/parent/*" element={<ProtectedRoute allowedRoles={[ROLE.PARENT]}><PageTransition><ParentPortal /></PageTransition></ProtectedRoute>} />
        
        {/* Professeur Routes */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}><PageTransition><Layout title="Tableau de Bord"><Dashboard /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/devoirs" element={<ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}><PageTransition><Layout title="Devoirs & Ressources"><Devoirs /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/ressources" element={<ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}><PageTransition><Layout title="Publier une Ressource"><Ressources /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/emploi-du-temps" element={<ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}><PageTransition><Layout title="Emploi du Temps"><EmploiDuTemps /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/annonces" element={<ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}><PageTransition><Layout title="Annonces"><Annonces /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/mes-classes" element={<ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}><PageTransition><Layout title="Mes Classes"><Eleves /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/appel" element={<ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}><PageTransition><Layout title="Feuille d'Appel"><Appel /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/notes-absences" element={<ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}><PageTransition><Layout title="Notes & Absences"><Notes /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/avancement" element={<ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}><PageTransition><Layout title="Avancement"><Avancement /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/reclamation" element={<ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}><PageTransition><Layout title="Réclamation"><Reclamation /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/profil" element={<ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}><PageTransition><Layout title="Profil"><Parametres /></Layout></PageTransition></ProtectedRoute>} />
        <Route path="/parametres" element={<ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}><PageTransition><Layout title="Paramètres"><Parametres /></Layout></PageTransition></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? getHomeRouteByRole(user?.role) : '/login'} replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
