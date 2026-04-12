import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminUserForm from './AdminUserForm';
import { ROLE, getPortalLabelByRole } from '../constants/roles';

axios.defaults.withCredentials = true;

function DirectoryProfessors({ userRole = ROLE.DIRECTEUR }) {
  const [isAdding, setIsAdding] = useState(false);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const portalLabel = getPortalLabelByRole(userRole);

  useEffect(() => {
    fetchProfessors();
  }, []);

  const fetchProfessors = async () => {
    try {
      setLoading(true);
      const host = window.location.hostname;
      const response = await axios.get(`http://${host}:8000/api/directeur/professeurs`);
      setProfessors(response.data);
    } catch (error) {
      console.error("Error fetching professors:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isAdding) {
    return (
      <div className="prof-page">
        <div className="prof-breadcrumb">
          {portalLabel} &gt; <span onClick={() => setIsAdding(false)} style={{cursor: 'pointer', color: '#1d4ed8', textDecoration: 'underline'}}>Professeurs</span> &gt; <span>Ajouter</span>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', marginTop: '20px' }}>
          <AdminUserForm
             mode="create"
             onBack={() => { setIsAdding(false); fetchProfessors(); }}
             onSuccess={() => { setIsAdding(false); fetchProfessors(); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="prof-page">
      <div className="prof-breadcrumb">{portalLabel} &gt; <span>Professeurs</span></div>
      <header className="page-dashboard-header">
        <div>
          <h1>Liste des Professeurs par Classe</h1>
          <p>Supervisez l'effectif enseignant et l'état d'avancement des programmes.</p>
        </div>
      </header>

      <section className="prof-filters-section">
        <div className="prof-filter-group">
          <label>FILTRER PAR MATIÈRE</label>
          <select><option>Toutes les matières</option></select>
        </div>
        <div className="prof-filter-group">
          <label>FILTRER PAR NIVEAU</label>
          <select><option>Tous les niveaux</option></select>
        </div>
        <button className="prof-filter-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
        </button>
      </section>

      {loading ? (
        <div style={{padding: '2rem'}}>Chargement des professeurs...</div>
      ) : (
        <section className="prof-table-container">
          <table className="prof-table">
            <thead>
              <tr>
                <th>AVATAR & NOM</th>
                <th>MATIÈRE</th>
                <th>CLASSE(S) ASSIGNÉE(S)</th>
                <th>STATUT</th>
                <th>AVANCEMENT</th>
                <th>DERNIÈRE ACTIVITÉ</th>
              </tr>
            </thead>
            <tbody>
              {professors.length === 0 && (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Aucun professeur trouvé.</td>
                </tr>
              )}
              {professors.map(prof => (
                <tr key={prof.id}>
                  <td>
                    <div className="prof-user-info">
                      <img src={prof.avatar} alt="Avatar" className="prof-avatar" />
                      <div>
                        <strong>{prof.name}</strong>
                        <span>{prof.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="prof-badge prof-subj-math">{prof.subject}</span>
                  </td>
                  <td>
                    <div className="prof-classes">
                      {prof.classes && prof.classes.length > 0 ? (
                        prof.classes.map((cls, i) => <span key={i} className="prof-class-tag">{cls}</span>)
                      ) : (
                        <span className="prof-class-tag" style={{backgroundColor: '#e2e8f0', color: '#4a5568'}}>Non assigné</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={`prof-status status-actif`}>
                      <span className="dot"></span> {prof.status}
                    </div>
                  </td>
                  <td>
                    <div className="prof-progress-wrapper">
                      <div className="prof-progress-text">{prof.progress}%</div>  
                      <div className="prof-progress-bar">
                         <div className="prof-progress-fill" style={{ width: `${prof.progress}%`, backgroundColor: prof.progress > 70 ? '#10b981' : '#f97316' }}></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="prof-activity">
                      <strong>{prof.lastActivityDate}</strong>
                      <span>{prof.lastActivityDesc}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="prof-pagination">
            <span>Affichage de <strong>{professors.length}</strong> professeurs</span>
          </div>
        </section>
      )}

      <section className="prof-kpi-container">
        <article className="prof-kpi-card kpi-presence">
          <div className="prof-kpi-top">
            <span>TAUX DE PRÉSENCE</span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1d4ed8" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <h3>94.2%</h3>
          <span className="kpi-trend trend-up">↗ +2.1% ce mois</span>
        </article>

        <article className="prof-kpi-card kpi-progression">
          <div className="prof-kpi-top">
            <span>PROGRESSION MOYENNE</span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f97316" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </div>
          <h3>71%</h3>
          <div className="prof-progress-bar kpi-bar">
             <div className="prof-progress-fill" style={{ width: '71%', backgroundColor: '#f97316' }}></div>
          </div>
        </article>

        <article className="prof-kpi-card kpi-postes">
          <div className="prof-kpi-top">
            <span>EFFECTIF GLOBAL</span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
          </div>
          <h3>{professors.length}</h3>
          <p className="kpi-subtext">Professeurs Actifs</p>
        </article>
      </section>
    </div>
  );
}

export default DirectoryProfessors;
