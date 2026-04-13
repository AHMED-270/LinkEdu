import { useMemo } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleDisplayLabel } from '../constants/roles';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const fullName = useMemo(() => {
    if (!user) return 'Utilisateur';
    if (user.name) return user.name;
    const first = user.prenom || '';
    const last = user.nom || '';
    return `${first} ${last}`.trim() || 'Utilisateur';
  }, [user]);

  const initials = useMemo(() => {
    const base = fullName.trim();
    if (!base) return 'U';
    return base.charAt(0).toUpperCase();
  }, [fullName]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="header">
      <div className="header-logo">
        <span className="logo-link">Link</span>
        <span className="logo-edu">Edu</span>
      </div>

      <div className="header-actions">
        <button className="icon-btn" type="button" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <div className="header-profile">
          <div className="header-profile-info">
            <span className="header-profile-name">{fullName}</span>
            <span className="header-profile-role">{getRoleDisplayLabel(user?.role)}</span>
          </div>
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt="Profil" className="header-profile-avatar" />
          ) : (
            <div className="header-profile-avatar header-profile-avatar-fallback">{initials}</div>
          )}
        </div>

        <button className="header-logout-icon" type="button" aria-label="Se deconnecter" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}