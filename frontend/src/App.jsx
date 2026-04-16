import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import DirecteurDashboard from './components/DirecteurDashboard';
import SecretaireLayout from './components/SecretaireLayout';
import PostLoginLoader from './components/PostLoginLoader';
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
import SecretaireDashboard from './pages/SecretaireDashboard';
import SecretaireEtudiants from './pages/SecretaireEtudiants';
import SecretaireClasses from './pages/SecretaireClasses';
import SecretaireAbsences from './pages/SecretaireAbsences';
import SecretaireAnnonces from './pages/SecretaireAnnonces';
import SecretaireReclamations from './pages/SecretaireReclamations';
import SecretaireDemandes from './pages/SecretaireDemandes';
import Paiements from './pages/Paiements';
import StudentPortal from './pages/StudentPortal';
import ParentPortal from './pages/ParentPortal';
import PasswordReset from './pages/PasswordReset';
import './App.css';

const SECRETARIAT_STAFF_ROLES = ['secretaire'];
const FINANCE_PORTAL_ROLES = ['secretaire', 'comptable'];
const COMPTABLE_ONLY_ROLES = ['comptable'];

const FullScreenLoader = () => <div className="loading-screen">Chargement...</div>;

const getHomeRouteByRole = (role) => {
  const normalizedRole = String(role || '').toLowerCase();
  if (normalizedRole === 'admin') return '/admin';
  if (normalizedRole === 'directeur') return '/directeur';
  if (normalizedRole === 'professeur') return '/dashboard';
  if (normalizedRole === 'secretaire') return '/secretaire/dashboard';
  if (normalizedRole === 'comptable') return '/comptable/dashboard';
  if (normalizedRole === 'etudiant') return '/student';
  if (normalizedRole === 'parent_eleve' || normalizedRole === 'parent') return '/parent';
  return '/login';
};

const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  return user ? <Navigate to={getHomeRouteByRole(user?.role)} replace /> : <Navigate to="/login" replace />;
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRouteByRole(user.role)} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading, logout, postLoginTransition, completePostLoginTransition } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!postLoginTransition?.active) {
      return undefined;
    }

    // Safety timeout avoids a stuck overlay if a page fails to report readiness.
    const timeoutId = window.setTimeout(() => {
      completePostLoginTransition();
    }, 18000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [postLoginTransition?.active, completePostLoginTransition, location.pathname]);

  if (loading) return <FullScreenLoader />;

  return (
    <>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={user ? <Navigate to={getHomeRouteByRole(user?.role)} replace /> : <Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
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

        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Tableau de Bord"><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/devoirs" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Devoirs & Ressources"><Devoirs /></Layout></ProtectedRoute>} />
        <Route path="/ressources" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Publier une Ressource"><Ressources /></Layout></ProtectedRoute>} />
        <Route path="/emploi-du-temps" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Emploi du Temps"><EmploiDuTemps /></Layout></ProtectedRoute>} />
        <Route path="/annonces" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Annonces"><Annonces /></Layout></ProtectedRoute>} />
        <Route path="/mes-classes" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Mes Classes"><Eleves /></Layout></ProtectedRoute>} />
        <Route path="/appel" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Feuille d'Appel"><Appel /></Layout></ProtectedRoute>} />
        <Route path="/notes-absences" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Notes & Absences"><Notes /></Layout></ProtectedRoute>} />
        <Route path="/avancement" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Avancement"><Avancement /></Layout></ProtectedRoute>} />
        <Route path="/reclamation" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Reclamation"><Reclamation /></Layout></ProtectedRoute>} />
        <Route path="/profil" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Profil"><Parametres /></Layout></ProtectedRoute>} />
        <Route path="/parametres" element={<ProtectedRoute allowedRoles={['professeur']}><Layout title="Parametres"><Parametres /></Layout></ProtectedRoute>} />

        <Route path="/secretaire/dashboard" element={<ProtectedRoute allowedRoles={['secretaire']}><SecretaireLayout><SecretaireDashboard /></SecretaireLayout></ProtectedRoute>} />
        <Route path="/secretaire/etudiants" element={<ProtectedRoute allowedRoles={SECRETARIAT_STAFF_ROLES}><SecretaireLayout><SecretaireEtudiants /></SecretaireLayout></ProtectedRoute>} />
        <Route path="/secretaire/classes" element={<ProtectedRoute allowedRoles={SECRETARIAT_STAFF_ROLES}><SecretaireLayout><SecretaireClasses /></SecretaireLayout></ProtectedRoute>} />
        <Route path="/secretaire/absences" element={<ProtectedRoute allowedRoles={SECRETARIAT_STAFF_ROLES}><SecretaireLayout><SecretaireAbsences /></SecretaireLayout></ProtectedRoute>} />
        <Route path="/secretaire/annonces" element={<ProtectedRoute allowedRoles={SECRETARIAT_STAFF_ROLES}><SecretaireLayout><SecretaireAnnonces /></SecretaireLayout></ProtectedRoute>} />
        <Route path="/secretaire/reclamations" element={<ProtectedRoute allowedRoles={SECRETARIAT_STAFF_ROLES}><SecretaireLayout><SecretaireReclamations /></SecretaireLayout></ProtectedRoute>} />
        <Route path="/secretaire/demandes" element={<ProtectedRoute allowedRoles={SECRETARIAT_STAFF_ROLES}><SecretaireLayout><SecretaireDemandes /></SecretaireLayout></ProtectedRoute>} />
        <Route path="/secretaire/profil" element={<ProtectedRoute allowedRoles={['secretaire']}><SecretaireLayout><Parametres /></SecretaireLayout></ProtectedRoute>} />

        <Route path="/comptable/dashboard" element={<ProtectedRoute allowedRoles={['comptable']}><SecretaireLayout><SecretaireDashboard /></SecretaireLayout></ProtectedRoute>} />
        <Route path="/comptable/paiements" element={<ProtectedRoute allowedRoles={['comptable']}><SecretaireLayout><Paiements /></SecretaireLayout></ProtectedRoute>} />
        <Route path="/comptable/profil" element={<ProtectedRoute allowedRoles={['comptable']}><SecretaireLayout><Parametres /></SecretaireLayout></ProtectedRoute>} />

        <Route path="/student" element={<ProtectedRoute allowedRoles={['etudiant']}><StudentPortal /></ProtectedRoute>} />
        <Route path="/etudiant" element={<ProtectedRoute allowedRoles={['etudiant']}><Navigate to="/student" replace /></ProtectedRoute>} />
        <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent_eleve', 'parent']}><ParentPortal /></ProtectedRoute>} />
        
        <Route path="/password-reset/:token" element={<PasswordReset />} />

        <Route path="*" element={<Navigate to={user ? getHomeRouteByRole(user?.role) : '/login'} replace />} />
      </Routes>

      {postLoginTransition?.active && <PostLoginLoader />}
    </>
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
