import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit, Trash2, Eye, GraduationCap, Users, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminClassForm from './AdminClassForm';

export default function AdminClasses({ onCreateClass, userRole = 'admin' }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [classDetailTarget, setClassDetailTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

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

  const requestDelete = (classe) => setDeleteTarget(classe);
  const handleEditClass = (classe) => setEditTarget(classe);
  
  const handleCreateClass = () => {
    if (typeof onCreateClass === 'function') onCreateClass();
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

  // Table row waterfall animation
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
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Gestion des Classes</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez les classes, les effectifs et les professeurs assignés.</p>
        </div>
        {userRole === 'admin' && (
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary shadow-[0_4px_14px_rgba(59,130,246,0.25)]"
            onClick={handleCreateClass}
          >
            <Plus size={18} /> Créer une Classe
          </motion.button>
        )}
      </header>

      {/* Main Card Panel */}
      <div className="card">
        <div className="card-header border-b border-slate-100 pb-4 mb-4">
          <h3 className="flex items-center gap-2">
            Toutes les classes <span className="badge badge-blue">{filteredClasses.length}</span>
          </h3>
          
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
            <Search size={16} className="text-slate-400 mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une classe..."
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
                    <th>Niveau</th>
                    <th>Professeurs</th>
                    <th>Effectif</th>
                    <th>Détails</th>
                    {userRole === 'admin' && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan={userRole === 'admin' ? 6 : 5} className="text-center py-12 text-slate-500">
                        <GraduationCap size={32} className="mx-auto mb-3 opacity-20" />
                        Aucune classe trouvée.
                      </td>
                    </tr>
                  ) : (
                    filteredClasses.map((cls, i) => (
                      <motion.tr 
                        key={cls.id_classe}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        variants={tableRowVariants}
                      >
                        <td className="font-semibold text-slate-800">{cls.nom}</td>
                        <td className="text-slate-500 text-sm">{cls.niveau}</td>
                        <td>
                          <span className="badge bg-slate-100 text-slate-700 border border-slate-200">
                            {cls.professeurs_count || 0} profs
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-blue bg-blue-50 text-blue-600 border border-blue-100">
                            {cls.students_count || 0} élèves
                          </span>
                        </td>
                        <td>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setClassDetailTarget(cls)} 
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="Voir les détails"
                          >
                            <Eye size={18} />
                          </motion.button>
                        </td>
                        {userRole === 'admin' && (
                          <td style={{ textAlign: 'right' }}>
                            <div className="flex justify-end gap-2">
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditClass(cls)} 
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                title="Modifier"
                              >
                                <Edit size={16} />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => requestDelete(cls)} 
                                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </motion.button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* 1. Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && userRole === 'admin' && (
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
                Voulez-vous vraiment supprimer la classe <strong className="text-slate-800">{deleteTarget.nom}</strong> ?
              </p>

              <div className="flex gap-3 w-full">
                <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="btn btn-outline flex-1">
                  Annuler
                </button>
                <button type="button" onClick={handleDelete} disabled={isDeleting} className="btn btn-danger flex-1">
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Class Details Modal (Upgraded UI) */}
      <AnimatePresence>
        {classDetailTarget && (
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
              className="card w-full max-w-2xl p-0 overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <GraduationCap className="text-blue-600" /> {classDetailTarget.nom}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Niveau : <span className="font-semibold">{classDetailTarget.niveau}</span></p>
                </div>
                <button onClick={() => setClassDetailTarget(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto">
                {/* Professors List */}
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">
                    <Users size={18} className="text-slate-400" /> 
                    Professeurs <span className="badge badge-gray">{classDetailTarget.professeurs_count || 0}</span>
                  </h4>
                  
                  {(classDetailTarget.professeurs_details || []).length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Aucun professeur affecté.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {classDetailTarget.professeurs_details.map((prof) => (
                        <li key={prof.id} className="flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50 text-sm">
                          <span className="font-semibold text-slate-800">{prof.name || 'Professeur'}</span>
                          {prof.telephone && <span className="text-slate-500 text-xs mt-1">?? {prof.telephone}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Students List */}
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">
                    <User size={18} className="text-slate-400" /> 
                    Effectifs <span className="badge badge-blue">{classDetailTarget.students_count || 0}</span>
                  </h4>
                  
                  {(classDetailTarget.effectif_details || []).length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Aucun élève inscrit.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {classDetailTarget.effectif_details.map((etudiant) => (
                        <li key={etudiant.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-white text-sm">
                          <span className="font-medium text-slate-700">{etudiant.name || 'Élève'}</span>
                          {etudiant.matricule && <span className="text-xs text-slate-400 font-mono">{etudiant.matricule}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button type="button" onClick={() => setClassDetailTarget(null)} className="btn btn-outline">
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Edit Class Form Wrapper */}
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
              className="card w-full max-w-4xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
