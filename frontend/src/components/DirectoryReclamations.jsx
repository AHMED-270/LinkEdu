import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2 } from 'lucide-react';
import { BiMessageSquareDetail, BiSearchAlt2 } from 'react-icons/bi';
import './DirectoryReclamations.css';

const defaultClaimForm = {
  sujet: '',
  description: '',
  cible: 'parent',
  etudiant_nom: '',
  professeur_nom: '',
  secretaire_id: '',
};

function formatStatusLabel(status) {
  if (!status) return 'Nouveau';

  const normalized = String(status).toLowerCase();
  if (normalized === 'en cours' || normalized === 'en_cours') return 'En cours';
  if (normalized === 'resolu' || normalized === 'résolu') return 'Resolu';
  return 'Nouveau';
}

function getStatusBadgeClass(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'en cours' || normalized === 'en_cours') return 'is-encours';
  if (normalized === 'resolu' || normalized === 'résolu') return 'is-resolu';
  return 'is-nouveau';
}

function getClaimDate(claim) {
  const rawDate = claim?.date_reclamation || claim?.date_soumission || claim?.created_at;
  if (!rawDate) return '-';

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) return '-';

  return parsedDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function DirectoryReclamations() {
  const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000`;
  const token = localStorage.getItem('linkedu_token');

  const [reclamations, setReclamations] = useState([]);
  const [secretaires, setSecretaires] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionFeedback, setActionFeedback] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState(defaultClaimForm);
  const [searchSujet, setSearchSujet] = useState('');

  const axiosAuthConfig = useMemo(() => ({
    withCredentials: true,
    withXSRFToken: true,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }), [token]);

  useEffect(() => {
    fetchReclamations();
    fetchSecretaires();
    fetchEtudiants();
    fetchProfesseurs();
  }, []);

  const fetchReclamations = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const response = await axios.get(`${apiBaseUrl}/api/directeur/reclamations`, axiosAuthConfig);
      const items = Array.isArray(response.data)
        ? response.data
        : (response.data?.reclamations || []);

      setReclamations(items);
    } catch (error) {
      console.error('Erreur lors du chargement des reclamations', error);
      setReclamations([]);
      setErrorMsg(error?.response?.data?.message || 'Erreur lors du chargement des reclamations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSecretaires = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/directeur/secretaires`, axiosAuthConfig);
      setSecretaires(response.data?.secretaires || []);
    } catch (error) {
      console.error('Erreur lors du chargement des secretaire(s)', error);
      setSecretaires([]);
    }
  };

  const fetchEtudiants = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/directeur/etudiants`, axiosAuthConfig);
      setEtudiants(response.data?.students || []);
    } catch (error) {
      console.error('Erreur lors du chargement des etudiants', error);
      setEtudiants([]);
    }
  };

  const fetchProfesseurs = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/directeur/professeurs`, axiosAuthConfig);
      const items = Array.isArray(response.data) ? response.data : (response.data?.professeurs || []);
      setProfesseurs(items);
    } catch (error) {
      console.error('Erreur lors du chargement des professeurs', error);
      setProfesseurs([]);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(defaultClaimForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCibleChange = (event) => {
    const nextCible = event.target.value;
    setFormData((prev) => ({
      ...prev,
      cible: nextCible,
      etudiant_nom: '',
      professeur_nom: '',
      secretaire_id: '',
    }));
  };

  const validateForm = () => {
    const sujet = formData.sujet.trim();
    const description = formData.description.trim();

    if (!sujet || !description) {
      return 'Veuillez remplir le sujet et la description.';
    }

    if (editingId !== null) {
      return '';
    }

    if (formData.cible === 'parent' && !formData.etudiant_nom.trim()) {
      return 'Veuillez saisir le nom de l etudiant lie au parent cible.';
    }

    if (formData.cible === 'directeur' && !formData.professeur_nom.trim()) {
      return 'Veuillez saisir le nom du professeur cible.';
    }

    if (formData.cible === 'secretaire' && !formData.secretaire_id) {
      return 'Veuillez selectionner la secretaire ciblee.';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setActionFeedback({ type: 'error', text: validationError });
      return;
    }

    const payload = {
      sujet: formData.sujet.trim(),
      description: formData.description.trim(),
      cible: formData.cible,
      etudiant_nom: formData.cible === 'parent' ? formData.etudiant_nom.trim() : undefined,
      professeur_nom: formData.cible === 'directeur' ? formData.professeur_nom.trim() : undefined,
      secretaire_id: formData.cible === 'secretaire' ? Number(formData.secretaire_id) : undefined,
    };

    try {
      setIsSubmitting(true);
      setActionFeedback({ type: '', text: '' });

      if (editingId !== null) {
        await axios.put(
          `${apiBaseUrl}/api/directeur/reclamations/${editingId}`,
          {
            sujet: payload.sujet,
            description: payload.description,
          },
          axiosAuthConfig,
        );
      } else {
        await axios.post(`${apiBaseUrl}/api/directeur/reclamations`, payload, axiosAuthConfig);
      }

      await fetchReclamations();
      setActionFeedback({
        type: 'success',
        text: editingId !== null ? 'Reclamation modifiee avec succes.' : 'Reclamation ajoutee avec succes.',
      });
      resetForm();
    } catch (error) {
      setActionFeedback({
        type: 'error',
        text: error?.response?.data?.message || 'Erreur lors de l enregistrement de la reclamation.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (claim) => {
    const rawCible = String(claim?.cible || '').toLowerCase();
    const normalizedCible = ['parent', 'directeur', 'secretaire'].includes(rawCible)
      ? rawCible
      : 'parent';

    setEditingId(claim.id_reclamation);
    setFormData({
      sujet: claim.sujet || '',
      description: claim.description || '',
      cible: normalizedCible,
      etudiant_nom: '',
      professeur_nom: '',
      secretaire_id: '',
    });
    setActionFeedback({ type: '', text: '' });
  };

  const handleDelete = async (claimId) => {
    const confirmed = window.confirm('Voulez-vous vraiment supprimer cette reclamation ?');
    if (!confirmed) return;

    try {
      await axios.delete(`${apiBaseUrl}/api/directeur/reclamations/${claimId}`, axiosAuthConfig);
      await fetchReclamations();
      setActionFeedback({ type: 'success', text: 'Reclamation supprimee avec succes.' });

      if (editingId === claimId) {
        resetForm();
      }
    } catch (error) {
      setActionFeedback({
        type: 'error',
        text: error?.response?.data?.message || 'Erreur lors de la suppression de la reclamation.',
      });
    }
  };

  const filteredReclamations = useMemo(() => {
    const term = searchSujet.trim().toLowerCase();
    if (!term) return reclamations;

    return reclamations.filter((claim) => String(claim.sujet || '').toLowerCase().includes(term));
  }, [reclamations, searchSujet]);

  return (
    <div className="director-claims-page">
      <div className="director-claims-grid">
        <section className="director-claims-table-card">
          <div className="director-claims-card-header">
            <div className="claims-header-main">
              <h2 className="claims-title-with-icon">
                <BiMessageSquareDetail />
                <span>Gestion des reclamations</span>
              </h2>
              <p>Les reclamations sont affichees dans un tableau. Utilisez le formulaire a droite pour ajouter ou modifier.</p>
            </div>
            <div className="claims-search-wrap">
              <BiSearchAlt2 className="claims-search-icon" />
              <input
                type="text"
                className="claims-search-input"
                placeholder="Rechercher une reclamation par sujet"
                value={searchSujet}
                onChange={(event) => setSearchSujet(event.target.value)}
              />
            </div>
          </div>

          {errorMsg && <div className="claim-feedback is-error">{errorMsg}</div>}
          {actionFeedback.text && (
            <div className={`claim-feedback ${actionFeedback.type === 'error' ? 'is-error' : 'is-success'}`}>
              {actionFeedback.text}
            </div>
          )}

          <div className="director-claims-table-wrap">
            <table className="director-claims-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sujet</th>
                  <th>Cible</th>
                  <th>Statut</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="claims-empty">Chargement des reclamations...</td>
                  </tr>
                ) : filteredReclamations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="claims-empty">Aucune reclamation trouvee.</td>
                  </tr>
                ) : (
                  filteredReclamations.map((claim) => (
                    <tr key={claim.id_reclamation}>
                      <td>{getClaimDate(claim)}</td>
                      <td className="claim-subject-cell">{claim.sujet || '-'}</td>
                      <td>{claim.cible_label || claim.cible || '-'}</td>
                      <td>
                        <span className={`claim-status-badge ${getStatusBadgeClass(claim.statut)}`}>
                          {formatStatusLabel(claim.statut)}
                        </span>
                      </td>
                      <td>
                        <div className="claim-description-preview">{claim.description || '-'}</div>
                      </td>
                      <td>
                        <div className="claim-row-actions">
                          <button
                            className="btn-edit-claim"
                            onClick={() => handleEdit(claim)}
                            title="Modifier"
                            aria-label="Modifier"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-delete-claim"
                            onClick={() => handleDelete(claim.id_reclamation)}
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

        <aside className="director-claims-form-card">
          <h3>{editingId !== null ? 'Modifier reclamation' : 'Nouvelle reclamation'}</h3>
          <form onSubmit={handleSubmit} className="director-claim-form">
            <div className="claim-form-group">
              <label>Sujet</label>
              <input type="text" name="sujet" value={formData.sujet} onChange={handleChange} required />
            </div>

            <div className="claim-form-group">
              <label>Description</label>
              <textarea name="description" rows="5" value={formData.description} onChange={handleChange} required></textarea>
            </div>

            <div className="claim-form-group">
              <label>Cible</label>
              <select
                name="cible"
                value={formData.cible}
                onChange={handleCibleChange}
                disabled={editingId !== null}
              >
                <option value="parent">Parent</option>
                <option value="directeur">Professeur</option>
                <option value="secretaire">Secretaire</option>
              </select>
            </div>

            {editingId === null && formData.cible === 'parent' && (
              <div className="claim-form-group">
                <label>Nom de l etudiant (lie au parent)</label>
                <input
                  type="text"
                  name="etudiant_nom"
                  list="director-claim-etudiants"
                  placeholder="Ex: Yassine Amrani"
                  value={formData.etudiant_nom}
                  onChange={handleChange}
                />
                <datalist id="director-claim-etudiants">
                  {etudiants.map((etu) => {
                    const label = `${etu.prenom || ''} ${etu.nom || ''}`.trim() || etu.name;
                    return <option key={etu.id_etudiant} value={label} />;
                  })}
                </datalist>
              </div>
            )}

            {editingId === null && formData.cible === 'directeur' && (
              <div className="claim-form-group">
                <label>Nom du professeur cible</label>
                <input
                  type="text"
                  name="professeur_nom"
                  list="director-claim-professeurs"
                  placeholder="Ex: Karim Lahlou"
                  value={formData.professeur_nom}
                  onChange={handleChange}
                />
                <datalist id="director-claim-professeurs">
                  {professeurs.map((prof) => {
                    const label = `${prof.prenom || ''} ${prof.nom || ''}`.trim() || prof.name;
                    return <option key={prof.id_professeur || prof.id} value={label} />;
                  })}
                </datalist>
              </div>
            )}

            {editingId === null && formData.cible === 'secretaire' && (
              <div className="claim-form-group">
                <label>Secretaire ciblee</label>
                <select
                  name="secretaire_id"
                  value={formData.secretaire_id}
                  onChange={handleChange}
                >
                  <option value="">Selectionner une secretaire</option>
                  {secretaires.map((sec) => (
                    <option key={sec.id_secretaire} value={String(sec.id_secretaire)}>
                      {`${sec.prenom || ''} ${sec.nom || ''}`.trim() || sec.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="claim-form-actions">
              {editingId !== null && (
                <button type="button" className="btn-cancel-claim" onClick={resetForm}>Annuler</button>
              )}
              <button type="submit" className="btn-save-claim" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Enregistrement...'
                  : (editingId !== null ? 'Mettre a jour' : 'Envoyer la reclamation')}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}

export default DirectoryReclamations;