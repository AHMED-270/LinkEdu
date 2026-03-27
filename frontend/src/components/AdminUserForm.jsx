import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FiArrowLeft as ArrowLeft } from 'react-icons/fi';

export default function AdminUserForm({ mode = 'create', userToEdit = null, onBack, onSuccess, isModal = false }) {
  const isEditing = mode === 'edit' && !!userToEdit;

  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [loadWarning, setLoadWarning] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'etudiant',
    id_classe: '',
    id_parent: '',
    telephone: ''
  });

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  const parentUsers = useMemo(() => users.filter((u) => u.role === 'parent'), [users]);
  const selectedParent = parentUsers.find((p) => String(p.id) === String(formData.id_parent));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadWarning('');

        const [usersResult, classesResult] = await Promise.allSettled([
          axios.get(apiBaseUrl + '/api/admin/users', {
            withCredentials: true,
            headers: { Accept: 'application/json' }
          }),
          axios.get(apiBaseUrl + '/api/admin/classes', {
            withCredentials: true,
            headers: { Accept: 'application/json' }
          })
        ]);

        const usersData = usersResult.status === 'fulfilled' ? (usersResult.value.data || []) : [];
        const classesData = classesResult.status === 'fulfilled' ? (classesResult.value.data || []) : [];

        setUsers(usersData);
        setClasses(classesData);

        if (usersResult.status === 'rejected' || classesResult.status === 'rejected') {
          setLoadWarning('Certaines donnees du formulaire n\'ont pas pu etre chargees. Vous pouvez quand meme continuer.');
        }

        if (isEditing) {
          setFormData({
            name: userToEdit.name || '',
            email: userToEdit.email || '',
            password: '',
            role: userToEdit.role || 'etudiant',
            id_classe: userToEdit.id_classe || (classesData[0]?.id_classe ?? ''),
            id_parent: userToEdit.id_parent || '',
            telephone: userToEdit.telephone || ''
          });
        } else {
          const firstParent = usersData.find((u) => u.role === 'parent');
          setFormData((prev) => ({
            ...prev,
            id_classe: classesData[0]?.id_classe ?? '',
            id_parent: firstParent?.id ?? ''
          }));
        }
      } catch (error) {
        console.error('Erreur fetch:', error);
        setLoadWarning('Certaines donnees du formulaire n\'ont pas pu etre chargees. Vous pouvez quand meme continuer.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiBaseUrl, isEditing, userToEdit]);

  const ensureCsrfCookie = async () => {
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      await ensureCsrfCookie();

      if (isEditing) {
        await axios.put(`${apiBaseUrl}/api/admin/users/${userToEdit.id}`, formData, {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' }
        });
      } else {
        await axios.post(`${apiBaseUrl}/api/admin/users`, formData, {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' }
        });
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setFormError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const roles = [
    { value: 'etudiant', label: 'Etudiant' },
    { value: 'professeur', label: 'Professeur' },
    { value: 'parent', label: 'Parent' },
    { value: 'secretaire', label: 'Secretariat' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'directeur', label: 'Directeur' }
  ];

  if (loading) {
    return (
      <div className={isModal ? '' : 'dashboard-content'}>
        <p>Chargement du formulaire...</p>
      </div>
    );
  }

  return (
    <div className={isModal ? '' : 'dashboard-content'}>
      {!isModal && (
        <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>{isEditing ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}</h1>
            <p>Formulaire dedie pour ajouter ou modifier un utilisateur.</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
          >
            <ArrowLeft size={16} />
            Retour a la gestion
          </button>
        </header>
      )}

      <div className="card-panel" style={{ marginBottom: '20px' }}>
        {isModal && <h2 style={{ marginTop: 0 }}>{isEditing ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}</h2>}
        {loadWarning && (
          <p style={{ color: '#b45309', marginBottom: '10px' }}>{loadWarning}</p>
        )}
        {formError && <p style={{ color: 'red', marginBottom: '10px' }}>{formError}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nom complet</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Mot de passe {isEditing && '(Laisser vide pour ne pas modifier)'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!isEditing}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.role === 'etudiant' && (
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Classe de l'etudiant</label>
                <select
                  name="id_classe"
                  value={formData.id_classe}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">-- Selectionner une classe --</option>
                  {classes.map((c) => (
                    <option key={c.id_classe} value={c.id_classe}>{c.nom} ({c.niveau})</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Parent de l'etudiant</label>
                <select
                  name="id_parent"
                  value={formData.id_parent}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">-- Selectionner un parent --</option>
                  {parentUsers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.telephone ? `(${p.telephone})` : ''}
                    </option>
                  ))}
                </select>
                <small style={{ display: 'block', marginTop: '6px', color: '#64748b' }}>
                  Telephone du parent: {selectedParent?.telephone || 'Non renseigne'}
                </small>
              </div>
            </div>
          )}

          {(formData.role === 'parent' || formData.role === 'directeur' || formData.role === 'professeur') && (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                {formData.role === 'directeur'
                  ? 'Telephone du directeur'
                  : formData.role === 'professeur'
                    ? 'Telephone du professeur'
                    : 'Telephone du parent'}
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                required
                placeholder="Ex: 0612345678"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onBack}
              disabled={saving}
              style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
