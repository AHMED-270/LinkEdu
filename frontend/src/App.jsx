import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
<<<<<<<<< Temporary merge branch 1
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
=========
import Login from './pages/Login';
import SecretaireLayout from './components/SecretaireLayout';
import SecretaireDashboard from './pages/SecretaireDashboard';
import SecretaireEtudiants from './pages/SecretaireEtudiants';
import SecretaireClasses from './pages/SecretaireClasses';
import SecretaireAbsences from './pages/SecretaireAbsences';
import SecretaireAnnonces from './pages/SecretaireAnnonces';
import SecretaireReclamations from './pages/SecretaireReclamations';
import Paiements from './pages/Paiements';

const getHomeRouteByRole = (role) => {
  const normalizedRole = String(role || '').toLowerCase();
  if (normalizedRole === 'admin' || normalizedRole === 'directeur') return '/admin';
  if (normalizedRole === 'professeur') return '/dashboard';
  if (normalizedRole === 'secretaire') return '/secretaire/dashboard';
  return '/login';
};
>>>>>>>>> Temporary merge branch 2

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
  
  if (loading) return <div className="loading-screen">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const homeRoute = resolveHomeRoute(user?.role);
    return <Navigate to={homeRoute ?? '/login'} replace />;
  }
  
  return children;
};

// Title updates per route
const AppRoutes = () => {
  const { user, loading, logout, login } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading-screen">Chargement...</div>;

  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'directeur']}>
            <AdminDashboard onLogout={logout} userRole={user?.role || 'admin'} user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/directeur/*"
        element={
          <ProtectedRoute allowedRoles={['directeur']}>
            <DirecteurDashboard onLogout={logout} user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/etudiant"
        element={
          <ProtectedRoute allowedRoles={['etudiant']}>
            <StudentPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentPortal />
          </ProtectedRoute>
        }
      />

      {/* Secretaire routes */}
      <Route path="/secretaire/dashboard" element={<ProtectedRoute allowedRoles={['secretaire']}><SecretaireLayout><SecretaireDashboard /></SecretaireLayout></ProtectedRoute>} />
      <Route path="/secretaire/etudiants" element={<ProtectedRoute allowedRoles={['secretaire']}><SecretaireLayout><SecretaireEtudiants /></SecretaireLayout></ProtectedRoute>} />
      <Route path="/secretaire/classes" element={<ProtectedRoute allowedRoles={['secretaire']}><SecretaireLayout><SecretaireClasses /></SecretaireLayout></ProtectedRoute>} />
      <Route path="/secretaire/paiements" element={<ProtectedRoute allowedRoles={['secretaire']}><SecretaireLayout><Paiements /></SecretaireLayout></ProtectedRoute>} />
      <Route path="/secretaire/absences" element={<ProtectedRoute allowedRoles={['secretaire']}><SecretaireLayout><SecretaireAbsences /></SecretaireLayout></ProtectedRoute>} />
      <Route path="/secretaire/annonces" element={<ProtectedRoute allowedRoles={['secretaire']}><SecretaireLayout><SecretaireAnnonces /></SecretaireLayout></ProtectedRoute>} />
      <Route path="/secretaire/reclamations" element={<ProtectedRoute allowedRoles={['secretaire']}><SecretaireLayout><SecretaireReclamations /></SecretaireLayout></ProtectedRoute>} />
      <Route path="/secretaire/profil" element={<ProtectedRoute allowedRoles={['secretaire']}><SecretaireLayout><Parametres /></SecretaireLayout></ProtectedRoute>} />
      
      {/* Professeur routes */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Tableau de Bord"><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/devoirs" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Devoirs & Ressources"><Devoirs /></Layout></ProtectedRoute>} />
      <Route path="/ressources" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Publier une Ressource"><Ressources /></Layout></ProtectedRoute>} />
      <Route path="/emploi-du-temps" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Emploi du Temps"><EmploiDuTemps /></Layout></ProtectedRoute>} />
      <Route path="/annonces" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Annonces"><Annonces /></Layout></ProtectedRoute>} />
      <Route path="/mes-classes" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Mes Classes"><Eleves /></Layout></ProtectedRoute>} />
      <Route path="/appel" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Feuille d'Appel"><Appel /></Layout></ProtectedRoute>} />
      <Route path="/notes-absences" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Notes & Absences"><Notes /></Layout></ProtectedRoute>} />
      <Route path="/avancement" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Avancement"><Avancement /></Layout></ProtectedRoute>} />
      <Route path="/reclamation" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Réclamation"><Reclamation /></Layout></ProtectedRoute>} />
      <Route path="/profil" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Profil"><Parametres /></Layout></ProtectedRoute>} />
      <Route path="/parametres" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Paramètres"><Parametres /></Layout></ProtectedRoute>} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? (userHome ?? '/login') : '/login'} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
