import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import DirectorSidebar from './DirectorSidebar'
import DirectoryReclamations from './DirectoryReclamations';
import DirectoryProfessors from './DirectoryProfessors';
import DirectoryFallback from './DirectoryFallback';
import DirectoryReports from './DirectoryReports';
import DirectoryStudents from './DirectoryStudents';
import DirectoryClasses from './DirectoryClasses';
import DirectoryGrades from './DirectoryGrades';
import DirectorySettings from './DirectorySettings';
import DirectoryTimetable from './DirectoryTimetable';
import DirectoryAnnonces from './DirectoryAnnonces';
import { getRoleDisplayLabel, getRoleLabel } from '../constants/roles';

function DirecteurDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null)
  const [latestDevoirs, setLatestDevoirs] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

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

  const [activeTab, setActiveTab] = useState('devoir')
  const [actionFeedback, setActionFeedback] = useState('')
  const fallbackUserName = `le ${String(getRoleLabel(user?.role) || 'Utilisateur').toLowerCase()}`;

  useEffect(() => {
    const loadDashboard = async () => {
      const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

      try {
        const response = await axios.get(`${apiBaseUrl}/api/directeur/dashboard`, {
          withCredentials: true,
          withXSRFToken: true,
          headers: {
            Accept: 'application/json',
            ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
          },
        })

        setStats(response.data?.stats ?? null)
        setLatestDevoirs(response.data?.latest_devoirs ?? [])
      } catch (requestError) {
        setError(requestError?.response?.data?.message ?? 'Impossible de charger le dashboard directeur.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [user?.token])

  
  const classesRows = [
    { name: 'Terminale S1', prof: 'Dr. Sophie Martin', presence: '98%', status: 'high', progress: '85%' },
    { name: 'Premiere L2', prof: 'M. Jean Dupont', presence: '91%', status: 'medium', progress: '72%' },
    { name: 'Seconde C3', prof: 'Mme Clara Leroy', presence: '96%', status: 'high', progress: '90%' },
    { name: '3eme Beta', prof: 'M. Robert Morel', presence: '84%', status: 'low', progress: '45%' }
  ]

  const reclamations = [
    { initial: 'ML', name: 'M. Leblanc', role: 'Parent d\'élève (2nde C3)', snippet: 'Problème d\'accès à la plateforme de devoirs depuis la mise à jour de lundi dernier...', time: 'Il y a 2h', isWarn: true },
    { initial: 'AG', name: 'Mme Gauthier', role: 'Parent d\'élève (Terminale S1)', snippet: 'Contestation d\'une absence notée lors du cours d\'Anglais du 12 juin. Justificatif prêt...', time: 'Il y a 5h', isWarn: false },
    { initial: 'MK', name: 'M. Karim', role: 'Parent d\'élève (3ème Bêta)', snippet: 'Demande de rendez-vous pour discuter de l\'orientation de fin de cycle...', time: 'Hier', isWarn: false }
  ]

  return (
    <div className="director-layout">
      <header className="global-topbar">
        <div className="topbar-left">
          <h2 className="brand-logo">LinkedU</h2>
          <nav className="topbar-links">
            <button className={activeMenu === 'Tableau de bord' ? 'is-active' : ''} onClick={() => setActiveMenu('Tableau de bord')}>Tableau de bord</button>
            <button className={activeMenu === 'Communication' ? 'is-active' : ''} onClick={() => setActiveMenu('Communication')}>Communication</button>
            <button className={activeMenu === 'Rapports' ? 'is-active' : ''} onClick={() => setActiveMenu('Rapports')}>Rapports</button>
          </nav>
        </div>
        <div className="topbar-right">
          <button className="icon-btn" onClick={() => alert("Notifications en cours...")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </button>
          <button className="icon-btn" onClick={() => setActiveMenu('Parametres')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
          <div className="topbar-profile" onClick={onLogout} title="Deconnexion">
            <img src="https://i.pravatar.cc/150?u=director" alt="Avatar" className="topbar-avatar" />
            <div className="topbar-profile-text">
              <strong>{user?.prenom ?? 'M.'} {user?.nom ?? fallbackUserName}</strong>
              <span>{getRoleDisplayLabel(user?.role)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="director-body">
        <DirectorSidebar user={user} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

        <section className="director-page-content">
          {isLoading && <p className="director-info">Chargement des donnees...</p>}
          {error && <p className="auth-feedback auth-feedback-error">{error}</p>}

          {!isLoading && !error && activeMenu === 'Tableau de bord' && (
            <div className="page-dashboard">
              <header className="page-dashboard-header">
                <div>
                  <h1>Bonjour, {user?.prenom ?? 'M.'} {user?.nom ?? fallbackUserName}</h1>
                  <p>Voici le point de situation de l'etablissement pour aujourd'hui.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => alert('Filtre par période en cours de développement.')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      Juin 2024
                    </button>
                    <button className="btn-primary" onClick={() => alert('Génération du rapport global en cours de développement.')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      Rapport Global
                    </button>
                  </div>
                </header>

                <section className="kpi-grid">
                <article className="kpi-card">
                  <div className="kpi-tag kpi-tag-red">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="7" x2="7" y2="17"></line><polyline points="17 17 7 17 7 7"></polyline></svg>
                    -0.5% vs mois dernier
                  </div>
                  <p>Taux d'absence global</p>
                  <h3>{stats?.absence_rate ?? '0%'}</h3>
                </article>
                <article className="kpi-card">
                  <div className="kpi-tag kpi-tag-green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                    +1.2 pts
                  </div>
                  <p>Performance moyenne</p>
                  <h3>{stats?.performance ?? '0/20'}</h3>
                </article>
                <article className="kpi-card">
                  <div className="kpi-tag kpi-tag-urgent">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    URGENT
                  </div>
                  <p>Reclamations non traitees</p>
                  <h3>{stats?.reclamations ?? 0}</h3>
                </article>
                <article className="kpi-card">
                  <div className="kpi-folder-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  <p>Dossiers eleves en attente</p>
                  <h3>{stats?.dossiers_attente ?? 0}</h3>
                </article>
              </section>

              <div className="dashboard-content-split">
                <article className="classes-overview-card">
                  <div className="card-header">
                    <h2>Vue d'ensemble par Classe</h2>
                      <a href="#" onClick={(e) => { e.preventDefault(); setActiveMenu('Liste des Classes'); }}>Voir tout le catalogue</a>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>CLASSE</th>
                          <th>PROFESSEUR PRINCIPAL</th>
                          <th>TAUX DE PRESENCE</th>
                          <th>AVANCEMENT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classesRows.map((row, i) => (
                          <tr key={i}>
                            <td><strong>{row.name}</strong></td>
                            <td>{row.prof}</td>
                            <td>
                              <span className={`presence-dot presence-${row.status}`}></span>
                              {row.presence}
                            </td>
                            <td>
                              <div className="progress-bar-wrap">
                                <div className="progress-bg"><div className={`progress-fill bg-${row.status}`} style={{ width: row.progress }}></div></div>
                                <span>{row.progress} du programme</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="recent-claims-card">
                  <div className="card-header">
                    <h2>Reclamations Recentes</h2>
                    <button className="icon-btn-small">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                    </button>
                  </div>
                  <div className="claims-list">
                    {reclamations.map((claim, i) => (
                      <div className="claim-item" key={i}>
                        <div className={`claim-avatar ${claim.isWarn ? 'is-warn' : ''}`}>{claim.initial}</div>
                        <div className="claim-content">
                          <div className="claim-head">
                            <strong>{claim.name}</strong>
                            <span>{claim.role}</span>
                          </div>
                          <p>{claim.snippet}</p>
                          <div className="claim-footer">
                            <span className="claim-time">{claim.time}</span>
                            <button className="btn-traiter">TRAITER</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <a href="#" className="view-all-link">Voir toutes les reclamations</a>
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
                <DirectorySettings userRole={user?.role} />
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


