import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
<<<<<<<<< Temporary merge branch 1
import { User, Mail, Save, Camera, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
=========
import {
  FiUser as User,
  FiMail as Mail,
  FiSave as Save,
  FiCamera as Camera,
  FiTrash2 as Trash2,
  FiLock as Lock,
} from 'react-icons/fi';
>>>>>>>>> Temporary merge branch 2
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const emptyPasswordForm = {
  current_password: '',
  password: '',
  password_confirmation: '',
};

export default function Parametres() {
  const { user, updateAuthenticatedUser } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
<<<<<<<<< Temporary merge branch 1
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePhoto || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
=========
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
>>>>>>>>> Temporary merge branch 2

  const [avatarPreview, setAvatarPreview] = useState(user?.profilePhoto || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

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
<<<<<<<<< Temporary merge branch 1
        setAvatarPreview(user?.profilePhoto || '');
      } catch (fetchError) {
        setStatusMsg({ type: 'error', text: 'Erreur lors du chargement du profil.' });
=========
        setAvatarPreview(profile.profile_photo_url || profile.profilePhoto || user?.profilePhoto || '');
      } catch {
        setProfileError('Erreur lors du chargement du profil.');
>>>>>>>>> Temporary merge branch 2
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

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
<<<<<<<<< Temporary merge branch 1
      showToast('error', 'Veuillez sélectionner une image valide.');
=========
      setProfileError('Veuillez choisir une image valide.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileError('La photo ne doit pas dépasser 2 MB.');
>>>>>>>>> Temporary merge branch 2
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;

      setAvatarPreview(result);
<<<<<<<<< Temporary merge branch 1
      updateAuthenticatedUser({ profilePhoto: result });
      showToast('success', 'Photo de profil mise à jour.');
    };
    reader.readAsDataURL(file);
=========
      setAvatarFile(file);
      setRemovePhoto(false);
      setProfileError(null);
    };
    reader.readAsDataURL(file);

>>>>>>>>> Temporary merge branch 2
    event.target.value = '';
  };

  const handleRemovePhoto = () => {
    setAvatarPreview('');
<<<<<<<<< Temporary merge branch 1
    updateAuthenticatedUser({ profilePhoto: null });
    showToast('success', 'Photo de profil supprimée.');
=========
    setAvatarFile(null);
    setRemovePhoto(true);
    setProfileMessage(null);
    setProfileError(null);
>>>>>>>>> Temporary merge branch 2
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
<<<<<<<<< Temporary merge branch 1
    setSaving(true);
    setStatusMsg({ type: '', text: '' });
=========
    setSavingProfile(true);
    setProfileMessage(null);
    setProfileError(null);
>>>>>>>>> Temporary merge branch 2

    try {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });

      const payload = new FormData();
      payload.append('nom', profileForm.nom);
      payload.append('prenom', profileForm.prenom);

      if (avatarFile) {
        payload.append('profile_photo', avatarFile);
      }

      if (removePhoto) {
        payload.append('remove_profile_photo', '1');
      }

      const res = await axios.post(apiBaseUrl + '/api/profile', payload, {
        withCredentials: true,
        headers: { Accept: 'application/json' },
      });

<<<<<<<<< Temporary merge branch 1
      updateAuthenticatedUser({ name: formData.name, email: formData.email });
      showToast('success', res.data?.message || 'Profil mis à jour avec succès.');
    } catch (submitError) {
      showToast('error', submitError?.response?.data?.message || 'Erreur lors de la mise à jour du profil.');
=========
      const updated = res.data?.user || {};
      const nextProfilePhoto = updated.profile_photo_url || updated.profilePhoto || null;

      updateAuthenticatedUser({
        name: updated.name || `${profileForm.prenom} ${profileForm.nom}`.trim(),
        nom: updated.nom || profileForm.nom,
        prenom: updated.prenom || profileForm.prenom,
        email: updated.email || profileForm.email,
        profilePhoto: nextProfilePhoto,
      });

      setAvatarPreview(nextProfilePhoto || '');
      setAvatarFile(null);
      setRemovePhoto(false);
      setProfileMessage(res.data?.message || 'Profil mis à jour avec succès.');
    } catch (submitError) {
      const backendErrors = submitError?.response?.data?.errors;
      if (backendErrors) {
        const firstError = Object.values(backendErrors)?.[0]?.[0];
        setProfileError(firstError || 'Erreur lors de la mise à jour du profil.');
      } else {
        setProfileError(submitError?.response?.data?.message || 'Erreur lors de la mise à jour du profil.');
      }
>>>>>>>>> Temporary merge branch 2
    } finally {
      setSaving(false);
    }
  };
<<<<<<<<< Temporary merge branch 1
  
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
          <p className="text-slate-500 text-sm mt-1">Gérez vos informations personnelles de professeur.</p>
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
=========

  const handleSubmitPassword = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordMessage(null);
    setPasswordError(null);

    try {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });

      const res = await axios.put(apiBaseUrl + '/api/profile/password', passwordForm, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' },
      });

      setPasswordForm(emptyPasswordForm);
      setPasswordMessage(res.data?.message || 'Mot de passe mis à jour avec succès.');
    } catch (submitError) {
      const backendErrors = submitError?.response?.data?.errors;
      if (backendErrors) {
        const firstError = Object.values(backendErrors)?.[0]?.[0];
        setPasswordError(firstError || 'Erreur lors du changement de mot de passe.');
      } else {
        setPasswordError(submitError?.response?.data?.message || 'Erreur lors du changement de mot de passe.');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="dashboard-content">
      <header className="content-header">
        <h1>Mon Profil</h1>
        <p>Gérez votre photo, votre nom et votre mot de passe.</p>
      </header>

      {loading ? (
        <div className="card-panel" style={{ maxWidth: '1150px', margin: '0 auto', padding: '30px' }}>Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" style={{ maxWidth: '1150px', margin: '0 auto' }}>
          <form onSubmit={handleSubmitProfile} className="card-panel p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Informations personnelles</h2>

            {profileMessage && <div className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-700">{profileMessage}</div>}
            {profileError && <div className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{profileError}</div>}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Camera size={16} /> Photo de profil
              </label>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profil" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-slate-600">{initials}</span>
>>>>>>>>> Temporary merge branch 2
                  )}
                  {/* Subtle hover overlay to hint at clicking */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </motion.div>

<<<<<<<<< Temporary merge branch 1
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
=========
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    Choisir une photo
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
>>>>>>>>> Temporary merge branch 2
                  )}
                </div>
              </div>
            </div>

<<<<<<<<< Temporary merge branch 1
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
=========
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <User size={16} /> Nom
                </label>
                <input
                  type="text"
                  name="nom"
                  value={profileForm.nom}
                  onChange={handleProfileInputChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <User size={16} /> Prénom
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={profileForm.prenom}
                  onChange={handleProfileInputChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Mail size={16} /> Adresse email 
              </label>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                readOnly
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {savingProfile ? 'Enregistrement...' : 'Enregistrer le profil'}
            </button>
          </form>

          <form onSubmit={handleSubmitPassword} className="card-panel p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Changer le mot de passe</h2>

            {passwordMessage && <div className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-700">{passwordMessage}</div>}
            {passwordError && <div className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{passwordError}</div>}

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Lock size={16} /> Mot de passe actuel
              </label>
              <input
                type="password"
                name="current_password"
                value={passwordForm.current_password}
                onChange={handlePasswordInputChange}
                required
                  className="w-full rounded-lg border-2 border-slate-400 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Lock size={16} /> Nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="password"
                  value={passwordForm.password}
                  onChange={handlePasswordInputChange}
                  required
                  className="w-full rounded-lg border-2 border-slate-400 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Lock size={16} /> Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={passwordForm.password_confirmation}
                  onChange={handlePasswordInputChange}
                  required
                  className="w-full rounded-lg border-2 border-slate-400 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Lock size={16} />
              {savingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        </div>
      )}
>>>>>>>>> Temporary merge branch 2
    </div>
  );
}
