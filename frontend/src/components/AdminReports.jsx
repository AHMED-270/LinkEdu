import { useState } from 'react';
import axios from 'axios';
import { FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminReports() {
  const [reportType, setReportType] = useState('attendance');
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setStatusMsg({ type: '', text: '' });
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', { withCredentials: true });

      const res = await axios.post(apiBaseUrl + '/api/admin/reports/generate', {
        type: reportType,
        month: parseInt(month),
        year: parseInt(year)
      }, {
        withCredentials: true,
        headers: { Accept: 'application/json' }
      });

      setStatusMsg({ 
        type: 'success', 
        text: `Succès : ${res.data.message || 'Rapport généré.'} Vous pouvez télécharger le document.` 
      });
      
    } catch (error) {
      console.error('Report error:', error);
      setStatusMsg({ 
        type: 'error', 
        text: 'Erreur lors de la génération du rapport. Veuillez réessayer.' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Animation variants for staggered form fields
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="layout-content">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Générateur de Rapports</h1>
          <p className="text-slate-500 text-sm mt-1">Générez et exportez les rapports statistiques de l'établissement en PDF.</p>
        </div>
      </header>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
        className="card p-8 max-w-2xl mx-auto"
      >
        {/* Animated Icon Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <motion.div 
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm"
          >
            <FileText size={28} className="text-emerald-500" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Nouveau Rapport</h2>
            <p className="text-sm text-slate-500 mt-1">Sélectionnez les paramètres du rapport à compiler.</p>
          </div>
        </div>

        {/* Staggered Form */}
        <motion.form 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleGenerate} 
          className="flex flex-col gap-6"
        >
          <motion.div variants={itemVariants} className="form-group">
            <label className="form-label">Type de rapport</label>
            <select 
              value={reportType} 
              onChange={e => setReportType(e.target.value)} 
              className="form-select"
            >
              <option value="attendance">Assiduité (Absences et Retards)</option>
              <option value="performance">Performances académiques (Notes)</option>
              <option value="financial">Rapport financier détaillé</option>
              <option value="general">Synthèse générale mensuelle</option>
            </select>
          </motion.div>

          <motion.div variants={itemVariants} className="grid-2">
            <div className="form-group">
              <label className="form-label">Mois</label>
              <select 
                value={month} 
                onChange={e => setMonth(e.target.value)} 
                className="form-select"
              >
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
            
            <div className="form-group">
              <label className="form-label">Année</label>
              <input 
                type="number" 
                value={year} 
                onChange={e => setYear(e.target.value)} 
                min="2020" 
                max="2100" 
                className="form-input" 
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-4">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={isGenerating}
              className="btn btn-primary w-full py-3 text-base shadow-[0_8px_20px_rgba(59,130,246,0.25)]"
            >
              {isGenerating ? (
                <>
                  <span className="loading-spinner w-5 h-5 border-white mr-3"></span> 
                  Compilation du document en cours...
                </>
              ) : (
                <>
                  <Download size={20} className="mr-2" /> 
                  Générer le document PDF
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.form>

        {/* Animated Success/Error Message */}
        <AnimatePresence>
          {statusMsg.text && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-6"
            >
              <div className={`p-4 rounded-xl flex items-center gap-3 font-medium text-sm border ${
                statusMsg.type === 'error' 
                  ? 'bg-red-50 text-red-600 border-red-100' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
              }`}>
                {statusMsg.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                {statusMsg.text}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
