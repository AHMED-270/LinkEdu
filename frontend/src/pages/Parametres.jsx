import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { User, Mail, Save, Camera, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Parametres() {
  const { user, updateAuthenticatedUser } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePhoto || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(apiBaseUrl + '/api/user', {
          withCredentials: true,
          headers: { Accept: 'application/json' }
        });

        setFormData({
          name: res.data?.name || '',
          email: res.data?.email || '',
        });
        setAvatarPreview(user?.profilePhoto || '');
      } catch (fetchError) {
        setStatusMsg({ type: 'error', text: 'Erreur lors du chargement du profil.' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [apiBaseUrl, user?.profilePhoto]);

  const initials = (formData.name || user?.name || 'P').trim().charAt(0).toUpperCase();

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const showToast = (type, message) => {
    setStatusMsg({ type, text: message });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 3500);
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Veuillez sÃ©lectionner une image valide.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;

      setAvatarPreview(result);
      updateAuthenticatedUser({ profilePhoto: result });
      showToast('success', 'Photo de profil mise Ã  jour.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleRemovePhoto = () => {
    setAvatarPreview('');
    updateAuthenticatedUser({ profilePhoto: null });
    showToast('success', 'Photo de profil supprimÃ©e.');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await axios.put(apiBaseUrl + '/api/professeur/profile', formData, {
        withCredentials: true,
        headers: { Accept: 'application/json' },
      });

      updateAuthenticatedUser({ name: formData.name, email: formData.email });
      showToast('success', res.data?.message || 'Profil mis Ã  jour avec succÃ¨s.');
    } catch (submitError) {
      showToast('error', submitError?.response?.data?.message || 'Erreur lors de la mise Ã  jour du profil.');
    } finally {
      setSaving(false);
    }
  };
  
  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="layout-content relative">
      {/* Floating Success/Error Toast */}
      <AnimatePresence>
        {statusMsg.text && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-4 py-3 bg-white border rounded-xl shadow-lg ${
              statusMsg.type === 'error' ? 'border-red-100' : 'border-emerald-100'
            }`}
          >
            {statusMsg.type === 'error' ? (
              <AlertCircle size={20} className="text-red-500" />
            ) : (
              <CheckCircle2 size={20} className="text-emerald-500" />
            )}
            <span className="text-sm font-bold text-slate-700">{statusMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Mon Profil</h1>
          <p className="text-slate-500 text-sm mt-1">GÃ©rez vos informations personnelles de professeur.</p>
        </div>
      </header>

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
                    <img src={avatarPreview} alt="Profil professeur" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-extrabold text-slate-400">{initials}</span>
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
                    Choisir une photo
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </motion.label>
                  
                  {avatarPreview && (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button" 
                      onClick={handleRemovePhoto} 
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
                  <User size={16} className="text-slate-400" /> Nom / PrÃ©nom
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

            {/* Submit Action */}
            <motion.div variants={itemVariants} className="pt-4 border-t border-slate-100 mt-2">
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
                  <><Save size={18} className="mr-2"/> Enregistrer les modifications</>
                )}
              </motion.button>
            </motion.div>

          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
