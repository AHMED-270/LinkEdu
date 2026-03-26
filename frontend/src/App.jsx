import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
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

// Root Route - Redirects based on auth status
const RootRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen">Chargement...</div>;
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

// Protected Layout Wrapper
const ProtectedRoute = ({ children, title }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <Layout title={title}>{children}</Layout>;
};

// Title updates per route
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Chargement...</div>;

  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      
      {/* Protected Routes inside Layout */}
      <Route path="/dashboard" element={<ProtectedRoute title="Tableau de Bord"><Dashboard /></ProtectedRoute>} />
      <Route path="/devoirs" element={<ProtectedRoute title="Devoirs & Ressources"><Devoirs /></ProtectedRoute>} />
      <Route path="/ressources" element={<ProtectedRoute title="Publier une Ressource"><Ressources /></ProtectedRoute>} />
      <Route path="/emploi-du-temps" element={<ProtectedRoute title="Emploi du Temps"><EmploiDuTemps /></ProtectedRoute>} />
      <Route path="/annonces" element={<ProtectedRoute title="Annonces"><Annonces /></ProtectedRoute>} />
      <Route path="/mes-classes" element={<ProtectedRoute title="Mes Classes"><Eleves /></ProtectedRoute>} />
      <Route path="/appel" element={<ProtectedRoute title="Feuille d'Appel"><Appel /></ProtectedRoute>} />
      <Route path="/notes-absences" element={<ProtectedRoute title="Notes & Absences"><Notes /></ProtectedRoute>} />
      <Route path="/avancement" element={<ProtectedRoute title="Avancement"><Avancement /></ProtectedRoute>} />
      <Route path="/reclamation" element={<ProtectedRoute title="Réclamation"><Reclamation /></ProtectedRoute>} />
      <Route path="/parametres" element={<ProtectedRoute title="Paramètres"><Parametres /></ProtectedRoute>} />
      
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
