import { useState } from 'react';
import axios from 'axios';
import { FileText, Download, CheckCircle } from 'lucide-react';

export default function AdminReports() {
  const [reportType, setReportType] = useState('attendance');
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setSuccessMsg('');
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', { withCredentials: true });

      const res = await axios.post(apiBaseUrl + '/api/admin/reports/generate', {
        type: reportType,
        month: parseInt(month),
        year: parseInt(year)
      }, {
        withCredentials: true,
        headers: { Accept: 'application/json' }
      });

      setSuccessMsg('Succès: ' + res.data.message + ' Vous pouvez télécharger le document.');
      
    } catch (error) {
      console.error('Report error:', error);
      setSuccessMsg('Erreur lors de la génération du rapport.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="dashboard-content">
      <header className="content-header">
        <h1>Générateur de Rapports</h1>
        <p>Générez et exportez les rapports statistiques de l'établissement.</p>
      </header>

      <div className="card-panel" style={{ maxWidth: '600px' }}>
        <div className="stat-icon-wrapper bg-emerald-light" style={{ marginBottom: '20px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
          <FileText size={24} className="text-emerald" style={{ color: '#10b981' }} />
        </div>
        
        <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Nouveau Rapport</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Sélectionnez les paramètres du rapport que vous souhaitez compiler.</p>

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '500', color: '#475569' }}>Type de rapport</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
              <option value="attendance">Assiduité (Absences)</option>
              <option value="performance">Performances académiques (Notes)</option>
              <option value="financial">Rapport financier</option>
              <option value="general">Synthèse générale mensuelle</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1' }}>
              <label style={{ fontWeight: '500', color: '#475569' }}>Mois</label>
              <select value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                <option value="1">Janvier</option>
                <option value="2">Février</option>
                <option value="3">Mars</option>
                <option value="4">Avril</option>
                <option value="5">Mai</option>
                <option value="6">Juin</option>
                <option value="7">Juillet</option>
                <option value="8">Août</option>
                <option value="9">Septembre</option>
                <option value="10">Octobre</option>
                <option value="11">Novembre</option>
                <option value="12">Décembre</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1' }}>
              <label style={{ fontWeight: '500', color: '#475569' }}>Année</label>
              <input type="number" value={year} onChange={e => setYear(e.target.value)} min="2020" max="2100" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isGenerating}
            style={{ 
              marginTop: '12px', background: '#0f172a', color: 'white', padding: '14px', borderRadius: '8px', 
              border: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: isGenerating ? 'not-allowed' : 'pointer', opacity: isGenerating ? 0.7 : 1
            }}
          >
            {isGenerating ? 'Compilation en cours...' : <><Download size={18} /> Générer le document PDF</>}
          </button>
        </form>

        {successMsg && (
          <div style={{ marginTop: '24px', padding: '16px', background: successMsg.includes('Erreur') ? '#fef2f2' : '#ecfdf5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', color: successMsg.includes('Erreur') ? '#ef4444' : '#059669', fontWeight: '500' }}>
             {!successMsg.includes('Erreur') && <CheckCircle size={24} />}
             {successMsg}
          </div>
        )}
      </div>
    </div>
  );
}
