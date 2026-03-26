import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiCalendar, FiUsers, FiStar, FiFileText, FiMessageCircle, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Tableau de bord', icon: FiGrid },
  { path: '/emploi-du-temps', label: 'Emploi du temps', icon: FiCalendar },
  { path: '/mes-classes', label: 'Mes Classes', icon: FiUsers },
  { path: '/notes-absences', label: 'Notes & Absences', icon: FiStar },
  { path: '/devoirs', label: 'Devoirs & Ressources', icon: FiFileText },
  { path: '/annonces', label: 'Annonces', icon: FiMessageCircle },
  { path: '/parametres', label: 'Paramètres', icon: FiSettings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-profile">
        <img src="https://i.pravatar.cc/150?u=12" alt="Profil" className="sidebar-avatar" />
        <div className="sidebar-user-info">
          <span className="sidebar-name">{user?.name || 'Utilisateur'}</span>
          <span className="sidebar-role">{user?.role || 'membre'}</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          <FiLogOut size={18} className="sidebar-icon" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}
