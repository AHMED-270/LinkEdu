import React, { useState, useEffect } from 'react';
import './DirectorySettings.css';
import axios from 'axios';
import { ROLE, getRoleLabel } from '../constants/roles';

const DirectorySettings = ({ userRole = ROLE.DIRECTEUR }) => {
  const [activeTab, setActiveTab] = useState('profil');
  const [profileData, setProfileData] = useState({
    nom: '',
    email: '',
    telephone: '',
    etablissement: '',
    adresse: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [passwordData, setPasswordData] = useState({
    actuel: '',
    nouveau: '',
    confirmation: ''
  });
  const currentRoleLabel = getRoleLabel(userRole);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/directeur/profile', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setProfileData(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement du profil", error);
      setIsLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const response = await axios.put('http://localhost:8000/api/directeur/profile', profileData, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setSuccessMessage(response.data.message);
      setProfileData(response.data.profile);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (passwordData.nouveau !== passwordData.confirmation) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      return;
    }
    
    try {
      const response = await axios.put('http://localhost:8000/api/directeur/password', {
        actuel: passwordData.actuel,
        nouveau: passwordData.nouveau
      }, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setSuccessMessage(response.data.message);
      setPasswordData({ actuel: '', nouveau: '', confirmation: '' });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    }
  };

  return (
    <div className="directory-settings">
      <div className="settings-header">
        <h2>Paramètres du Compte</h2>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          <ul>
            <li 
              className={activeTab === 'profil' ? 'active' : ''} 
              onClick={() => { setActiveTab('profil'); clearMessages(); }}
            >
              <i className="fa-regular fa-user"></i> Mon Profil
            </li>
            <li 
              className={activeTab === 'securite' ? 'active' : ''} 
              onClick={() => { setActiveTab('securite'); clearMessages(); }}
            >
              <i className="fa-solid fa-lock"></i> Sécurité
            </li>
            <li 
              className={activeTab === 'notifications' ? 'active' : ''} 
              onClick={() => { setActiveTab('notifications'); clearMessages(); }}
            >
              <i className="fa-regular fa-bell"></i> Notifications
            </li>
          </ul>
        </div>

        <div className="settings-content">
          {successMessage && <div className="settings-alert success">{successMessage}</div>}
          {errorMessage && <div className="settings-alert error">{errorMessage}</div>}

          {activeTab === 'profil' && (
            <div className="settings-section fade-in">
              <h3>Informations Personnelles</h3>
              <div className="profile-header-edit">
                <div className="profile-avatar-large">
                  <div className="avatar-placeholder">{profileData.nom ? profileData.nom.substring(0,2).toUpperCase() : 'DP'}</div>
                  <button className="change-avatar-btn"><i className="fa-solid fa-camera"></i></button>
                </div>
                <div className="profile-role-badge">{currentRoleLabel}</div>
              </div>

              {isLoading ? (
                <p>Chargement...</p>
              ) : (
                <form onSubmit={saveProfile} className="settings-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nom Complet</label>
                      <input type="text" name="nom" value={profileData.nom} onChange={handleProfileChange} required />
                    </div>
                    <div className="form-group">
                      <label>Email Professionnel</label>
                      <input type="email" name="email" value={profileData.email} onChange={handleProfileChange} required />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Téléphone</label>
                      <input type="text" name="telephone" value={profileData.telephone} onChange={handleProfileChange} />
                    </div>
                    <div className="form-group">
                      <label>Établissement</label>
                      <input type="text" name="etablissement" value={profileData.etablissement} onChange={handleProfileChange} readOnly className="readonly-input" />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Adresse de l'établissement</label>
                    <input type="text" name="adresse" value={profileData.adresse} onChange={handleProfileChange} />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Enregistrer les modifications</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'securite' && (
            <div className="settings-section fade-in">
              <h3>Changer le Mot de Passe</h3>
              <form onSubmit={savePassword} className="settings-form">
                <div className="form-group full-width">
                  <label>Mot de passe actuel</label>
                  <input type="password" name="actuel" value={passwordData.actuel} onChange={handlePasswordChange} required />
                </div>
                <div className="form-group full-width">
                  <label>Nouveau mot de passe</label>
                  <input type="password" name="nouveau" value={passwordData.nouveau} onChange={handlePasswordChange} required />
                </div>
                <div className="form-group full-width">
                  <label>Confirmer le nouveau mot de passe</label>
                  <input type="password" name="confirmation" value={passwordData.confirmation} onChange={handlePasswordChange} required />
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Mettre à jour le mot de passe</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section fade-in">
              <h3>Préférences de Notification</h3>
              <div className="notification-settings">
                <div className="toggle-row">
                  <div className="toggle-info">
                    <h4>Nouvelles Inscriptions</h4>
                    <p>M'avertir lorsqu'un nouvel étudiant s'inscrit</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
                <div className="toggle-row">
                  <div className="toggle-info">
                    <h4>Réclamations Urgentes</h4>
                    <p>Alertes immédiates pour les réclamations des parents</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
                <div className="toggle-row">
                  <div className="toggle-info">
                    <h4>Rapports Hebdomadaires</h4>
                    <p>Recevoir un résumé par email chaque semaine</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
              <div className="form-actions" style={{marginTop: '24px'}}>
                  <button className="btn-primary" onClick={() => setSuccessMessage('Préférences sauvegardées')}>Enregistrer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectorySettings;
