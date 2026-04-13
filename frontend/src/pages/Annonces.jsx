import { useMemo, useState } from 'react';
import './Annonces.css';

const INITIAL_ANNONCES = [
  {
    id: 1,
    titre: 'Reunion pedagogique',
    message: 'Reunion demain a 10h en salle des professeurs.',
    date: '2026-04-12',
    unread: true,
  },
  {
    id: 2,
    titre: 'Nouvelle ressource disponible',
    message: 'Le support du chapitre 5 est en ligne.',
    date: '2026-04-08',
    unread: false,
  },
];

export default function Annonces() {
  const [activeTab, setActiveTab] = useState('all');
  const [annonces, setAnnonces] = useState(INITIAL_ANNONCES);

  const filtered = useMemo(() => {
    if (activeTab === 'unread') {
      return annonces.filter((item) => item.unread);
    }
    return annonces;
  }, [activeTab, annonces]);

  const markAsRead = (id) => {
    setAnnonces((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
  };

  return (
    <div className="annonces-page">
      <div className="annonces-header">
        <div>
          <h2>Annonces</h2>
          <p>Consultez les communications recentes.</p>
        </div>
      </div>

      <div className="annonces-tabs">
        <button className={`annonces-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          Toutes
        </button>
        <button className={`annonces-tab ${activeTab === 'unread' ? 'active' : ''}`} onClick={() => setActiveTab('unread')}>
          Non lues
        </button>
      </div>

      <div className="annonces-list">
        {filtered.map((item) => (
          <article className={`annonce-item ${item.unread ? 'unread' : ''}`} key={item.id}>
            <div className="annonce-details">
              <div className="annonce-top">
                <h3 className="annonce-title">{item.titre}</h3>
                {item.unread && <span className="annonce-new-dot" />}
              </div>
              <p className="annonce-text">{item.message}</p>
              <div className="annonce-meta">
                <span>{item.date}</span>
                {item.unread && (
                  <button type="button" onClick={() => markAsRead(item.id)}>
                    Marquer comme lue
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <p>Aucune annonce.</p>}
      </div>
    </div>
  );
}