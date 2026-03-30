import { useEffect, useMemo, useState } from 'react';
import { FiList, FiFolder, FiFileText, FiCalendar, FiUploadCloud } from 'react-icons/fi';
import { professorGet, professorPost } from '../services/professorApi';
import './Devoirs.css';

export default function Devoirs() {
  const [activeTab, setActiveTab] = useState('devoir');
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [publications, setPublications] = useState([]);
  const [stats, setStats] = useState({ active_assignments: 0, shared_resources: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    classId: '',
    matiereId: '',
    title: '',
    description: '',
    deadline: '',
    type: 'PDF',
    file: null,
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await professorGet('/api/professeur/publications');
      const nextClasses = data.classes || [];
      const nextMatieres = data.matieres || [];
      setClasses(nextClasses);
      setMatieres(nextMatieres);
      setPublications(data.publications || []);
      setStats(data.stats || { active_assignments: 0, shared_resources: 0 });
      setForm((prev) => ({
        ...prev,
        classId: prev.classId || (nextClasses[0]?.id ? String(nextClasses[0].id) : ''),
        matiereId: prev.matiereId || (nextMatieres[0]?.id ? String(nextMatieres[0].id) : ''),
      }));
    } catch {
      setError('Impossible de charger les publications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async () => {
    try {
      if (activeTab === 'devoir') {
        await professorPost('/api/professeur/devoirs', {
          title: form.title,
          description: form.description,
          deadline: form.deadline,
          classId: Number(form.classId),
          matiereId: Number(form.matiereId),
        });
      } else {
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('type', form.type);
        if (form.file) formData.append('file', form.file);
        await professorPost('/api/professeur/ressources', formData, true);
      }

      setForm((prev) => ({ ...prev, title: '', description: '', deadline: '', file: null }));
      await loadData();
    } catch {
      setError('Publication impossible. Verifiez les champs obligatoires.');
    }
  };

  const recentPublications = useMemo(() => publications.slice(0, 12), [publications]);

  return (
    <div className="dvr-page">
      {/* HEADER SECTION */}
      <div className="dvr-header">
        <div className="dvr-title-section">
          <h2>Devoirs & Ressources</h2>
          <p>GÃ©rez vos supports de cours et assignations. Publiez de nouveaux Ã©lÃ©ments pour vos Ã©tudiants en quelques clics.</p>
        </div>
        
        <div className="dvr-filters">
          <div className="filter-group">
            <label>CLASSE</label>
            <select className="filter-select">
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.nom} - {c.niveau}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>MATIÃˆRE</label>
            <select className="filter-select">
              {matieres.map((m) => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
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
            <input
              type="text"
              placeholder="Ex: Devoir Chapitre 2"
              className="input-field"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Description & Consignes</label>
            <textarea
              placeholder="Detaillez les objectifs et les attentes..."
              className="input-field textarea-field"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Date limite</label>
              <input
                type="date"
                className="input-field"
                value={form.deadline}
                onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
            <div className="form-group flex-1">
              <label>Classe / Matiere</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="input-field"
                  value={form.classId}
                  onChange={(e) => setForm((prev) => ({ ...prev, classId: e.target.value }))}
                >
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
                <select
                  className="input-field"
                  value={form.matiereId}
                  onChange={(e) => setForm((prev) => ({ ...prev, matiereId: e.target.value }))}
                >
                  {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Documents joints</label>
            <div className="upload-zone">
              <FiUploadCloud size={24} color="#2563EB" />
              <strong>Glissez-dÃ©posez vos fichiers ici</strong>
              <span className="upload-desc">PDF, DOCX ou ZIP jusqu'Ã  25MB</span>
              <button type="button" className="upload-btn">Ou parcourir vos dossiers</button>
              <input
                type="file"
                onChange={(e) => setForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
              />
            </div>
          </div>

          <button className="primary-btn publish-btn" onClick={handleSubmit}>
            â–¸ Publier le {activeTab}
          </button>
        </div>

        {/* RIGHT COLUMN: STATS & LIST */}
        <div className="dvr-right-col">
          {/* STATS */}
          <div className="dvr-stats-row">
            <div className="stat-box primary-bg">
              <span className="stat-icon"><FiList size={20} /></span>
              <div className="stat-info">
                <strong>{stats.active_assignments}</strong>
                <p>DEVOIRS ACTIFS</p>
              </div>
            </div>
            <div className="stat-box secondary-bg">
              <span className="stat-icon"><FiFolder size={20} /></span>
              <div className="stat-info">
                <strong>{stats.shared_resources}</strong>
                <p>RESSOURCES PARTAGÃ‰ES</p>
              </div>
            </div>
          </div>

          {/* RECENT PUBS */}
          <div className="recent-pubs">
            <div className="recent-header">
              <h3>Publications rÃ©centes</h3>
              <a href="#" className="link-all">Voir tout</a>
            </div>
            
            <div className="recent-list">
              {recentPublications.map((item) => (
                <div className="recent-item" key={`${item.type}-${item.id}`}>
                  <div className={`item-icon-box ${item.type === 'Devoir' ? 'bg-blue' : 'bg-orange'}`}>
                    {item.type === 'Devoir' ? <FiCalendar color="#2563EB" /> : <FiFileText color="#EA580C" />}
                  </div>
                  <div className="item-details">
                    <h4>{item.title}</h4>
                    <p>{item.type} â€¢ {item.published_at || '-'}</p>
                    <div className="item-meta">
                      <span className="meta-badge">{item.class || 'Toutes'}</span>
                      <span className="meta-text">{item.matiere || '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {recentPublications.length === 0 && <p>Aucune publication recente.</p>}
            </div>
          </div>

          {/* GUIDE CARD */}
          <div className="guide-card">
            <div className="guide-content">
              <h4>Guide PÃ©dagogique</h4>
              <p>Structurez vos ressources pour maximiser l'intÃ©rÃªt de vos Ã©tudiants.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
