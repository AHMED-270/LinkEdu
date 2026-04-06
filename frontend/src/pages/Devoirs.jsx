import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiList, FiFolder, FiFileText, FiCalendar, FiUploadCloud, FiEye, FiEdit2, FiTrash2, FiMessageCircle, FiX, FiCheck, FiArrowLeft, FiClock, FiDownload } from 'react-icons/fi';
import { professorGet, professorPost, professorPut, professorDelete } from '../services/professorApi';
import './Devoirs.css';

export default function Devoirs() {
  const [activeTab, setActiveTab] = useState('devoir');
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [matieresByClass, setMatieresByClass] = useState({});
  const [publications, setPublications] = useState([]);
  const [stats, setStats] = useState({ active_assignments: 0, shared_resources: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [submissionsModal, setSubmissionsModal] = useState({ open: false, devoirId: null, data: [], loading: false, devoirData: null });
  const [detailsModal, setDetailsModal] = useState({ open: false, data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, type: null });
  const [editingId, setEditingId] = useState(null);
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
      const nextMatieresByClass = data.matieres_by_class || {};
      setClasses(nextClasses);
      setMatieres(nextMatieres);
      setMatieresByClass(nextMatieresByClass);
      setPublications(data.publications || []);
      setStats(data.stats || { active_assignments: 0, shared_resources: 0 });
      setForm((prev) => ({
        ...prev,
        classId: prev.classId || (nextClasses[0]?.id ? String(nextClasses[0].id) : ''),
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

  const teacherPairs = useMemo(() => {
    const pairs = [];
    classes.forEach((c) => {
      const mats = matieresByClass[c.id] || [];
      mats.forEach((m) => {
        pairs.push({
          classId: c.id,
          className: c.nom,
          niveau: c.niveau,
          matiereId: m.id,
          matiereName: m.nom,
        });
      });
    });
    return pairs;
  }, [classes, matieresByClass]);

  const resolvedMatiereId = form.matiereId 
    ? Number(form.matiereId) 
    : Number(teacherPairs[0]?.matiereId || 0);

  const resolvedClassId = form.classId 
    ? Number(form.classId) 
    : Number(teacherPairs[0]?.classId || 0);

  useEffect(() => {
    if (teacherPairs.length > 0 && (!form.classId || !form.matiereId)) {
      setForm((prev) => ({
        ...prev,
        classId: String(teacherPairs[0].classId),
        matiereId: String(teacherPairs[0].matiereId),
      }));
    }
  }, [teacherPairs, form.classId, form.matiereId]);

  const handleDelete = (id, type) => {
    setDeleteModal({ open: true, id, type });
  };

  const confirmDelete = async () => {
    try {
      if (deleteModal.type === 'Devoir') {
        await professorDelete('/api/professeur/devoirs/' + deleteModal.id);
      } else {
        await professorDelete('/api/professeur/ressources/' + deleteModal.id);
      }
      setDeleteModal({ open: false, id: null, type: null });
      loadData();
    } catch {
      alert("Erreur lors de la suppression.");
    }
  };

  const handleEdit = (item) => {
    setActiveTab(item.type === 'Devoir' ? 'devoir' : 'ressource');
    setEditingId(item.id);
    
    setForm({
      classId: item.classId ? String(item.classId) : String(resolvedClassId),
      matiereId: item.matiereId ? String(item.matiereId) : String(resolvedMatiereId),
      title: item.title || '',
      description: item.description || '',
      deadline: item.deadline || '',
      type: item.resource_type || 'PDF',
      file: null,
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm((prev) => ({ ...prev, title: '', description: '', deadline: '', file: null }));
  };

  const openSubmissions = async (devoirId, item) => {
    setSubmissionsModal({ open: true, devoirId, data: [], loading: true, devoirData: item });
    try {
      const res = await professorGet('/api/professeur/devoirs/' + devoirId + '/soumissions');
      setSubmissionsModal({ open: true, devoirId, data: res.soumissions || [], loading: false, devoirData: item });
    } catch {
      setSubmissionsModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleMarkReceived = async (id_soumission) => {
    try {
      await professorPut('/api/professeur/soumissions/' + id_soumission + '/received', {});
      setSubmissionsModal(prev => ({
        ...prev,
        data: prev.data.map(s => s.id_soumission === id_soumission ? { ...s, statut: 'bien_recu' } : s)
      }));
    } catch {
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleSubmit = async () => {
    try {
      if (activeTab === 'devoir') {
        if (editingId) {
          await professorPut('/api/professeur/devoirs/' + editingId, {
            title: form.title,
            description: form.description,
            deadline: form.deadline,
            classId: resolvedClassId,
            matiereId: resolvedMatiereId > 0 ? resolvedMatiereId : null,
          });
        } else {
          await professorPost('/api/professeur/devoirs', {
            title: form.title,
            description: form.description,
            deadline: form.deadline,
            classId: resolvedClassId,
            matiereId: resolvedMatiereId > 0 ? resolvedMatiereId : null,
          });
        }
      } else {
        const cleanTitle = String(form.title || '').trim();
        const cleanDescription = String(form.description || '').trim();

        if (!cleanTitle || !cleanDescription) {
          setError('Le titre et la description de la ressource sont obligatoires.');
          return;
        }

        const formData = new FormData();
        formData.append('title', cleanTitle);
        formData.append('description', cleanDescription);
        formData.append('type', form.type);
        if (form.file) {
           formData.append('file', form.file);
        }
        
        if (editingId) {
          formData.append('classId', String(resolvedClassId));
          if (resolvedMatiereId > 0) {
            formData.append('matiereId', String(resolvedMatiereId));
          }
          // send as post for multipart form data updates
          await professorPost('/api/professeur/ressources/' + editingId, formData, true);
        } else {
          formData.append('classId', String(resolvedClassId));
          if (resolvedMatiereId > 0) {
            formData.append('matiereId', String(resolvedMatiereId));
          }
          await professorPost('/api/professeur/ressources', formData, true);
        }
      }

      setForm((prev) => ({ ...prev, title: '', description: '', deadline: '', file: null }));
      setEditingId(null);
      await loadData();
    } catch {
      setError('Opération impossible. Verifiez les champs obligatoires.');
    }
  };

  const recentPublications = useMemo(() => {
    return publications.filter(p => {
      const groupMatch = filterGroup === 'all' || (p.class && p.class.includes(filterGroup));
      const typeMatch = activeTab === 'devoir' ? p.type === 'Devoir' : p.type !== 'Devoir';
      return groupMatch && typeMatch;
    }).slice(0, 12);
  }, [publications, filterGroup, activeTab]);

  const getDisplayTitle = (item) => {
    const raw = String(item?.title || '').trim();
    if (item?.type === 'Ressource') {
      return raw || 'Ressource sans titre';
    }
    return raw || 'Sans titre';
  };

  const singleMatiere = matieres.length === 1;

  if (submissionsModal.open) {
    return (
      <div className="dvr-page flex flex-col h-full" style={{ padding: '1.5rem', backgroundColor: '#f8fafc', height: '100%' }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <button
              onClick={() => setSubmissionsModal({ open: false, devoirId: null, data: [], loading: false, devoirData: null })}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
            >
              <FiArrowLeft /> Retour
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
              Réponses: {submissionsModal.devoirData?.title}
            </h2>
          </div>

          {submissionsModal.loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>Chargement des réponses...</div>
          ) : submissionsModal.data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>Aucun élève n'a encore répondu à ce devoir.</div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {submissionsModal.data.map(sub => (
                <div key={sub.id_soumission} style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid', borderColor: sub.en_retard ? '#fecaca' : '#e2e8f0', backgroundColor: sub.en_retard ? '#fef2f2' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem 0' }}>{sub.etudiant_nom}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiCalendar /> Envoyé le: {sub.date_soumission}
                      </span>
                      {sub.en_retard && (
                        <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700, borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>En retard</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {sub.statut === 'bien_recu' ? (
                      <span style={{ padding: '0.5rem 1rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '0.875rem', fontWeight: 700, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiCheck /> Bien reçu
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleMarkReceived(sub.id_soumission)}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: '#fff', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                      >
                        Marquer bien reçu
                      </button>
                    )}
                    {sub.fichier_path && (
                      <a 
                        href={`/storage/${sub.fichier_path}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.5rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <FiFileText /> Voir Fichier
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dvr-page">
      {/* HEADER SECTION */}
      <div className="dvr-header">
        <div className="dvr-title-section">
          <h2>Devoirs & Ressources</h2>
          <p>Gérez vos supports de cours et assignations. Publiez de nouveaux éléments pour vos étudiants en quelques clics.</p>
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
            {activeTab === 'devoir' && (
              <div className="form-group flex-1">
                <label>Date limite</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.deadline}
                  onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            )}
            <div className="form-group flex-1">
              <label>{singleMatiere ? 'Classe' : 'Classe / Matière'}</label>
              <select
                className="input-field"
                value={`${form.classId}-${form.matiereId}`}
                onChange={(e) => {
                  const [c, m] = e.target.value.split('-');
                  setForm((prev) => ({ ...prev, classId: c, matiereId: m }));
                }}
              >
                {teacherPairs.map((pair) => (
                  <option key={`${pair.classId}-${pair.matiereId}`} value={`${pair.classId}-${pair.matiereId}`}>
                    {singleMatiere ? pair.className : `${pair.className} - ${pair.matiereName}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Documents joints</label>
            <div className="upload-zone">
              <FiUploadCloud size={24} color="#2563EB" />
              <strong>Glissez-déposez vos fichiers ici</strong>
              <span className="upload-desc">PDF, DOCX ou ZIP jusqu'à 25MB</span>
              <button type="button" className="upload-btn">Ou parcourir vos dossiers</button>
              <input
                type="file"
                onChange={(e) => setForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
              />
            </div>
          </div>

          <button className="primary-btn publish-btn" onClick={handleSubmit}>
            ▸ {editingId ? 'Mettre à jour le ' : 'Publier le '} {activeTab}
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
                <strong>{stats.active_assignments}</strong>
                <p>DEVOIRS ACTIFS</p>
              </div>
            </div>
            <div className="stat-box secondary-bg">
              <span className="stat-icon"><FiFolder size={20} /></span>
              <div className="stat-info">
                <strong>{stats.shared_resources}</strong>
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
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                <thead style={{ textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.6875rem' }}>Titre</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.6875rem' }}>Classe</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.6875rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPublications.map((item) => (
                    <tr key={`${item.type}-${item.id}`} style={{ borderBottom: '1px solid #f1f5f9', transition: 'colors 150ms' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                         <div style={{ fontWeight: 600, color: '#334155' }}>{getDisplayTitle(item)}</div>
                         <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginTop: '0.125rem' }}>{item.published_at ? item.published_at : ''}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                         <div style={{ display: 'inline-block', padding: '0.25rem 0.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem', color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>
                           {item.class?.split(' - ')[0] || 'Toutes'}
                         </div>
                      </td>
                    
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          title="Voir les détails"
                          onClick={() => setDetailsModal({ open: true, data: item })}
                          style={{ padding: '0.375rem', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '0.375rem', fontSize: '1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <FiEye />
                        </button>
                        {item.type === 'Devoir' && (
                          <button 
                            title="Réponses"
                            onClick={() => openSubmissions(item.id, item)}
                            style={{ padding: '0.375rem', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '0.375rem', fontSize: '1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                             <FiMessageCircle />
                          </button>
                        )}
                        <button 
                          title="Modifier"
                          onClick={() => handleEdit(item)}
                          style={{ padding: '0.375rem', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '0.375rem', fontSize: '1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                           <FiEdit2 />
                        </button>
                        <button 
                          title="Supprimer"
                          onClick={() => handleDelete(item.id, item.type)}
                          style={{ padding: '0.375rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.375rem', fontSize: '1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                           <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {recentPublications.length === 0 && (
                     <tr><td colSpan="3" style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8' }}>Aucune publication récente.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        
        </div>
      </div>

      {detailsModal.open && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147483647, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', padding: '2rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: '42rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: detailsModal.data?.type === 'Devoir' ? '#eff6ff' : '#f0fdf4', color: detailsModal.data?.type === 'Devoir' ? '#2563eb' : '#16a34a', borderRadius: '0.5rem' }}>
                  {detailsModal.data?.type === 'Devoir' ? <FiList size={20} /> : <FiFolder size={20} />}
                </div>
                Détails du {detailsModal.data?.type}
              </h2>
              <button 
                onClick={() => setDetailsModal({ open: false, data: null })} 
                style={{ padding: '0.5rem', backgroundColor: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 150ms' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#fff' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>Titre</p>
                <p style={{ fontSize: '1.125rem', color: '#1e293b', fontWeight: 700, margin: 0 }}>{getDisplayTitle(detailsModal.data)}</p>
              </div>

              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>Description</p>
                <p style={{ fontSize: '1rem', color: '#334155', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {detailsModal.data?.description || "Aucune description fournie."}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>Classe assignée</p>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    {detailsModal.data?.class || "Toutes les classes"}
                  </div>
                </div>

                {detailsModal.data?.type === 'Devoir' && detailsModal.data?.deadline && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>Date limite</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                      <FiClock /> {detailsModal.data?.deadline}
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
              )}
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
        </div>,
        document.body
      )}
    </div>
  );
}

