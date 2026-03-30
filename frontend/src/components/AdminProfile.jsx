import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Lock, Save, Camera, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_AVATAR_STORAGE_KEY = 'linkedu_admin_avatar';

export default function AdminProfile() {
  const { user, updateAuthenticatedUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [avatarPreview, setAvatarPreview] = useState('');

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(apiBaseUrl + '/api/user', {
          withCredentials: true,
          headers: { Accept: 'application/json' }
        });
        setFormData({
          name: res.data.name,
          email: res.data.email,
          password: ''
        });
        setAvatarPreview(user?.profilePhoto || localStorage.getItem(ADMIN_AVATAR_STORAGE_KEY) || '');
      } catch (err) {
        console.error('Erreur profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [apiBaseUrl, user?.profilePhoto]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const notifyAvatarUpdate = () => {
    window.dispatchEvent(new Event('admin-avatar-updated'));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'Veuillez choisir une image valide.' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatusMsg({ type: 'error', text: 'La photo ne doit pas dépasser 2 MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        setStatusMsg({ type: 'error', text: 'Impossible de lire la photo sélectionnée.' });
        return;
      }

      localStorage.setItem(ADMIN_AVATAR_STORAGE_KEY, result);
      setAvatarPreview(result);
      updateAuthenticatedUser({ profilePhoto: result });
      setStatusMsg({ type: 'success', text: 'Photo de profil mise à jour avec succès.' });
      notifyAvatarUpdate();
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    localStorage.removeItem(ADMIN_AVATAR_STORAGE_KEY);
    setAvatarPreview('');
    updateAuthenticatedUser({ profilePhoto: null });
    setStatusMsg({ type: 'success', text: 'Photo de profil supprimée.' });
    notifyAvatarUpdate();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: '', text: '' });
    
    try {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });

      const res = await axios.put(apiBaseUrl + '/api/admin/profile', formData, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' }
      });
      
      updateAuthenticatedUser({ name: formData.name, email: formData.email });
      setStatusMsg({ type: 'success', text: res.data.message || 'Profil mis à jour.' });
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (err) {
      setStatusMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Erreur lors de la mise à jour du profil.' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="layout-content">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Mon Profil</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos informations personnelles et votre sécurité.</p>
        </div>
      </header>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
        className="card p-8 max-w-2xl mx-auto"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="loading-spinner border-blue-500 mb-4"></span>
            <p className="text-slate-500 font-medium">Chargement du profil...</p>
          </div>
        ) : (
          <motion.form 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit} 
            className="flex flex-col gap-6"
          >
            {/* Animated Status Message */}
            <AnimatePresence>
              {statusMsg.text && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`p-4 rounded-xl flex items-center gap-3 font-medium text-sm border mb-2 ${
                    statusMsg.type === 'error' 
                      ? 'bg-red-50 text-red-600 border-red-100' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                    {statusMsg.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                    {statusMsg.text}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Avatar Section */}
            <motion.div variants={itemVariants} className="p-6 border border-slate-100 rounded-2xl bg-slate-50">
              <label className="flex items-center gap-2 mb-4 font-semibold text-slate-700">
                <Camera size={18} className="text-slate-400" /> Photo de Profil
              </label>
              
              <div className="flex items-center gap-6 flex-wrap">
                {/* Avatar Preview */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-24 h-24 rounded-full overflow-hidden bg-white border-4 border-white shadow-md flex items-center justify-center flex-shrink-0 relative group"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profil admin" className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} className="text-slate-300" />
                  )}
                  {/* Subtle hover overlay to hint at clicking */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </motion.div>

                {/* Avatar Actions */}
                <div className="flex gap-3 flex-wrap">
                  <motion.label 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn btn-primary cursor-pointer shadow-sm"
                  >
                    Changer de photo
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </motion.label>
                  
                  {avatarPreview && (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button" 
                      onClick={removeAvatar} 
                      className="btn btn-outline text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                    >
                      <Trash2 size={16} /> Supprimer
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
            
            {/* Identity Fields */}
            <div className="grid-2">
              <motion.div variants={itemVariants} className="form-group">
                <label className="form-label flex items-center gap-2">
                  <User size={16} className="text-slate-400" /> Nom Complet
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="form-group">
                <label className="form-label flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" /> Adresse Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </motion.div>
            </div>

            {/* Security Section */}
            <motion.div variants={itemVariants} className="form-group pt-6 border-t border-slate-100 mt-2">
              <label className="form-label flex items-center gap-2">
                <Lock size={16} className="text-slate-400" /> Nouveau Mot de Passe
              </label>
              <p className="text-xs text-slate-500 mb-3">Laissez vide si vous ne souhaitez pas le changer.</p>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="form-input w-full md:w-1/2"
              />
            </motion.div>

            {/* Submit Action */}
            <motion.div variants={itemVariants} className="pt-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={saving}
                className="btn btn-primary w-full md:w-auto px-8 py-3 text-base shadow-[0_4px_14px_rgba(59,130,246,0.3)]"
              >
                {saving ? (
                  <><span className="loading-spinner w-5 h-5 border-white mr-2"></span> Enregistrement...</>
                ) : (
                  <><Save size={18} /> Enregistrer les modifications</>
                )}
              </motion.button>
            </motion.div>

          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
