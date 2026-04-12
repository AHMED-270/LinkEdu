import { useState } from 'react';
import { FiList, FiFolder, FiFileText, FiCalendar, FiVideo, FiUploadCloud } from 'react-icons/fi';
import './Devoirs.css';

export default function Devoirs() {
  const [activeTab, setActiveTab] = useState('devoir');
  const [loading] = useState(false);
  const [error] = useState('');

  return (
    <div className="dvr-page">
      <div className="dvr-header">
        <div className="dvr-title-section">
          <h2>Devoirs & Ressources</h2>
          <p>Gérez vos supports de cours et assignations. Publiez de nouveaux éléments pour vos étudiants en quelques clics.</p>
        </div>
        
        <div className="dvr-filters">
          <div className="filter-group">
            <label>CLASSE</label>
            <select className="filter-select">
              <option>Master 2 - IA</option>
            </select>
          </div>
          <div className="filter-group">
            <label>MATIÈRE</label>
            <select className="filter-select">
              <option>Astrophysique</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <p>Chargement...</p>}
      {!loading && error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      <div className="dvr-content">
        {/* LEFT COLUMN: PUBLISH FORM */}
        <div className="dvr-left-col bg-white">
          <div className="tab-container">
            <button 
              className={`tab-btn ${activeTab === 'devoir' ? 'active' : ''}`}
              onClick={() => setActiveTab('devoir')}
            >
              <FiList /> Publier un Devoir
            </button>
            <button 
              className={`tab-btn ${activeTab === 'ressource' ? 'active' : ''}`}
              onClick={() => setActiveTab('ressource')}
            >
              <FiFolder /> Publier une Ressource
            </button>
          </div>

          <div className="form-group">
            <label>Titre du {activeTab}</label>
            <input type="text" placeholder="Ex: Analyse des naines blanches - TP 1" className="input-field" />
          </div>

          <div className="form-group">
            <label>Description & Consignes</label>
            <textarea placeholder="Détaillez les objectifs et les attentes..." className="input-field textarea-field"></textarea>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Date limite</label>
              <input type="date" className="input-field" />
            </div>
            <div className="form-group flex-1">
              <label>Points / Barème</label>
              <input type="text" placeholder="20" className="input-field" />
            </div>
          </div>

          <div className="form-group">
            <label>Documents joints</label>
            <div className="upload-zone">
              <FiUploadCloud size={24} color="#2563EB" />
              <strong>Glissez-déposez vos fichiers ici</strong>
              <span className="upload-desc">PDF, DOCX ou ZIP jusqu'à 25MB</span>
              <button type="button" className="upload-btn">Ou parcourir vos dossiers</button>
            </div>
          </div>

          <button className="primary-btn publish-btn">
            ▸ Publier le {activeTab}
          </button>
        </div>

        {/* RIGHT COLUMN: STATS & LIST */}
        <div className="dvr-right-col">
          {/* STATS */}
          <div className="dvr-stats-row">
            <div className="stat-box primary-bg">
              <span className="stat-icon"><FiList size={20} /></span>
              <div className="stat-info">
                <strong>12</strong>
                <p>DEVOIRS ACTIFS</p>
              </div>
            </div>
            <div className="stat-box secondary-bg">
              <span className="stat-icon"><FiFolder size={20} /></span>
              <div className="stat-info">
                <strong>48</strong>
                <p>RESSOURCES PARTAGÉES</p>
              </div>
            </div>
          </div>

          {/* RECENT PUBS */}
          <div className="recent-pubs">
            <div className="recent-header">
              <h3>Publications récentes</h3>
              <a href="#" className="link-all">Voir tout</a>
            </div>
            
            <div className="recent-list">
              <div className="recent-item">
                <div className="item-icon-box bg-orange">
                  <FiFileText color="#EA580C" />
                </div>
                <div className="item-details">
                  <h4>Théorie de la Relativité Générale</h4>
                  <p>Cours • Publié il y a 2h</p>
                  <div className="item-meta">
                    <span className="meta-badge">M2 - IA</span>
                    <span className="meta-text">👁 24 vues</span>
                  </div>
                </div>
              </div>

              <div className="recent-item">
                <div className="item-icon-box bg-blue">
                  <FiCalendar color="#2563EB" />
                </div>
                <div className="item-details">
                  <h4>TD n°4 : Spectroscopie Stellaire</h4>
                  <p>Devoir • Échéance : 15 Oct.</p>
                  <div className="item-meta">
                    <span className="meta-badge">L3 - CS</span>
                    <span className="meta-text">👥 12/30 rendus</span>
                  </div>
                </div>
              </div>

              <div className="recent-item">
                <div className="item-icon-box bg-purple">
                  <FiVideo color="#9333EA" />
                </div>
                <div className="item-details">
                  <h4>Webinaire : Carrières en Astro</h4>
                  <p>Vidéo • Publié hier</p>
                  <div className="item-meta">
                    <span className="meta-badge">Tous</span>
                    <span className="meta-text">⬇ 145 DL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GUIDE CARD */}
          <div className="guide-card">
            <div className="guide-content">
              <h4>Guide Pédagogique</h4>
              <p>Structurez vos ressources pour maximiser l'intérêt de vos étudiants.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

