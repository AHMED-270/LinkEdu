import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2 } from 'lucide-react';
import { BiImageAdd, BiNews, BiSearchAlt2 } from 'react-icons/bi';
import LinkEduPopup from './LinkEduPopup';
import './DirectoryAnnonces.css';

function normalizeCible(rawCible) {
  const value = String(rawCible || '').trim().toLowerCase();

  if (!value || value === 'tous') {
    return 'tous';
  }

  if (value.startsWith('professeur:') || value.startsWith('directeur:')) {
    return 'professeur';
  }

  if (value.startsWith('parent:')) {
    return 'parent';
  }

  if (value.startsWith('etudiant:')) {
    return 'etudiant';
  }

  if (value.startsWith('secretaire:')) {
    return 'secretaire';
  }

  if (['professeur', 'professeurs', 'directeur', 'directeurs'].includes(value)) {
    return 'professeur';
  }

  if (['parent', 'parents'].includes(value)) {
    return 'parent';
  }

  if (['etudiant', 'etudiants', 'eleve', 'eleves'].includes(value)) {
    return 'etudiant';
  }

  if (['secretaire', 'secretaire', 'secretaires', 'secretaires'].includes(value)) {
    return 'secretaire';
  }

  return 'tous';
}

function formatCibleLabel(cibleType) {
  if (cibleType === 'etudiant') return 'Etudiants';
  if (cibleType === 'professeur') return 'Professeurs';
  if (cibleType === 'parent') return 'Parents';
  if (cibleType === 'secretaire') return 'Secretaires';
  return 'Tous';
}

function DirectoryAnnonces() {
  const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000`;
  const token = localStorage.getItem('linkedu_token');

  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });
  const [searchTitle, setSearchTitle] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    cibleType: 'tous',
  });

  useEffect(() => {
    fetchAnnonces();
  }, []);

  const axiosAuthConfig = useMemo(() => ({
    withCredentials: true,
    withXSRFToken: true,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }), [token]);

  const fetchAnnonces = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const response = await axios.get(`${apiBaseUrl}/api/directeur/annonces`, axiosAuthConfig);
      const rawList = response.data?.annonces || [];

      const mapped = rawList.map((a) => {
        return {
          id: a.id_annonce,
          title: a.titre,
          content: a.contenu,
          cibleType: normalizeCible(a.cible),
          author: `${a.auteur_prenom || ''} ${a.auteur_nom || ''}`.trim() || 'Direction',
          date: new Date(a.date_publication || a.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          photoUrl: a.photo_url || '',
        };
      });

      setAnnonces(mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
      setAnnonces([]);
      setErrorMsg(error?.response?.data?.message || 'Erreur lors du chargement des annonces.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      cibleType: 'tous',
    });
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const handleEdit = (annonce) => {
    setEditingId(annonce.id);

    setFormData({
      title: annonce.title,
      content: annonce.content,
      cibleType: annonce.cibleType,
    });
    setPhotoFile(null);
    setPhotoPreview(annonce.photoUrl || '');
    setActionMsg({ type: '', text: '' });
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeletingId(deleteTargetId);

    try {
      await axios.delete(`${apiBaseUrl}/api/directeur/annonces/${deleteTargetId}`, axiosAuthConfig);
      await fetchAnnonces();

      if (String(editingId) === String(deleteTargetId)) {
        resetForm();
      }

      setActionMsg({ type: 'success', text: 'Annonce supprimee avec succes.' });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setActionMsg({ type: 'error', text: error?.response?.data?.message || 'Erreur lors de la suppression de l annonce.' });
    } finally {
      setDeletingId(null);
      setDeleteTargetId(null);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const filteredAnnonces = useMemo(() => {
    const term = searchTitle.trim().toLowerCase();
    if (!term) return annonces;

    return annonces.filter((annonce) => String(annonce.title || '').toLowerCase().includes(term));
  }, [annonces, searchTitle]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoFile(file);

    if (!file) {
      setPhotoPreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const payload = new FormData();
    payload.append('titre', formData.title);
    payload.append('contenu', formData.content);
    payload.append('cible', formData.cibleType);

    if (photoFile) {
      payload.append('photo', photoFile);
    }

    const formConfig = {
      ...axiosAuthConfig,
      headers: {
        ...axiosAuthConfig.headers,
        'Content-Type': 'multipart/form-data',
      },
    };

    try {
      if (editingId !== null) {
        payload.append('_method', 'PUT');
        await axios.post(`${apiBaseUrl}/api/directeur/annonces/${editingId}`, payload, formConfig);
      } else {
        await axios.post(`${apiBaseUrl}/api/directeur/annonces`, payload, formConfig);
      }

      await fetchAnnonces();
      setActionMsg({
        type: 'success',
        text: editingId !== null ? 'Annonce modifiee avec succes.' : 'Annonce ajoutee avec succes.',
      });
      resetForm();
    } catch (error) {
      console.error('Erreur lors de l enregistrement:', error);
      setActionMsg({ type: 'error', text: error?.response?.data?.message || 'Erreur lors de l enregistrement de l annonce.' });
    }
  };

  return (
    <div className="director-annonces-page">
      <div className="director-annonces-grid">
        <section className="director-annonces-table-card">
          <div className="director-annonces-card-header">
            <div className="annonces-header-main">
              <h1 className="annonces-title-with-icon">
                <BiNews />
                <span>Gestion des annonces</span>
              </h1>
              <p>Les annonces sont affichees dans un tableau. Utilisez le formulaire a droite pour ajouter ou modifier.</p>
            </div>
            <div className="annonces-search-wrap">
              <BiSearchAlt2 className="annonces-search-icon" />
              <input
                type="text"
                value={searchTitle}
                onChange={(event) => setSearchTitle(event.target.value)}
                placeholder="Rechercher une annonce par titre"
                className="annonces-search-input"
              />
            </div>
          </div>

          {errorMsg && <div className="annonce-feedback is-error">{errorMsg}</div>}
          {actionMsg.text && (
            <div className={`annonce-feedback ${actionMsg.type === 'error' ? 'is-error' : 'is-success'}`}>
              {actionMsg.text}
            </div>
          )}

          <div className="director-annonces-table-wrap">
            <table className="director-annonces-table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Date</th>
                  <th>Cible</th>
                  <th>Auteur</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="annonces-empty">Chargement des annonces...</td>
                  </tr>
                ) : filteredAnnonces.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="annonces-empty">Aucune annonce trouvee.</td>
                  </tr>
                ) : (
                  filteredAnnonces.map((annonce) => (
                    <tr key={annonce.id}>
                      <td>
                        <div className="annonce-title-cell">{annonce.title}</div>
                        <div className="annonce-content-preview">{annonce.content}</div>
                      </td>
                      <td>{annonce.date}</td>
                      <td>
                        <span className="annonce-target-chip">{formatCibleLabel(annonce.cibleType)}</span>
                      </td>
                      <td>{annonce.author}</td>
                      <td>
                        <div className="annonce-row-actions">
                          <button
                            className="btn-edit-annonce"
                            onClick={() => handleEdit(annonce)}
                            title="Modifier"
                            aria-label="Modifier"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-delete-annonce"
                            onClick={() => setDeleteTargetId(annonce.id)}
                            disabled={String(deletingId) === String(annonce.id)}
                            title="Supprimer"
                            aria-label="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="director-annonces-form-card">
          <h2>{editingId !== null ? 'Modifier une annonce' : 'Nouvelle annonce'}</h2>
          <form onSubmit={handleSave} className="director-annonce-form">
            <div className="annonce-form-group">
              <label>Titre</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required />
            </div>

            <div className="annonce-form-group">
              <label>Contenu</label>
              <textarea name="content" value={formData.content} onChange={handleChange} required rows="5"></textarea>
            </div>

            <div className="annonce-form-group">
              <label>Public cible</label>
              <select name="cibleType" value={formData.cibleType} onChange={handleChange}>
                <option value="tous">Tous</option>
                <option value="etudiant">Etudiant</option>
                <option value="professeur">Professeur</option>
                <option value="parent">Parent</option>
                <option value="secretaire">Secretaire</option>
              </select>
            </div>

            <div className="annonce-form-group">
              <label>Importer une image d annonce</label>
              <label className="annonce-photo-input">
                <BiImageAdd className="annonce-photo-icon" />
                <span>{photoFile ? photoFile.name : 'Choisir une image (JPG, PNG, WEBP)'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handlePhotoChange}
                />
              </label>

              {photoPreview && (
                <div className="annonce-photo-preview-wrap">
                  <img src={photoPreview} alt="Apercu annonce" className="annonce-photo-preview" />
                </div>
              )}
            </div>

            <div className="annonce-form-actions">
              {editingId !== null && (
                <button type="button" className="btn-cancel" onClick={resetForm}>Annuler</button>
              )}
              <button type="submit" className="btn-save">
                {editingId !== null ? 'Mettre a jour' : 'Envoyer l annonce'}
              </button>
            </div>
          </form>
        </aside>
      </div>

      <LinkEduPopup
        open={Boolean(deleteTargetId)}
        title="Confirmer la suppression"
        message="Etes-vous sur de vouloir supprimer cette annonce ?"
        tone="danger"
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        onConfirm={handleDelete}
        onClose={() => {
          if (!deletingId) setDeleteTargetId(null);
        }}
        loading={Boolean(deletingId)}
      />
    </div>
  );
}

export default DirectoryAnnonces;

