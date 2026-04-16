import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  ClipboardList,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Send,
  Users,
  MessageSquareText,
  Pencil,
  Ban,
} from 'lucide-react';
import TableSkeletonRows from '../components/TableSkeletonRows';

const emptyForm = {
  id_etudiant: '',
  student_query: '',
  sujet: '',
  message: '',
};

const getStatusMeta = (rawStatus) => {
  const status = String(rawStatus || '').toLowerCase();

  if (status === 'rejetee') {
    return {
      label: 'Refusee',
      badgeClass: 'bg-rose-50 text-rose-600 border border-rose-100',
    };
  }

  if (status === 'resolue') {
    return {
      label: 'Acceptee',
      badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    };
  }

  if (status === 'en_cours') {
    return {
      label: 'En cours',
      badgeClass: 'bg-blue-50 text-blue-600 border border-blue-100',
    };
  }

  return {
    label: 'En attente',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-100',
  };
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const getStudentFullName = (student) => {
  const fullName = `${student?.prenom || ''} ${student?.nom || ''}`.trim();
  return fullName || String(student?.name || '').trim() || 'Eleve';
};

export default function SecretaireReclamations() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

  const [reclamations, setReclamations] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const loadReclamations = async () => {
    setLoading(true);

    try {
      const response = await axios.get(`${apiBaseUrl}/api/secretaire/reclamations`, {
        withCredentials: true,
        withXSRFToken: true,
      });

      setReclamations(response.data?.reclamations || []);
    } catch (error) {
      setReclamations([]);
      setFeedback({
        type: 'error',
        msg: error?.response?.data?.message || 'Impossible de charger les reclamations.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);

    try {
      const response = await axios.get(`${apiBaseUrl}/api/secretaire/students`, {
        withCredentials: true,
        withXSRFToken: true,
      });

      setStudents(response.data?.students || []);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadReclamations();
    loadStudents();
  }, []);

  const selectedStudent = useMemo(() => {
    return students.find((student) => String(student.id_etudiant) === String(form.id_etudiant)) || null;
  }, [students, form.id_etudiant]);

  const studentOptions = useMemo(() => {
    if (editingId) {
      return [];
    }

    const term = normalizeText(form.student_query);
    const baseList = Array.isArray(students) ? students : [];

    if (!term) {
      return baseList.slice(0, 8);
    }

    return baseList
      .filter((student) => {
        const fullName = normalizeText(getStudentFullName(student));
        const classLabel = normalizeText(student?.classe);
        const matricule = normalizeText(student?.matricule);
        const parentName = normalizeText(`${student?.parent_prenom || ''} ${student?.parent_nom || ''}`);
        const email = normalizeText(student?.email);

        return (
          fullName.includes(term)
          || classLabel.includes(term)
          || matricule.includes(term)
          || parentName.includes(term)
          || email.includes(term)
        );
      })
      .slice(0, 8);
  }, [students, form.student_query, editingId]);

  const filteredReclamations = useMemo(() => {
    const term = String(searchTerm || '').trim().toLowerCase();
    if (!term) return reclamations;

    return reclamations.filter((item) => {
      const parentLabel = `${item.parent_nom || ''} ${item.parent_prenom || ''}`.toLowerCase();

      return (
        String(item.sujet || '').toLowerCase().includes(term)
        || String(item.message || '').toLowerCase().includes(term)
        || parentLabel.includes(term)
        || String(item.parent_email || '').toLowerCase().includes(term)
        || String(item.eleve_nom || '').toLowerCase().includes(term)
        || String(item.classe || '').toLowerCase().includes(term)
        || String(item.statut || '').toLowerCase().includes(term)
      );
    });
  }, [reclamations, searchTerm]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    if (name === 'student_query') {
      setForm((previous) => ({
        ...previous,
        student_query: value,
        id_etudiant: '',
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleStudentSelect = (student) => {
    setForm((previous) => ({
      ...previous,
      id_etudiant: String(student.id_etudiant),
      student_query: getStudentFullName(student),
    }));
  };

  const handleEdit = (item) => {
    setEditingId(item.id_reclamation);
    setForm({
      id_etudiant: item.id_etudiant ? String(item.id_etudiant) : '',
      student_query: String(item.eleve_nom || ''),
      sujet: String(item.sujet || ''),
      message: String(item.message || ''),
    });
    setFeedback({ type: '', msg: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: '', msg: '' });

    if (!editingId && !String(form.id_etudiant || '').trim()) {
      setFeedback({ type: 'error', msg: 'Tapez le nom de l eleve puis selectionnez-le dans la liste.' });
      return;
    }

    if (!String(form.sujet || '').trim() || !String(form.message || '').trim()) {
      setFeedback({ type: 'error', msg: 'Renseignez le sujet et le message.' });
      return;
    }

    setSubmitting(true);

    try {
      await axios.get(`${apiBaseUrl}/sanctum/csrf-cookie`, {
        withCredentials: true,
        withXSRFToken: true,
      });

      if (editingId) {
        await axios.put(
          `${apiBaseUrl}/api/secretaire/reclamations/${editingId}`,
          {
            sujet: String(form.sujet).trim(),
            message: String(form.message).trim(),
          },
          {
            withCredentials: true,
            withXSRFToken: true,
          }
        );
      } else {
        await axios.post(
          `${apiBaseUrl}/api/secretaire/reclamations`,
          {
            cible: 'parent',
            id_etudiant: Number(form.id_etudiant),
            sujet: String(form.sujet).trim(),
            message: String(form.message).trim(),
          },
          {
            withCredentials: true,
            withXSRFToken: true,
          }
        );
      }

      await loadReclamations();
      setFeedback({
        type: 'success',
        msg: editingId ? 'Reclamation modifiee avec succes.' : 'Reclamation envoyee au parent avec succes.',
      });
      resetForm();
      setTimeout(() => setFeedback({ type: '', msg: '' }), 3200);
     } catch (error) {
       setFeedback({
         type: 'error',
         msg: error?.response?.data?.message || 'Impossible d enregistrer la reclamation.',
       });
     } finally {
       setSubmitting(false);
     }
   };

  const handleReject = async (item) => {
    if (!item?.id_reclamation) return;

    const normalizedStatus = String(item.statut || '').toLowerCase();
    if (normalizedStatus === 'rejetee') {
      return;
    }

    setActioningId(item.id_reclamation);
    setFeedback({ type: '', msg: '' });

    try {
      await axios.get(`${apiBaseUrl}/sanctum/csrf-cookie`, {
        withCredentials: true,
        withXSRFToken: true,
      });

      await axios.put(
        `${apiBaseUrl}/api/secretaire/reclamations/${item.id_reclamation}/status`,
        { statut: 'rejetee' },
        {
          withCredentials: true,
          withXSRFToken: true,
        }
      );

      setReclamations((previous) => previous.map((entry) => (
        entry.id_reclamation === item.id_reclamation
          ? { ...entry, statut: 'rejetee' }
          : entry
      )));

      setFeedback({ type: 'success', msg: 'Reclamation refusee avec succes.' });
      setTimeout(() => setFeedback({ type: '', msg: '' }), 3000);
    } catch (error) {
      setFeedback({
        type: 'error',
        msg: error?.response?.data?.message || 'Impossible de refuser la reclamation.',
      });
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-brand-teal" />
            Gestion des Reclamations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tapez le nom de l eleve et la reclamation sera automatiquement affectee a son parent.
          </p>
        </div>

        <div className="relative w-full md:w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une reclamation..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/25 focus:border-brand-teal/35"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {feedback.msg && (
        <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${feedback.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
          {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <section className="rounded-3xl border border-slate-200/70 bg-white/95 shadow-[0_16px_45px_rgba(15,39,78,0.08)] backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80">
                  <th className="py-4 px-6 text-xs font-extrabold text-slate-500 uppercase tracking-[0.08em]">Date</th>
                  <th className="py-4 px-6 text-xs font-extrabold text-slate-500 uppercase tracking-[0.08em]">Parent / Sujet</th>
                  <th className="py-4 px-6 text-xs font-extrabold text-slate-500 uppercase tracking-[0.08em]">Message</th>
                  <th className="py-4 px-6 text-xs font-extrabold text-slate-500 uppercase tracking-[0.08em]">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <TableSkeletonRows rowCount={6} colSpan={4} />
                ) : filteredReclamations.map((item) => {
                  const statusMeta = getStatusMeta(item.statut);
                  const isBusy = actioningId === item.id_reclamation;
                  const isRejected = String(item.statut || '').toLowerCase() === 'rejetee';
                  const parentDisplayName = String(item.parent_nom || '').trim() || '-';
                  const subjectDisplay = String(item.sujet || '').trim() || 'Sans sujet';

                  return (
                    <tr key={item.id_reclamation} className="hover:bg-brand-teal/[0.04] transition-colors">
                      <td className="py-4 px-6 align-top">
                        <div className="text-xs font-bold text-slate-600">
                          {item.date_soumission ? new Date(item.date_soumission).toLocaleDateString('fr-FR') : '-'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {item.date_soumission
                            ? new Date(item.date_soumission).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </div>
                      </td>

                      <td className="py-4 px-6 align-top min-w-[270px]">
                        <div className="text-sm font-extrabold text-slate-800">{parentDisplayName}</div>
                        <div className="text-[11px] text-slate-500 mt-1">{item.parent_email || 'Email indisponible'}</div>

                        <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
                          {subjectDisplay}
                        </div>
                      </td>

                      <td className="py-4 px-6 align-top min-w-[250px]">
                        <p className="text-xs text-slate-600 leading-relaxed max-w-sm line-clamp-4">
                          {item.message || 'Aucun message.'}
                        </p>
                      </td>

                      <td className="py-4 px-6 align-top">
                        <div className="flex flex-col gap-2 min-w-[220px]">
                          <span className={`inline-flex w-fit px-2.5 py-1 rounded-lg text-xs font-bold ${statusMeta.badgeClass}`}>
                            {statusMeta.label}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-brand-navy hover:border-brand-teal/35 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Modifier
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReject(item)}
                              disabled={isRejected || isBusy}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                              Refuser
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && filteredReclamations.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <span className="mb-3 text-slate-200">
                          <ClipboardList className="w-10 h-10" />
                        </span>
                        <p className="text-lg font-semibold text-slate-500">Aucune reclamation trouvee</p>
                        <p className="text-sm mt-1">Ajustez vos filtres ou effectuez une nouvelle recherche.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200/70 bg-white/95 shadow-[0_16px_45px_rgba(15,39,78,0.08)] backdrop-blur-md overflow-hidden xl:sticky xl:top-6">
          <div className="bg-gradient-to-br from-brand-navy to-brand-teal px-5 py-5 text-white">
            <h3 className="text-[1.55rem] leading-none font-extrabold tracking-tight">
              {editingId ? 'Modifier Reclamation' : 'Nouvelle Reclamation'}
            </h3>
            <p className="text-sm text-cyan-100 mt-2">
              Saisissez l eleve concerne. Le parent correspondant sera cible automatiquement.
            </p>
          </div>

          <form className="p-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Eleve concerne
              </label>

              <input
                name="student_query"
                type="text"
                autoComplete="off"
                placeholder="Tapez le nom de l eleve..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/65 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal/30 mt-2 disabled:opacity-70"
                value={form.student_query}
                onChange={handleFieldChange}
                disabled={loadingStudents || submitting || Boolean(editingId)}
              />

              {editingId && (
                <p className="text-[11px] text-slate-500 mt-1">L eleve n est pas modifiable pendant la modification.</p>
              )}

              {!editingId && !loadingStudents && form.student_query.trim() !== '' && !form.id_etudiant && studentOptions.length > 0 && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  {studentOptions.map((student) => {
                    const studentName = getStudentFullName(student);
                    const parentName = `${student.parent_prenom || ''} ${student.parent_nom || ''}`.trim() || 'Parent inconnu';

                    return (
                      <button
                        key={student.id_etudiant}
                        type="button"
                        onClick={() => handleStudentSelect(student)}
                        className="w-full px-3 py-2.5 text-left hover:bg-slate-50 transition-colors border-b last:border-b-0 border-slate-100"
                      >
                        <div className="text-sm font-semibold text-slate-700">{studentName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {student.matricule || 'Matricule indisponible'}
                          {student.classe ? ` | ${student.classe}` : ''}
                          {` | Parent: ${parentName}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {!editingId && !loadingStudents && form.student_query.trim() !== '' && !form.id_etudiant && studentOptions.length === 0 && (
                <p className="text-[11px] text-rose-600 mt-1">Aucun eleve ne correspond a votre recherche.</p>
              )}

              {selectedStudent && (
                <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">Cible detectee</p>
                  <p className="text-sm font-semibold text-emerald-900">{getStudentFullName(selectedStudent)}</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Parent: {`${selectedStudent.parent_prenom || ''} ${selectedStudent.parent_nom || ''}`.trim() || 'Parent inconnu'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                Sujet du message
              </label>
              <input
                name="sujet"
                type="text"
                placeholder="Ex: Absence non justifiee"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/65 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal/30 mt-2"
                value={form.sujet}
                onChange={handleFieldChange}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500 flex items-center gap-2">
                <MessageSquareText className="w-3.5 h-3.5" />
                Message detaille
              </label>
              <textarea
                name="message"
                rows={5}
                placeholder="Saisissez votre message ici..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/65 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal/30 mt-2 resize-none"
                value={form.message}
                onChange={handleFieldChange}
                disabled={submitting}
              />
            </div>

            <div className="flex items-center gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-1/3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
              )}

              <button
                type="submit"
                disabled={submitting || (!editingId && loadingStudents)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-teal to-brand-navy px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(20,130,160,0.3)] transition-all hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {editingId ? 'Modifier' : 'Envoyer la reclamation'}
                  </>
                )}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
