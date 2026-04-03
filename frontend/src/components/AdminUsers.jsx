import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminUserForm from './AdminUserForm';
import { getRoleBadgeClass, getRoleLabel } from '../constants/roles';

export default function AdminUsers({ onCreateUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

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

  const requestDelete = (user) => setDeleteTarget(user);
  const handleEditUser = (user) => setEditTarget(user);
  
  const handleCreateUser = () => {
    if (typeof onCreateUser === 'function') {
      onCreateUser();
    }
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
    return [user.name, user.email, user.role, user.telephone]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  // Animation variants for the table rows (waterfall effect)
  const tableRowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, type: 'spring', stiffness: 100 }
    })
  };

  return (
    <div className="layout-content">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-1">Créer, modifier ou supprimer des utilisateurs.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary"
          onClick={handleCreateUser}
        >
          <Plus size={18} />
          Ajouter un Utilisateur
        </motion.button>
      </header>

      {/* Main Card Panel */}
      <div className="card">
        <div className="card-header border-b border-slate-100 pb-4 mb-4">
          <h3>Tous les utilisateurs <span className="badge badge-blue ml-2">{filteredUsers.length}</span></h3>
          
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
            <Search size={16} className="text-slate-400 mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="bg-transparent border-none outline-none text-sm text-slate-700 w-64 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <span className="loading-spinner border-blue-500"></span>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Téléphone</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-500">
                        Aucun utilisateur ne correspond à votre recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, i) => (
                      <motion.tr 
                        key={user.id}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        variants={tableRowVariants}
                      >
                        <td className="font-semibold text-slate-800">{user.name}</td>
                        <td className="text-slate-500 text-sm">{user.email}</td>
                        <td>
                          {/* Dynamic Badge Colors using your layout logic */}
                          <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="text-slate-500 text-sm">{user.telephone || '-'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex justify-end gap-2">
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEditUser(user)} 
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => requestDelete(user)} 
                              className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal (Using AnimatePresence) */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="logout-modal-backdrop"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="logout-modal-card"
            >
              <div className="logout-modal-icon">
                <Trash2 size={36} color="#ef4444" />
              </div>
              <h3>Confirmer la suppression</h3>
              <p>
                Voulez-vous vraiment supprimer l'utilisateur <strong>{deleteTarget.name}</strong> ? Cette action est irréversible.
              </p>

              <div className="logout-modal-actions">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="btn btn-outline"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn btn-danger"
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editTarget && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="logout-modal-backdrop"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-0"
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

