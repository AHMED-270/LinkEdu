import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiSearch, FiCommand } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './Header.css';

export default function Header({ variant = 'full', profileRouteOverride = '' }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const isShellVariant = variant === 'shell';
  
  const role = String(user?.role || '').toLowerCase();
  const isFinancePortalRole = role === 'secretaire' || role === 'comptable';
  const profileRoute = profileRouteOverride || (isFinancePortalRole ? '/secretaire/profil' : '/profil');

  // --- LOGOUT MODAL (REDESIGN PREMIUM) ---
  const logoutModal = showLogoutAlert && typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-brand-navy/40 backdrop-blur-md" 
            onClick={() => setShowLogoutAlert(false)} 
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white/90 p-8 text-center shadow-2xl backdrop-blur-xl border border-white"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-inner">
              <FiLogOut size={28} />
            </div>
            <h3 className="text-xl font-black text-brand-navy tracking-tight mb-2">Déconnexion</h3>
            
            {isLoggingOut ? (
              <div className="space-y-2 py-4 animate-pulse">
                <div className="h-2 bg-slate-200 rounded-full w-3/4 mx-auto" />
                <div className="h-2 bg-slate-100 rounded-full w-1/2 mx-auto" />
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-500 mb-8">Voulez-vous vraiment quitter <span className="text-brand-navy font-bold">LinkEdu</span> ?</p>
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all"
                onClick={() => setShowLogoutAlert(false)}
                disabled={isLoggingOut}
              >
                Annuler
              </button>
              <button
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-sm shadow-lg shadow-red-100 hover:brightness-110 active:scale-95 transition-all"
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

  async function handleLogoutConfirm() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
      await axios.post(apiBaseUrl + '/api/admin/logout', {}, { withCredentials: true });
    } catch { /* Fail silently */ } 
    finally {
      logout();
      setIsLoggingOut(false);
      setShowLogoutAlert(false);
      navigate('/login', { replace: true });
    }
  }

  return (
    <>
      {logoutModal}

      <header className={isShellVariant
        ? 'premium-header h-[72px] flex items-center justify-end px-8 flex-shrink-0 z-40 relative'
        : 'fixed top-0 left-0 right-0 z-[100] h-20 flex items-center justify-between px-6 bg-white/60 backdrop-blur-glass-md border-b border-white/40 shadow-glass-sm transition-all duration-500'}>

        {!isShellVariant && (
          <div className="flex items-center gap-10">
            <div
              onClick={() => navigate('/')}
              className="group flex items-center gap-2 cursor-pointer"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-brand-teal to-brand-navy rounded-xl shadow-glow flex items-center justify-center text-white font-bold text-lg group-hover:rotate-6 transition-transform">
                L
              </div>
              <div className="text-2xl font-black tracking-tighter">
                <span className="text-brand-navy">Link</span>
                <span className="text-brand-teal">Edu</span>
              </div>
            </div>

            {/* MODERN SEARCH BAR (APPLE STYLE) */}
            <div className="hidden lg:flex items-center relative group w-64">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-slate-400 group-focus-within:text-brand-teal transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Recherche rapide..."
                className="w-full bg-slate-100/50 border border-transparent focus:bg-white focus:border-brand-teal/30 focus:ring-4 focus:ring-brand-teal/5 tracking-tight rounded-2xl py-2.5 pl-11 pr-10 text-sm outline-none transition-all duration-300"
              />
              <div className="absolute right-3 flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-sm">
                <FiCommand className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400">K</span>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT: ACTIONS & PROFILE */}
        <div className="flex items-center gap-3 shrink-0">
          {/* PROFILE PILL */}
          <button 
            onClick={() => navigate(profileRoute)} 
            className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-white/40 border border-white/60 hover:bg-white/80 hover:shadow-glass hover:border-brand-teal/20 transition-all duration-300 group"
          >
            <div className="relative">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profil" className="h-9 w-9 rounded-xl object-cover ring-2 ring-white shadow-sm" />
              ) : (
                <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal text-white font-bold text-sm ring-2 ring-white shadow-premium">
                  {String(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-black text-brand-navy leading-none mb-1 group-hover:text-brand-teal transition-colors">
                {user?.name?.split(' ')[0] || 'Utilisateur'}
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {user?.role || 'Membre'}
              </p>
            </div>
          </button>

          {!isShellVariant && (
            <button
              type="button"
              className="p-2.5 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300 group"
              onClick={() => setShowLogoutAlert(true)}
              title="Déconnexion"
            >
              <FiLogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </header>
    </>
  );
}