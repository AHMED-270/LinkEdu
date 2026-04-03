import { useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
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
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profil" className="header-profile-avatar" />
            ) : (
              <div className="header-profile-avatar header-profile-avatar-fallback">
                {initials}
              </div>
            )}
          </div>
        </motion.button>
      </motion.div>
    </header>
  );
}

