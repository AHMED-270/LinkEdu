import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { FiLogOut } from 'react-icons/fi';
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
import { getRoleLabel } from '../constants/roles';
import Parametres from '../pages/Parametres';

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
    <div className="director-chart-tooltip">
      <p className="director-chart-tooltip-label">{NIVEAU_MAP[payload[0].payload.niveau] || payload[0].payload.niveau}</p>
      <p className="director-chart-tooltip-value">
        <span className="director-chart-tooltip-dot" style={{ background: payload[0].payload.fill }} />
        <strong>{payload[0].value}</strong> etudiants
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

  const fallbackUserName = `le ${String(getRoleLabel(user?.role) || 'Utilisateur').toLowerCase()}`;
  const directorDisplayName = `${String(user?.prenom || '').trim()} ${String(user?.nom || '').trim()}`.trim()
    || String(user?.name || '').trim()
    || fallbackUserName;

  const directorInitials = useMemo(() => {
    const sourceParts = [user?.prenom, user?.nom]
      .map((part) => String(part || '').trim())
      .filter(Boolean);

    if (sourceParts.length >= 2) {
      return `${sourceParts[0].charAt(0)}${sourceParts[1].charAt(0)}`.toUpperCase();
    }

    const fallbackParts = String(user?.name || '')
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (fallbackParts.length >= 2) {
      return `${fallbackParts[0].charAt(0)}${fallbackParts[1].charAt(0)}`.toUpperCase();
    }

    if (fallbackParts.length === 1) {
      return fallbackParts[0].charAt(0).toUpperCase();
    }

    return 'D';
  }, [user?.name, user?.nom, user?.prenom]);

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

  return (
    <div className="director-layout">
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

      <header className="director-header">
        <div className="director-header-logo">
          <span className="logo-link">Linked</span><span className="logo-edu">U</span>
        </div>
        <div className="director-header-actions">
          <button
            type="button"
            className="director-header-profile"
            onClick={() => setActiveMenu('Parametres')}
            title="Ouvrir le profil"
          >
            <span className="director-header-avatar">{directorInitials}</span>
            <span className="director-header-profile-meta">
              <span className="director-header-profile-label">Profil</span>
            </span>
          </button>
          <button
            type="button"
            className="director-header-logout"
            onClick={() => setShowLogoutAlert(true)}
            disabled={isLoggingOut}
            aria-label="Se deconnecter"
            title="Se deconnecter"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </header>

      <main className="director-body">
        <DirectorSidebar user={user} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

        <section className="director-page-content">
          {isLoading && <p className="director-info">Chargement des donnees...</p>}
          {error && <p className="auth-feedback auth-feedback-error">{error}</p>}

          {!isLoading && !error && activeMenu === 'Tableau de bord' && (
            <div className="page-dashboard">
              <header className="page-dashboard-header flex justify-between items-center">
                <div>
                  <h1>Bonjour, {directorDisplayName}</h1>
                  <p>Resume du jour avec les indicateurs essentiels.</p>
                </div>
                {stats?.academic_year && (
                  <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm flex flex-col items-center mr-4">
                    <span className="text-[9px] uppercase font-bold opacity-80 leading-none mb-0.5">Scolaire</span>
                    <span className="text-sm font-black leading-none">{stats.academic_year}</span>
                  </div>
                )}
              </header>

              <section className="kpi-grid">
                <article className="kpi-card">
                  <p>Nombre de classes</p>
                  <h3>{stats?.classes ?? 0}</h3>
                </article>
                <article className="kpi-card">
                  <p>Nombre d'etudiants</p>
                  <h3>{stats?.etudiants ?? 0}</h3>
                </article>
                <article className="kpi-card">
                  <p>Nombre de professeurs</p>
                  <h3>{stats?.professeurs ?? 0}</h3>
                </article>
                <article className="kpi-card">
                  <p>Nombre de secretaires</p>
                  <h3>{totalSecretaires}</h3>
                </article>
              </section>

              <section className="director-level-chart-card">
                <div className="card-header">
                  <h2>Repartition des eleves par niveau</h2>
                </div>
                <div className="director-level-chart-body">
                  {etudiantsParNiveau.length === 0 ? (
                    <p className="director-chart-empty">Aucune donnee de niveau disponible.</p>
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

              <div className="dashboard-content-split director-tables-row">
                <article className="recent-claims-card director-table-card">
                  <div className="card-header">
                    <h2>Reclamations recentes</h2>
                    <a href="#" onClick={(event) => { event.preventDefault(); setActiveMenu('Reclamations'); }}>Voir toutes</a>
                  </div>
                  <div className="table-wrapper">
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
                            <td colSpan="4" style={{ textAlign: 'center', padding: '1rem 0', color: '#64748b' }}>
                              Aucune reclamation recente.
                            </td>
                          </tr>
                        ) : (
                          recentReclamations.map((claim) => {
                            const claimDate = claim.date_reclamation
                              ? new Date(claim.date_reclamation).toLocaleDateString('fr-FR')
                              : '-';

                            return (
                              <tr key={claim.id_reclamation}>
                                <td><strong>{claim.sujet || 'Sans sujet'}</strong></td>
                                <td>{claim.cible_label || '-'}</td>
                                <td>{claim.statut || '-'}</td>
                                <td>{claimDate}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="classes-overview-card director-table-card">
                  <div className="card-header">
                    <h2>Demandes des parents</h2>
                  </div>
                  <div className="table-wrapper">
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
                            <td colSpan="4" style={{ textAlign: 'center', padding: '1rem 0', color: '#64748b' }}>
                              Aucune demande recente.
                            </td>
                          </tr>
                        ) : (
                          recentDemandes.map((demande) => {
                            const parentName = `${demande.parent_nom || ''} ${demande.parent_prenom || ''}`.trim();
                            const demandeDate = demande.date_demande
                              ? new Date(demande.date_demande).toLocaleDateString('fr-FR')
                              : '-';

                            return (
                              <tr key={demande.id_demande}>
                                <td><strong>{parentName || demande.parent_email || '-'}</strong></td>
                                <td>{demande.type_demande || '-'}</td>
                                <td>{demande.statut || '-'}</td>
                                <td>{demandeDate}</td>
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

          {/* Fallback for other modes unstyled yet */}
          {!isLoading && !error && activeMenu === 'Reclamations' && (
              <DirectoryReclamations />
            )}
            {!isLoading && !error && activeMenu === 'Liste des Professeurs' && (
              <DirectoryProfessors userRole={user?.role} />
            )}
            {!isLoading && !error && activeMenu === 'Liste des Etudiants' && (
                <DirectoryStudents userRole={user?.role} />
              )}
              {!isLoading && !error && activeMenu === 'Liste des Classes' && (
                <DirectoryClasses userRole={user?.role} />
              )}
              {!isLoading && !error && activeMenu === 'Notes & Examens' && (
                <DirectoryGrades userRole={user?.role} />
              )}
              {!isLoading && !error && activeMenu === 'Parametres' && (
                <Parametres />
              )}
              {!isLoading && !error && activeMenu === 'Communication' && (
                <DirectoryFallback activeMenu={activeMenu} userRole={user?.role} />
              )}
              {!isLoading && !error && activeMenu === 'Rapports' && (<DirectoryReports />)}
              {!isLoading && !error && activeMenu === 'Annonces' && (
                <DirectoryAnnonces />
              )}
              {!isLoading && !error && activeMenu === 'Emploi du temps' && (
                <DirectoryTimetable />
              )}        </section>
      </main>
    </div>
  )
}

export default DirecteurDashboard


