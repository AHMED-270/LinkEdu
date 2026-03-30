import { useEffect, useState } from 'react';
import { Save, Printer, UploadCloud, Search, CheckCircle2, AlertCircle, User, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { professorGet, professorPost } from '../services/professorApi';

export default function Notes() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [evaluationType, setEvaluationType] = useState('ContrÃ´le 1');
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

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
      setStudents(data.students || []);
      
      if (!classId && data.selectedClassId) setSelectedClass(String(data.selectedClassId));
      if (!matiereId && data.selectedMatiereId) setSelectedMatiere(String(data.selectedMatiereId));
    } catch {
      setStatusMsg({ type: 'error', text: 'Impossible de charger la liste des Ã©lÃ¨ves.' });
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

    setStudents(students.map(s => s.id === id ? { ...s, note: sanitizedValue } : s));
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
          note: student.note === '' ? null : Number(student.note),
          appreciation: student.appreciation || null,
        })),
      });

      await loadNotes(selectedClass, selectedMatiere);
      setStatusMsg({ type: 'success', text: 'Les notes ont Ã©tÃ© enregistrÃ©es avec succÃ¨s.' });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 3500);
    } catch {
      setStatusMsg({ type: 'error', text: 'Ã‰chec lors de l\'enregistrement des notes.' });
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
          <p className="text-slate-500 text-sm mt-1">GÃ©rez les Ã©valuations et les apprÃ©ciations de vos classes.</p>
        </div>
        <div className="flex gap-3">
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
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select className="form-select min-w-[200px] shadow-sm" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">SÃ©lectionner une classe</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>{classe.nom} - {classe.niveau}</option>
              ))}
            </select>
            
            <select className="form-select min-w-[180px] shadow-sm" value={selectedMatiere} onChange={(e) => setSelectedMatiere(e.target.value)}>
              <option value="">SÃ©lectionner une matiÃ¨re</option>
              {matieres.map((matiere) => (
                <option key={matiere.id} value={matiere.id}>{matiere.nom}</option>
              ))}
            </select>
            
            <select className="form-select min-w-[160px] shadow-sm" value={evaluationType} onChange={(e) => setEvaluationType(e.target.value)}>
              <option value="ContrÃ´le 1">ContrÃ´le 1</option>
              <option value="ContrÃ´le 2">ContrÃ´le 2</option>
              <option value="ContrÃ´le 3">ContrÃ´le 3</option>
              <option value="Examen Final">Examen Final</option>
              <option value="TP">Travaux Pratiques</option>
              <option value="Projet">Projet / ExposÃ©</option>
            </select>
          </div>
          
          <button 
            className="btn btn-primary w-full md:w-auto shadow-sm" 
            onClick={() => loadNotes(selectedClass, selectedMatiere)}
          >
            <Search size={16} className="mr-2" /> Valider
          </button>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <span className="loading-spinner border-blue-500 mb-4"></span>
              <p className="text-slate-500 font-medium">Chargement de la liste d'Ã©lÃ¨ves...</p>
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr className="bg-white">
                  <th className="w-12 text-center">NÂ°</th>
                  <th className="w-16">Photo</th>
                  <th>Nom de l'Ã©lÃ¨ve</th>
                  <th className="w-32 text-center">Note / 20</th>
                  <th>ApprÃ©ciation (Optionnel)</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16 text-slate-500">
                      <FileSpreadsheet size={48} className="mx-auto mb-3 opacity-20" />
                      <p className="font-medium text-slate-600">Aucun Ã©lÃ¨ve trouvÃ©.</p>
                      <p className="text-sm">Veuillez vÃ©rifier vos filtres de sÃ©lection.</p>
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
                        <input
                          type="text"
                          className="form-input w-full bg-transparent hover:bg-white focus:bg-white transition-colors"
                          placeholder="Ex: Excellent travail..."
                          value={s.appreciation || ''}
                          onChange={(e) => setStudents(students.map((x) => x.id === s.id ? { ...x, appreciation: e.target.value } : x))}
                        />
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-white flex justify-end">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary px-8 shadow-[0_4px_14px_rgba(59,130,246,0.25)] disabled:opacity-70 disabled:cursor-not-allowed" 
            onClick={handleSave}
            disabled={isSaving || students.length === 0}
          >
            {isSaving ? (
              <><span className="loading-spinner w-4 h-4 border-white mr-2"></span> Enregistrement...</>
            ) : (
              <><Save size={18} className="mr-2" /> Enregistrer les notes</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
