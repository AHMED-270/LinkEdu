import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiUsers, FiCreditCard, FiBookOpen, FiCalendar, FiMessageCircle, FiAlertCircle, FiFileText, FiLogOut } from 'react-icons/fi';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './SecretaireSidebar.css';
import './Header.css';

const navItems = [
  { path: '/secretaire/dashboard', label: 'Tableau de bord', icon: FiGrid },
  { path: '/secretaire/etudiants', label: 'Etudiants', icon: FiUsers },
  { path: '/secretaire/paiements', label: 'Paiements', icon: FiCreditCard },
  { path: '/secretaire/classes', label: 'Classes', icon: FiBookOpen },
  { path: '/secretaire/absences', label: 'Absences', icon: FiCalendar },
  { path: '/secretaire/annonces', label: 'Annonces', icon: FiMessageCircle },
  { path: '/secretaire/reclamations', label: 'Reclamations', icon: FiAlertCircle },
  { path: '/secretaire/demandes', label: 'Demandes', icon: FiFileText },
];

export default function SecretaireSidebar() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const role = String(user?.role || '').toLowerCase();
  const visibleNavItems = role === 'comptable'
    ? navItems.filter((item) => item.path === '/secretaire/dashboard' || item.path === '/secretaire/paiements')
    : navItems;

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

  const logoutModal = showLogoutModal && typeof document !== 'undefined'
    ? createPortal(
      <div className="header-logout-modal-backdrop">
        <div className="header-logout-modal-card" role="dialog" aria-modal="true" aria-label="Confirmation deconnexion">
          <h3>Deconnexion</h3>
          <p>Voulez-vous vraiment vous deconnecter ?</p>
          <div className="header-logout-modal-actions">
            <button
              type="button"
              className="header-logout-cancel"
              onClick={() => setShowLogoutModal(false)}
              disabled={isLoggingOut}
            >
              Annuler
            </button>
            <button
              type="button"
              className="header-logout-confirm"
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Deconnexion...' : 'Oui'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <>
      {logoutModal}

      <aside className="fixed bottom-0 left-0 top-16 z-[90] w-[260px] border-r border-slate-200 bg-white">
        <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
          <div className="mx-2 mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profil" className="h-11 w-11 rounded-full object-cover ring-2 ring-blue-100" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white ring-2 ring-blue-100">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-900">{user?.name || 'Secretaire'}</div>
                <span className="mt-1 inline-flex rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                  {user?.role || 'secretaire'}
                </span>
              </div>
            </div>
          </div>

          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Navigation</div>

          <nav className="flex flex-col gap-1 px-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        className={isActive ? 'text-blue-600' : 'text-slate-400 transition-colors group-hover:text-blue-600'}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
