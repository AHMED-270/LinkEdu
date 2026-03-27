import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch as Search, FiPlus as Plus, FiEdit2 as Edit, FiTrash2 as Trash2 } from 'react-icons/fi';
import AdminUserForm from './AdminUserForm';

export default function AdminUsers({ onCreateUser, onEditUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  const fetchData = async () => {
    try {
      setLoading(true);
      const resUsers = await axios.get(apiBaseUrl + '/api/admin/users', {
        withCredentials: true,
        headers: { Accept: 'application/json' }
      });
      setUsers(resUsers.data);
    } catch (error) {
      console.error('Erreur fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const ensureCsrfCookie = async () => {
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
  };

  const requestDelete = (user) => {
    setDeleteTarget(user);
  };

  const handleCreateUser = () => {
    if (typeof onCreateUser === 'function') {
      onCreateUser();
    }
  };

  const handleEditUser = (user) => {
    setEditTarget(user);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await ensureCsrfCookie();

      await axios.delete(`${apiBaseUrl}/api/admin/users/${deleteTarget.id}`, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' }
      });

      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!normalizedSearch) return true;

    return [
      user.name,
      user.email,
      user.role,
      user.telephone,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  return (
    <div className="dashboard-content">
      <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Gestion des Utilisateurs</h1>
          <p>Créer, modifier ou supprimer des utilisateurs.</p>
        </div>
        <button
          className="create-class-btn"
          onClick={handleCreateUser}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
        >
          <Plus size={18} />
          Ajouter un Utilisateur
        </button>
      </header>

      <div className="card-panel">
        <div className="card-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Tous les utilisateurs ({filteredUsers.length})</h2>
          <div className="search-bar" style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher nom, email, role, telephone..."
              style={{ border: 'none', background: 'transparent', outline: 'none', minWidth: '260px' }}
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
                <th style={{ padding: '12px 0' }}>Email</th>
                <th style={{ padding: '12px 0' }}>Rôle</th>
                <th style={{ padding: '12px 0' }}>Téléphone</th>
                <th style={{ padding: '12px 0', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '20px 0', textAlign: 'center', color: '#64748b' }}>
                    Aucun utilisateur ne correspond a votre recherche.
                  </td>
                </tr>
              )}
              {filteredUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 0', fontWeight: '500' }}>{user.name}</td>
                  <td style={{ padding: '12px 0', color: '#475569' }}>{user.email}</td>
                  <td style={{ padding: '12px 0' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '500',
                      background: user.role === 'admin' ? '#fee2e2' : user.role === 'etudiant' ? '#dcfce7' : '#e0e7ff',
                      color: user.role === 'admin' ? '#9f1239' : user.role === 'etudiant' ? '#166534' : '#3730a3'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 0', color: '#475569' }}>{user.telephone || '-'}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right' }}>
                     <button onClick={() => handleEditUser(user)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '10px' }}>
                         <Edit size={18} />
                     </button>
                     <button onClick={() => requestDelete(user)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
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
              Voulez-vous vraiment supprimer l&apos;utilisateur <strong>{deleteTarget.name}</strong> ?
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
          <div className="logout-modal-card" style={{ maxWidth: '900px', width: '90vw', maxHeight: '90vh', overflowY: 'auto', padding: '16px' }}>
            <AdminUserForm
              mode="edit"
              userToEdit={editTarget}
              isModal={true}
              onBack={() => setEditTarget(null)}
              onSuccess={() => {
                setEditTarget(null);
                fetchData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
