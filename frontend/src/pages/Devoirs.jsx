<<<<<<<<< Temporary merge branch 1
﻿import { useEffect, useMemo, useState } from 'react';
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

=========
import './Devoirs.css';

export default function Devoirs() {
>>>>>>>>> Temporary merge branch 2
  return (
    <div className="dvr-page">
      {/* HEADER SECTION */}
      <div className="dvr-header">
        <div className="dvr-title-section">
          <h2>Devoirs & Ressources</h2>
          <p>Gérez vos supports de cours et assignations. Publiez de nouveaux éléments pour vos étudiants en quelques clics.</p>
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
            <label>MATIÈRE</label>
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
            <input type="text" placeholder="Ex: Analyse des naines blanches - TP 1" className="input-field" />
          </div>

          <div className="form-group">
            <label>Description & Consignes</label>
            <textarea placeholder="Détaillez les objectifs et les attentes..." className="input-field textarea-field"></textarea>
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
              <strong>Glissez-déposez vos fichiers ici</strong>
              <span className="upload-desc">PDF, DOCX ou ZIP jusqu'à 25MB</span>
              <button type="button" className="upload-btn">Ou parcourir vos dossiers</button>
            </div>
          </div>

          <button className="primary-btn publish-btn" onClick={handleSubmit}>
            ▸ Publier le {activeTab}
          </button>
          {editingId && (
            <button className="cancel-btn" onClick={cancelEdit} style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              ✕ Annuler la modification
            </button>
          )}
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
          <div className="recent-pubs" style={{ flex: 1, padding: '1.5rem', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
            <div className="recent-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Liste des {activeTab === 'devoir' ? 'Devoirs' : 'Ressources'}
              </h3>
              <select 
                value={filterGroup} 
                onChange={(e) => setFilterGroup(e.target.value)}
                className="input-field" 
                style={{ width: 'auto', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
              >
                <option value="all">Tous les groupes</option>
                {classes.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
              </select>
            </div>
            
            <div className="recent-list">
              {recentPublications.map((item) => (
                <div className="recent-item" key={`${item.type}-${item.id}`}>
                  <div className={`item-icon-box ${item.type === 'Devoir' ? 'bg-blue' : 'bg-orange'}`}>
                    {item.type === 'Devoir' ? <FiCalendar color="#2563EB" /> : <FiFileText color="#EA580C" />}
                  </div>
                  <div className="item-details">
                    <h4>{item.title}</h4>
                    <p>{item.type} • {item.published_at || '-'}</p>
                    <div className="item-meta">
                      <span className="meta-badge">{item.class || 'Toutes'}</span>
                      <span className="meta-text">{item.matiere || '-'}</span>
                    </div>
                  </div>
                )}
              </div>

              {detailsModal.data?.file_path && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>Fichier joint</p>
                  <a 
                    href={`/storage/${detailsModal.data?.file_path}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#f8fafc', color: '#2563eb', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontWeight: 600, textDecoration: 'none', transition: 'all 150ms' }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    <FiDownload size={18} /> Télécharger le fichier
                  </a>
                </div>
              ))}
              {recentPublications.length === 0 && <p>Aucune publication recente.</p>}
            </div>
            
           
          </div>
        </div>,
        document.body
      )}

      {deleteModal.open && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147483647, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', padding: '2rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '1.5rem', width: '100%', maxWidth: '28rem', overflow: 'hidden', padding: '2rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ margin: '0 auto 1.5rem', width: '4rem', height: '4rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiTrash2 size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Confirmer la suppression</h2>
            <p style={{ color: '#475569', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible et supprimera également les données associées.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setDeleteModal({ open: false, id: null, type: null })}
                style={{ flex: 1, padding: '0.75rem 1.5rem', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background-color 150ms' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                Annuler
              </button>
              <button 
                onClick={confirmDelete}
                style={{ flex: 1, padding: '0.75rem 1.5rem', backgroundColor: '#dc2626', color: '#fff', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background-color 150ms' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                Supprimer
              </button>
            </div>
          </div>
=========
          <p>Les devoirs et ressources seront gérés depuis la base de données.</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Classe</th>
                <th>Matière</th>
                <th>Date limite</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
>>>>>>>>> Temporary merge branch 2
        </div>
      </div>
    </div>
  );
}

