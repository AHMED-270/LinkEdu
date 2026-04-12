import React, { useState } from 'react';
import './DirectoryReports.css';

const DirectoryReports = () => {
  const [reportType, setReportType] = useState('assiduite');

  return (
    <div className="directory-reports">
      <div className="reports-header">
        <h2>Rapports et Statistiques</h2>
        <div className="reports-actions">
          <button className="btn-secondary"><i className="fa-solid fa-print"></i> Imprimer</button>
          <button className="btn-primary"><i className="fa-solid fa-download"></i> Exporter PDF</button>
        </div>
      </div>

      <div className="reports-nav">
        <button 
          className={'report-tab ' + (reportType === 'assiduite' ? 'active' : '')}
          onClick={() => setReportType('assiduite')}
        >
          <i className="fa-regular fa-calendar-check"></i> Assiduité
        </button>
        <button 
          className={'report-tab ' + (reportType === 'performance' ? 'active' : '')}
          onClick={() => setReportType('performance')}
        >
          <i className="fa-solid fa-chart-line"></i> Performance
        </button>
        <button 
          className={'report-tab ' + (reportType === 'financier' ? 'active' : '')}
          onClick={() => setReportType('financier')}
        >
          <i className="fa-solid fa-sack-dollar"></i> Financier
        </button>
      </div>

      <div className="reports-content">
        {reportType === 'assiduite' && (
          <div className="report-section fade-in">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon att-present"><i className="fa-solid fa-users"></i></div>
                <div className="stat-details">
                  <h3>Taux de présence</h3>
                  <p className="stat-value">94.5%</p>
                  <span className="stat-trend positive"><i className="fa-solid fa-arrow-up"></i> +2.1% ce mois</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon att-absent"><i className="fa-solid fa-user-xmark"></i></div>
                <div className="stat-details">
                  <h3>Absences totales</h3>
                  <p className="stat-value">142</p>
                  <span className="stat-trend negative"><i className="fa-solid fa-arrow-down"></i> -5% ce mois</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon att-late"><i className="fa-solid fa-clock"></i></div>
                <div className="stat-details">
                  <h3>Retards moyens</h3>
                  <p className="stat-value">12m</p>
                  <span className="stat-trend neutral"><i className="fa-solid fa-minus"></i> Stable</span>
                </div>
              </div>
            </div>

            <div className="chart-container-placeholder">
               <div className="chart-header">
                 <h3>Évolution des absences (Mois dernier)</h3>
                 <select className="chart-filter">
                    <option>Tous les niveaux</option>
                    <option>1ère Année</option>
                    <option>2ème Année</option>
                 </select>
               </div>
               <div className="mock-bar-chart">
                 <div className="bar-group"><div className="bar" style={{height: '60%'}}></div><span>Sem 1</span></div>
                 <div className="bar-group"><div className="bar" style={{height: '40%'}}></div><span>Sem 2</span></div>
                 <div className="bar-group"><div className="bar" style={{height: '80%'}}></div><span>Sem 3</span></div>
                 <div className="bar-group"><div className="bar" style={{height: '30%'}}></div><span>Sem 4</span></div>
                 <div className="bar-group"><div className="bar" style={{height: '50%'}}></div><span>Sem 5</span></div>
               </div>
            </div>
          </div>
        )}

        {reportType === 'performance' && (
          <div className="report-section fade-in">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon perf-avg"><i className="fa-solid fa-graduation-cap"></i></div>
                <div className="stat-details">
                  <h3>Moyenne Générale</h3>
                  <p className="stat-value">14.2/20</p>
                  <span className="stat-trend positive"><i className="fa-solid fa-arrow-up"></i> +0.5 pts</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon perf-success"><i className="fa-solid fa-award"></i></div>
                <div className="stat-details">
                  <h3>Taux de réussite</h3>
                  <p className="stat-value">88%</p>
                  <span className="stat-trend positive"><i className="fa-solid fa-arrow-up"></i> +3%</span>
                </div>
              </div>
            </div>
            <div className="chart-container-placeholder">
               <div className="chart-header">
                 <h3>Répartition des notes moyennes par matière</h3>
               </div>
               <div className="mock-bar-chart">
                 <div className="bar-group"><div className="bar blue" style={{height: '75%'}}></div><span>Maths</span></div>
                 <div className="bar-group"><div className="bar blue" style={{height: '85%'}}></div><span>Physique</span></div>
                 <div className="bar-group"><div className="bar blue" style={{height: '65%'}}></div><span>Français</span></div>
                 <div className="bar-group"><div className="bar blue" style={{height: '90%'}}></div><span>Anglais</span></div>
                 <div className="bar-group"><div className="bar blue" style={{height: '70%'}}></div><span>SVT</span></div>
               </div>
            </div>
          </div>
        )}

        {reportType === 'financier' && (
          <div className="report-section fade-in">
             <div className="empty-state">
                <i className="fa-solid fa-lock" style={{fontSize: '48px', color: '#cbd5e1', marginBottom: '16px'}}></i>
                <h3>Accès Restreint</h3>
                <p>Le module financier est en cours de configuration par l'administrateur système.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryReports;
