import { useEffect, useState } from 'react';
import { 
  Check, X, MessageSquare, Calendar,
  Save, AlertCircle, CheckCircle2, UserCheck, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { professorGet, professorPost } from '../services/professorApi';
import { useAuth } from '../context/AuthContext';

export default function Appel() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [showMatiereField, setShowMatiereField] = useState(true);
  const [seances, setSeances] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const redirectToLogin = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const loadAttendance = async (classId, selectedDate, matiereId = selectedMatiere) => {
    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const data = await professorGet('/api/professeur/appel', {
        class_id: classId,
        matiere_id: matiereId,
        date: selectedDate,
      });
      setClasses(data.classes || []);
      setMatieres(data.matieres || []);
      setShowMatiereField(Boolean(data.showMatiereField ?? (data.matieres || []).length > 1));
      setSeances(data.seances || []);
      setStudents(
        data.students?.map((s) => ({
          ...s,
          status: s.status || 'present',
          seance1Absent: Boolean(s.seance1Absent),
          seance2Absent: Boolean(s.seance2Absent),
        })) || []
      );
      
      if (data.selectedClassId) setSelectedClass(String(data.selectedClassId));
      if (data.selectedMatiereId) setSelectedMatiere(String(data.selectedMatiereId));
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        redirectToLogin();
        return;
      } else if (status === 403) {
        setStatusMsg({ type: 'error', text: 'Acces refuse a cette classe.' });
      } else {
        setStatusMsg({ type: 'error', text: 'Impossible de charger la liste d appel.' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance('', date);
  }, []);

  const updateStatus = (id, status) => {
    setStudents(students.map((student) => {
      if (student.id !== id) {
        return student;
      }

      if (status === 'present') {
        return { ...student, status: 'present', seance1Absent: false, seance2Absent: false };
      }

      const hasSelectedSeance = student.seance1Absent || student.seance2Absent;
      return {
        ...student,
        status: 'absent',
        seance1Absent: hasSelectedSeance ? student.seance1Absent : true,
        seance2Absent: student.seance2Absent,
      };
    }));
  };

  const toggleStudentSeance = (id, seanceKey) => {
    setStudents(students.map((student) => {
      if (student.id !== id) {
        return student;
      }

      const updated = {
        ...student,
        [seanceKey]: !student[seanceKey],
      };

      const hasAbsentSeance = Boolean(updated.seance1Absent || updated.seance2Absent);
      updated.status = hasAbsentSeance ? 'absent' : 'present';
      return updated;
    }));
  };

  const markAllPresent = () => {
    setStudents(students.map((student) => ({
      ...student,
      status: 'present',
      seance1Absent: false,
      seance2Absent: false,
    })));
  };

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const seance1Label = seances?.[0]?.label || 'Seance 1';
  const seance2Label = seances?.[1]?.label || 'Seance 2';

  const handleSave = async () => {
    const invalidStudent = students.find((student) => {
      return student.status === 'absent' && !student.seance1Absent && !student.seance2Absent;
    });

    if (invalidStudent) {
      setStatusMsg({ type: 'error', text: 'Cochez au moins une seance (1 ou 2) pour chaque eleve absent.' });
      return;
    }

    setIsSaving(true);
    try {
      await professorPost('/api/professeur/appel', {
        classId: Number(selectedClass),
        matiereId: Number(selectedMatiere),
        date,
        statuses: students.map((student) => ({
          studentId: student.id,
          status: student.status,
          seance1: Boolean(student.seance1Absent),
          seance2: Boolean(student.seance2Absent),
        })),
      });

      setStatusMsg({ type: 'success', text: 'Feuille d\'appel enregistrée avec succès.' });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
      await loadAttendance(selectedClass, date, selectedMatiere);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        redirectToLogin();
        return;
      } else if (status === 403) {
        setStatusMsg({ type: 'error', text: 'Vous n etes pas assigne a cette classe/matiere.' });
      } else {
        setStatusMsg({ type: 'error', text: 'Echec de l enregistrement.' });
      }
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
            <UserCheck size={16} /> Tout présent
          </motion.button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-0 overflow-hidden flex flex-col">
        {/* Filters Toolbar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-nowrap items-center justify-between gap-3 w-full overflow-x-auto pb-1">
            <div className="flex flex-nowrap items-center gap-3 shrink-0">
              <select
                className="form-select min-w-[220px] shrink-0 !px-4 !py-2.5 rounded-xl border border-slate-300 bg-white shadow-sm"
                value={selectedClass}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedClass(value);
                  loadAttendance(value, date, selectedMatiere);
                }}
              >
                {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              {showMatiereField && (
                <select
                  className="form-select min-w-[220px] shrink-0 !px-4 !py-2.5 rounded-xl border border-slate-300 bg-white shadow-sm"
                  value={selectedMatiere}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedMatiere(value);
                    loadAttendance(selectedClass, date, value);
                  }}
                >
                  {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
              <button
                className="flex items-center justify-center h-9 w-10 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
                onClick={() => {
                  const d = new Date(date);
                  d.setDate(d.getDate() - 1);
                  const newDate = d.toISOString().slice(0, 10);
                  setDate(newDate);
                  loadAttendance(selectedClass, newDate, selectedMatiere);
                }}
                title="Jour précédent"
              >
                <ChevronLeft size={18} />
              </button>

              <input
                type="date"
                className="form-input h-9 w-[140px] px-3 font-semibold text-slate-700 text-sm rounded-xl border border-slate-200 bg-white shadow-sm text-center focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                value={date}
                onChange={(e) => {
                  const value = e.target.value;
                  setDate(value);
                  loadAttendance(selectedClass, value, selectedMatiere);
                }}
              />

              <button
                className="flex items-center justify-center h-9 w-10 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
                onClick={() => {
                  const d = new Date(date);
                  d.setDate(d.getDate() + 1);
                  const newDate = d.toISOString().slice(0, 10);
                  setDate(newDate);
                  loadAttendance(selectedClass, newDate, selectedMatiere);
                }}
                title="Jour suivant"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="flex-1 overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-24">
              <span className="loading-spinner border-blue-500 mb-4"></span>
              <p className="text-slate-500 font-medium">Chargement des élèves...</p>
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="w-12 text-center">N°</th>
                  <th className="w-16">Photo</th>
                  <th>Nom Complet</th>
                  <th className="text-center w-28">{seance1Label}</th>
                  <th className="text-center w-28">{seance2Label}</th>
                  <th className="text-center w-64">Statut de présence</th>
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
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(s.seance1Absent)}
                        onChange={() => toggleStudentSeance(s.id, 'seance1Absent')}
                        className="h-4 w-4 accent-red-600 cursor-pointer"
                        title={`Absent en ${seance1Label}`}
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(s.seance2Absent)}
                        onChange={() => toggleStudentSeance(s.id, 'seance2Absent')}
                        className="h-4 w-4 accent-red-600 cursor-pointer"
                        title={`Absent en ${seance2Label}`}
                      />
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
                          <Check size={14} /> PRÉSENT
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
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Présents</span>
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

