import React from 'react';

const profData = [
  {
    id: 1,
    name: 'Marie Dupont',
    email: 'm.dupont@linkedu.edu',
    avatar: 'https://i.pravatar.cc/150?u=marie',
    subject: 'MATHÉMATIQUES',
    subjectClass: 'prof-subj-math',
    classes: ['T-S1', 'T-S2'],
    status: 'Actif',
    statusClass: 'status-actif',
    progress: 62,
    progressColor: '#1d4ed8',
    lastActivityDate: "Aujourd'hui, 08:15",
    lastActivityDesc: "Appel Terminale S1"
  },
  {
    id: 2,
    name: 'Jean Martin',
    email: 'j.martin@linkedu.edu',
    avatar: 'https://i.pravatar.cc/150?u=jean',
    subject: 'PHYSIQUE',
    subjectClass: 'prof-subj-phys',
    classes: ['T-S3'],
    status: 'Absent',
    statusClass: 'status-absent',
    progress: 45,
    progressColor: '#f97316',
    lastActivityDate: "Hier, 16:40",
    lastActivityDesc: "Saisie des notes"
  },
  {
    id: 3,
    name: 'Sophie Laurent',
    email: 's.laurent@linkedu.edu',
    avatar: 'https://i.pravatar.cc/150?u=sophie',
    subject: 'LITTÉRATURE',
    subjectClass: 'prof-subj-lit',
    classes: ['1-L1', '1-L2'],
    status: 'Actif',
    statusClass: 'status-actif',
    progress: 88,
    progressColor: '#10b981',
    lastActivityDate: "Il y a 10 min",
    lastActivityDesc: "Dépôt de document"
  }
];

function DirectoryProfessors() {
  return (
    <div className="prof-page">
      <div className="prof-breadcrumb">Portail Directeur &gt; <span>Professeurs</span></div>
      <header className="page-dashboard-header">
        <div>
          <h1>Liste des Professeurs par Classe</h1>
          <p>Supervisez l'effectif enseignant et l'état d'avancement des programmes.</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
             <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle><line x1="20" y1="8" x2="24" y2="8"></line><line x1="22" y1="6" x2="22" y2="10"></line></svg>
             Ajouter un Professeur
          </button>
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
            {profData.map(prof => (
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
                  <span className={`prof-badge ${prof.subjectClass}`}>{prof.subject}</span>
                </td>
                <td>
                  <div className="prof-classes">
                    {prof.classes.map((cls, i) => <span key={i} className="prof-class-tag">{cls}</span>)}
                  </div>
                </td>
                <td>
                  <div className={`prof-status ${prof.statusClass}`}>
                    <span className="dot"></span> {prof.status}
                  </div>
                </td>
                <td>
                  <div className="prof-progress-wrapper">
                    <div className="prof-progress-text">{prof.progress}%</div>
                    <div className="prof-progress-bar">
                       <div className="prof-progress-fill" style={{ width: `${prof.progress}%`, backgroundColor: prof.progressColor }}></div>
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
          <span>Affichage de <strong>3</strong> sur <strong>42</strong> professeurs</span>
          <div className="prof-pages">
            <button>&lt;</button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>&gt;</button>
          </div>
        </div>
      </section>

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
            <span>POSTES À POURVOIR</span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
          </div>
          <h3>2</h3>
          <p className="kpi-subtext">SVT & Anglais (Session 2024)</p>
        </article>
      </section>
    </div>
  );
}

export default DirectoryProfessors;
