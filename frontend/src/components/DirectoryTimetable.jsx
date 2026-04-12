import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DirectoryTimetable.css";

axios.defaults.withCredentials = true;

function DirectoryTimetable() {
  const [scheduleData, setScheduleData] = useState({});
  const [rawEmplois, setRawEmplois] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lookups
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    jour: 'Lundi',
    heure_debut: '08:00',
    heure_fin: '09:30',
    id_classe: '',
    id_matiere: '',
    id_professeur: '',
    salle: '',
    couleur: 'blue',
    statut: ''
  });

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const times = ["08:00", "09:30", "11:00", "14:00", "16:00"];

  useEffect(() => {
    fetchTimetable();
    fetchLookups();
  }, []);

  const fetchLookups = async () => {
    try {
      const url = `http://${window.location.hostname}:8000/api/emplois/lookups`;
      const response = await axios.get(url);
      setClasses(response.data.classes);
      setMatieres(response.data.matieres);
      setProfesseurs(response.data.professeurs);
    } catch (error) {
      console.error("Error fetching lookups:", error);
    }
  };

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const url = `http://${window.location.hostname}:8000/api/emplois`;
      const response = await axios.get(url);
      setRawEmplois(response.data);
      setScheduleData(formatScheduleData(response.data));
    } catch (error) {
      console.error("Error fetching timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatScheduleData = (data) => {
    const formatted = {};
    
    data.forEach((item) => {
      const timeStr = item.heure_debut && item.heure_debut.substring(0, 5);
      const day = item.jour;
      
      if (!formatted[timeStr]) {
        formatted[timeStr] = {};
      }
      
      formatted[timeStr][day] = {
        id: item.id_edt,
        raw: item,
        subject: item.matiere ? item.matiere.nom : 'Matière Inconnue',
        class: item.classe ? item.classe.nom : 'Classe Inconnue',
        room: item.salle || 'N/A',
        color: item.couleur || 'blue',
        status: item.statut || ''
      };
    });
    
    return formatted;
  };

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData({
      jour: 'Lundi',
      heure_debut: '08:00',
      heure_fin: '09:30',
      id_classe: classes.length > 0 ? classes[0].id_classe : '',
      id_matiere: matieres.length > 0 ? matieres[0].id_matiere : '',
      id_professeur: professeurs.length > 0 ? professeurs[0].id_professeur : '',
      salle: 'Salle A12',
      couleur: 'blue',
      statut: ''
    });
    setShowModal(true);
  };

  const handleEditModal = (cellData) => {
    const item = cellData.raw;
    setEditingId(item.id_edt);
    setFormData({
      jour: item.jour || 'Lundi',
      heure_debut: item.heure_debut ? item.heure_debut.substring(0, 5) : '08:00',
      heure_fin: item.heure_fin ? item.heure_fin.substring(0, 5) : '09:30',
      id_classe: item.id_classe || (classes.length > 0 ? classes[0].id_classe : ''),
      id_matiere: item.id_matiere || (matieres.length > 0 ? matieres[0].id_matiere : ''),
      id_professeur: item.id_professeur || (professeurs.length > 0 ? professeurs[0].id_professeur : ''),
      salle: item.salle || '',
      couleur: item.couleur || 'blue',
      statut: item.statut || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet emploi ?")) {
      try {
        const url = `http://${window.location.hostname}:8000/api/emplois/${id}`;
        await axios.delete(url);
        fetchTimetable();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = `http://${window.location.hostname}:8000/api/emplois`;
    
    try {
      if (editingId !== null) {
        await axios.put(`${url}/${editingId}`, formData);
      } else {
        await axios.post(url, formData);
      }
      handleCloseModal();
      fetchTimetable();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      if (error.response && error.response.status === 422) {
          const errors = error.response.data.errors;
          const messages = Object.values(errors).flat().join("\n");
          alert("Erreur de validation :\n" + messages);
      } else {
          alert("Erreur lors de l'enregistrement. Vérifiez votre connexion.");
      }
    }
  };

  if (loading) return <div style={{padding: '20px'}}>Chargement de l'emploi du temps...</div>;

  return (
    <div className="directory-timetable">
      <div className="timetable-header">
        <div className="timetable-title-group">
          <h1>Emploi du Temps</h1>
          <p>Semaine Dynamique</p>
        </div>
        <div className="timetable-actions">
          <button className="btn-new-emploi" onClick={handleOpenModal}>+ Ajouter un Emploi</button>
          <div className="week-nav">
            <button className="nav-btn">&lt;</button>
            <span className="week-label">Semaine Actuelle</span>
            <button className="nav-btn">&gt;</button>
          </div>
          <div className="view-toggle">
            <button className="toggle-btn active">Semaine</button>
            <button className="toggle-btn">Jour</button>
          </div>
        </div>
      </div>

      <div className="timetable-grid-container">
        <table className="timetable-table">
          <thead>
            <tr>
              <th className="time-col"></th>
              {days.map(day => (
                <th key={day} className={day === 'Mercredi' ? 'current-day-header' : ''}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map(time => (
              <tr key={time}>
                <td className="time-cell">{time}</td>
                {days.map(day => {
                  const cellData = scheduleData[time]?.[day];
                  return (
                    <td key={`${time}-${day}`} className={day === 'Mercredi' ? 'current-day-col' : ''}>
                      {cellData ? (
                        <div className={`course-card border-${cellData.color}`}>
                          <div className="course-card-actions">
                            <button className="btn-edit-icon" onClick={() => handleEditModal(cellData)}>✎</button>
                            <button className="btn-delete-icon" onClick={() => handleDelete(cellData.id)}>×</button>
                          </div>
                          {cellData.status && <div className="course-status">{cellData.status}</div>}
                          <strong className="course-subject">{cellData.subject}</strong>
                          <div className="course-details">
                            <span className="course-class">{cellData.class}</span>
                            <span className="course-room">{cellData.room}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="empty-cell"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className='emploi-modal-overlay'>
          <div className='emploi-modal'>
            <h2>{editingId !== null ? 'Modifier un Emploi' : 'Ajouter un Emploi'}</h2>
            <form onSubmit={handleSave}>
              <div className="emploi-form-row">
                <div className='emploi-form-group'>
                  <label>Jour</label>
                  <select name='jour' value={formData.jour} onChange={handleChange}>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className='emploi-form-group'>
                  <label>Heure Début</label>
                  <input type='time' name='heure_debut' value={formData.heure_debut} onChange={handleChange} required />
                </div>
                <div className='emploi-form-group'>
                  <label>Heure Fin</label>
                  <input type='time' name='heure_fin' value={formData.heure_fin} onChange={handleChange} required />
                </div>
              </div>

              <div className="emploi-form-row">
                <div className='emploi-form-group'>
                  <label>Classe</label>
                  <select name='id_classe' value={formData.id_classe} onChange={handleChange} required>
                    <option value="">Sélectionnez...</option>
                    {classes.map(c => <option key={c.id_classe} value={c.id_classe}>{c.nom} ({c.niveau})</option>)}
                  </select>
                </div>
                <div className='emploi-form-group'>
                  <label>Matière</label>
                  <select name='id_matiere' value={formData.id_matiere} onChange={handleChange} required>
                    <option value="">Sélectionnez...</option>
                    {matieres.map(m => <option key={m.id_matiere} value={m.id_matiere}>{m.nom}</option>)}
                  </select>
                </div>
                <div className='emploi-form-group'>
                  <label>Professeur</label>
                  <select name='id_professeur' value={formData.id_professeur} onChange={handleChange} required>
                    <option value="">Sélectionnez...</option>
                    {professeurs.map(p => <option key={p.id_professeur} value={p.id_professeur}>{p.user ? p.user.name : `ID: ${p.id_professeur}`} - {p.specialite}</option>)}
                  </select>
                </div>
              </div>

              <div className="emploi-form-row">
                <div className='emploi-form-group'>
                  <label>Salle</label>
                  <input type='text' name='salle' value={formData.salle} onChange={handleChange} />
                </div>
                <div className='emploi-form-group'>
                  <label>Couleur</label>
                  <select name='couleur' value={formData.couleur} onChange={handleChange}>
                    <option value='blue'>Bleu</option>
                    <option value='green'>Vert</option>
                    <option value='red'>Rouge</option>
                    <option value='yellow'>Jaune</option>
                  </select>
                </div>
                <div className='emploi-form-group'>
                  <label>Statut</label>
                  <input type='text' name='statut' value={formData.statut} onChange={handleChange} placeholder="Ex: En cours" />
                </div>
              </div>

              <div className='emploi-modal-actions'>
                <button type='button' className='btn-cancel' onClick={handleCloseModal}>Annuler</button>
                <button type='submit' className='btn-save'>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DirectoryTimetable;
