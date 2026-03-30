import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, BookOpen, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminMatieres({ userRole = 'admin' }) {
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nom: '', coefficient: 1 });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editFormData, setEditFormData] = useState({ nom: '', coefficient: 1 });
  const [editFormError, setEditFormError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

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
      console.error('Erreur chargement matiÃ¨res:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatieres();
  }, []);

  // --- Modal Handlers ---
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

  // --- Submit Handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);

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
      setFormError(error.response?.data?.message || "Erreur lors de l'enregistrement de la matiÃ¨re.");
    } finally {
      setIsSaving(false);
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
      setEditFormError(error.response?.data?.message || "Erreur lors de la modification de la matiÃ¨re.");
    } finally {
      setIsSavingEdit(false);
    }
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
      alert(error.response?.data?.message || 'Erreur lors de la suppression de la matiÃ¨re.');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Filtering & Animations ---
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredMatieres = useMemo(() => {
    return matieres.filter((matiere) => {
      if (!normalizedSearch) return true;
      return [matiere.nom, matiere.coefficient]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [matieres, normalizedSearch]);

  const tableRowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, type: 'spring', stiffness: 100 }
    })
  };

  if (userRole !== 'admin') {
    return (
      <div className="layout-content flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 text-red-600 rounded-xl border border-red-100">
          <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">AccÃ¨s RefusÃ©</h2>
          <p>Cette page est strictement rÃ©servÃ©e Ã  l'administrateur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-content">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Gestion des MatiÃ¨res</h1>
          <p className="text-slate-500 text-sm mt-1">CrÃ©er, modifier et supprimer les matiÃ¨res de l'Ã©tablissement.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary shadow-[0_4px_14px_rgba(59,130,246,0.25)]"
          onClick={openCreateForm}
        >
          <Plus size={18} />
          Ajouter une MatiÃ¨re
        </motion.button>
      </header>

      {/* Main Card Panel */}
      <div className="card">
        <div className="card-header border-b border-slate-100 pb-4 mb-4">
          <h3 className="flex items-center gap-2">
            Toutes les matiÃ¨res <span className="badge badge-blue">{filteredMatieres.length}</span>
          </h3>
          
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
            <Search size={16} className="text-slate-400 mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une matiÃ¨re..."
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
                    <th>Nom de la matiÃ¨re</th>
                    <th>Coefficient</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatieres.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-12 text-slate-500">
                        <BookOpen size={32} className="mx-auto mb-3 opacity-20" />
                        Aucune matiÃ¨re trouvÃ©e.
                      </td>
                    </tr>
                  ) : (
                    filteredMatieres.map((matiere, i) => (
                      <motion.tr 
                        key={matiere.id_matiere}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        variants={tableRowVariants}
                      >
                        <td className="font-semibold text-slate-800">{matiere.nom}</td>
                        <td>
                          <span className="badge badge-blue bg-blue-50 text-blue-600 border border-blue-100">
                            x {matiere.coefficient}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex justify-end gap-2">
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => openEditForm(matiere)} 
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setDeleteTarget(matiere)} 
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

      {/* Modal: Create Matiere */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="logout-modal-backdrop"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="card w-full max-w-lg p-6"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Nouvelle MatiÃ¨re</h3>
              
              {formError && (
                <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Nom de la matiÃ¨re</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))}
                    required
                    placeholder="Ex: MathÃ©matiques"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.coefficient}
                    onChange={(e) => setFormData((prev) => ({ ...prev, coefficient: e.target.value }))}
                    required
                    className="form-input"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={closeCreateForm} className="btn btn-outline" disabled={isSaving}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? 'CrÃ©ation...' : 'CrÃ©er la matiÃ¨re'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Edit Matiere */}
      <AnimatePresence>
        {editTarget && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="logout-modal-backdrop"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="card w-full max-w-lg p-6"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Modifier MatiÃ¨re</h3>
              
              {editFormError && (
                <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} /> {editFormError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Nom de la matiÃ¨re</label>
                  <input
                    type="text"
                    value={editFormData.nom}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, nom: e.target.value }))}
                    required
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editFormData.coefficient}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, coefficient: e.target.value }))}
                    required
                    className="form-input"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setEditTarget(null)} className="btn btn-outline" disabled={isSavingEdit}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSavingEdit}>
                    {isSavingEdit ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Delete Confirmation */}
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
              className="logout-modal-card card"
            >
              <div className="logout-modal-icon">
                <Trash2 size={36} color="#ef4444" />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirmer la suppression</h3>
              <p className="text-slate-500 mb-6">
                Voulez-vous vraiment supprimer la matiÃ¨re <strong className="text-slate-800">{deleteTarget.nom}</strong> ? Cette action est irrÃ©versible.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="btn btn-outline flex-1"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn btn-danger flex-1"
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
