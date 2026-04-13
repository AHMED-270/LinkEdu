import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLE, getHomeRouteByRole } from './constants/roles';

import './App.css';

// Layout & Dashboards
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import DirecteurDashboard from './components/DirecteurDashboard';
import SecretaireLayout from './components/SecretaireLayout';

// Auth
import Login from './pages/Login';

// Professeur pages
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

// Other portals
import StudentPortal from './pages/StudentPortal';
import ParentPortal from './pages/ParentPortal';

// Secretaire pages
import SecretaireDashboard from './pages/SecretaireDashboard';
import SecretaireEtudiants from './pages/SecretaireEtudiants';
import SecretaireClasses from './pages/SecretaireClasses';
import SecretaireAbsences from './pages/SecretaireAbsences';
import SecretaireAnnonces from './pages/SecretaireAnnonces';
import SecretaireReclamations from './pages/SecretaireReclamations';
import Paiements from './pages/Paiements';

const FullScreenLoader = () => (
  <div className="loading-screen">
    <div className="loader-core"></div>
    <p>Chargement de LinkedU...</p>
  </div>
);

const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (user) {
    return <Navigate to={getHomeRouteByRole(user?.role)} replace />;
  }

  return <Navigate to="/login" replace />;
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRouteByRole(user?.role)} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="loading-screen">Chargement...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route
        path="/login"
        element={user ? <Navigate to={getHomeRouteByRole(user?.role)} replace /> : <Login />}
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[ROLE.ADMIN, ROLE.DIRECTEUR]}>
            <AdminDashboard onLogout={logout} userRole={user?.role || ROLE.ADMIN} user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/directeur/*"
        element={
          <ProtectedRoute allowedRoles={[ROLE.DIRECTEUR]}>
            <DirecteurDashboard onLogout={logout} user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/etudiant"
        element={
          <ProtectedRoute allowedRoles={[ROLE.ETUDIANT]}>
            <StudentPortal />
          </ProtectedRoute>
        }
      />

      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={[ROLE.PARENT]}>
            <ParentPortal />
          </ProtectedRoute>
        }
      />

      <Route
        path="/secretaire/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLE.SECRETAIRE]}>
            <SecretaireLayout>
              <SecretaireDashboard />
            </SecretaireLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/secretaire/etudiants"
        element={
          <ProtectedRoute allowedRoles={[ROLE.SECRETAIRE]}>
            <SecretaireLayout>
              <SecretaireEtudiants />
            </SecretaireLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/secretaire/classes"
        element={
          <ProtectedRoute allowedRoles={[ROLE.SECRETAIRE]}>
            <SecretaireLayout>
              <SecretaireClasses />
            </SecretaireLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/secretaire/paiements"
        element={
          <ProtectedRoute allowedRoles={[ROLE.SECRETAIRE]}>
            <SecretaireLayout>
              <Paiements />
            </SecretaireLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/secretaire/absences"
        element={
          <ProtectedRoute allowedRoles={[ROLE.SECRETAIRE]}>
            <SecretaireLayout>
              <SecretaireAbsences />
            </SecretaireLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/secretaire/annonces"
        element={
          <ProtectedRoute allowedRoles={[ROLE.SECRETAIRE]}>
            <SecretaireLayout>
              <SecretaireAnnonces />
            </SecretaireLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/secretaire/reclamations"
        element={
          <ProtectedRoute allowedRoles={[ROLE.SECRETAIRE]}>
            <SecretaireLayout>
              <SecretaireReclamations />
            </SecretaireLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/secretaire/profil"
        element={
          <ProtectedRoute allowedRoles={[ROLE.SECRETAIRE]}>
            <SecretaireLayout>
              <Parametres />
            </SecretaireLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}>
            <Layout title="Tableau de Bord">
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/devoirs"
        element={
          <ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}>
            <Layout title="Devoirs & Ressources">
              <Devoirs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ressources"
        element={
          <ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}>
            <Layout title="Publier une Ressource">
              <Ressources />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/emploi-du-temps"
        element={
          <ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}>
            <Layout title="Emploi du Temps">
              <EmploiDuTemps />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/annonces"
        element={
          <ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}>
            <Layout title="Annonces">
              <Annonces />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mes-classes"
        element={
          <ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}>
            <Layout title="Mes Classes">
              <Eleves />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appel"
        element={
          <ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}>
            <Layout title="Feuille d'Appel">
              <Appel />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes-absences"
        element={
          <ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}>
            <Layout title="Notes & Absences">
              <Notes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/avancement"
        element={
          <ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}>
            <Layout title="Avancement">
              <Avancement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reclamation"
        element={
          <ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}>
            <Layout title="Reclamation">
              <Reclamation />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profil"
        element={
          <ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}>
            <Layout title="Profil">
              <Parametres />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parametres"
        element={
          <ProtectedRoute allowedRoles={[ROLE.PROFESSEUR]}>
            <Layout title="Parametres">
              <Parametres />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to={user ? getHomeRouteByRole(user?.role) : '/login'} replace />}
      />
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