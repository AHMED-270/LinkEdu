import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DirectoryAnnonces.css';

function DirectoryAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Info',
    content: '',
    author: 'Direction'
  });

  useEffect(() => {
    fetchAnnonces();
  }, []);

  const fetchAnnonces = async () => {
    try {
      setLoading(true);
      const host = window.location.hostname;
      const apiBaseUrl = `http://${host}:8000`;
      
      const response = await axios.get(`${apiBaseUrl}/api/annonces`, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const fetchedAnnonces = response.data.map(a => ({
        id: a.id_annonce,
        title: a.titre,
        type: a.type,
        content: a.contenu,
        author: a.auteur,
        date: new Date(a.date_publication || a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      }));
      
      setAnnonces(fetchedAnnonces);
    } catch (error) {
      console.error("Erreur lors de la récupération des annonces:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData({ title: '', type: 'Info', content: '', author: 'Direction' });
    setShowModal(true);
  };
  
  const handleEditModal = (annonce) => {
    setEditingId(annonce.id);
    setFormData({
      title: annonce.title,
      type: annonce.type,
      content: annonce.content,
      author: annonce.author
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      try {
        const host = window.location.hostname;
        const apiBaseUrl = `http://${host}:8000`;
        await axios.delete(`${apiBaseUrl}/api/annonces/${id}`, { withCredentials: true });
        setAnnonces(annonces.filter(annonce => annonce.id !== id));
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression de l'annonce.");
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ title: '', type: 'Info', content: '', author: 'Direction' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const host = window.location.hostname;
    const apiBaseUrl = `http://${host}:8000`;
    const payload = {
        titre: formData.title,
        type: formData.type,
        contenu: formData.content,
        auteur: formData.author
    };

    try {
        if (editingId !== null) {
            const response = await axios.put(`${apiBaseUrl}/api/annonces/${editingId}`, payload, { withCredentials: true });
            
            setAnnonces(annonces.map(a => 
                a.id === editingId ? { 
                    ...a, 
                    ...formData, 
                    title: response.data.titre, 
                    content: response.data.contenu, 
                    type: response.data.type,
                    author: response.data.auteur
                } : a
            ));
        } else {
            const response = await axios.post(`${apiBaseUrl}/api/annonces`, payload, { withCredentials: true });
            
            const newAnnonce = {
                id: response.data.id_annonce,
                title: response.data.titre,
                type: response.data.type,
                content: response.data.contenu,
                author: response.data.auteur,
                date: new Date(response.data.date_publication).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            };
            setAnnonces([newAnnonce, ...annonces]);
        }
        handleCloseModal();
    } catch (error) {
        console.error("Erreur lors de l'enregistrement:", error);
        alert("Erreur lors de l'enregistrement de l'annonce.");
    }
  };

  return (
    <div className='directory-annonces-container'>
      <div className='annonces-header'>
        <div>
          <h1>Annonces et Communications</h1>
          <p>Gérez les annonces diffusées aux professeurs, étudiants et parents.</p>
        </div>
        <button className='btn-new-annonce' onClick={handleOpenModal}>+ Nouvelle Annonce</button>
      </div>

      {loading ? (
        <p>Chargement des annonces...</p>
      ) : (
        <div className='annonces-list'>
          {annonces.length === 0 && <p className='no-annonces'>Aucune annonce trouvée.</p>}
          {annonces.map((annonce) => (
            <div key={annonce.id} className='annonce-card'>
              <div className='annonce-card-header'>
                <span className={'annonce-badge badge-' + annonce.type.toLowerCase()}>{annonce.type}</span>
                <span className='annonce-date'>{annonce.date}</span>
              </div>
              <h3 className='annonce-title'>{annonce.title}</h3>
              <p className='annonce-content'>{annonce.content}</p>
              <div className='annonce-footer'>
                <span className='annonce-author'>Par : {annonce.author}</span>
                <div className='annonce-actions'>
                  <button className='btn-edit-annonce' onClick={() => handleEditModal(annonce)}>Modifier</button>
                  <button className='btn-delete-annonce' onClick={() => handleDelete(annonce.id)}>Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className='annonce-modal-overlay'>
          <div className='annonce-modal'>
            <h2>{editingId !== null ? 'Modifier une Annonce' : 'Ajouter une Annonce'}</h2>
            <form onSubmit={handleSave}>
              <div className='annonce-form-group'>
                <label>Titre</label>
                <input type='text' name='title' value={formData.title} onChange={handleChange} required />
              </div>
              <div className='annonce-form-group'>
                <label>Type</label>
                <select name='type' value={formData.type} onChange={handleChange}>
                  <option value='Info'>Info</option>
                  <option value='Important'>Important</option>
                  <option value='Nouveau'>Nouveau</option>
                </select>
              </div>
              <div className='annonce-form-group'>
                <label>Contenu</label>
                <textarea name='content' value={formData.content} onChange={handleChange} required rows='4'></textarea>
              </div>
              <div className='annonce-form-group'>
                <label>Auteur</label>
                <input type='text' name='author' value={formData.author} onChange={handleChange} required />
              </div>
              <div className='annonce-modal-actions'>
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

export default DirectoryAnnonces;
