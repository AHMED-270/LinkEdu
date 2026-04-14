import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, GraduationCap, FileText, Calendar, 
  Bell, UserCheck, Clock, LifeBuoy, LogOut, AlertCircle, 
  Send, CheckCircle2, ChevronDown, Download, BookOpen
} from 'lucide-react';
import './RolePortal.css'; 
import '../components/DirectoryTimetable.css';

const tabs = [
  { key: 'dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { key: 'enfants', label: 'Mes enfants', icon: Users },
  { key: 'notes', label: 'Notes', icon: GraduationCap },
  { key: 'devoirs', label: 'Devoirs', icon: FileText },
  { key: 'emploi', label: 'Planning', icon: Calendar },
  { key: 'annonces', label: 'Annonces', icon: Bell },
  { key: 'ressources', label: 'Ressources', icon: BookOpen },
  { key: 'professeurs', label: 'Professeurs', icon: UserCheck },
  { key: 'absences', label: 'Absences', icon: Clock },
  { key: 'reclamations', label: 'Reclamations', icon: LifeBuoy },
  { key: 'demandes', label: 'Demandes', icon: Send },
];

const parentRequestTypes = [
  'Attestation de scolarite',
  'Certificat de depart',
  'Recu de paiement',
  'Liste de fournitures',
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
  const [selectedSemestre, setSelectedSemestre] = useState('1');
  
  const [notes, setNotes] = useState([]);
  const [devoirs, setDevoirs] = useState([]);
  const [emploi, setEmploi] = useState([]);
  const [annonces, setAnnonces] = useState([]);
  const [ressources, setRessources] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [demandes, setDemandes] = useState([]);

  // Reclamation state
  const [complaintChildId, setComplaintChildId] = useState('');
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintMessage, setComplaintMessage] = useState('');
  const [isSubmittingReclamation, setIsSubmittingReclamation] = useState(false);
  const [reclamationFeedback, setReclamationFeedback] = useState({ type: '', msg: '' });

  // Demande administrative state
  const [requestType, setRequestType] = useState(parentRequestTypes[0]);
  const [requestChildId, setRequestChildId] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [demandeFeedback, setDemandeFeedback] = useState({ type: '', msg: '' });

  const normalizeTime = (value) => String(value || '').slice(0, 5);
  const timeToMinutes = (value) => {
    const normalized = normalizeTime(value);
    if (!/^\d{2}:\d{2}$/.test(normalized)) return null;
    const [hoursRaw, minutesRaw] = normalized.split(':').map(Number);
    return (hoursRaw * 60) + minutesRaw;
  };
  const addHoursTime = (startTime, durationHours = 1) => {
    const normalized = normalizeTime(startTime);
    if (!/^\d{2}:\d{2}$/.test(normalized)) return normalized;
    const safeDuration = Number.isFinite(Number(durationHours)) ? Number(durationHours) : 1;
    const [hoursRaw, minutesRaw] = normalized.split(':').map(Number);
    const nextHours = (hoursRaw + safeDuration) % 24;
    return `${String(nextHours).padStart(2, '0')}:${String(minutesRaw).padStart(2, '0')}`;
  };
  const addOneHourTime = (startTime) => addHoursTime(startTime, 1);
  const buildCoveredTimeSlots = (startTime, endTime) => {
    const normalizedStart = normalizeTime(startTime);
    const normalizedEnd = normalizeTime(endTime);
    if (!/^\d{2}:\d{2}$/.test(normalizedStart)) return [];
    const startMinutes = timeToMinutes(normalizedStart);
    const endMinutes = timeToMinutes(normalizedEnd);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return [normalizedStart];
    const slots = [];
    let current = normalizedStart;
    let guard = 0;
    while (guard < 24) {
      const currentMinutes = timeToMinutes(current);
      if (currentMinutes === null || currentMinutes >= endMinutes) break;
      slots.push(current);
      current = addHoursTime(current, 1);
      guard += 1;
    }
    return slots.length > 0 ? slots : [normalizedStart];
  };
  const buildHourlySlots = (start = '08:30', count = 10) => {
    const slots = [];
    let current = start;
    for (let index = 0; index < count; index += 1) {
      slots.push(current);
      current = addHoursTime(current, 1);
    }
    return slots;
  };

  const parentName = useMemo(() => {
    const prenom = user?.prenom || '';
    const nom = user?.nom || '';
    return `${prenom} ${nom}`.trim() || user?.name || 'Parent';
  }, [user]);

  const requestDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const selectedComplaintChild = useMemo(
    () => children.find((child) => String(child.id_etudiant) === String(complaintChildId)) || null,
    [children, complaintChildId]
  );
  const selectedRequestChild = useMemo(
    () => children.find((child) => String(child.id_etudiant) === String(requestChildId)) || null,
    [children, requestChildId]
  );

  const tableTimes = useMemo(() => {
    const defaultSlots = buildHourlySlots('08:30', 10);
    const coveredTimes = emploi.flatMap((item) => {
      const startTime = normalizeTime(item?.heure_debut);
      const endTime = normalizeTime(item?.heure_fin) || addHoursTime(startTime, 1);
      return buildCoveredTimeSlots(startTime, endTime);
    });
    const uniqueTimes = [...new Set(coveredTimes.filter((time) => /^\d{2}:\d{2}$/.test(time)))].sort((a, b) => a.localeCompare(b));
    return [...new Set([...defaultSlots, ...uniqueTimes])].sort((a, b) => a.localeCompare(b));
  }, [emploi]);

  const scheduleDataGrid = useMemo(() => {
    const formatted = {};
    emploi.forEach((item) => {
      const day = String(item?.jour || '');
      const startTime = normalizeTime(item?.heure_debut);
      const endTime = normalizeTime(item?.heure_fin) || addHoursTime(startTime, 1);

      if (!day || !/^\d{2}:\d{2}$/.test(startTime)) return;

      const coveredSlots = buildCoveredTimeSlots(startTime, endTime);
      const cardData = {
        id: item.id_edt,
        matiere: item.matiere || 'Matière Inconnue',
        professeur: item.professeur || 'Professeur Inconnu'
      };

      coveredSlots.forEach((slotTime) => {
        if (!formatted[slotTime]) formatted[slotTime] = {};
        formatted[slotTime][day] = cardData;
      });
    });
    return formatted;
  }, [emploi]);

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
        if (data.length > 0 && !complaintChildId) {
          setComplaintChildId(String(data[0].id_etudiant));
        }
        if (data.length > 0 && !requestChildId) {
          setRequestChildId(String(data[0].id_etudiant));
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
          const res = await fetchWithAuth('/api/parent/dashboard' + childQuery);
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
        } else if (activeTab === 'ressources') {
          const res = await fetchWithAuth('/api/parent/ressources' + childQuery);
          setRessources(res.data.ressources ?? []);
        } else if (activeTab === 'professeurs') {
          const res = await fetchWithAuth('/api/parent/professeurs' + childQuery);
          setProfesseurs(res.data.professeurs ?? []);
        } else if (activeTab === 'absences') {
          const res = await fetchWithAuth('/api/parent/absences' + childQuery);
          setAbsences(res.data.absences ?? []);
        } else if (activeTab === 'reclamations') {
          const res = await fetchWithAuth('/api/parent/reclamations');
          setReclamations(res.data.reclamations ?? []);
        } else if (activeTab === 'demandes') {
          const res = await fetchWithAuth('/api/parent/demandes');
          setDemandes(res.data.demandes ?? []);
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
    setIsSubmittingReclamation(true);
    setReclamationFeedback({ type: '', msg: '' });

    if (!complaintChildId) {
      setReclamationFeedback({ type: 'error', msg: 'Veuillez selectionner un eleve.' });
      setIsSubmittingReclamation(false);
      return;
    }

    if (!String(complaintSubject).trim() || !String(complaintMessage).trim()) {
      setReclamationFeedback({ type: 'error', msg: 'Veuillez renseigner le sujet et le message.' });
      setIsSubmittingReclamation(false);
      return;
    }

    try {
      await fetchWithAuth('/api/parent/reclamations', 'post', {
        sujet: complaintSubject.trim(),
        message: complaintMessage.trim(),
        id_etudiant: Number(complaintChildId),
      });

      setComplaintSubject('');
      setComplaintMessage('');
      setReclamationFeedback({ type: 'success', msg: 'Votre reclamation a ete envoyee avec succes.' });

      const refresh = await fetchWithAuth('/api/parent/reclamations');
      setReclamations(refresh.data.reclamations ?? []);

      setTimeout(() => setReclamationFeedback({ type: '', msg: '' }), 4000);
    } catch (err) {
      setReclamationFeedback({ type: 'error', msg: err?.response?.data?.message || 'Echec de l envoi de la reclamation.' });
    } finally {
      setIsSubmittingReclamation(false);
    }
  };

  const submitDemande = async (event) => {
    event.preventDefault();
    setIsSubmittingRequest(true);
    setDemandeFeedback({ type: '', msg: '' });

    if (!requestChildId) {
      setDemandeFeedback({ type: 'error', msg: 'Veuillez selectionner un eleve.' });
      setIsSubmittingRequest(false);
      return;
    }

    try {
      await fetchWithAuth('/api/parent/demandes', 'post', {
        type_demande: requestType,
        id_etudiant: Number(requestChildId),
        message: requestMessage,
      });

      setRequestMessage('');
      setDemandeFeedback({ type: 'success', msg: 'Votre demande a ete envoyee avec succes.' });

      const refresh = await fetchWithAuth('/api/parent/demandes');
      setDemandes(refresh.data.demandes ?? []);
      
      setTimeout(() => setDemandeFeedback({ type: '', msg: '' }), 4000);
    } catch (err) {
      setDemandeFeedback({ type: 'error', msg: err?.response?.data?.message || 'Echec de l envoi de la demande.' });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const downloadAnnonceAttachment = (annonce) => {
    const attachmentUrl = annonce?.attachment_url || annonce?.photo_url;
    if (!attachmentUrl) return;

    const link = document.createElement('a');
    link.href = attachmentUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = `annonce-${annonce?.id_annonce || 'piece-jointe'}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
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
          <LogOut size={16} /> <span className="hidden sm:inline">Déconnexion</span>
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
            {children.length > 0 && activeTab !== 'reclamations' && activeTab !== 'demandes' && activeTab !== 'enfants' && (
              <div className="relative group min-w-[240px] ml-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users size={16} className="text-indigo-500" />
                </div>
                <select
                  className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm appearance-none cursor-pointer outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  value={selectedChildId}
                  onChange={(event) => setSelectedChildId(event.target.value)}
                >
                  <option value="">Tous mes enfants</option>
                  {children.map((child) => (
                    <option key={child.id_etudiant} value={child.id_etudiant}>
                      {child.nom_complet || child.prenom || `Élève ID #${child.id_etudiant}`}
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
                  <div className="flex flex-col gap-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <motion.div variants={cardVariants} className="stat-hero-card azure-gradient shadow-azure">
                        <div className="stat-hero-icon"><Users size={24} /></div>
                        <div className="stat-hero-content">
                          <span className="stat-hero-label">Enfants</span>
                          <span className="stat-hero-value">{dashboard.stats?.nombre_enfants ?? 0}</span>
                        </div>
                      </motion.div>
                      <motion.div variants={cardVariants} className="stat-hero-card emerald-gradient shadow-emerald">
                        <div className="stat-hero-icon"><GraduationCap size={24} /></div>
                        <div className="stat-hero-content">
                          <span className="stat-hero-label">Moyenne G.</span>
                          <span className="stat-hero-value">{dashboard.stats?.moyenne_generale ?? '-'}</span>
                        </div>
                      </motion.div>
                      <motion.div variants={cardVariants} className="stat-hero-card rose-gradient shadow-rose">
                        <div className="stat-hero-icon"><Clock size={24} /></div>
                        <div className="stat-hero-content">
                          <span className="stat-hero-label">Absences</span>
                          <span className="stat-hero-value">{dashboard.stats?.nombre_absences ?? 0}</span>
                        </div>
                      </motion.div>
                      <motion.div variants={cardVariants} className="stat-hero-card orange-gradient-custom shadow-orange-custom">
                        <div className="stat-hero-icon"><LifeBuoy size={24} /></div>
                        <div className="stat-hero-content">
                          <span className="stat-hero-label">Reclamations</span>
                          <span className="stat-hero-value">{dashboard.stats?.reclamations_en_attente ?? 0}</span>
                        </div>
                      </motion.div>
                    </div>

                    <div className="dashboard-main-layout">
                      {/* Main Column: Children Sessions */}
                      <div className="dashboard-col-main space-y-6">
                        <div className="section-card-header mb-2 !border-none !pb-0">
                          <h3><Calendar size={18} className="text-indigo-500" /> Séance(s) du jour pour vos enfants</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {dashboard.enfants?.map((enfant) => (
                            <motion.div key={enfant.id_etudiant} variants={cardVariants} className="card overflow-hidden !border-l-4 !border-l-indigo-500">
                              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                  <h4 className="font-bold text-slate-800">{enfant.nom_complet}</h4>
                                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Classe: {enfant.classe_nom || '-'}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">MAT: {enfant.matricule || '-'}</span>
                                </div>
                              </div>
                              <div className="p-4 bg-white">
                                {enfant.today_sessions?.length === 0 ? (
                                  <p className="text-sm text-slate-400 italic text-center py-2">Pas de séances prévues aujourd'hui.</p>
                                ) : (
                                  <div className="flex flex-col gap-3">
                                    {enfant.today_sessions.map((session, idx) => (
                                      <div key={idx} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-100 transition-colors">
                                        <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded min-w-[90px] text-center">
                                          {normalizeTime(session.heure_debut)} - {normalizeTime(session.heure_fin)}
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm font-bold text-slate-800">{session.matiere}</p>
                                          <p className="text-xs text-slate-500">{session.professeur || '-'}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Side Column: Unified Communication Hub */}
                      <div className="dashboard-col-side">
                        <motion.section variants={cardVariants} className="dashboard-section-card !p-0 overflow-hidden shadow-indigo-sm flex flex-col h-full">
                          {/* Announcement Top Half */}
                          <div className="p-5 bg-gradient-to-br from-indigo-50 to-white border-b border-indigo-100">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="!m-0 flex items-center gap-2"><Bell size={18} className="text-indigo-500" /> École Info</h3>
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Nouveau</span>
                            </div>

                            {dashboard.annonces?.length === 0 ? (
                              <p className="text-xs text-slate-400 py-4 text-center">Aucune annonce pour le moment.</p>
                            ) : (
                              <div className="mini-announcement-highlight bg-white p-4 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                <h5 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                  {dashboard.annonces[0].titre}
                                </h5>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                                  {dashboard.annonces[0].contenu}
                                </p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-[10px] font-bold text-slate-400">{dashboard.annonces[0].date_publication?.substring(0, 10)}</span>
                                  <button onClick={() => setActiveTab('annonces')} className="text-[10px] font-bold text-indigo-600 hover:underline">Détails</button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Complaints Bottom Half */}
                          <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="!m-0 flex items-center gap-2"><LifeBuoy size={18} className="text-orange-500" /> Vos reclamations</h3>
                              <button onClick={() => setActiveTab('reclamations')} className="text-[10px] font-bold text-orange-600 hover:underline">Nouvelle</button>
                            </div>

                            <div className="space-y-3 flex-1">
                              {dashboard.reclamations?.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-6">Aucune reclamation a afficher.</p>
                              ) : (
                                dashboard.reclamations.slice(0, 2).map((rec) => (
                                  <div key={rec.id_reclamation} className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-300">
                                    <div className="flex justify-between items-start mb-1">
                                      <h5 className="text-[11px] font-bold text-slate-800 line-clamp-1">{rec.sujet || rec.objet}</h5>
                                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs uppercase ${
                                        rec.statut === 'rejetee'
                                          ? 'bg-rose-100 text-rose-600'
                                          : rec.statut === 'resolue'
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : rec.statut === 'en_cours'
                                              ? 'bg-blue-100 text-blue-600'
                                              : 'bg-orange-100 text-orange-600'
                                      }`}>
                                        {rec.statut === 'rejetee'
                                          ? 'Refusee'
                                          : rec.statut === 'resolue'
                                            ? 'Acceptee'
                                            : rec.statut === 'en_cours'
                                              ? 'En cours'
                                              : 'En attente'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 line-clamp-1 italic">"{rec.message || 'Aucune remarque'}"</p>
                                  </div>
                                ))
                              )}
                            </div>
                            
                            <button onClick={() => setActiveTab('reclamations')} className="w-full mt-6 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-indigo-500 hover:text-white transition-all duration-300 shadow-xs">
                              Voir tout l'historique
                            </button>
                          </div>
                        </motion.section>
                      </div>
                    </div>
                  </div>
                )}

                {/* === ENFANTS TAB === */}
                {activeTab === 'enfants' && (
                  children.length === 0 ? <EmptyState icon={Users} message="Aucun enfant n'est associé à votre compte." /> :
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children.map((child) => (
                      <motion.div variants={cardVariants} key={child.id_etudiant} className="card p-6 flex items-start gap-4 border-l-4 border-l-indigo-500">
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xl">
                          {(child.prenom?.[0] || child.nom_complet?.[0] || 'E').toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-800 leading-tight">{child.nom_complet || `Élève #${child.id_etudiant}`}</h3>
                          <p className="text-sm text-slate-500 mb-2">{child.email || 'Email non renseigné'}</p>
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
                  <>
                    <div className="mb-4 flex items-center gap-3">
                      <label className="font-bold text-slate-700 text-sm">Semestre:</label>
                      <select 
                        value={selectedSemestre} 
                        onChange={(e) => setSelectedSemestre(e.target.value)}
                        className="form-select w-40 !py-2 !rounded-lg"
                      >
                        <option value="1">Semestre 1</option>
                        <option value="2">Semestre 2</option>
                      </select>
                    </div>
                    {notes.filter(n => (n.semestre ?? '1') === selectedSemestre).length === 0 ? <EmptyState icon={GraduationCap} message="Aucune note disponible pour cet enfant dans ce semestre." /> :
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {notes.filter(n => (n.semestre ?? '1') === selectedSemestre).map((note) => (
                      <motion.div variants={cardVariants} key={note.id_note} className="card p-6 border-t-4 border-t-blue-500">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-slate-800">{note.matiere}</h3>
                            <span className="text-xs text-slate-500">
                              {note.type_evaluation || 'Contrôle'} | Sem: {note.semestre ?? '1'}
                            </span>
                          </div>
                          <span className="badge badge-blue text-lg px-3 py-1">{note.valeur}/20</span>
                        </div>
                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg italic">"{note.appreciation || 'Aucune appréciation.'}"</p>
                      </motion.div>
                    ))}
                  </div>
                  }
                  </>
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
                            <span className="badge bg-orange-50 text-orange-600 border border-orange-100">À faire</span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-2">{devoir.titre}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-auto">
                          <Calendar size={14}/> À rendre avant le : {devoir.date_limite || '-'}
                        </p>
                        {devoir.description && (
                           <p className="text-xs text-slate-400 mt-2 bg-slate-50 p-2 rounded italic">"{devoir.description}"</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* === ANNONCES TAB === */}
                {activeTab === 'annonces' && (
                  annonces.length === 0 ? <EmptyState icon={Bell} message="Aucune annonce disponible pour le moment." /> :
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {annonces.map((annonce) => (
                      <motion.div variants={cardVariants} key={annonce.id_annonce} className="card p-6 border-l-4 border-l-blue-500">
                        <h3 className="font-bold text-slate-800 mb-2">{annonce.titre}</h3>
                        <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap">{annonce.contenu}</p>
                        <p className="text-xs text-slate-500 font-medium">Public cible: {annonce.cible || 'Tous'}</p>
                        <p className="text-xs text-slate-400 mt-1">Publiee le: {annonce.date_publication || '-'}</p>

                        {(annonce.attachment_url || annonce.photo_url) && (
                          <button
                            type="button"
                            onClick={() => downloadAnnonceAttachment(annonce)}
                            className="btn btn-outline mt-4"
                          >
                            <Download size={14} /> Telecharger la piece jointe
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* === RESSOURCES TAB === */}
                {activeTab === 'ressources' && (
                  ressources.length === 0 ? <EmptyState icon={BookOpen} message="Aucune ressource pédagogique disponible." /> :
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ressources.map((res) => (
                      <motion.div variants={cardVariants} key={res.id_ressource} className="card p-5 group hover:border-indigo-200 transition-all flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <span className="badge bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase text-[10px] font-bold tracking-widest">
                            {res.type_ressource || 'DOCUMENT'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{res.date}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2 leading-snug group-hover:text-indigo-600 transition-colors">{res.titre}</h3>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{res.description || 'Pas de description.'}</p>
                        
                        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Matière / Prof</span>
                            <span className="text-[11px] font-bold text-slate-600 truncate max-w-[120px]">
                              {res.matiere || '-'} • {res.professeur || '-'}
                            </span>
                          </div>
                          {res.fichier_url && (
                            <motion.a 
                              whileHover={{ x: 3 }}
                              href={res.fichier_url} target="_blank" rel="noopener noreferrer" 
                              className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                            >
                              <Download size={18} />
                            </motion.a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* === EMPLOI TAB === */}
                {activeTab === 'emploi' && (
                  <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="directory-timetable" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent' }}>
                      <div className="timetable-grid-container" style={{ margin: 0, border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                        <table className="timetable-table">
                          <thead>
                            <tr>
                              <th className="time-col"></th>
                              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => (
                                <th key={day} className={day.toLowerCase() === new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase() ? 'current-day-header' : ''}>{day}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {tableTimes.map(time => (
                              <tr key={time}>
                                <td className="time-cell" style={{ fontWeight: 600 }}>{`${time} - ${addOneHourTime(time)}`}</td>
                                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => {
                                  const cellData = scheduleDataGrid[time]?.[day];
                                  return (
                                    <td key={`${time}-${day}`} className={day.toLowerCase() === new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase() ? 'current-day-col' : ''}>
                                      {cellData ? (
                                        <div className="course-card border-blue" style={{ cursor: 'default' }}>
                                          <strong className="course-subject">{cellData.matiere}</strong>
                                          <div className="course-details">
                                            <span className="course-class">Prof. {cellData.professeur}</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="empty-cell"></div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}

                {/* === ABSENCES TAB === */}
                {activeTab === 'absences' && (
                  absences.length === 0 ? <EmptyState icon={Clock} message="Aucune absence enregistrée. Parfait !" /> :
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {absences.map((absence) => (
                      <motion.div variants={cardVariants} key={absence.id_absence} className="card p-5 border-l-4 border-l-red-500 flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0"><AlertCircle size={20}/></div>
                        <div>
                          <h3 className="font-bold text-slate-800">{absence.date_abs}</h3>
                          <p className="text-xs text-slate-500 font-medium">Motif: {absence.motif || 'Non justifié'}</p>
                          <p className="text-xs text-slate-400 mt-1">Saisi par: {absence.professeur || 'Admin'}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* === PROFESSEURS TAB === */}
                {activeTab === 'professeurs' && (
                  professeurs.length === 0 ? <EmptyState icon={UserCheck} message="Aucun professeur assigné pour le moment." /> :
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
                    <motion.div variants={cardVariants} className="card p-6 lg:w-1/3 h-fit">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
                        <LifeBuoy className="text-indigo-600" size={20} /> Nouvelle reclamation
                      </h3>

                      <AnimatePresence>
                        {reclamationFeedback.msg && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`p-3 rounded-lg text-sm font-medium mb-4 flex items-center gap-2 ${reclamationFeedback.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}
                          >
                            {reclamationFeedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                            {reclamationFeedback.msg}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <form onSubmit={submitReclamation} className="flex flex-col gap-4">
                        <div className="form-group">
                          <label className="form-label">Nom de l eleve</label>
                          <select
                            className="form-input"
                            value={complaintChildId}
                            onChange={(event) => setComplaintChildId(event.target.value)}
                            required
                          >
                            {children.length === 0 && <option value="">Aucun eleve disponible</option>}
                            {children.map((child) => (
                              <option key={child.id_etudiant} value={child.id_etudiant}>
                                {child.nom_complet || `Eleve #${child.id_etudiant}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Classe</label>
                          <input
                            type="text"
                            className="form-input bg-slate-50"
                            value={selectedComplaintChild?.classe || '-'}
                            readOnly
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Objet</label>
                          <input
                            type="text"
                            className="form-input"
                            value={complaintSubject}
                            onChange={(event) => setComplaintSubject(event.target.value)}
                            placeholder="Sujet de la reclamation"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Message</label>
                          <textarea
                            className="form-input resize-none"
                            value={complaintMessage}
                            onChange={(event) => setComplaintMessage(event.target.value)}
                            placeholder="Decrivez votre reclamation..."
                            rows={5}
                            required
                          />
                        </div>

                        <button type="submit" disabled={isSubmittingReclamation || children.length === 0} className="btn btn-primary w-full shadow-sm">
                          {isSubmittingReclamation ? 'Envoi en cours...' : <><Send size={16} className="mr-2" /> Envoyer la reclamation</>}
                        </button>
                      </form>
                    </motion.div>

                    <motion.div variants={cardVariants} className="lg:w-2/3 flex flex-col gap-3">
                      <h3 className="font-bold text-slate-700 mb-2 px-2">Historique des reclamations</h3>
                      {reclamations.length === 0 ? <EmptyState icon={LifeBuoy} message="Aucune reclamation envoyee." /> :
                        reclamations.map((rec) => {
                          const status = String(rec.statut || '').toLowerCase();
                          const statusClass = status === 'rejetee'
                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                            : status === 'resolue'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : status === 'en_cours'
                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                : 'bg-orange-50 text-orange-600 border border-orange-100';
                          const statusLabel = status === 'rejetee'
                            ? 'Refusee'
                            : status === 'resolue'
                              ? 'Acceptee'
                              : status === 'en_cours'
                                ? 'En cours'
                                : 'En attente';

                          return (
                            <div key={rec.id_reclamation} className="card p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                              <div>
                                <h4 className="font-bold text-slate-800">{rec.sujet || 'Sans sujet'}</h4>
                                <p className="text-xs text-slate-500 mt-1">Eleve: {rec.eleve_nom || '-'} | Classe: {rec.classe || '-'}</p>
                                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{rec.message || 'Aucun message.'}</p>
                                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Clock size={12} /> Date: {rec.date_soumission || '-'}</p>
                              </div>
                              <div className="whitespace-nowrap">
                                <span className={`badge ${statusClass}`}>
                                  {statusLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      }
                    </motion.div>
                  </div>
                )}

                {/* === DEMANDES TAB (Form + History) === */}
                {activeTab === 'demandes' && (
                  <div className="flex flex-col lg:flex-row gap-6">
                    <motion.div variants={cardVariants} className="card p-6 lg:w-1/3 h-fit">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
                        <Send className="text-indigo-600" size={20} /> Nouvelle demande
                      </h3>

                      <AnimatePresence>
                        {demandeFeedback.msg && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`p-3 rounded-lg text-sm font-medium mb-4 flex items-center gap-2 ${demandeFeedback.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}
                          >
                            {demandeFeedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                            {demandeFeedback.msg}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <form onSubmit={submitDemande} className="flex flex-col gap-4">
                        <div className="form-group">
                          <label className="form-label">Nom de l eleve</label>
                          <select
                            className="form-input"
                            value={requestChildId}
                            onChange={(event) => setRequestChildId(event.target.value)}
                            required
                          >
                            {children.length === 0 && <option value="">Aucun eleve disponible</option>}
                            {children.map((child) => (
                              <option key={child.id_etudiant} value={child.id_etudiant}>
                                {child.nom_complet || `Eleve #${child.id_etudiant}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Classe</label>
                          <input
                            type="text"
                            className="form-input bg-slate-50"
                            value={selectedRequestChild?.classe || '-'}
                            readOnly
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Date</label>
                          <input type="date" className="form-input bg-slate-50" value={requestDate} readOnly />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Type de demande</label>
                          <select
                            className="form-input"
                            value={requestType}
                            onChange={(event) => setRequestType(event.target.value)}
                            required
                          >
                            {parentRequestTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Cause (optionnel)</label>
                          <textarea
                            className="form-input resize-none"
                            value={requestMessage}
                            onChange={(event) => setRequestMessage(event.target.value)}
                            placeholder="Precisez un detail si necessaire..."
                            rows={4}
                          />
                        </div>

                        <button type="submit" disabled={isSubmittingRequest || children.length === 0} className="btn btn-primary w-full shadow-sm">
                          {isSubmittingRequest ? 'Envoi en cours...' : <><Send size={16} className="mr-2" /> Envoyer la demande</>}
                        </button>
                      </form>
                    </motion.div>

                    <motion.div variants={cardVariants} className="lg:w-2/3 flex flex-col gap-3">
                      <h3 className="font-bold text-slate-700 mb-2 px-2">Historique des demandes</h3>
                      {demandes.length === 0 ? <EmptyState icon={Send} message="Aucune demande envoyee." /> :
                        demandes.map((demande) => {
                          const status = String(demande.statut || '').toLowerCase();
                          const statusClass = status === 'rejetee'
                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                            : status === 'resolue'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : status === 'en_cours'
                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                : 'bg-orange-50 text-orange-600 border border-orange-100';
                          const statusLabel = status === 'rejetee'
                            ? 'Refusee'
                            : status === 'resolue'
                              ? 'Acceptee'
                              : status === 'en_cours'
                                ? 'En cours'
                                : 'En attente';

                          return (
                            <div key={demande.id_demande} className="card p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                              <div>
                                <h4 className="font-bold text-slate-800">{demande.type_demande || 'Demande'}</h4>
                                <p className="text-xs text-slate-500 mt-1">Eleve: {demande.eleve_nom || '-'} | Classe: {demande.classe || '-'}</p>
                                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{demande.message || 'Aucune cause fournie.'}</p>
                                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Clock size={12} /> Date: {demande.date_demande || '-'}</p>
                              </div>
                              <div className="whitespace-nowrap">
                                <span className={`badge ${statusClass}`}>
                                  {statusLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })
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

