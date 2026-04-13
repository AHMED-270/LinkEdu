import { useState } from 'react';
import { FiUpload, FiCheck } from 'react-icons/fi';
import './Ressources.css';

const INITIAL_RESOURCES = [
  { id: 1, title: 'Cours Chapitre 4', type: 'Cours', matiere: 'Mathematiques', className: '1AC-A', date: '2026-04-10' },
  { id: 2, title: 'Fiche de revision', type: 'Fiche', matiere: 'Physique', className: '2AC-B', date: '2026-04-08' },
];

export default function Ressources() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [matiere, setMatiere] = useState('');
  const [classe, setClasse] = useState('');
  const [resources, setResources] = useState(INITIAL_RESOURCES);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!title || !type || !matiere || !classe) {
      return;
    }

    setResources((prev) => [
      {
        id: Date.now(),
        title,
        type,
        matiere,
        className: classe,
        date: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);

    setTitle('');
    setType('');
    setMatiere('');
    setClasse('');
  };

  return (
    <div className="ressources-page">
      <div className="ressources-header animate-fade-in">
        <h2>Publier une Ressource</h2>
        <p>Partagez des documents pedagogiques avec vos classes.</p>
      </div>

      <div className="ressources-content animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header"><h3>Nouvelle ressource</h3></div>
          <div className="card-body">
            <form className="devoirs-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Titre</label>
                <input type="text" className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>

              <div className="devoirs-form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={type} onChange={(event) => setType(event.target.value)}>
                    <option value="">Selectionner</option>
                    <option value="Cours">Cours</option>
                    <option value="Fiche">Fiche de revision</option>
                    <option value="Exercice">Exercices</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Matiere</label>
                  <select className="form-select" value={matiere} onChange={(event) => setMatiere(event.target.value)}>
                    <option value="">Selectionner</option>
                    <option value="Mathematiques">Mathematiques</option>
                    <option value="Physique">Physique</option>
                    <option value="SVT">SVT</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Classe</label>
                <select className="form-select" value={classe} onChange={(event) => setClasse(event.target.value)}>
                  <option value="">Selectionner</option>
                  <option value="1AC-A">1AC-A</option>
                  <option value="2AC-B">2AC-B</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fichier(s)</label>
                <label className="devoirs-upload" htmlFor="ressource-files">
                  <FiUpload size={20} />
                  <span>Deposer vos fichiers ici</span>
                  <span className="devoirs-upload-hint">PDF, DOC, PPT, Images</span>
                  <input type="file" id="ressource-files" multiple hidden />
                </label>
              </div>

              <button type="submit" className="btn btn-primary">
                <FiCheck size={16} /> Publier la ressource
              </button>
            </form>
          </div>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <div className="card-header"><h3>Ressources existantes</h3></div>
          <div className="card-body">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Type</th>
                    <th>Matiere</th>
                    <th>Classe</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.title}</td>
                      <td>{item.type}</td>
                      <td>{item.matiere}</td>
                      <td>{item.className}</td>
                      <td>{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}