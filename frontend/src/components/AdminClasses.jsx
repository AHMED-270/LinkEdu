import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch as Search, FiPlus as Plus, FiEdit2 as Edit, FiTrash2 as Trash2, FiEye as Eye } from 'react-icons/fi';
import AdminClassForm from './AdminClassForm';

export default function AdminClasses({ onCreateClass, onEditClass, userRole = 'admin' }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [classDetailTarget, setClassDetailTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(apiBaseUrl + '/api/admin/classes', {
        withCredentials: true,
        headers: { Accept: 'application/json' }
      });
      setClasses(res.data);
    } catch (error) {
      console.error('Erreur classes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const ensureCsrfCookie = async () => {
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
  };

  const requestDelete = (classe) => {
    setDeleteTarget(classe);
  };

  const handleCreateClass = () => {
    if (typeof onCreateClass === 'function') {
      onCreateClass();
    }
  };

  const handleEditClass = (classe) => {
    setEditTarget(classe);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      await ensureCsrfCookie();

      await axios.delete(`${apiBaseUrl}/api/admin/classes/${deleteTarget.id_classe}`, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' }
      });

      setDeleteTarget(null);
      fetchClasses();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression.');
    } finally {
      setIsDeleting(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredClasses = classes.filter((cls) => {
    if (!normalizedSearch) return true;

    return [cls.nom, cls.niveau, cls.students_count, cls.professeurs_count]
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  return (
    <div className="dashboard-content">
      <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Gestion des Classes</h1>
          <p>Liste des classes et leurs effectifs.</p>
        </div>
        {userRole === 'admin' && (
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            onClick={handleCreateClass}
          >
            <Plus size={18} /> Créer une Classe
          </button>
        )}
      </header>

      <div className="card-panel">
        <div className="card-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Toutes les classes ({filteredClasses.length})</h2>
          <div className="search-bar" style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Search size={16} color="#64748b" />
             <input
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Rechercher nom, niveau, effectif, nombre professeurs..."
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
                <th style={{ padding: '12px 0' }}>Niveau</th>
                <th style={{ padding: '12px 0' }}>Nombre Professeurs</th>
                <th style={{ padding: '12px 0' }}>Effectif</th>
                <th style={{ padding: '12px 0' }}>Details</th>
                  {userRole === 'admin' && <th style={{ padding: '12px 0', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
                {filteredClasses.length === 0 && <tr><td colSpan={userRole === 'admin' ? 6 : 5} style={{ padding: '20px 0', textAlign: 'center', color: '#64748b' }}>Aucune classe trouvée.</td></tr>}
              {filteredClasses.map(cls => (
                <tr key={cls.id_classe} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 0', fontWeight: '500' }}>{cls.nom}</td>
                  <td style={{ padding: '12px 0', color: '#64748b' }}>{cls.niveau}</td>
                  <td style={{ padding: '12px 0' }}>
                    <span
                      style={{ background: '#f1f5f9', color: '#0f172a', borderRadius: '999px', padding: '4px 12px', fontWeight: '600', display: 'inline-block' }}
                    >
                      {cls.professeurs_count || 0}
                    </span>
                  </td>
                  <td style={{ padding: '12px 0' }}>
                    <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '16px', color: '#334155' }}>
                      {cls.students_count}
                    </span>
                  </td>
                  <td style={{ padding: '12px 0' }}>
                    <button
                      type="button"
                      onClick={() => setClassDetailTarget(cls)}
                      title="Voir les details"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f172a' }}
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                    {userRole === 'admin' && (
                      <td style={{ padding: '12px 0', textAlign: 'right' }}>
                        <button onClick={() => handleEditClass(cls)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '10px' }}>
                          <Edit size={18} />
                        </button>
                        <button onClick={() => requestDelete(cls)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

        {deleteTarget && userRole === 'admin' && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal-card">
            <div className="logout-modal-icon">
              <Trash2 size={46} color="#f43f5e" />
            </div>
            <h3>Confirmer la suppression</h3>
            <p>
              Voulez-vous vraiment supprimer la classe <strong>{deleteTarget.nom}</strong> ?
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

      {classDetailTarget && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal-card">
            <h3>Details de la classe - {classDetailTarget.nom}</h3>
            <div style={{ textAlign: 'left', maxHeight: '380px', overflowY: 'auto', marginTop: '10px', paddingRight: '4px' }}>
              <div style={{ marginBottom: '14px' }}>
                <p style={{ margin: '0 0 6px 0', color: '#334155' }}><strong>Niveau:</strong> {classDetailTarget.niveau}</p>
                <p style={{ margin: 0, color: '#334155' }}><strong>Effectif total:</strong> {classDetailTarget.students_count || 0}</p>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ margin: '0 0 8px 0' }}>Professeurs ({classDetailTarget.professeurs_count || 0})</h4>
                {(classDetailTarget.professeurs_details || []).length === 0 ? (
                  <p style={{ color: '#64748b', margin: 0 }}>Aucun professeur affecte.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#334155' }}>
                    {(classDetailTarget.professeurs_details || []).map((professeur) => (
                      <li key={professeur.id} style={{ marginBottom: '6px' }}>
                        {professeur.name || 'Professeur'}{professeur.telephone ? ` - ${professeur.telephone}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0' }}>Effectifs ({classDetailTarget.students_count || 0})</h4>
                {(classDetailTarget.effectif_details || []).length === 0 ? (
                  <p style={{ color: '#64748b', margin: 0 }}>Aucun eleve inscrit.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#334155' }}>
                    {(classDetailTarget.effectif_details || []).map((etudiant) => (
                      <li key={etudiant.id} style={{ marginBottom: '6px' }}>
                        {etudiant.name || 'Eleve'}{etudiant.matricule ? ` - ${etudiant.matricule}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="logout-modal-actions">
              <button
                type="button"
                onClick={() => setClassDetailTarget(null)}
                className="btn-cancel"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal-card" style={{ maxWidth: '900px', width: '90vw', maxHeight: '90vh', overflowY: 'auto', padding: '16px' }}>
            <AdminClassForm
              mode="edit"
              classToEdit={editTarget}
              isModal={true}
              onBack={() => setEditTarget(null)}
              onSuccess={() => {
                setEditTarget(null);
                fetchClasses();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
