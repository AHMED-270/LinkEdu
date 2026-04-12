<<<<<<<<< Temporary merge branch 1
﻿import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, X, File, BookOpen, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
=========
import './Ressources.css';
>>>>>>>>> Temporary merge branch 2

export default function Ressources() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [matiere, setMatiere] = useState('');
  const [classe, setClasse] = useState('');
  const [visibility, setVisibility] = useState('classe');
  const [files, setFiles] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Ressource publiée avec succès !');
    setTitle(''); setType(''); setMatiere(''); setClasse(''); setFiles([]);
  };

  return (
    <div className="ressources-page">
      <div className="ressources-header animate-fade-in">
        <h2>Publier une Ressource</h2>
        <p>Partagez des documents pédagogiques avec vos classes</p>
      </div>

      <div className="ressources-content animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header"><h3>Nouvelle ressource</h3></div>
          <div className="card-body">
            <form className="devoirs-form" onSubmit={handleSubmit} id="ressource-form">
              <div className="form-group">
                <label className="form-label">Titre de la ressource</label>
                <input type="text" className="form-input" placeholder="Ex: Cours Chapitre 4 - Thermodynamique" value={title} onChange={(e) => setTitle(e.target.value)} id="ressource-title" />
              </div>
              <div className="devoirs-form-row">
                <div className="form-group">
                  <label className="form-label">Type de document</label>
                  <select className="form-select" value={type} onChange={(e) => setType(e.target.value)} id="ressource-type">
                    <option value="">Sélectionner</option>
                    <option value="cours">Cours</option>
                    <option value="fiche">Fiche de révision</option>
                    <option value="exercice">Exercices</option>
                    <option value="tp">Travaux Pratiques</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Matière</label>
                  <select className="form-select" value={matiere} onChange={(e) => setMatiere(e.target.value)} id="ressource-matiere">
                    <option value="">Sélectionner</option>
                    <option value="physique">Physique</option>
                    <option value="chimie">Chimie</option>
                    <option value="maths">Mathématiques</option>
                    <option value="svt">SVT</option>
                  </select>
                </div>
              </div>
              <div className="devoirs-form-row">
                <div className="form-group">
                  <label className="form-label">Classe cible</label>
                  <select className="form-select" value={classe} onChange={(e) => setClasse(e.target.value)} id="ressource-class">
                    <option value="">Sélectionner</option>
                    <option value="2bac-g1">2BAC Sciences - G1</option>
                    <option value="2bac-g2">2BAC Sciences - G2</option>
                    <option value="1bac-g3">1BAC Sciences - G3</option>
                    <option value="tcs-g2">TCS - G2</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Visibilité</label>
                  <select className="form-select" value={visibility} onChange={(e) => setVisibility(e.target.value)} id="ressource-visibility">
                    <option value="classe">Toute la classe</option>
                    <option value="specific">Élèves spécifiques</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fichier(s)</label>
                <label className="devoirs-upload" htmlFor="ressource-files">
                  <FiUpload size={20} />
                  <span>Déposer vos fichiers ici</span>
                  <span className="devoirs-upload-hint">PDF, DOC, PPT, Images</span>
                  <input type="file" id="ressource-files" multiple hidden onChange={(e) => setFiles([...e.target.files])} />
                </label>
              </div>
              <button type="submit" className="btn btn-primary" id="btn-publish-ressource">
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
                    <th>Matière</th>
                    <th>Classe</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {existingResources.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.title}</td>
                      <td><span className="badge badge-blue">{r.type}</span></td>
                      <td>{r.matiere}</td>
                      <td>{r.class}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-xs)' }}>{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

      </motion.div>
=========
  return (
    <div className="ressources-page">
      <div className="ressources-header animate-fade-in">
        <h2>Publier une Ressource</h2>
        <p>Les ressources seront gérées depuis la base de données.</p>
      </div>

      <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Matière</th>
                <th>Classe</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
>>>>>>>>> Temporary merge branch 2
    </div>
  );
}

