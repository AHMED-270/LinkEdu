import { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Search, 
  Filter, 
  Download, 
  Plus,
  UploadCloud,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Inbox,
} from 'lucide-react';
import TableSkeletonRows from '../components/TableSkeletonRows';
import LinkEduPopup from '../components/LinkEduPopup';
import GlassModal from '../components/GlassModal';

const emptyForm = { id_etudiant: '', date_abs: '', motif: 'Medical' };
const allowedJustificationTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const maxJustificationSize = 5 * 1024 * 1024;

export default function SecretaireAbsences() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
  const toLocalISODate = (date) => {
    const d = new Date(date);
    const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000;
    return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
  };

  const shiftISODate = (isoDate, daysDelta) => {
    if (!isoDate) return toLocalISODate(new Date());
    const [year, month, day] = isoDate.split('-').map(Number);
    const baseDate = new Date(year, month - 1, day);
    baseDate.setDate(baseDate.getDate() + daysDelta);
    return toLocalISODate(baseDate);
  };

  const [absences, setAbsences] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [studentQuery, setStudentQuery] = useState('');
  const [showStudentOptions, setShowStudentOptions] = useState(false);
  const [justificationFile, setJustificationFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterClasse, setFilterClasse] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');
  const [selectedDate, setSelectedDate] = useState(() => toLocalISODate(new Date()));
  const [absenceInsightStudent, setAbsenceInsightStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [popupNotice, setPopupNotice] = useState({
    open: false,
    title: '',
    message: '',
    tone: 'info',
  });

  const searchContainerRef = useRef(null);
  const csrfReadyRef = useRef(false);

  const ensureCsrfCookie = async () => {
    if (csrfReadyRef.current) return;
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
    csrfReadyRef.current = true;
  };

  const showNotice = (title, message, tone = 'info') => {
    setPopupNotice({
      open: true,
      title,
      message,
      tone,
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [absencesRes, studentsRes] = await Promise.all([
        axios.get(apiBaseUrl + '/api/secretaire/absences', {
          withCredentials: true,
          withXSRFToken: true,
        }),
        axios.get(apiBaseUrl + '/api/secretaire/students', {
          withCredentials: true,
          withXSRFToken: true,
        }),
      ]);
      setAbsences(absencesRes.data?.absences || []);
      setStudents(studentsRes.data?.students || []);
    } catch (error) {
      console.error(error);
      setAbsences([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    ensureCsrfCookie().catch(() => {
      // No-op: csrf bootstrap will retry before write actions.
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowStudentOptions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setStudentQuery('');
    setShowStudentOptions(false);
    setJustificationFile(null);
    setFileError('');
  };

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
        return fullName.includes(term) || String(s.id_etudiant).includes(term) || (s.classe || '').toLowerCase().includes(term);
      })
      .slice(0, 8);
  }, [students, studentQuery]);

  const selectStudent = (student) => {
    setForm((prev) => ({ ...prev, id_etudiant: String(student.id_etudiant) }));
    setStudentQuery(`${student.nom || ''} ${student.prenom || ''}`.trim());
    setShowStudentOptions(false);
  };

  const handleJustificationChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setFileError('');

    if (!file) {
      setJustificationFile(null);
      return;
    }

    if (!allowedJustificationTypes.includes(file.type)) {
      setJustificationFile(null);
      setFileError('Format non valide. Autorise: PDF, PNG, JPG.');
      event.target.value = '';
      return;
    }

    if (file.size > maxJustificationSize) {
      setJustificationFile(null);
      setFileError('Fichier trop volumineux (max 5MB).');
      event.target.value = '';
      return;
    }

    setJustificationFile(file);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await ensureCsrfCookie();

      if (editingId) {
        await axios.put(`${apiBaseUrl}/api/secretaire/absences/${editingId}`, {
          date_abs: form.date_abs,
          motif: form.motif,
        }, {
          withCredentials: true,
          withXSRFToken: true,
        });
      } else {
        if (!form.id_etudiant) {
          showNotice('Etudiant requis', 'Veuillez selectionner un etudiant depuis la liste.', 'info');
          return;
        }

        await axios.post(apiBaseUrl + '/api/secretaire/absences', {
          id_etudiant: Number(form.id_etudiant),
          date_abs: form.date_abs,
          motif: form.motif,
        }, {
          withCredentials: true,
          withXSRFToken: true,
        });
      }
      await loadData();
      resetForm();
      showNotice(
        editingId ? 'Absence mise a jour' : 'Absence enregistree',
        editingId ? 'La justification a ete modifiee avec succes.' : 'La justification a ete enregistree avec succes.',
        'success'
      );
    } catch(err) {
      console.error(err);
      showNotice('Echec de l action', 'Impossible d enregistrer cette absence.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTargetId) return;
    setDeletingId(deleteTargetId);

    try {
      await ensureCsrfCookie();
      await axios.delete(`${apiBaseUrl}/api/secretaire/absences/${deleteTargetId}`, {
        withCredentials: true,
        withXSRFToken: true,
      });

      setAbsences((prev) => prev.filter((item) => String(item.id_absence) !== String(deleteTargetId)));
      showNotice('Absence supprimee', 'L absence a ete supprimee.', 'success');
    } catch (error) {
      console.error(error);
      showNotice('Suppression impossible', 'Impossible de supprimer cette absence.', 'danger');
    } finally {
      setDeletingId(null);
      setDeleteTargetId(null);
    }
  };

  const stats = useMemo(() => {
    const total = absences.length;
    const nonJustifiees = absences.filter(a => !a.motif || a.motif.trim() === '').length;
    // Mock percentage calculation
    const currentRate = 94.2; 
    return { total, nonJustifiees, currentRate };
  }, [absences]);

  const uniqueClasses = useMemo(() => {
    const classes = absences.map(a => a.classe_nom).filter(Boolean);
    return [...new Set(classes)];
  }, [absences]);

  const getStatus = (motif) => {
    if (!motif || motif.trim() === '') return 'non-justifiee';
    if (motif.toLowerCase().includes('attente')) return 'en-attente';
    return 'justifiee';
  };

  const filteredAbsences = useMemo(() => {
    return absences.filter(a => {
      const nomComplet = `${a.etu_nom || ''} ${a.etu_prenom || ''}`.toLowerCase();
      const searchMatch = nomComplet.includes(searchTerm.toLowerCase());
      const classMatch = filterClasse === 'all' || a.classe_nom === filterClasse;
      const statusMatch = filterStatut === 'all' || getStatus(a.motif) === filterStatut;
      const absenceDate = String(a.date_abs || '').slice(0, 10);
      const dateMatch = !selectedDate || absenceDate === selectedDate;
      return searchMatch && classMatch && statusMatch && dateMatch;
    });
  }, [absences, searchTerm, filterClasse, filterStatut, selectedDate]);

  const motifsType = ["Medical", "Familial", "Transport", "Autre"];

  const toStatusLabel = (motif) => {
    const status = getStatus(motif);
    if (status === 'justifiee') return 'Justifiee';
    if (status === 'en-attente') return 'En attente';
    return 'Non justifiee';
  };

  const escapeCsvValue = (value) => {
    const raw = String(value ?? '');
    if (!/[;"\n\r]/.test(raw)) return raw;
    return `"${raw.replace(/"/g, '""')}"`;
  };

  const handleExportCsv = () => {
    if (filteredAbsences.length === 0) {
      showNotice('Export indisponible', 'Aucune absence a exporter pour les filtres actuels.', 'info');
      return;
    }

    const headers = ['Etudiant', 'ID Etudiant', 'Classe', 'Niveau', 'Date ISO', 'Date', 'Statut', 'Motif'];

    const rows = filteredAbsences.map((a) => {
      const fullName = `${a.etu_nom || ''} ${a.etu_prenom || ''}`.trim();
      const isoDate = String(a.date_abs || '').slice(0, 10);
      const displayDate = a.date_abs
        ? new Date(a.date_abs).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '';

      return [
        fullName,
        a.id_etudiant ?? '',
        a.classe_nom ?? '',
        a.classe_niveau ?? '',
        isoDate,
        displayDate,
        toStatusLabel(a.motif),
        a.motif ?? '',
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(';'))
      .join('\n');

    const datePart = selectedDate || 'toutes-dates';
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `absences-${datePart}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (editingId && selectedStudent) {
      setStudentQuery(`${selectedStudent.nom || ''} ${selectedStudent.prenom || ''}`.trim());
    }
  }, [editingId, selectedStudent]);

  const renderStatusBadge = (motif) => {
    const status = getStatus(motif);
    if (status === 'justifiee') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <CheckCircle className="w-3.5 h-3.5" /> Justifiée
        </span>
      );
    }
    if (status === 'en-attente') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
          <Clock className="w-3.5 h-3.5" /> En attente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <XCircle className="w-3.5 h-3.5" /> Non-justifiée
      </span>
    );
  };

  const buildStudentAbsenceInsight = (absenceRow) => {
    const studentAbsences = absences.filter(
      (entry) => String(entry.id_etudiant) === String(absenceRow.id_etudiant)
    );

    const totalAbsences = studentAbsences.length;
    // Business rule requested: every absence item corresponds to 2 hours.
    const totalHours = totalAbsences * 2;
    // 0.25 point per 2 hours absent.
    const absenceNote = (totalHours / 2) * 0.25;

    setAbsenceInsightStudent({
      id_etudiant: absenceRow.id_etudiant,
      nom: absenceRow.etu_nom || '',
      prenom: absenceRow.etu_prenom || '',
      classe_nom: absenceRow.classe_nom || '-',
      classe_niveau: absenceRow.classe_niveau || '-',
      totalAbsences,
      totalHours,
      absenceNote,
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 font-sans text-gray-900 relative overflow-hidden backdrop-saturate-150">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div className="w-full md:w-auto">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <Calendar className="w-8 h-8 text-brand-teal" />
                Registre des Absences
              </h1>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
            />
          </div>
        </div>

        {/* KPI Cards */}
       
        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Table */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate((prev) => shiftISODate(prev, -1))}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors backdrop-blur-xl border border-white/80 !shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(41,107,116,0.06)] transition-all duration-300"
                  aria-label="Jour précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-44 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal font-medium text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate((prev) => shiftISODate(prev, 1))}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors backdrop-blur-xl border border-white/80 !shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(41,107,116,0.06)] transition-all duration-300"
                  aria-label="Jour suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Filter className="w-4 h-4 text-gray-400" />
                </div>
                <select
                  value={filterClasse}
                  onChange={(e) => setFilterClasse(e.target.value)}
                  className="w-full sm:w-44 pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal appearance-none font-medium text-gray-700"
                >
                  <option value="all">Toutes classes</option>
                  {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="w-full sm:w-36 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal font-medium text-gray-700"
              >
                <option value="all">Statut: Tous</option>
                <option value="non-justifiee">Non-justifiés</option>
                <option value="justifiee">Justifiés</option>
              </select>
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors text-sm font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={filteredAbsences.length === 0}
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden pb-4 backdrop-blur-xl border border-white/80 !shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(41,107,116,0.06)] transition-all duration-300">
              <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-transparent">
                <h2 className="text-lg font-bold text-gray-900">Liste des Absences Récentes</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {selectedDate ? `Jour sélectionné: ${new Date(selectedDate).toLocaleDateString('fr-FR')}` : "Tous les jours"}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Étudiant</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Classe</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Période</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <TableSkeletonRows rowCount={6} colCount={5} />
                    ) : filteredAbsences.length > 0 ? filteredAbsences.map((a) => (
                      <tr key={a.id_absence} className="hover:bg-blue-50/50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-brand-teal flex items-center justify-center font-bold text-sm">
                              {a.etu_nom?.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-sm">
                                {a.etu_nom} {a.etu_prenom}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                ID: #{a.id_etudiant}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-semibold text-gray-700">{a.classe_nom || '-'}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{a.classe_niveau || ''}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-semibold text-gray-800">
                            {new Date(a.date_abs).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Journée complète
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {renderStatusBadge(a.motif)}
                        </td>
                        <td className="py-4 px-6 text-right">
                           <div className="flex items-center justify-end gap-2 text-gray-400">
                             <button
                               onClick={() => buildStudentAbsenceInsight(a)}
                               className="p-1.5 text-gray-700 hover:bg-gray-100 hover:text-black rounded-lg transition-colors"
                               title="Voir le bilan d'absence"
                             >
                               <Eye className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => {
                                 setEditingId(a.id_absence);
                                 setForm({
                                   id_etudiant: String(a.id_etudiant),
                                   date_abs: String(a.date_abs).slice(0, 10),
                                   motif: a.motif || 'Medical'
                                 });
                                 window.scrollTo({ top: 0, behavior: 'smooth' });
                               }}
                               className="p-1.5 text-brand-teal hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                             >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                             </button>
                             <button
                               onClick={() => setDeleteTargetId(a.id_absence)}
                               disabled={deletingId === a.id_absence}
                               className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                             >
                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                             </button>
                           </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <span className="mb-3 text-gray-200">
                               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </span>
                            <p className="text-base font-medium text-gray-500">Aucune absence trouvée</p>
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

          {/* Right Column: Forms & Alerts */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Quick Action Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden backdrop-blur-xl border border-white/80 !shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(41,107,116,0.06)] transition-all duration-300">
              <div className="bg-[#0b4d96] text-white p-5">
                <h3 className="font-bold text-base">Justifier</h3>
                <p className="text-blue-100 text-xs mt-1">Justifier une absence</p>
              </div>
              <div className="p-6">
                <form onSubmit={onSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sélectionner L'étudiant</label>
                    <div className="relative" ref={searchContainerRef}>
                      <input
                        id="student_search_input"
                        type="text"
                        placeholder="Tapez le nom de l'étudiant..."
                        value={studentQuery}
                        onFocus={() => !editingId && setShowStudentOptions(true)}
                        onChange={(e) => {
                          if (editingId) return;
                          setStudentQuery(e.target.value);
                          setForm((prev) => ({ ...prev, id_etudiant: '' }));
                          setShowStudentOptions(true);
                        }}
                        required
                        disabled={!!editingId}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 disabled:opacity-50"
                      />

                      {!editingId && showStudentOptions && (
                        <div className="absolute z-20 mt-2 w-full max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg backdrop-blur-xl border border-white/80 !shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(41,107,116,0.06)] transition-all duration-300">
                          {studentSuggestions.length > 0 ? (
                            studentSuggestions.map((s) => (
                              <button
                                key={s.id_etudiant}
                                type="button"
                                onClick={() => selectStudent(s)}
                                className="w-full px-3 py-2.5 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0 border-gray-100"
                              >
                                <div className="text-sm font-semibold text-gray-800">{s.nom} {s.prenom}</div>
                                <div className="text-xs text-gray-500">ID #{s.id_etudiant} - {s.classe || '-'}</div>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-3 text-xs text-gray-500">Aucun étudiant trouvé</div>
                          )}
                        </div>
                      )}
                    </div>

                    {!editingId && !form.id_etudiant && studentQuery.trim() !== '' && (
                      <p className="mt-1 text-[11px] text-amber-600">Choisissez un étudiant depuis la liste pour valider.</p>
                    )}

                    {!!editingId && selectedStudent && (
                      <p className="mt-1 text-[11px] text-gray-500">Étudiant verrouillé en mode modification: {selectedStudent.nom} {selectedStudent.prenom}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Date de l'absence</label>
                    <input
                      type="date"
                      value={form.date_abs}
                      onChange={(e) => setForm({ ...form, date_abs: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Type de Motif</label>
                    <div className="grid grid-cols-2 gap-2">
                       {motifsType.map(m => (
                         <button
                           key={m}
                           type="button"
                           onClick={() => setForm({ ...form, motif: m })}
                           className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                             form.motif === m 
                              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                           }`}
                         >
                           {m}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pièce justificative</label>
                    <label className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg"
                        className="hidden"
                        onChange={handleJustificationChange}
                      />
                      <div className="w-10 h-10 bg-blue-50 text-brand-teal rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-brand-teal">Importer la pièce justificative</span>
                      <span className="text-[10px] text-gray-400 mt-1">PDF, PNG, JPG (Max 5MB)</span>
                      {justificationFile && (
                        <span className="text-[11px] text-emerald-700 mt-2 font-semibold">{justificationFile.name}</span>
                      )}
                    </label>
                    {fileError && <p className="mt-1 text-[11px] text-red-600">{fileError}</p>}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-brand-teal hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
                    >
                      {isSubmitting ? 'Traitement...' : (editingId ? 'Mettre a jour' : 'Valider la justification')}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Alert Contacts Card */}
            

          </div>
        </div>
      </div>

      {absenceInsightStudent && (
        <GlassModal open={Boolean(absenceInsightStudent)} onClose={() => setAbsenceInsightStudent(null)} panelClassName="max-w-2xl p-0">
          <div className="linkedu-glass-form overflow-hidden">
            <div className="flex items-start justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Bilan d'absence de l'étudiant</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {absenceInsightStudent.nom} {absenceInsightStudent.prenom} - {absenceInsightStudent.classe_nom} ({absenceInsightStudent.classe_niveau})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbsenceInsightStudent(null)}
                className="rounded-lg bg-white p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500">Nombre d'absences</p>
                <p className="mt-2 text-3xl font-black text-blue-700">{absenceInsightStudent.totalAbsences}</p>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-fuchsia-500 via-sky-500 to-emerald-500 p-[1px] shadow-lg">
                <div className="h-full rounded-[11px] bg-white px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Total d'heures</p>
                  <p className="mt-2 text-3xl font-black bg-gradient-to-r from-fuchsia-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
                    {absenceInsightStudent.totalHours} h
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-4 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Note d'absence</p>
                <p className="mt-2 text-3xl font-black text-amber-700">{absenceInsightStudent.absenceNote.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 text-xs text-gray-600">
              Regle de calcul appliquee: 0.25 point pour chaque 2 heures d'absence.
            </div>
          </div>
        </GlassModal>
      )}

      <LinkEduPopup
        open={Boolean(deleteTargetId)}
        title="Confirmer la suppression"
        message="Voulez-vous supprimer cette absence ?"
        tone="danger"
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        onConfirm={onDelete}
        onClose={() => {
          if (!deletingId) setDeleteTargetId(null);
        }}
        loading={Boolean(deletingId)}
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







