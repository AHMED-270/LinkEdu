import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiArrowLeft as ArrowLeft } from 'react-icons/fi';

export default function AdminClassForm({ mode = 'create', classToEdit = null, onBack, onSuccess, isModal = false }) {
  const isEditing = mode === 'edit' && !!classToEdit;
  const [professeurs, setProfesseurs] = useState([]);

  const [formData, setFormData] = useState({
    nom: '',
    niveau: '',
    professeur_ids: []
  });
  const [formMsg, setFormMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  useEffect(() => {
    const fetchProfesseurs = async () => {
      try {
        const response = await axios.get(apiBaseUrl + '/api/admin/users', {
          withCredentials: true,
          headers: { Accept: 'application/json' }
        });

        const profs = (response.data || []).filter((u) => u.role === 'professeur');
        setProfesseurs(profs);

        if (isEditing) {
          setFormData({
            nom: classToEdit.nom || '',
            niveau: classToEdit.niveau || '',
            professeur_ids: Array.isArray(classToEdit.professeurs_ids)
              ? classToEdit.professeurs_ids.map((id) => String(id))
              : []
          });
        } else {
          setFormData({
            nom: '',
            niveau: '',
            professeur_ids: []
          });
        }
      } catch (error) {
        setFormMsg('Impossible de charger la liste des professeurs.');
      }
    };

    fetchProfesseurs();
  }, [apiBaseUrl, isEditing, classToEdit]);

  const ensureCsrfCookie = async () => {
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMsg('');
    setSaving(true);

    if (!formData.professeur_ids || formData.professeur_ids.length === 0) {
      setFormMsg('Veuillez selectionner au moins un professeur.');
      setSaving(false);
      return;
    }

    const payload = {
      nom: formData.nom,
      niveau: formData.niveau,
      professeur_ids: formData.professeur_ids.map((id) => Number(id))
    };

    try {
      await ensureCsrfCookie();

      if (isEditing) {
        await axios.put(`${apiBaseUrl}/api/admin/classes/${classToEdit.id_classe}`, payload, {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' }
        });
      } else {
        await axios.post(apiBaseUrl + '/api/admin/classes', payload, {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' }
        });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      setFormMsg(error.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={isModal ? '' : 'dashboard-content'}>
      {!isModal && (
        <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>{isEditing ? 'Modifier Classe' : 'Nouvelle Classe'}</h1>
            <p>Page dediee pour l'ajout et la modification des classes.</p>
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
        {isModal && <h2 style={{ marginTop: 0 }}>{isEditing ? 'Modifier Classe' : 'Nouvelle Classe'}</h2>}
        {formMsg && <p style={{ color: 'red', marginBottom: '10px' }}>{formMsg}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nom de la classe</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Niveau</label>
              <input
                type="text"
                value={formData.niveau}
                onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Nombre professeurs: {formData.professeur_ids.length}
            </label>
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', maxHeight: '220px', overflowY: 'auto' }}>
              {professeurs.length === 0 && (
                <p style={{ margin: 0, color: '#64748b' }}>Aucun professeur disponible.</p>
              )}
              {professeurs.map((p) => {
                const checked = formData.professeur_ids.includes(String(p.id));

                return (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData((prev) => ({
                            ...prev,
                            professeur_ids: [...prev.professeur_ids, String(p.id)]
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            professeur_ids: prev.professeur_ids.filter((id) => id !== String(p.id))
                          }));
                        }
                      }}
                    />
                    <span>{p.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

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
