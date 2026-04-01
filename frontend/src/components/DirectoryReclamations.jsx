import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Trash2 } from 'lucide-react';
import './DirectoryReclamations.css';

const DirectoryReclamations = () => {
  const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000`;
  const token = localStorage.getItem('linkedu_token');

  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addFeedback, setAddFeedback] = useState('');
  const [addFeedbackType, setAddFeedbackType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newClaim, setNewClaim] = useState({ sujet: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editClaim, setEditClaim] = useState({ sujet: '', description: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({ type: '', msg: '' });

  useEffect(() => {
    fetchReclamations();
  }, []);

  const fetchReclamations = () => {
    setLoading(true);
    axios.get(apiBaseUrl + '/api/directeur/reclamations', {
      headers: {
        Authorization: token ? 'Bearer ' + token : undefined,
        Accept: 'application/json',
      }
    })
    .then(response => {
      setReclamations(response.data);
      setLoading(false);
    })
    .catch(error => {
      console.error("Erreur lors du chargement des réclamations", error);
      setLoading(false);
    });
  };

  const handleCreateReclamation = async () => {
    const sujet = newClaim.sujet.trim();
    const description = newClaim.description.trim();

    if (!sujet || !description) {
      setAddFeedbackType('error');
      setAddFeedback('Veuillez remplir le sujet et la description.');
      return;
    }

    setIsSubmitting(true);
    setAddFeedback('');
    setAddFeedbackType('');

    try {
      await axios.post(
        apiBaseUrl + '/api/directeur/reclamations',
        { sujet, description },
        {
          withCredentials: true,
          headers: {
            Authorization: token ? 'Bearer ' + token : undefined,
            Accept: 'application/json',
          },
        }
      );

      setAddFeedbackType('success');
      setAddFeedback('Reclamation ajoutee avec succes.');
      setNewClaim({ sujet: '', description: '' });
      fetchReclamations();
      setTimeout(() => {
        setIsAdding(false);
        setAddFeedback('');
        setAddFeedbackType('');
      }, 900);
    } catch (error) {
      setAddFeedbackType('error');
      setAddFeedback(error?.response?.data?.message || "Erreur lors de l'ajout de la reclamation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClaims = reclamations;

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Nouveau': return 'Nouveau';
      case 'En cours': return 'En cours';
      case 'Resolu':
      case 'Résolu': return 'Résolu';
      default: return status;
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'nouveau') return 'badge-nouveau';
    if (s === 'en cours' || s === 'en_cours') return 'badge-encours';
    if (s === 'résolu' || s === 'resolu') return 'badge-resolu';
    return 'badge-nouveau';
  };

  const openEditModal = (claim) => {
    setEditTarget(claim);
    setEditClaim({
      sujet: claim.sujet || '',
      description: claim.description || '',
    });
    setIsEditing(true);
  };

  const closeEditModal = () => {
    setIsEditing(false);
    setEditTarget(null);
    setEditClaim({ sujet: '', description: '' });
  };

  const handleUpdateReclamation = async () => {
    if (!editTarget?.id_reclamation) return;

    const sujet = editClaim.sujet.trim();
    const description = editClaim.description.trim();

    if (!sujet || !description) {
      setActionFeedback({ type: 'error', msg: 'Sujet et description sont obligatoires.' });
      return;
    }

    setIsSavingEdit(true);
    setActionFeedback({ type: '', msg: '' });

    try {
      await axios.put(
        apiBaseUrl + `/api/directeur/reclamations/${editTarget.id_reclamation}`,
        { sujet, description },
        {
          withCredentials: true,
          headers: {
            Authorization: token ? 'Bearer ' + token : undefined,
            Accept: 'application/json',
          },
        }
      );

      setActionFeedback({ type: 'success', msg: 'Reclamation modifiee avec succes.' });
      fetchReclamations();
      setTimeout(() => {
        closeEditModal();
        setActionFeedback({ type: '', msg: '' });
      }, 800);
    } catch (error) {
      setActionFeedback({ type: 'error', msg: error?.response?.data?.message || 'Erreur lors de la modification.' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteReclamation = async (claimId) => {
    const confirmed = window.confirm('Voulez-vous vraiment supprimer cette reclamation ?');
    if (!confirmed) return;

    try {
      await axios.delete(apiBaseUrl + `/api/directeur/reclamations/${claimId}`, {
        withCredentials: true,
        headers: {
          Authorization: token ? 'Bearer ' + token : undefined,
          Accept: 'application/json',
        },
      });

      setActionFeedback({ type: 'success', msg: 'Reclamation supprimee avec succes.' });
      fetchReclamations();
      setTimeout(() => setActionFeedback({ type: '', msg: '' }), 2500);
    } catch (error) {
      setActionFeedback({ type: 'error', msg: error?.response?.data?.message || 'Erreur lors de la suppression.' });
    }
  };

  return (
    <div className="directory-reclamations">
      <div className="reclamations-header">
        <h2>Boîte de Réception - Réclamations</h2>
        <button
          type="button"
          className="add-claim-btn"
          onClick={() => {
            setIsAdding(true);
            setAddFeedback('');
            setAddFeedbackType('');
            setNewClaim({ sujet: '', description: '' });
          }}
        >
          <i className="fa-solid fa-plus"></i> Ajouter réclamation
        </button>
        
      </div>

      <div className="claims-list">
        {actionFeedback.msg && (
          <div className={`add-claim-feedback ${actionFeedback.type === 'error' ? 'is-error' : 'is-success'}`}>
            {actionFeedback.msg}
          </div>
        )}

        {isAdding && (
          <div className="add-claim-modal" role="dialog" aria-modal="true">
            <div className="add-claim-backdrop" onClick={() => setIsAdding(false)}></div>
            <div className="add-claim-panel">
              <div className="add-claim-header">
                <h3>Nouvelle réclamation</h3>
                <button type="button" className="add-claim-back" onClick={() => setIsAdding(false)}>
                  Fermer
                </button>
              </div>
              <div className="add-claim-body">
                <label className="add-claim-label">Sujet</label>
                <input
                  className="add-claim-input"
                  type="text"
                  placeholder="Ex: Absence justifiée"
                  value={newClaim.sujet}
                  onChange={(e) => setNewClaim((prev) => ({ ...prev, sujet: e.target.value }))}
                />
                <label className="add-claim-label">Description</label>
                <textarea
                  className="add-claim-textarea"
                  rows={4}
                  placeholder="Détaillez la réclamation..."
                  value={newClaim.description}
                  onChange={(e) => setNewClaim((prev) => ({ ...prev, description: e.target.value }))}
                ></textarea>
                {addFeedback && <div className={`add-claim-feedback ${addFeedbackType === 'error' ? 'is-error' : 'is-success'}`}>{addFeedback}</div>}
                <button type="button" className="add-claim-submit" onClick={handleCreateReclamation} disabled={isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="add-claim-modal" role="dialog" aria-modal="true">
            <div className="add-claim-backdrop" onClick={closeEditModal}></div>
            <div className="add-claim-panel">
              <div className="add-claim-header">
                <h3>Modifier réclamation</h3>
                <button type="button" className="add-claim-back" onClick={closeEditModal}>
                  Fermer
                </button>
              </div>
              <div className="add-claim-body">
                <label className="add-claim-label">Sujet</label>
                <input
                  className="add-claim-input"
                  type="text"
                  value={editClaim.sujet}
                  onChange={(e) => setEditClaim((prev) => ({ ...prev, sujet: e.target.value }))}
                />
                <label className="add-claim-label">Description</label>
                <textarea
                  className="add-claim-textarea"
                  rows={4}
                  value={editClaim.description}
                  onChange={(e) => setEditClaim((prev) => ({ ...prev, description: e.target.value }))}
                ></textarea>
                <button type="button" className="add-claim-submit" onClick={handleUpdateReclamation} disabled={isSavingEdit}>
                  {isSavingEdit ? 'Enregistrement...' : 'Modifier'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="empty-state">Chargement des réclamations...</div>
        ) : filteredClaims.length > 0 ? (
          filteredClaims.map(claim => (
            <div key={claim.id_reclamation} className="claim-card">
              <div className="claim-header">
                <div className="claim-meta">
                  <span className={`claim-badge ${getStatusBadgeClass(claim.statut)}`}>
                    {getStatusLabel(claim.statut)}
                  </span>
                  <span className="claim-date">
                    <i className="fa-regular fa-clock"></i> {new Date(claim.date_reclamation).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="claim-actions">
                  <button className="action-btn edit" title="Modifier" onClick={() => openEditModal(claim)}>
                    <Pencil size={14} />
                    <span>Modifier</span>
                  </button>
                  <button className="action-btn delete" title="Supprimer" onClick={() => handleDeleteReclamation(claim.id_reclamation)}>
                    <Trash2 size={14} />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
              
              <div className="claim-body">
                <div className="claim-sender">
                  <div className="sender-avatar">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <span className="sender-name">Utilisateur ID: {claim.id_parent || claim.id_professeur || claim.id_etudiant || 'Inconnu'}</span>
                </div>
                
                <h3 className="claim-subject">{claim.sujet}</h3>
                <p className="claim-excerpt">
                  {claim.description}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <i className="fa-regular fa-folder-open" style={{fontSize: '3rem', marginBottom: '1rem', color: '#ccc'}}></i>
            <p>Aucune réclamation trouvée pour ce filtre.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryReclamations;
