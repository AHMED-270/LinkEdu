import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  FiUser as User,
  FiMail as Mail,
  FiSave as Save,
  FiCamera as Camera,
  FiTrash2 as Trash2,
  FiLock as Lock,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Parametres.css';

const emptyPasswordForm = {
  current_password: '',
  password: '',
  password_confirmation: '',
};

export default function Parametres() {
  const { user, updateAuthenticatedUser } = useAuth();
  const fileInputRef = useRef(null);
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
  const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  const [profileForm, setProfileForm] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);

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

  const resolvePhotoUrl = (rawValue) => {
    const value = String(rawValue || '').trim();
    if (!value) return '';
    if (/^(https?:|data:image|blob:)/i.test(value)) return value;
    if (value.startsWith('//')) return `${window.location.protocol}${value}`;
    if (value.startsWith('/')) return `${apiOrigin}${value}`;
    return `${apiOrigin}/${value.replace(/^\.?\//, '')}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(apiBaseUrl + '/api/profile', {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' },
        });

        const profile = res.data || {};

        setProfileForm({
          nom: profile.nom || '',
          prenom: profile.prenom || '',
          email: profile.email || '',
        });
        setAvatarPreview(resolvePhotoUrl(profile.profile_photo_url || profile.profilePhoto || user?.profilePhoto || ''));
      } catch {
        setProfileError('Erreur lors du chargement du profil.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [apiBaseUrl, user?.profilePhoto]);

  const initials = `${profileForm.prenom || ''} ${profileForm.nom || ''}`.trim().charAt(0).toUpperCase() || 'P';

  const handlePasswordInputChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Veuillez choisir une image valide.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileError('La photo ne doit pas dépasser 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;

      setAvatarPreview(result);
      setAvatarFile(file);
      setRemovePhoto(false);
      setProfileError(null);
    };
    reader.readAsDataURL(file);

    event.target.value = '';
  };

  const handleRemovePhoto = () => {
    setAvatarPreview('');
    setAvatarFile(null);
    setRemovePhoto(true);
    setProfileMessage(null);
    setProfileError(null);
  };

  const handleSubmitProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });

      const payload = new FormData();

      if (avatarFile) {
        payload.append('profile_photo', avatarFile);
      }

      if (removePhoto) {
        payload.append('remove_profile_photo', '1');
      }

      const res = await axios.post(apiBaseUrl + '/api/profile', payload, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' },
      });

      const updated = res.data?.user || {};
      const nextProfilePhoto = resolvePhotoUrl(updated.profile_photo_url || updated.profilePhoto || null);

      updateAuthenticatedUser({
        profilePhoto: nextProfilePhoto,
      });

      setAvatarPreview(nextProfilePhoto || '');
      setAvatarFile(null);
      setRemovePhoto(false);
      setProfileMessage(res.data?.message || 'Photo de profil mise a jour avec succes.');
    } catch (submitError) {
      const backendErrors = submitError?.response?.data?.errors;
      if (backendErrors) {
        const firstError = Object.values(backendErrors)?.[0]?.[0];
        setProfileError(firstError || 'Erreur lors de la mise à jour du profil.');
      } else {
        setProfileError(submitError?.response?.data?.message || 'Erreur lors de la mise à jour du profil.');
      }
    } finally {
      setSavingProfile(false);
    }
  };

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
        <p>Gerez votre photo et votre mot de passe.</p>
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
                  )}
                </div>

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
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <User size={16} /> Nom
                </label>
                <input
                  type="text"
                  name="nom"
                  value={profileForm.nom}
                  readOnly
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500"
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
                  readOnly
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500"
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
              {savingProfile ? 'Enregistrement...' : 'Enregistrer la photo'}
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
                className="form-input"
                placeholder="Mot de passe actuel"
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
                  className="form-input"
                  placeholder="Nouveau mot de passe"
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
                  className="form-input"
                  placeholder="Confirmer le mot de passe"
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
    </div>
  );
}
