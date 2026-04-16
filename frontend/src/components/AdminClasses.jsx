import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch as Search, FiPlus as Plus, FiEdit2 as Edit, FiTrash2 as Trash2, FiEye as Eye } from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';
import LinkEduPopup from './LinkEduPopup';
import GlassModal from './GlassModal';

export default function AdminClasses({ onCreateClass, onEditClass, userRole = 'admin' }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [classDetailTarget, setClassDetailTarget] = useState(null);
  const [popupNotice, setPopupNotice] = useState({
    open: false,
    title: '',
    message: '',
    tone: 'info',
  });

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

  const showNotice = (title, message, tone = 'info') => {
    setPopupNotice({
      open: true,
      title,
      message,
      tone,
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
      showNotice('Suppression impossible', error.response?.data?.message || 'Erreur lors de la suppression.', 'danger');
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
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-brand-navy to-brand-teal bg-clip-text text-transparent tracking-tight flex items-center gap-3">
            <BiSolidUserDetail className="text-brand-teal" size={28} />
            Gestion des Classes
          </h1>
        </div>
        {userRole === 'admin' && (
          <button 
            onClick={handleCreateClass}
            className="premium-btn-primary"
          >
            <Plus size={18} /> Créer une Classe
          </button>
        )}
      </header>

      <div className="premium-stat !p-0 overflow-hidden">
          <div className="p-6 border-b border-white/40 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/30 backdrop-blur-sm">
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-teal transition-colors" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une classe..."
                className="premium-input !pl-11"
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
                <tr className="bg-white/10">
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
                    <tr key={cls.id_classe} className="hover:bg-white/20 transition-colors group">
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
                        <span className="px-3 py-1 bg-white/30 border border-slate-200 text-slate-600 rounded-full text-xs font-bold shadow-sm">
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

      {/* Detail Modal */}
      {classDetailTarget && (
        <GlassModal open={Boolean(classDetailTarget)} onClose={() => setClassDetailTarget(null)} panelClassName="max-w-2xl p-0">
          <div className="linkedu-glass-form max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-8 pt-8 pb-6 border-b border-slate-100 bg-gradient-to-br from-blue-50/50 to-white">
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Détails Classe</span>
                <button onClick={() => setClassDetailTarget(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
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
                        <div key={prof.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/20 transition-colors border border-transparent hover:border-slate-100 group">
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
                        <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/20 border border-slate-100">
                          <div className="w-8 h-8 rounded-lg bg-white/30 shadow-sm flex items-center justify-center font-bold text-xs text-slate-400 uppercase">
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
            <div className="p-6 bg-white/20 border-t border-slate-100">
              <button
                onClick={() => setClassDetailTarget(null)}
                className="w-full px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm transition-all shadow-lg active:scale-[0.98]"
              >
                FERMER
              </button>
            </div>
          </div>
        </GlassModal>
      )}

      <LinkEduPopup
        open={Boolean(deleteTarget) && userRole === 'admin'}
        title="Confirmer la suppression"
        message={deleteTarget ? `Voulez-vous vraiment supprimer la classe ${deleteTarget.nom} ? Cette action est irreversible.` : ''}
        tone="danger"
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        onConfirm={handleDelete}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        loading={isDeleting}
      />

      <LinkEduPopup
        open={popupNotice.open}
        title={popupNotice.title}
        message={popupNotice.message}
        tone={popupNotice.tone}
        confirmText="Fermer"
        onClose={() => setPopupNotice((prev) => ({ ...prev, open: false }))}
      />

    </div>
  );
}
