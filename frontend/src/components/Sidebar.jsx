import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiCalendar, FiUsers, FiStar, FiFileText, FiMessageCircle, FiLogOut, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';
import './Header.css';

const navItems = [
  { path: '/dashboard', label: 'Tableau de bord', icon: FiGrid },
  { path: '/emploi-du-temps', label: 'Emploi du temps', icon: FiCalendar },
  { path: '/mes-classes', label: 'Mes Classes', icon: FiUsers },
  { path: '/notes-absences', label: 'Notes', icon: FiStar },
  { path: '/appel', label: 'Absences', icon: FiCalendar },
  { path: '/devoirs', label: 'Devoirs & Ressources', icon: FiFileText },
  { path: '/reclamation', label: 'Réclamations', icon: FiAlertCircle },
  { path: '/annonces', label: 'Annonces', icon: FiMessageCircle },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const initials = (user?.name || 'P').trim().charAt(0).toUpperCase();

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

  async function handleLogoutConfirm() {
    setIsLoggingOut(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });

      await axios.post(apiBaseUrl + '/api/admin/logout', {}, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' }
      });
    } catch (error) {
      // Always continue with local logout even if API logout fails.
    } finally {
      logout();
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      navigate('/login', { replace: true });
    }
  }

  return (
    <>
      {logoutModal}

      <aside className="h-full w-full border-r border-slate-200 bg-white">
        <div className="flex h-full flex-col px-3 py-4">
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
                <div className="truncate text-sm font-bold text-slate-900">{user?.name || 'Professeur'}</div>
                <span className="mt-1 inline-flex rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                  {user?.role || 'professeur'}
                </span>
              </div>
            </div>
          </div>

          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Navigation</div>

          <nav className="flex flex-col gap-1 px-2">
            {navItems.map((item) => {
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

          <div className="mt-auto px-2 pt-4">
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
            >
              <FiLogOut size={16} />
              <span>Se deconnecter</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

