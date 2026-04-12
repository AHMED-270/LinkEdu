import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initials = (user?.name || 'P').trim().charAt(0).toUpperCase();

  return (
    <header className="header">
      <div className="header-logo">
        <span className="logo-link">Linked</span><span className="logo-edu">U</span>
      </div>

      <div className="header-actions">
        <button className="icon-btn"><FiBell size={20} /></button>
        <button className="header-profile" onClick={() => navigate('/profil')} title="Profil">
          <div className="header-profile-info">
            <span className="header-profile-name">{user?.name || 'Professeur'}</span>
            <span className="header-profile-role">{user?.role || 'professeur'}</span>
          </div>
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt="Profil" className="header-profile-avatar" />
          ) : (
            <div className="header-profile-avatar header-profile-avatar-fallback">{initials}</div>
          )}
        </button>
      </div>
    </header>
  );
}

