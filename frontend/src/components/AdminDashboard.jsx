import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiBell as Bell, FiHelpCircle as HelpCircle, FiGrid as LayoutDashboard, FiUsers as Users, FiBookOpen as GraduationCap, FiSettings as Settings, FiLogOut as LogOut, FiUser as UserCircle, FiLogOut as DoorOpen, FiBookOpen as BookOpen, FiUserCheck as UserCheck } from 'react-icons/fi';
import './AdminDashboard.css';
import AdminDashboardHome from './AdminDashboardHome';
import AdminUsers from './AdminUsers';
import AdminClasses from './AdminClasses';
import AdminProfile from './AdminProfile';
import AdminUserForm from './AdminUserForm';
import AdminClassForm from './AdminClassForm';
import AdminMatieres from './AdminMatieres';
import AdminSettings from './AdminSettings';
import AdminAccountActivations from './AdminAccountActivations';

const ADMIN_AVATAR_STORAGE_KEY = 'linkedu_admin_avatar';
const SUBPROJECT_STORAGE_KEY = 'linkedu_subproject_settings';

const defaultSubproject = {
  displayName: 'LinkedU Admin',
  tagline: 'Gestion du sous-projet',
  schoolYear: '2025-2026',
  coordinator: '',
};

export default function AdminDashboard({ onLogout, userRole = 'admin', user = null }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [editingUser, setEditingUser] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [subproject, setSubproject] = useState(defaultSubproject);
  const headerAvatar = user?.profilePhoto || avatarUrl;
  const displayName = user?.name || 'Utilisateur';
  const displayRole = userRole === 'directeur' ? 'DIRECTION' : 'SUPER ADMIN';

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
      } catch {
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
    setEditingUser(null);
    setCurrentView('user-create');
  };

  const openEditUserForm = (userToEdit) => {
    setEditingUser(userToEdit || null);
    setCurrentView('user-edit');
  };

  const openCreateClassForm = () => {
    setEditingClass(null);
    setCurrentView('class-create');
  };

  const openEditClassForm = (classe) => {
    setEditingClass(classe || null);
    setCurrentView('class-edit');
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
      {showLogoutModal && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal-card">
            <div className="logout-modal-icon">
              <DoorOpen size={48} color="#f43f5e" />
            </div>
            <h3>Deconnexion</h3>
            <p>Voulez-vous vraiment vous deconnecter ?</p>
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
                {isLoggingOut ? 'Deconnexion...' : 'Oui'}
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
                <span>Cadre academique</span>
              </a>
            )}
            {userRole === 'admin' && (
              <a href="#" className={'nav-item ' + (currentView === 'activations' ? 'active' : '')} onClick={(e) => {e.preventDefault(); setCurrentView('activations');}}>
                <UserCheck size={20} />
                <span>Activations</span>
              </a>
            )}
              <a href="#" className={'nav-item ' + (['classes', 'class-create', 'class-edit'].includes(currentView) ? 'active' : '')} onClick={(e) => {e.preventDefault(); setCurrentView('classes');}}>
              <GraduationCap size={20} />
              <span>Classes</span>
            </a>
            {userRole === 'admin' && (
              <a href="#" className={'nav-item ' + (currentView === 'matieres' ? 'active' : '')} onClick={(e) => {e.preventDefault(); setCurrentView('matieres');}}>
                <BookOpen size={20} />
                <span>Matieres</span>
              </a>
            )}
            <a href="#" className={'nav-item ' + (currentView === 'profile' ? 'active' : '')} onClick={(e) => {e.preventDefault(); setCurrentView('profile');}}>
              <Settings size={20} />
              <span>Parametres</span>
            </a>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={20} />
            <span>Se déconnecter</span>
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
            <div className="header-divider"></div>
            <div className="user-profile" onClick={() => setCurrentView('profile')} style={{ cursor: 'pointer' }}>
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-role">{displayRole}</span>
              </div>
              <div className="avatar">
                {headerAvatar ? (
                  <img src={headerAvatar} alt="Photo de profil admin" className="avatar-image" />
                ) : (
                  <UserCircle size={36} strokeWidth={1.5} color="#0056b3" />
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-scroll" style={{ background: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
          {currentView === 'home' && <AdminDashboardHome />}
          {currentView === 'users' && userRole === 'admin' && (
            <AdminUsers
              onCreateUser={openCreateUserForm}
              onEditUser={openEditUserForm}
            />
          )}
          {currentView === 'user-create' && userRole === 'admin' && (
            <AdminUserForm
              mode="create"
              userToEdit={null}
              isModal={false}
              onBack={() => setCurrentView('users')}
              onSuccess={() => {
                setCurrentView('users');
              }}
            />
          )}
          {currentView === 'user-edit' && userRole === 'admin' && editingUser && (
            <AdminUserForm
              mode="edit"
              userToEdit={editingUser}
              isModal={false}
              onBack={() => {
                setEditingUser(null);
                setCurrentView('users');
              }}
              onSuccess={() => {
                setEditingUser(null);
                setCurrentView('users');
              }}
            />
          )}
          {currentView === 'activations' && userRole === 'admin' && (
            <AdminAccountActivations />
          )}
          {currentView === 'classes' && (
            <AdminClasses
              userRole={userRole}
              onCreateClass={openCreateClassForm}
              onEditClass={openEditClassForm}
            />
          )}
          {currentView === 'class-create' && userRole === 'admin' && (
            <AdminClassForm
              mode="create"
              classToEdit={null}
              isModal={false}
              onBack={() => setCurrentView('classes')}
              onSuccess={() => {
                setCurrentView('classes');
              }}
            />
          )}
          {currentView === 'class-edit' && userRole === 'admin' && editingClass && (
            <AdminClassForm
              mode="edit"
              classToEdit={editingClass}
              isModal={false}
              onBack={() => {
                setEditingClass(null);
                setCurrentView('classes');
              }}
              onSuccess={() => {
                setEditingClass(null);
                setCurrentView('classes');
              }}
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
