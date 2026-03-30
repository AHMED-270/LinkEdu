import { useEffect, useState } from 'react';
import { 
  Check, X, MessageSquare, Calendar, Users, 
  RotateCcw, Save, AlertCircle, CheckCircle2, UserCheck, UserX 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { professorGet, professorPost } from '../services/professorApi';

export default function Appel() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const loadAttendance = async (classId, selectedDate) => {
    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const data = await professorGet('/api/professeur/appel', {
        class_id: classId,
        date: selectedDate,
      });
      setClasses(data.classes || []);
      setMatieres(data.matieres || []);
      setStudents(data.students?.map(s => ({ ...s, status: s.status || 'present' })) || []);
      
      if (!classId && data.selectedClassId) setSelectedClass(String(data.selectedClassId));
      if ((data.matieres || [])[0]?.id && !selectedMatiere) setSelectedMatiere(String(data.matieres[0].id));
    } catch {
      setStatusMsg({ type: 'error', text: 'Impossible de charger la liste d\'appel.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance('', date);
  }, []);

  const updateStatus = (id, status) => {
    setStudents(students.map(s => s.id === id ? { ...s, status } : s));
  };

  const markAllPresent = () => {
    setStudents(students.map(s => ({ ...s, status: 'present' })));
  };

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await professorPost('/api/professeur/appel', {
        classId: Number(selectedClass),
        matiereId: Number(selectedMatiere),
        date,
        statuses: students.map((student) => ({
          studentId: student.id,
          status: student.status,
        })),
      });

      setStatusMsg({ type: 'success', text: 'Feuille d\'appel enregistrÃ©e avec succÃ¨s.' });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
      await loadAttendance(selectedClass, date);
    } catch {
      setStatusMsg({ type: 'error', text: 'Ã‰chec de l\'enregistrement.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Framer Motion Variants
  const rowVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.03 } })
  };

  return (
    <div className="layout-content relative">
      <AnimatePresence>
        {statusMsg.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-4 py-3 bg-white border rounded-xl shadow-lg ${
              statusMsg.type === 'error' ? 'border-red-100' : 'border-emerald-100'
            }`}
          >
            {statusMsg.type === 'error' ? <AlertCircle size={20} className="text-red-500" /> : <CheckCircle2 size={20} className="text-emerald-500" />}
            <span className="text-sm font-bold text-slate-700">{statusMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Feuille d'Appel</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            <Calendar size={14} /> {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={markAllPresent}
            className="btn btn-outline bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50"
          >
            <UserCheck size={16} /> Tout prÃ©sent
          </motion.button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-0 overflow-hidden flex flex-col">
        {/* Filters Toolbar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 flex-1">
            <select className="form-select min-w-[180px] shadow-sm" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom} - {c.niveau}</option>)}
            </select>
            <select className="form-select min-w-[180px] shadow-sm" value={selectedMatiere} onChange={(e) => setSelectedMatiere(e.target.value)}>
              {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
            <input type="date" className="form-input w-auto shadow-sm" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <button className="btn btn-outline bg-white" onClick={() => loadAttendance(selectedClass, date)}>
            <RotateCcw size={16} className="mr-2" /> Actualiser
          </button>
        </div>

        {/* Attendance Table */}
        <div className="flex-1 overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-24">
              <span className="loading-spinner border-blue-500 mb-4"></span>
              <p className="text-slate-500 font-medium">Chargement des Ã©lÃ¨ves...</p>
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="w-12 text-center">NÂ°</th>
                  <th className="w-16">Photo</th>
                  <th>Nom Complet</th>
                  <th className="text-center w-64">Statut de prÃ©sence</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, index) => (
                  <motion.tr 
                    custom={index} variants={rowVariants} initial="hidden" animate="visible"
                    key={s.id} 
                    className={`transition-colors ${s.status === 'absent' ? 'bg-red-50/40' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="text-center font-bold text-slate-400">{index + 1}</td>
                    <td>
                      <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                        {s.avatar ? <img src={s.avatar} className="w-full h-full object-cover" /> : <span className="font-bold text-slate-500 text-xs">{s.firstName[0]}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`font-bold ${s.status === 'absent' ? 'text-red-700' : 'text-slate-800'}`}>
                        {s.firstName} {s.lastName}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-center items-center gap-2">
                        {/* Present Button */}
                        <button 
                          onClick={() => updateStatus(s.id, 'present')}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${
                            s.status === 'present' 
                            ? 'bg-emerald-500 text-white shadow-md' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <Check size={14} /> PRÃ‰SENT
                        </button>

                        {/* Absent Button */}
                        <button 
                          onClick={() => updateStatus(s.id, 'absent')}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${
                            s.status === 'absent' 
                            ? 'bg-red-500 text-white shadow-md' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <X size={14} /> ABSENT
                        </button>

                        {/* Quick SMS Icon (only for absents) */}
                        <div className="w-8 ml-2">
                          <AnimatePresence>
                            {s.status === 'absent' && (
                              <motion.button 
                                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                                className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100"
                                title="Signaler aux parents"
                              >
                                <MessageSquare size={16} />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Summary */}
        <div className="p-5 border-t border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg">{presentCount}</div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">PrÃ©sents</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-lg">{absentCount}</div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Absents</span>
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn btn-primary px-10 py-3 shadow-[0_4px_14px_rgba(59,130,246,0.3)]"
            onClick={handleSave}
            disabled={isSaving || students.length === 0}
          >
            {isSaving ? <span className="loading-spinner w-4 h-4 border-white" /> : <><Save size={18} className="mr-2"/> Valider l'appel</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
