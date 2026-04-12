import { useEffect, useState } from 'react';
import { Save, Printer, UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { professorGet, professorPost } from '../services/professorApi';
import { useAuth } from '../context/AuthContext';

export default function Notes() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [showMatiereField, setShowMatiereField] = useState(true);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [evaluationType, setEvaluationType] = useState('Contrôle 1');
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const getDynamicAppreciation = (value) => {
    const note = Number(value);
    if (!Number.isFinite(note)) return '';
    if (note >= 18) return 'Excellent';
    if (note >= 16) return 'Tres bien';
    if (note >= 14) return 'Bien';
    if (note >= 12) return 'Assez bien';
    if (note >= 10) return 'Passable';
    return 'Insuffisant';
  };

  const getAppreciationStyle = (value) => {
    const note = Number(value);
    if (!Number.isFinite(note)) return 'bg-slate-100 text-slate-500 border-slate-200';
    if (note >= 16) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (note >= 12) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (note >= 10) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const redirectToLogin = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const loadNotes = async (classId, matiereId) => {
    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const data = await professorGet('/api/professeur/notes', {
        class_id: classId,
        matiere_id: matiereId,
      });
      
      setClasses(data.classes || []);
      setMatieres(data.matieres || []);
      setShowMatiereField(Boolean(data.showMatiereField ?? (data.matieres || []).length > 1));
      setStudents((data.students || []).map((student) => ({
        ...student,
        appreciation: getDynamicAppreciation(student.note),
      })));

      if (data.selectedClassId) setSelectedClass(String(data.selectedClassId));
      if (data.selectedMatiereId) setSelectedMatiere(String(data.selectedMatiereId));
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        redirectToLogin();
        return;
      } else if (status === 403) {
        setStatusMsg({ type: 'error', text: 'Acces refuse a cette classe ou matiere.' });
      } else {
        setStatusMsg({ type: 'error', text: 'Impossible de charger la liste des eleves.' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes('', '');
  }, []);

  const updateNote = (id, value) => {
    // Sanitize input: allow only numbers and one decimal dot
    const sanitizedValue = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    if ((sanitizedValue.match(/\./g) || []).length > 1) return;
    
    // Cap maximum at 20
    const numValue = parseFloat(sanitizedValue);
    if (!isNaN(numValue) && numValue > 20) return;

    setStudents(students.map((s) => {
      if (s.id !== id) return s;
      return {
        ...s,
        note: sanitizedValue,
        appreciation: sanitizedValue === '' ? '' : getDynamicAppreciation(sanitizedValue),
      };
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMsg({ type: '', text: '' });
    
    try {
      await professorPost('/api/professeur/notes', {
        classId: Number(selectedClass),
        matiereId: Number(selectedMatiere),
        evaluationType,
        notes: students.map((student) => ({
          studentId: student.id,
          noteId: student.noteId ?? null,
          note: student.note === '' ? null : Number(student.note),
          appreciation: student.note === '' ? null : (student.appreciation || getDynamicAppreciation(student.note)),
        })),
      });

      await loadNotes(selectedClass, selectedMatiere);
      setStatusMsg({ type: 'success', text: 'Les notes ont été enregistrées avec succès.' });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 3500);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        redirectToLogin();
        return;
      } else if (status === 403) {
        setStatusMsg({ type: 'error', text: 'Vous n etes pas assigne a cette classe/matiere.' });
      } else {
        setStatusMsg({ type: 'error', text: 'Echec lors de l enregistrement des notes.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to colorize grade inputs dynamically
  const getGradeStyle = (val) => {
    if (val === '' || val === null || val === undefined) return 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-400 focus:ring-blue-100';
    const n = parseFloat(val);
    if (isNaN(n)) return 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-400';
    if (n >= 14) return 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:border-emerald-500 focus:ring-emerald-100';
    if (n >= 10) return 'bg-orange-50 border-orange-200 text-orange-700 focus:border-orange-500 focus:ring-orange-100';
    return 'bg-red-50 border-red-200 text-red-700 focus:border-red-500 focus:ring-red-100';
  };

  const clearNote = (id) => {
    setStudents(students.map((s) => s.id === id ? { ...s, note: '', appreciation: '' } : s));
  };

  // Framer Motion Variants
  const tableRowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, type: 'spring', stiffness: 100 } })
  };

  return (
    <div className="layout-content relative">
      
      {/* Floating Toast Notification */}
      <AnimatePresence>
        {statusMsg.text && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-4 py-3 bg-white border rounded-xl shadow-lg ${
              statusMsg.type === 'error' ? 'border-red-100' : 'border-emerald-100'
            }`}
          >
            {statusMsg.type === 'error' ? (
              <AlertCircle size={20} className="text-red-500" />
            ) : (
              <CheckCircle2 size={20} className="text-emerald-500" />
            )}
            <span className="text-sm font-bold text-slate-700">{statusMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Saisie des Notes</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez les évaluations et les appréciations de vos classes.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary shadow-[0_4px_14px_rgba(59,130,246,0.25)] disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={isSaving || students.length === 0}
          >
            {isSaving ? (
              <><span className="loading-spinner w-4 h-4 border-white mr-2"></span> Enregistrement...</>
            ) : (
              <><Save size={18} className="mr-2" /> Enregistrer les notes</>
            )}
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-outline bg-white shadow-sm">
            <UploadCloud size={16} /> <span className="hidden sm:inline">Importer Excel</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-outline bg-white shadow-sm">
            <Printer size={16} /> <span className="hidden sm:inline">Imprimer</span>
          </motion.button>
        </div>
      </header>

      {/* Main Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="card p-0 overflow-hidden flex flex-col"
      >
        {/* Filters Toolbar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3 w-full">
            <select
              className="form-select min-w-[220px] !px-4 !py-2.5 rounded-xl border border-slate-300 bg-white shadow-sm"
              value={selectedClass}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedClass(value);
                loadNotes(value, selectedMatiere);
              }}
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>{classe.nom}</option>
              ))}
            </select>
            
            {showMatiereField && (
              <select
                className="form-select min-w-[220px] !px-4 !py-2.5 rounded-xl border border-slate-300 bg-white shadow-sm"
                value={selectedMatiere}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedMatiere(value);
                  loadNotes(selectedClass, value);
                }}
              >
                <option value="">Sélectionner une matière</option>
                {matieres.map((matiere) => (
                  <option key={matiere.id} value={matiere.id}>{matiere.nom}</option>
                ))}
              </select>
            )}
            
            <select
              className="form-select min-w-[220px] !px-4 !py-2.5 rounded-xl border border-slate-300 bg-white shadow-sm"
              value={evaluationType}
              onChange={(e) => setEvaluationType(e.target.value)}
            >
              <option value="Contrôle 1">Contrôle 1</option>
              <option value="Contrôle 2">Contrôle 2</option>
              <option value="Contrôle 3">Contrôle 3</option>
              <option value="Contrôle 4">Contrôle 4</option>
              <option value="TP et Participation">TP / Participation</option>
              <option value="Projet / Exposé">Projet / Exposé</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <span className="loading-spinner border-blue-500 mb-4"></span>
              <p className="text-slate-500 font-medium">Chargement de la liste d'élèves...</p>
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr className="bg-white">
                  <th className="w-12 text-center">N°</th>
                  <th className="w-16">Photo</th>
                  <th>Nom de l'élève</th>
                  <th className="w-32 text-center">Note / 20</th>
                  <th>Appréciation</th>
                  <th className="w-24 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16 text-slate-500">
                      <FileSpreadsheet size={48} className="mx-auto mb-3 opacity-20" />
                      <p className="font-medium text-slate-600">Aucun élève trouvé.</p>
                      <p className="text-sm">Veuillez vérifier vos filtres de sélection.</p>
                    </td>
                  </tr>
                ) : (
                  students.map((s, index) => (
                    <motion.tr 
                      custom={index}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      key={s.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="text-center font-bold text-slate-400">{index + 1}</td>
                      <td>
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                          {s.avatar ? (
                            <img src={s.avatar} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-400 font-bold text-sm">
                              {s.firstName?.charAt(0)}{s.lastName?.charAt(0)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="font-semibold text-slate-800">
                        {s.firstName} {s.lastName}
                        {s.matricule && <span className="block text-xs text-slate-400 font-normal">{s.matricule}</span>}
                      </td>
                      <td>
                        <div className="flex justify-center">
                          <input 
                            type="text" 
                            className={`w-20 text-center font-bold text-lg rounded-lg border focus:outline-none focus:ring-2 transition-all p-2 shadow-inner ${getGradeStyle(s.note)}`} 
                            placeholder="-- . --"
                            value={s.note !== null ? s.note : ''}
                            onChange={(e) => updateNote(s.id, e.target.value)}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getAppreciationStyle(s.note)}`}
                          >
                            {s.note === '' || s.note === null ? '-' : (s.appreciation || getDynamicAppreciation(s.note))}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                          onClick={() => clearNote(s.id)}
                          title="Supprimer la note"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

      </motion.div>
    </div>
  );
}

