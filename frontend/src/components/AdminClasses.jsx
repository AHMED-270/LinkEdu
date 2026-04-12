import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch as Search, FiPlus as Plus, FiEdit2 as Edit, FiTrash2 as Trash2, FiEye as Eye } from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';

export default function AdminClasses({ onCreateClass, onEditClass, userRole = 'admin' }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [classDetailTarget, setClassDetailTarget] = useState(null);

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
    if (typeof onEditClass === 'function') {
      onEditClass(classe);
    }
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

  // Normalized search
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredClasses = classes.filter((cls) => {
    if (!normalizedSearch) return true;

    return [cls.nom, cls.niveau, cls.students_count, cls.professeurs_count]
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  return (
    <div className="dashboard-content bg-gray-50/50 min-h-screen">
      <header className="content-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
         
          <h1 className="mt-1 flex items-center gap-3 text-4xl lg:text-5xl font-extrabold italic tracking-tight text-slate-900">
            <BiSolidUserDetail className="text-blue-600" />
            Gestion des Classes
          </h1>
        </div>
        {userRole === 'admin' && (
          <button 
            onClick={handleCreateClass}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-slate-200 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Créer une Classe
          </button>
        )}
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
            
            
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une classe..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500 font-semibold italic">Chargement des données...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Détails Classe</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Niveau Scolaire</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Professeurs</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Effectif</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                      Aucune classe ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map(cls => (
                    <tr key={cls.id_classe} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm group-hover:scale-110 transition-transform">
                            {cls.nom.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{cls.nom}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">ID: #{cls.id_classe}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-bold shadow-sm">
                          {cls.niveau}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-black">
                          {cls.professeurs_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black">
                          {cls.students_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setClassDetailTarget(cls)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Voir les détails"
                          >
                            <Eye size={18} />
                          </button>
                          {userRole === 'admin' && (
                            <>
                              <button
                                onClick={() => handleEditClass(cls)}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="Modifier"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => requestDelete(cls)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Supprimer"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && userRole === 'admin' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={40} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 text-center mb-2">Confirmer la suppression</h3>
            <p className="text-slate-500 text-center px-4 leading-relaxed">
              Voulez-vous vraiment supprimer la classe <strong className="text-slate-900 font-extrabold">{deleteTarget.nom}</strong> ? Cette action est irréversible.
            </p>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-200 active:scale-95"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {classDetailTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setClassDetailTarget(null)}></div>
          <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            {/* Modal Header */}
            <div className="px-8 pt-8 pb-6 border-b border-slate-100 bg-gradient-to-br from-blue-50/50 to-white">
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Détails Classe</span>
                <button onClick={() => setClassDetailTarget(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <Plus size={24} className="rotate-45 text-slate-400" />
                </button>
              </div>
              <h2 className="text-4xl font-black text-slate-900 mt-2">{classDetailTarget.nom}</h2>
              <p className="text-slate-500 font-semibold italic flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Niveau Scolaire: {classDetailTarget.niveau}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                  <div className="text-[10px] font-black uppercase tracking-wider text-indigo-400 mb-1">Corps Enseignant</div>
                  <div className="text-2xl font-black text-indigo-600">{classDetailTarget.professeurs_count || 0}</div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1">Nombre d'élèves</div>
                  <div className="text-2xl font-black text-emerald-600">{classDetailTarget.students_count || 0}</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    Professeurs Affectés
                  </h4>
                  {(classDetailTarget.professeurs_details || []).length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
                      Aucun professeur affecté à cette classe.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(classDetailTarget.professeurs_details || []).map((prof) => (
                        <div key={prof.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                              {prof.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-700">{prof.name}</span>
                          </div>
                          {prof.telephone && <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-500">{prof.telephone}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Liste des Étudiants
                  </h4>
                  {(classDetailTarget.effectif_details || []).length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
                      Aucun élève inscrit dans cette classe.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(classDetailTarget.effectif_details || []).map((student) => (
                        <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-xs text-slate-400 uppercase">
                            {student.name.charAt(0)}
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-bold text-slate-700 text-sm truncate">{student.name}</div>
                            {student.matricule && <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">MAT-#{student.matricule}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setClassDetailTarget(null)}
                className="w-full px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm transition-all shadow-lg active:scale-[0.98]"
              >
                FERMER
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
