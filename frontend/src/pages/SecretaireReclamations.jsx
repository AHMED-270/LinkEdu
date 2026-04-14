import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  MessageSquare,
  Search,
  CheckCircle,
  User,
  Send,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import TableSkeletonRows from '../components/TableSkeletonRows';

const emptyForm = { id_etudiant: '', sujet: '', message: '' };

export default function SecretaireReclamations() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

  const [reclamations, setReclamations] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState(emptyForm);
  const [studentQuery, setStudentQuery] = useState('');
  const [showStudentOptions, setShowStudentOptions] = useState(false);
  const [formError, setFormError] = useState('');

  const searchContainerRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, studentsRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/api/secretaire/reclamations`, { withCredentials: true, withXSRFToken: true }),
        axios.get(`${apiBaseUrl}/api/secretaire/students`, { withCredentials: true, withXSRFToken: true }),
      ]);
      setReclamations(recRes.data?.reclamations || []);
      setStudents(studentsRes.data?.students || []);
    } catch (error) {
      console.error('Erreur lors du chargement des donnees', error);
      setReclamations([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowStudentOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedStudent = useMemo(
    () => students.find((s) => String(s.id_etudiant) === String(form.id_etudiant)) || null,
    [students, form.id_etudiant]
  );

  const studentSuggestions = useMemo(() => {
    const term = studentQuery.trim().toLowerCase();
    if (!term) return students.slice(0, 8);

    return students
      .filter((s) => {
        const fullName = `${s.nom || ''} ${s.prenom || ''}`.toLowerCase();
        return (
          fullName.includes(term)
          || String(s.id_etudiant || '').includes(term)
          || String(s.classe || '').toLowerCase().includes(term)
          || String(s.parent_email || '').toLowerCase().includes(term)
        );
      })
      .slice(0, 8);
  }, [students, studentQuery]);

  const filteredReclamations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return reclamations;

    return reclamations.filter((r) => (
      String(r.sujet || '').toLowerCase().includes(term)
      || String(r.message || '').toLowerCase().includes(term)
      || `${r.parent_nom || ''} ${r.parent_prenom || ''}`.toLowerCase().includes(term)
      || String(r.parent_email || '').toLowerCase().includes(term)
    ));
  }, [reclamations, searchTerm]);

  const onDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette reclamation ?')) return;

    try {
      await axios.get(`${apiBaseUrl}/sanctum/csrf-cookie`, { withCredentials: true, withXSRFToken: true });
      await axios.delete(`${apiBaseUrl}/api/secretaire/reclamations/${id}`, {
        withCredentials: true,
        withXSRFToken: true,
      });
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la suppression de la reclamation', error);
    }
  };

  const onEdit = (reclamation) => {
    setEditingId(reclamation.id_reclamation);
    setForm({
      id_etudiant: '',
      sujet: reclamation.sujet || '',
      message: reclamation.message || '',
    });
    setStudentQuery('');
    setShowStudentOptions(false);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmitReclamation = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.sujet.trim() || !form.message.trim()) {
      setFormError('Veuillez remplir le sujet et le message.');
      return;
    }

    if (!editingId && !form.id_etudiant) {
      setFormError('Veuillez selectionner un eleve.');
      return;
    }

    setIsSubmitLoading(true);
    try {
      await axios.get(`${apiBaseUrl}/sanctum/csrf-cookie`, { withCredentials: true, withXSRFToken: true });

      if (editingId) {
        await axios.put(`${apiBaseUrl}/api/secretaire/reclamations/${editingId}`, {
          sujet: form.sujet,
          message: form.message,
        }, {
          withCredentials: true,
          withXSRFToken: true,
        });
      } else {
        await axios.post(`${apiBaseUrl}/api/secretaire/reclamations`, {
          id_etudiant: Number(form.id_etudiant),
          sujet: form.sujet,
          message: form.message,
        }, {
          withCredentials: true,
          withXSRFToken: true,
        });
      }

      setEditingId(null);
      setForm(emptyForm);
      setStudentQuery('');
      setShowStudentOptions(false);
      await loadData();
    } catch (error) {
      setFormError(error?.response?.data?.message || 'Erreur lors de l envoi de la reclamation.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const selectStudent = (student) => {
    setForm((prev) => ({ ...prev, id_etudiant: String(student.id_etudiant) }));
    setStudentQuery(`${student.nom || ''} ${student.prenom || ''}`.trim());
    setShowStudentOptions(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              Gestion des Reclamations
            </h1>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une reclamation..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent / Sujet</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <TableSkeletonRows rowCount={5} colSpan={4} />
                    ) : filteredReclamations.map((r) => (
                      <tr key={r.id_reclamation} className="hover:bg-blue-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="text-xs font-semibold text-gray-500">
                              {r.date_soumission
                                ? new Date(r.date_soumission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                                : '-'}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">
                              {r.date_soumission
                                ? new Date(r.date_soumission).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                : '-'}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-gray-900 text-sm truncate max-w-[160px]">{r.sujet}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{r.parent_nom} {r.parent_prenom}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{r.parent_email || '-'}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-xs text-gray-600 line-clamp-2 max-w-[280px] italic">
                              "{r.message}"
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => onEdit(r)}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDelete(r.id_reclamation)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))}

                    {!loading && filteredReclamations.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <span className="mb-3 text-gray-200">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                            </span>
                            <p className="text-base font-medium text-gray-500">Aucune réclamation trouvée</p>
                            <p className="text-sm mt-1">Ajustez vos filtres ou effectuez une nouvelle recherche.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-blue-100 shadow-xl shadow-blue-900/5 overflow-hidden sticky top-8">
              <div className="bg-blue-600 p-6 text-white">
                <h3 className="font-bold text-lg">Nouvelle Reclamation</h3>
                <p className="text-blue-100 text-xs mt-1">Selectionnez un eleve. Le message sera envoye a son parent.</p>
              </div>

              <form onSubmit={onSubmitReclamation} className="p-6 space-y-5">
                <div className="relative" ref={searchContainerRef}>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex justify-between">
                    Nom de l eleve
                    {form.id_etudiant && !editingId && (
                      <span className="text-green-500 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Selectionne
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder={editingId ? 'Parent conserve lors de la modification' : 'Rechercher un eleve...'}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-semibold text-gray-800"
                      value={studentQuery}
                      onChange={(e) => {
                        if (editingId) return;
                        setStudentQuery(e.target.value);
                        setShowStudentOptions(true);
                        if (form.id_etudiant) {
                          setForm((prev) => ({ ...prev, id_etudiant: '' }));
                        }
                      }}
                      onFocus={() => !editingId && setShowStudentOptions(true)}
                      disabled={!!editingId}
                    />

                    {showStudentOptions && !editingId && (
                      <div className="absolute z-20 mt-2 w-full max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1">
                        {studentSuggestions.length > 0 ? studentSuggestions.map((student) => (
                          <button
                            key={student.id_etudiant}
                            type="button"
                            onClick={() => selectStudent(student)}
                            className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <span className="text-sm font-bold text-gray-900 block">{student.nom} {student.prenom}</span>
                            <span className="text-[10px] text-gray-400 block">{student.classe || '-'} - Parent: {student.parent_email || 'N/A'}</span>
                          </button>
                        )) : (
                          <div className="px-4 py-3 text-xs text-gray-500">Aucun eleve trouve</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {selectedStudent && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-blue-700">Parent destinataire</p>
                    <p className="text-sm font-semibold text-blue-900 mt-1">{selectedStudent.parent_email || 'Email parent non disponible'}</p>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sujet du message</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-semibold text-gray-800"
                    placeholder="Ex: Absence non justifiee"
                    value={form.sujet}
                    onChange={(e) => setForm((prev) => ({ ...prev, sujet: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Message detaille</label>
                  <textarea
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-medium text-gray-700 min-h-[120px] resize-none"
                    placeholder="Saisissez votre message ici..."
                    value={form.message}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                    required
                  />
                </div>

                {formError && (
                  <p className="text-xs text-red-600 font-medium">{formError}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitLoading || (!editingId && !form.id_etudiant)}
                  className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {editingId ? 'Mettre a jour la reclamation' : 'Envoyer la reclamation'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                      setStudentQuery('');
                      setShowStudentOptions(false);
                      setFormError('');
                    }}
                    className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all"
                  >
                    Annuler la modification
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
