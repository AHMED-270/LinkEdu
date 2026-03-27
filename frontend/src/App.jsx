import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
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
import './App.css';

const normalizeRole = (role) => String(role || '').toLowerCase();
const isAdminRole = (role) => ['admin', 'directeur'].includes(normalizeRole(role));

// Root Route - Redirects based on auth status
const RootRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return isAdminRole(user?.role)
    ? <Navigate to="/admin" replace />
    : <Navigate to="/dashboard" replace />;
};

const AdminPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return <AdminDashboard onLogout={handleAdminLogout} userRole={normalizeRole(user?.role)} />;
};

// Protected route for admin roles only
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdminRole(user?.role)) return <Navigate to="/dashboard" replace />;

  return children;
};

// Protected route for professeur view only
const ProfesseurRoute = ({ children, title }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (isAdminRole(user?.role)) return <Navigate to="/admin" replace />;
  
  return <Layout title={title}>{children}</Layout>;
};

// Title updates per route
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Chargement...</div>;

  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route
        path="/login"
        element={
          user
            ? <Navigate to={isAdminRole(user?.role) ? '/admin' : '/dashboard'} replace />
            : <Login />
        }
      />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      
      {/* Protected Routes inside Layout */}
      <Route path="/dashboard" element={<ProfesseurRoute title="Tableau de Bord"><Dashboard /></ProfesseurRoute>} />
      <Route path="/devoirs" element={<ProfesseurRoute title="Devoirs & Ressources"><Devoirs /></ProfesseurRoute>} />
      <Route path="/ressources" element={<ProfesseurRoute title="Publier une Ressource"><Ressources /></ProfesseurRoute>} />
      <Route path="/emploi-du-temps" element={<ProfesseurRoute title="Emploi du Temps"><EmploiDuTemps /></ProfesseurRoute>} />
      <Route path="/annonces" element={<ProfesseurRoute title="Annonces"><Annonces /></ProfesseurRoute>} />
      <Route path="/mes-classes" element={<ProfesseurRoute title="Mes Classes"><Eleves /></ProfesseurRoute>} />
      <Route path="/appel" element={<ProfesseurRoute title="Feuille d'Appel"><Appel /></ProfesseurRoute>} />
      <Route path="/notes-absences" element={<ProfesseurRoute title="Notes & Absences"><Notes /></ProfesseurRoute>} />
      <Route path="/avancement" element={<ProfesseurRoute title="Avancement"><Avancement /></ProfesseurRoute>} />
      <Route path="/reclamation" element={<ProfesseurRoute title="Réclamation"><Reclamation /></ProfesseurRoute>} />
      <Route path="/parametres" element={<ProfesseurRoute title="Paramètres"><Parametres /></ProfesseurRoute>} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
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
