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

const AUTH_TOKEN_KEY = 'linkedu_token';

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
  const [recentClasses, setRecentClasses] = useState([])
  const [totalSecretaires, setTotalSecretaires] = useState(0)
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

  const fallbackUserName = `le ${String(getRoleLabel(user?.role) || 'Utilisateur').toLowerCase()}`;

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

        const [dashboardResponse, reclamationsResponse, classesResponse, secretairesResponse] = await Promise.all([
          axios.get(`${apiBaseUrl}/api/directeur/dashboard`, authConfig),
          axios.get(`${apiBaseUrl}/api/directeur/reclamations`, authConfig),
          axios.get(`${apiBaseUrl}/api/secretaire/classes`, authConfig),
          axios.get(`${apiBaseUrl}/api/directeur/secretaires`, authConfig),
        ])

        setStats(dashboardResponse.data?.stats ?? null)

        const recent = Array.isArray(reclamationsResponse.data)
          ? reclamationsResponse.data
          : (reclamationsResponse.data?.reclamations || [])

        setRecentReclamations(recent.slice(0, 5))

        const classesList = Array.isArray(classesResponse.data?.classes)
          ? classesResponse.data.classes
          : []
        setRecentClasses(classesList.slice(0, 6))

        const secretairesList = Array.isArray(secretairesResponse.data?.secretaires)
          ? secretairesResponse.data.secretaires
          : []
        setTotalSecretaires(secretairesList.length)
      } catch (requestError) {
        setError(requestError?.response?.data?.message ?? 'Impossible de charger le dashboard directeur.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [user?.id, user?.role])

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
                  <p>Resume du jour avec les indicateurs essentiels.</p>
                </div>
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

              <div className="dashboard-content-split">
                <article className="recent-claims-card">
                  <div className="card-header">
                    <h2>Reclamations recentes</h2>
                    <a href="#" onClick={(event) => { event.preventDefault(); setActiveMenu('Reclamations'); }}>Voir toutes</a>
                  </div>
                  <div className="claims-list">
                    {recentReclamations.length === 0 ? (
                      <p className="director-info">Aucune reclamation recente.</p>
                    ) : (
                      recentReclamations.map((claim) => {
                        const label = String(claim.cible_label || 'Parent');
                        const initial = label.substring(0, 2).toUpperCase();
                        const claimDate = claim.date_reclamation
                          ? new Date(claim.date_reclamation).toLocaleDateString('fr-FR')
                          : '-';

                        return (
                          <div className="claim-item" key={claim.id_reclamation}>
                            <div className="claim-avatar">{initial}</div>
                            <div className="claim-content">
                              <div className="claim-head">
                                <strong>{claim.sujet || 'Sans sujet'}</strong>
                                <span>{label}</span>
                              </div>
                              <p>{claim.description || 'Aucun detail'}</p>
                              <div className="claim-footer">
                                <span className="claim-time">{claimDate}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </article>

                <article className="classes-overview-card">
                  <div className="card-header">
                    <h2>Liste des classes</h2>
                    <a href="#" onClick={(event) => { event.preventDefault(); setActiveMenu('Liste des Classes'); }}>Voir toutes</a>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>CLASSE</th>
                          <th>ETUDIANTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentClasses.length === 0 ? (
                          <tr>
                            <td colSpan="2" style={{ textAlign: 'center', padding: '1rem 0', color: '#64748b' }}>
                              Aucune classe disponible.
                            </td>
                          </tr>
                        ) : (
                          recentClasses.map((classe) => (
                            <tr key={classe.id_classe}>
                              <td><strong>{classe.nom || '-'}</strong></td>
                              <td>{classe.total_etudiants ?? 0}</td>
                            </tr>
                          ))
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


