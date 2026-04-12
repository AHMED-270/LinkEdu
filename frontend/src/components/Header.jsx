<<<<<<<<< Temporary merge branch 1
﻿import { useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
=========
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut } from 'react-icons/fi';
import axios from 'axios';
>>>>>>>>> Temporary merge branch 2
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
<<<<<<<<< Temporary merge branch 1
  const { user } = useAuth();
  const initials = (user?.name || 'P').trim().charAt(0).toUpperCase();
  
  // Example state for notifications - makes the UI feel alive!
  const [hasNotifications] = useState(true);

  return (
    <header className="header">
      {/* Logo Area */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="header-logo"
      >
        {/* Added the graduation cap from the login page for consistency */}
        <span className="logo-icon-small">🎓</span>
        <span className="logo-link">Linked</span>
        <span className="logo-edu">U</span>
      </motion.div>

      {/* Actions Area */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, type: 'spring', delay: 0.1 }}
        className="header-actions"
      >
        {/* Notification Bell with "Ring" animation on hover */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="icon-btn"
        >
          <motion.div
            whileHover={{ rotate: [0, -15, 15, -15, 15, 0], transition: { duration: 0.5 } }}
            style={{ originX: 0.5, originY: 0 }}
          >
            <FiBell size={22} />
          </motion.div>
          {hasNotifications && <span className="notification-dot"></span>}
        </motion.button>

        {/* Profile Button */}
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="header-profile" 
          onClick={() => navigate('/profil')} 
          title="Profil"
        >
          <div className="header-profile-info">
            <span className="header-profile-name">{user?.name || 'Professeur'}</span>
            <span className="header-profile-role">{user?.role || 'Professeur'}</span>
          </div>
          
          <div className="header-avatar-wrapper">
=========
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const isSecretaire = String(user?.role || '').toLowerCase() === 'secretaire';
  const profileRoute = isSecretaire ? '/secretaire/profil' : '/profil';

  const handleLogoutConfirm = async () => {
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
  };

  return (
    <>
      {showLogoutAlert && (
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
        </div>
      )}

      <header className="header">
        <div className="header-logo">
          <span className="logo-link">Linked</span><span className="logo-edu">U</span>
        </div>

        <div className="header-actions">
          <button className="header-profile" onClick={() => navigate(profileRoute)} title="Paramètres du profil" aria-label="Ouvrir les paramètres du profil">
>>>>>>>>> Temporary merge branch 2
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profil" className="header-profile-avatar" />
            ) : (
              <div className="header-profile-avatar header-profile-avatar-fallback">
<<<<<<<<< Temporary merge branch 1
                {initials}
              </div>
            )}
          </div>
        </motion.button>
      </motion.div>
    </header>
=========
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
>>>>>>>>> Temporary merge branch 2
  );
}
