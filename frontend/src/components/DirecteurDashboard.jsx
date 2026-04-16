import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import Header from './Header';
import DirectorSidebar from './DirectorSidebar'
import DirectoryReclamations from './DirectoryReclamations';
import DirectoryProfessors from './DirectoryProfessors';
import DirectoryFallback from './DirectoryFallback';
import DirectoryReports from './DirectoryReports';
import DirectoryStudents from './DirectoryStudents';
import DirectoryClasses from './DirectoryClasses';
import DirectoryGrades from './DirectoryGrades';
import DirectoryTimetable from './DirectoryTimetable';
import DirectoryAnnonces from './DirectoryAnnonces';
import Parametres from '../pages/Parametres';
import usePostLoginReady from '../hooks/usePostLoginReady';

const AUTH_TOKEN_KEY = 'linkedu_token';

const BAR_COLORS = [
  '#1d4ed8', '#2563eb', '#0ea5e9', '#06b6d4',
  '#0d9488', '#16a34a', '#84cc16', '#ca8a04',
  '#dc2626', '#e11d48', '#9333ea', '#7c3aed',
];

const NIVEAU_MAP = {
  ms: 'Petite Section',
  mm: 'Moyenne Section',
  gs: 'Grande Section',
  '1ap': '1ere Primaire',
  '2ap': '2eme Primaire',
  '3ap': '3eme Primaire',
  '4ap': '4eme Primaire',
  '5ap': '5eme Primaire',
  '6ap': '6eme Primaire',
  '1ac': '1ere College',
  '2ac': '2eme College',
  '3ac': '3eme College',
  tc: 'Tronc Commun',
  '1bac': '1ere Bac',
  '2bac': '2eme Bac',
};

function NiveauTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl px-4 py-3">
      <p className="text-xs font-bold text-brand-navy mb-1">{NIVEAU_MAP[payload[0].payload.niveau] || payload[0].payload.niveau}</p>
      <p className="text-sm font-black text-brand-teal flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: payload[0].payload.fill }} />
        <strong>{payload[0].value}</strong> <span className="text-slate-400 font-medium">étudiants</span>
      </p>
    </div>
  );
}

function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function DirecteurDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null)
  const [recentReclamations, setRecentReclamations] = useState([])
  const [recentDemandes, setRecentDemandes] = useState([])
  const [etudiantsParNiveau, setEtudiantsParNiveau] = useState([])
  const [totalSecretaires, setTotalSecretaires] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showLogoutAlert, setShowLogoutAlert] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()

  const basePath = '/directeur';

  const pathToMenuMap = {
    '/': 'Tableau de bord',
    '/professeurs': 'Liste des Professeurs',
    '/etudiants': 'Liste des Etudiants',
    '/classes': 'Liste des Classes',
    '/reclamations': 'Reclamations',
    '/notes': 'Notes & Examens',
    '/parametres': 'Parametres',
    '/communication': 'Communication',
    '/rapports': 'Rapports',
    '/annonces': 'Annonces',
    '/emploi-du-temps': 'Emploi du temps'
  };

  const menuToPathMap = {
    'Tableau de bord': '/',
    'Liste des Professeurs': '/professeurs',
    'Liste des Etudiants': '/etudiants',
    'Liste des Classes': '/classes',
    'Reclamations': '/reclamations',
    'Notes & Examens': '/notes',
    'Parametres': '/parametres',
    'Communication': '/communication',
    'Rapports': '/rapports',
    'Annonces': '/annonces',
    'Emploi du temps': '/emploi-du-temps'
  };

  const relativePath = location.pathname.startsWith(basePath)
    ? location.pathname.slice(basePath.length) || '/'
    : location.pathname;
  const activeMenu = pathToMenuMap[relativePath] || 'Tableau de bord';
  const setActiveMenu = (menuName) => {
    const p = menuToPathMap[menuName] || '/';
    navigate(`${basePath}${p}`);
  };

  const fallbackUserName = String(user?.name || 'Directeur').trim() || 'Directeur';

  useEffect(() => {
    const loadDashboard = async () => {
      const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'
      const token = getStoredToken() ?? user?.token ?? null;

      try {
        const authConfig = {
          withCredentials: true,
          withXSRFToken: true,
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }

        const [dashboardResponse, reclamationsResponse, demandesResponse, secretairesResponse] = await Promise.all([
          axios.get(`${apiBaseUrl}/api/directeur/dashboard`, authConfig),
          axios.get(`${apiBaseUrl}/api/directeur/reclamations`, authConfig),
          axios.get(`${apiBaseUrl}/api/secretaire/demandes`, authConfig),
          axios.get(`${apiBaseUrl}/api/directeur/secretaires`, authConfig),
        ])

        setStats(dashboardResponse.data?.stats ?? null)

        const niveaux = Array.isArray(dashboardResponse.data?.etudiants_par_niveau)
          ? dashboardResponse.data.etudiants_par_niveau.map((item) => ({
            niveau: item?.niveau || '-',
            total: Number(item?.total ?? 0),
          }))
          : []
        setEtudiantsParNiveau(niveaux)

        const recent = Array.isArray(reclamationsResponse.data)
          ? reclamationsResponse.data
          : (reclamationsResponse.data?.reclamations || [])

        setRecentReclamations(recent.slice(0, 5))

        const demandesList = Array.isArray(demandesResponse.data?.demandes)
          ? demandesResponse.data.demandes
          : []
        setRecentDemandes(demandesList.slice(0, 5))

        const secretairesList = Array.isArray(secretairesResponse.data?.secretaires)
          ? secretairesResponse.data.secretaires
          : []
        setTotalSecretaires(secretairesList.length)
      } catch (requestError) {
        setEtudiantsParNiveau([])
        setError(requestError?.response?.data?.message ?? 'Impossible de charger le dashboard directeur.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [user?.id, user?.role, user?.token])

  usePostLoginReady(!isLoading)

  const handleLogoutConfirm = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    const token = getStoredToken() ?? user?.token ?? null;
    const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

    try {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });

      await axios.post(apiBaseUrl + '/api/admin/logout', {}, {
        withCredentials: true,
        withXSRFToken: true,
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // Continue local logout even if API request fails.
    } finally {
      setIsLoggingOut(false);
      setShowLogoutAlert(false);
      if (typeof onLogout === 'function') {
        onLogout();
      }
    }
  }

  // --- PREMIUM LOGOUT MODAL ---
  const logoutModal = showLogoutAlert && typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        <div className="premium-modal-overlay">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="premium-modal-backdrop"
            onClick={() => setShowLogoutAlert(false)}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="premium-modal-card"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-inner">
              <FiLogOut size={28} />
            </div>
            <h3 className="mb-2 text-xl font-black text-brand-navy tracking-tight">Déconnexion</h3>
            <p className="mb-8 text-sm font-medium text-slate-500 leading-relaxed">
              Voulez-vous vraiment quitter <span className="text-brand-navy font-bold">LinkEdu</span> ?
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
                onClick={() => setShowLogoutAlert(false)}
                disabled={isLoggingOut}
              >
                Annuler
              </button>
              <button
                className="flex-1 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                onClick={handleLogoutConfirm}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? '...' : 'Oui, sortir'}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>,
      document.body
    ) : null;

  // KPI data
  const kpiCards = [
    { label: 'Nombre de classes', value: stats?.classes ?? 0, gradient: 'from-brand-teal/10', hoverColor: 'group-hover:text-brand-teal' },
    { label: "Nombre d'étudiants", value: stats?.etudiants ?? 0, gradient: 'from-blue-500/10', hoverColor: 'group-hover:text-blue-600' },
    { label: 'Nombre de professeurs', value: stats?.professeurs ?? 0, gradient: 'from-purple-500/10', hoverColor: 'group-hover:text-purple-600' },
    { label: 'Nombre de secrétaires', value: totalSecretaires, gradient: 'from-amber-500/10', hoverColor: 'group-hover:text-amber-600' },
  ];

  return (
    <div className="premium-bg flex h-screen w-screen overflow-hidden fixed inset-0">
      {logoutModal}

      {/* Animated gradient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-28 -top-28 h-[42rem] w-[42rem] rounded-full bg-gradient-to-br from-brand-teal/25 to-blue-400/15 blur-[120px] opacity-70"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-36 -left-32 h-[46rem] w-[46rem] rounded-full bg-gradient-to-br from-brand-navy/20 to-brand-teal/10 blur-[140px] opacity-70"
        />
      </div>

      {/* ===== PREMIUM SIDEBAR ===== */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="premium-sidebar w-[280px] flex-shrink-0 flex flex-col z-50 relative overflow-hidden"
      >
        <div className="relative h-full py-4 px-3 overflow-y-auto custom-scrollbar">
          <DirectorSidebar
            user={user}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onRequestLogout={() => setShowLogoutAlert(true)}
            isLoggingOut={isLoggingOut}
          />
        </div>
      </motion.aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="h-[72px] flex-shrink-0 z-40"
        >
          <Header variant="shell" profileRouteOverride={`${basePath}/parametres`} />
        </motion.header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <motion.div
            key={activeMenu}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 lg:p-8 max-w-[1600px] mx-auto"
          >
            <div className="mb-6 flex flex-col gap-1">
              <span className="text-brand-teal font-semibold text-xs uppercase tracking-[0.2em]">Direction</span>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="loading-spinner" />
              </div>
            )}
            {error && (
              <div className="premium-stat !bg-red-50/60 border-red-100/50 p-5 mb-6">
                <p className="text-sm text-red-600 font-semibold">{error}</p>
              </div>
            )}

            {/* DASHBOARD HOME */}
            {!isLoading && !error && activeMenu === 'Tableau de bord' && (
              <div className="space-y-8">
                {/* Welcome header */}
                <div className="premium-stat !p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-brand-navy to-brand-teal bg-clip-text text-transparent tracking-tight">
                      Bonjour, {user?.prenom ?? 'M.'} {user?.nom ?? fallbackUserName}
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm font-medium">Résumé de la journée, préparé pour vous.</p>
                  </div>
                  {stats?.academic_year && (
                    <div className="bg-gradient-to-tr from-brand-teal to-blue-500 text-white px-5 py-2.5 rounded-2xl shadow-premium border border-white/20 flex flex-col items-center transition-transform hover:-translate-y-1 duration-300">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-90 leading-none mb-1">Année Scolaire</span>
                      <span className="text-lg font-black leading-none">{stats.academic_year}</span>
                    </div>
                  )}
                </div>

                {/* KPI Cards */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {kpiCards.map((kpi, i) => (
                    <motion.article
                      key={kpi.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="premium-stat group overflow-hidden relative"
                    >
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${kpi.gradient} to-transparent rounded-bl-[100px] z-0 transition-transform duration-500 group-hover:scale-110`} />
                      <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider relative z-10 mb-2">{kpi.label}</p>
                      <h3 className={`text-4xl font-black text-brand-navy relative z-10 ${kpi.hoverColor} transition-colors`}>{kpi.value}</h3>
                    </motion.article>
                  ))}
                </section>

                {/* Chart */}
                <section className="premium-stat !p-8">
                  <div className="premium-section-header">
                    <h2 className="premium-section-title">Répartition des élèves par niveau</h2>
                  </div>
                  <div className="director-level-chart-body" style={{ height: Math.max(300, etudiantsParNiveau.length * 36) }}>
                    {etudiantsParNiveau.length === 0 ? (
                      <div className="premium-empty">
                        <p>Aucune donnée de niveau disponible.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={etudiantsParNiveau} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8edf4" />
                          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                          <YAxis
                            type="category"
                            dataKey="niveau"
                            width={124}
                            tick={{ fontSize: 11, fill: '#475569' }}
                            tickFormatter={(value) => NIVEAU_MAP[value] || value}
                          />
                          <Tooltip content={<NiveauTooltip />} cursor={{ fill: 'rgba(29, 78, 216, 0.08)' }} />
                          <Bar dataKey="total" radius={[0, 10, 10, 0]} maxBarSize={22}>
                            {etudiantsParNiveau.map((entry, index) => (
                              <Cell key={`${entry.niveau}-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </section>

                {/* Tables row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Reclamations */}
                  <article className="premium-stat !p-0 overflow-hidden">
                    <div className="premium-section-header !mb-0 px-6 pt-6 pb-4">
                      <h2 className="premium-section-title">Réclamations récentes</h2>
                      <button onClick={() => setActiveMenu('Reclamations')} className="text-xs font-bold text-brand-teal hover:text-brand-navy transition-colors">
                        Voir toutes →
                      </button>
                    </div>
                    <div className="premium-table-wrap !rounded-none !shadow-none">
                      <table>
                        <thead>
                          <tr>
                            <th>SUJET</th>
                            <th>CIBLE</th>
                            <th>STATUT</th>
                            <th>DATE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentReclamations.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="!text-center !text-slate-400 !py-8">Aucune réclamation récente.</td>
                            </tr>
                          ) : (
                            recentReclamations.map((claim) => {
                              const claimDate = claim.date_reclamation
                                ? new Date(claim.date_reclamation).toLocaleDateString('fr-FR')
                                : '-';
                              return (
                                <tr key={claim.id_reclamation}>
                                  <td><strong className="text-brand-navy">{claim.sujet || 'Sans sujet'}</strong></td>
                                  <td>{claim.cible_label || '-'}</td>
                                  <td><span className="premium-badge-blue">{claim.statut || '-'}</span></td>
                                  <td className="text-slate-400 text-xs">{claimDate}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </article>

                  {/* Parent Demandes */}
                  <article className="premium-stat !p-0 overflow-hidden">
                    <div className="premium-section-header !mb-0 px-6 pt-6 pb-4">
                      <h2 className="premium-section-title">Demandes des parents</h2>
                    </div>
                    <div className="premium-table-wrap !rounded-none !shadow-none">
                      <table>
                        <thead>
                          <tr>
                            <th>PARENT</th>
                            <th>TYPE</th>
                            <th>STATUT</th>
                            <th>DATE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentDemandes.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="!text-center !text-slate-400 !py-8">Aucune demande récente.</td>
                            </tr>
                          ) : (
                            recentDemandes.map((demande) => {
                              const parentName = `${demande.parent_nom || ''} ${demande.parent_prenom || ''}`.trim();
                              const demandeDate = demande.date_demande
                                ? new Date(demande.date_demande).toLocaleDateString('fr-FR')
                                : '-';
                              return (
                                <tr key={demande.id_demande}>
                                  <td><strong className="text-brand-navy">{parentName || demande.parent_email || '-'}</strong></td>
                                  <td>{demande.type_demande || '-'}</td>
                                  <td><span className="premium-badge-orange">{demande.statut || '-'}</span></td>
                                  <td className="text-slate-400 text-xs">{demandeDate}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </div>
              </div>
            )}

            {/* Sub-pages */}
            {!isLoading && !error && activeMenu === 'Reclamations' && <DirectoryReclamations />}
            {!isLoading && !error && activeMenu === 'Liste des Professeurs' && <DirectoryProfessors userRole={user?.role} />}
            {!isLoading && !error && activeMenu === 'Liste des Etudiants' && <DirectoryStudents userRole={user?.role} />}
            {!isLoading && !error && activeMenu === 'Liste des Classes' && <DirectoryClasses userRole={user?.role} />}
            {!isLoading && !error && activeMenu === 'Notes & Examens' && <DirectoryGrades userRole={user?.role} />}
            {!isLoading && !error && activeMenu === 'Parametres' && <Parametres />}
            {!isLoading && !error && activeMenu === 'Communication' && <DirectoryFallback activeMenu={activeMenu} userRole={user?.role} />}
            {!isLoading && !error && activeMenu === 'Rapports' && <DirectoryReports />}
            {!isLoading && !error && activeMenu === 'Annonces' && <DirectoryAnnonces />}
            {!isLoading && !error && activeMenu === 'Emploi du temps' && <DirectoryTimetable />}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default DirecteurDashboard

