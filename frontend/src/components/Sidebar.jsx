import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiCalendar, FiUsers, FiStar, FiFileText, FiMessageCircle, FiSettings, FiLogOut } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Tableau de bord', icon: FiGrid },
  { path: '/emploi-du-temps', label: 'Emploi du temps', icon: FiCalendar },
  { path: '/mes-classes', label: 'Mes Classes', icon: FiUsers },
  { path: '/notes', label: 'Notes', icon: FiStar },
  { path: '/appel', label: 'Absences', icon: FiCalendar },
  { path: '/devoirs', label: 'Devoirs & Ressources', icon: FiFileText },
  { path: '/annonces', label: 'Annonces', icon: FiMessageCircle },
  { path: '/parametres', label: 'Paramètres', icon: FiSettings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const initials = (user?.name || 'P').trim().charAt(0).toUpperCase();

  const handleLogoutConfirm = async () => {
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
  };

  // Staggered animation variants for the nav links
  const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05 + 0.3, type: 'spring', stiffness: 100 }
    })
  };

  return (
    <>
      {/* Animated Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="logout-modal-backdrop"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
              className="logout-modal-card card"
            >
              <div className="logout-modal-icon">
                <FiLogOut size={36} color="#EF4444" />
              </div>
              <h3>Êtes-vous sûr de vouloir vous déconnecter ?</h3>
              <p>Vous devrez saisir à nouveau vos identifiants pour revenir sur l'espace LinkEdu.</p>
              <div className="logout-modal-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleLogoutConfirm}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Déconnexion...' : 'Oui, me déconnecter'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="sidebar">
        {/* User Profile Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="sidebar-profile"
        >
          <div className="sidebar-avatar-wrapper">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profil" className="sidebar-avatar" />
            ) : (
              <div className="sidebar-avatar sidebar-avatar-fallback">{initials}</div>
            )}
            <div className="online-indicator"></div>
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-name">{user?.name || 'Utilisateur'}</span>
            <span className="sidebar-role badge badge-blue">{user?.role || 'Membre'}</span>
          </div>
        </motion.div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.path}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={navItemVariants}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={20} className="sidebar-icon" />
                  <span className="sidebar-link-text">{item.label}</span>
                  {/* Subtle active indicator dot */}
                  <div className="active-dot"></div>
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="sidebar-footer"
        >
          <button 
            type="button" 
            className="sidebar-logout" 
            onClick={() => setShowLogoutModal(true)}
          >
            <FiLogOut size={20} className="sidebar-icon" />
            <span>Se déconnecter</span>
          </button>
        </motion.div>
      </aside>
    </>
  );
}

