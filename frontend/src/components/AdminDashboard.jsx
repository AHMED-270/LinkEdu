import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiHelpCircle as HelpCircle, FiGrid as LayoutDashboard, FiUsers as Users, FiBookOpen as GraduationCap, FiSettings as Settings, FiLogOut as LogOut, FiUser as UserCircle, FiLogOut as DoorOpen, FiBookOpen as BookOpen, FiUserCheck as UserCheck, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
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
import logo from '../assets/images/linkedu-logo.png';

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
  const initials = (displayName || 'A').trim().charAt(0).toUpperCase();

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

  // Navigation items
  const navItems = [
    { key: 'home', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { key: 'users', label: 'Cadre académique', icon: Users, adminOnly: true },
    { key: 'activations', label: 'Activations', icon: UserCheck, adminOnly: true },
    { key: 'classes', label: 'Classes', icon: GraduationCap, adminOnly: false },
    { key: 'matieres', label: 'Matières', icon: BookOpen, adminOnly: true },
    { key: 'profile', label: 'Paramètres', icon: Settings, adminOnly: false },
  ];

  const visibleNavItems = navItems.filter(item => !item.adminOnly || userRole === 'admin');

  // --- PREMIUM LOGOUT MODAL ---
  const logoutModal = showLogoutModal && typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        <div className="premium-modal-overlay">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="premium-modal-backdrop"
            onClick={() => setShowLogoutModal(false)}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="premium-modal-card"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-inner">
              <DoorOpen size={28} />
            </div>
            <h3 className="mb-2 text-xl font-black text-brand-navy tracking-tight">Déconnexion</h3>
            <p className="mb-8 text-sm font-medium text-slate-500 leading-relaxed">
              Êtes-vous sûr de vouloir quitter votre session <span className="text-brand-navy font-bold">LinkEdu</span> ?
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                Annuler
              </button>
              <button
                className="flex-1 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                onClick={handleLogoutConfirm}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? '...' : 'Oui, sortir'}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>,
      document.body
    ) : null;

  return (
    <div className="premium-bg flex h-screen w-screen overflow-hidden fixed inset-0">
      {logoutModal}

      {/* ===== PREMIUM SIDEBAR ===== */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="premium-sidebar w-[280px] flex-shrink-0 flex flex-col z-50 relative overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center justify-center py-8 mb-2 relative z-10">
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-brand-teal/20 blur-2xl rounded-full group-hover:bg-brand-teal/40 transition-all duration-700" />
            <img src={logo} alt="LinkEdu" className="h-10 w-auto relative z-10 drop-shadow-xl transition-transform duration-500 group-hover:scale-110" />
          </div>
        </div>

        {/* Subproject info */}
        <div className="px-5 mb-6 relative z-10">
          <div className="rounded-2xl border border-white/60 bg-white/40 p-4 backdrop-blur-md shadow-glass-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-navy/70 mb-1">Admin Console</h3>
            <p className="text-[11px] font-semibold text-slate-500">{subproject.schoolYear || defaultSubproject.schoolYear}</p>
            <p className="text-[11px] text-slate-400 mt-1">{subproject.tagline || defaultSubproject.tagline}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 relative z-10">Menu</div>
        <nav className="flex-1 space-y-1 px-3 overflow-y-auto custom-scrollbar relative z-10">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key || 
              (item.key === 'classes' && ['classes', 'class-create', 'class-edit'].includes(currentView)) ||
              (item.key === 'users' && ['users', 'user-create', 'user-edit'].includes(currentView));
            return (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key)}
                className={`group relative flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-navy text-white shadow-premium'
                    : 'text-slate-500 hover:bg-white/50 hover:text-brand-navy'
                }`}
              >
                <Icon size={18} className={`${isActive ? 'text-brand-teal' : 'text-slate-400 group-hover:text-brand-teal'} transition-colors duration-300`} />
                <span className="flex-1 tracking-tight text-left">{item.label}</span>
                {isActive ? (
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-teal shadow-glow" />
                ) : (
                  <FiChevronRight className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-300" size={14} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 mt-auto relative z-10">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full items-center justify-center gap-3 rounded-[1.4rem] bg-red-50/50 px-4 py-4 text-sm font-bold text-red-500 border border-red-100/50 transition-all hover:bg-red-50 hover:shadow-md active:scale-95 group"
          >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </motion.aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Premium Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="premium-header h-[72px] flex items-center justify-end px-8 flex-shrink-0 z-40 relative"
        >
          <div className="flex items-center gap-4">
            {/* Profile */}
            <button
              onClick={() => setCurrentView('profile')}
              className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-white/40 border border-white/60 hover:bg-white/80 hover:shadow-glass hover:border-brand-teal/20 transition-all duration-300 group"
            >
              <div className="relative">
                {headerAvatar ? (
                  <img src={headerAvatar} alt="Profil" className="h-9 w-9 rounded-xl object-cover ring-2 ring-white shadow-sm" />
                ) : (
                  <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal text-white font-bold text-sm ring-2 ring-white shadow-premium">
                    {initials}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-brand-navy leading-none mb-1 group-hover:text-brand-teal transition-colors">
                  {displayName.split(' ')[0]}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  {displayRole}
                </p>
              </div>
            </button>
          </div>
        </motion.header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="p-8 lg:p-10 max-w-[1600px] mx-auto"
          >
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
          </motion.div>
        </div>
      </main>
    </div>
  );
}
