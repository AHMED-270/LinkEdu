import { useMemo, useState } from 'react';
import { FiList, FiFolder, FiUploadCloud } from 'react-icons/fi';
import './Devoirs.css';

const CLASSES = [
  { id: '1', nom: '1AC-A', niveau: 'college' },
  { id: '2', nom: '2AC-B', niveau: 'college' },
];

const MATIERES = [
  { id: '1', nom: 'Mathematiques' },
  { id: '2', nom: 'Physique' },
];

const INITIAL_PUBLICATIONS = [
  {
    id: 'd1',
    type: 'Devoir',
    title: 'Exercice chapitre 3',
    classLabel: '1AC-A',
    matiere: 'Mathematiques',
    date: '2026-04-15',
  },
  {
    id: 'r1',
    type: 'Ressource',
    title: 'Fiche de revision optique',
    classLabel: '2AC-B',
    matiere: 'Physique',
    date: '2026-04-10',
  },
];

export default function Devoirs() {
  const [activeTab, setActiveTab] = useState('devoir');
  const [form, setForm] = useState({
    title: '',
    description: '',
    classId: CLASSES[0]?.id ?? '',
    matiereId: MATIERES[0]?.id ?? '',
    deadline: '',
  });
  const [publications, setPublications] = useState(INITIAL_PUBLICATIONS);

  const filteredPublications = useMemo(() => {
    if (activeTab === 'devoir') {
      return publications.filter((item) => item.type === 'Devoir');
    }
    return publications.filter((item) => item.type === 'Ressource');
  }, [activeTab, publications]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const selectedClass = CLASSES.find((item) => item.id === form.classId);
    const selectedMatiere = MATIERES.find((item) => item.id === form.matiereId);

    setPublications((prev) => [
      {
        id: `${activeTab}-${Date.now()}`,
        type: activeTab === 'devoir' ? 'Devoir' : 'Ressource',
        title: form.title,
        classLabel: selectedClass?.nom ?? '-',
        matiere: selectedMatiere?.nom ?? '-',
        date: form.deadline || new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);

    setForm((prev) => ({ ...prev, title: '', description: '', deadline: '' }));
  };

  return (
    <div className="dvr-page">
      <div className="dvr-header">
        <div className="dvr-title-section">
          <h2>Devoirs & Ressources</h2>
          <p>Publiez vos activites et vos supports pour vos classes.</p>
        </div>
      </div>

      <div className="dvr-content">
        <div className="dvr-left-col bg-white">
          <div className="tab-container">
            <button className={`tab-btn ${activeTab === 'devoir' ? 'active' : ''}`} onClick={() => setActiveTab('devoir')}>
              <FiList /> Publier un devoir
            </button>
            <button className={`tab-btn ${activeTab === 'ressource' ? 'active' : ''}`} onClick={() => setActiveTab('ressource')}>
              <FiFolder /> Publier une ressource
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Titre</label>
              <input
                type="text"
                className="input-field"
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="input-field textarea-field"
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Classe</label>
                <select className="input-field" value={form.classId} onChange={(event) => handleChange('classId', event.target.value)}>
                  {CLASSES.map((item) => (
                    <option key={item.id} value={item.id}>{item.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form-group flex-1">
                <label>Matiere</label>
                <select className="input-field" value={form.matiereId} onChange={(event) => handleChange('matiereId', event.target.value)}>
                  {MATIERES.map((item) => (
                    <option key={item.id} value={item.id}>{item.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Date limite</label>
              <input
                type="date"
                className="input-field"
                value={form.deadline}
                onChange={(event) => handleChange('deadline', event.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Documents joints</label>
              <div className="upload-zone">
                <FiUploadCloud size={24} color="#2563EB" />
                <strong>Ajoutez vos fichiers</strong>
                <span className="upload-desc">PDF, DOCX ou ZIP</span>
              </div>
            </div>

            <button type="submit" className="primary-btn publish-btn">
              Publier
            </button>
          </form>
        </div>

        <div className="dvr-right-col">
          <div className="recent-pubs" style={{ flex: 1, padding: '1.5rem', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
            <h3>Liste des {activeTab === 'devoir' ? 'devoirs' : 'ressources'}</h3>
            <div className="recent-list">
              {filteredPublications.map((item) => (
                <div className="recent-item" key={item.id}>
                  <div className="item-details">
                    <h4>{item.title}</h4>
                    <p>{item.type} - {item.date}</p>
                    <div className="item-meta">
                      <span className="meta-badge">{item.classLabel}</span>
                      <span className="meta-text">{item.matiere}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredPublications.length === 0 && <p>Aucune publication.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}