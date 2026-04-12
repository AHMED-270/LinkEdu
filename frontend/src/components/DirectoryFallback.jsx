import React from 'react';
import { ROLE, getPortalLabelByRole } from '../constants/roles';

function DirectoryFallback({ activeMenu, userRole = ROLE.DIRECTEUR }) {
  const portalLabel = getPortalLabelByRole(userRole);

  return (
    <div className="prof-page">
      <div className="prof-breadcrumb">
        {portalLabel} &gt; <span>{activeMenu}</span>
      </div>
      <header className="page-dashboard-header">
        <div>
          <h1>{activeMenu}</h1>
          <p>Interface en cours d'intégration pour rejoindre le style de la maquette globale.</p>
        </div>
      </header>
      <section className="prof-table-container fallback-container">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" className="fallback-icon">
           <circle cx="12" cy="12" r="10"></circle>
           <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <h3>Module en développement</h3>
        <p>La page <strong>{activeMenu}</strong> sera bientôt disponible avec les mêmes styles de tableaux et statistiques.</p>
      </section>
    </div>
  );
}

export default DirectoryFallback;
