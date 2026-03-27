import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiBell as Bell, FiHelpCircle as HelpCircle, FiGrid as LayoutDashboard, FiUsers as Users, FiBookOpen as GraduationCap, FiSettings as Settings, FiLogOut as LogOut, FiUser as UserCircle, FiLogOut as DoorOpen, FiBookOpen as BookOpen } from 'react-icons/fi';
import './AdminDashboard.css';
import AdminDashboardHome from './AdminDashboardHome';
import AdminUsers from './AdminUsers';
import AdminClasses from './AdminClasses';
import AdminProfile from './AdminProfile';
import AdminUserForm from './AdminUserForm';
import AdminClassForm from './AdminClassForm';
import AdminMatieres from './AdminMatieres';
import AdminSettings from './AdminSettings';

const ADMIN_AVATAR_STORAGE_KEY = 'linkedu_admin_avatar';
const SUBPROJECT_STORAGE_KEY = 'linkedu_subproject_settings';

const defaultSubproject = {
  displayName: 'LinkedU Admin',
  tagline: 'Gestion du sous-projet',
  schoolYear: '2025-2026',
  coordinator: '',
};

export default function AdminDashboard({ onLogout, userRole = 'admin' }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [subproject, setSubproject] = useState(defaultSubproject);

  useEffect(() => {
    const loadAvatar = () => {
      const savedAvatar = localStorage.getItem(ADMIN_AVATAR_STORAGE_KEY) || '';
      setAvatarUrl(savedAvatar);
    };

    const handleStorage = (event) => {
      if (event.key === ADMIN_AVATAR_STORAGE_KEY) {
        loadAvatar();
      }
    };

    loadAvatar();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('admin-avatar-updated', loadAvatar);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('admin-avatar-updated', loadAvatar);
    };
  }, []);

  useEffect(() => {
    const loadSubproject = () => {
      try {
        const raw = localStorage.getItem(SUBPROJECT_STORAGE_KEY);
        if (!raw) {
          setSubproject(defaultSubproject);
          return;
        }

        const parsed = JSON.parse(raw);
        setSubproject({ ...defaultSubproject, ...parsed });
      } catch (error) {
        setSubproject(defaultSubproject);
      }
    };

    const handleStorage = (event) => {
      if (event.key === SUBPROJECT_STORAGE_KEY) {
        loadSubproject();
      }
    };

    loadSubproject();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('linkedu-subproject-updated', loadSubproject);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('linkedu-subproject-updated', loadSubproject);
    };
  }, []);

  const openCreateUserForm = () => {
    setShowCreateUserModal(true);
  };

  const openCreateClassForm = () => {
    setShowCreateClassModal(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
      
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });

      await axios.post(apiBaseUrl + '/api/admin/logout', {}, {
        withCredentials: true,
        withXSRFToken: true,
        headers: {
          Accept: 'application/json',
        }
      });
    } catch (error) {
      console.error("Erreur de déconnexion", error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      if (onLogout) onLogout();
    }
  };

  return (
    <div className="admin-layout">
      {showCreateUserModal && userRole === 'admin' && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal-card" style={{ maxWidth: '900px', width: '90vw', maxHeight: '90vh', overflowY: 'auto', padding: '16px' }}>
            <AdminUserForm
              mode="create"
              userToEdit={null}
              isModal={true}
              onBack={() => setShowCreateUserModal(false)}
              onSuccess={() => {
                setShowCreateUserModal(false);
                setCurrentView('users');
              }}
            />
          </div>
        </div>
      )}

      {showCreateClassModal && userRole === 'admin' && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal-card" style={{ maxWidth: '900px', width: '90vw', maxHeight: '90vh', overflowY: 'auto', padding: '16px' }}>
            <AdminClassForm
              mode="create"
              classToEdit={null}
              isModal={true}
              onBack={() => setShowCreateClassModal(false)}
              onSuccess={() => {
                setShowCreateClassModal(false);
                setCurrentView('classes');
              }}
            />
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal-card">
            <div className="logout-modal-icon">
              <DoorOpen size={48} color="#f43f5e" />
            </div>
            <h3>Êtes-vous sûr de vouloir vous déconnecter ?</h3>
            <p>Vous devrez saisir à nouveau vos identifiants pour accéder à ce panneau.</p>
            <div className="logout-modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                Annuler
              </button>
              <button 
                className="btn-confirm-logout" 
                onClick={handleLogoutConfirm}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Déconnexion...' : 'Oui, me déconnecter'}
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="admin-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <h2>{subproject.displayName || defaultSubproject.displayName}</h2>
          </div>

          <div className="sidebar-section">
            <h3 className="section-title">Admin Console</h3>
            <p className="section-subtitle">{subproject.schoolYear || defaultSubproject.schoolYear}</p>
            <p className="section-subtitle" style={{ textTransform: 'none', letterSpacing: 'normal', marginTop: '8px' }}>
              {subproject.tagline || defaultSubproject.tagline}
            </p>
          </div>

          <nav className="sidebar-nav">
            <a href="#" className={'nav-item ' + (currentView === 'home' ? 'active' : '')} onClick={(e) => {e.preventDefault(); setCurrentView('home');}}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </a>
            {userRole === 'admin' && (
              <a href="#" className={'nav-item ' + (currentView === 'users' ? 'active' : '')} onClick={(e) => {e.preventDefault(); setCurrentView('users');}}>
                <Users size={20} />
                <span>Users</span>
              </a>
            )}
              <a href="#" className={'nav-item ' + (currentView === 'classes' ? 'active' : '')} onClick={(e) => {e.preventDefault(); setCurrentView('classes');}}>
              <GraduationCap size={20} />
              <span>Classes</span>
            </a>
            {userRole === 'admin' && (
              <a href="#" className={'nav-item ' + (currentView === 'matieres' ? 'active' : '')} onClick={(e) => {e.preventDefault(); setCurrentView('matieres');}}>
                <BookOpen size={20} />
                <span>Matieres</span>
              </a>
            )}
            <a href="#" className={'nav-item ' + (currentView === 'settings' ? 'active' : '')} onClick={(e) => {e.preventDefault(); setCurrentView('settings');}}>
              <Settings size={20} />
              <span>Parametres</span>
            </a>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-actions">
            <button className="icon-btn">
              <Bell size={20} />
              <span className="notif-dot"></span>
            </button>
            <button className="icon-btn">
              <HelpCircle size={20} />
            </button>
            <div className="header-divider"></div>
            <div className="user-profile" onClick={() => setCurrentView('profile')} style={{ cursor: 'pointer' }}>
              <div className="user-info">
                <span className="user-name">Ahmed Fahimi</span>
                <span className="user-role">{userRole === 'directeur' ? 'DIRECTION' : 'SUPER ADMIN'}</span>
              </div>
              <div className="avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Photo de profil admin" className="avatar-image" />
                ) : (
                  <UserCircle size={36} strokeWidth={1.5} color="#0056b3" />
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-scroll">
          {currentView === 'home' && <AdminDashboardHome />}
          {currentView === 'users' && userRole === 'admin' && (
            <AdminUsers
              onCreateUser={openCreateUserForm}
            />
          )}
          {currentView === 'classes' && (
            <AdminClasses
              userRole={userRole}
              onCreateClass={openCreateClassForm}
            />
          )}
          {currentView === 'matieres' && userRole === 'admin' && (
            <AdminMatieres userRole={userRole} />
          )}
          {currentView === 'settings' && <AdminSettings />}
          {currentView === 'profile' && <AdminProfile />}
        </div>
      </main>
    </div>
  );
}
