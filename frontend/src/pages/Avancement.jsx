import { useEffect, useState } from 'react';
import { TrendingUp, CheckCircle2, AlertCircle, BookOpen, Layers, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { professorGet, professorPost } from '../services/professorApi';

export default function Avancement() {
  const [classesProgres, setClassesProgres] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [chapActuel, setChapActuel] = useState('');
  const [pct, setPct] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const loadProgress = async () => {
    setLoading(true);
    try {
      const [progressData, notesData] = await Promise.all([
        professorGet('/api/professeur/avancement'),
        professorGet('/api/professeur/notes'),
      ]);

      setClassesProgres(progressData.progress || []);
      setMatieres(notesData.matieres || []);

      if (!selectedClass && progressData.progress?.length > 0) {
        setSelectedClass(String(progressData.progress[0].id));
      }
      if (!selectedMatiere && notesData.matieres?.length > 0) {
        setSelectedMatiere(String(notesData.matieres[0].id));
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Impossible de charger l\'avancement.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg({ type: '', text: '' });

    try {
      await professorPost('/api/professeur/avancement', {
        classId: Number(selectedClass),
        matiereId: Number(selectedMatiere),
        title: chapActuel,
        description: `Mise Ã  jour avancement ${pct}%`,
      });
      
      setStatusMsg({ type: 'success', text: 'Avancement mis Ã  jour avec succÃ¨s.' });
      setChapActuel('');
      setPct(0);
      await loadProgress();
      
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    } catch {
      setStatusMsg({ type: 'error', text: 'Ã‰chec de la mise Ã  jour.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="layout-content relative">
      
      {/* Floating Success/Error Toast */}
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
            {statusMsg.type === 'error' ? <AlertCircle size={20} className="text-red-500" /> : <CheckCircle2 size={20} className="text-emerald-500" />}
            <span className="text-sm font-bold text-slate-700">{statusMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Avancement PÃ©dagogique</h1>
          <p className="text-slate-500 text-sm mt-1">Suivez la progression du programme pour chaque classe.</p>
        </div>
      </header>

      {loading && !classesProgres.length ? (
        <div className="flex flex-col justify-center items-center py-20">
          <span className="loading-spinner border-blue-500 mb-4"></span>
          <p className="text-slate-500 font-medium">Chargement des donnÃ©es...</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 xl:grid-cols-12 gap-8"
        >
          {/* === LEFT COLUMN: UPDATE FORM === */}
          <motion.div variants={cardVariants} className="xl:col-span-5">
            <div className="card p-6 md:p-8 sticky top-24">
              <h3 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={20} /> Actualiser le progrÃ¨s
              </h3>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="form-group">
                  <label className="form-label">Classe concernÃ©e</label>
                  <select className="form-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required>
                    <option value="">SÃ©lectionner une classe</option>
                    {classesProgres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">MatiÃ¨re</label>
                  <select className="form-select" value={selectedMatiere} onChange={(e) => setSelectedMatiere(e.target.value)} required>
                    {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">DerniÃ¨re leÃ§on ou chapitre terminÃ©</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Layers size={16} />
                    </div>
                    <input 
                      type="text" 
                      className="form-input pl-10" 
                      placeholder="Ex: Chapitre 4 : Thermodynamique" 
                      value={chapActuel}
                      onChange={(e) => setChapActuel(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="flex justify-between items-center mb-2">
                    <label className="form-label mb-0">Couverture du programme</label>
                    <span className="text-lg font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{pct}%</span>
                  </div>
                  <div className="flex items-center gap-4 py-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={pct} 
                      onChange={(e) => setPct(parseInt(e.target.value))}
                      className="flex-1 accent-blue-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn btn-primary w-full py-3 mt-4 shadow-[0_4px_14px_rgba(59,130,246,0.25)]"
                >
                  {isSubmitting ? (
                    <><span className="loading-spinner w-4 h-4 border-white mr-2"></span> Enregistrement...</>
                  ) : (
                    <><CheckCircle2 size={18} className="mr-2" /> Enregistrer l'avancement</>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* === RIGHT COLUMN: GLOBAL PROGRESS LIST === */}
          <motion.div variants={cardVariants} className="xl:col-span-7">
            <div className="card p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Target className="text-slate-400" size={20} /> Progression par classe
                </h3>
              </div>
              
              <div className="p-6 flex flex-col gap-6 bg-slate-50/30">
                {classesProgres.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="font-medium text-slate-600">Aucune donnÃ©e de progression disponible.</p>
                  </div>
                ) : (
                  classesProgres.map((c) => (
                    <div key={c.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="font-bold text-slate-800 text-base">{c.name}</span>
                             <span className="badge badge-blue text-[10px] uppercase tracking-widest">{c.matiere}</span>
                          </div>
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <Layers size={12} /> Dernier point : <span className="text-slate-700 italic">"{c.current || 'Non dÃ©fini'}"</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-slate-800">{c.progress}%</span>
                        </div>
                      </div>
                      
                      {/* Animated Progress Bar */}
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-4 border border-slate-50">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${c.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            c.progress > 75 ? 'bg-emerald-500' : c.progress > 40 ? 'bg-blue-500' : 'bg-orange-500'
                          }`}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-tighter">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> {c.completedChap || 0} TerminÃ©s</span>
                          <span className="flex items-center gap-1"><BookOpen size={12} className="text-blue-500" /> {c.totalChap || 0} Total</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          Mise Ã  jour : <Clock size={12}/> {c.updated_at || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
