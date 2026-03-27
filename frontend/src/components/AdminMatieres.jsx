import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FiPlus as Plus, FiEdit2 as Edit, FiTrash2 as Trash2, FiSearch as Search } from 'react-icons/fi';

export default function AdminMatieres({ userRole = 'admin' }) {
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editFormData, setEditFormData] = useState({ nom: '', coefficient: 1 });
  const [editFormError, setEditFormError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    coefficient: 1,
  });

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  const ensureCsrfCookie = async () => {
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
  };

  const fetchMatieres = async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiBaseUrl + '/api/admin/matieres', {
        withCredentials: true,
        headers: { Accept: 'application/json' },
      });
      setMatieres(response.data || []);
    } catch (error) {
      console.error('Erreur chargement matieres:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatieres();
  }, []);

  const openCreateForm = () => {
    setFormData({ nom: '', coefficient: 1 });
    setFormError('');
    setShowForm(true);
  };

  const closeCreateForm = () => {
    setShowForm(false);
    setFormError('');
  };

  const openEditForm = (matiere) => {
    setEditTarget(matiere);
    setEditFormData({
      nom: matiere.nom || '',
      coefficient: matiere.coefficient || 1,
    });
    setEditFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      nom: formData.nom.trim(),
      coefficient: Number(formData.coefficient),
    };

    try {
      await ensureCsrfCookie();

      await axios.post(apiBaseUrl + '/api/admin/matieres', payload, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' },
      });

      setShowForm(false);
      fetchMatieres();
    } catch (error) {
      setFormError(error.response?.data?.message || "Erreur lors de l'enregistrement de la matiere.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;

    setEditFormError('');
    setIsSavingEdit(true);

    const payload = {
      nom: editFormData.nom.trim(),
      coefficient: Number(editFormData.coefficient),
    };

    try {
      await ensureCsrfCookie();

      await axios.put(`${apiBaseUrl}/api/admin/matieres/${editTarget.id_matiere}`, payload, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' },
      });

      setEditTarget(null);
      fetchMatieres();
    } catch (error) {
      setEditFormError(error.response?.data?.message || "Erreur lors de la modification de la matiere.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const requestDelete = (matiere) => {
    setDeleteTarget(matiere);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      await ensureCsrfCookie();

      await axios.delete(`${apiBaseUrl}/api/admin/matieres/${deleteTarget.id_matiere}`, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' },
      });

      setDeleteTarget(null);
      fetchMatieres();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression de la matiere.');
    } finally {
      setIsDeleting(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredMatieres = useMemo(() => {
    return matieres.filter((matiere) => {
      if (!normalizedSearch) return true;

      return [matiere.nom, matiere.coefficient]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [matieres, normalizedSearch]);

  if (userRole !== 'admin') {
    return (
      <div className="dashboard-content">
        <p>Acces reserve a l'administrateur.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Gestion des Matieres</h1>
          <p>Creer, modifier et supprimer les matieres de l'etablissement.</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
        >
          <Plus size={18} />
          Ajouter une Matiere
        </button>
      </header>

      <div className="card-panel">
        <div className="card-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Toutes les matieres ({filteredMatieres.length})</h2>
          <div className="search-bar" style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher nom ou coefficient..."
              style={{ border: 'none', background: 'transparent', outline: 'none', minWidth: '240px' }}
            />
          </div>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '12px 0' }}>Nom</th>
                <th style={{ padding: '12px 0' }}>Coefficient</th>
                <th style={{ padding: '12px 0', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatieres.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '20px 0', textAlign: 'center', color: '#64748b' }}>
                    Aucune matiere trouvee.
                  </td>
                </tr>
              )}
              {filteredMatieres.map((matiere) => (
                <tr key={matiere.id_matiere} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 0', fontWeight: '500' }}>{matiere.nom}</td>
                  <td style={{ padding: '12px 0' }}>
                    <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '16px', color: '#334155' }}>
                      {matiere.coefficient}
                    </span>
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => openEditForm(matiere)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '10px' }}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDelete(matiere)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal-card">
            <div className="logout-modal-icon">
              <Trash2 size={46} color="#f43f5e" />
            </div>
            <h3>Confirmer la suppression</h3>
            <p>
              Voulez-vous vraiment supprimer la matiere <strong>{deleteTarget.nom}</strong> ?
            </p>

            <div className="logout-modal-actions">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="btn-cancel"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-confirm-logout"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal-card" style={{ maxWidth: '720px', width: '90vw' }}>
            <h3 style={{ marginTop: 0 }}>Modifier Matiere</h3>
            {editFormError && <p style={{ color: 'red', marginBottom: '10px' }}>{editFormError}</p>}

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nom de la matiere</label>
                  <input
                    type="text"
                    value={editFormData.nom}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, nom: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ width: '220px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editFormData.coefficient}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, coefficient: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="logout-modal-actions" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  disabled={isSavingEdit}
                  className="btn-cancel"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="btn-confirm-logout"
                >
                  {isSavingEdit ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal-card" style={{ maxWidth: '720px', width: '90vw' }}>
            <h3 style={{ marginTop: 0 }}>Nouvelle Matiere</h3>
            {formError && <p style={{ color: 'red', marginBottom: '10px' }}>{formError}</p>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nom de la matiere</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ width: '220px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.coefficient}
                    onChange={(e) => setFormData((prev) => ({ ...prev, coefficient: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="logout-modal-actions" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeCreateForm}
                  className="btn-cancel"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-confirm-logout"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
