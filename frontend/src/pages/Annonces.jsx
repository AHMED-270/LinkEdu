import { useState } from 'react';
import { FiBell, FiPlus, FiMessageCircle, FiCalendar, FiUser } from 'react-icons/fi';
import './Annonces.css';

const annoncesData = [
  { id: 1, title: 'Réunion du corps professoral', content: 'Une réunion générale est prévue ce vendredi à 16h en salle des professeurs pour discuter du calendrier des examens du deuxième semestre.', author: 'Directeur', date: 'Aujourd\'hui, 10:30', read: false },
  { id: 2, title: 'Maintenance de la plateforme LinkEdu', content: 'La plateforme sera indisponible ce samedi entre 22h et minuit pour une mise à jour de sécurité vitale.', author: 'Service IT', date: 'Hier, 14:15', read: true },
  { id: 3, title: 'Nouvelles ressources pédagogiques', content: 'Le ministère a publié de nouvelles ressources pour le programme de Physique-Chimie du niveau Baccalauréat.', author: 'Inspecteur Régional', date: '24 Mars 2026', read: true },
  { id: 4, title: 'Olympiades de Mathématiques', content: 'Veuillez inscrire vos meilleurs élèves pour les olympiades régionales avant le 5 Avril.', author: 'Coordination', date: '20 Mars 2026', read: true },
];

export default function Annonces() {
  const [annonces, setAnnonces] = useState(annoncesData);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  const markAsRead = (id) => {
    setAnnonces(annonces.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const filteredAnnonces = filter === 'unread' ? annonces.filter(a => !a.read) : annonces;
  const unreadCount = annonces.filter(a => !a.read).length;

  return (
    <div className="layout-content">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2>Annonces de l'Établissement</h2>
          <p>Restez informé des dernières nouvelles</p>
        </div>
        <div className="annonces-stats">
          <span className="badge badge-red">{unreadCount} non lues</span>
        </div>
      </header>

      <div className="annonces-content animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="card annonces-main-card">
          <div className="card-header">
            <div className="annonces-tabs">
              <button 
                className={`annonces-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Toutes
              </button>
              <button 
                className={`annonces-tab ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Non lues
              </button>
            </div>
            <button className="btn btn-sm btn-outline btn-new-annonce">
              <FiPlus size={14} /> Publier une annonce
            </button>
          </div>
          
          <div className="card-body">
            <div className="annonces-list">
              {filteredAnnonces.map(annonce => (
                <div key={annonce.id} className={`annonce-item ${!annonce.read ? 'unread' : ''}`}>
                  <div className="annonce-icon-wrap">
                    <div className="annonce-icon blue">
                      <FiBell size={20} />
                    </div>
                  </div>
                  
                  <div className="annonce-details">
                    <div className="annonce-top">
                      <h4 className="annonce-title">{annonce.title}</h4>
                      {!annonce.read && <span className="annonce-new-dot"></span>}
                    </div>
                    <p className="annonce-text">{annonce.content}</p>
                    <div className="annonce-meta">
                      <span><FiUser size={12} /> {annonce.author}</span>
                      <span><FiCalendar size={12} /> {annonce.date}</span>
                    </div>
                  </div>
                  
                  <div className="annonce-actions">
                    {!annonce.read && (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => markAsRead(annonce.id)}
                      >
                        Marquer comme lu
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="annonces-sidebar">
          <div className="card">
            <div className="card-header">
              <h3>Contacts rapides</h3>
            </div>
            <div className="card-body">
              <div className="contacts-list">
                <div className="contact-item">
                  <div className="contact-avatar">D</div>
                  <div className="contact-info">
                    <span className="contact-name">Directeur</span>
                    <span className="contact-role">Administration</span>
                  </div>
                  <button className="contact-btn"><FiMessageCircle size={16} /></button>
                </div>
                <div className="contact-item">
                  <div className="contact-avatar" style={{background: 'var(--accent-green)'}}>S</div>
                  <div className="contact-info">
                    <span className="contact-name">Surveillant Général</span>
                    <span className="contact-role">Vie scolaire</span>
                  </div>
                  <button className="contact-btn"><FiMessageCircle size={16} /></button>
                </div>
                <div className="contact-item">
                  <div className="contact-avatar" style={{background: 'var(--accent-orange)'}}>I</div>
                  <div className="contact-info">
                    <span className="contact-name">Service IT</span>
                    <span className="contact-role">Support technique</span>
                  </div>
                  <button className="contact-btn"><FiMessageCircle size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

