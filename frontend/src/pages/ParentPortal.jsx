import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, GraduationCap, FileText, Calendar, 
  Bell, UserCheck, Clock, LifeBuoy, LogOut, AlertCircle, 
  Send, CheckCircle2, ChevronDown
} from 'lucide-react';
import './RolePortal.css'; // Uses the upgraded CSS we made earlier!

const tabs = [
  { key: 'dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { key: 'enfants', label: 'Mes enfants', icon: Users },
  { key: 'notes', label: 'Notes', icon: GraduationCap },
  { key: 'devoirs', label: 'Devoirs', icon: FileText },
  { key: 'emploi', label: 'Planning', icon: Calendar },
  { key: 'annonces', label: 'Annonces', icon: Bell },
  { key: 'professeurs', label: 'Professeurs', icon: UserCheck },
  { key: 'absences', label: 'Absences', icon: Clock },
  { key: 'reclamations', label: 'RÃ©clamations', icon: LifeBuoy },
];

const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000`;
const AUTH_TOKEN_KEY = 'linkedu_token';

const getStoredToken = () => {
  try { return localStorage.getItem(AUTH_TOKEN_KEY); } 
  catch { return null; }
};

export default function ParentPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [dashboard, setDashboard] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  
  const [notes, setNotes] = useState([]);
  const [devoirs, setDevoirs] = useState([]);
  const [emploi, setEmploi] = useState([]);
  const [annonces, setAnnonces] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [reclamations, setReclamations] = useState([]);

  // Reclamation Form State
  const [reclamationSujet, setReclamationSujet] = useState('');
  const [reclamationMessage, setReclamationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reclamationFeedback, setReclamationFeedback] = useState({ type: '', msg: '' });

  const parentName = useMemo(() => {
    const prenom = user?.prenom || '';
    const nom = user?.nom || '';
    return `${prenom} ${nom}`.trim() || user?.name || 'Parent';
  }, [user]);

  const fetchWithAuth = async (path, method = 'get', payload = null) => {
    const token = getStoredToken();
    const isGet = method.toLowerCase() === 'get';

    if (!isGet && !token) {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });
    }

    return axios({
      method,
      url: apiBaseUrl + path,
      data: payload,
      withCredentials: true,
      withXSRFToken: true,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  };

  const childQuery = selectedChildId ? `?child_id=${selectedChildId}` : '';

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const res = await fetchWithAuth('/api/parent/enfants');
        const data = res.data.enfants ?? [];
        setChildren(data);
        if (data.length > 0 && !selectedChildId) {
          setSelectedChildId(String(data[0].id_etudiant));
        }
      } catch {
        // Children are optional for first render.
      }
    };
    loadChildren();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (activeTab === 'dashboard') {
          const res = await fetchWithAuth('/api/parent/dashboard');
          setDashboard(res.data);
        } else if (activeTab === 'enfants') {
          const res = await fetchWithAuth('/api/parent/enfants');
          setChildren(res.data.enfants ?? []);
        } else if (activeTab === 'notes') {
          const res = await fetchWithAuth('/api/parent/notes' + childQuery);
          setNotes(res.data.notes ?? []);
        } else if (activeTab === 'devoirs') {
          const res = await fetchWithAuth('/api/parent/devoirs' + childQuery);
          setDevoirs(res.data.devoirs ?? []);
        } else if (activeTab === 'emploi') {
          const res = await fetchWithAuth('/api/parent/emploi-du-temps' + childQuery);
          setEmploi(res.data.emploi_du_temps ?? []);
        } else if (activeTab === 'annonces') {
          const res = await fetchWithAuth('/api/parent/annonces' + childQuery);
          setAnnonces(res.data.annonces ?? []);
        } else if (activeTab === 'professeurs') {
          const res = await fetchWithAuth('/api/parent/professeurs' + childQuery);
          setProfesseurs(res.data.professeurs ?? []);
        } else if (activeTab === 'absences') {
          const res = await fetchWithAuth('/api/parent/absences' + childQuery);
          setAbsences(res.data.absences ?? []);
        } else if (activeTab === 'reclamations') {
          const res = await fetchWithAuth('/api/parent/reclamations');
          setReclamations(res.data.reclamations ?? []);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Chargement impossible pour le moment.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTab, selectedChildId]);

  const handleLogout = async () => {
    try {
      await fetchWithAuth('/api/admin/logout', 'post');
    } catch {
      // Continue local logout
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const submitReclamation = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setReclamationFeedback({ type: '', msg: '' });

    try {
      await fetchWithAuth('/api/parent/reclamations', 'post', {
        sujet: reclamationSujet,
        message: reclamationMessage,
      });

      setReclamationSujet('');
      setReclamationMessage('');
      setReclamationFeedback({ type: 'success', msg: 'Votre rÃ©clamation a Ã©tÃ© envoyÃ©e avec succÃ¨s.' });

      const refresh = await fetchWithAuth('/api/parent/reclamations');
      setReclamations(refresh.data.reclamations ?? []);
      
      setTimeout(() => setReclamationFeedback({ type: '', msg: '' }), 4000);
    } catch (err) {
      setReclamationFeedback({ type: 'error', msg: err?.response?.data?.message || 'Ã‰chec de l\'envoi de la rÃ©clamation.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Framer Motion Variants
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, staggerChildren: 0.1 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  // Reusable Empty State Component
  const EmptyState = ({ icon: Icon, message }) => (
    <motion.div variants={cardVariants} className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
      <Icon size={48} className="mb-4 opacity-20 text-slate-500" />
      <p className="text-slate-500 font-medium">{message}</p>
    </motion.div>
  );

  return (
    <div className="portal-shell min-h-screen bg-[#F4F7FE] flex flex-col font-sans text-slate-800 pb-12">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {parentName.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-600 tracking-wider uppercase">LinkEdu Parent</p>
            <h1 className="text-lg font-extrabold text-slate-800 leading-tight">Bonjour, {parentName}</h1>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-full transition-colors"
          onClick={handleLogout}
        >
          <LogOut size={16} /> <span className="hidden sm:inline">DÃ©connexion</span>
        </motion.button>
      </header>

      <div className="portal-body">
        <aside className="portal-sidebar">
          <div className="portal-sidebar-brand">
            <h2>LinkEdu Parent</h2>
          </div>

          <div className="portal-profile-card">
            <strong>{parentName}</strong>
            <p>Espace parent</p>
          </div>

          <nav className="portal-sidebar-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={activeTab === tab.key ? 'portal-side-link active' : 'portal-side-link'}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="portal-sidebar-footer">
            <button className="portal-sidebar-logout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Se deconnecter</span>
            </button>
          </div>
        </aside>

        <main className="portal-content max-w-6xl w-full mx-auto px-4 mt-8">
          {/* Toolbar: Child Selector */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            {/* Child Selector */}
            {children.length > 0 && activeTab !== 'dashboard' && activeTab !== 'reclamations' && activeTab !== 'enfants' && (
              <div className="relative group min-w-[240px] ml-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users size={16} className="text-indigo-500" />
                </div>
                <select
                  className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm appearance-none cursor-pointer outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  value={selectedChildId}
                  onChange={(event) => setSelectedChildId(event.target.value)}
                >
                  {children.map((child) => (
                    <option key={child.id_etudiant} value={child.id_etudiant}>
                      Ã‰lÃ¨ve: {child.nom_complet || child.prenom || `ID #${child.id_etudiant}`}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            )}
          </div>

        {/* Content Area */}
        <div className="relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 flex justify-center items-start pt-20 z-20 bg-[#F4F7FE]/50 backdrop-blur-sm">
              <span className="loading-spinner border-indigo-500 w-10 h-10"></span>
            </div>
          )}

          {error && (
            <div className="p-4 mb-6 bg-red-50 text-red-600 border border-red-200 rounded-xl flex items-center gap-3 font-medium">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!loading && !error && (
              <motion.div
                key={activeTab}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                
                {/* === DASHBOARD TAB === */}
                {activeTab === 'dashboard' && dashboard && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div variants={cardVariants} className="card p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Users size={24} /></div>
                      <div><p className="text-xs font-bold text-slate-400 uppercase">Enfants Inscrits</p><h3 className="text-2xl font-black text-slate-800">{dashboard.stats?.nombre_enfants ?? 0}</h3></div>
                    </motion.div>
                    <motion.div variants={cardVariants} className="card p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><GraduationCap size={24} /></div>
                      <div><p className="text-xs font-bold text-slate-400 uppercase">Moyenne G.</p><h3 className="text-2xl font-black text-slate-800">{dashboard.stats?.moyenne_generale ?? '-'}</h3></div>
                    </motion.div>
                    <motion.div variants={cardVariants} className="card p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600"><Clock size={24} /></div>
                      <div><p className="text-xs font-bold text-slate-400 uppercase">Absences</p><h3 className="text-2xl font-black text-slate-800">{dashboard.stats?.nombre_absences ?? 0}</h3></div>
                    </motion.div>
                    <motion.div variants={cardVariants} className="card p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600"><LifeBuoy size={24} /></div>
                      <div><p className="text-xs font-bold text-slate-400 uppercase">RequÃªtes</p><h3 className="text-2xl font-black text-slate-800">{dashboard.stats?.reclamations_en_attente ?? 0}</h3></div>
                    </motion.div>
                  </div>
                )}

                {/* === ENFANTS TAB === */}
                {activeTab === 'enfants' && (
                  children.length === 0 ? <EmptyState icon={Users} message="Aucun enfant n'est associÃ© Ã  votre compte." /> :
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children.map((child) => (
                      <motion.div variants={cardVariants} key={child.id_etudiant} className="card p-6 flex items-start gap-4 border-l-4 border-l-indigo-500">
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xl">
                          {(child.prenom?.[0] || child.nom_complet?.[0] || 'E').toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-800 leading-tight">{child.nom_complet || `Ã‰lÃ¨ve #${child.id_etudiant}`}</h3>
                          <p className="text-sm text-slate-500 mb-2">{child.email || 'Email non renseignÃ©'}</p>
                          <div className="flex gap-2">
                            <span className="badge bg-slate-100 text-slate-600">Classe: {child.classe || '-'}</span>
                            <span className="badge bg-slate-100 text-slate-600">Mat: {child.matricule || '-'}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* === NOTES TAB === */}
                {activeTab === 'notes' && (
                  notes.length === 0 ? <EmptyState icon={GraduationCap} message="Aucune note disponible pour cet enfant." /> :
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notes.map((note) => (
                      <motion.div variants={cardVariants} key={note.id_note} className="card p-6 border-t-4 border-t-blue-500">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-slate-800">{note.matiere}</h3>
                          <span className="badge badge-blue text-lg px-3 py-1">{note.valeur}/20</span>
                        </div>
                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg italic">"{note.appreciation || 'Aucune apprÃ©ciation.'}"</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* === DEVOIRS TAB === */}
                {activeTab === 'devoirs' && (
                  devoirs.length === 0 ? <EmptyState icon={FileText} message="Aucun devoir en cours pour cet enfant." /> :
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {devoirs.map((devoir) => (
                      <motion.div variants={cardVariants} key={devoir.id_devoir} className="card p-6">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{devoir.matiere || '-'}</span>
                          {devoir.soumis ? (
                            <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-100"><CheckCircle2 size={12} className="mr-1"/> Rendu</span>
                          ) : (
                            <span className="badge bg-orange-50 text-orange-600 border border-orange-100">Ã€ faire</span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-2">{devoir.titre}</h3>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-auto">
                          <Calendar size={14}/> Ã€ rendre avant le : {devoir.date_limite || '-'}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* === ABSENCES TAB === */}
                {activeTab === 'absences' && (
                  absences.length === 0 ? <EmptyState icon={Clock} message="Aucune absence enregistrÃ©e. Parfait !" /> :
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {absences.map((absence) => (
                      <motion.div variants={cardVariants} key={absence.id_absence} className="card p-5 border-l-4 border-l-red-500 flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0"><AlertCircle size={20}/></div>
                        <div>
                          <h3 className="font-bold text-slate-800">{absence.date_abs}</h3>
                          <p className="text-xs text-slate-500 font-medium">Motif: {absence.motif || 'Non justifiÃ©'}</p>
                          <p className="text-xs text-slate-400 mt-1">Saisi par: {absence.professeur || 'Admin'}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* === PROFESSEURS TAB === */}
                {activeTab === 'professeurs' && (
                  professeurs.length === 0 ? <EmptyState icon={UserCheck} message="Aucun professeur assignÃ© pour le moment." /> :
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {professeurs.map((prof, index) => (
                      <motion.div variants={cardVariants} key={`${prof.id}-${index}`} className="card p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-lg">
                          {(prof.prenom?.[0] || prof.nom?.[0] || 'P').toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-slate-800 truncate">{`${prof.prenom || ''} ${prof.nom || ''}`.trim() || `Prof #${prof.id}`}</h3>
                          <p className="text-xs font-bold text-indigo-500 truncate mb-1">{prof.matiere || '-'}</p>
                          <p className="text-xs text-slate-500 truncate">{prof.email || '-'}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* === RECLAMATIONS TAB (Form + History) === */}
                {activeTab === 'reclamations' && (
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Form */}
                    <motion.div variants={cardVariants} className="card p-6 lg:w-1/3 h-fit">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
                        <LifeBuoy className="text-indigo-600" size={20} /> Nouvelle requÃªte
                      </h3>
                      
                      <AnimatePresence>
                        {reclamationFeedback.msg && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} 
                            className={`p-3 rounded-lg text-sm font-medium mb-4 flex items-center gap-2 ${reclamationFeedback.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                            {reclamationFeedback.type === 'error' ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>}
                            {reclamationFeedback.msg}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <form onSubmit={submitReclamation} className="flex flex-col gap-4">
                        <div className="form-group">
                          <label className="form-label">Sujet</label>
                          <input type="text" className="form-input" value={reclamationSujet} onChange={(e) => setReclamationSujet(e.target.value)} placeholder="Ex: Absence justifiÃ©e" required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Message</label>
                          <textarea className="form-input resize-none" value={reclamationMessage} onChange={(e) => setReclamationMessage(e.target.value)} placeholder="DÃ©taillez votre demande..." rows={4} required />
                        </div>
                        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full shadow-sm">
                          {isSubmitting ? 'Envoi en cours...' : <><Send size={16} className="mr-2"/> Envoyer</>}
                        </button>
                      </form>
                    </motion.div>

                    {/* History */}
                    <motion.div variants={cardVariants} className="lg:w-2/3 flex flex-col gap-3">
                      <h3 className="font-bold text-slate-700 mb-2 px-2">Historique des requÃªtes</h3>
                      {reclamations.length === 0 ? <EmptyState icon={LifeBuoy} message="Aucune rÃ©clamation envoyÃ©e." /> :
                        reclamations.map((rec) => (
                          <div key={rec.id_reclamation} className="card p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                              <h4 className="font-bold text-slate-800">{rec.sujet}</h4>
                              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{rec.message}</p>
                              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Clock size={12}/> EnvoyÃ© le: {rec.date_soumission || '-'}</p>
                            </div>
                            <div className="whitespace-nowrap">
                              <span className={`badge ${rec.statut?.toLowerCase().includes('traitÃ©') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                {rec.statut || 'En attente'}
                              </span>
                            </div>
                          </div>
                        ))
                      }
                    </motion.div>
                  </div>
                )}
                
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </main>
      </div>
    </div>
  );
}
