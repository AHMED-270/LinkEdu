import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiUsers, FiCreditCard, FiBookOpen, FiCalendar, FiMessageCircle, FiAlertCircle, FiFileText, FiLogOut, FiChevronRight } from 'react-icons/fi';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import logo from '../assets/images/linkedu-logo.png';

const navItems = [
  { path: '/secretaire/dashboard', label: 'Tableau de bord', icon: FiGrid },
  { path: '/secretaire/etudiants', label: 'Étudiants', icon: FiUsers },
  { path: '/secretaire/paiements', label: 'Paiements', icon: FiCreditCard },
  { path: '/secretaire/classes', label: 'Classes', icon: FiBookOpen },
  { path: '/secretaire/absences', label: 'Absences', icon: FiCalendar },
  { path: '/secretaire/annonces', label: 'Annonces', icon: FiMessageCircle },
  { path: '/secretaire/reclamations', label: 'Réclamations', icon: FiAlertCircle },
  { path: '/secretaire/demandes', label: 'Demandes', icon: FiFileText },
];

export default function SecretaireSidebar() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const role = String(user?.role || '').toLowerCase();
  const isComptable = role === 'comptable';
  const displayRole = isComptable ? 'Comptable' : 'Secrétaire';
  const fallbackName = isComptable ? 'Comptable' : 'Secrétaire';
  const visibleNavItems = role === 'comptable'
    ? navItems.filter((item) => item.path === '/secretaire/dashboard' || item.path === '/secretaire/paiements')
    : navItems.filter((item) => item.path !== '/secretaire/paiements');

  const handleLogoutConfirm = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });
      await axios.post(apiBaseUrl + '/api/admin/logout', {}, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' },
      });
    } catch {
      // Continue even if API request fails.
    } finally {
      logout();
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      navigate('/login', { replace: true });
    }
  };

  const initials = (user?.name || 'S').trim().charAt(0).toUpperCase();

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
              <FiLogOut size={28} />
            </div>
            <h3 className="mb-2 text-xl font-black text-brand-navy tracking-tight">Déconnexion</h3>
            <p className="mb-8 text-sm font-medium text-slate-500 leading-relaxed">
              Voulez-vous vraiment quitter <span className="text-brand-navy font-bold">LinkEdu</span> ?
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
    )
    : null;

  return (
    <>
      {logoutModal}

      <aside className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center py-6 mb-2">
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-brand-teal/20 blur-2xl rounded-full group-hover:bg-brand-teal/40 transition-all duration-700" />
            <img src={logo} alt="LinkEdu" className="h-9 w-auto relative z-10 drop-shadow-xl transition-transform duration-500 group-hover:scale-110" />
          </div>
        </div>

        {/* User profile card */}
        <div className="px-3 mb-6">
          <div className="rounded-[1.5rem] border border-white/60 bg-white/40 p-4 backdrop-blur-md shadow-glass-sm group hover:bg-white/60 transition-all duration-500">
            <div className="flex items-center gap-3">
              <div className="relative">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Profil" className="h-11 w-11 rounded-2xl object-cover ring-2 ring-white shadow-sm" />
                ) : (
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center text-white font-bold shadow-premium ring-2 ring-white transition-transform group-hover:rotate-3">
                    {initials}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 animate-pulse-glow shadow-sm" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-brand-navy tracking-tight">{user?.name || fallbackName}</div>
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-brand-teal/70">
                  {displayRole}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation label */}
        <div className="px-5 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Navigation</div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 px-2 overflow-y-auto custom-scrollbar">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-brand-navy text-white shadow-premium'
                      : 'text-slate-500 hover:bg-white/50 hover:text-brand-navy'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={`${isActive ? 'text-brand-teal' : 'text-slate-400 group-hover:text-brand-teal'} transition-colors duration-300`} />
                    <span className="flex-1 tracking-tight">{item.label}</span>
                    {isActive ? (
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-teal shadow-glow" />
                    ) : (
                      <FiChevronRight className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-300" size={14} />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="p-3 mt-auto">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full items-center justify-center gap-3 rounded-[1.4rem] bg-red-50/50 px-4 py-3.5 text-sm font-bold text-red-500 border border-red-100/50 transition-all hover:bg-red-50 hover:shadow-md active:scale-95 group"
          >
            <FiLogOut size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Quitter LinkEdu</span>
          </button>
        </div>
      </aside>
    </>
  );
}
