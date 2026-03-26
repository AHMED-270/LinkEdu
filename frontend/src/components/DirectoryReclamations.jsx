import React from 'react';

const claimsMockData = [
  { 
    id: 1, 
    type: 'Nouveau', 
    typeClass: 'badge-nouveau',
    date: '12 Oct 2023 • 09:45', 
    name: 'Mme. Sophie Laurent (Parent)', 
    subject: 'Retard récurrent du transport scolaire - Ligne B3',
    logo: 'S'
  },
  { 
    id: 2, 
    type: 'En cours', 
    typeClass: 'badge-encours',
    date: '11 Oct 2023 • 14:30', 
    name: 'Jean Dupont (Étudiant - Terminale S)', 
    subject: 'Note contestée - Examen de Mathématiques (Coeff 5)',
    logo: 'J',
    avatar: 'https://i.pravatar.cc/150?u=a2'
  },
  { 
    id: 3, 
    type: 'Résolu', 
    typeClass: 'badge-resolu',
    date: '10 Oct 2023 • 11:00', 
    name: 'M. Marc Bernard (Parent)',
    subject: 'Problème d\'accès au portail e-learning',
    logo: 'M',
    avatar: 'https://i.pravatar.cc/150?u=a3'
  },
  { 
    id: 4, 
    type: 'Nouveau', 
    typeClass: 'badge-nouveau',
    date: '09 Oct 2023 • 16:15', 
    name: 'Lucie Martin (Étudiante - CPGE)', 
    subject: 'Demande de changement de groupe de TD (Emploi du temps)',
    logo: 'L'
  },
  { 
    id: 5, 
    type: 'En cours', 
    typeClass: 'badge-encours',
    date: '08 Oct 2023 • 08:00', 
    name: 'Dr. Antoine Lefebvre (Parent)', 
    subject: 'Qualité des repas à la cantine scolaire',
    logo: 'A',
    avatar: 'https://i.pravatar.cc/150?u=a5'
  }
];

function DirectoryReclamations() {
  return (
    <div className="reclamations-page">
      <header className="page-dashboard-header">
        <div>
          <h1>Gestion des Réclamations</h1>
          <p>Supervisez et traitez les retours de la communauté éducative pour maintenir l'excellence de l'établissement.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Filtrer
          </button>
        </div>
      </header>

      <section className="req-kpi-grid">
        <article className="req-kpi-card req-kpi-total">
          <p>TOTAL</p>
          <h3>124</h3>
          <div className="req-kpi-bar bg-total"></div>
        </article>
        <article className="req-kpi-card req-kpi-nouveaux">
          <p>NOUVEAUX</p>
          <h3>12</h3>
          <div className="req-kpi-bar bg-nouveaux"></div>
        </article>
        <article className="req-kpi-card req-kpi-encours">
          <p>EN COURS</p>
          <h3>45</h3>
          <div className="req-kpi-bar bg-encours"></div>
        </article>
        <article className="req-kpi-card req-kpi-resolus">
          <p>RÉSOLUS</p>
          <h3>67</h3>
          <div className="req-kpi-bar bg-resolus"></div>
        </article>
      </section>

      <section className="req-recent-list-container">
        <div className="req-list-header">
          <h2>Réclamations Récentes</h2>
          <div className="req-sort">
            <span>Trier par:</span>
            <select className="req-sort-select">
               <option>Plus récent</option>
            </select>
          </div>
        </div>

        <div className="req-list">
          {claimsMockData.map((claim) => (
            <div className="req-item" key={claim.id}>
              <div className="req-avatar-container">
                {claim.avatar ? (
                  <img src={claim.avatar} className="req-avatar" alt="" />
                ) : (
                  <div className="req-avatar req-avatar-letter">{claim.logo}</div>
                )}
              </div>
              <div className="req-content">
                <div className="req-meta">
                  <span className={`req-badge ${claim.typeClass}`}>{claim.type}</span>
                  <span className="req-date">{claim.date}</span>
                </div>
                <div className="req-details">
                  <strong>{claim.name}</strong>
                  <p>{claim.subject}</p>
                </div>
              </div>
              <div className="req-action">
                <button className={`req-btn-action ${claim.type === 'Résolu' ? 'req-btn-light' : 'req-btn-primary'}`}>
                  {claim.type === 'Résolu' ? 'Détails' : 'Consulter'}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="req-view-all">
          <a href="#">Voir toutes les réclamations <span>→</span></a>
        </div>
      </section>

      <section className="req-bottom-grid">
        <article className="req-bottom-card req-conseil-card">
          <div className="req-conseil-icon">
             <span role="img" aria-label="lightbulb">💡</span>
          </div>
          <div className="req-conseil-content">
             <strong>Conseil de Direction</strong>
             <p>Le volume de réclamations liées au transport a augmenté de 15% cette semaine. Une réunion avec le prestataire de services est recommandée pour lundi prochain.</p>
             <button className="req-link-btn">PLANIFIER UNE RÉUNION</button>
          </div>
        </article>
        
        <article className="req-bottom-card req-rapport-card">
          <div className="req-rapport-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          </div>
          <strong>Rapport Mensuel</strong>
          <p>Le rapport de satisfaction globale du mois de Septembre est prêt pour révision.</p>
          <button className="req-btn-white">Télécharger PDF</button>
        </article>
      </section>
    </div>
  );
}

export default DirectoryReclamations;
