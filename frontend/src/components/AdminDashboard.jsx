import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, LayoutDashboard, Users, GraduationCap, Settings, LogOut, DoorOpen, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import AdminDashboardHome from './AdminDashboardHome';
import AdminUsers from './AdminUsers';
import AdminClasses from './AdminClasses';
import AdminProfile from './AdminProfile';
import AdminUserForm from './AdminUserForm';
import AdminClassForm from './AdminClassForm';
import AdminMatieres from './AdminMatieres';
import AdminSettings from './AdminSettings';
import { ROLE, getRoleDisplayLabel } from '../constants/roles';

const ADMIN_AVATAR_STORAGE_KEY = 'linkedu_admin_avatar';
const SUBPROJECT_STORAGE_KEY = 'linkedu_subproject_settings';

const defaultSubproject = {
  displayName: 'LinkedU Admin',
  tagline: 'Gestion du sous-projet',
  schoolYear: '2025-2026',
  coordinator: '',
};

export default function AdminDashboard({ onLogout, userRole = ROLE.ADMIN, user = null }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [subproject, setSubproject] = useState(defaultSubproject);
  
  const headerAvatar = user?.profilePhoto || avatarUrl;
  const displayName = user?.name || 'Utilisateur';
  const displayRole = getRoleDisplayLabel(userRole);

  useEffect(() => {
    const loadAvatar = () => setAvatarUrl(localStorage.getItem(ADMIN_AVATAR_STORAGE_KEY) || '');
    const handleStorage = (e) => { if (e.key === ADMIN_AVATAR_STORAGE_KEY) loadAvatar(); };

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
        if (raw) {
          setSubproject({ ...defaultSubproject, ...JSON.parse(raw) });
        } else {
          setSubproject(defaultSubproject);
        }
      } catch (error) {
        setSubproject(defaultSubproject);
      }
    };

    const handleStorage = (e) => { if (e.key === SUBPROJECT_STORAGE_KEY) loadSubproject(); };

    loadSubproject();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('linkedu-subproject-updated', loadSubproject);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('linkedu-subproject-updated', loadSubproject);
    };
  }, []);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
      const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://' + browserHost + ':8000';
      const token = localStorage.getItem('linkedu_token');
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', { withCredentials: true, withXSRFToken: true });
      await axios.post(apiBaseUrl + '/api/admin/logout', {}, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }
      });
    } catch (error) {
      console.error("Erreur de déconnexion", error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      if (onLogout) onLogout();
    }
  };

  // Define navigation items for easy filtering and staggered animation
  const navItems = [
    { id: 'home', label: 'Tableau de bord', icon: LayoutDashboard, roles: [ROLE.ADMIN, ROLE.DIRECTEUR, ROLE.SECRETAIRE] },
    { id: 'users', label: 'Utilisateurs', icon: Users, roles: [ROLE.ADMIN] },
    { id: 'classes', label: 'Classes', icon: GraduationCap, roles: [ROLE.ADMIN, ROLE.DIRECTEUR, ROLE.SECRETAIRE] },
    { id: 'matieres', label: 'Matières', icon: BookOpen, roles: [ROLE.ADMIN] },
    { id: 'settings', label: 'Paramètres', icon: Settings, roles: [ROLE.ADMIN, ROLE.DIRECTEUR, ROLE.SECRETAIRE] },
  ].filter(item => item.roles.includes(userRole));

  // Framer Motion Variants
  const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.05 + 0.1, type: 'spring' } })
  };

  const pageVariants = {
    initial: { opacity: 0, y: 15, scale: 0.99 },
    in: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    out: { opacity: 0, y: -15, scale: 0.99, transition: { duration: 0.3, ease: "easeIn" } }
  };

  return (
    <div className="layout">
      {/* ===== GLOBAL MODALS ===== */}
      <AnimatePresence>
        {showCreateUserModal && userRole === ROLE.ADMIN && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="logout-modal-backdrop">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="logout-modal-card p-0 overflow-hidden max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
              <AdminUserForm
                mode="create"
                isModal={true}
                onBack={() => setShowCreateUserModal(false)}
                onSuccess={() => { setShowCreateUserModal(false); setCurrentView('users'); }}
              />
            </motion.div>
          </motion.div>
        )}

        {showCreateClassModal && userRole === ROLE.ADMIN && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="logout-modal-backdrop">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="logout-modal-card p-0 overflow-hidden max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
              <AdminClassForm
                mode="create"
                isModal={true}
                onBack={() => setShowCreateClassModal(false)}
                onSuccess={() => { setShowCreateClassModal(false); setCurrentView('classes'); }}
              />
            </motion.div>
          </motion.div>
        )}

        {showLogoutModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="logout-modal-backdrop">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="logout-modal-card">
              <div className="logout-modal-icon"><DoorOpen size={40} color="#EF4444" /></div>
              <h3>Êtes-vous sûr de vouloir vous déconnecter ?</h3>
              <p>Vous devrez saisir à nouveau vos identifiants pour accéder à ce panneau.</p>
              <div className="logout-modal-actions mt-6">
                <button className="btn btn-outline flex-1" onClick={() => setShowLogoutModal(false)} disabled={isLoggingOut}>Annuler</button>
                <button className="btn btn-danger flex-1" onClick={handleLogoutConfirm} disabled={isLoggingOut}>
                  {isLoggingOut ? 'Déconnexion...' : 'Oui, déconnecter'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SIDEBAR ===== */}
      <motion.aside 
        initial={{ x: -260 }} 
        animate={{ x: 0 }} 
        transition={{ type: "spring", damping: 20 }}
        className="sidebar fixed top-0 left-0 h-screen z-50 pt-0" style={{ top: 0, height: "100vh" }}
      >
        <div className="p-6 pb-4 mb-2 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-extrabold text-blue-600 tracking-tight flex items-center gap-2">
            <span className="text-2xl">??</span> {subproject.displayName}
          </h2>
          <div className="mt-3">
            <span className="badge badge-blue">{subproject.schoolYear}</span>
            <p className="text-xs text-slate-500 mt-2 font-medium">{subproject.tagline}</p>
          </div>
        </div>

        <nav className="sidebar-nav px-4 mt-4">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <motion.a
                key={item.id}
                href="#"
                custom={i}
                initial="hidden"
                animate="visible"
                variants={navItemVariants}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setCurrentView(item.id); }}
              >
                <Icon size={20} className="sidebar-icon" />
                <span>{item.label}</span>
                {isActive && <motion.div layoutId="activeDot" className="active-dot" />}
              </motion.a>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={20} className="sidebar-icon" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </motion.aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="layout-main ml-[260px]">
        {/* Header */}
        <header className="header" style={{ left: '260px', width: 'calc(100% - 260px)' }}>
          <div className="flex-1"></div> {/* Spacer for layout balance */}
          
          <div className="header-actions">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              className="icon-btn"
            >
              <motion.div whileHover={{ rotate: [0, -15, 15, -15, 15, 0] }} transition={{ duration: 0.5 }}>
                <Bell size={20} />
              </motion.div>
              <span className="notification-dot"></span>
            </motion.button>
            
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            
            <motion.button 
              whileHover={{ y: -2 }}
              onClick={() => setCurrentView('profile')} 
              className="header-profile"
            >
              <div className="header-profile-info">
                <span className="header-profile-name">{displayName}</span>
                <span className="header-profile-role">{displayRole}</span>
              </div>
              <div className="header-profile-avatar overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
                {headerAvatar ? (
                  <img src={headerAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-blue-600">{displayName.charAt(0)}</span>
                )}
              </div>
            </motion.button>
          </div>
        </header>

        {/* Page Content with Transitions */}
        <div className="layout-content min-h-[calc(100vh-70px)] pt-24 px-8 pb-12 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              className="w-full h-full"
            >
              {currentView === 'home' && <AdminDashboardHome />}
              {currentView === 'users' && userRole === ROLE.ADMIN && <AdminUsers onCreateUser={() => setShowCreateUserModal(true)} />}
              {currentView === 'classes' && <AdminClasses userRole={userRole} onCreateClass={() => setShowCreateClassModal(true)} />}
              {currentView === 'matieres' && userRole === ROLE.ADMIN && <AdminMatieres userRole={userRole} />}
              {currentView === 'settings' && <AdminSettings />}
              {currentView === 'profile' && <AdminProfile />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
