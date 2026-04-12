import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUser as User, FiMail as Mail, FiLock as Lock, FiSave as Save, FiCamera as Camera, FiTrash2 as Trash2 } from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';
import { useAuth } from '../context/AuthContext';

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
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
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
      setError('Veuillez choisir une image valide.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('La photo ne doit pas depasser 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        setError('Impossible de lire la photo selectionnee.');
        return;
      }

      localStorage.setItem(ADMIN_AVATAR_STORAGE_KEY, result);
      setAvatarPreview(result);
      updateAuthenticatedUser({ profilePhoto: result });
      setError(null);
      setMessage('Photo de profil mise a jour.');
      notifyAvatarUpdate();
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    localStorage.removeItem(ADMIN_AVATAR_STORAGE_KEY);
    setAvatarPreview('');
    updateAuthenticatedUser({ profilePhoto: null });
    setError(null);
    setMessage('Photo de profil supprimee.');
    notifyAvatarUpdate();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
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
      setMessage(res.data.message);
      setFormData(prev => ({ ...prev, password: '' })); // clear password field
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-content">
      <header className="content-header">
        <h1 className="mt-1 flex items-center gap-2 text-4xl lg:text-5xl font-extrabold italic tracking-tight text-slate-900">
          <BiSolidUserDetail className="text-blue-600" />
          Mon Profil
        </h1>
        <p>Gérez vos informations personnelles et votre mot de passe.</p>
      </header>

      <div className="card-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {message && <div style={{ padding: '10px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px' }}>{message}</div>}
            {error && <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#9f1239', borderRadius: '8px' }}>{error}</div>}

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: '500', color: '#475569' }}>
                <Camera size={18} /> Photo de Profil
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ width: '84px', height: '84px', borderRadius: '9999px', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profil admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={32} color="#64748b" />
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <label style={{ padding: '9px 12px', borderRadius: '8px', background: '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>
                    Choisir une photo
                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                  </label>
                  {avatarPreview && (
                    <button type="button" onClick={removeAvatar} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Trash2 size={16} /> Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                <User size={18} /> Nom / Prénom
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                <Mail size={18} /> Adresse Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              />
            </div>

            <div style={{ paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                <Lock size={18} /> Nouveau Mot de Passe
              </label>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px' }}>Laissez vide si vous ne souhaitez pas le changer.</p>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Nouveau mot de passe"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                marginTop: '15px', 
                padding: '12px', 
                background: '#3b82f6', 
                color: 'white', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: saving ? 'not-allowed' : 'pointer', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '1rem',
                opacity: saving ? 0.7 : 1
              }}
            >
              <Save size={20} />
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
