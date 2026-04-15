import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut } from 'react-icons/fi';
import axios from 'axios';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const role = String(user?.role || '').toLowerCase();
  const isFinancePortalRole = role === 'secretaire' || role === 'comptable';
  const profileRoute = isFinancePortalRole ? '/secretaire/profil' : '/profil';

  const logoutModal = showLogoutAlert && typeof document !== 'undefined'
    ? createPortal(
      <div className="header-logout-modal-backdrop">
        <div className="header-logout-modal-card" role="dialog" aria-modal="true" aria-label="Confirmation deconnexion">
          <h3>Deconnexion</h3>
          {isLoggingOut ? (
            <div className="header-logout-skeleton-wrap" aria-hidden="true">
              <div className="header-logout-skeleton-line" />
              <div className="header-logout-skeleton-line short" />
            </div>
          ) : (
            <p>Voulez-vous vraiment vous deconnecter ?</p>
          )}
          <div className="header-logout-modal-actions">
            <button
              type="button"
              className="header-logout-cancel"
              onClick={() => setShowLogoutAlert(false)}
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
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

      // Keep a short loading state visible before redirecting.
      await new Promise((resolve) => setTimeout(resolve, 500));

      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });

      await axios.post(apiBaseUrl + '/api/admin/logout', {}, {
        withCredentials: true,
        withXSRFToken: true,
        headers: {
          Accept: 'application/json',
        },
      });
    } catch {
      // Continue local logout even if API request fails.
    } finally {
      logout();
      setIsLoggingOut(false);
      setShowLogoutAlert(false);
      navigate('/login', { replace: true });
    }
  }

  return (
    <>
      {logoutModal}

      <header className="header">
        <div className="header-logo">
          <span className="logo-link">Linked</span><span className="logo-edu">U</span>
        </div>

        <div className="header-actions">
          <button className="header-profile" onClick={() => navigate(profileRoute)} title="Paramètres du profil" aria-label="Ouvrir les paramètres du profil">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profil" className="header-profile-avatar" />
            ) : (
              <div className="header-profile-avatar header-profile-avatar-fallback">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <span className="header-profile-label">Profil</span>
          </button>

          <button
            type="button"
            className="header-logout-icon"
            onClick={() => setShowLogoutAlert(true)}
            disabled={isLoggingOut}
            aria-label="Se deconnecter"
            title="Se deconnecter"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </header>
    </>
  );
}
