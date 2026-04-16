import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { professorGet } from '../services/professorApi';
import usePostLoginReady from '../hooks/usePostLoginReady';
import { Users, BookOpen, FileText, Folder, Calendar, Clock, ChevronRight, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [classes, setClasses] = useState([]);
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await professorGet('/api/professeur/dashboard');
        setStats(data.stats || null);
        setClasses(data.classes || []);
        setSchedule(data.schedule || []);
      } catch (err) {
        const status = err?.response?.status;
        const apiMessage = err?.response?.data?.message;
        setError(`Impossible de charger le tableau de bord ${status ? `(${status})` : ''}${apiMessage ? `: ${apiMessage}` : '.'}`);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  usePostLoginReady(!loading);

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="relative">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Bonjour, {user?.name || 'Professeur'} 👋</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Voici un aperçu de vos activités pour l'année scolaire {stats?.academic_year}.</p>
        </div>
        {stats?.academic_year && (
          <div className="bg-brand-teal text-white px-4 py-2 rounded-xl shadow-md flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold opacity-80">Année Académique</span>
            <span className="text-lg font-black leading-none">{stats.academic_year}</span>
          </div>
        )}
      </header>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <span className="loading-spinner border-brand-teal mb-4"></span>
          <p className="text-slate-500 font-medium">Chargement de votre tableau de bord...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 font-medium bg-red-50 rounded-xl border border-red-100">
          {error}
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-8"
        >
          {/* === TOP ROW: STAT CARDS === */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <motion.div variants={itemVariants} className="stat-card p-6 flex items-center gap-4 transition-colors">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                <Users size={28} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Total Élèves</p>
                <h3 className="text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>{stats?.total_eleves ?? 0}</h3>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="stat-card p-6 flex items-center gap-4 transition-colors">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--bg-main)', color: 'var(--secondary-color)' }}>
                <BookOpen size={28} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Classes Actives</p>
                <h3 className="text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>{stats?.total_classes ?? 0}</h3>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="stat-card p-6 flex items-center gap-4 transition-colors">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(242, 153, 74, 0.1)', color: 'var(--accent-orange)' }}>
                <FileText size={28} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Devoirs Actifs</p>
                <h3 className="text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>{stats?.devoirs_actifs ?? 0}</h3>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="stat-card p-6 flex items-center gap-4 transition-colors">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(39, 174, 96, 0.1)', color: 'var(--accent-green)' }}>
                <Folder size={28} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Ressources</p>
                <h3 className="text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>{stats?.ressources_partagees ?? 0}</h3>
              </div>
            </motion.div>
          </div>

          {/* === BOTTOM SECTION: SPLIT VIEW === */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Schedule/Prochains Cours */}
            <motion.div variants={itemVariants} className="card p-0 flex flex-col overflow-hidden h-full">
              <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="text-blue-500" size={20} /> Prochains cours
                </h3>
              </div>
              <div className="p-6 flex-1 bg-slate-50/50">
                {schedule.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Calendar size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="font-medium text-slate-600">Aucun cours prévu prochainement.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {schedule
                      .filter(line => line.jour.toLowerCase() === new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase())
                      .map((line) => (
                      <div key={line.id_edt} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                        <div className="flex flex-col items-center justify-center min-w-[60px] px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">
                          <span className="text-xs font-bold uppercase">{line.jour.substring(0, 3)}</span>
                          <span className="font-black text-lg leading-tight">{line.heure_debut.split(':')[0]}h</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{line.matiere_nom}</h4>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <span className="badge bg-slate-100 text-slate-700 border-none px-2 py-0.5">{line.classe_nom}</span>
                            <span className="flex items-center gap-1"><Clock size={12}/> {line.heure_debut} - {line.heure_fin}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {schedule.filter(line => line.jour.toLowerCase() === new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase()).length === 0 && (
                      <p className="text-slate-500 font-medium text-center">Aucun cours aujourd'hui.</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right: Classes Summary */}
            <motion.div variants={itemVariants} className="card p-0 flex flex-col overflow-hidden h-full">
              <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="text-indigo-500" size={20} /> Mes Classes
                </h3>
                <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  Voir tout <ChevronRight size={16} />
                </button>
              </div>
              <div className="p-0 flex-1">
                {classes.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 bg-slate-50/50 h-full">
                    <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="font-medium text-slate-600">Aucune classe assignée.</p>
                  </div>
                ) : (
                  <table className="table w-full m-0">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4">Nom de la classe</th>
                        <th className="px-6 py-4 text-center">Effectif</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                          <td className="px-6 py-4 font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {c.name}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-full text-sm">
                              <Users size={14} className="text-slate-400" /> {c.total}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </div>
  );
}



