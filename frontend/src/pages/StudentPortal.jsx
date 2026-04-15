import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, GraduationCap, FileText, Calendar, FolderOpen, Bell, Download, Eye, X, Clock, BookOpen, AlertCircle, User, LogOut } from 'lucide-react';
import Parametres from './Parametres';
import './RolePortal.css';
import '../components/DirectoryTimetable.css';

const tabs = [
  { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { key: 'notes', label: 'Notes', icon: GraduationCap },
  { key: 'devoirs', label: 'Devoirs', icon: FileText },
  { key: 'emploi', label: 'Emploi du temps', icon: Calendar },
  { key: 'ressources', label: 'Ressources', icon: FolderOpen },
  { key: 'annonces', label: 'Annonces', icon: Bell },
  { key: 'profil', label: 'Profil', icon: User },
];

const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000`;
const AUTH_TOKEN_KEY = 'linkedu_token';

const getStoredToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

const clearStoredToken = () => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignore storage failures in restricted browser modes.
  }
};

const resolveNoteControlLabel = (note) => {
  const rawType = String(note?.type_evaluation || '').trim();
  const numberMatch = rawType.match(/(\d+)/);

  if (numberMatch) {
    return `Controle ${numberMatch[1]}`;
  }

  if (rawType) {
    return rawType;
  }

  return `Controle ${note?.id_note || '-'}`;
};

const resolveNoteToneClass = (value) => {
  const note = Number(value);
  if (!Number.isFinite(note)) return 'portal-note-tone-low';
  if (note >= 14) return 'portal-note-tone-high';
  if (note >= 10) return 'portal-note-tone-mid';
  return 'portal-note-tone-low';
};

const normalizeMatiereLabel = (value) => {
  const safe = String(value || '').trim();
  return safe !== '' ? safe : 'Non precisee';
};

const formatDateValue = (value) => {
  const safe = String(value || '').trim();
  return safe !== '' ? safe : '-';
};

const resolveDateTimestamp = (value) => {
  const parsed = Date.parse(String(value || ''));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatLocalDateKey = (dateValue) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
  const day = String(dateValue.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const resolveDateKey = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return formatLocalDateKey(parsed);
};

const isDeadlineReached = (value) => {
  const deadlineDateKey = resolveDateKey(value);
  if (!deadlineDateKey) return false;

  const todayKey = formatLocalDateKey(new Date());
  return deadlineDateKey <= todayKey;
};

const WEEKDAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const WEEKDAY_KEY_TO_LABEL = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche',
};

const WEEKDAY_ALIASES = {
  lundi: 'lundi',
  lun: 'lundi',
  monday: 'lundi',
  mon: 'lundi',
  1: 'lundi',
  mardi: 'mardi',
  mar: 'mardi',
  tuesday: 'mardi',
  tue: 'mardi',
  2: 'mardi',
  mercredi: 'mercredi',
  mer: 'mercredi',
  wednesday: 'mercredi',
  wed: 'mercredi',
  3: 'mercredi',
  jeudi: 'jeudi',
  jeu: 'jeudi',
  thursday: 'jeudi',
  thu: 'jeudi',
  4: 'jeudi',
  vendredi: 'vendredi',
  ven: 'vendredi',
  friday: 'vendredi',
  fri: 'vendredi',
  5: 'vendredi',
  samedi: 'samedi',
  sam: 'samedi',
  saturday: 'samedi',
  sat: 'samedi',
  6: 'samedi',
  dimanche: 'dimanche',
  dim: 'dimanche',
  sunday: 'dimanche',
  sun: 'dimanche',
  0: 'dimanche',
  7: 'dimanche',
};

const normalizeDayToken = (value) => {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

const resolveWeekdayKey = (value) => {
  const token = normalizeDayToken(value);
  if (!token) return '';

  if (WEEKDAY_ALIASES[token]) {
    return WEEKDAY_ALIASES[token];
  }

  const firstToken = token.split(' ')[0];
  return WEEKDAY_ALIASES[firstToken] ?? '';
};

const resolveWeekdayLabel = (value) => {
  const key = resolveWeekdayKey(value);
  return key ? WEEKDAY_KEY_TO_LABEL[key] : '';
};

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

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const EmptyState = ({ icon: Icon, message }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: '#94a3b8', backgroundColor: 'white', borderRadius: '1rem', border: '1px dashed #e2e8f0' }}>
    <Icon size={48} style={{ marginBottom: '1.25rem', opacity: 0.4 }} />
    <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>{message}</p>
  </div>
);

export default function StudentPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [notes, setNotes] = useState([]);
  const [devoirs, setDevoirs] = useState([]);
  const [emploi, setEmploi] = useState([]);
  const [ressources, setRessources] = useState([]);
  const [annonces, setAnnonces] = useState([]);
  const [selectedSemestre, setSelectedSemestre] = useState('1');
  const [selectedNoteMatiere, setSelectedNoteMatiere] = useState('all');
  const [selectedDevoirMatiere, setSelectedDevoirMatiere] = useState('all');
  const [selectedRessourceMatiere, setSelectedRessourceMatiere] = useState('all');
  const [showDevoirHistory, setShowDevoirHistory] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);

  const [selectedFiles, setSelectedFiles] = useState({});
  const [submitFeedback, setSubmitFeedback] = useState({});

  const studentName = useMemo(() => {
    const prenom = user?.prenom || '';
    const nom = user?.nom || '';
    return `${prenom} ${nom}`.trim() || user?.name || 'Etudiant';
  }, [user]);

  const notesBySemestre = useMemo(() => {
    return notes.filter((note) => String(note?.semestre ?? '1') === String(selectedSemestre));
  }, [notes, selectedSemestre]);

  const noteMatieres = useMemo(() => {
    return [...new Set(notesBySemestre.map((note) => normalizeMatiereLabel(note?.matiere)))].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [notesBySemestre]);

  const notesFiltered = useMemo(() => {
    return notesBySemestre.filter((note) => {
      if (selectedNoteMatiere === 'all') return true;
      return normalizeMatiereLabel(note?.matiere) === selectedNoteMatiere;
    });
  }, [notesBySemestre, selectedNoteMatiere]);

  const devoirMatieres = useMemo(() => {
    return [...new Set(devoirs.map((devoir) => normalizeMatiereLabel(devoir?.matiere)))].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [devoirs]);

  const devoirsFiltered = useMemo(() => {
    return devoirs.filter((devoir) => {
      if (selectedDevoirMatiere === 'all') return true;
      return normalizeMatiereLabel(devoir?.matiere) === selectedDevoirMatiere;
    });
  }, [devoirs, selectedDevoirMatiere]);

  const isDevoirHistorique = (devoir) => {
    if (devoir?.soumission) return true;
    if (devoir?.is_overdue) return true;
    return isDeadlineReached(devoir?.date_limite);
  };

  const devoirsActifs = useMemo(() => {
    return devoirsFiltered.filter((devoir) => !isDevoirHistorique(devoir));
  }, [devoirsFiltered]);

  const devoirsHistoriques = useMemo(() => {
    return devoirsFiltered.filter((devoir) => isDevoirHistorique(devoir));
  }, [devoirsFiltered]);

  const devoirsDisplayed = showDevoirHistory ? devoirsHistoriques : devoirsActifs;

  const resourceMatieres = useMemo(() => {
    return [...new Set(ressources.map((resource) => normalizeMatiereLabel(resource?.matiere)))].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [ressources]);

  const ressourcesFiltered = useMemo(() => {
    return ressources
      .filter((resource) => {
        if (selectedRessourceMatiere === 'all') return true;
        return normalizeMatiereLabel(resource?.matiere) === selectedRessourceMatiere;
      })
      .sort((a, b) => {
        const timestampDiff = resolveDateTimestamp(b?.date) - resolveDateTimestamp(a?.date);
        if (timestampDiff !== 0) return timestampDiff;

        return Number(b?.id_ressource || 0) - Number(a?.id_ressource || 0);
      });
  }, [ressources, selectedRessourceMatiere]);

  useEffect(() => {
    if (selectedNoteMatiere !== 'all' && !noteMatieres.includes(selectedNoteMatiere)) {
      setSelectedNoteMatiere('all');
    }
  }, [selectedNoteMatiere, noteMatieres]);

  useEffect(() => {
    if (selectedDevoirMatiere !== 'all' && !devoirMatieres.includes(selectedDevoirMatiere)) {
      setSelectedDevoirMatiere('all');
    }
  }, [selectedDevoirMatiere, devoirMatieres]);

  useEffect(() => {
    if (selectedRessourceMatiere !== 'all' && !resourceMatieres.includes(selectedRessourceMatiere)) {
      setSelectedRessourceMatiere('all');
    }
  }, [selectedRessourceMatiere, resourceMatieres]);

  useEffect(() => {
    if (!selectedAnnonce) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        setSelectedAnnonce(null);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeydown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [selectedAnnonce]);

  const requestWithAuthConfig = async (path, method = 'get', payload = null, forceCookieOnly = false) => {
    const token = forceCookieOnly ? null : getStoredToken();
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

  const fetchWithAuth = async (path, method = 'get', payload = null) => {
    try {
      return await requestWithAuthConfig(path, method, payload, false);
    } catch (error) {
      const status = error?.response?.status;
      const hasToken = Boolean(getStoredToken());

      if (hasToken && (status === 401 || status === 419)) {
        clearStoredToken();
        return requestWithAuthConfig(path, method, payload, true);
      }

      throw error;
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (activeTab === 'dashboard') {
          const res = await fetchWithAuth('/api/etudiant/dashboard');
          setDashboard(res.data);
        }

        if (activeTab === 'notes') {
          const res = await fetchWithAuth('/api/etudiant/notes');
          setNotes(res.data.notes ?? []);
        }

        if (activeTab === 'devoirs') {
          const res = await fetchWithAuth('/api/etudiant/devoirs');
          setDevoirs(res.data.devoirs ?? []);
        }

        if (activeTab === 'emploi') {
          const res = await fetchWithAuth('/api/etudiant/emploi-du-temps');
          setEmploi(res.data.emploi_du_temps ?? []);
        }

        if (activeTab === 'ressources') {
          const res = await fetchWithAuth('/api/etudiant/ressources');
          setRessources(res.data.ressources ?? []);
        }

        if (activeTab === 'annonces') {
          const res = await fetchWithAuth('/api/etudiant/annonces');
          setAnnonces(res.data.annonces ?? []);
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 419) {
          setError('Session expiree. Veuillez vous reconnecter.');
        } else {
          setError(err?.response?.data?.message || err?.message || 'Chargement impossible pour le moment.');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeTab]);

  const handleLogoutConfirm = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await fetchWithAuth('/api/admin/logout', 'post');
    } catch {
      // Continue local logout even if backend logout fails.
    } finally {
      logout();
      setIsLoggingOut(false);
      setShowLogoutAlert(false);
      navigate('/login', { replace: true });
    }
  };

  const handleSubmitDevoir = async (devoirId) => {
    const file = selectedFiles[devoirId];

    if (!file) {
      setSubmitFeedback((prev) => ({ ...prev, [devoirId]: 'Veuillez choisir un fichier.' }));
      return;
    }

    const formData = new FormData();
    formData.append('fichier', file);
    const token = getStoredToken();

    try {
      if (!token) {
        await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
          withCredentials: true,
          withXSRFToken: true,
        });
      }

      await axios.post(apiBaseUrl + `/api/etudiant/devoirs/${devoirId}/soumettre`, formData, {
        withCredentials: true,
        withXSRFToken: true,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setSubmitFeedback((prev) => ({ ...prev, [devoirId]: 'Soumission reussie.' }));
      const refresh = await fetchWithAuth('/api/etudiant/devoirs');
      setDevoirs(refresh.data.devoirs ?? []);
    } catch (err) {
      setSubmitFeedback((prev) => ({
        ...prev,
        [devoirId]: err?.response?.data?.message || 'Echec de soumission.',
      }));
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

  const downloadResourceFile = (resource) => {
    const attachmentUrl = resource?.fichier_url;
    if (!attachmentUrl) return;

    const downloadName = String(resource?.titre || resource?.fichier || `ressource-${resource?.id_ressource || 'file'}`)
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_');

    const link = document.createElement('a');
    link.href = attachmentUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const todayEmploi = useMemo(() => {
    const currentDayKey = resolveWeekdayKey(new Date().toLocaleDateString('fr-FR', { weekday: 'long' }));
    return emploi
      .filter((item) => resolveWeekdayKey(item?.jour) === currentDayKey)
      .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''));
  }, [emploi]);

  const emploiByDay = useMemo(() => {
    const acc = {};
    WEEKDAY_LABELS.forEach((dayLabel) => {
      const dayKey = resolveWeekdayKey(dayLabel);
      acc[dayLabel] = emploi
        .filter((item) => resolveWeekdayKey(item?.jour) === dayKey)
        .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''));
    });
    return acc;
  }, [emploi]);

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
      const day = resolveWeekdayLabel(item?.jour);
      const startTime = normalizeTime(item?.heure_debut);
      const endTime = normalizeTime(item?.heure_fin) || addHoursTime(startTime, 1);

      if (!day || !WEEKDAY_LABELS.includes(day) || !/^\d{2}:\d{2}$/.test(startTime)) return;

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

  const currentDayLabel = WEEKDAY_KEY_TO_LABEL[
    resolveWeekdayKey(new Date().toLocaleDateString('fr-FR', { weekday: 'long' }))
  ] || '';

  return (
    <div className="portal-shell">
      {showLogoutAlert && (
        <div className="header-logout-modal-backdrop">
          <div className="header-logout-modal-card" role="dialog" aria-modal="true" aria-label="Confirmation deconnexion">
            <h3>Deconnexion</h3>
            <p>Voulez-vous vraiment vous deconnecter ?</p>
            <div className="header-logout-modal-actions">
              <button
                type="button"
                className="header-logout-cancel"
                onClick={() => setShowLogoutAlert(false)}
                disabled={isLoggingOut}
              >
                Annuler
              </button>
              <button
                type="button"
                className="header-logout-confirm"
                onClick={handleLogoutConfirm}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Deconnexion...' : 'Oui'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="portal-header">
        <div>
          <p className="portal-kicker">LinkEdu - Espace Etudiant</p>
          <h1>Bienvenue {studentName}</h1>
        </div>
        <div className="flex items-center gap-4">
          {dashboard?.academic_year && (
            <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm flex flex-col items-center mr-4 hidden md:flex">
              <span className="text-[9px] uppercase font-bold opacity-80 leading-none mb-0.5">Scolaire</span>
              <span className="text-sm font-black leading-none">{dashboard.academic_year}</span>
            </div>
          )}
          <button className="portal-logout" onClick={() => setShowLogoutAlert(true)}>Se deconnecter</button>
        </div>
      </header>

      <div className="portal-body">
        <aside className="portal-sidebar">
          <div className="portal-sidebar-brand">
            <h2>LinkEdu Etudiant</h2>
          </div>

          <div className="portal-profile-card">
            <strong>{studentName}</strong>
            <p>Espace etudiant</p>
          </div>

          <nav className="portal-sidebar-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  className={activeTab === tab.key ? 'portal-side-link active' : 'portal-side-link'}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="portal-content">
          {loading && <p className="portal-state">Chargement...</p>}
          {error && <p className="portal-state portal-error"><AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} /> {error}</p>}

          <AnimatePresence mode="wait">
            {!loading && !error && (
              <motion.div
                key={activeTab}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >

      {!loading && !error && activeTab === 'dashboard' && dashboard && (
        <div className="dashboard-v2-container">
          {/* Top Hero / Stats Row */}
          <div className="dashboard-hero-grid">
            <motion.div variants={cardVariants} className="stat-hero-card azure-gradient shadow-azure">
              <div className="stat-hero-icon"><GraduationCap size={28} /></div>
              <div className="stat-hero-content">
                <span className="stat-hero-label">Moyenne Générale</span>
                <span className="stat-hero-value">{dashboard.stats?.moyenne_generale ?? '-'} <span className="text-sm opacity-60">/ 20</span></span>
              </div>
            </motion.div>

            <motion.div variants={cardVariants} className="stat-hero-card rose-gradient shadow-rose">
              <div className="stat-hero-icon"><Clock size={28} /></div>
              <div className="stat-hero-content">
                <span className="stat-hero-label">Absences</span>
                <span className="stat-hero-value">{dashboard.stats?.nombre_absences ?? 0}</span>
              </div>
            </motion.div>

            <motion.div variants={cardVariants} className="stat-hero-card indigo-gradient shadow-indigo">
              <div className="stat-hero-icon"><FileText size={28} /></div>
              <div className="stat-hero-content">
                <span className="stat-hero-label">Devoirs à venir</span>
                <span className="stat-hero-value">{dashboard.stats?.devoirs_a_venir ?? 0}</span>
              </div>
            </motion.div>

            <motion.div variants={cardVariants} className="stat-hero-card emerald-gradient shadow-emerald">
              <div className="stat-hero-icon"><Bell size={28} /></div>
              <div className="stat-hero-content">
                <span className="stat-hero-label">Annonces</span>
                <span className="stat-hero-value">{dashboard.stats?.annonces_recentes ?? 0}</span>
              </div>
            </motion.div>
          </div>

          <div className="dashboard-main-layout">
            {/* Left Column: Schedule & Announcements */}
            <div className="dashboard-col-main">
              <motion.section variants={cardVariants} className="dashboard-section-card">
                <div className="section-card-header">
                  <h3><Calendar size={18} /> Emploi du temps d'aujourd'hui</h3>
                  <span className="current-date-tag">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                <div className="timeline-container">
                  {todayEmploi.length === 0 ? (
                    <div className="empty-timeline">
                      <Clock size={32} />
                      <p>Aucun cours prévu pour aujourd'hui. Profites-en !</p>
                    </div>
                  ) : (
                    todayEmploi.map((item, idx) => (
                      <div key={item.id_edt} className="timeline-item">
                        <div className="timeline-time">
                          <span className="time-start">{item.heure_debut?.substring(0, 5)}</span>
                          <span className="time-end">{item.heure_fin?.substring(0, 5)}</span>
                        </div>
                        <div className="timeline-marker">
                          <div className="timeline-dot"></div>
                          {idx < todayEmploi.length - 1 && <div className="timeline-line"></div>}
                        </div>
                        <div className="timeline-content">
                          <div className="subject-box">
                            <h4>{item.matiere}</h4>
                            <p>Prof. {item.professeur || '-'}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.section>

              {dashboard.annonces?.length > 0 && (
                <motion.section variants={cardVariants} className="dashboard-section-card mt-6">
                  <div className="section-card-header">
                    <h3><Bell size={18} /> Annonces récentes</h3>
                    <button onClick={() => setActiveTab('annonces')} className="view-all-btn">Voir tout</button>
                  </div>
                  <div className="mini-announcements-list">
                    {dashboard.annonces.slice(0, 3).map((ann) => (
                      <div key={ann.id_annonce} className="mini-announcement-item" onClick={() => { setSelectedAnnonce(ann); setActiveTab('annonces'); }}>
                        <div className="ann-accent-bar"></div>
                        <div className="ann-info">
                          <h5>{ann.titre}</h5>
                          <p className="line-clamp-1">{ann.contenu}</p>
                          <span className="ann-date">{ann.date_publication?.substring(0, 10)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>

            {/* Right Column: Quick Links / Grades / Assignments */}
            <div className="dashboard-col-side">
              <motion.section variants={cardVariants} className="dashboard-section-card">
                <div className="section-card-header">
                  <h3><GraduationCap size={18} /> Notes Récentes</h3>
                </div>
                <div className="mini-grades-feed">
                   {notes.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Aucune note encore enregistrée.</p> :
                    notes.slice(0, 4).map((note) => (
                      <div key={note.id_note} className="mini-grade-item">
                        <div className={`grade-circle ${resolveNoteToneClass(note.valeur)}`}>
                          {Number.isFinite(Number(note.valeur)) ? Number(note.valeur).toFixed(2) : '-'}
                        </div>
                        <div className="grade-info">
                          <p className="grade-subject">{note.matiere}</p>
                          <p className="grade-type">{resolveNoteControlLabel(note)}</p>
                        </div>
                      </div>
                    ))
                   }
                </div>
              </motion.section>

              <motion.section variants={cardVariants} className="dashboard-section-card mt-6">
                <div className="section-card-header">
                  <h3><FileText size={18} /> Devoirs</h3>
                </div>
                <div className="quick-assignments-feed">
                  {devoirsActifs.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Tous les devoirs sont à jour !</p> :
                    devoirsActifs.slice(0, 3).map((dev) => (
                      <div key={dev.id_devoir} className="quick-dev-item">
                        <div className="dev-deadline-indicator">
                           <span className="dev-day">{dev.date_limite?.split('-')[2]}</span>
                           <span className="dev-month">{new Date(dev.date_limite).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</span>
                        </div>
                        <div className="dev-details">
                          <p className="dev-title">{dev.titre}</p>
                          <p className="dev-matiere">{dev.matiere}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </motion.section>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && activeTab === 'notes' && (
        <section>
          <div className="portal-notes-toolbar">
            <label htmlFor="student-semestre-select">Semestre</label>
            <select
              id="student-semestre-select"
              className="portal-select portal-notes-select"
              value={selectedSemestre}
              onChange={(e) => setSelectedSemestre(e.target.value)}
            >
              <option value="1">Semestre 1</option>
              <option value="2">Semestre 2</option>
            </select>

            <label htmlFor="student-note-matiere-select">Matiere</label>
            <select
              id="student-note-matiere-select"
              className="portal-select portal-notes-select"
              value={selectedNoteMatiere}
              onChange={(e) => setSelectedNoteMatiere(e.target.value)}
            >
              <option value="all">Toutes les matieres</option>
              {noteMatieres.map((matiere) => (
                <option key={matiere} value={matiere}>{matiere}</option>
              ))}
            </select>
          </div>

          <div className="portal-list">
            {notesFiltered.map((note) => (
              <article key={note.id_note} className="portal-list-item portal-note-card">
                <div className="portal-note-header">
                  <span className="portal-note-control">{resolveNoteControlLabel(note)}</span>
                  <span className={`portal-note-score ${resolveNoteToneClass(note.valeur)}`}>
                    {Number.isFinite(Number(note.valeur)) ? Number(note.valeur).toFixed(2) : '-'} / 20
                  </span>
                </div>

                <h3>{note.matiere || 'Matiere non definie'}</h3>
                <p className="portal-note-meta">
                  Professeur: {String(note?.professeur || '').trim() || 'Non renseigne'}
                </p>
               
                <p className="portal-note-appreciation">
                  {note.appreciation || 'Aucune appreciation.'}
                </p>
              </article>
            ))}
          </div>

          {notesFiltered.length === 0 && (
            <p className="portal-state">Aucune note disponible pour ce filtre.</p>
          )}
        </section>
      )}

      {!loading && !error && activeTab === 'devoirs' && (
        <section>
          <div className="portal-notes-toolbar">
            <label htmlFor="student-devoir-matiere-select">Filtrer par matiere</label>
            <select
              id="student-devoir-matiere-select"
              className="portal-select portal-notes-select"
              value={selectedDevoirMatiere}
              onChange={(e) => setSelectedDevoirMatiere(e.target.value)}
            >
              <option value="all">Toutes les matieres</option>
              {devoirMatieres.map((matiere) => (
                <option key={matiere} value={matiere}>{matiere}</option>
              ))}
            </select>

            <button
              type="button"
              className={showDevoirHistory ? 'portal-history-btn is-active' : 'portal-history-btn'}
              onClick={() => setShowDevoirHistory((current) => !current)}
            >
              {showDevoirHistory ? 'Retour aux devoirs' : 'Voir l historique'}
            </button>
          </div>

          <div className="portal-list">
            {devoirsDisplayed.map((devoir) => (
              <article key={devoir.id_devoir} className="portal-list-item portal-learning-card portal-devoir-card">
                <div className="portal-learning-head">
                  <span className="portal-learning-tag">{normalizeMatiereLabel(devoir.matiere)}</span>
                  <span className={devoir.soumission ? 'portal-learning-status is-done' : (isDevoirHistorique(devoir) ? 'portal-learning-status is-late' : 'portal-learning-status is-open')}>
                    {devoir.soumission ? 'Soumis' : (isDevoirHistorique(devoir) ? 'Retard' : 'A soumettre')}
                  </span>
                </div>

                <h3>{devoir.titre || 'Devoir sans titre'}</h3>
                <p className="portal-learning-meta">Professeur: {String(devoir?.professeur || '').trim() || 'Non renseigne'}</p>
                <p className="portal-learning-meta">Date limite: {formatDateValue(devoir.date_limite)}</p>
                <p className="portal-learning-description">{devoir.description || 'Aucune description.'}</p>

                {devoir.soumission ? (
                  <p className="portal-success">Devoir deja soumis ({devoir.soumission.statut}).</p>
                ) : (
                  <div className="portal-upload-row">
                    <input
                      type="file"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setSelectedFiles((prev) => ({ ...prev, [devoir.id_devoir]: file }));
                      }}
                    />
                    <button className="portal-action" onClick={() => handleSubmitDevoir(devoir.id_devoir)}>
                      Soumettre
                    </button>
                  </div>
                )}
                {submitFeedback[devoir.id_devoir] && <p className="portal-info">{submitFeedback[devoir.id_devoir]}</p>}
              </article>
            ))}
          </div>

          {devoirsDisplayed.length === 0 && (
            <p className="portal-state">
              {showDevoirHistory
                ? 'Aucun devoir dans l historique pour ce filtre.'
                : 'Aucun devoir actif pour ce filtre.'}
            </p>
          )}
        </section>
      )}

      {!loading && !error && activeTab === 'emploi' && (
        <section className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="directory-timetable" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent' }}>
            <div className="timetable-grid-container" style={{ margin: 0, border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="timetable-table">
                <thead>
                  <tr>
                    <th className="time-col"></th>
                    {WEEKDAY_LABELS.map((day) => (
                      <th key={day} className={day === currentDayLabel ? 'current-day-header' : ''}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableTimes.map((time) => (
                    <tr key={time}>
                      <td className="time-cell" style={{ fontWeight: 600 }}>{`${time} - ${addOneHourTime(time)}`}</td>
                      {WEEKDAY_LABELS.map((day) => {
                        const cellData = scheduleDataGrid[time]?.[day];
                        return (
                          <td key={`${time}-${day}`} className={day === currentDayLabel ? 'current-day-col' : ''}>
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

      {!loading && !error && activeTab === 'ressources' && (
        <section>
          <div className="portal-notes-toolbar">
            <label htmlFor="student-resource-matiere-select">Filtrer par matiere</label>
            <select
              id="student-resource-matiere-select"
              className="portal-select portal-notes-select"
              value={selectedRessourceMatiere}
              onChange={(e) => setSelectedRessourceMatiere(e.target.value)}
            >
              <option value="all">Toutes les matieres</option>
              {resourceMatieres.map((matiere) => (
                <option key={matiere} value={matiere}>{matiere}</option>
              ))}
            </select>
          </div>

          <div className="portal-list">
            {ressourcesFiltered.map((item) => (
              <article key={item.id_ressource} className="portal-list-item portal-learning-card">
                <div className="portal-learning-head">
                  <span className="portal-learning-tag">{normalizeMatiereLabel(item.matiere)}</span>
                  <span className="portal-learning-status is-open">{item.type_ressource || 'Ressource'}</span>
                </div>

                <h3>{item.titre || 'Ressource sans titre'}</h3>
                <p className="portal-learning-meta">Professeur: {String(item?.professeur || '').trim() || 'Non renseigne'}</p>
                <p className="portal-learning-meta">Date: {formatDateValue(item.date)}</p>
                {String(item?.description || '').trim() !== '' && (
                  <p className="portal-learning-description">{item.description}</p>
                )}

                {item.fichier_url && (
                  <button
                    type="button"
                    className="portal-action"
                    onClick={() => downloadResourceFile(item)}
                  >
                    <Download size={14} />
                    <span>Telecharger</span>
                  </button>
                )}
              </article>
            ))}
          </div>

          {ressourcesFiltered.length === 0 && <p className="portal-state">Aucune ressource disponible pour ce filtre.</p>}
        </section>
      )}

      {!loading && !error && activeTab === 'annonces' && (
        <section className="portal-list">
          {annonces.map((annonce) => (
            <article key={annonce.id_annonce} className="portal-list-item">
              <h3>{annonce.titre}</h3>
              <p>{String(annonce.contenu || '').trim().slice(0, 180) || 'Aucun contenu.'}{String(annonce.contenu || '').trim().length > 180 ? '...' : ''}</p>
              <p>Cible: {annonce.cible || 'Tous'}</p>
              <p>Publiee le: {annonce.date_publication || '-'}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: '0.65rem' }}>
                <button
                  type="button"
                  className="portal-action"
                  onClick={() => setSelectedAnnonce(annonce)}
                >
                  <Eye size={14} />
                  <span>Voir</span>
                </button>

                {(annonce.attachment_url || annonce.photo_url) && (
                  <button
                    type="button"
                    className="portal-action"
                    onClick={() => downloadAnnonceAttachment(annonce)}
                  >
                    <Download size={14} />
                    <span>Telecharger</span>
                  </button>
                )}
              </div>
            </article>
          ))}
          {annonces.length === 0 && <p className="portal-state">Aucune annonce disponible.</p>}
        </section>
      )}



      {activeTab === 'profil' && <Parametres />}

      {selectedAnnonce && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={() => setSelectedAnnonce(null)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.58)',
            }}
          ></div>

          <article
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              maxWidth: 760,
              maxHeight: '90vh',
              overflow: 'auto',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 24px 56px rgba(15, 23, 42, 0.32)',
              padding: '1.1rem 1.2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.8rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a' }}>{selectedAnnonce.titre || 'Annonce'}</h3>
                <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  Publiee le: {selectedAnnonce.date_publication || '-'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnonce(null)}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '0.35rem',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  cursor: 'pointer',
                }}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ marginTop: '0.95rem', color: '#334155', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {String(selectedAnnonce.contenu || '').trim() || 'Aucun contenu.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: '0.9rem' }}>
              <span className="portal-learning-tag">Cible: {selectedAnnonce.cible || 'Tous'}</span>

              {(selectedAnnonce.attachment_url || selectedAnnonce.photo_url) && (
                <button
                  type="button"
                  className="portal-action"
                  onClick={() => downloadAnnonceAttachment(selectedAnnonce)}
                >
                  <Download size={14} />
                  <span>Telecharger la piece jointe</span>
                </button>
              )}
            </div>
          </article>
        </div>
      )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
