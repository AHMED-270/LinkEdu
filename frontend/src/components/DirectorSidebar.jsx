import React from 'react';

const menuItems = [
  { name: 'Tableau de bord', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
  { name: 'Liste des Professeurs', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
  { name: 'Liste des Etudiants', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> },
  { name: 'Liste des Classes', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> },
  { name: 'Reclamations', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> },
  { name: 'Notes & Examens', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
  { name: 'Annonces', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg> },
  { name: 'Emploi du temps', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> },
];

function DirectorSidebar({ user, activeMenu, setActiveMenu }) {
  const fullName = `${String(user?.prenom || '').trim()} ${String(user?.nom || '').trim()}`.trim()
    || String(user?.name || '').trim()
    || 'Directeur';

  const initials = (() => {
    const parts = [user?.prenom, user?.nom]
      .map((part) => String(part || '').trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }

    const fallback = fullName
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (fallback.length >= 2) {
      return `${fallback[0].charAt(0)}${fallback[1].charAt(0)}`.toUpperCase();
    }

    return (fallback[0] || 'D').charAt(0).toUpperCase();
  })();

  return (
    <aside className="director-sidebar">
      <div className="director-sidebar-profile">
        <div className="director-sidebar-avatar">{initials}</div>
        <div className="director-sidebar-user">
          <strong>{fullName}</strong>
          <p>{String(user?.role || 'directeur')}</p>
        </div>
      </div>

      <nav>
        {menuItems.map((item) => (
          <button
            key={item.name}
            type="button"
            className={`side-link ${activeMenu === item.name ? 'is-active' : ''}`}
            onClick={() => setActiveMenu(item.name)}
          >
            <span className="side-icon">{item.icon}</span>
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default DirectorSidebar;
